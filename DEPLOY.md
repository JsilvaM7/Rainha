# Deploy Firebase Functions — SeniorHub

## Pré-requisitos
- Node.js instalado (https://nodejs.org)
- Conta Google com acesso ao projeto seniorhub-7c725
- Firebase no Plano Blaze ✅ (já feito)

---

## Passo 1 — Instalar Firebase CLI
Abra o terminal (CMD ou PowerShell) e rode:
```
npm install -g firebase-tools
```

## Passo 2 — Fazer login
```
firebase login
```
Vai abrir o browser para autenticar com sua conta Google.

## Passo 3 — Entrar na pasta
```
cd caminho/para/seniorhub-functions
```
Exemplo Windows:
```
cd C:\Users\Lenovo\Desktop\seniorhub-functions
```

## Passo 4 — Instalar dependências
```
cd functions
npm install
cd ..
```

## Passo 5 — Deploy
```
firebase deploy --only functions
```

## Resultado esperado
```
✔ functions: Finished running predeploy script.
✔ Deploy complete!

Function URL (hotmartWebhook):
https://us-central1-seniorhub-7c725.cloudfunctions.net/hotmartWebhook
```

---

## Testar o Webhook

Cole este comando no terminal para simular uma compra aprovada:

```
curl -X POST https://us-central1-seniorhub-7c725.cloudfunctions.net/hotmartWebhook ^
  -H "Content-Type: application/json" ^
  -d "{\"event\":\"PURCHASE_APPROVED\",\"data\":{\"buyer\":{\"email\":\"SEU_EMAIL@gmail.com\"}}}"
```

Resposta esperada:
```json
{"status":"success","message":"Assinante ativado","uid":"..."}
```

---

## Ver logs em tempo real
No Firebase Console → Functions → Logs
Ou no terminal:
```
firebase functions:log
```

---

## URL para a Hotmart
```
https://us-central1-seniorhub-7c725.cloudfunctions.net/hotmartWebhook
```
Esta URL já está configurada no painel da Hotmart. ✅
