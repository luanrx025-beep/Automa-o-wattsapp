// ============================================================
//  NEXUS SOFT — Automação WhatsApp via Z-API
//  Webhook HTTP para envio de mensagens personalizadas
// ============================================================

const express = require("express");
const axios = require("axios");
const app = express();
app.use(express.json());

// ============================================================
//  ⚙️  CONFIGURAÇÕES DA Z-API — PREENCHA AQUI
// ============================================================
const ZAPI_INSTANCE_ID = "3F2417CBA383B2FC41C94A6398D03DAE";
const ZAPI_TOKEN       = "0B70F8646E564CE12E765C8A";
const ZAPI_BASE_URL    = `https://api.z-api.io/instances/${ZAPI_INSTANCE_ID}/token/${ZAPI_TOKEN}`;
// ============================================================

// ------------------------------------------------------------
//  Utilitário: formatar telefone para padrão internacional
//  Ex: "11999998888" → "5511999998888"
// ------------------------------------------------------------
function formatarTelefone(telefone) {
  const numeros = telefone.replace(/\D/g, "");
  if (numeros.startsWith("55")) return numeros;
  return `55${numeros}`;
}

// ------------------------------------------------------------
//  Gerar mensagem principal conforme o tipo de ação
// ------------------------------------------------------------
function gerarMensagemPrincipal(nome, tipo, detalhe) {
  const tipoNormalizado = tipo.toLowerCase().trim();

  if (tipoNormalizado === "pedido") {
    return (
      `Fala, ${nome}! 🚀 Seu projeto *${detalhe}* já foi confirmado e ` +
      `nossa equipe da *Nexus Soft* já iniciou o processo de desenvolvimento.\n\n` +
      `Trabalhamos com:\n` +
      `• 🌐 Sites profissionais\n` +
      `• ⚙️ Sistemas personalizados\n` +
      `• 🤖 Automações inteligentes\n` +
      `• 💡 Soluções digitais completas`
    );
  }

  if (tipoNormalizado === "agendamento") {
    return (
      `Fala, ${nome}! 📅 Seu agendamento para *${detalhe}* com a equipe da ` +
      `*Nexus Soft* está confirmado.\n\n` +
      `Fique à vontade para chegar com suas dúvidas e ideias. Vamos criar algo incrível juntos! ✨`
    );
  }

  if (tipoNormalizado === "cadastro") {
    return (
      `Fala, ${nome}! 👋 Seu cadastro na *Nexus Soft* foi concluído com sucesso.\n\n` +
      `Agora você já pode acessar nossos serviços e soluções digitais:\n` +
      `• 🌐 Desenvolvimento de sites\n` +
      `• ⚙️ Sistemas sob medida\n` +
      `• 🤖 Automações inteligentes`
    );
  }

  // Tipo desconhecido
  return null;
}

// ------------------------------------------------------------
//  Mensagens complementares (fixas)
// ------------------------------------------------------------
const MSG_SUPORTE =
  "Nossa equipe está à disposição caso precise de qualquer suporte ou acompanhamento. " +
  "É só responder por aqui. 💬";

const MSG_EXTRA =
  "Se quiser, podemos te atualizar por aqui sobre o andamento do seu projeto. 😉";

// ------------------------------------------------------------
//  Enviar mensagem via Z-API
// ------------------------------------------------------------
async function enviarMensagem(telefone, mensagem) {
  const url = `${ZAPI_BASE_URL}/send-text`;

  const body = {
    phone: telefone,
    message: mensagem,
  };

  const headers = {
    "Content-Type": "application/json",
    // A Z-API usa autenticação via URL (instance + token).
    // Se sua instância exigir header extra, adicione abaixo:
    // "Client-Token": "SEU_CLIENT_TOKEN_SE_NECESSARIO"
  };

  const response = await axios.post(url, body, { headers });
  return response.data;
}

// ============================================================
//  ROTA PRINCIPAL — POST /webhook
// ============================================================
app.post("/webhook", async (req, res) => {
  const { nome, telefone, tipo, detalhe } = req.body;

  // ----------------------------------------------------------
  //  1. Validar dados obrigatórios
  // ----------------------------------------------------------
  const camposFaltando = [];
  if (!nome)     camposFaltando.push("nome");
  if (!telefone) camposFaltando.push("telefone");
  if (!tipo)     camposFaltando.push("tipo");

  if (camposFaltando.length > 0) {
    return res.status(400).json({
      sucesso: false,
      erro: `Campos obrigatórios ausentes: ${camposFaltando.join(", ")}`,
    });
  }

  // ----------------------------------------------------------
  //  2. Formatar telefone
  // ----------------------------------------------------------
  const telefoneFormatado = formatarTelefone(telefone);

  // ----------------------------------------------------------
  //  3. Gerar mensagem conforme tipo de ação (if/else)
  // ----------------------------------------------------------
  const msgPrincipal = gerarMensagemPrincipal(nome, tipo, detalhe || "");

  if (!msgPrincipal) {
    return res.status(400).json({
      sucesso: false,
      erro: `Tipo de ação inválido: "${tipo}". Use: pedido, agendamento ou cadastro.`,
    });
  }

  // ----------------------------------------------------------
  //  4. Montar mensagem completa
  // ----------------------------------------------------------
  const mensagemCompleta =
    `${msgPrincipal}\n\n` +
    `${MSG_SUPORTE}\n\n` +
    `${MSG_EXTRA}`;

  // ----------------------------------------------------------
  //  5. Enviar via Z-API
  // ----------------------------------------------------------
  try {
    const resultado = await enviarMensagem(telefoneFormatado, mensagemCompleta);

    console.log(`[Nexus Soft] ✅ Mensagem enviada para ${nome} (${telefoneFormatado})`);

    return res.status(200).json({
      sucesso: true,
      mensagem: "Mensagem enviada com sucesso!",
      destinatario: { nome, telefone: telefoneFormatado, tipo },
      zapi_response: resultado,
    });

  } catch (error) {
    console.error("[Nexus Soft] ❌ Erro ao enviar mensagem:", error?.response?.data || error.message);

    return res.status(500).json({
      sucesso: false,
      erro: "Falha ao enviar mensagem via Z-API.",
      detalhe: error?.response?.data || error.message,
    });
  }
});

// ------------------------------------------------------------
//  Health check
// ------------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    status: "online",
    empresa: "Nexus Soft",
    servico: "Automação WhatsApp",
    versao: "1.0.0",
  });
});

// ------------------------------------------------------------
//  Iniciar servidor
// ------------------------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`\n🚀 Nexus Soft — Webhook rodando na porta ${PORT}`);
  console.log(`   Endpoint: POST http://localhost:${PORT}/webhook\n`);
});
