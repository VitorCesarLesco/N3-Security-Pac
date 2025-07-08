@echo off
cls
echo ====================================================
echo SISTEMA N3 SEGURANÇA - INICIALIZAÇÃO COMPLETA
echo ====================================================
echo.

echo [1] Verificando dependências...
echo Verificando Java...
java -version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Java não encontrado!
    pause
    exit /b 1
)
echo [OK] Java instalado

echo.
echo Verificando Python...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] Python não encontrado!
    pause
    exit /b 1
)
echo [OK] Python instalado

echo.
echo [2] Iniciando Keycloak...
echo IMPORTANTE: Uma nova janela será aberta para o Keycloak
echo NÃO FECHE a janela do Keycloak!
start "Keycloak Server" cmd /c "%~dp0keycloak_simples.bat"

echo Aguardando Keycloak inicializar...
echo Isso pode demorar alguns minutos na primeira vez...
timeout /t 15 /nobreak > nul

echo.
echo [3] Iniciando API Flask...
start "API Flask" cmd /c "cd /d %~dp0 && .venv\Scripts\python.exe app.py"
timeout /t 3 /nobreak > nul

echo.
echo [4] Iniciando Frontend...
start "Frontend" cmd /c "cd /d %~dp0\static && python -m http.server 3001"
timeout /t 3 /nobreak > nul

echo.
echo ====================================================
echo SISTEMA INICIADO COM SUCESSO!
echo ====================================================
echo.
echo URLs do sistema:
echo - Frontend: http://localhost:3001
echo - API: http://localhost:5000/api/health
echo - Keycloak Admin: http://localhost:8080/admin
echo.
echo CONFIGURAÇÃO NECESSÁRIA NO KEYCLOAK:
echo 1. Acesse: http://localhost:8080/admin
echo 2. Crie conta admin na primeira vez
echo 3. Crie realm: n3-security
echo 4. Crie client: n3-app (público)
echo 5. Crie roles: read_users, create_users, update_users, delete_users
echo 6. Crie usuário e atribua roles
echo.

start http://localhost:8080/admin
timeout /t 2 /nobreak > nul
start http://localhost:3001

echo Pressione qualquer tecla para parar o sistema...
pause >nul

echo.
echo Parando sistema...
taskkill /f /im python.exe 2>nul
taskkill /f /im java.exe 2>nul

echo Sistema parado!
