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
    if (!nomeReuniao || !String(nomeReuniao).trim()) {
      return res.status(400).json({ error: "Informe o nome da reuniao." });
    }
    if (!transcricao || !String(transcricao).trim()) {
      return res.status(400).json({ error: "A transcricao esta vazia." });
    }

    const participantesTexto = Array.isArray(participantes) ? participantes.join(", ") : "";
    const prompt = `Voce e responsavel por redigir uma ata de reuniao escolar/profissional.

Crie uma ATA DETALHADA, FORMAL, EM TERCEIRA PESSOA e EM TEXTO CORRIDO.

Regras obrigatorias:
- Nao copie a transcricao literalmente.
- Interprete o que foi conversado.
- Escreva como uma pessoa que assistiu a reuniao e esta registrando os fatos.
- Mantenha ordem cronologica dos assuntos.
- Use linguagem institucional, clara, objetiva e completa.
- Nao use topicos.
- Nao invente decisoes que nao aparecem na transcricao.
- Quando houver encaminhamentos, registre de forma natural no texto.
- Desenvolva os assuntos com contexto, justificativas, problemas discutidos, decisoes tomadas, responsabilidades mencionadas e prazos quando aparecerem na transcricao.
- Evite resumo excessivo: cada tema relevante deve ser explicado em paragrafos completos, preservando o sentido da discussao.
- Se houver divergencias, preocupacoes, propostas ou observacoes importantes, registre-as de forma institucional.
- Nao reduza a ata a poucas frases. Produza um texto substancial e fiel ao conteudo da reuniao.
- Nao coloque lista de participantes no inicio.
- No final da ata, inclua a frase: "Estiveram presentes: " seguida dos nomes dos participantes.
- Nao coloque campo de assinatura.
- Nao coloque markdown.
- Nao coloque titulo com #.
- A ata deve ter aparencia de documento oficial, mas em texto corrido.
- Ignore conversas paralelas que nao tenham relacao com a reuniao.

Nome da reuniao:
${nomeReuniao}

Participantes presentes:
${participantesTexto}

Transcricao da reuniao:
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
