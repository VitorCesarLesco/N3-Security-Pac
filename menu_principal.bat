@echo off
cls
color 0A

:menu
echo ====================================================
echo           SISTEMA N3 SEGURANÇA
echo ====================================================
echo.
echo   🚀 OPÇÕES PRINCIPAIS:
echo   1. INICIAR SISTEMA COMPLETO
echo   2. INICIAR APENAS KEYCLOAK
echo   3. TESTAR API
echo   4. DIAGNÓSTICO COMPLETO
echo.
echo   🔧 FERRAMENTAS:
echo   5. VERIFICAR STATUS
echo   6. PARAR SISTEMA
echo   7. ABRIR NO NAVEGADOR
echo.
echo   0. SAIR
echo.
echo ====================================================

set /p opcao="Escolha uma opção (0-7): "

if "%opcao%"=="1" (
    echo.
    echo 🚀 Iniciando sistema completo...
    call iniciar_sistema_completo.bat
    goto menu
)

if "%opcao%"=="2" (
    echo.
    echo 🔐 Iniciando apenas Keycloak...
    call keycloak_simples.bat
    goto menu
)

if "%opcao%"=="3" (
    echo.
    echo 🧪 Testando API...
    call teste_api.bat
    goto menu
)

if "%opcao%"=="4" (
    echo.
    echo 📊 Executando diagnóstico...
    call diagnostico_completo.bat
    goto menu
)

if "%opcao%"=="5" (
    echo.
    echo 📊 Verificando status...
    echo.
    echo Testando API...
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:5000/api/health' -TimeoutSec 5 -UseBasicParsing | Out-Null; Write-Host '✅ API: Online' } catch { Write-Host '❌ API: Offline' }"
    
    echo.
    echo Testando Keycloak...
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:8080' -TimeoutSec 5 -UseBasicParsing | Out-Null; Write-Host '✅ Keycloak: Online' } catch { Write-Host '❌ Keycloak: Offline' }"
    
    echo.
    echo Testando Frontend...
    powershell -Command "try { Invoke-WebRequest -Uri 'http://localhost:3001' -TimeoutSec 5 -UseBasicParsing | Out-Null; Write-Host '✅ Frontend: Online' } catch { Write-Host '❌ Frontend: Offline' }"
    
    echo.
    pause
    goto menu
)

if "%opcao%"=="6" (
    echo.
    echo 🛑 Parando sistema...
    taskkill /f /im python.exe 2>nul
    taskkill /f /im java.exe 2>nul
    echo Sistema parado!
    pause
    goto menu
)

if "%opcao%"=="7" (
    echo.
    echo 🌐 Abrindo no navegador...
    start http://localhost:3001
    timeout /t 1 /nobreak > nul
    start http://localhost:5000/api/health
    timeout /t 1 /nobreak > nul
    start http://localhost:8080
    goto menu
)

if "%opcao%"=="0" (
    echo.
    echo Saindo...
    exit /b 0
)

echo.
echo ❌ Opção inválida! Tente novamente.
pause
goto menu
