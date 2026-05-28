# Sistema de Ata de Reunião com IA Local (Ollama)

Use o arquivo `iniciar-sistema.bat` para rodar o sistema no Windows.

## Primeira execução

1. Extraia o ZIP.
2. Entre na pasta `sistema-ata-reuniao-final`.
3. Dê dois cliques em `iniciar-sistema.bat`.

Na primeira vez ele tenta instalar/verificar Node.js, npm, Ollama, baixar o modelo `llama3.1:8b`, instalar dependências do backend e frontend, iniciar tudo e abrir `http://localhost:5173`.

Se ele instalar Node.js ou Ollama, feche a janela e rode o `.bat` novamente.

## Manual

Backend:
```bash
cd backend
npm install
npm run dev
```

Frontend:
```bash
cd frontend
npm install
npm run dev
```

Ollama:
```bash
ollama pull llama3.1:8b
```

Use no Google Chrome para a transcrição.
