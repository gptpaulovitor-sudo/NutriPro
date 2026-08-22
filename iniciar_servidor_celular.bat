@echo off
title NutriAx Pro - Servidor Mobile & Celular
cd /d "%~dp0"
cls
echo =======================================================
echo    NutriAx Pro — Inicializando Servidor para Celular
echo =======================================================
echo.

:: Tenta executar o servidor inteligente em Python
python server_mobile.py
if %errorlevel% neq 0 (
    echo.
    echo [AVISO] Tentando modo padrao python -m http.server...
    python -m http.server 8080
    if %errorlevel% neq 0 (
        echo.
        echo ERRO: Python nao encontrado!
        echo Instale Python ou execute atraves do Node.js.
        echo.
        pause
    )
)
