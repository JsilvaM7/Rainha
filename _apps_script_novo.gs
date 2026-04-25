/* ═══════════════════════════════════════════════════════════════════════
   Portal Rainha — Apps Script v3.0
   API ÚNICA da Planilha: registra novo contato + retorna status atual
   
   COMO FUNCIONA:
   1. Portal chama: ?contato=11999999999&callback=fn
   2. Script verifica se o número já existe na planilha
   3. Se não existe → adiciona linha nova com "Apenas Cadastro"
   4. Retorna o status atual (ex: "Ativa" ou "Apenas Cadastro")
   5. Portal lê o status e libera acesso Premium se "Ativa"
   ═══════════════════════════════════════════════════════════════════════ */

function doGet(e) {
  var contato  = (e.parameter.contato  || '').toString().trim();
  var callback = (e.parameter.callback || '').toString().trim();

  /* ── Validação básica ─────────────────────────────────────────────── */
  if (!contato) {
    return _responder({ error: 'contato_obrigatorio' }, callback);
  }

  try {
    var ss      = SpreadsheetApp.getActiveSpreadsheet();
    var sheet   = ss.getSheets()[0];
    var lastRow = sheet.getLastRow();
    var lastCol = Math.max(sheet.getLastColumn(), 10);

    /* ── Identifica colunas pelo cabeçalho (tolerante a espaços) ───── */
    var headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0];
    var idxNome   = _acharColuna(headers, 'nome');
    var idxEmail  = _acharColuna(headers, 'e-mail');
    var idxStatus = _acharColuna(headers, 'status da assinatura');

    /* ── Procura se o número já está cadastrado ────────────────────── */
    var linhaExistente = -1;
    var statusAtual    = 'Apenas Cadastro';

    if (lastRow > 1 && idxEmail !== -1) {
      var emailValues = sheet.getRange(2, idxEmail + 1, lastRow - 1, 1).getValues();
      for (var i = 0; i < emailValues.length; i++) {
        if (emailValues[i][0].toString().trim() === contato) {
          linhaExistente = i + 2; /* +2 = começa na linha 2 */
          if (idxStatus !== -1) {
            statusAtual = sheet.getRange(linhaExistente, idxStatus + 1)
                               .getValue().toString().trim();
          }
          break;
        }
      }
    }

    /* ── Se não existe, adiciona linha nova ────────────────────────── */
    var eNovo = false;
    if (linhaExistente === -1) {
      var novaLinha = new Array(lastCol).fill('');
      if (idxNome   !== -1) novaLinha[idxNome]   = contato;
      if (idxEmail  !== -1) novaLinha[idxEmail]  = contato;
      if (idxStatus !== -1) novaLinha[idxStatus] = 'Apenas Cadastro';
      sheet.appendRow(novaLinha);
      statusAtual = 'Apenas Cadastro';
      eNovo = true;
    }

    /* ── Define se é assinante ativa ───────────────────────────────── */
    var statusLower  = statusAtual.toLowerCase();
    var eAssinante   = (statusLower === 'ativa' || statusLower === 'ativo' || statusLower === 'active');

    return _responder({
      status:       statusAtual,
      isSubscriber: eAssinante,
      isNew:        eNovo,
      contato:      contato
    }, callback);

  } catch (err) {
    return _responder({ error: err.message }, callback);
  }
}

/* ── Helper: resposta JSON ou JSONP ─────────────────────────────────── */
function _responder(obj, callback) {
  var json = JSON.stringify(obj);
  if (callback) {
    return ContentService
      .createTextOutput(callback + '(' + json + ')')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}

/* ── Helper: acha índice da coluna pelo nome (case insensitive) ─────── */
function _acharColuna(headers, nomeAlvo) {
  for (var i = 0; i < headers.length; i++) {
    if (headers[i].toString().trim().toLowerCase() === nomeAlvo) return i;
  }
  return -1;
}
