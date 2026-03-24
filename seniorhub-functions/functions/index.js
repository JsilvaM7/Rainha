const functions = require("firebase-functions");
const admin     = require("firebase-admin");

admin.initializeApp();

/* ══════════════════════════════════════════════════════════════════════════════
   Webhook Hotmart → Firebase
   URL final: https://us-central1-seniorhub-7c725.cloudfunctions.net/hotmartWebhook
   ══════════════════════════════════════════════════════════════════════════════ */
exports.hotmartWebhook = functions.https.onRequest(async (req, res) => {

    /* Só aceita POST */
    if (req.method !== "POST") {
        return res.status(405).send("Method Not Allowed");
    }

    try {
        const body = req.body;

        /* ── Log para debug (visível no Firebase Console → Functions → Logs) ── */
        console.log("Hotmart webhook recebido:", JSON.stringify(body));

        /* ── Evento de compra aprovada ──────────────────────────────────────── */
        const evento = body.event || (body.data && body.data.purchase && body.data.purchase.status);

        const eventosAprovados = [
            "PURCHASE_APPROVED",
            "PURCHASE_COMPLETE",
            "APPROVED"
        ];

        const isAprovado = eventosAprovados.some(e =>
            String(evento).toUpperCase().includes(e)
        );

        if (!isAprovado) {
            console.log("Evento ignorado:", evento);
            return res.status(200).json({ status: "ignored", event: evento });
        }

        /* ── Extrai e-mail do comprador ─────────────────────────────────────── */
        const email =
            (body.data && body.data.buyer && body.data.buyer.email) ||
            (body.buyer && body.buyer.email) ||
            body.email ||
            null;

        if (!email) {
            console.error("E-mail não encontrado no payload:", JSON.stringify(body));
            return res.status(400).json({ status: "error", message: "Email não encontrado" });
        }

        console.log("Ativando assinante:", email);

        /* ── Busca usuário no Firebase Auth pelo e-mail ─────────────────────── */
        let userRecord;
        try {
            userRecord = await admin.auth().getUserByEmail(email);
        } catch (e) {
            console.error("Usuário não encontrado no Firebase:", email, e.message);
            /* Salva pendente no Firestore para ativar quando o usuário criar conta */
            await admin.firestore()
                .collection("pendingSubscribers")
                .doc(email.replace("@", "_at_"))
                .set({
                    email,
                    isSubscriber: true,
                    activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                    source: "hotmart_webhook"
                });
            return res.status(200).json({
                status: "pending",
                message: "Usuário ainda não criou conta — salvo como pendente"
            });
        }

        /* ── Seta custom claim isSubscriber: true ───────────────────────────── */
        await admin.auth().setCustomUserClaims(userRecord.uid, {
            isSubscriber: true,
            subscribedAt: new Date().toISOString()
        });

        /* ── Salva também no Firestore como backup ──────────────────────────── */
        await admin.firestore()
            .collection("subscribers")
            .doc(userRecord.uid)
            .set({
                email,
                uid: userRecord.uid,
                isSubscriber: true,
                activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: "hotmart_webhook"
            }, { merge: true });

        console.log("Assinante ativado com sucesso:", email, userRecord.uid);

        return res.status(200).json({
            status: "success",
            message: "Assinante ativado",
            uid: userRecord.uid
        });

    } catch (error) {
        console.error("Erro no webhook:", error);
        return res.status(500).json({ status: "error", message: error.message });
    }
});

/* ══════════════════════════════════════════════════════════════════════════════
   Verifica assinatura ao logar — chamada pelo auth.js do frontend
   ══════════════════════════════════════════════════════════════════════════════ */
exports.verificarAssinatura = functions.https.onCall(async (data, context) => {

    /* Requer autenticação */
    if (!context.auth) {
        throw new functions.https.HttpsError("unauthenticated", "Login necessário");
    }

    const uid   = context.auth.uid;
    const email = context.auth.token.email;

    /* 1. Verifica custom claim */
    const user = await admin.auth().getUser(uid);
    if (user.customClaims && user.customClaims.isSubscriber === true) {
        return { isSubscriber: true, source: "customClaim" };
    }

    /* 2. Verifica Firestore */
    const doc = await admin.firestore().collection("subscribers").doc(uid).get();
    if (doc.exists && doc.data().isSubscriber === true) {
        /* Atualiza o custom claim se estava faltando */
        await admin.auth().setCustomUserClaims(uid, { isSubscriber: true });
        return { isSubscriber: true, source: "firestore" };
    }

    /* 3. Verifica pendentes (comprou antes de criar conta) */
    if (email) {
        const pending = await admin.firestore()
            .collection("pendingSubscribers")
            .doc(email.replace("@", "_at_"))
            .get();
        if (pending.exists && pending.data().isSubscriber === true) {
            /* Migra para ativo */
            await admin.auth().setCustomUserClaims(uid, { isSubscriber: true });
            await admin.firestore().collection("subscribers").doc(uid).set({
                email, uid, isSubscriber: true,
                activatedAt: admin.firestore.FieldValue.serverTimestamp(),
                source: "pending_migrated"
            }, { merge: true });
            return { isSubscriber: true, source: "pending_migrated" };
        }
    }

    return { isSubscriber: false };
});
