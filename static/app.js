// Configuração do Keycloak
const keycloakConfig = {
    url: 'http://localhost:8080',
    realm: 'n3-security',
    clientId: 'n3-app'
};

// Configuração da API
const API_BASE_URL = 'http://localhost:5000/api';

// Variáveis globais
let keycloak;
let currentUser = null;
let userRoles = [];
let editingUserId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', async function() {
    console.log('Iniciando aplicação...');
    
    try {
        await initKeycloak();
        initEventListeners();
        
        // Só carrega dados se usuário estiver logado
        if (keycloak && keycloak.authenticated) {
            console.log('Usuário autenticado, carregando dados...');
            await loadUserPermissions();
            await loadUsers();
        } else {
            console.log('Usuário não autenticado');
            showLoginInterface();
        }
    } catch (error) {
        console.error('Erro na inicialização:', error);
        showMessage('Erro', `Falha ao inicializar: ${error.message}`, 'error');
    }
});

// Inicializar Keycloak
async function initKeycloak() {
    return new Promise((resolve, reject) => {
        try {
            console.log('Criando instância do Keycloak...');
            keycloak = new Keycloak(keycloakConfig);
            
            // Configurações de inicialização
            const initOptions = {
                onLoad: 'check-sso',
                checkLoginIframe: false,
                pkceMethod: 'S256'
            };
            
            console.log('Inicializando Keycloak...');
            
            keycloak.init(initOptions)
                .then(authenticated => {
                    console.log('Keycloak inicializado. Autenticado:', authenticated);
                    
                    if (authenticated) {
                        currentUser = keycloak.tokenParsed;
                        console.log('Usuário logado:', currentUser.preferred_username);
                        updateUserInfo();
                        
                        // Configura renovação automática do token
                        setInterval(() => {
                            keycloak.updateToken(70).then(refreshed => {
                                if (refreshed) {
                                    console.log('Token renovado');
                                }
                            }).catch(error => {
                                console.error('Erro ao renovar token:', error);
                            });
                        }, 60000);
                    }
                    
                    resolve();
                })
                .catch(error => {
                    console.error('Erro ao inicializar Keycloak:', error);
                    resolve(); // Não rejeita para permitir que a aplicação continue
                });
                
        } catch (error) {
            console.error('Erro fatal na inicialização do Keycloak:', error);
            resolve(); // Não rejeita para permitir que a aplicação continue
        }
    });
}

// Atualizar informações do usuário na interface
function updateUserInfo() {
    const userInfoElement = document.getElementById('user-info');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (keycloak && keycloak.authenticated && currentUser) {
        userInfoElement.textContent = `Bem-vindo, ${currentUser.preferred_username || currentUser.name}`;
        if (loginBtn) loginBtn.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'inline-block';
    } else {
        userInfoElement.textContent = '';
        if (loginBtn) loginBtn.style.display = 'inline-block';
        if (logoutBtn) logoutBtn.style.display = 'none';
    }
}

// Mostrar interface de login (quando não autenticado)
function showLoginInterface() {
    // Limpa listas de usuários e permissões
    const usersContainer = document.getElementById('users-list');
    const permissionsContainer = document.getElementById('permissions-list');
    
    usersContainer.innerHTML = '<div class="alert alert-info">Faça login para visualizar os usuários.</div>';
    permissionsContainer.innerHTML = '<div class="alert alert-info">Faça login para ver suas permissões.</div>';
    
    // Esconde formulário
    const formSection = document.querySelector('.form-section');
    if (formSection) {
        formSection.style.display = 'none';
    }
}

// Inicializar event listeners
function initEventListeners() {
    // Login
    const loginBtn = document.getElementById('login-btn');
    if (loginBtn) {
        loginBtn.addEventListener('click', () => {
            if (keycloak) {
                console.log('Iniciando login...');
                keycloak.login({
                    redirectUri: window.location.origin + window.location.pathname
                });
            } else {
                showMessage('Erro', 'Keycloak não inicializado. Recarregue a página.', 'error');
            }
        });
    }
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            keycloak.logout();
        });
    }

    // Formulário de usuário
    document.getElementById('user-form').addEventListener('submit', handleFormSubmit);
    document.getElementById('cancel-btn').addEventListener('click', cancelEdit);
    document.getElementById('refresh-btn').addEventListener('click', loadUsers);

    // Modal
    document.querySelector('.close').addEventListener('click', closeModal);
    document.getElementById('message-modal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('message-modal')) {
            closeModal();
        }
    });
}

// Fazer requisição autenticada
async function authenticatedFetch(url, options = {}) {
    console.log('authenticatedFetch: Iniciando requisição para:', url);
    
    try {
        console.log('authenticatedFetch: Atualizando token...');
        await keycloak.updateToken(30);
        
        console.log('authenticatedFetch: Token válido, fazendo requisição...');
        
        const headers = {
            'Authorization': `Bearer ${keycloak.token}`,
            'Content-Type': 'application/json',
            ...options.headers
        };

        console.log('authenticatedFetch: Headers:', headers);

        const response = await fetch(url, {
            ...options,
            headers
        });

        console.log('authenticatedFetch: Status da resposta:', response.status);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('authenticatedFetch: Erro na resposta:', errorData);
            throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('authenticatedFetch: Dados recebidos:', data);
        return data;
    } catch (error) {
        console.error('authenticatedFetch: Erro na requisição:', error);
        throw error;
    }
}

// Carregar permissões do usuário
async function loadUserPermissions() {
    console.log('loadUserPermissions: Iniciando...');
    
    try {
        console.log('loadUserPermissions: Fazendo requisição para API...');
        const response = await authenticatedFetch(`${API_BASE_URL}/auth/verify`, {
            method: 'POST'
        });

        console.log('loadUserPermissions: Resposta da API:', response);
        
        if (response && response.roles && response.roles.all_roles) {
            userRoles = response.roles.all_roles;
            console.log('loadUserPermissions: Roles carregadas:', userRoles);
            
            updatePermissionsDisplay();
            updateFormVisibility();
        } else {
            console.error('loadUserPermissions: Resposta da API inválida:', response);
            showMessage('Erro', 'Resposta inválida da API de permissões', 'error');
        }
    } catch (error) {
        console.error('loadUserPermissions: Erro ao carregar permissões:', error);
        showMessage('Erro', `Falha ao carregar permissões do usuário: ${error.message}`, 'error');
    }
}

// Atualizar exibição de permissões
function updatePermissionsDisplay() {
    const permissionsContainer = document.getElementById('permissions-list');
    const permissions = [
        { name: 'Visualizar Usuários', role: 'read_users', description: 'Permite visualizar a lista de usuários' },
        { name: 'Criar Usuários', role: 'create_users', description: 'Permite criar novos usuários' },
        { name: 'Editar Usuários', role: 'update_users', description: 'Permite editar usuários existentes' },
        { name: 'Excluir Usuários', role: 'delete_users', description: 'Permite excluir usuários' }
    ];

    permissionsContainer.innerHTML = permissions.map(permission => {
        const hasPermission = userRoles.includes(permission.role);
        return `
            <div class="permission-card ${hasPermission ? 'granted' : 'denied'}">
                <h4>${permission.name}</h4>
                <p>${permission.description}</p>
                <span class="permission-status ${hasPermission ? 'granted' : 'denied'}">
                    ${hasPermission ? 'Permitido' : 'Negado'}
                </span>
            </div>
        `;
    }).join('');
}

// Atualizar visibilidade do formulário baseado nas permissões
function updateFormVisibility() {
    const formSection = document.querySelector('.form-section');
    const hasCreatePermission = userRoles.includes('create_users');
    const hasUpdatePermission = userRoles.includes('update_users');
    
    if (!hasCreatePermission && !hasUpdatePermission) {
        formSection.style.display = 'none';
    } else {
        formSection.style.display = 'block';
    }
}

// Carregar lista de usuários
async function loadUsers() {
    if (!userRoles.includes('read_users')) {
        document.getElementById('users-list').innerHTML = 
            '<div class="alert alert-warning">Você não tem permissão para visualizar usuários.</div>';
        return;
    }

    showLoading(true);
    
    try {
        const response = await authenticatedFetch(`${API_BASE_URL}/users`);
        displayUsers(response.users);
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        document.getElementById('users-list').innerHTML = 
            `<div class="alert alert-error">Erro ao carregar usuários: ${error.message}</div>`;
    } finally {
        showLoading(false);
    }
}

// Exibir usuários na interface
function displayUsers(users) {
    const usersContainer = document.getElementById('users-list');
    
    if (users.length === 0) {
        usersContainer.innerHTML = '<div class="alert alert-warning">Nenhum usuário encontrado.</div>';
        return;
    }

    usersContainer.innerHTML = users.map(user => `
        <div class="user-card fade-in">
            <h3>${user.name}</h3>
            <p><strong>Email:</strong> ${user.email}</p>
            <span class="user-role ${user.role}">${user.role}</span>
            <div class="user-actions">
                ${userRoles.includes('update_users') ? 
                    `<button class="btn btn-success" onclick="editUser(${user.id})">Editar</button>` : ''
                }
                ${userRoles.includes('delete_users') ? 
                    `<button class="btn btn-danger" onclick="deleteUser(${user.id})">Excluir</button>` : ''
                }
            </div>
        </div>
    `).join('');
}

// Lidar com envio do formulário
async function handleFormSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const userData = {
        name: formData.get('name'),
        email: formData.get('email'),
        role: formData.get('role')
    };

    if (editingUserId) {
        await updateUser(editingUserId, userData);
    } else {
        await createUser(userData);
    }
}

// Criar usuário
async function createUser(userData) {
    if (!userRoles.includes('create_users')) {
        showMessage('Erro', 'Você não tem permissão para criar usuários', 'error');
        return;
    }

    showLoading(true);
    
    try {
        await authenticatedFetch(`${API_BASE_URL}/users`, {
            method: 'POST',
            body: JSON.stringify(userData)
        });
        
        showMessage('Sucesso', 'Usuário criado com sucesso!', 'success');
        clearForm();
        await loadUsers();
    } catch (error) {
        console.error('Erro ao criar usuário:', error);
        showMessage('Erro', `Falha ao criar usuário: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Editar usuário
function editUser(userId) {
    if (!userRoles.includes('update_users')) {
        showMessage('Erro', 'Você não tem permissão para editar usuários', 'error');
        return;
    }

    const userCard = document.querySelector(`[onclick="editUser(${userId})"]`).closest('.user-card');
    const name = userCard.querySelector('h3').textContent;
    const email = userCard.querySelector('p').textContent.replace('Email: ', '');
    const role = userCard.querySelector('.user-role').textContent;

    document.getElementById('user-id').value = userId;
    document.getElementById('name').value = name;
    document.getElementById('email').value = email;
    document.getElementById('role').value = role;
    
    editingUserId = userId;
    
    // Scroll para o formulário
    document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
}

// Atualizar usuário
async function updateUser(userId, userData) {
    showLoading(true);
    
    try {
        await authenticatedFetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        });
        
        showMessage('Sucesso', 'Usuário atualizado com sucesso!', 'success');
        clearForm();
        await loadUsers();
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showMessage('Erro', `Falha ao atualizar usuário: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Excluir usuário
async function deleteUser(userId) {
    if (!userRoles.includes('delete_users')) {
        showMessage('Erro', 'Você não tem permissão para excluir usuários', 'error');
        return;
    }

    if (!confirm('Tem certeza que deseja excluir este usuário?')) {
        return;
    }

    showLoading(true);
    
    try {
        await authenticatedFetch(`${API_BASE_URL}/users/${userId}`, {
            method: 'DELETE'
        });
        
        showMessage('Sucesso', 'Usuário excluído com sucesso!', 'success');
        await loadUsers();
    } catch (error) {
        console.error('Erro ao excluir usuário:', error);
        showMessage('Erro', `Falha ao excluir usuário: ${error.message}`, 'error');
    } finally {
        showLoading(false);
    }
}

// Cancelar edição
function cancelEdit() {
    clearForm();
}

// Limpar formulário
function clearForm() {
    document.getElementById('user-form').reset();
    document.getElementById('user-id').value = '';
    editingUserId = null;
}

// Mostrar/ocultar loading
function showLoading(show) {
    const modal = document.getElementById('loading-modal');
    modal.style.display = show ? 'block' : 'none';
}

// Mostrar mensagem
function showMessage(title, message, type = 'info') {
    const modal = document.getElementById('message-modal');
    const titleElement = document.getElementById('message-title');
    const textElement = document.getElementById('message-text');
    
    titleElement.textContent = title;
    textElement.textContent = message;
    
    // Remover classes anteriores e adicionar nova classe
    modal.className = 'modal';
    if (type) {
        modal.classList.add(`modal-${type}`);
    }
    
    modal.style.display = 'block';
}

// Fechar modal
function closeModal() {
    document.getElementById('message-modal').style.display = 'none';
}

// Atualizar token automaticamente
setInterval(async () => {
    try {
        await keycloak.updateToken(60);
    } catch (error) {
        console.error('Erro ao atualizar token:', error);
        keycloak.login();
    }
}, 30000); // Verifica a cada 30 segundos
