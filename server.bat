@echo off
echo ====================================
echo  NutriAx Pro - Servidor Local
echo ====================================
echo.
echo Iniciando servidor em http://localhost:8080
echo Pressione Ctrl+C para parar o servidor.
echo.

cd /d "%~dp0"

:: Tenta Python 3
python -m http.server 8080 2>nul
if %errorlevel% neq 0 (
  :: Tenta Python 2
  python -m SimpleHTTPServer 8080 2>nul
  if %errorlevel% neq 0 (
    echo ERRO: Python nao encontrado!
    echo Instale Python em https://www.python.org/downloads/
    echo.
    pause
  )
)
