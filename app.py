import os
import jwt
import requests
from functools import wraps
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from keycloak import KeycloakOpenID
import json

# Carregar variáveis de ambiente
load_dotenv()

app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')

# Configuração CORS mais específica
CORS(app, origins=['http://localhost:3001', 'http://127.0.0.1:3001'], 
     allow_headers=['Content-Type', 'Authorization'],
     methods=['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'])

# Configuração do Keycloak
# Para client público, não usamos client_secret_key
client_secret = os.getenv('KEYCLOAK_CLIENT_SECRET')
if client_secret:
    # Client confidencial (com secret)
    keycloak_openid = KeycloakOpenID(
        server_url=os.getenv('KEYCLOAK_SERVER_URL', 'http://localhost:8080'),
        client_id=os.getenv('KEYCLOAK_CLIENT_ID', 'n3-app'),
        realm_name=os.getenv('KEYCLOAK_REALM', 'n3-security'),
        client_secret_key=client_secret
    )
else:
    # Client público (sem secret)
    keycloak_openid = KeycloakOpenID(
        server_url=os.getenv('KEYCLOAK_SERVER_URL', 'http://localhost:8080'),
        client_id=os.getenv('KEYCLOAK_CLIENT_ID', 'n3-app'),
        realm_name=os.getenv('KEYCLOAK_REALM', 'n3-security')
    )

# Simulação de banco de dados em memória
users_db = [
    {"id": 1, "name": "João Silva", "email": "joao@email.com", "role": "admin"},
    {"id": 2, "name": "Maria Santos", "email": "maria@email.com", "role": "user"}
]

def verify_token(required_role=None):
    """Decorator para verificar token JWT e role"""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            token = request.headers.get('Authorization')
            
            if not token:
                return jsonify({'error': 'Token não fornecido'}), 401
            
            try:
                # Remove 'Bearer ' do token
                if token.startswith('Bearer '):
                    token = token[7:]
                
                # Decodifica o token sem verificação (para desenvolvimento)
                # Em produção, você deveria verificar a assinatura
                token_info = jwt.decode(token, options={"verify_signature": False})
                
                # Verifica se a role necessária está presente
                if required_role:
                    client_roles = token_info.get('resource_access', {}).get(os.getenv('KEYCLOAK_CLIENT_ID'), {}).get('roles', [])
                    realm_roles = token_info.get('realm_access', {}).get('roles', [])
                    all_roles = client_roles + realm_roles
                    
                    if required_role not in all_roles:
                        return jsonify({'error': f'Role {required_role} necessária'}), 403
                
                # Adiciona informações do usuário ao request
                request.user_info = token_info
                request.user_roles = client_roles + realm_roles
                
                return f(*args, **kwargs)
                
            except Exception as e:
                return jsonify({'error': 'Token inválido', 'details': str(e)}), 401
        
        return decorated_function
    return decorator

# Rotas da API

@app.route('/api/health', methods=['GET'])
def health_check():
    """Endpoint de verificação de saúde da API"""
    return jsonify({'status': 'API funcionando', 'service': 'N3 Security API'})

@app.route('/api/users', methods=['GET'])
@verify_token(required_role='read_users')
def get_users():
    """GET - Listar todos os usuários (requer role: read_users)"""
    return jsonify({
        'users': users_db,
        'total': len(users_db),
        'authenticated_user': request.user_info.get('preferred_username')
    })

@app.route('/api/users/<int:user_id>', methods=['GET'])
@verify_token(required_role='read_users')
def get_user(user_id):
    """GET - Obter usuário específico (requer role: read_users)"""
    user = next((u for u in users_db if u['id'] == user_id), None)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    return jsonify({'user': user})

@app.route('/api/users', methods=['POST'])
@verify_token(required_role='create_users')
def create_user():
    """POST - Criar novo usuário (requer role: create_users)"""
    data = request.get_json()
    
    if not data or not all(key in data for key in ['name', 'email']):
        return jsonify({'error': 'Nome e email são obrigatórios'}), 400
    
    # Gera novo ID
    new_id = max([u['id'] for u in users_db], default=0) + 1
    
    new_user = {
        'id': new_id,
        'name': data['name'],
        'email': data['email'],
        'role': data.get('role', 'user')
    }
    
    users_db.append(new_user)
    
    return jsonify({
        'message': 'Usuário criado com sucesso',
        'user': new_user,
        'created_by': request.user_info.get('preferred_username')
    }), 201

@app.route('/api/users/<int:user_id>', methods=['PUT'])
@verify_token(required_role='update_users')
def update_user(user_id):
    """PUT - Atualizar usuário (requer role: update_users)"""
    data = request.get_json()
    
    if not data:
        return jsonify({'error': 'Dados não fornecidos'}), 400
    
    user = next((u for u in users_db if u['id'] == user_id), None)
    if not user:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    # Atualiza apenas os campos fornecidos
    if 'name' in data:
        user['name'] = data['name']
    if 'email' in data:
        user['email'] = data['email']
    if 'role' in data:
        user['role'] = data['role']
    
    return jsonify({
        'message': 'Usuário atualizado com sucesso',
        'user': user,
        'updated_by': request.user_info.get('preferred_username')
    })

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
@verify_token(required_role='delete_users')
def delete_user(user_id):
    """DELETE - Deletar usuário (requer role: delete_users)"""
    user_index = next((i for i, u in enumerate(users_db) if u['id'] == user_id), None)
    
    if user_index is None:
        return jsonify({'error': 'Usuário não encontrado'}), 404
    
    deleted_user = users_db.pop(user_index)
    
    return jsonify({
        'message': 'Usuário deletado com sucesso',
        'deleted_user': deleted_user,
        'deleted_by': request.user_info.get('preferred_username')
    })

@app.route('/api/auth/verify', methods=['POST'])
def verify_auth():
    """Verificar token de autenticação"""
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'error': 'Token não fornecido'}), 401
    
    try:
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decodifica o token sem verificação (para desenvolvimento)
        token_info = jwt.decode(token, options={"verify_signature": False})
        
        client_roles = token_info.get('resource_access', {}).get(os.getenv('KEYCLOAK_CLIENT_ID'), {}).get('roles', [])
        realm_roles = token_info.get('realm_access', {}).get('roles', [])
        
        return jsonify({
            'valid': True,
            'user': {
                'preferred_username': token_info.get('preferred_username'),
                'email': token_info.get('email'),
                'name': token_info.get('name')
            },
            'roles': {
                'client_roles': client_roles,
                'realm_roles': realm_roles,
                'all_roles': client_roles + realm_roles
            }
        })
        
    except Exception as e:
        return jsonify({'valid': False, 'error': str(e)}), 401

if __name__ == '__main__':
    port = int(os.getenv('API_PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
