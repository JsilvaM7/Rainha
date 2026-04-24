/* ══════════════════════════════════════════════════════════════════════════════
   Rainha — Firebase Cloud Functions  |  v3.0
   Webhook Hotmart + verificação de assinatura
   ══════════════════════════════════════════════════════════════════════════════

   CONFIGURAÇÃO OBRIGATÓRIA (rodar UMA VEZ no terminal):
   ─────────────────────────────────────────────────────
   firebase functions:config:set hotmart.token="SEU_HOTTOK_AQUI"
   firebase deploy --only functions

   URL DO WEBHOOK (colar no painel Hotmart → Ferramentas → Webhooks):
   ─────────────────────────────────────────────────────────────────
   https://us-central1-rainha-aa80a.cloudfunctions.net/hotmartWebhook

   EVENTOS TRATADOS:
   ─────────────────
   ✅ PURCHASE_APPROVED   → ativa assinante (statusAssinatura = "Ativo")
   ✅ PURCHASE_COMPLETE   → ativa assinante
   ✅ SUBSCRIPTION_ACTIVE → ativa/renova assinante
   ❌ PURCHASE_CANCELLED  → desativa assinante (statusAssinatura = "Cancelado")
   ❌ PURCHASE_REFUNDED   → desativa assinante
   ❌ SUBSCRIPTION_CANCELLATION → desativa assinante
   ══════════════════════════════════════════════════════════════════════════════ */

"use strict";

const functions = require("firebase-functions");
const admin     = require("firebase-admin");

admin.initializeApp();

/* ── Constantes ─────────────────────────────────────────────────────────────── */
const EVENTOS_ATIVAR = [
    "PURCHASE_APPROVED",
    "PURCHASE_COMPLETE",
    "SUBSCRIPTION_ACTIVE",
    "APPROVED"
];

const EVENTOS_CANCELAR = [
    "PURCHASE_CANCELLED",
    "PURCHASE_REFUNDED",
    "PURCHASE_CHARGEBACK",
    "SUBSCRIPTION_CANCELLATION",
    "CANCELLED"
];

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

/**
 * Calcula a data de expiração com base no período do plano enviado pela Hotmart.
 * Fallback: 32 dias (margem de segurança em cima dos 30 do plano mensal).
 */
function calcularDataExpiracao(body) {
    try {
        // Hotmart v2 — dados da assinatura
        const plan = body?.data?.subscription?.plan;
        if (plan) {
            const periodo = (plan.recurrency_period || "").toLowerCase();
            const dias = periodo.includes("annual") || periodo.includes("yearly")
                ? 370   // anual + 5 dias de margem
                : 32;   // mensal padrão
            const expira = new Date();
            expira.setDate(expira.getDate() + dias);
            return expira;
        }

        // Hotmart v1 — tenta extrair next_charge_date
        const nextCharge = body?.data?.purchase?.next_charge_date
            || body?.data?.subscription?.next_charge_date;
        if (nextCharge) {
            // Hotmart envia timestamp em ms
            const d = new Date(typeof nextCharge === "number"
                ? nextCharge
                : Number(nextCharge));
            if (!isNaN(d)) return d;
        }
    } catch (_) { /* fallback abaixo */ }

    // Fallback seguro: 32 dias a partir de agora
    const expira = new Date();
    expira.setDate(expira.getDate() + 32);
    return expira;
}

/**
 * Extrai o e-mail do comprador do payload da Hotmart (v1 e v2).
 */
function extrairEmail(body) {
    return body?.data?.buyer?.email
        || body?.data?.purchase?.buyer?.email
        || body?.buyer?.email
        || body?.email
        || null;
}

/**
 * Extrai o tipo de evento do payload da Hotmart (v1 e v2).
 */
function extrairEvento(body) {
    return (body?.event
        || body?.data?.purchase?.status
        || body?.data?.subscription?.status
        || "UNKNOWN"
    ).toString().toUpperCase();
}

/**
 * Verifica o token de segurança enviado pela Hotmart.
 * Hotmart envia o token no header 'x-hotmart-hottok' ou como query param 'hottok'.
 * O token esperado é definido na variável de ambiente HOTMART_TOKEN (.env file).
 */
function verificarToken(req) {
    const tokenEsperado = process.env.HOTMART_TOKEN || "";

    if (!tokenEsperado) {
        console.warn("⚠️  HOTMART_TOKEN não definido no .env — pulando verificação.");
        return true;
    }

    const tokenRecebido =
        req.headers["x-hotmart-hottok"] ||
        req.query.hottok               ||
        req.body?.hottok               ||
        "";

    return tokenRecebido === tokenEsperado;
}

/* ══════════════════════════════════════════════════════════════════════════════
   FUNÇÃO 1 — Webhook Hotmart
   URL: https://us-central1-rainha-aa80a.cloudfunctions.net/hotmartWebhook
   ══════════════════════════════════════════════════════════════════════════════ */
exports.hotmartWebhook = functions.https.onRequest(async (req, res) => {

    /* Só aceita POST */
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    /* ── Verificação de segurança (token Hotmart) ──────────────────────────── */
    if (!verificarToken(req)) {
        console.error("❌ Token inválido — requisição bloqueada.",
            "Recebido:", req.headers["x-hotmart-hottok"] || req.query.hottok);
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }

    try {
        const body   = req.body;
        const evento = extrairEvento(body);

        /* ── Log completo para debug no Firebase Console → Functions → Logs ── */
        console.log("📩 Hotmart webhook | evento:", evento,
            "| body:", JSON.stringify(body).slice(0, 600));

        /* ── Determina ação ──────────────────────────────────────────────────── */
        const deveAtivar   = EVENTOS_ATIVAR.some(e   => evento.includes(e));
        const deveCancelar = EVENTOS_CANCELAR.some(e => evento.includes(e));

        if (!deveAtivar && !deveCancelar) {
            console.log("ℹ️  Evento ignorado:", evento);
            return res.status(200).json({ status: "ignored", event: evento });
        }

        /* ── Extrai e-mail ───────────────────────────────────────────────────── */
        const email = extrairEmail(body);
        if (!email) {
            console.error("❌ E-mail não encontrado no payload:", JSON.stringify(body).slice(0, 400));
            return res.status(400).json({ status: "error", message: "E-mail não encontrado no payload" });
        }

        const emailNorm = email.trim().toLowerCase();
        console.log(`📧 E-mail: ${emailNorm} | Ação: ${deveAtivar ? "ATIVAR" : "CANCELAR"}`);

        /* ── Tenta localizar usuário no Firebase Auth ─────────────────────────── */
        let userRecord = null;
        try {
            userRecord = await admin.auth().getUserByEmail(emailNorm);
        } catch (_) {
            console.warn(`⚠️  Usuário ${emailNorm} não encontrado no Firebase Auth.`);
        }

        const db  = admin.firestore();
        const now = admin.firestore.FieldValue.serverTimestamp();

        /* ════════════════════════════════════════════════════════════════════════
           ATIVAR ASSINANTE
           ════════════════════════════════════════════════════════════════════════ */
        if (deveAtivar) {
            const dataExpiracao = calcularDataExpiracao(body);

            if (userRecord) {
                /* ── 1. Custom Claim (verificação mais rápida no frontend) ─────── */
                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    isSubscriber: true,
                    subscribedAt: new Date().toISOString()
                });

                /* ── 2. Coleção subscribers/{uid} (verificação principal auth.js) */
                await db.collection("subscribers").doc(userRecord.uid).set({
                    email:             emailNorm,
                    uid:               userRecord.uid,
                    isSubscriber:      true,
                    statusAssinatura:  "Ativo",
                    dataExpiracao:     admin.firestore.Timestamp.fromDate(dataExpiracao),
                    ativadoEm:         now,
                    fonte:             "hotmart_webhook",
                    ultimoEvento:      evento
                }, { merge: true });

                /* ── 3. Coleção users/{uid} (solicitado no brief) ──────────────── */
                await db.collection("users").doc(userRecord.uid).set({
                    email:             emailNorm,
                    uid:               userRecord.uid,
                    statusAssinatura:  "Ativo",
                    dataExpiracao:     admin.firestore.Timestamp.fromDate(dataExpiracao),
                    atualizadoEm:      now
                }, { merge: true });

                console.log(`✅ Assinante ATIVADO: ${emailNorm} | uid: ${userRecord.uid} | expira: ${dataExpiracao.toISOString()}`);
                return res.status(200).json({
                    status:         "success",
                    message:        "Assinante ativado",
                    uid:            userRecord.uid,
                    dataExpiracao:  dataExpiracao.toISOString()
                });

            } else {
                /* ── Usuário ainda não criou conta → salva como pendente ──────── */
                const docId = emailNorm; // usa e-mail como ID (padrão do auth.js v9)

                await db.collection("pendingSubscribers").doc(docId).set({
                    email:            emailNorm,
                    isSubscriber:     true,
                    statusAssinatura: "Ativo",
                    dataExpiracao:    admin.firestore.Timestamp.fromDate(dataExpiracao),
                    ativadoEm:        now,
                    fonte:            "hotmart_webhook",
                    ultimoEvento:     evento
                });

                console.log(`⏳ Salvo como PENDENTE (sem conta ainda): ${emailNorm}`);
                return res.status(200).json({
                    status:  "pending",
                    message: "Usuário não encontrado no Auth — salvo como pendente"
                });
            }
        }

        /* ════════════════════════════════════════════════════════════════════════
           CANCELAR / REEMBOLSAR ASSINANTE
           ════════════════════════════════════════════════════════════════════════ */
        if (deveCancelar) {
            const dadosCancelamento = {
                isSubscriber:     false,
                statusAssinatura: "Cancelado",
                canceladoEm:      now,
                ultimoEvento:     evento
            };

            if (userRecord) {
                /* Remove custom claim */
                await admin.auth().setCustomUserClaims(userRecord.uid, {
                    isSubscriber: false
                });

                /* Atualiza subscribers/{uid} */
                await db.collection("subscribers").doc(userRecord.uid)
                    .set(dadosCancelamento, { merge: true });

                /* Atualiza users/{uid} */
                await db.collection("users").doc(userRecord.uid)
                    .set({ statusAssinatura: "Cancelado", canceladoEm: now }, { merge: true });

                console.log(`🚫 Assinante CANCELADO: ${emailNorm} | uid: ${userRecord.uid}`);
            } else {
                /* Remove/atualiza pendente se existir */
                await db.collection("pendingSubscribers").doc(emailNorm)
                    .set(dadosCancelamento, { merge: true });
                console.log(`🚫 Pendente CANCELADO: ${emailNorm}`);
            }

            return res.status(200).json({
                status:  "cancelled",
                message: "Assinatura cancelada/reembolsada"
            });
        }

    } catch (error) {
        console.error("💥 Erro interno no webhook:", error.message, error.stack);
        return res.status(500).json({ status: "error", message: error.message });
    }
});

/* ══════════════════════════════════════════════════════════════════════════════
   FUNÇÃO 2 — verificarAssinatura (chamada pelo auth.js do frontend via SDK)
   Verifica em cascata: customClaim → subscribers → pendingSubscribers
   ══════════════════════════════════════════════════════════════════════════════ */
exports.verificarAssinatura = functions.https.onCall(async (data, context) => {

    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login necessário");
    }

    const uid   = context.auth.uid;
    const email = context.auth.token.email || "";
    const db    = admin.firestore();

    /* ── 1. Verifica custom claim (mais rápido) ─────────────────────────────── */
    const user = await admin.auth().getUser(uid);
    if (user.customClaims?.isSubscriber === true) {
        return { isSubscriber: true, source: "customClaim" };
    }

    /* ── 2. Verifica subscribers/{uid} ─────────────────────────────────────── */
    const docUid = await db.collection("subscribers").doc(uid).get();
    if (docUid.exists) {
        const d = docUid.data();
        if (d.isSubscriber === true && d.statusAssinatura !== "Cancelado") {
            // Reconstrói o custom claim caso esteja faltando
            await admin.auth().setCustomUserClaims(uid, { isSubscriber: true });
            return { isSubscriber: true, source: "firestore_uid" };
        }
    }

    /* ── 3. Verifica subscribers/{email} (formato legado) ───────────────────── */
    if (email) {
        const docEmail = await db.collection("subscribers").doc(email).get();
        if (docEmail.exists && docEmail.data().isSubscriber === true) {
            // Migra para formato novo (uid)
            await admin.auth().setCustomUserClaims(uid, { isSubscriber: true });
            await db.collection("subscribers").doc(uid)
                .set({ ...docEmail.data(), uid, migratedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
            await db.collection("subscribers").doc(email).delete();
            return { isSubscriber: true, source: "firestore_email_migrated" };
        }

        /* ── 4. Verifica pendingSubscribers (comprou antes de criar conta) ──── */
        const pending = await db.collection("pendingSubscribers").doc(email).get();
        if (pending.exists && pending.data().isSubscriber === true) {
            // Migra pendente → ativo
            const dados = { ...pending.data(), uid, email, migratedAt: admin.firestore.FieldValue.serverTimestamp() };
            await admin.auth().setCustomUserClaims(uid, { isSubscriber: true });
            await db.collection("subscribers").doc(uid).set(dados, { merge: true });
            await db.collection("pendingSubscribers").doc(email).delete();
            console.log(`✅ Pendente migrado ao login: ${email} → subscribers/${uid}`);
            return { isSubscriber: true, source: "pending_migrated" };
        }
    }

    return { isSubscriber: false };
});

/* ══════════════════════════════════════════════════════════════════════════════
   FUNÇÃO 3 — onCreateUser
   Dispara automaticamente quando qualquer usuário se cadastra via Google/Gmail.
   Adiciona uma linha na planilha "Portal Rainha - Controle Manual de Assinaturas"
   com: Data | Nome | E-mail | Status

   PRÉ-REQUISITOS (fazer UMA VEZ antes do deploy):
   ─────────────────────────────────────────────────
   1. No Google Cloud Console → APIs → ativar "Google Sheets API"
      https://console.cloud.google.com/apis/library/sheets.googleapis.com?project=rainha-aa80a

   2. Adicionar como EDITOR na planilha o e-mail da conta de serviço:
      733791452283-compute@developer.gserviceaccount.com

   3. No arquivo .env, substituir COLE_O_ID_DA_PLANILHA_AQUI pelo ID real
      (o ID fica na URL entre /d/ e /edit)

   COLUNA DA PLANILHA:
      A = Data do cadastro
      B = Nome
      C = E-mail
      D = Status ("Apenas Cadastro")
   ══════════════════════════════════════════════════════════════════════════════ */
exports.onCreateUser = functions.auth.user().onCreate(async (user) => {

    const spreadsheetId = process.env.SHEETS_ID || "";
    const tabName       = process.env.SHEETS_TAB || "Página1";

    /* Valida a configuração */
    if (!spreadsheetId || spreadsheetId === "COLE_O_ID_DA_PLANILHA_AQUI") {
        console.warn("⚠️  SHEETS_ID não configurado no .env — pulando registro na planilha.");
        return null;
    }

    const nome  = user.displayName || "(sem nome)";
    const email = user.email       || "(sem email)";
    const uid   = user.uid;

    /* Data/hora no fuso de Brasília */
    const agora = new Date().toLocaleString("pt-BR", {
        timeZone:  "America/Sao_Paulo",
        day:       "2-digit",
        month:     "2-digit",
        year:      "numeric",
        hour:      "2-digit",
        minute:    "2-digit"
    });

    console.log(`👤 Novo cadastro: ${nome} | ${email} | uid: ${uid}`);

    try {
        /* ── Autenticação via Application Default Credentials (ADC) ──────────
           Funciona automaticamente no ambiente Cloud Functions.
           Não precisa de arquivo de chave — usa a conta de serviço do projeto. */
        const { google } = require("googleapis");

        const auth   = new google.auth.GoogleAuth({
            scopes: ["https://www.googleapis.com/auth/spreadsheets"]
        });
        const sheets = google.sheets({ version: "v4", auth });

        /* ── Append na primeira linha vazia após os dados existentes ──────── */
        const range = `${tabName}!A:H`;

        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range,
            valueInputOption:       "USER_ENTERED",
            insertDataOption:       "INSERT_ROWS",
            includeValuesInResponse: false,
            requestBody: {
                values: [[
                    nome,             // A — Nome
                    email,            // B — E-mail
                    "Apenas Cadastro",// C — Status
                    "",               // D — Tipo de Plano
                    agora,            // E — Data
                    "",               // F — Expiração
                    "",               // G — ID Transação
                    ""                // H — Notas
                ]]
            }
        });

        /* ── Salva também no Firestore para auditoria ────────────────────── */
        await admin.firestore()
            .collection("userEmails")
            .doc(email)
            .set({
                uid,
                email,
                displayName:   nome,
                cadastradoEm:  admin.firestore.FieldValue.serverTimestamp(),
                statusPlanilha: "Apenas Cadastro"
            }, { merge: true });

        console.log(`✅ Linha adicionada na planilha: [${agora}, ${nome}, ${email}, Apenas Cadastro]`);
        return null;

    } catch (err) {
        /* Loga o erro mas não deixa a função explodir — o cadastro do usuário
           no Firebase Auth NÃO é afetado por erro nesta função. */
        console.error("❌ Erro ao gravar na planilha:", err.message);
        return null;
    }
});

/* ══════════════════════════════════════════════════════════════════════════════
   FUNÇÃO 4 — ativarAssinantePlanilha
   Endpoint HTTP chamado pelo Google Apps Script quando o status muda para "Ativa".
   Recebe: { email, status, token }
   URL: https://us-central1-rainha-aa80a.cloudfunctions.net/ativarAssinantePlanilha
   ══════════════════════════════════════════════════════════════════════════════ */
exports.ativarAssinantePlanilha = functions.https.onRequest(async (req, res) => {

    /* Permite chamadas do Apps Script (CORS) */
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, x-webhook-token");
    if (req.method === "OPTIONS") return res.status(204).send("");
    if (req.method !== "POST") return res.status(405).send("Method Not Allowed");

    /* ── Verificação de segurança ─────────────────────────────────────────── */
    const tokenRecebido  = req.body?.token || req.headers["x-webhook-token"] || "";
    const tokenEsperado  = process.env.SHEETS_WEBHOOK_TOKEN || "";

    if (!tokenEsperado || tokenRecebido !== tokenEsperado) {
        console.error("❌ Token inválido — requisição do Apps Script bloqueada.");
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }

    const { email, status } = req.body;
    if (!email) return res.status(400).json({ status: "error", message: "E-mail obrigatório" });

    const emailNorm  = email.trim().toLowerCase();
    const isAtivar   = ["ativa", "ativo", "ativo"].includes((status || "").trim().toLowerCase());
    const isCancelar = ["cancelada", "cancelado", "inativa", "inativo"].includes((status || "").trim().toLowerCase());

    const actionLog = isAtivar ? "ATIVAR" : (isCancelar ? "CANCELAR" : "IGNORAR");
    console.log(`📋 Apps Script → ${actionLog}: ${emailNorm} | status lido: "${status}"`);

    /* ── Localiza usuário no Firebase Auth ───────────────────────────────── */
    let userRecord = null;
    let uidToUse = emailNorm; // Usa o próprio número/email como UID se não houver conta Auth
    try {
        userRecord = await admin.auth().getUserByEmail(emailNorm);
        uidToUse = userRecord.uid;
    } catch (_) {
        console.warn(`Usuário ${emailNorm} não tem conta Auth. Usando contato como UID local.`);
    }

    const db  = admin.firestore();
    const now = admin.firestore.FieldValue.serverTimestamp();

    if (isAtivar) {
        const dataExpiracao = new Date();
        dataExpiracao.setDate(dataExpiracao.getDate() + 32);

        /* Custom Claim (Apenas se tiver conta Auth real) */
        if (userRecord) {
            await admin.auth().setCustomUserClaims(uidToUse, {
                isSubscriber: true,
                subscribedAt: new Date().toISOString()
            });
        }

        /* subscribers/{uid} - Aqui é onde o site lê! */
        await db.collection("subscribers").doc(uidToUse).set({
            email: emailNorm, uid: uidToUse,
            isSubscriber: true, statusAssinatura: "Ativo",
            dataExpiracao: admin.firestore.Timestamp.fromDate(dataExpiracao),
            ativadoEm: now, fonte: "planilha_manual"
        }, { merge: true });

        /* users/{uid} */
        await db.collection("users").doc(uidToUse).set({
            statusAssinatura: "Ativo",
            dataExpiracao: admin.firestore.Timestamp.fromDate(dataExpiracao),
            atualizadoEm: now
        }, { merge: true });

        console.log(`✅ Ativado via planilha: ${emailNorm} | uid: ${uidToUse}`);
        return res.status(200).json({
            status: "success",
            message: `${emailNorm} ativada com sucesso no Firebase`,
            uid: uidToUse
        });
    }

    if (isCancelar) {
        await admin.auth().setCustomUserClaims(userRecord.uid, { isSubscriber: false });
        await db.collection("subscribers").doc(userRecord.uid).set({
            isSubscriber: false, statusAssinatura: "Cancelado", canceladoEm: now
        }, { merge: true });
        await db.collection("users").doc(userRecord.uid).set({
            statusAssinatura: "Cancelado", canceladoEm: now
        }, { merge: true });

        console.log(`🚫 Cancelado via planilha: ${emailNorm}`);
        return res.status(200).json({ status: "success", message: `${emailNorm} desativada` });
    }

    return res.status(200).json({ status: "ignored", message: `Status "${status}" não requer ação.` });
});

/* ══════════════════════════════════════════════════════════════════════════════
   FUNÇÃO 5 — exportarUsuarios  (migração única)
   Exporta TODOS os usuários existentes no Firebase Auth para a planilha.
   Chamada via GET (uma só vez, no browser):
   https://us-central1-rainha-aa80a.cloudfunctions.net/exportarUsuarios?token=rainha_sheets_sync_2026
   ══════════════════════════════════════════════════════════════════════════════ */
exports.exportarUsuarios = functions
    .runWith({ timeoutSeconds: 540, memory: "512MB" })
    .https.onRequest(async (req, res) => {

    /* Segurança via query param */
    const token = req.query.token || "";
    if (token !== (process.env.SHEETS_WEBHOOK_TOKEN || "")) {
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }

    const spreadsheetId = process.env.SHEETS_ID;
    const tabName       = process.env.SHEETS_TAB || "Portal Rainha - Controle Manual de Assinaturas";

    if (!spreadsheetId) {
        return res.status(500).json({ status: "error", message: "SHEETS_ID não configurado" });
    }

    try {
        const { google } = require("googleapis");
        const auth   = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
        const sheets = google.sheets({ version: "v4", auth });
        const db     = admin.firestore();

        /* ── Lista todos os usuários do Auth (paginado) ───────────────────── */
        let allUsers = [];
        let pageToken;
        do {
            const result = await admin.auth().listUsers(1000, pageToken);
            allUsers     = allUsers.concat(result.users);
            pageToken    = result.pageToken;
        } while (pageToken);

        console.log(`📦 Total de usuários no Auth: ${allUsers.length}`);

        /* ── Verifica quais já estão na planilha (lê coluna B = E-mail) ───── */
        const existingData = await sheets.spreadsheets.values.get({
            spreadsheetId, range: `${tabName}!B:B`
        });
        const emailsNaPlanilha = new Set(
            (existingData.data.values || []).flat().map(e => (e || "").trim().toLowerCase())
        );

        /* ── Monta as linhas apenas dos usuários que NÃO estão na planilha ── */
        const rows = [];
        for (const user of allUsers) {
            const emailUser = (user.email || "").trim().toLowerCase();
            if (!emailUser || emailsNaPlanilha.has(emailUser)) continue; // pula duplicatas

            /* Verifica status no Firestore */
            const doc     = await db.collection("subscribers").doc(user.uid).get();
            const isAtivo = doc.exists && doc.data().isSubscriber === true
                            && doc.data().statusAssinatura !== "Cancelado";
            const status  = isAtivo ? "Ativa" : "Apenas Cadastro";

            const data = user.metadata?.creationTime
                ? new Date(user.metadata.creationTime).toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" })
                : "N/A";

            rows.push([
                user.displayName || "(sem nome)", // A - Nome
                user.email || "",                 // B - E-mail
                status,                           // C - Status
                "",                               // D - Tipo de Plano
                data,                             // E - Data
                "",                               // F - Expiração
                "",                               // G - ID Transação
                ""                                // H - Notas
            ]);
        }

        if (rows.length === 0) {
            return res.status(200).json({
                status: "success",
                message: "Todos os usuários já estão na planilha.",
                total: allUsers.length, adicionados: 0
            });
        }

        /* ── Insere as linhas na planilha ────────────────────────────────── */
        await sheets.spreadsheets.values.append({
            spreadsheetId,
            range: `${tabName}!A:H`,
            valueInputOption: "USER_ENTERED",
            insertDataOption: "INSERT_ROWS",
            requestBody: { values: rows }
        });

        console.log(`✅ ${rows.length} usuários exportados para a planilha.`);
        return res.status(200).json({
            status: "success",
            message: `${rows.length} usuários adicionados à planilha (${allUsers.length} total no Auth).`,
            adicionados: rows.length
        });

    } catch (err) {
        console.error("❌ Erro na exportação:", err.message);
        return res.status(500).json({ status: "error", message: err.message });
    }
});

/* ══════════════════════════════════════════════════════════════════════════════
   FUNÇÃO 6 — exportarVotos
   Exporta o total de votos por categoria (pilar) para a aba "Votos do Dia".
   Chamada via GET (URL no browser):
   https://us-central1-rainha-aa80a.cloudfunctions.net/exportarVotos?token=rainha_sheets_sync_2026
   ══════════════════════════════════════════════════════════════════════════════ */
exports.exportarVotos = functions
    .runWith({ timeoutSeconds: 60, memory: "256MB" })
    .https.onRequest(async (req, res) => {

    /* Segurança via query param */
    const token = req.query.token || "";
    if (token !== (process.env.SHEETS_WEBHOOK_TOKEN || "")) {
        return res.status(401).json({ status: "error", message: "Token inválido" });
    }

    const spreadsheetId = process.env.SHEETS_ID;
    const tabName       = "Votos do Dia";

    if (!spreadsheetId) {
        return res.status(500).json({ status: "error", message: "SHEETS_ID não configurado" });
    }

    try {
        const { google } = require("googleapis");
        const auth   = new google.auth.GoogleAuth({ scopes: ["https://www.googleapis.com/auth/spreadsheets"] });
        const sheets = google.sheets({ version: "v4", auth });
        const db     = admin.firestore();

        // 1. Buscar todos os votos na coleção
        const votosSnapshot = await db.collection("votos").get();
        let counts = {
            "Pele (Pel)": 0,
            "Manipulação (Man)": 0,
            "Posicionamento (Pos)": 0,
            "Aperfeiçoamento (Ape)": 0
        };
        
        let totalVotos = 0;

        votosSnapshot.forEach(doc => {
            const data = doc.data();
            const pilar = data.pilar;
            
            totalVotos++;
            if (pilar === "Pel") counts["Pele (Pel)"]++;
            else if (pilar === "Man") counts["Manipulação (Man)"]++;
            else if (pilar === "Pos") counts["Posicionamento (Pos)"]++;
            else if (pilar === "Ape") counts["Aperfeiçoamento (Ape)"]++;
            // Caso existam votos antigos, pode agrupá-los em "Outros" se desejar adicionar
        });

        // 2. Montar as linhas para a planilha
        const rows = [
            ["Categoria / Pilar do Círculo", "Total de Votos", "Percentual de Interesse"],
        ];
        
        for (const [key, val] of Object.entries(counts)) {
            let pct = totalVotos > 0 ? ((val / totalVotos) * 100).toFixed(1) + "%" : "0%";
            rows.push([key, val, pct]);
        }
        
        rows.push([]);
        rows.push(["Total Geral", totalVotos, "100%"]);
        rows.push(["Última Atualização", new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" }), ""]);

        // 3. Limpar a planilha atual e escrever os novos dados (overwrite)
        try {
            await sheets.spreadsheets.values.clear({
                spreadsheetId,
                range: `${tabName}!A:C`
            });
        } catch (e) {
            // Se a aba não existe, e.message conterá algo como "Unable to parse range"
            console.log("Aba 'Votos do Dia' não encontrada. Tentando criar automaticamente...");
            await sheets.spreadsheets.batchUpdate({
                spreadsheetId,
                requestBody: {
                    requests: [{
                        addSheet: {
                            properties: { title: tabName }
                        }
                    }]
                }
            });
        }

        await sheets.spreadsheets.values.update({
            spreadsheetId,
            range: `${tabName}!A1`,
            valueInputOption: "USER_ENTERED",
            requestBody: { values: rows }
        });

        console.log(`✅ Votos exportados com sucesso! Total: ${totalVotos}`);
        return res.status(200).json({
            status: "success",
            message: "Resultados da votação atualizados na planilha na aba 'Votos do Dia'.",
            totalVotos: totalVotos,
            resultados: counts
        });

    } catch (error) {
        console.error("❌ Erro ao exportar votos:", error);
        return res.status(500).json({ status: "error", message: error.message });
    }
});
