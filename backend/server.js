const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const PORT = process.env.PORT || 3333;
const OLLAMA_URL = process.env.OLLAMA_URL || "http://localhost:11434";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.1:8b";

app.get("/", (req, res) => {
  res.json({ ok: true, message: "Backend do Sistema de Ata rodando." });
});

app.post("/api/gerar-ata", async (req, res) => {
  try {
    const { nomeReuniao, participantes, transcricao } = req.body;
    if (!nomeReuniao || !String(nomeReuniao).trim()) return res.status(400).json({ error: "Informe o nome da reunião." });
    if (!transcricao || !String(transcricao).trim()) return res.status(400).json({ error: "A transcrição está vazia." });

    const participantesTexto = Array.isArray(participantes) ? participantes.join(", ") : "";
    const prompt = `Você é responsável por redigir uma ata de reunião escolar/profissional.

Crie uma ATA EXTENSA, FORMAL, EM TERCEIRA PESSOA e EM TEXTO CORRIDO.

Regras obrigatórias:
- Não copie a transcrição literalmente.
- Interprete o que foi conversado.
- Escreva como uma pessoa que assistiu à reunião e está registrando os fatos.
- Mantenha ordem cronológica dos assuntos.
- Use linguagem institucional, clara e objetiva.
- Não use tópicos.
- Não invente decisões que não aparecem na transcrição.
- Quando houver encaminhamentos, registre de forma natural no texto.
- Não coloque lista de participantes no início.
- No final da ata, inclua a frase: "Estiveram presentes: " seguida dos nomes dos participantes.
- Não coloque campo de assinatura.
- Não coloque markdown.
- Não coloque título com #.
- A ata deve ter aparência de documento oficial, mas em texto corrido.
- Ignore conversas paralelas que não tenham relação com a reunião.

Nome da reunião:
${nomeReuniao}

Participantes presentes:
${participantesTexto}

Transcrição da reunião:
${transcricao}

Agora escreva apenas a ata final:`;

    const response = await fetch(`${OLLAMA_URL}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, prompt, stream: false, options: { temperature: 0.3, top_p: 0.9 } })
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(500).json({ error: "Erro ao consultar o Ollama.", details: text });
    }

    const data = await response.json();
    return res.json({ ata: String(data.response || "").trim() });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Erro interno ao gerar ata.", details: error.message });
  }
});

app.listen(PORT, () => console.log(`Backend rodando em http://localhost:${PORT}`));
