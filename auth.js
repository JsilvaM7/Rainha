/* ══════════════════════════════════════════════════════════════════════════════
   SeniorHub — Auth + Sidebar  |  v10.0
   Estados distintos: isLoggedIn (autenticado) vs isSubscriber (assinante pago)
   ══════════════════════════════════════════════════════════════════════════════ */

/* ── Webhook para captura de leads (substitua pela URL real) ────────────────── */
var RAINHA_WEBHOOK_URL = 'https://script.google.com/macros/s/AKfycbyJwrA4ajxUi7_eolnY17x--tL2ZqJSqZPT758A4eABkruFEcVs0JpEtZu4u0yXoMk/exec';

window.CLUBE_CHECKOUT_URL = window.CLUBE_CHECKOUT_URL || 'https://pay.hotmart.com/E105391945G?bid=1776289319139';

/* ── Estado global ──────────────────────────────────────────────────────────── */
var _currentUser  = null;
var _isSubscriber = false;

var fbAuth     = null;
var fbProvider = null;

/* ── API pública ────────────────────────────────────────────────────────────── */
window.SeniorAuth = {
    getUser()        { return _currentUser; },
    isLoggedIn()     { return !!_currentUser; },
    isSubscriber()   { return _isSubscriber; },
    isMember()       { return _isSubscriber; },

    loginComGoogle: function() {
        /* ⚠️ Desativado — agora usamos captura por e-mail/WhatsApp (RainhaCaptura) */
        console.info('[Auth] loginComGoogle desativado. Use RainhaCaptura.acessar().');
    },

    logout: function() {
        if (fbAuth) fbAuth.signOut().then(function() { _atualizarUI(null); });
        else _atualizarUI(null);
    },

    ativarAssinante: function() {
        if (!_currentUser) { alert('Faça login primeiro.'); return; }
        _isSubscriber = true;
        _atualizarUI(_currentUser);
        alert('✅ Modo assinante ativado para teste!');
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   CAPTURA POR E-MAIL / WHATSAPP
   ══════════════════════════════════════════════════════════════════════════════ */
window.RainhaCaptura = {

    /* Cria um objeto de usuário sintético a partir do contato digitado */
    _criarUsuario: function(contato) {
        return {
            displayName: contato,
            email:       contato,
            photoURL:    null,
            uid:         'local_' + contato.replace(/[^a-z0-9]/gi, '_')
        };
    },

    /* Envia o lead ao webhook (não bloqueia a UI em caso de falha) */
    _enviarWebhook: function(contato) {
        if (!RAINHA_WEBHOOK_URL) return;

        /* Detecta se é e-mail ou WhatsApp para preencher os campos certos */
        var isEmail  = contato.indexOf('@') !== -1;
        var payload  = {
            nome:      isEmail ? '' : contato,   /* WhatsApp / nome livre */
            email:     isEmail ? contato : '',   /* E-mail */
            contato:   contato,                  /* Campo genérico (backup) */
            origem:    'portal_rainha',
            timestamp: new Date().toISOString()
        };

        /* Google Apps Script aceita melhor application/x-www-form-urlencoded via no-cors */
        var params = Object.keys(payload).map(function(k) {
            return encodeURIComponent(k) + '=' + encodeURIComponent(payload[k]);
        }).join('&');

        fetch(RAINHA_WEBHOOK_URL + '?' + params, {
            method: 'GET',
            mode:   'no-cors'
        }).catch(function(e) {
            console.warn('[RainhaCaptura] Erro ao enviar webhook:', e.message);
        });
    },

    /* Chamado pelo botão "Acessar" do modal ou sidebar */
    acessar: function(origem) {
        var inputId = (origem === 'modal') ? 'eng-contato-input' : 'lsb-contato-input';
        var el      = document.getElementById(inputId);
        var contato = el ? el.value.trim() : '';

        if (!contato) {
            if (el) { el.focus(); el.style.borderColor = '#c0392b'; }
            return;
        }

        /* 1. Salva no localStorage */
        localStorage.setItem('rainha_contato', contato);
        console.log('[RainhaCaptura] Contato salvo:', contato);

        /* 2. Envia ao webhook (assíncrono, não bloqueia) */
        window.RainhaCaptura._enviarWebhook(contato);

        /* 3. Cria usuário sintético e libera navegação */
        var usuario = window.RainhaCaptura._criarUsuario(contato);
        _isSubscriber = false; /* conta gratuita por padrão */
        _atualizarUI(usuario);

        /* 4. Fecha modal/sidebar conforme origem */
        if (origem === 'modal' && window._fecharEngagementModal) window._fecharEngagementModal();
        if (origem === 'sidebar' && window.fecharSideBar) window.fecharSideBar();
    },

    /* Restaura sessão do localStorage ao carregar a página */
    restaurarSessao: function() {
        var contato = localStorage.getItem('rainha_contato');
        if (!contato) return;
        /* Só restaura se não há usuário Firebase já logado */
        if (_currentUser) return;
        console.log('[RainhaCaptura] Sessão restaurada do localStorage:', contato);
        var usuario = window.RainhaCaptura._criarUsuario(contato);
        _isSubscriber = false;
        _atualizarUI(usuario);
    }
};

/* ══════════════════════════════════════════════════════════════════════════════
   SIDEBAR
   ══════════════════════════════════════════════════════════════════════════════ */
function _criarSideBar() {
    if (document.getElementById('login-sidebar')) return;
    var ov = document.createElement('div');
    ov.id = 'login-overlay';
    ov.onclick = function() { window.fecharSideBar(); };
    document.body.appendChild(ov);
    var sb = document.createElement('div');
    sb.id = 'login-sidebar';
    sb.innerHTML =
        '<div class="lsb-header">' +
            '<span class="lsb-titulo">Minha Conta</span>' +
            '<button class="lsb-close" onclick="window.fecharSideBar()">&times;</button>' +
        '</div>' +
        '<div id="lsb-body"></div>';
    document.body.appendChild(sb);
}

window.abrirSideBar = function() {
    if (!document.body) { setTimeout(window.abrirSideBar, 50); return; }
    _criarSideBar();
    _renderSideBarBody();
    document.getElementById('login-sidebar').classList.add('lsb--open');
    document.getElementById('login-overlay').classList.add('lsb-overlay--open');
};

window.fecharSideBar = function() {
    var sb = document.getElementById('login-sidebar');
    var ov = document.getElementById('login-overlay');
    if (sb) sb.classList.remove('lsb--open');
    if (ov) ov.classList.remove('lsb-overlay--open');
};

/* ══════════════════════════════════════════════════════════════════════════════
   RENDER HEADER
   ══════════════════════════════════════════════════════════════════════════════ */
function _renderHeaderBtn() {
    var slot = document.getElementById('auth-slot');
    if (!slot) return;

    if (!_currentUser) {
        slot.innerHTML =
            '<button class="login-btn" onclick="window.abrirSideBar()">' +
                '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' +
                    '<circle cx="12" cy="8" r="4"/>' +
                    '<path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>' +
                '</svg>' +
                'Login' +
            '</button>';
    } else {
        var nome   = (_currentUser.displayName || 'Usuário').split(' ')[0];
        var avatar = _currentUser.photoURL ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome) + '&background=C5A059&color=fff&size=64';
        slot.innerHTML =
            '<button class="login-btn login-btn--logged" onclick="window.abrirSideBar()">' +
                '<img src="' + avatar + '" alt="' + nome + '" class="login-btn-avatar" ' +
                    'onerror="this.src=\'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome) + '&background=C5A059&color=fff&size=64\'">' +
                'Olá, ' + nome +
            '</button>';
    }
}

/* ══════════════════════════════════════════════════════════════════════════════
   RENDER SIDEBAR BODY
   ══════════════════════════════════════════════════════════════════════════════ */
function _renderSideBarBody() {
    var body = document.getElementById('lsb-body');
    if (!body) return;

    var googleSVG =
        '<svg width="20" height="20" viewBox="0 0 48 48" style="flex-shrink:0">' +
        '<path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.7 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.4 13 17.8 9.5 24 9.5z"/>' +
        '<path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 7.1-10 7.1-17z"/>' +
        '<path fill="#FBBC05" d="M10.4 28.7A14.6 14.6 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>' +
        '<path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.8l-7.8 6C6.6 42.6 14.6 48 24 48z"/>' +
        '</svg>';

    if (!_currentUser) {
        body.innerHTML =
            '<div class="lsb-section">' +
                '<div class="lsb-icon-wrap">' +
                    '<svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#C5A059" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">' +
                        '<circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>' +
                    '</svg>' +
                '</div>' +
                '<p class="lsb-bemvindo">Olá! Informe seu contato<br>para acessar o portal.</p>' +
                '<div class="eng-capture-wrap" style="flex-direction:column;gap:8px;">' +
                    '<input type="text" id="lsb-contato-input" class="eng-contato-input" placeholder="Digite seu E-mail ou WhatsApp" autocomplete="off"' +
                    ' onkeydown="if(event.key===\'Enter\') window.RainhaCaptura && window.RainhaCaptura.acessar(\'sidebar\')"/>' +
                    '<button class="eng-acessar-btn" style="width:100%;" onclick="window.RainhaCaptura && window.RainhaCaptura.acessar(\'sidebar\')">Acessar</button>' +
                '</div>' +
            '</div>' +
            '<div class="lsb-divider"><span>ou torne-se membro</span></div>' +
            '<div class="lsb-section">' +
                '<p class="lsb-label">⭐ Assinar o Círculo Rainha</p>' +
                '<p class="lsb-desc">Acesse todos os livros, vote nos tópicos e ganhe descontos exclusivos.</p>' +
                '<a href="' + window.CLUBE_CHECKOUT_URL + '" target="_blank" rel="noopener noreferrer" class="lsb-clube-btn" onclick="window.fecharSideBar()">Assinar Clube — R$ 28/mês</a>' +
                '<p class="lsb-fine">✓ Acesso imediato &nbsp;·&nbsp; ✓ Cancele quando quiser</p>' +
            '</div>';
        return;
    }

    var nome   = _currentUser.displayName || 'Usuário';
    var email  = _currentUser.email || '';
    var avatar = _currentUser.photoURL ||
        'https://ui-avatars.com/api/?name=' + encodeURIComponent(nome) + '&background=C5A059&color=fff&size=128';

    if (!_isSubscriber) {
        body.innerHTML =
            '<div class="lsb-section lsb-section--user">' +
                '<img src="' + avatar + '" alt="' + nome + '" class="lsb-avatar">' +
                '<div>' +
                    '<p class="lsb-nome">' + nome + '</p>' +
                    '<p class="lsb-email">' + email + '</p>' +
                    '<span style="display:inline-block;background:#f1f5f9;color:#64748b;' +
                        'font-size:11px;font-weight:700;padding:2px 10px;border-radius:20px;">' +
                        'Conta Gratuita' +
                    '</span>' +
                '</div>' +
            '</div>' +
            '<div style="height:1px;background:#f0e8d4;margin:0 20px;"></div>' +
            '<div class="lsb-section">' +
                '<p class="lsb-label">⭐ Torne-se Assinante</p>' +
                '<p class="lsb-desc">Assine o Círculo Rainha e acesse todos os guias exclusivos.</p>' +
                '<a href="' + window.CLUBE_CHECKOUT_URL + '" target="_blank" rel="noopener noreferrer" class="lsb-clube-btn" onclick="window.fecharSideBar()">Assinar Clube — R$ 28/mês</a>' +
                '<p class="lsb-fine">✓ Acesso imediato &nbsp;·&nbsp; ✓ Cancele quando quiser</p>' +
            '</div>' +
            '<div style="height:1px;background:#f0e8d4;margin:0 20px;"></div>' +
            '<div class="lsb-section">' +
                '<button class="lsb-logout-btn" onclick="window.SeniorAuth.logout(); window.fecharSideBar();">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                        '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
                        '<polyline points="16 17 21 12 16 7"/>' +
                        '<line x1="21" y1="12" x2="9" y2="12"/>' +
                    '</svg> Sair da conta' +
                '</button>' +
                '<a href="https://www.instagram.com/circulorainha?igsh=YXhzMjNnejEyY3Fo" target="_blank" rel="noopener noreferrer" class="lsb-social-btn lsb-instagram-btn">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">' +
                        '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>' +
                        '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>' +
                        '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>' +
                    '</svg>' +
                    'Siga no Instagram' +
                '</a>' +
                '<a href="https://wa.me/5511967013874" target="_blank" rel="noopener noreferrer" class="lsb-social-btn lsb-whatsapp-btn">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">' +
                        '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
                        '<path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.586 3.843 1.594 5.398L2.055 22l4.744-1.521A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 12 2zm0 18.18a8.175 8.175 0 0 1-4.169-1.145l-.299-.176-3.094.99.995-3.023-.194-.311A8.181 8.181 0 1 1 11.999 20.18z"/>' +
                    '</svg>' +
                    '<span>' +
                        '<span style="display:block;font-size:12.5px;font-weight:600;line-height:1.3;">Consultoria de conversas via WhatsApp</span>' +
                        '<span style="display:block;font-size:11px;opacity:.8;line-height:1.3;">R$ 15 / 30min &nbsp;·&nbsp; <em>Pagamento via PIX</em></span>' +
                    '</span>' +
                '</a>' +
            '</div>';
        return;
    }

    body.innerHTML =
        '<div class="lsb-section lsb-section--user">' +
            '<img src="' + avatar + '" alt="' + nome + '" class="lsb-avatar">' +
            '<div>' +
                '<p class="lsb-nome">' + nome + '</p>' +
                '<p class="lsb-email">' + email + '</p>' +
                '<span class="lsb-badge">✅ Assinante Ativo</span>' +
            '</div>' +
        '</div>' +
        '<div style="height:1px;background:#f0e8d4;margin:0 20px;"></div>' +
        '<div class="lsb-section">' +
            '<p class="lsb-label">🏆 Seus Benefícios</p>' +
            '<div class="lsb-beneficios">' +
                '<div class="lsb-beneficio">📖 Acesso a todos os guias</div>' +
                '<div class="lsb-beneficio">🗳️ Votação exclusiva de tópicos de notícias</div>' +
                '<div class="lsb-beneficio">🏷️ Descontos em lojas parceiras</div>' +
            '</div>' +
        '</div>' +
        '<div style="height:1px;background:#f0e8d4;margin:0 20px;"></div>' +
        '<div class="lsb-section">' +
            '<button class="lsb-logout-btn" onclick="window.SeniorAuth.logout(); window.fecharSideBar();">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' +
                    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>' +
                    '<polyline points="16 17 21 12 16 7"/>' +
                    '<line x1="21" y1="12" x2="9" y2="12"/>' +
                '</svg> Sair da conta' +
            '</button>' +
            '<a href="https://www.instagram.com/circulorainha?igsh=YXhzMjNnejEyY3Fo" target="_blank" rel="noopener noreferrer" class="lsb-social-btn lsb-instagram-btn">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0">' +
                    '<rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>' +
                    '<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>' +
                    '<line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>' +
                '</svg>' +
                'Siga no Instagram' +
            '</a>' +
            '<a href="https://wa.me/5511967013874" target="_blank" rel="noopener noreferrer" class="lsb-social-btn lsb-whatsapp-btn">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">' +
                    '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>' +
                    '<path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.586 3.843 1.594 5.398L2.055 22l4.744-1.521A9.956 9.956 0 0 0 12 22c5.523 0 10-4.477 10-10S17.522 2 12 2zm0 18.18a8.175 8.175 0 0 1-4.169-1.145l-.299-.176-3.094.99.995-3.023-.194-.311A8.181 8.181 0 1 1 11.999 20.18z"/>' +
                '</svg>' +
                '<span>' +
                    '<span style="display:block;font-size:12.5px;font-weight:600;line-height:1.3;">Consultoria de conversas via WhatsApp</span>' +
                    '<span style="display:block;font-size:11px;opacity:.8;line-height:1.3;">R$ 15 / 30min &nbsp;·&nbsp; <em>Pagamento via PIX</em></span>' +
                '</span>' +
            '</a>' +
        '</div>';
}

/* ══════════════════════════════════════════════════════════════════════════════
   MODAL DE VOTAÇÃO
   ══════════════════════════════════════════════════════════════════════════════ */
window.renderModalConteudo = function() {
    var body = document.getElementById('modal-body');
    if (!body) return;

    if (!_currentUser) {
        body.innerHTML =
            '<div style="text-align:center;padding:8px 0 16px;">' +
                '<div style="font-size:44px;margin-bottom:12px;">🔐</div>' +
                '<h3 style="font-size:18px;font-weight:800;color:var(--text-dark);margin-bottom:10px;">Entre para participar</h3>' +
                '<p style="font-size:14px;color:var(--text-muted);margin-bottom:20px;line-height:1.6;">Faça login com o Google para acessar os benefícios do Clube.</p>' +
                '<button class="lsb-google-btn" style="width:100%;justify-content:center;box-sizing:border-box;" ' +
                    'onclick="if(window.toggleModal)toggleModal();setTimeout(window.abrirSideBar,300);">Entrar com Google</button>' +
                '<div style="margin-top:16px;padding-top:16px;border-top:1px solid #f0e8d4;">' +
                    '<a href="' + window.CLUBE_CHECKOUT_URL + '" target="_blank" rel="noopener noreferrer" class="lsb-clube-btn">⭐ Assinar Clube — R$ 28/mês</a>' +
                '</div>' +
            '</div>';
        return;
    }

    if (!_isSubscriber) {
        var primeiroNome = (_currentUser.displayName || 'você').split(' ')[0];
        body.innerHTML =
            '<div style="text-align:center;padding:8px 0;">' +
                '<div style="font-size:36px;margin-bottom:10px;">👋</div>' +
                '<p style="font-size:15px;font-weight:700;color:var(--text-dark);margin-bottom:6px;">Olá, ' + primeiroNome + '!</p>' +
                '<p style="font-size:13px;color:var(--text-muted);margin-bottom:20px;line-height:1.6;">Você está logado, mas a votação e os benefícios exclusivos são para assinantes do Clube.</p>' +
            '</div>' +
            '<a href="' + window.CLUBE_CHECKOUT_URL + '" target="_blank" rel="noopener noreferrer" class="lsb-clube-btn" style="display:block;text-align:center;">⭐ Assinar Clube — R$ 28/mês</a>' +
            '<p style="font-size:11px;color:var(--text-muted);text-align:center;margin-top:10px;">✓ Acesso imediato &nbsp;·&nbsp; ✓ Cancele quando quiser</p>';
        return;
    }

    var nome = (_currentUser.displayName || 'você').split(' ')[0];
    body.innerHTML =
        '<div style="background:#f0fdf4;border:1px solid #86efac;border-radius:10px;padding:12px 16px;text-align:center;margin-bottom:20px;color:#166534;font-weight:700;font-size:14px;">✅ Olá, ' + nome + '! Você é assinante ativo.</div>' +
        '<div style="height:1px;background:#efefef;margin-bottom:16px;"></div>' +
        '<p style="font-size:14px;font-weight:700;color:var(--sage-green-dark);text-transform:uppercase;letter-spacing:.5px;margin-bottom:10px;">🗳️ Votação do Dia</p>' +
        '<p style="font-size:14px;color:var(--text-muted);margin-bottom:14px;">O que você quer ver mais na próxima semana?</p>' +
        '<button class="vote-btn" onclick="submitVote(\'Pel\')">Pele</button>' +
        '<button class="vote-btn" onclick="submitVote(\'Man\')">Manipulação</button>' +
        '<button class="vote-btn" onclick="submitVote(\'Pos\')">Posicionamento</button>' +
        '<button class="vote-btn" onclick="submitVote(\'Ape\')">Aperfeiçoamento</button>' +
        '<p style="font-size:11px;color:var(--text-muted);margin-top:14px;">Seu voto ajuda a construir o portal dos seus sonhos.</p>';
};

/* ══════════════════════════════════════════════════════════════════════════════
   ATUALIZA TODA A UI
   ══════════════════════════════════════════════════════════════════════════════ */
function _atualizarUI(user) {
    _currentUser = user;
    if (!user) _isSubscriber = false;
    _renderHeaderBtn();
    _renderSideBarBody();
    if (window.renderModalConteudo) window.renderModalConteudo();
    if (window.renderAd) window.renderAd();
}

/* ══════════════════════════════════════════════════════════════════════════════
   HELPERS — conversão de e-mail para formatos usados como ID no Firestore
   Alguns admins antigos salvavam o e-mail com @ e . substituídos por _
   ══════════════════════════════════════════════════════════════════════════════ */
function _emailParaDocId(email) {
    /* Converte "user@gmail.com" → "user_at_gmail_com"  (padrão do admin antigo) */
    return email.replace('@', '_at_').replace(/\./g, '_');
}

/* ══════════════════════════════════════════════════════════════════════════════
   MIGRAÇÃO DE PENDENTES — tenta os 3 formatos possíveis de ID
   ══════════════════════════════════════════════════════════════════════════════ */
function _verificarPendingEMigrar(db, user, onNaoEncontrado) {
    var emailReal    = user.email;                    /* julioynvest@gmail.com  */
    var emailLegacy  = _emailParaDocId(user.email);  /* julioynvest_at_gmail_com */

    /* Tenta o formato correto (e-mail) primeiro */
    db.collection('pendingSubscribers').doc(emailReal).get()
        .then(function(pending) {
            if (pending.exists) {
                _migrarPendente(db, user, pending, emailReal);
                return;
            }

            /* Não achou — tenta o formato legado (underscores) */
            db.collection('pendingSubscribers').doc(emailLegacy).get()
                .then(function(pendingLegacy) {
                    if (pendingLegacy.exists) {
                        console.log('[Auth] Encontrado pendente no formato legado:', emailLegacy);
                        _migrarPendente(db, user, pendingLegacy, emailLegacy);
                        return;
                    }

                    /* Última tentativa: query por campo email */
                    db.collection('pendingSubscribers')
                        .where('email', '==', emailReal).limit(1).get()
                        .then(function(snap) {
                            if (!snap.empty) {
                                var doc = snap.docs[0];
                                console.log('[Auth] Encontrado pendente via query:', doc.id);
                                _migrarPendente(db, user, doc, doc.id);
                            } else {
                                /* Nada encontrado — conta gratuita */
                                onNaoEncontrado();
                            }
                        })
                        .catch(function() { onNaoEncontrado(); });
                })
                .catch(function() { onNaoEncontrado(); });
        })
        .catch(function() { onNaoEncontrado(); });
}

function _migrarPendente(db, user, pendingDoc, docIdParaDeletar) {
    var dados          = pendingDoc.data();
    dados.uid          = user.uid;
    dados.email        = user.email;
    dados.isSubscriber = true;
    dados.migratedAt   = firebase.firestore.FieldValue.serverTimestamp();
    dados.activatedBy  = 'pending_migration';

    db.collection('subscribers').doc(user.uid).set(dados, { merge: true })
        .then(function() {
            return db.collection('pendingSubscribers').doc(docIdParaDeletar).delete();
        })
        .then(function() {
            console.log('[Auth] ✅ Assinante migrado com sucesso:', user.email, '→ subscribers/' + user.uid);
            _isSubscriber = true;
            _atualizarUI(user);
        })
        .catch(function(e) {
            console.warn('[Auth] Erro na migração:', e.message);
            /* Mesmo com erro na deleção do pendente, considera assinante */
            _isSubscriber = true;
            _atualizarUI(user);
        });
}

/* ══════════════════════════════════════════════════════════════════════════════
   FIREBASE INIT
   ══════════════════════════════════════════════════════════════════════════════ */
try {
    if (typeof firebase !== 'undefined') {
        var cfg = {
            apiKey:            "AIzaSyCBz9R_hIX0WtIQ4O1SQml5UyJrYhhFlV8",
            authDomain:        "rainhavenus.e-dolphin.info",
            projectId:         "rainha-aa80a",
            storageBucket:     "rainha-aa80a.firebasestorage.app",
            messagingSenderId: "733791452283",
            appId:             "1:733791452283:web:9a8dbce4bce45758c636de",
            measurementId:     "G-444SSPGWKL"
        };
        if (!firebase.apps.length) firebase.initializeApp(cfg);
        fbAuth     = firebase.auth();
        fbProvider = new firebase.auth.GoogleAuthProvider();
        fbProvider.setCustomParameters({ prompt: 'select_account' });

        fbAuth.getRedirectResult().then(function(r) {
            if (r && r.user) _atualizarUI(r.user);
        }).catch(function(e) { console.warn('[Auth]', e.message); });

        fbAuth.onAuthStateChanged(function(user) {
            if (!user) {
                _isSubscriber = false;
                _atualizarUI(null);
                return;
            }

            var db = firebase.firestore();

            /* ── Registra/atualiza userEmails ── */
            db.collection('userEmails').doc(user.email).set({
                uid:         user.uid,
                email:       user.email,
                displayName: user.displayName || '',
                photoURL:    user.photoURL    || '',
                lastLogin:   firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).catch(function(e) {
                console.warn('[Auth] userEmails write:', e.message);
            });

            /* ── 1. Verifica custom claim ── */
            user.getIdTokenResult(true).then(function(token) {
                _isSubscriber = token.claims.isSubscriber === true;

                if (_isSubscriber) {
                    _atualizarUI(user);
                    return;
                }

                /* ── 2. Verifica subscribers/{uid} ── */
                db.collection('subscribers').doc(user.uid).get()
                    .then(function(doc) {
                        if (doc.exists && doc.data().isSubscriber === true) {
                            _isSubscriber = true;
                            _atualizarUI(user);
                            return;
                        }

                        /* ── 3. Verifica subscribers/{email} (doc criado com e-mail como ID) ── */
                        db.collection('subscribers').doc(user.email).get()
                            .then(function(docEmail) {
                                if (docEmail.exists && docEmail.data().isSubscriber === true) {
                                    /* Migra: cria com UID e remove o antigo com e-mail */
                                    var d = docEmail.data();
                                    d.uid = user.uid;
                                    db.collection('subscribers').doc(user.uid).set(d, { merge: true })
                                        .then(function() {
                                            db.collection('subscribers').doc(user.email).delete();
                                            console.log('[Auth] ✅ Migrado subscribers/' + user.email + ' → subscribers/' + user.uid);
                                            _isSubscriber = true;
                                            _atualizarUI(user);
                                        })
                                        .catch(function() {
                                            _isSubscriber = true;
                                            _atualizarUI(user);
                                        });
                                    return;
                                }

                                /* ── 4. Verifica pendingSubscribers (todos os formatos) ── */
                                _verificarPendingEMigrar(db, user, function() {
                                    /* Não encontrou nada — conta gratuita */
                                    _atualizarUI(user);
                                });
                            })
                            .catch(function() {
                                _verificarPendingEMigrar(db, user, function() {
                                    _atualizarUI(user);
                                });
                            });
                    })
                    .catch(function() { _atualizarUI(user); });

            }).catch(function() {
                _isSubscriber = false;
                _atualizarUI(user);
            });

            /* ── Listener em Tempo Real (Limpeza de Cache) ── */
            if (window._unsubscribeUserSnap) window._unsubscribeUserSnap();
            window._unsubscribeUserSnap = db.collection('users').doc(user.uid)
                .onSnapshot(function(doc) {
                    if (doc.exists && doc.data().statusAssinatura === 'Ativo') {
                        if (!_isSubscriber) {
                            console.log('[Auth] Status ativo detectado no Firestore. Atualizando cache da sessão...');
                            user.getIdToken(true).then(function() {
                                _isSubscriber = true;
                                _atualizarUI(user);
                                // Força o refresh visual da tela se a pessoa estiver na vitrine
                                if (window.location.reload) window.location.reload();
                            });
                        }
                    }
                }, function(error) {
                    console.warn('[Auth] Erro ao ouvir usuário:', error);
                });

        });
    }
} catch(e) {
    console.warn('[Rainha Auth]', e.message);
}

/* ══════════════════════════════════════════════════════════════════════════════
   INIT
   ══════════════════════════════════════════════════════════════════════════════ */
function _init() {
    _criarSideBar();
    _renderHeaderBtn();
    if (window.renderModalConteudo) window.renderModalConteudo();
    /* Restaura sessão do localStorage após 1s (dá prioridade ao Firebase auth) */
    setTimeout(function() {
        if (window.RainhaCaptura) window.RainhaCaptura.restaurarSessao();
    }, 1000);
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
} else {
    _init();
}
