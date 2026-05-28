import React, { useMemo, useRef, useState } from 'react';
import jsPDF from 'jspdf';

const PROFESSORES = [
  "ROGERIO JOSE INOCENCIO",
  "CARLOS AUGUSTO CONCON ZANELLI",
  "WILLIAM LIMA DA SILVA",
  "WELIO MEIRELES DE SOUSA",
  "MARIA EDUARDA MOREIRA SANTOS",
  "ARNAUD RODRIGUES MOTA",
  "RENATA CASTALDELLI CORREA GARDINAL",
  "IRIS BRAZ RIBEIRO DE OLIVEIRA",
  "AILTON JOAO BEZERRA",
  "GUILHERME DOS SANTOS ROSSI",
  "BRUNA FLORE PARENTE",
  "PEDRO GUILHERME SAID",
  "AROLDO CUSTODIO DE OLIVEIRA JUNIOR",
  "CICERO JESUS DA SILVA",
  "FRANCISCO DAS CHAGAS ALVES CORREIA VERAS",
  "CELIA SOARES",
  "DAIANI ALVES DA SILVA",
  "JOSE CESAR ALVES FONSECA",
  "BARBARA SALVADOR FERREIRA",
  "JULIANNE DIAS FERRAZ",
  "NATHALIA JULIANI ALBERNAZ",
  "JOÃO FERNANDO PEREIRA SAID",
  "DALVA QUEIROZ"
];
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function App() {
  const [nomeReuniao, setNomeReuniao] = useState('');
  const [participantes, setParticipantes] = useState(PROFESSORES);
  const [transcricao, setTranscricao] = useState('');
  const [trechoAtual, setTrechoAtual] = useState('');
  const [ata, setAta] = useState('');
  const [gravando, setGravando] = useState(false);
  const [gerando, setGerando] = useState(false);
  const [erro, setErro] = useState('');

  const recognitionRef = useRef(null);
  const gravandoRef = useRef(false);
  const pararManualRef = useRef(false);
  const ultimoTrechoFinalRef = useRef('');

  const todosSelecionados = participantes.length === PROFESSORES.length;
  const dataHoje = useMemo(() => new Date().toLocaleDateString('pt-BR'), []);

  function normalizarEspacos(texto) { return String(texto || '').replace(/\s+/g, ' ').trim(); }

  function adicionarTrechoFinal(trecho) {
    const textoLimpo = normalizarEspacos(trecho);
    if (!textoLimpo) return;
    if (textoLimpo === ultimoTrechoFinalRef.current) return;
    ultimoTrechoFinalRef.current = textoLimpo;
    setTranscricao((anterior) => {
      const anteriorLimpo = String(anterior || '').trim();
      if (anteriorLimpo.endsWith(textoLimpo)) return anterior;
      return anteriorLimpo ? `${anteriorLimpo} ${textoLimpo}` : textoLimpo;
    });
  }

  function alternarParticipante(nome) {
    setParticipantes((atual) => atual.includes(nome) ? atual.filter((item) => item !== nome) : [...atual, nome]);
  }

  function alternarTodos() { setParticipantes(todosSelecionados ? [] : PROFESSORES); }

  function criarReconhecimento() {
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      let temporario = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const trecho = normalizarEspacos(event.results[i][0].transcript);
        if (!trecho) continue;
        if (event.results[i].isFinal) { adicionarTrechoFinal(trecho); temporario = ''; }
        else { temporario = normalizarEspacos(`${temporario} ${trecho}`); }
      }
      setTrechoAtual(temporario);
    };

    recognition.onerror = (event) => {
      console.log('Erro no reconhecimento:', event.error);
      if (event.error === 'no-speech' || event.error === 'network' || event.error === 'aborted') return;
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed' || event.error === 'audio-capture') {
        setErro(`Erro no reconhecimento de voz: ${event.error}`);
        setGravando(false); gravandoRef.current = false; pararManualRef.current = true;
      }
    };

    recognition.onend = () => {
      if (!pararManualRef.current && gravandoRef.current) {
        setTimeout(() => {
          try {
            const novoReconhecimento = criarReconhecimento();
            recognitionRef.current = novoReconhecimento;
            novoReconhecimento.start();
          } catch (error) { console.log('Tentando reiniciar reconhecimento...', error); }
        }, 500);
      }
    };
    return recognition;
  }

  function iniciarGravacao() {
    setErro(''); setTrechoAtual('');
    if (!SpeechRecognition) { setErro('Seu navegador não suporta reconhecimento de voz. Use o Google Chrome.'); return; }
    pararManualRef.current = false; gravandoRef.current = true;
    const recognition = criarReconhecimento(); recognitionRef.current = recognition; setGravando(true);
    try { recognition.start(); } catch (error) { setErro('Não foi possível iniciar o reconhecimento de voz.'); setGravando(false); gravandoRef.current = false; pararManualRef.current = true; }
  }

  function pararGravacao() {
    pararManualRef.current = true; gravandoRef.current = false;
    if (trechoAtual.trim()) adicionarTrechoFinal(trechoAtual);
    setTrechoAtual('');
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch (error) { console.log('Erro ao parar reconhecimento:', error); }
      recognitionRef.current = null;
    }
    setGravando(false);
  }

  async function gerarAta() {
    setErro('');
    const transcricaoLimpa = normalizarEspacos(`${transcricao} ${trechoAtual}`);
    if (!nomeReuniao.trim()) { setErro('Informe o nome da reunião.'); return; }
    if (!transcricaoLimpa) { setErro('A transcrição está vazia.'); return; }
    if (participantes.length === 0) { setErro('Selecione pelo menos um participante.'); return; }
    setGerando(true);
    try {
      const response = await fetch('http://localhost:3333/api/gerar-ata', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nomeReuniao, participantes, transcricao: transcricaoLimpa })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Erro ao gerar ata.');
      setAta(data.ata);
    } catch (error) { setErro(error.message); } finally { setGerando(false); }
  }

  function gerarPdf() {
    setErro('');
    if (!ata.trim()) { setErro('Gere ou escreva a ata antes de criar o PDF.'); return; }
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const margemX = 8, margemTopo = 7, larguraTexto = 194;
    let y = margemTopo;
    doc.setFont('times', 'bold'); doc.setFontSize(11); doc.text('ATA DE REUNIÃO', 105, y, { align: 'center' });
    y += 5;
    doc.setFont('times', 'normal'); doc.setFontSize(8.5);
    doc.text(`Reunião: ${nomeReuniao || 'Não informada'}`, margemX, y); y += 3.8;
    doc.text(`Data: ${dataHoje}`, margemX, y); y += 4.5;
    doc.setFontSize(8.5); doc.setLineHeightFactor(1.0);
    const textoLimpo = ata.replace(/
{2,}/g, '
').replace(/\s+/g, ' ').trim();
    const linhas = doc.splitTextToSize(textoLimpo, larguraTexto);
    linhas.forEach((linha) => { if (y > 287) { doc.addPage(); y = 7; } doc.text(linha, margemX, y, { maxWidth: larguraTexto }); y += 3.45; });
    const nomeArquivo = `ata-${nomeReuniao || 'reuniao'}`.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9]/g, '-').replace(/-+/g, '-').toLowerCase();
    doc.save(`${nomeArquivo}.pdf`);
  }

  return (
    <main className="page">
      <section className="hero"><div><p className="eyebrow">Sistema de Ata com IA</p><h1>Gerador de Ata de Reunião</h1><p>Grave a reunião, revise a transcrição, gere uma ata formal em texto corrido e exporte em PDF A4 compacto.</p></div></section>
      {erro && <div className="alert">{erro}</div>}
      <section className="grid">
        <div className="card"><label className="label">Nome da reunião</label><input className="input" value={nomeReuniao} onChange={(e) => setNomeReuniao(e.target.value)} placeholder="Ex: Reunião Pedagógica" />
          <div className="participants-header"><div><h2>Participantes</h2><p>Todos vêm selecionados por padrão. Desmarque quem faltou.</p></div><button className="secondary-button" onClick={alternarTodos}>{todosSelecionados ? 'Desmarcar todos' : 'Selecionar todos'}</button></div>
          <div className="participants-list">{PROFESSORES.map((nome) => (<label key={nome} className="checkbox-row"><input type="checkbox" checked={participantes.includes(nome)} onChange={() => alternarParticipante(nome)} /><span>{nome}</span></label>))}</div>
        </div>
        <div className="card"><h2>Áudio e transcrição</h2><p className="hint">A transcrição pode ser revisada manualmente antes de gerar a ata.</p>
          <div className="actions">{!gravando ? (<button className="primary-button" onClick={iniciarGravacao}>Iniciar gravação/transcrição</button>) : (<button className="danger-button" onClick={pararGravacao}>Parar</button>)}<button className="secondary-button" onClick={() => { setTranscricao(''); setTrechoAtual(''); ultimoTrechoFinalRef.current = ''; }} disabled={gravando}>Limpar transcrição</button></div>
          {gravando && <div className="recording-box">Gravando... A escuta será reiniciada automaticamente se o Chrome pausar sozinho.</div>}
          <textarea className="textarea transcript" value={transcricao} onChange={(e) => setTranscricao(e.target.value)} placeholder="A transcrição final da reunião aparecerá aqui..." />
          {trechoAtual && <div className="live-preview"><strong>Ouvindo agora:</strong> {trechoAtual}</div>}
          <button className="primary-button full" onClick={gerarAta} disabled={gerando}>{gerando ? 'Gerando ata...' : 'Gerar ata com IA'}</button>
        </div>
      </section>
      <section className="card"><div className="ata-header"><div><h2>Ata gerada</h2><p className="hint">Você pode editar o texto antes de gerar o PDF.</p></div><button className="primary-button" onClick={gerarPdf}>Gerar PDF</button></div><textarea className="textarea ata" value={ata} onChange={(e) => setAta(e.target.value)} placeholder="A ata final aparecerá aqui..." /></section>
    </main>
  );
}
