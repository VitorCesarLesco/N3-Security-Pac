@echo off
title Keycloak Server - Sem Espaços
cls
echo ====================================================
echo KEYCLOAK - SOLUCAO DEFINITIVA SEM ESPACOS
echo ====================================================
echo.

echo [1] Parando processos Java...
taskkill /f /im java.exe 2>nul

echo.
echo [2] Verificando se precisa copiar Keycloak...
if not exist "C:\KC_N3" (
    echo Criando diretório sem espaços...
    mkdir "C:\KC_N3"
    
    echo Copiando Keycloak... (pode demorar)
    xcopy "%~dp0keycloak\*" "C:\KC_N3\" /E /I /Y /Q
    
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao copiar Keycloak
        pause
        exit /b 1
    )
    echo [OK] Keycloak copiado para C:\KC_N3
) else (
    echo [OK] Keycloak já existe em C:\KC_N3
)

echo.
echo [3] Configurando ambiente...
set "KEYCLOAK_ADMIN=admin"
set "KEYCLOAK_ADMIN_PASSWORD=admin"

REM Não definir JAVA_HOME - deixar o Keycloak usar o Java do PATH
echo Usando Java do PATH (sem JAVA_HOME)

echo.
echo [4] Navegando para o diretório...
cd /d "C:\KC_N3\bin"
if %errorlevel% neq 0 (
    echo [ERRO] Não foi possível acessar C:\KC_N3\bin
    pause
    exit /b 1
)

echo.
echo [5] Iniciando Keycloak...
echo IMPORTANTE: Mantenha esta janela aberta!
echo.
echo Aguarde a mensagem: "Keycloak X.X.X on JVM started"
echo Depois acesse: http://localhost:8080
echo Credenciais: admin / admin
echo.

REM Executa o Keycloak
call kc.bat start-dev

echo.
echo Keycloak foi encerrado.
pause
