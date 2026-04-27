// ============================================================
//  NEXUS SOFT — Chatbot WhatsApp Completo via Z-API
//  Menu interativo + FAQ + Agendamento + Suporte
// ============================================================

const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ============================================================
//  ⚙️  CONFIGURAÇÕES DA Z-API
// ============================================================
const ZAPI_INSTANCE_ID  = "3F2417CBA383B2FC41C94A6398D03DAE";
const ZAPI_TOKEN        = "0B70F8646E564CE12E765C8A";
const ZAPI_CLIENT_TOKEN = "Fe22bf72bf683459e9ccdad99dc63a537S";
const ZAPI_BASE_URL     = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;
// ============================================================

// ------------------------------------------------------------
//  Sessões dos clientes (memória temporária)
// ------------------------------------------------------------
const sessoes = {};

// ------------------------------------------------------------
//  Enviar mensagem via Z-API
// ------------------------------------------------------------
async function enviarMensagem(telefone, mensagem) {
  const url = `${ZAPI_BASE_URL}/send-text`;
  await axios.post(url, { phone: telefone, message: mensagem }, {
    headers: {
      "Content-Type": "application/json",
      "Client-Token": ZAPI_CLIENT_TOKEN,
    }
  });
}

// ------------------------------------------------------------
//  MENSAGENS DO BOT
// ------------------------------------------------------------
const MENU_PRINCIPAL = `Olá! 👋 Seja bem-vindo à *Nexus Soft*! 🚀

Somos especialistas em tecnologia e desenvolvimento digital. Como posso te ajudar hoje?

*1️⃣* — Nossos serviços
*2️⃣* — Preços e prazos
*3️⃣* — Agendar uma reunião
*4️⃣* — Falar com a equipe
*0️⃣* — Voltar ao menu

_Digite o número da opção desejada_ 👇`;

const SERVICOS = `🌐 *O que a Nexus Soft desenvolve:*

*Sites Profissionais*
Landing pages, sites institucionais, portfólios e e-commerces com design moderno e responsivo.

*Sistemas Personalizados*
Sistemas web sob medida: CRM, gestão, dashboards e muito mais.

*Automações Inteligentes*
Automatizamos processos repetitivos, integrações e fluxos de trabalho.

*Soluções Digitais Completas*
Do planejamento à entrega, cuidamos de tudo! 💡

Digite *2* para ver preços ou *3* para agendar uma reunião. 😊`;

const PRECOS = `💰 *Preços e Prazos — Nexus Soft*

🌐 *Site Institucional*
A partir de R$ 800
Prazo: 7 a 15 dias úteis

🛒 *E-commerce*
A partir de R$ 1.500
Prazo: 15 a 30 dias úteis

⚙️ *Sistema Personalizado*
A partir de R$ 2.000
Prazo: 30 a 60 dias úteis

🤖 *Automações*
A partir de R$ 500
Prazo: 3 a 10 dias úteis

_Valores podem variar conforme a complexidade do projeto._

Digite *3* para agendar uma reunião gratuita! 😉`;

const AGENDAMENTO_INICIO = `📅 *Vamos agendar sua reunião!*

É rápido e totalmente gratuito. Me diz: qual é o *seu nome completo*?`;

const EQUIPE = `👨‍💻 *Falar com a Equipe Nexus Soft*

Nossa equipe está disponível:
🕘 Segunda a Sexta: 9h às 18h
🕘 Sábado: 9h às 13h

📧 E-mail: contato@nexussoft.com.br
📱 WhatsApp: este número mesmo!

Um especialista vai te responder em breve. 💬

Digite *0* para voltar ao menu.`;

// ------------------------------------------------------------
//  FLUXO DE AGENDAMENTO
// ------------------------------------------------------------
async function fluxoAgendamento(telefone, mensagem, sessao) {

  if (sessao.etapa === "nome") {
    sessao.nome = mensagem;
    sessao.etapa = "servico";
    await enviarMensagem(telefone,
      `Ótimo, *${mensagem}*! 😊\n\nQual serviço você tem interesse?\n\n` +
      `*1* — Site\n*2* — Sistema\n*3* — Automação\n*4* — Ainda não sei`
    );
    return;
  }

  if (sessao.etapa === "servico") {
    const servicos = { "1": "Site", "2": "Sistema", "3": "Automação", "4": "Ainda não definido" };
    sessao.servico = servicos[mensagem] || mensagem;
    sessao.etapa = "data";
    await enviarMensagem(telefone,
      `Perfeito! 👍\n\nQual *data e horário* você prefere para a reunião?\n\n_Ex: Quinta-feira às 14h_`
    );
    return;
  }

  if (sessao.etapa === "data") {
    sessao.data = mensagem;
    sessao.etapa = null;

    await enviarMensagem(telefone,
      `✅ *Reunião agendada com sucesso!*\n\n` +
      `👤 Nome: *${sessao.nome}*\n` +
      `💼 Serviço: *${sessao.servico}*\n` +
      `📅 Data: *${sessao.data}*\n\n` +
      `Nossa equipe vai confirmar em breve por aqui. 🚀\n\n` +
      `Nossa equipe está à disposição para qualquer dúvida. 💬\n\n` +
      `Digite *0* para voltar ao menu.`
    );
    return;
  }
}

// ------------------------------------------------------------
//  PROCESSADOR PRINCIPAL DE MENSAGENS
// ------------------------------------------------------------
async function processarMensagem(telefone, mensagem) {
  const texto = mensagem.trim().toLowerCase();

  if (!sessoes[telefone]) {
    sessoes[telefone] = { etapa: null };
  }

  const sessao = sessoes[telefone];

  // Se está no fluxo de agendamento
  if (sessao.etapa) {
    await fluxoAgendamento(telefone, mensagem.trim(), sessao);
    return;
  }

  // Saudações e menu
  const saudacoes = ["oi", "olá", "ola", "boa tarde", "bom dia", "boa noite", "hello", "hi", "0", "menu", "início", "inicio", "start"];
  if (saudacoes.includes(texto)) {
    await enviarMensagem(telefone, MENU_PRINCIPAL);
    return;
  }

  if (texto === "1") { await enviarMensagem(telefone, SERVICOS); return; }
  if (texto === "2") { await enviarMensagem(telefone, PRECOS); return; }
  if (texto === "3") { sessao.etapa = "nome"; await enviarMensagem(telefone, AGENDAMENTO_INICIO); return; }
  if (texto === "4") { await enviarMensagem(telefone, EQUIPE); return; }

  // Resposta padrão
  await enviarMensagem(telefone,
    `Não entendi muito bem, mas tudo bem! 😊\n\n${MENU_PRINCIPAL}`
  );
}

// ============================================================
//  ROTA — Receber mensagens dos clientes via Z-API
//  ⚠️ Configure na Z-API em: Webhooks → On Message Received
//  URL: https://automa-o-wattsapp.onrender.com/mensagem
// ============================================================
app.post("/mensagem", async (req, res) => {
  try {
    const body = req.body;

    if (body.fromMe) return res.sendStatus(200);
    if (body.isGroup) return res.sendStatus(200);

    const telefone = body.phone;
    const mensagem = body.text?.message || body.message || "";

    if (!telefone || !mensagem) return res.sendStatus(200);

    console.log(`[Nexus Soft] 📩 ${telefone}: ${mensagem}`);

    await processarMensagem(telefone, mensagem);

    return res.sendStatus(200);

  } catch (error) {
    console.error("[Nexus Soft] ❌ Erro:", error.message);
    return res.sendStatus(500);
  }
});

// ============================================================
//  ROTA — Envio manual de confirmações
//  POST /webhook
// ============================================================
app.post("/webhook", async (req, res) => {
  const { nome, telefone, tipo, detalhe } = req.body;

  if (!nome || !telefone || !tipo) {
    return res.status(400).json({ sucesso: false, erro: "Campos obrigatórios ausentes." });
  }

  const numeros = telefone.replace(/\D/g, "");
  const telefoneFormatado = numeros.startsWith("55") ? numeros : `55${numeros}`;

  const mensagens = {
    pedido: `Fala, ${nome}! 🚀 Seu projeto *${detalhe}* já foi confirmado e nossa equipe da *Nexus Soft* já iniciou o processo de desenvolvimento.\n\n• 🌐 Sites profissionais\n• ⚙️ Sistemas personalizados\n• 🤖 Automações inteligentes\n• 💡 Soluções digitais completas`,
    agendamento: `Fala, ${nome}! 📅 Seu agendamento para *${detalhe}* com a equipe da *Nexus Soft* está confirmado. Vamos criar algo incrível juntos! ✨`,
    cadastro: `Fala, ${nome}! 👋 Seu cadastro na *Nexus Soft* foi concluído com sucesso.\n\n• 🌐 Desenvolvimento de sites\n• ⚙️ Sistemas sob medida\n• 🤖 Automações inteligentes`,
  };

  const msgPrincipal = mensagens[tipo.toLowerCase()];
  if (!msgPrincipal) return res.status(400).json({ sucesso: false, erro: "Tipo inválido." });

  const mensagemCompleta =
    `${msgPrincipal}\n\n` +
    `Nossa equipe está à disposição. É só responder por aqui. 💬\n\n` +
    `Se quiser, podemos te atualizar sobre o andamento do seu projeto. 😉`;

  try {
    await enviarMensagem(telefoneFormatado, mensagemCompleta);
    return res.json({ sucesso: true, mensagem: "Mensagem enviada com sucesso!" });
  } catch (error) {
    return res.status(500).json({ sucesso: false, erro: error?.response?.data || error.message });
  }
});

// ------------------------------------------------------------
//  Health check
// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({ status: "online", empresa: "Nexus Soft", versao: "2.0.0", chatbot: "ativo" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Nexus Soft Chatbot v2.0 — Porta ${PORT}\n`);
});
