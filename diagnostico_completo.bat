@echo off
cls
echo ====================================================
echo DIAGNÓSTICO COMPLETO - SISTEMA N3 SEGURANÇA
echo ====================================================
echo.

echo [1] Verificando dependências...
echo.
echo ✅ Verificando Java...
java -version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Java não encontrado!
    goto end
) else (
    echo ✅ Java OK
)

echo.
echo ✅ Verificando Python...
python --version 2>nul
if %errorlevel% neq 0 (
    echo ❌ Python não encontrado!
    goto end
) else (
    echo ✅ Python OK
)

echo.
echo ✅ Verificando ambiente virtual...
if exist ".venv\Scripts\python.exe" (
    echo ✅ Ambiente virtual OK
) else (
    echo ❌ Ambiente virtual não encontrado
    goto end
)

echo.
echo ✅ Verificando arquivos...
if exist "app.py" (
    echo ✅ API (app.py) OK
) else (
    echo ❌ API não encontrada
    goto end
)

if exist "static\index.html" (
    echo ✅ Frontend OK
) else (
    echo ❌ Frontend não encontrado
    goto end
)

if exist "keycloak\bin\kc.bat" (
    echo ✅ Keycloak OK
) else (
    echo ❌ Keycloak não encontrado
    goto end
)

echo.
echo [2] Testando API...
start "API Test" /min cmd /c "cd /d %~dp0 && .venv\Scripts\python.exe app.py"
timeout /t 5 /nobreak > nul

curl -s http://localhost:5000/api/health 2>nul
if %errorlevel% equ 0 (
    echo ✅ API respondendo
) else (
    echo ❌ API não respondendo
)

echo.
echo [3] Testando Frontend...
start "Frontend Test" /min cmd /c "cd /d %~dp0\static && python -m http.server 3001"
timeout /t 3 /nobreak > nul

curl -s http://localhost:3001 2>nul
if %errorlevel% equ 0 (
    echo ✅ Frontend respondendo
) else (
    echo ❌ Frontend não respondendo
)

echo.
echo [4] Testando Keycloak...
cd keycloak\bin
start "Keycloak Test" /min cmd /c "kc.bat start-dev --http-port=8080"
cd ..\..
timeout /t 15 /nobreak > nul

curl -s http://localhost:8080 2>nul
if %errorlevel% equ 0 (
    echo ✅ Keycloak respondendo
) else (
    echo ❌ Keycloak não respondendo (normal se primeira vez)
)

echo.
echo ====================================================
echo RESULTADO DO DIAGNÓSTICO
echo ====================================================
echo.
echo Se todos os testes passaram, o sistema está pronto!
echo.
echo Próximos passos:
echo 1. Configure o Keycloak (primeira vez)
echo 2. Execute o sistema completo
echo 3. Faça login e teste as funcionalidades
echo.
echo URLs importantes:
echo - Frontend: http://localhost:3001
echo - API: http://localhost:5000/api/health
echo - Keycloak: http://localhost:8080/admin
echo.

:end
echo Pressione qualquer tecla para finalizar...
pause >nul

echo.
echo Parando processos de teste...
taskkill /f /im python.exe 2>nul
taskkill /f /im java.exe 2>nul
echo Diagnóstico concluído!
