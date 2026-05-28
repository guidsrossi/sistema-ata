@echo off
chcp 65001 >nul
title Sistema de Ata de Reunião - Inicialização Automática

echo ==================================================
echo   SISTEMA DE ATA DE REUNIÃO
echo ==================================================
echo.
cd /d "%~dp0"

if not exist "backend" (
    echo ERRO: Pasta backend não encontrada.
    echo Coloque este arquivo .bat dentro da pasta principal do projeto.
    pause
    exit /b
)
if not exist "frontend" (
    echo ERRO: Pasta frontend não encontrada.
    echo Coloque este arquivo .bat dentro da pasta principal do projeto.
    pause
    exit /b
)

echo ==================================================
echo   1. VERIFICANDO NODE.JS
echo ==================================================
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo Node.js não encontrado. Tentando instalar via winget...
    winget --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERRO: winget não está disponível. Instale manualmente: https://nodejs.org
        pause
        exit /b
    )
    winget install OpenJS.NodeJS.LTS -e --accept-source-agreements --accept-package-agreements
    echo Node.js instalado. Feche esta janela e execute novamente.
    pause
    exit /b
) else (
    echo Node.js encontrado:
    node -v
)

echo.
echo ==================================================
echo   2. VERIFICANDO NPM
echo ==================================================
npm -v >nul 2>&1
if %errorlevel% neq 0 (
    echo ERRO: npm não encontrado. Reinstale o Node.js LTS.
    pause
    exit /b
) else (
    echo npm encontrado:
    npm -v
)

echo.
echo ==================================================
echo   3. VERIFICANDO OLLAMA
echo ==================================================
ollama --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama não encontrado. Tentando instalar via winget...
    winget --version >nul 2>&1
    if %errorlevel% neq 0 (
        echo ERRO: winget não está disponível. Instale manualmente: https://ollama.com/download
        pause
        exit /b
    )
    winget install Ollama.Ollama -e --accept-source-agreements --accept-package-agreements
    echo Ollama instalado. Feche esta janela e execute novamente.
    pause
    exit /b
) else (
    echo Ollama encontrado.
)

echo.
echo ==================================================
echo   4. INICIANDO OLLAMA
echo ==================================================
curl http://localhost:11434 >nul 2>&1
if %errorlevel% neq 0 (
    echo Ollama não está rodando. Iniciando Ollama...
    start "Ollama" /min cmd /k "ollama serve"
    timeout /t 8 /nobreak >nul
) else (
    echo Ollama já está rodando.
)

echo.
echo ==================================================
echo   5. VERIFICANDO MODELO DE IA
echo ==================================================
ollama list | findstr /i "llama3.1:8b" >nul 2>&1
if %errorlevel% neq 0 (
    echo Modelo llama3.1:8b não encontrado. Baixando...
    echo Isso pode demorar bastante na primeira vez.
    ollama pull llama3.1:8b
    if %errorlevel% neq 0 (
        echo ERRO: Não foi possível baixar o modelo. Verifique sua internet.
        pause
        exit /b
    )
) else (
    echo Modelo llama3.1:8b encontrado.
)

echo.
echo ==================================================
echo   6. INSTALANDO DEPENDÊNCIAS DO BACKEND
echo ==================================================
cd /d "%~dp0backend"
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ERRO ao instalar dependências do backend.
        pause
        exit /b
    )
) else (
    echo Dependências do backend já instaladas.
)

echo.
echo ==================================================
echo   7. INSTALANDO DEPENDÊNCIAS DO FRONTEND
echo ==================================================
cd /d "%~dp0frontend"
if not exist "node_modules" (
    npm install
    if %errorlevel% neq 0 (
        echo ERRO ao instalar dependências do frontend.
        pause
        exit /b
    )
) else (
    echo Dependências do frontend já instaladas.
)

echo.
echo ==================================================
echo   8. INICIANDO BACKEND E FRONTEND
echo ==================================================
start "Backend - Sistema de Ata" cmd /k "cd /d "%~dp0backend" && npm run dev"
timeout /t 3 /nobreak >nul
start "Frontend - Sistema de Ata" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 8 /nobreak >nul
start http://localhost:5173

echo.
echo ==================================================
echo   SISTEMA INICIADO COM SUCESSO
echo ==================================================
echo Não feche as janelas do Backend e Frontend enquanto estiver usando.
echo.
pause
