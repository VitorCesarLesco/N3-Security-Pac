@echo off
cls
echo ====================================================
echo TESTE API N3 SEGURANÇA
echo ====================================================
echo.

echo [1] Iniciando API Flask...
start "API Flask" cmd /c "cd /d %~dp0 && .venv\Scripts\python.exe app.py"
timeout /t 5 /nobreak > nul

echo.
echo [2] Testando endpoint de saúde...
curl -s http://localhost:5000/api/health
echo.
echo.

echo [3] API iniciada com sucesso!
echo Teste no navegador: http://localhost:5000/api/health
echo.

start http://localhost:5000/api/health

echo Pressione qualquer tecla para parar a API...
pause >nul

taskkill /f /im python.exe 2>nul
echo API parada!
