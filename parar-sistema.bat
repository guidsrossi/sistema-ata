@echo off
chcp 65001 >nul
title Parando Sistema de Ata
echo Parando processos Node.js...
taskkill /F /IM node.exe
echo.
echo Sistema parado.
echo Observação: o Ollama pode continuar rodando em segundo plano.
pause
