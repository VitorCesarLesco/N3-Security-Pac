# Sistema N3 Segurança - Gerenciamento de Usuários com Keycloak

## 📋 Descrição
Sistema completo de gerenciamento de usuários integrado com Keycloak para autenticação e autorização.

## 🚀 Como Usar

### 1. Inicialização
```bash
menu_principal.bat
```

### 2. Primeira Configuração
Escolha a opção 1 no menu para configuração inicial completa.

### 3. Configuração do Keycloak
1. Acesse: http://localhost:8080
2. Crie conta admin (admin/admin)
3. Configure realm: `n3-security`
4. Configure client: `n3-app`
5. Crie usuário: `testuser/123456`

### 4. Teste do Sistema
1. Acesse: http://localhost:3001
2. Login com: `testuser/123456`
3. Teste as funcionalidades CRUD

## 📁 Estrutura

```
N3 Segurança/
├── app.py                           # API Flask
├── requirements.txt                 # Dependências
├── .env                            # Configurações
├── menu_principal.bat              # Menu principal
├── iniciar_sistema_completo.bat    # Inicialização
├── start_keycloak_no_spaces.bat    # Keycloak
├── teste_api.bat                   # Teste API
├── diagnostico_completo.bat        # Diagnóstico
├── static/                         # Frontend
│   ├── index.html
│   ├── app.js
│   └── styles.css
└── keycloak/                       # Servidor Keycloak
```

## 🔧 Pré-requisitos
- Java 11+
- Python 3.8+

## 📊 Funcionalidades
- ✅ Autenticação JWT com Keycloak
- ✅ Autorização baseada em roles
- ✅ CRUD completo de usuários
- ✅ Interface web moderna
- ✅ API RESTful

## 🌐 URLs
- **Frontend:** http://localhost:3001
- **API:** http://localhost:5000
- **Keycloak:** http://localhost:8080

## 👥 Credenciais
- **Keycloak Admin:** admin/admin
- **Usuário Teste:** testuser/123456


É assim mesmo que deveria funcionar! O Keycloak gerencia quem pode acessar, e a aplicação gerencia seus próprios dados.