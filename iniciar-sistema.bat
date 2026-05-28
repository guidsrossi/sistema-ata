@echo off
setlocal
chcp 65001 >nul
title Sistema de Ata de Reuniao - Inicializacao Automatica

echo ==================================================
echo   SISTEMA DE ATA DE REUNIAO
echo ==================================================
echo.

cd /d "%~dp0"

if not exist "backend" (
    echo ERRO: Pasta backend nao encontrada.
    echo Coloque este arquivo .bat dentro da pasta principal do projeto.
    echo.
    pause
    exit /b 1
)

if not exist "frontend" (
    echo ERRO: Pasta frontend nao encontrada.
    echo Coloque este arquivo .bat dentro da pasta principal do projeto.
    echo.
    pause
    exit /b 1
)

echo ==================================================
echo   1. VERIFICANDO NODE.JS
echo ==================================================
where node >nul 2>&1
if errorlevel 1 (
    echo Node.js nao encontrado. Tentando instalar via winget...
    where winget >nul 2>&1
    if errorlevel 1 (
        echo ERRO: winget nao esta disponivel. Instale manualmente: https://nodejs.org
        echo.
        pause
        exit /b 1
    )

    winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo ERRO: Nao foi possivel instalar o Node.js automaticamente.
        echo Instale manualmente: https://nodejs.org
        echo.
        pause
        exit /b 1
    )

    echo Node.js instalado. Feche esta janela e execute novamente.
    echo.
    pause
    exit /b 0
) else (
    echo Node.js encontrado:
    node -v
)

echo.
echo ==================================================
echo   2. VERIFICANDO NPM
echo ==================================================
where npm >nul 2>&1
if errorlevel 1 (
    echo ERRO: npm nao encontrado. Reinstale o Node.js LTS.
    echo.
    pause
    exit /b 1
) else (
    echo npm encontrado:
    call npm -v
)

echo.
echo ==================================================
echo   3. VERIFICANDO OLLAMA
echo ==================================================
where ollama >nul 2>&1
if errorlevel 1 (
    echo Ollama nao encontrado. Tentando instalar via winget...
    where winget >nul 2>&1
    if errorlevel 1 (
        echo ERRO: winget nao esta disponivel. Instale manualmente: https://ollama.com/download
        echo.
        pause
        exit /b 1
    )

    winget install Ollama.Ollama -e --accept-source-agreements --accept-package-agreements
    if errorlevel 1 (
        echo ERRO: Nao foi possivel instalar o Ollama automaticamente.
        echo Instale manualmente: https://ollama.com/download
        echo.
        pause
        exit /b 1
    )

    echo Ollama instalado. Feche esta janela e execute novamente.
    echo.
    pause
    exit /b 0
) else (
    echo Ollama encontrado.
)

echo.
echo ==================================================
echo   4. INICIANDO OLLAMA
echo ==================================================
curl -s http://localhost:11434 >nul 2>&1
if errorlevel 1 (
    echo Ollama nao esta rodando. Iniciando Ollama...
    start "Ollama" /min cmd /k "ollama serve"
    timeout /t 8 /nobreak >nul
) else (
    echo Ollama ja esta rodando.
)

echo.
echo ==================================================
echo   5. VERIFICANDO MODELO DE IA
echo ==================================================
ollama list | findstr /i /c:"llama3.1:8b" >nul 2>&1
if errorlevel 1 (
    echo Modelo llama3.1:8b nao encontrado. Baixando...
    echo Isso pode demorar bastante na primeira vez.
    ollama pull llama3.1:8b
    if errorlevel 1 (
        echo ERRO: Nao foi possivel baixar o modelo. Verifique sua internet.
        echo.
        pause
        exit /b 1
    )
) else (
    echo Modelo llama3.1:8b encontrado.
)

echo.
echo ==================================================
echo   6. INSTALANDO DEPENDENCIAS DO BACKEND
echo ==================================================
cd /d "%~dp0backend"
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do backend.
        echo.
        pause
        exit /b 1
    )
) else (
    echo Dependencias do backend ja instaladas.
)

echo.
echo ==================================================
echo   7. INSTALANDO DEPENDENCIAS DO FRONTEND
echo ==================================================
cd /d "%~dp0frontend"
if not exist "node_modules" (
    call npm install
    if errorlevel 1 (
        echo ERRO ao instalar dependencias do frontend.
        echo.
        pause
        exit /b 1
    )
) else (
    echo Dependencias do frontend ja instaladas.
)

echo.
echo ==================================================
echo   8. INICIANDO BACKEND E FRONTEND
echo ==================================================
start "Backend - Sistema de Ata" cmd /k "cd /d ""%~dp0backend"" && call npm run dev"
timeout /t 3 /nobreak >nul

start "Frontend - Sistema de Ata" cmd /k "cd /d ""%~dp0frontend"" && call npm run dev"
timeout /t 8 /nobreak >nul

start "" "http://localhost:5173"

echo.
echo ==================================================
echo   SISTEMA INICIADO COM SUCESSO
echo ==================================================
echo Nao feche as janelas do Backend e Frontend enquanto estiver usando.
echo.
pause
