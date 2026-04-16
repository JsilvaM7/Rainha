/* ── Link do Clube (espelho do auth.js para uso no app.js) ─────────────────── */
window.CLUBE_CHECKOUT_URL = window.CLUBE_CHECKOUT_URL || 'https://pay.hotmart.com/E105391945G';

/* ── Links Google Drive — acesso exclusivo de assinantes (/preview = iframe sem barra) ── */
const EBOOK_LINKS = {
    1: 'https://drive.google.com/file/d/1gmM8fOlRrWDuptQwIaivytbQeriTOAuc/preview',
    2: 'https://drive.google.com/file/d/1BgZxiOdUcnRAQVEanJJ3RRW3WVFY-Yin/preview',
    3: 'https://drive.google.com/file/d/1_cFQQH7e0nZsg8JkD_6Bmbfh1R8C7p84/preview',
    4: 'https://drive.google.com/file/d/1eAHSCB3E5dsO9ubi2s3_91ZpxJBlT95H/preview',
    5: 'https://drive.google.com/file/d/1dMJHFfTVykmTXWQtToJUu8Pf2bEi1JXQ/preview'
};

document.addEventListener('DOMContentLoaded', () => {
    loadNewsFeed();
    initAdShowcase();
});

/* ── Modal ──────────────────────────────────────────────────────────────────── */
function toggleModal() {
    document.getElementById('voting-modal').classList.toggle('active');
}

function submitVote(theme) {
    const user = window.SeniorAuth ? window.SeniorAuth.getUser() : null;
    if (!user) {
        alert('Faça login para votar! Clique em "Entrar com Google" no cabeçalho.');
        return;
    }
    const isSub = window.SeniorAuth && window.SeniorAuth.isSubscriber();
    if (!isSub) {
        // Logado mas não assinante → abre modal explicando
        toggleModal();
        return;
    }
    const primeiroNome = (user.displayName || user.nome || 'amigo').split(' ')[0];
    alert(`✅ Voto registrado para: ${theme}! Obrigado, ${primeiroNome}!`);
    toggleModal();
}
/* ── State Tracking ─────────────────────────────────────────────────────────── */
let livroAtual = null; // Guarda a chave do livro aberto (ex: 'energia')

/* ── Funnel helpers ─────────────────────────────────────────────────────────── */
function isLocked(id) {
    // Assinante pago tem acesso completo a todas as receitas no site
    if (window.SeniorAuth && window.SeniorAuth.isSubscriber()) return false;
    if (!livroAtual) return false;
    const bookArr = window.biblioteca[livroAtual] || [];
    const idx = bookArr.findIndex(r => r.id === id);
    return idx >= 5; // não-assinante: só 5 receitas grátis por livro
}

/* ── Navigation ─────────────────────────────────────────────────────────────── */
function loadRecipesFeed() {
    setActiveLink('');
    livroAtual = null; // Reseta o estado
    loadBooksShowcase();
}

function handleRecipeClick(id) {
    loadRecipe(id);
}

function handleBookClick(bookNum) {
    const bookInfo = window.BOOKS[bookNum];
    if (!bookInfo) return;

    // Assinante e não-assinante → mesmo fluxo de portal.
    // isLocked() já retorna false para assinantes, liberando todas as 50 receitas.
    if (bookInfo.key) {
        livroAtual = bookInfo.key;
        const bookArr = window.biblioteca[bookInfo.key] || [];
        const firstId = bookArr.length > 0 ? bookArr[0].id : 1;
        loadRecipe(firstId);
    }
}

/* ── Visualizador PDF Integrado (apenas assinantes) ──────────────────────── */
function renderPDFViewer(bookNum, bookInfo) {
    const viewer = document.getElementById('content-viewer');
    const driveUrl = EBOOK_LINKS[bookNum];
    const title = bookInfo.title || `Livro ${bookNum}`;

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.style.cssText = 'padding:0; overflow:hidden; display:flex; flex-direction:column; min-height:85vh;';
    wrapper.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between;
                    padding:14px 20px; background:#fafaf8;
                    border-bottom:1.5px solid var(--sage-green); flex-shrink:0;">
            <div style="display:flex; align-items:center; gap:12px;">
                <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                          color:var(--sage-green); margin:0; cursor:pointer;"
                   onclick="event.preventDefault(); loadBooksShowcase()">← Biblioteca</p>
                <span style="color:#d1d5db;">|</span>
                <span style="font-size:14px; font-weight:700; color:#374151;">${title}</span>
            </div>
            <span style="display:inline-flex; align-items:center; gap:5px; background:#f0fdf4;
                         color:#166534; font-weight:700; font-size:12px; padding:4px 12px;
                         border-radius:20px; border:1px solid #86efac; flex-shrink:0;">
                ✅ Acesso de Assinante
            </span>
        </div>
        <iframe
            src="${driveUrl}"
            allow="autoplay"
            style="flex:1; width:100%; min-height:78vh; border:none; display:block;"
            title="${title} — SeniorHub"
        ></iframe>
        <div style="padding:10px 20px; text-align:center; border-top:1px solid #e5e7eb;
                    font-size:12px; color:var(--text-muted); flex-shrink:0; background:#fafaf8;">
            Role o PDF acima para ler todas as 50 receitas &nbsp;·&nbsp;
            <span style="cursor:pointer; color:var(--sage-green); font-weight:700;"
                  onclick="loadBooksShowcase()">Escolher outro livro →</span>
        </div>
    `;

    swapContent(viewer, wrapper);
}

/* ── Books Showcase Vitrine ─────────────────────────────────────────────────── */
function loadBooksShowcase() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <!-- Dois botões Véu acima dos livros -->
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:36px;">
            <!-- Botão 1: O Véu da Juventude -->
            <button onclick="renderVeuConteudo('veu-juventude')" style="
                background: linear-gradient(135deg, #4A0404 0%, #8B0000 60%, #c62828 100%);
                color: #fff; border: 1px solid rgba(200,0,0,0.4);
                border-radius: 16px; padding: 24px 20px;
                text-align: left; cursor: pointer;
                box-shadow: 0 4px 20px rgba(139,0,0,0.3);
                transition: box-shadow 0.25s, transform 0.2s;
                font-family: inherit;
            " onmouseover="this.style.boxShadow='0 8px 32px rgba(180,0,0,0.5)'; this.style.transform='translateY(-3px)'"
               onmouseout="this.style.boxShadow='0 4px 20px rgba(139,0,0,0.3)'; this.style.transform='translateY(0)'">
                <div style="font-size:28px; margin-bottom:10px;">💋</div>
                <div style="font-family:'Playfair Display',serif; font-size:15px; font-weight:900; letter-spacing:0.3px; margin-bottom:6px; line-height:1.3;">O Véu da Juventude</div>
                <div style="font-size:12px; color:rgba(255,180,180,0.75); line-height:1.5;">Segredos para a Pele que Seduz sem Palavras</div>
            </button>

            <!-- Botão 2: A Pintura da Sereia -->
            <button onclick="renderVeuConteudo('pintura-sereia')" style="
                background: linear-gradient(135deg, #1a0a0a 0%, #3d0a0a 60%, #8B0000 100%);
                color: #fff; border: 1px solid rgba(200,0,0,0.35);
                border-radius: 16px; padding: 24px 20px;
                text-align: left; cursor: pointer;
                box-shadow: 0 4px 20px rgba(74,4,4,0.4);
                transition: box-shadow 0.25s, transform 0.2s;
                font-family: inherit;
            " onmouseover="this.style.boxShadow='0 8px 32px rgba(139,0,0,0.5)'; this.style.transform='translateY(-3px)'"
               onmouseout="this.style.boxShadow='0 4px 20px rgba(74,4,4,0.4)'; this.style.transform='translateY(0)'">
                <div style="font-size:28px; margin-bottom:10px;">🧜‍♀️</div>
                <div style="font-family:'Playfair Display',serif; font-size:15px; font-weight:900; letter-spacing:0.3px; margin-bottom:6px; line-height:1.3;">A Pintura da Sereia</div>
                <div style="font-size:12px; color:rgba(255,180,180,0.75); line-height:1.5;">Traços de Maquiagem que Hipnotizam e Seduzem</div>
            </button>
        </div>

        <div style="text-align:center; margin-bottom:32px;">
            <span style="display:inline-block; background:rgba(139,0,0,0.1); color:#8B0000; font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; padding:4px 14px; border-radius:20px; margin-bottom:14px; border:1px solid rgba(139,0,0,0.2);">Círculo Rainha — Biblioteca</span>
            <h1 style="font-family:'Playfair Display',serif; font-size:26px; font-weight:900; color:#1a0a0a; margin-bottom:8px;">Os Cinco Livros do Domínio</h1>
            <p style="color:var(--text-muted); font-size:15px;">Cada volume é um nível de inteligência feminina revelado</p>
        </div>
        <div class="books-showcase">
            ${(() => {
                const isSub = window.SeniorAuth && window.SeniorAuth.isSubscriber();
                return Object.entries(window.BOOKS).map(([num, book]) => {
                    if (isSub) {
                        return `
                        <div style="display:flex; align-items:center; gap:12px; width:100%;
                                    background:#fff; border:1.5px solid rgba(139,0,0,0.3);
                                    border-radius:16px; padding:16px 20px;
                                    box-shadow:0 2px 10px rgba(139,0,0,0.08);">
                            <div class="book-info" style="flex:1; min-width:0;">
                                <div class="book-num">Vol. ${num}
                                    <span style="font-size:10px;background:#8B0000;color:#fff;
                                                 padding:1px 7px;border-radius:20px;vertical-align:middle;">
                                        ✓ Incluso
                                    </span>
                                </div>
                                <div class="book-title">${book.title}</div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                                <button onclick="window.handleBookClick(${num})"
                                        style="background:#8B0000;color:#fff;border:none;
                                               border-radius:8px;padding:8px 16px;font-size:13px;
                                               font-weight:700;cursor:pointer;white-space:nowrap;">
                                    💋 Ler no Portal
                                </button>
                            </div>
                        </div>`;
                    } else {
                        return `
                        <button class="book-showcase-btn" onclick="window.handleBookClick(${num})">
                            <div class="book-info">
                                <div class="book-num">Vol. ${num}</div>
                                <div class="book-title">${book.title}</div>
                            </div>
                            <i class="ph ph-caret-right" style="font-size:22px;color:#8B0000;flex-shrink:0;"></i>
                        </button>`;
                    }
                }).join('');
            })()}
        </div>
    `;
    swapContent(viewer, wrapper);
}

/* ── Véu Content — Paywall de Luxo ──────────────────────────────────────────
   Tipo: 'veu-juventude' | 'pintura-sereia'
   Página 1 → magnética e livre. Páginas 2-11 → modal veludo carmesim.        */

const VEU_CONTENT = {
    'veu-juventude': {
        icon: '💋',
        titulo: 'O Véu da Juventude',
        subtitulo: 'Segredos para a Pele que Seduz sem Palavras',
        paginas: [
            {
                titulo: 'O Segredo que a Pele Revela Antes de Você Falar',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Antes de você pronunciar uma única palavra, sua pele já narrou uma história inteira. Ele percebe o brilho suave ao redor dos seus olhos, a textura que convida ao toque, o aroma que antecede qualquer abraço.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <em>"A pele que fala ao instinto dele antes de você dizer uma palavra"</em> — essa é a primeira lei do magnetismo feminino que nenhum perfume, nenhum vestido e nenhuma retórica pode substituir.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Este é apenas o pórtico. O que vem a seguir são os <strong style="color:#8B0000;">11 segredos de regeneração e sedução da pele</strong> que mulheres magnéticas guardam como rituais noturnos, longe dos olhos do mundo.
                </p>`
            }
        ]
    },
    'pintura-sereia': {
        icon: '🎭',
        titulo: 'A Pintura da Sereia',
        subtitulo: 'Traços de Maquiagem que Hipnotizam e Seduzem',
        paginas: [
            {
                titulo: 'O Olhar que Ancora e Não Liberta',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    A sereia não seduzia com palavras. Ela era um quadro vivo, uma composição de sombras e luz calculada para paralisar qualquer homem que a contemplasse.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    O traço certo nos lábios não é maquiagem — é uma <em>declaração de território</em>. O delineado perfeito não é vaidade — é <em>arquitetura de poder</em>. Cada pincelada é uma decisão estratégica sobre qual versão de si mesma você tornará impossível de esquecer.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Esta é a abertura. Nas páginas seguintes estão os <strong style="color:#8B0000;">11 traços secretos da sereia</strong> — técnicas que mulheres extraordinárias usam para criar uma presença visual que permanece na memória dele muito depois que você saiu da sala.
                </p>`
            }
        ]
    }
};

/* Injeta o modal DOM apenas uma vez */
function ensureVelvetModal() {
    if (document.getElementById('velvet-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'velvet-modal-overlay';
    overlay.className = 'velvet-modal-overlay';
    overlay.innerHTML = `
        <div class="velvet-modal-box">
            <button class="velvet-modal-close" onclick="closeVelvetModal()">&times;</button>
            <div class="velvet-modal-icon">🔴</div>
            <div class="velvet-modal-title">Este sussurro é apenas para quem já despertou.</div>
            <p class="velvet-modal-text">
                Reivindique sua face oculta e domine o jogo no Círculo Rainha. O acesso completo a todos os segredos está reservado para as iniciadas.
            </p>
            <a href="${window.CLUBE_CHECKOUT_URL || 'https://pay.hotmart.com/B105027530C'}"
               target="_blank" rel="noopener noreferrer"
               class="velvet-modal-btn">
                👑 Entrar no Círculo Rainha →
            </a>
            <p class="velvet-modal-subtext">Acesso imediato · Cancele quando quiser</p>
        </div>
    `;
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) closeVelvetModal();
    });
    document.body.appendChild(overlay);
}

function openVelvetModal() {
    ensureVelvetModal();
    const overlay = document.getElementById('velvet-modal-overlay');
    overlay.style.display = 'flex';
    requestAnimationFrame(() => overlay.classList.add('active'));
}

function closeVelvetModal() {
    const overlay = document.getElementById('velvet-modal-overlay');
    if (!overlay) return;
    overlay.classList.remove('active');
    setTimeout(() => { overlay.style.display = 'none'; }, 400);
}

function renderVeuConteudo(tipo) {
    const isSub = window.SeniorAuth && window.SeniorAuth.isSubscriber();
    const config = VEU_CONTENT[tipo];
    if (!config) return;

    const viewer = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';

    // ── Página 1 — sempre visível ──────────────────────────────────────────
    const pag1 = config.paginas[0];
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:#8B0000; margin-bottom:20px; cursor:pointer;"
           onclick="loadBooksShowcase()">← Biblioteca</p>

        <div style="text-align:center; margin-bottom:36px;">
            <div style="font-size:48px; margin-bottom:12px;
                        filter:drop-shadow(0 0 12px rgba(200,0,0,0.5));">${config.icon}</div>
            <h1 style="font-family:'Playfair Display',serif; font-size:28px; font-weight:900;
                       background:linear-gradient(135deg,#4A0404,#8B0000,#c62828,#8B0000);
                       -webkit-background-clip:text; -webkit-text-fill-color:transparent;
                       background-clip:text; margin-bottom:8px;">${config.titulo}</h1>
            <p style="color:#6b4a4a; font-size:14px; font-style:italic;">${config.subtitulo}</p>
        </div>

        <!-- Página 1 — Livre e Magnética -->
        <div style="background:#fff; border:1px solid rgba(139,0,0,0.15); border-radius:16px; padding:36px; margin-bottom:28px;">
            <div style="display:inline-block; background:rgba(139,0,0,0.08); color:#8B0000;
                        font-size:10px; font-weight:800; letter-spacing:1px; text-transform:uppercase;
                        padding:4px 14px; border-radius:99px; margin-bottom:18px;
                        border:1px solid rgba(139,0,0,0.2);">Página 1 de 11</div>
            <h2 style="font-family:'Playfair Display',serif; font-size:21px; font-weight:900;
                       color:#1a0a0a; margin-bottom:20px; line-height:1.35;">${pag1.titulo}</h2>
            ${pag1.corpo}
        </div>

        <!-- Prévia das páginas bloqueadas (2-11) -->
        <div style="display:flex; flex-direction:column; gap:10px;">
            ${Array.from({length:10}, (_, i) => `
                <button onclick="openVelvetModal()"
                        style="background:#faf0f0; border:1px solid rgba(139,0,0,0.2);
                               border-radius:12px; padding:18px 24px; cursor:pointer;
                               display:flex; align-items:center; justify-content:space-between;
                               transition:background .2s, box-shadow .2s; font-family:inherit;"
                        onmouseover="this.style.background='#f5e5e5'; this.style.boxShadow='0 4px 14px rgba(139,0,0,0.12)'"
                        onmouseout="this.style.background='#faf0f0'; this.style.boxShadow='none'">
                    <div style="display:flex; align-items:center; gap:14px;">
                        <span style="width:28px; height:28px; background:rgba(139,0,0,0.1);
                                     border-radius:50%; display:flex; align-items:center; justify-content:center;
                                     font-size:12px; color:#8B0000; font-weight:800; flex-shrink:0;">
                            ${i+2}
                        </span>
                        <span style="font-family:'Playfair Display',serif; font-size:15px;
                                     color:#2d0808; font-weight:700;">
                            🔒 Segredo ${i+2} — Acesso Exclusivo
                        </span>
                    </div>
                    <span style="color:#8B0000; font-size:18px;">›</span>
                </button>
            `).join('')}
        </div>

        <!-- CTA no final -->
        <div style="margin-top:32px; text-align:center; background:linear-gradient(135deg,#1a0a0a,#2d0808);
                    border-radius:20px; padding:40px 32px; border:1px solid rgba(200,0,0,0.3);">
            <div style="font-size:36px; margin-bottom:12px;">👑</div>
            <h3 style="font-family:'Playfair Display',serif; color:#fff; font-size:20px;
                       font-weight:900; margin-bottom:12px; line-height:1.4;">
                Desperte as 10 páginas restantes
            </h3>
            <p style="color:rgba(255,190,190,0.75); font-size:14px; margin-bottom:24px; line-height:1.7;">
                Cada segredo escondido é um nível de poder que ainda não ativou. O Círculo Rainha é o lugar onde as iniciadas chegam antes de todos os outros.
            </p>
            <button onclick="openVelvetModal()"
                    class="velvet-modal-btn" style="width:auto; padding:14px 40px;">
                Reivindique sua face oculta →
            </button>
        </div>
    `;

    swapContent(viewer, wrapper);
}

/* ── Book Summary View ──────────────────────────────────────────────────────── */
function loadBookSummary() {
    if (!livroAtual) return;

    const viewer = document.getElementById('content-viewer');
    const bookMeta = Object.values(window.BOOKS).find(b => b.key === livroAtual);
    const bookArr = window.biblioteca[livroAtual] || [];

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                  color:var(--sage-green); margin-bottom:16px; cursor:pointer;"
           onclick="event.preventDefault(); loadBooksShowcase()">← Vitrine de Livros</p>
        <h1 class="recipe-title" style="font-size:26px; margin-bottom:6px;">${bookMeta ? bookMeta.title : 'Sumário'}</h1>
        <p style="text-align:center; color:var(--text-muted); font-size:14px; margin-bottom:32px;">
            50 receitas — clique em qualquer título para explorar
        </p>

        <div style="border-top:2px solid var(--sage-green); padding-top:24px;">
            <h2 style="font-size:13px; font-weight:700; text-transform:uppercase;
                       letter-spacing:.6px; color:var(--sage-green-dark); margin-bottom:14px;">
                Sumário da Coleção
            </h2>
            <ol class="recipe-summary-grid">
                ${bookArr.map((r, idx) => {
        const pos = String(idx + 1).padStart(2, '0');
        const rTitle = r.title || r.titulo || '(sem título)';
        return `<li class="summary-item">
                        <a class="summary-link" onclick="handleRecipeClick(${r.id}); event.preventDefault(); return false;" href="#">
                            <span class="summary-num">${pos}.</span>${rTitle}
                        </a>
                    </li>`;
    }).join('')}
            </ol>
        </div>
    `;

    swapContent(viewer, wrapper);
}

/* ── Recipe Detail View ─────────────────────────────────────────────────────── */
function loadRecipe(id) {
    id = parseInt(id, 10);
    if (!livroAtual) return;

    const viewer = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';

    const bookMeta = Object.values(window.BOOKS).find(b => b.key === livroAtual);
    const bookArr = window.biblioteca[livroAtual] || [];
    const recipe = bookArr.find(r => r.id === id);

    // Só assinante pago acessa receitas bloqueadas (logado ≠ assinante)
    const isSubscriber = window.SeniorAuth && window.SeniorAuth.isSubscriber();

    if (!recipe && !isSubscriber) {
        wrapper.innerHTML = `<p style="padding:40px; text-align:center; color:var(--text-muted)">Receita não encontrada neste livro.</p>`;
    } else if ((isLocked(id) || (recipe && recipe.locked)) && !isSubscriber) {
        // Não assinante → paywall por livro (link individual Hotmart)
        wrapper.innerHTML = renderPaywallHTML(bookMeta);
    } else if (!recipe) {
        wrapper.innerHTML = `<p style="padding:40px; text-align:center; color:var(--text-muted)">Receita não encontrada neste livro.</p>`;
    } else {
        wrapper.innerHTML = renderRecipeHTML(recipe, bookMeta, isSubscriber);
    }

    swapContent(viewer, wrapper);
}


/* ── Swap helper (reusable slide-out + unroll-in) ───────────────────────────── */
function swapContent(viewer, newEl) {
    // Scrola a tela para o topo do conteúdo de forma suave, mas rápida
    window.scrollTo({
        top: Math.max(0, viewer.offsetTop - 80),
        behavior: 'smooth'
    });

    // Limpa imediatamente o conteúdo do viewer e injeta o novo de forma estática
    viewer.innerHTML = '';
    viewer.appendChild(newEl);
}

/* ── Recipe HTML renderer ───────────────────────────────────────────────────── */
// bookMeta passados para montar os botões de navegação corretos.
function renderRecipeHTML(recipe, bookMeta, isSubscriber) {
    // Suporte a todos os schemas: EN (title/prepTime/steps/ingredients/utensils)
    // e PT (titulo/tempo/passos/ingredientes/utensilios) dos livros novos
    const tempo = recipe.prepTime || recipe.time || recipe.tempo || '—';
    const passos = recipe.steps || recipe.instructions || recipe.passos || [];
    const recipeTitle = recipe.title || recipe.titulo || '';
    const ingredients = recipe.ingredients || recipe.ingredientes || [];
    const utensils    = recipe.utensils    || recipe.utensilios   || [];
    const bookArr = window.biblioteca[livroAtual] || [];
    const currentIdx = bookArr.findIndex(r => r.id === recipe.id);
    const nextRecipe = currentIdx >= 0 ? bookArr[currentIdx + 1] : null;
    const nextId = nextRecipe ? nextRecipe.id : null;

    const nextBtn = !nextId
        ? ''  // já é a última receita do livro
        : `<button onclick="event.preventDefault(); handleRecipeClick(${nextId})" class="promo-btn next-recipe-btn"
                   style="margin:0; padding:12px 24px; font-size:15px;">Próxima Receita →</button>`;

    // Assinante: troca "Adquirir Livro" por "Ler no Portal" (sem link de download)
    const bookKey = bookMeta ? bookMeta.key : null;
    const payLink = bookKey && BOOK_PAYMENT_LINKS[bookKey] ? BOOK_PAYMENT_LINKS[bookKey] : null;
    const btnAquisicao = isSubscriber
        ? `<span style="display:inline-flex; align-items:center; gap:6px; background:#f0fdf4;
                        color:#166534; font-weight:700; font-size:13px; padding:6px 14px;
                        border-radius:20px; border:1px solid #86efac;">
               ✅ Acesso de Assinante
           </span>`
        : '';

    return `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:20px;">
            <div>
                <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                          color:var(--sage-green); margin-bottom:8px; cursor:pointer;"
                   onclick="event.preventDefault(); loadBooksShowcase()">
                    ← Vitrine de Livros
                </p>
                <h1 class="recipe-title" style="margin-bottom:0; text-align:left;">${recipeTitle}</h1>
            </div>
            <button onclick="event.preventDefault(); loadBookSummary()" title="Ver todas as receitas"
                    style="white-space:nowrap; background:none; border:1.5px solid var(--sage-green);
                           border-radius:10px; cursor:pointer; color:var(--sage-green); display:flex;
                           align-items:center; gap:6px; font-weight:600; font-size:13px;
                           padding:8px 14px; flex-shrink:0; margin-top:4px;">
                <i class="ph ph-list-dashes" style="font-size:18px;"></i> Sumário da Coleção
            </button>
        </div>

        <div style="display:inline-flex; align-items:center; gap:10px; background:#fdf8f0;
                    border:1px solid var(--sage-green); border-radius:12px;
                    padding:10px 22px; margin-bottom:36px;">
            <i class="ph ph-timer" style="font-size:22px; color:var(--sage-green);"></i>
            <div>
                <div style="font-size:11px; text-transform:uppercase; letter-spacing:.5px;
                            color:var(--sage-green-dark); font-weight:700;">Tempo de Preparo</div>
                <div style="font-size:18px; font-weight:800; color:var(--text-dark);">${tempo}</div>
            </div>
        </div>

        <div class="nossa-cozinha-box">
            <div>
                <h4 class="section-title">Ingredientes Necessários</h4>
                <ul class="check-list">
                    ${ingredients.map(i => `<li><span class="check-item-icon">✓</span> ${i}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="section-title">Utensílios da Família</h4>
                <ul class="check-list">
                    ${utensils.map(u => `<li><span class="check-item-icon">◍</span> ${u}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="preparo-section">
            <h3>Modo de Preparo</h3>
            <div class="preparo-steps">
                ${passos.map((step, i) => `
                    <div class="step-card">
                        <p class="step-text"><strong>Passo ${i + 1}:</strong> ${step}</p>
                    </div>
                `).join('')}
            </div>
        </div>

        <div style="display:flex; gap:12px; margin-top:36px; justify-content:center; flex-wrap:wrap; align-items:center;">
            <button onclick="event.preventDefault(); loadBooksShowcase()" class="promo-btn"
                    style="margin:0; padding:12px 24px; font-size:15px; background:#fdf8f0; color:var(--sage-green-dark);">← Vitrine de Livros</button>
            ${nextBtn}
            ${btnAquisicao}
        </div>
    `;
}

/* ── Global Paywall (after 5 reads across all books) ────────────────────────── */
function renderGlobalPaywallHTML() {
    return `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                  color:var(--sage-green); margin-bottom:24px; cursor:pointer;"
           onclick="event.preventDefault(); loadBooksShowcase()">
            ← Vitrine de Livros
        </p>
        <div class="promo-banner" style="margin-top:0; padding:52px 40px;">
            <div style="font-size:48px; margin-bottom:16px;">📚</div>
            <span style="display:inline-block; background:#fdf8f0; color:var(--sage-green); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:4px 14px; border-radius:20px; margin-bottom:20px;">Acesso Completo</span>
            <h2 style="font-size:26px; margin-bottom:20px; line-height:1.35; color:var(--sage-green-dark);">
                Você explorou suas 5 receitas gratuitas!
            </h2>
            <p style="font-size:17px; color:var(--text-muted); max-width:500px; margin:0 auto 12px; line-height:1.7;">
                Adquira qualquer um dos nossos <strong style="color:var(--sage-green-dark);">5 livros digitais</strong>
                com <strong style="color:var(--sage-green-dark);">50 receitas cada</strong> em PDF especial para imprimir e colecionar.
            </p>
            <div style="font-size:38px; font-weight:900; color:var(--sage-green); margin-bottom:8px;">R$ 19,90</div>
            <div style="font-size:13px; color:var(--text-muted); margin-bottom:32px;">por livro · acesso imediato · PDF pronto para impressão</div>
            <a href="https://pay.hotmart.com/Y104973165O" target="_blank" rel="noopener noreferrer" class="promo-btn" style="background-color:var(--sage-green); color:white; font-size:17px; padding:16px 48px;">
                📖 Adquirir Livro 1 em PDF →
            </a>
            <p style="font-size:12px; color:var(--text-muted); margin-top:24px;">
                ✓ Acesso imediato &nbsp;·&nbsp; ✓ PDF alta qualidade &nbsp;·&nbsp; ✓ 50 receitas exclusivas
            </p>
        </div>
    `;
}

/* ── Per-book Paywall banner (recipe #6+ in each book) — só para NÃO-assinantes ── */
function renderPaywallHTML(book) {
    const bookTitle = book ? book.title : 'nosso livro completo';
    // Link individual por livro (BOOK_PAYMENT_LINKS) — compra avulsa
    const payLink = (book && book.key && BOOK_PAYMENT_LINKS[book.key])
        ? BOOK_PAYMENT_LINKS[book.key] : null;

    const user = window.SeniorAuth ? window.SeniorAuth.getUser() : null;
    const isLogged = !!user;

    // Botão principal: compra avulsa do livro (sempre disponível)
    const btnCompraAvulsa = payLink
        ? `<a href="${payLink}" target="_blank" rel="noopener noreferrer"
               class="promo-btn next-recipe-btn"
               style="font-size:17px; padding:16px 48px; display:inline-block; margin-top:0;">
               📖 Adquirir este Livro em PDF — R$ 19,90</a>`
        : `<button disabled class="promo-btn"
               style="font-size:17px; padding:16px 48px; display:inline-block; margin-top:0;
                      opacity:.45; cursor:not-allowed; background:var(--sage-green); border:none; color:#fff;">
               Em Breve</button>`;

    // Alternativa: assinar o clube para acessar todos os livros
    const ctaClube = isLogged
        ? `<a href="${window.CLUBE_CHECKOUT_URL}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block; margin-top:12px; font-size:14px; color:var(--sage-green-dark);
                      font-weight:700; text-decoration:underline;">
               ⭐ Ou assine o Clube e acesse todos os livros por R$ 20/mês →</a>`
        : `<button onclick="window.SeniorAuth.loginComGoogle()"
               style="display:inline-block; margin-top:12px; font-size:14px; color:var(--sage-green-dark);
                      font-weight:700; background:none; border:none; cursor:pointer; text-decoration:underline;">
               🔐 Entrar e assinar o Clube — acesse tudo por R$ 20/mês →</button>`;

    return `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                  color:var(--sage-green); margin-bottom:24px; cursor:pointer;"
           onclick="event.preventDefault(); loadBooksShowcase()">
            ← Vitrine de Livros
        </p>
        <div class="promo-banner" style="margin-top:0; padding:52px 40px;">
            <div style="font-size:48px; margin-bottom:16px;">📖</div>
            <h2 style="font-size:24px; margin-bottom:16px; line-height:1.35; color:var(--sage-green-dark);">
                Gostou do conteúdo?
            </h2>
            <p style="font-size:17px; color:var(--text-muted); max-width:500px; margin:0 auto 28px; line-height:1.8;">
                Adquira o Livro Completo <strong style="color:var(--text-dark);">"${bookTitle}"</strong>
                com as <strong style="color:var(--sage-green-dark);">50 receitas em PDF para imprimir</strong>
                por apenas
            </p>
            <div style="font-size:42px; font-weight:900; color:var(--sage-green); margin-bottom:6px; letter-spacing:-1px;">R$ 19,90</div>
            <div style="font-size:13px; color:var(--text-muted); margin-bottom:32px;">acesso imediato · PDF de alta qualidade · pronto para impressão</div>
            ${btnCompraAvulsa}
            <div style="margin-top:16px; padding-top:16px; border-top:1px dashed #e8d4a8;">
                ${ctaClube}
            </div>
            <p style="font-size:12px; color:var(--text-muted); margin-top:20px;">
                ✓ Pagamento seguro &nbsp;·&nbsp; ✓ PDF enviado por e-mail &nbsp;·&nbsp; ✓ 50 receitas completas
            </p>
        </div>
    `;
}


/* ── News Feed ──────────────────────────────────────────────────────────────── */

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQH9IkZJYRa8I9J_YlV6FfQ95u0vrpbDyY_n7hr0RdsYl8Ov1u0pgoWUYizINZOLRK24VIb5ePl-f5h/pub?output=csv';

/* Robust RFC-4180 CSV parser — handles quoted fields, commas inside quotes,
   and double-quote escaping. Fetch returns UTF-8 text natively, so accented
   characters (ã, ç, é, etc.) come through correctly without any manual decoding. */
function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQ = false;
    for (let i = 0; i < text.length; i++) {
        const c = text[i], n = text[i + 1];
        if (inQ) {
            if (c === '"' && n === '"') { field += '"'; i++; }
            else if (c === '"') { inQ = false; }
            else { field += c; }
        } else {
            if (c === '"') { inQ = true; }
            else if (c === ',') { row.push(field.trim()); field = ''; }
            else if (c === '\r' && n === '\n') { row.push(field.trim()); rows.push(row); row = []; field = ''; i++; }
            else if (c === '\n' || c === '\r') { row.push(field.trim()); rows.push(row); row = []; field = ''; }
            else { field += c; }
        }
    }
    if (field !== '' || row.length > 0) { row.push(field.trim()); rows.push(row); }
    return rows;
}

/* ── Mapa de CTAs por Categoria ───────────────────────────────────────────── */
const CATEGORIA_CTA = {
    /* ── Rainha: categorias principais ────────────────────────── */
    'BELEZA': {
        text: '✨ Descobrir mais sobre Beleza',
        url:  null
    },
    'FEMININA': {
        text: '💎 Explorar conteúdo Feminina',
        url:  null
    },
    'MANIPULAÇÃO': {
        text: '🔍 Saber mais sobre Manipulação',
        url:  null
    },
    'MANIPULACAO': {  // alias sem acento
        text: '🔍 Saber mais sobre Manipulação',
        url:  null
    },
    'POSICIONAMENTO': {
        text: '👑 Estratégias de Posicionamento',
        url:  null
    },
    /* ── Legado (mantidos para compatibilidade) ─────────────── */
    'CRUZEIROS': {
        text: '🚢 Ver Ofertas de Cruzeiros',
        url:  'https://b2c-decolar.krooze.com.br/'
    },
    'VIAGENS': {
        text: '✈️ Explorar Destinos',
        url:  'https://www.decolar.com/'
    },
    'CONFORTO': {
        text: 'Ver na Amazon →',
        url:  'https://www.amazon.com.br/s?k=conforto+idoso&tag=seniorhub-20'
    },
    'SAÚDE': {
        text: 'Cuidar da Saúde →',
        url:  'https://www.amazon.com.br/s?k=saude+senior+60+mais&tag=seniorhub-20'
    },
    'SAUDE': {  // alias sem acento
        text: 'Cuidar da Saúde →',
        url:  'https://www.amazon.com.br/s?k=saude+senior+60+mais&tag=seniorhub-20'
    },
    'RECEITA': {
        text: '📖 Adquirir Livro de Receitas →',
        url:  'https://pay.hotmart.com/Y104973165O'
    },
    'RECEITAS': {
        text: '📖 Adquirir Livro de Receitas →',
        url:  'https://pay.hotmart.com/Y104973165O'
    },
    'HOTEL': {
        text: '🏨 Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    },
    'HOTEIS': {
        text: '🏨 Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    },
    'HOT\u00c9IS': {
        text: '🏨 Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    }
};

/* ── Links de Pagamento por Livro (Hotmart) ──────────────────────────────────
   Chave = book.key conforme window.BOOKS.
   Adicione o link de cada livro quando for publicado na Hotmart.           */
const BOOK_PAYMENT_LINKS = {
    'reliquias': 'https://pay.hotmart.com/Y104973165O',  // Livro 1 ✓ ativo
    'livro2'   : 'https://pay.hotmart.com/U104976011H',  // Livro 2 ✓ ativo
    'prazersem' : 'https://pay.hotmart.com/S104989388R',  // Livro 3 ✓ ativo
    'saboresmar': 'https://pay.hotmart.com/C104989538L',  // Livro 4 ✓ ativo
    'horta'     : 'https://pay.hotmart.com/A104989658F'   // Livro 5 ✓ ativo
};

/* Detecta se um link é de compra (Hotmart ou Amazon) */
function isLinkDeCompra(url) {
    if (!url) return false;
    const u = url.trim().toLowerCase();
    return u.includes('hotmart.com') || u.includes('amazon.com.br') || u.includes('amazon.com');
}

/* Resolve o texto e URL do botão CTA com base na categoria e no link da planilha.
   Regra: Link_Noticia (coluna da planilha) tem PRIORIDADE; fallback = CATEGORIA_CTA.
   Se o link for de compra, o botão diz "Adquirir [CATEGORIA]" em vez de "Continuar Lendo". */
function resolverCTA(categoria, linkNoticia) {
    const catKey = (categoria || '').trim().toUpperCase();
    const config = CATEGORIA_CTA[catKey];

    // Se há link explícito na planilha, ele ganha sempre
    const hasCustomLink = linkNoticia && linkNoticia.trim().startsWith('http');
    const finalUrl  = hasCustomLink ? linkNoticia.trim() : (config ? config.url  : null);

    // Botão inteligente: link de compra → "Adquirir [Categoria]"
    let finalText;
    if (hasCustomLink && isLinkDeCompra(linkNoticia)) {
        const nomeCategoria = (categoria || 'Agora').trim();
        finalText = `Adquirir ${nomeCategoria}`;
    } else {
        finalText = config ? config.text : 'Continuar Lendo →';
    }

    return { url: finalUrl, text: finalText };
}

/* Builds a single news card DOM element from a data object */
function criarCardNoticia({ categoria, titulo, resumo, linkNoticia, linkImagem }) {
    const card = document.createElement('div');
    card.className = 'news-card feed-dinamico';

    const { url, text } = resolverCTA(categoria, linkNoticia);

    const fallbackImg = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800';
    const imgSrc = linkImagem && linkImagem.trim() ? linkImagem.trim() : fallbackImg;

    const ctaHTML = url
        ? `<a href="${url}" target="_blank" rel="noopener noreferrer"
              class="clube-btn"
              style="display:inline-block; font-weight:700;">${text}</a>`
        : `<a href="#" class="clube-btn"
              style="display:inline-block; font-weight:700;"
              onclick="alert('Artigo disponível em breve.'); return false;">${text}</a>`;

    card.innerHTML = `
        <img src="${imgSrc}"
             alt="${titulo}" class="news-image"
             onerror="this.src='${fallbackImg}'">
        <div class="news-content">
            <span class="news-category">${categoria}</span>
            <h2 class="news-header-title">${titulo}</h2>
            <p style="color:var(--text-muted); margin-bottom:24px; white-space:pre-wrap;">${resumo}</p>
            ${ctaHTML}
        </div>
    `;
    return card;
}

/* Fetches and injects the Google Sheets CSV at the TOP of the feed.
   Called asynchronously after the static feed renders so the page isn't blocked. */
/* Categorias válidas do portal Rainha (comparadas sem acento, em minúsculo) */
const CATEGORIAS_VALIDAS = ['beleza', 'feminina', 'manipulacao', 'posicionamento'];

/* Normaliza string para comparação de categoria (sem acento, minúscula) */
function normalizarCat(s) {
    return (s || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

async function carregarFeedNoticias(feedContainer) {
    try {
        const res = await fetch(SHEETS_CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();

        const rows = parseCSV(text);
        if (rows.length < 2) return;

        // Map headers case-insensitively
        const headers = rows[0].map(h => h.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
            .replace(/\s+/g, '_'));

        const col = key => headers.indexOf(key);
        const iCat = col('categoria');
        const iTit = col('titulo');
        const iRes = col('resumo');
        const iLink = col('link_noticia');
        const iImg = col('link_imagem');

        // Filtra apenas categorias válidas do portal Rainha
        const dataRows = rows.slice(1)
            .filter(r => {
                if (!r[iTit] || r[iTit].trim() === '') return false;
                const catNorm = normalizarCat(r[iCat]);
                return CATEGORIAS_VALIDAS.includes(catNorm);
            });

        if (dataRows.length === 0) {
            const pl = feedContainer.querySelector('.feed-loading');
            if (pl) pl.textContent = 'Nenhuma notícia encontrada para as categorias do Rainha.';
            return;
        }

        feedContainer.innerHTML = '';

        const divider = document.createElement('div');
        divider.style.cssText = 'font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.7px; color:var(--sage-green); margin-bottom:20px; padding-top:4px; font-family:\'Playfair Display\',serif;';
        divider.textContent = 'O FEMININO: Decifrando as Intenções';
        feedContainer.appendChild(divider);

        // Determina o índice do primeiro card de Manipulação (destaque)
        const idxDestaque = dataRows.findIndex(r => normalizarCat(r[iCat]) === 'manipulacao');

        dataRows.forEach((r, idx) => {
            const card = criarCardNoticia({
                categoria: r[iCat] || 'Notícia',
                titulo: r[iTit] || '',
                resumo: r[iRes] || '',
                linkNoticia: r[iLink] || '#',
                linkImagem: r[iImg] || ''
            });
            // Aplica destaque visual ao primeiro card de Manipulação
            if (idx === idxDestaque) {
                card.classList.add('news-card--destaque');
            }
            feedContainer.appendChild(card);
        });

        const placeholder = feedContainer.querySelector('.feed-loading');
        if (placeholder) placeholder.remove();

    } catch (err) {
        console.warn('[Rainha] Feed dinâmico indisponível:', err.message);
        const placeholder = feedContainer.querySelector('.feed-loading');
        if (placeholder) placeholder.remove();
    }
}

function loadNewsFeed() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');
    viewer.innerHTML = '';
    const feed = document.createElement('div');
    feed.className = 'slide-in-right';

    const placeholder = document.createElement('div');
    placeholder.className = 'feed-loading';
    placeholder.style.cssText = 'font-size:14px; color:var(--text-muted); padding:32px 0; text-align:center; opacity:.75;';
    placeholder.textContent = '⏳ Carregando inteligência feminina...';
    feed.appendChild(placeholder);

    viewer.appendChild(feed);
    carregarFeedNoticias(feed);
}

/* Alias para o menu Beleza (carrega a vitrine de livros com rótulo atualizado) */
function loadBeleza() {
    loadRecipesFeed();
}

/* ── Oráculo de Promoção Mística — 7 Itens (Sidebar Direita) ─────────────────
   Itens 1-5 = Os Cinco Livros do Domínio  |  Itens 6-7 = Campos de Especialidade */
const ads = [
    {
        id: 'livro-1', livro: 1, emoji: '🌹',
        title: 'O Rastro de Vênus',
        subtitle: 'O perfume da pele que domina instintos.',
        link: 'https://pay.hotmart.com/Y104973165O',
        btnText: 'Despertar Agora', tipo: 'livro'
    },
    {
        id: 'livro-2', livro: 2, emoji: '🌙',
        title: 'O Compasso da Lua',
        subtitle: 'Sincronize sua essência com o ciclo do poder.',
        link: 'https://pay.hotmart.com/U104976011H',
        btnText: 'Despertar Agora', tipo: 'livro'
    },
    {
        id: 'livro-3', livro: 3, emoji: '💃',
        title: 'A Melodia das Curvas',
        subtitle: 'A arquitetura corporal que silencia o ambiente.',
        link: 'https://pay.hotmart.com/S104989388R',
        btnText: 'Adquirir Volume', tipo: 'livro'
    },
    {
        id: 'livro-4', livro: 4, emoji: '🔥',
        title: 'O Fogo das Sombras',
        subtitle: 'Vitalidade oculta para desarmar resistências.',
        link: 'https://pay.hotmart.com/C104989538L',
        btnText: 'Adquirir Volume', tipo: 'livro'
    },
    {
        id: 'livro-5', livro: 5, emoji: '🍷',
        title: 'O Néctar das Musas',
        subtitle: 'A alquimia do sabor que o torna dependente.',
        link: 'https://pay.hotmart.com/A104989658F',
        btnText: 'Adquirir Volume', tipo: 'livro'
    },
    {
        id: 'veu-juventude', livro: null, emoji: '💋',
        title: 'O Véu da Juventude',
        subtitle: 'O segredo da pele que ele deseja desvendar.',
        link: null, btnText: 'Despertar Agora',
        tipo: 'veu', veuKey: 'veu-juventude'
    },
    {
        id: 'pintura-sereia', livro: null, emoji: '🧜‍♀️',
        title: 'A Pintura da Sereia',
        subtitle: 'Maquiagem que hipnotiza e dita o ritmo do jogo.',
        link: null, btnText: 'Despertar Agora',
        tipo: 'veu', veuKey: 'pintura-sereia'
    }
];


let currentAdIndex = 0;
let adIntervalId = null;

function initAdShowcase() {
    renderAd();
    adIntervalId = setInterval(() => advanceAd(1), 15000); // 15 segundos
}

function advanceAd(direction) {
    currentAdIndex = (currentAdIndex + direction + ads.length) % ads.length;
    renderAd();
}

function goToAd(index) {
    currentAdIndex = index;
    if (adIntervalId) clearInterval(adIntervalId);
    adIntervalId = setInterval(() => advanceAd(1), 15000);
    renderAd();
}

function renderAd() {
    const container = document.getElementById('ad-showcase-root');
    if (!container) return;
    const ad = ads[currentAdIndex];
    const isSubscriber = window.SeniorAuth && window.SeniorAuth.isSubscriber();

    // Badge label
    const badgeLabel = ad.tipo === 'veu'
        ? 'Especialidade'
        : `Vol. ${ad.livro} de 5`;

    // Dots — 7 pontos
    const dotsHtml = ads.map((_, i) =>
        `<span class="ad-dot ${i === currentAdIndex ? 'active' : ''}" onclick="goToAd(${i})" title="${ads[i].title}"></span>`
    ).join('');

    // Botão CTA — Cavalo→Bispo
    let adBtnHtml;
    if (ad.tipo === 'livro') {
        adBtnHtml = isSubscriber
            ? `<button onclick="window.handleBookClick(${ad.livro})" class="ad-btn ad-btn--crimson">
                   💋 Ler no Portal →
               </button>`
            : `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-btn ad-btn--crimson">
                   ${ad.btnText} →
               </a>`;
    } else {
        adBtnHtml = `<button onclick="renderVeuConteudo('${ad.veuKey}')" class="ad-btn ad-btn--crimson">
               ${ad.btnText} →
           </button>`;
    }

    container.innerHTML = `
        <div class="ad-showcase ad-showcase--oracle">
            <div class="ad-badge">${badgeLabel}</div>
            <div class="ad-oracle-emoji ad-fade-in">${ad.emoji}</div>
            <div class="ad-content">
                <h4 class="ad-title">${ad.title}</h4>
                <p class="ad-subtitle">${ad.subtitle}</p>
                ${adBtnHtml}
                <div class="ad-dots">${dotsHtml}</div>
            </div>
        </div>
    `;
}

/* ── Conforto do Lar — Top 10 Tópicos de Afiliados ─────────────────────── */
window.LOJA_TOPICOS = [
    {
        emoji: '🛏️',
        titulo: 'Dormir Sem Dores',
        beneficio: 'Travesseiros Cervicais e Almofadas de Gel para noites tranquilas',
        link: 'https://www.amazon.com.br/s?k=travesseiro+cervical+ortopedico&tag=seniorhub-20'
    },
    {
        emoji: '🚿',
        titulo: 'Segurança no Banheiro',
        beneficio: 'Barras de Apoio e Tapetes Antiderrapantes que previnem quedas',
        link: 'https://www.amazon.com.br/s?k=barra+de+apoio+banheiro&tag=seniorhub-20'
    },
    {
        emoji: '💆',
        titulo: 'Alívio Muscular',
        beneficio: 'Massageadores de Pescoço, Pés e Lombar para descansar de verdade',
        link: 'https://www.amazon.com.br/s?k=massageador+pescoco+e+costas&tag=seniorhub-20'
    },
    {
        emoji: '🍳',
        titulo: 'Cozinha Sem Esforço',
        beneficio: 'Abridores de Potes e Utensílios Ergonômicos para mãos seguras',
        link: 'https://www.amazon.com.br/s?k=abridor+de+potes+ergonomico&tag=seniorhub-20'
    },
    {
        emoji: '💡',
        titulo: 'Iluminação Inteligente',
        beneficio: 'Luminárias com Sensor de Movimento para corredores e banheiros',
        link: 'https://www.amazon.com.br/s?k=luminaria+sensor+movimento&tag=seniorhub-20'
    },
    {
        emoji: '🪑',
        titulo: 'Postura e Assento',
        beneficio: 'Almofadas Terapêuticas e Encostos Ortopédicos para longas horas',
        link: 'https://www.amazon.com.br/s?k=almofada+gel+assento&tag=seniorhub-20'
    },
    {
        emoji: '❤️',
        titulo: 'Saúde sob Controle',
        beneficio: 'Medidores de Pressão e Oxímetros de Fácil Leitura para monitorar sem sair de casa',
        link: 'https://www.amazon.com.br/s?k=medidor+pressao+digital+bra%C3%A7o&tag=seniorhub-20'
    },
    {
        emoji: '💊',
        titulo: 'Organização de Remédios',
        beneficio: 'Porta-comprimidos Inteligentes e com Alarme para nunca esquecer uma dose',
        link: 'https://www.amazon.com.br/s?k=porta+comprimidos+semanal&tag=seniorhub-20'
    },
    {
        emoji: '🦵',
        titulo: 'Pernas e Circulação',
        beneficio: 'Meias de Compressão e Exercitadores de Pernas contra inchaço',
        link: 'https://www.amazon.com.br/s?k=meia+compressao+suave&tag=seniorhub-20'
    },
    {
        emoji: '📚',
        titulo: 'Lazer e Leitura',
        beneficio: 'Kindles, Lupas Eletrônicas e Suportes de Tablet para o seu tempo livre',
        link: 'https://www.amazon.com.br/s?k=kindle+dispositivo&tag=seniorhub-20'
    }
];

/* ── Posicionamento — Presença e Poder Feminino ────────────────── */
function renderPosicionamento() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');

    const cards = window.LOJA_TOPICOS.map((t, i) => `
        <a href="${t.link}" target="_blank" rel="noopener noreferrer"
           style="text-decoration:none; display:flex; flex-direction:column; outline:none;
                  background:#fff; border:1px solid #f0e8d4; border-radius:18px;
                  padding:28px 22px 24px; gap:14px;
                  box-shadow:0 2px 10px rgba(0,0,0,0.05);
                  transition:box-shadow .2s,transform .2s;"
           onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; this.style.transform='translateY(-4px)';"
           onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">

            <div style="font-size:46px; line-height:1;">${t.emoji}</div>

            <div style="border-radius:99px; background:var(--sage-green);
                        color:#fff; font-size:11px; font-weight:800;
                        letter-spacing:.5px; padding:3px 12px;
                        display:inline-block; width:fit-content;">
                TOP ${i + 1}
            </div>

            <h3 style="font-size:20px; font-weight:900; color:#2a1a06;
                       margin:0; line-height:1.25;">
                ${t.titulo}
            </h3>

            <p style="font-size:14px; color:#7a5e32; line-height:1.65; margin:0; flex:1;">
                ${t.beneficio}
            </p>

            <div style="margin-top:4px; background:#ffffff; color:#000000;
                        border:2px solid #C5A059; text-align:center; font-size:14px; font-weight:700;
                        padding:13px 16px; border-radius:8px;
                        letter-spacing:.3px;">
                Ver na Amazon →
            </div>
        </a>
    `).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:var(--sage-green); margin-bottom:20px;
                  cursor:pointer;"
           onclick="loadNewsFeed()">← Início</p>

        <div style="margin-bottom:32px;">
            <h1 style="font-size:28px; font-weight:900; color:#2a1a06; margin:0 0 8px;">
                👑 Posicionamento
            </h1>
            <p style="font-size:15px; color:#7a5e32; margin:0;">
                Estratégias de presença, autoridade e poder feminino. Posicione-se com inteligência e elegante distinção.
            </p>
        </div>

        <p style="font-size:11px; font-weight:800; text-transform:uppercase;
                  letter-spacing:.7px; color:var(--sage-green); margin-bottom:12px;">
            🏆 Recursos Selecionados
        </p>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px;">
            ${cards}
        </div>

    `;


    swapContent(viewer, wrapper);
}

/* Alias de retrocompatibilidade */
function renderLojaConforto() { renderPosicionamento(); }

/* ── Exercícios em Casa — Vitrine de Afiliados ──────────────────────────── */
const EXERCICIOS_CARDS = [
    {
        emoji: '🏋️',
        titulo: 'Fortalecimento e Mobilidade',
        descricao: 'Faixas elásticas e halteres leves para fazer em casa.',
        link: 'https://www.amazon.com.br/s?k=exercicios+idosos+mobilidade&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '🚴',
        titulo: 'Cardio Sentado (Fisioterapia)',
        descricao: 'Mini bicicletas e pedais para exercitar as pernas sentado.',
        link: 'https://www.amazon.com.br/s?k=mini+bicicleta+ergometrica+fisioterapia&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '💪',
        titulo: 'Proteínas e Músculos',
        descricao: 'Nutren Senior, Whey Protein e suplementos para massa muscular.',
        link: 'https://www.amazon.com.br/s?k=nutren+senior+suplemento+proteina&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '🌿',
        titulo: 'Vitaminas e Imunidade',
        descricao: 'Ômega 3, Vitamina D e Magnésio para longevidade.',
        link: 'https://www.amazon.com.br/s?k=vitaminas+senior+50+mais&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    }
];

/* ── Feminina — Inteligência e Presença Feminina ──────────────── */
const FEMININA_CARDS = [
    {
        emoji: '🧠',
        titulo: 'Psicologia Feminina',
        descricao: 'Livros e recursos sobre comportamento, autopercepção e inteligência emocional feminina.',
        link: 'https://www.amazon.com.br/s?k=psicologia+feminina+livros&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '💄',
        titulo: 'Beleza e Autocuidado',
        descricao: 'Produtos premium de beleza, skincare e cuidados que realçam sua presença e confìança.',
        link: 'https://www.amazon.com.br/s?k=skincare+premium+feminino&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '📚',
        titulo: 'Leitura Transformadora',
        descricao: 'Obras sobre poder feminino, liderança, sedução intelectual e arte da conversção.',
        link: 'https://www.amazon.com.br/s?k=poder+feminino+liderança+livros&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '🧘‍♀️',
        titulo: 'Bem-Estar e Equilíbrio',
        descricao: 'Aromaterapia, meditação e ferramentas de bem-estar para manter a energia e a serenidade.',
        link: 'https://www.amazon.com.br/s?k=aromaterapia+bem+estar+feminino&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    }
];

function renderFeminina() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');

    const cards = FEMININA_CARDS.map(c => `
        <a href="${c.link}" target="_blank" rel="noopener noreferrer"
           style="text-decoration:none; display:flex; flex-direction:column; outline:none;
                  background:#fff; border:1px solid #f0e8d4; border-radius:18px;
                  padding:28px 22px 24px; gap:12px;
                  box-shadow:0 2px 10px rgba(0,0,0,0.05);
                  transition:box-shadow .2s,transform .2s;"
           onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; this.style.transform='translateY(-4px)';"
           onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">

            <div style="font-size:44px; line-height:1;">${c.emoji}</div>

            <h3 style="font-size:19px; font-weight:900; color:#2a1a06; margin:0; line-height:1.25;">
                ${c.titulo}
            </h3>

            <p style="font-size:14px; color:#7a5e32; line-height:1.65; margin:0; flex:1;">
                ${c.descricao}
            </p>

            <div style="margin-top:4px; background:#ffffff; color:#000000;
                        border:2px solid #C5A059; text-align:center; font-size:14px; font-weight:700;
                        padding:13px 16px; border-radius:8px; letter-spacing:.3px;">
                ${c.btn} →
            </div>
        </a>
    `).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:var(--sage-green); margin-bottom:20px; cursor:pointer;"
           onclick="loadNewsFeed()">← Início</p>

        <div style="margin-bottom:32px;">
            <h1 style="font-size:28px; font-weight:900; color:#2a1a06; margin:0 0 8px;">
                ♀️ Feminina
            </h1>
            <p style="font-size:15px; color:#7a5e32; margin:0;">
                Recursos curados de inteligência, presença e poder feminino para mulheres que se conhecem.
            </p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px;">
            ${cards}
        </div>

    `;

    swapContent(viewer, wrapper);
}

/* Alias de retrocompatibilidade */
function renderExercicios() { renderFeminina(); }

/* ── Guia de Viagens — Destinos Decolar ──────────────────────────────── */
const VIAGENS_DESTINOS = [
    {
        emoji: '⛰️',
        destino: 'Charme em Gramado (RS)',
        descricao: 'O melhor da Serra Gaúcha: hotéis requintados e o melhor da gastronomia nacional.',
        link: 'https://www.decolar.com/hoteis/h-251025/hoteis-em-gramado',
        badge: 'Nacional'
    },
    {
        emoji: '🇵🇹',
        destino: 'O Melhor de Portugal',
        descricao: 'Explore Lisboa e Porto com conforto. História, cultura e vinhos em uma viagem inesquecível.',
        link: 'https://www.decolar.com/pacotes/lis/pacotes-para-lisboa',
        badge: 'Internacional'
    },
    {
        emoji: '🚢',
        destino: 'Cruzeiros All-Inclusive',
        descricao: 'Viaje pelo litoral brasileiro com todo o conforto de um hotel 5 estrelas móvel.',
        link: 'https://b2c-decolar.krooze.com.br/',
        badge: 'Cruzeiro'
    },
    {
        emoji: '🌴',
        destino: 'Resorts no Nordeste',
        descricao: 'Sol e descanso em Maceió ou Porto de Galinhas nos melhores resorts pé na areia.',
        link: 'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fresorts%2Findex.pt-br.html%3Faid%3D2311236',
        badge: 'Nacional'
    },
    {
        emoji: '🏨',
        destino: 'Hotéis e Pousadas',
        descricao: 'As melhores hospedagens com cancelamento grátis e selo de confiança SeniorHub.',
        link: 'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236',
        badge: 'Hotel'
    }
];

/* ── Helpers de CTA para o Guia de Viagens ─────────────────────────────────
   Regras:
   • badge 'Cruzeiro'             → Krooze (d.link)
   • destino contém 'Resort'     → BOOKING_RESORTS_URL + '🏨 Ver Melhores Resorts'
   • badge 'Hotel'               → BOOKING_HOTELS_URL  + '🏨 Reservar Hotel Agora'
   • Nacional / Internacional     → BOOKING_FLIGHTS_URL + '✈️ Ver Voos na Booking' */
const BOOKING_FLIGHTS_URL  = 'https://www.booking.com/flights/index.pt-br.html?aid=1784973&label=affnetawin-index_pub-2787542_site-_pname-E-dolphin_plc-_ts-_clkid-18120_1773775041_85af9fcafe88b1b9a81f2d3031f9168f';
const BOOKING_RESORTS_URL  = 'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fresorts%2Findex.pt-br.html%3Faid%3D2311236';
const BOOKING_HOTELS_URL   = 'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236';

function resolverLinkViagem(d) {
    const badge   = (d.badge   || '').toUpperCase();
    const destino = (d.destino || '').toUpperCase();
    if (badge === 'CRUZEIRO')          return d.link;              // Krooze
    if (destino.includes('RESORT'))    return BOOKING_RESORTS_URL;  // Booking Resorts afiliado
    if (badge === 'HOTEL')             return BOOKING_HOTELS_URL;   // Booking Hotels afiliado
    if (badge === 'NACIONAL' || badge === 'INTERNACIONAL') return BOOKING_FLIGHTS_URL;
    return d.link; // fallback genérico
}

function resolverTextoViagem(d) {
    const badge   = (d.badge   || '').toUpperCase();
    const destino = (d.destino || '').toUpperCase();
    if (badge === 'CRUZEIRO')          return '🚢 Ver Ofertas de Cruzeiros';
    if (destino.includes('RESORT'))    return '🏨 Ver Melhores Resorts';
    if (badge === 'HOTEL')             return '🏨 Reservar Hotel Agora';
    if (badge === 'NACIONAL' || badge === 'INTERNACIONAL') return '✈️ Ver Voos na Booking';
    return '🗺️ Explorar Destino';
}

/* ── Manipulação — Inteligência Relacional e Comportamental ──────── */
const MANIPULACAO_TEMAS = [
    {
        emoji: '🎭',
        destino: 'A Arte da Persuasão',
        descricao: 'Domine as técnicas de influência social, persuasão e retórica que movem o mundo.',
        link: 'https://www.amazon.com.br/s?k=persuasao+influencia+livros&tag=seniorhub-20',
        badge: 'Psicologia'
    },
    {
        emoji: '🤝',
        destino: 'Dinâmicas de Poder',
        descricao: 'Compreenda as hierarquias sociais e como naveguem com elegância e estratégia.',
        link: 'https://www.amazon.com.br/s?k=dinamicas+poder+relacoes+sociais&tag=seniorhub-20',
        badge: 'Relacional'
    },
    {
        emoji: '👁️',
        destino: 'Leitura de Pessoas',
        descricao: 'Linguagem corporal, microexpressões e sinais que revelam as verdadeiras intenções.',
        link: 'https://www.amazon.com.br/s?k=leitura+linguagem+corporal+livros&tag=seniorhub-20',
        badge: 'Comportamento'
    },
    {
        emoji: '🔮',
        destino: 'Inteligência Emocional',
        descricao: 'Controle emocional, empatia estratégica e gestão de relacionamentos com profundidade.',
        link: 'https://www.amazon.com.br/s?k=inteligencia+emocional+livros&tag=seniorhub-20',
        badge: 'Emocional'
    },
    {
        emoji: '🧩',
        destino: 'Estratégia e Xadrez Social',
        descricao: 'Pense sempre três jogadas à frente. Leituras sobre estratégia, negociação e poder.',
        link: 'https://www.amazon.com.br/s?k=estrategia+negociacao+poder+livros&tag=seniorhub-20',
        badge: 'Estratégia'
    }
];

function renderManipulacao() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');

    const cards = MANIPULACAO_TEMAS.map(d => `
        <div style="background:#fff; border:1px solid #f0e8d4; border-radius:20px;
                    overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.05);
                    transition:box-shadow .2s, transform .2s; display:flex; flex-direction:column;"
             onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; this.style.transform='translateY(-4px)';"
             onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">

            <!-- Card hero -->
            <div style="background:linear-gradient(135deg,#2a1a06 0%,#A67C00 100%);
                        padding:28px 24px 20px; display:flex; flex-direction:column; gap:10px;">
                <div style="font-size:46px; line-height:1;">${d.emoji}</div>
                <span style="display:inline-block; background:rgba(255,255,255,0.2); color:#fff;
                             font-size:10px; font-weight:800; letter-spacing:.6px;
                             text-transform:uppercase; padding:3px 12px; border-radius:99px;
                             width:fit-content;">${d.badge}</span>
                <h3 style="font-size:20px; font-weight:900; color:#fff; margin:0; line-height:1.25;">
                    ${d.destino}
                </h3>
            </div>

            <!-- Card body -->
            <div style="padding:20px 24px 24px; display:flex; flex-direction:column; gap:14px; flex:1;">
                <p style="font-size:14px; color:#7a5e32; line-height:1.65; margin:0; flex:1;">
                    ${d.descricao}
                </p>
                <a href="${d.link}" target="_blank" rel="noopener noreferrer"
                   style="display:block; text-align:center; background:#ffffff; color:#000000;
                          border:2px solid #C5A059; font-size:14px; font-weight:700;
                          padding:13px 16px; border-radius:8px;
                          text-decoration:none; letter-spacing:.3px;"
                   onmouseover="this.style.background='#fdf8f0';"
                   onmouseout="this.style.background='#ffffff';">
                    🔍 Explorar
                </a>
            </div>
        </div>
    `).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:var(--sage-green); margin-bottom:20px; cursor:pointer;"
           onclick="loadNewsFeed()">← Início</p>

        <div style="margin-bottom:32px;">
            <h1 style="font-size:28px; font-weight:900; color:#2a1a06; margin:0 0 8px;">
                👁️ Manipulação
            </h1>
            <p style="font-size:15px; color:#7a5e32; margin:0;">
                Inteligência relacional, leitura de pessoas e estética do poder. Para quem joga no nível mais alto.
            </p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px;">
            ${cards}
        </div>

    `;

    swapContent(viewer, wrapper);
}

/* Alias de retrocompatibilidade */
function renderViagens() { renderManipulacao(); }

/* ── Guias — Dados ───────────────────────────────────────────────────────── */
const GUIAS_DATA = [

    {
        id: 'gaslighting',
        titulo: 'Gaslighting',
        descricao: 'O guia que toda mulher deveria ter lido antes. Cinco cap&#237;tulos para reconhecer, nomear e se libertar da n&#233;voa que algu&#233;m criou na sua mente.',
        paginas: [
            {
                num: 1,
                titulo: 'O Sussurro da Intui&#231;&#227;o',
                gratis: true,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Voc&#234; N&#227;o Est&#225; Inventando</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">H&#225; uma voz dentro de voc&#234; que sussurra h&#225; muito tempo. Ela diz que algo est&#225; errado &#8212; n&#227;o com o mundo, mas com a forma como <em>voc&#234;</em> est&#225; experienciando o mundo. Uma sensa&#231;&#227;o de que a realidade que lhe &#233; apresentada n&#227;o coincide com o que seus olhos, ouvidos e cora&#231;&#227;o registraram.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Voc&#234; pergunta: &#8220;Mas ser&#225; que sou eu?&#8221; E essa pergunta, repetida vezes o suficiente, come&#231;a a parecer uma resposta. Come&#231;a a parecer que a d&#250;vida em si &#233; a prova da sua instabilidade.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">N&#227;o &#233;. A d&#250;vida &#233; o sintoma de algo que algu&#233;m fez <em>com</em> voc&#234; &#8212; metodicamente, pacientemente, ao longo do tempo. E o primeiro ato de coragem &#233; este: nomear o que voc&#234; sente, antes mesmo de entend&#234;-lo completamente.</p>
                        </div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Que a Intui&#231;&#227;o Realmente &#201;</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A neuroci&#234;ncia confirma o que as mulheres sempre souberam: a intui&#231;&#227;o n&#227;o &#233; misticismo, &#233; <strong>processamento de dados n&#227;o-consciente</strong>. O c&#233;rebro registra inconsist&#234;ncias, microexpress&#245;es faciais, varia&#231;&#245;es sutis no tom de voz &#8212; tudo isso antes que a mente consciente formule sequer uma palavra.</p>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O que voc&#234; sente &#233; dado, n&#227;o drama</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando voc&#234; diz &#8220;tenho a sensa&#231;&#227;o de que algo est&#225; errado&#8221;, voc&#234; n&#227;o est&#225; sendo irracional. Voc&#234; est&#225; relatando a s&#237;ntese de centenas de sinais que seu sistema nervoso captou. Isso &#233; intelig&#234;ncia.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A eros&#227;o come&#231;a pela credibilidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Algu&#233;m que deseja controlar sua percep&#231;&#227;o da realidade n&#227;o come&#231;a pela mentira abrupta &#8212; come&#231;a pela desqualifica&#231;&#227;o da sua capacidade de perceber. &#8220;Voc&#234; &#233; muito sens&#237;vel.&#8221; &#8220;Voc&#234; sempre distorce tudo.&#8221; Cada frase &#233; uma pedra atirada contra a estrutura da sua confian&#231;a.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Sinais Que Voc&#234; N&#227;o Devia Ignorar</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voc&#234; saiu de conversas sentindo que estava errada, mas n&#227;o consegue explicar exatamente por qu&#234;.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voc&#234; come&#231;ou a se desculpar antes mesmo de terminar de falar.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A sua mem&#243;ria de eventos importantes diverge consistentemente da mem&#243;ria de outra pessoa &#8212; e a sua vers&#227;o nunca &#233; a verdadeira.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voc&#234; passou a evitar certos assuntos para n&#227;o &#8220;criar confus&#227;o&#8221; &#8212; mesmo quando s&#227;o assuntos sobre voc&#234; mesma.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Acolhimento que Este Guia Oferece</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Se voc&#234; chegou at&#233; aqui, sua intui&#231;&#227;o trouxe voc&#234;. E ela estava certa em faz&#234;-lo. O que voc&#234; vai encontrar nas pr&#243;ximas p&#225;ginas n&#227;o &#233; apenas informa&#231;&#227;o &#8212; &#233; o mapa de volta para si mesma.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Reconhecer &#233; o primeiro ato de liberdade. Nomear &#233; o segundo.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 2,
                titulo: 'A Anatomia da N&#233;voa',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Como a Realidade &#201; Tecnicamente Distorcida</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O gaslighting n&#227;o &#233; acidente &#8212; &#233; m&#233;todo. Ele opera em camadas, com uma sofistica&#231;&#227;o que explica por que &#233; t&#227;o dif&#237;cil de nomear enquanto acontece. A n&#233;voa n&#227;o aparece de repente; ela se instala como uma umidade que voc&#234; n&#227;o percebe at&#233; que o ambiente inteiro esteja encharcado.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:19px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Os Quatro Mecanismos da N&#233;voa</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">1. Nega&#231;&#227;o Sistem&#225;tica</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Eu nunca disse isso.&#8221; &#8220;Isso n&#227;o aconteceu.&#8221; A repeti&#231;&#227;o convicta cria uma d&#250;vida que corr&#243;i o ch&#227;o sob seus p&#233;s.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">2. Trivializa&#231;&#227;o das Emo&#231;&#245;es</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;L&#225; vem voc&#234; com seu drama.&#8221; O objetivo &#233; fazer voc&#234; deixar de confiar no que sente como term&#244;metro v&#225;lido da realidade.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">3. Desvio e Contra-ataque</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Toda vez que voc&#234; levanta uma preocupa&#231;&#227;o, a conversa &#233; desviada para seus defeitos. O foco nunca permanece na quest&#227;o que voc&#234; trouxe.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">4. Reescrita da Hist&#243;ria</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O que foi crueldade vira &#8220;cuidado mal compreendido&#8221;. Com o tempo, voc&#234; come&#231;a a habitar uma narrativa que n&#227;o &#233; a sua.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Efeito Cumulativo</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">A destrui&#231;&#227;o vem da combina&#231;&#227;o, da frequ&#234;ncia e da dura&#231;&#227;o. &#201; a repeti&#231;&#227;o que transforma um epis&#243;dio em cren&#231;a: que voc&#234; n&#227;o pode confiar em si mesma.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A n&#233;voa n&#227;o tem paredes &#8212; tem d&#250;vidas. E a sa&#237;da &#233; aprender a ver atrav&#233;s dela.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 3,
                titulo: 'O C&#243;digo das Palavras',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Dicion&#225;rio das Frases que Desorientam</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O gaslighting tem uma linguagem pr&#243;pria &#8212; frases que parecem razo&#225;veis na superf&#237;cie mas t&#234;m uma fun&#231;&#227;o espec&#237;fica: desmantelar a sua percep&#231;&#227;o da realidade. Quando voc&#234; entende a inten&#231;&#227;o por tr&#225;s da palavra, a palavra perde o poder que tinha.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Frases e Sua Fun&#231;&#227;o Real</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Voc&#234; &#233; muito sens&#237;vel.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Fun&#231;&#227;o real:</strong> Desqualificar sua resposta emocional como falha de car&#225;ter. Faz voc&#234; se preocupar em &#8220;n&#227;o ser sens&#237;vel&#8221; em vez de questionar o que gerou a emo&#231;&#227;o.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Ningu&#233;m mais acha isso.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Fun&#231;&#227;o real:</strong> Isolar sua percep&#231;&#227;o como exc&#234;ntrica, usando a suposta maioria como autoridade. Faz voc&#234; priorizar o consenso externo sobre sua pr&#243;pria experi&#234;ncia.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Voc&#234; est&#225; inventando coisas.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Fun&#231;&#227;o real:</strong> Atacar a integridade da sua mem&#243;ria e capacidade de observa&#231;&#227;o. &#201; a nega&#231;&#227;o mais crua &#8212; e por isso, muitas vezes, a mais eficaz.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Voc&#234; s&#243; faz isso para me magoar.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Fun&#231;&#227;o real:</strong> Inverter a din&#226;mica. Voc&#234; passa a ser a agressora e gasta energia se defendendo &#8212; abandonando o ponto original.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Voc&#234; sempre foi assim.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Fun&#231;&#227;o real:</strong> Transformar o comportamento em caracter&#237;stica permanente de car&#225;ter. Faz voc&#234; acreditar que o problema &#233; quem voc&#234; &#233; &#8212; e que n&#227;o h&#225; como mudar.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Nomear a t&#233;cnica &#233; a derrota da t&#233;cnica.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 4,
                titulo: 'A Fortaleza do Eu',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Reconstruindo o Ch&#227;o Sob os Seus P&#233;s</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Quando algu&#233;m sistematicamente questiona a sua percep&#231;&#227;o, o dano se instala na estrutura com que voc&#234; avalia a realidade. Reconstruir essa estrutura &#233; uma pr&#225;tica &#8212; uma s&#233;rie de exerc&#237;cios intencionais que restabelecem a confian&#231;a na sua pr&#243;pria mente.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Exerc&#237;cios de Soberania Perceptiva</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Di&#225;rio de &#194;ncoras (di&#225;rio)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ao final de cada dia, escreva tr&#234;s fatos com certeza: &#8220;Ela disse X.&#8221; &#8220;Isso aconteceu &#224;s 18h.&#8221; Crie um arquivo privado de realidade que pode ser consultado quando a d&#250;vida surgir.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Testemunha Neutra</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ap&#243;s conversas dif&#237;ceis, escreva: &#8220;O que foi dito? Como me senti? O que aconteceu de fato?&#8221; Essa separa&#231;&#227;o entre fato e interpreta&#231;&#227;o restaura a clareza perceptiva.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Conselho Interno</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Imagine que uma amiga pr&#243;xima relatasse exatamente o que voc&#234; viveu. O que voc&#234; diria a ela? Essa invers&#227;o de perspectiva atravessa a n&#233;voa da d&#250;vida com uma clareza que o olhar sobre si mesma nem sempre consegue.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Invent&#225;rio das Certezas (semanal)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Reserve 15 minutos para escrever: &#8220;O que eu sei sobre mim mesma que n&#227;o depende da opini&#227;o de ningu&#233;m?&#8221; Construa essa lista tijolo a tijolo.</p></div></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Quem confia na pr&#243;pria percep&#231;&#227;o n&#227;o precisa de permiss&#227;o para sentir o que sente.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 5,
                titulo: 'O Decreto da Soberana',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Rito da Desconex&#227;o Emocional</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Existe um ponto em toda jornada de recupera&#231;&#227;o em que a an&#225;lise cede lugar &#224; decis&#227;o. Voc&#234; j&#225; nomeou o que aconteceu. Voc&#234; j&#225; entendeu os mecanismos. Agora vem o ato final e o mais soberano: a desconex&#227;o emocional do que n&#227;o lhe pertence mais.</p>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Desconex&#227;o emocional n&#227;o &#233; indiferen&#231;a. &#201; a decis&#227;o consciente de n&#227;o mais permitir que a realidade de outra pessoa colonize a sua.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Fronteiras Inegoci&#225;veis</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fronteira de Realidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Eu n&#227;o continuarei conversas em que minha mem&#243;ria seja questionada como evid&#234;ncia do meu problema. Posso estar errada &#8212; mas essa conclus&#227;o ser&#225; minha, ap&#243;s reflex&#227;o, n&#227;o sua por decreto.&#8221;</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fronteira de Emo&#231;&#227;o</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Eu n&#227;o justificarei o que sinto. Sinto. Isso basta como dado.&#8221;</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fronteira de Narrativa</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Minha hist&#243;ria &#233; minha. Voc&#234; pode ter uma vers&#227;o diferente &#8212; ela pode coexistir com a minha. Mas ela n&#227;o a substitui. Nunca mais.&#8221;</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Rito Final</h3></div>
                            <div style="display:flex;flex-direction:column;gap:14px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sente-se em sil&#234;ncio. Respire fundo tr&#234;s vezes.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;Eu fui ensinada a duvidar de mim. Essa li&#231;&#227;o termina hoje.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Nomeie &#8212; sem julgamento, sem raiva &#8212; o que foi feito. Para testemunhar com clareza.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;N&#227;o carregarei mais o peso de uma vers&#227;o da realidade que n&#227;o &#233; minha.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">5</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva uma coisa que voc&#234; sabe sobre si mesma com certeza absoluta. Guarde-a. Ela &#233; o seu decreto.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">Voc&#234; Voltou</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Esta &#233; a &#250;ltima p&#225;gina &#8212; mas n&#227;o &#233; o fim. &#201; o come&#231;o de uma rela&#231;&#227;o diferente com a sua pr&#243;pria mente: uma rela&#231;&#227;o de alian&#231;a, n&#227;o de suspeita.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A soberana n&#227;o precisa provar que a n&#233;voa existiu. Ela s&#243; precisa saber que agora enxerga com clareza.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            }
        ],
        get conteudo() { return this.paginas[0].conteudo; },
        categoria: 'Manipulação',
        gratis: true
    },

    {
        id: 'negging',
        titulo: 'Negging',
        descricao: 'O veneno disfarçado de elogio. Cinco cap&#237;tulos para identificar, neutralizar e se blindar da deprecia&#231;&#227;o sutil que corrói a autoestima de mulheres de alto valor.',
        paginas: [
            {
                num: 1,
                titulo: 'A Adaga de Vidro',
                gratis: true,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Golpe que N&#227;o Deixa Marca Vis&#237;vel</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O <em>negging</em> &#233; uma t&#225;tica de deprecia&#231;&#227;o sutil, desenhada para desestabilizar a confian&#231;a de uma mulher atrav&#233;s de insultos disfarçados de feedback, preocupa&#231;&#227;o ou &#8220;honestidade brutal&#8221;. Diferente de uma ofensa direta, que geraria uma rea&#231;&#227;o imediata de defesa, o negging opera abaixo do radar.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Ele &#233; projetado para fazer voc&#234; se questionar, gerando uma pequena ferida na sua autoimagem que, com o tempo, se torna uma cicatriz de inseguran&#231;a. O objetivo &#233; simples: diminuir o seu valor percebido para que o manipulador pare&#231;a estar &#8220;acima&#8221; de voc&#234;, fazendo com que voc&#234; busque desesperadamente a aprova&#231;&#227;o dele para se sentir adequada novamente.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">A din&#226;mica come&#231;a de forma quase imperceptível &#8212; &#233; aquele coment&#225;rio sobre como seu vestido &#233; &#8220;corajoso&#8221; para o seu tipo de corpo, ou como voc&#234; &#233; &#8220;surpreendentemente inteligente para algu&#233;m t&#227;o bonita&#8221;.</p>
                        </div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Curto-Circuito Emocional</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">O c&#233;rebro recebe um est&#237;mulo positivo (um elogio) e um negativo (uma cr&#237;tica) ao mesmo tempo, criando uma confus&#227;o emocional. Esse &#233; o elemento de infiltra&#231;&#227;o: ele te desarma com uma m&#227;o enquanto te golpeia com a outra, deixando voc&#234; em um estado de busca constante por um elogio que seja, finalmente, puro e sem espinhos.</p>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Como ele destr&#243;i a confian&#231;a</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Com o passar do tempo, essa t&#225;tica cria um cen&#225;rio onde a soberana come&#231;a a duvidar de sua pr&#243;pria luz. O manipulador utiliza o negging para manth&#234;-la em um estado de &#8220;eterna aprendiz&#8221; ou de &#8220;imperfeição aceit&#225;vel&#8221;.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O espelho distorcido</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#201; uma forma de controle que n&#227;o usa correntes, mas sim o espelho distorcido que ele coloca na sua frente todos os dias. Se voc&#234; alcan&#231;a um sucesso profissional, ele pontua a sorte que voc&#234; teve; se voc&#234; se sente poderosa, ele menciona uma pequena falha est&#233;tica.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Cavalos de Troia Verbais</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Voc&#234; &#233; t&#227;o bonita para uma mulher da sua idade.&#8221; &#8212; O que soa como elogio esconde a redu&#231;&#227;o.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Sua apresenta&#231;&#227;o foi boa, considerando o tempo que voc&#234; teve.&#8221; &#8212; A ressalva apaga a conquista.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Voc&#234; &#233; corajosa de usar isso.&#8221; &#8212; Elogio que embrulha uma cr&#237;tica ao seu corpo.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Sorte que voc&#234; &#233; bonita!&#8221; &#8212; Anula a intelig&#234;ncia ou compet&#234;ncia com ironia disfar&#231;ada.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">A Retomada da Soberania</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">A retomada da soberania exige o reconhecimento imediato desses cavalos de Troia verbais. Uma Rainha sabe que a verdadeira admira&#231;&#227;o n&#227;o vem acompanhada de ressalvas que visam diminu&#237;-la. Identificar o negging &#233; restaurar a integridade do seu pr&#243;prio espelho.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O seu valor &#233; um territ&#243;rio inegoci&#225;vel onde apenas o respeito absoluto tem permiss&#227;o para habitar.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 2,
                titulo: 'A Tradu&#231;&#227;o do Desprezo',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Decifrando as Frases Comuns</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Por tr&#225;s de cada frase de negging existe uma inten&#231;&#227;o precisa. Quando voc&#234; aprende a traduzir o que est&#225; sendo dito, a frase perde seu veneno. Aqui est&#227;o os c&#243;digos mais usados e o que eles realmente significam.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Dicion&#225;rio do Negging</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Voc&#234; seria perfeita se...&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Real:</strong> Voc&#234; n&#227;o &#233; suficiente como &#233;. Existe uma condi&#231;&#227;o para o seu valor. Essa frase ancora sua autoestima a uma aprova&#231;&#227;o que nunca vir&#225;.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Estou falando isso porque me importo.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Real:</strong> Disfarce de cuidado para que voc&#234; receba a cr&#237;tica sem resist&#234;ncia e, mais grave, se sinta grata por ela.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;N&#227;o leva a s&#233;rio, &#233; s&#243; uma brincadeira.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Real:</strong> Nega o seu direito de se sentir atingida. Faz com que qualquer reação seja exagero, transferindo a culpa para voc&#234;.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Voc&#234; tem sorte de ter algu&#233;m honesto.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Real:</strong> Posiciona o depreciador como aliado raro, criando uma depend&#234;ncia de aprovação de quem é exatamente a fonte do dano.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">&ldquo;Para a sua idade, voc&#234; se manteve muito bem.&rdquo;</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Real:</strong> Elogio condicional que embute a ideia de que o tempo diminuiu seu valor &#8212; e que ele est&#225; sendo generoso ao reconhec&#234;-la assim mesmo.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Quando voc&#234; entende o c&#243;digo, o c&#243;digo perde o poder.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 3,
                titulo: 'O Alvo Escolhido',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Por Que Mulheres de Alto Valor S&#227;o o Alvo</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O negging n&#227;o &#233; usado aleatoriamente. Ele &#233; uma t&#225;tica que homens inseguros reservam especificamente para mulheres que percebem como superiores a eles &#8212; mulheres confiantes, bem-sucedidas, belas e independentes. Entender isso muda tudo.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">A Psicologia por Tr&#225;s do Alvo</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Ele a percebe como inacess&#237;vel</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A mulher de alto valor gera uma sensa&#231;&#227;o de amea&#231;a em homens com autoestima fr&#225;gil. O negging &#233; a tentativa de reduzir esse &#8220;diferencial de poder&#8221; &#8212; de baixar voc&#234; ao n&#237;vel onde ele se sente confort&#225;vel.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Ela n&#227;o precisa dele &#8212; e isso o aterroriza</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Uma mulher que n&#227;o precisa de aprova&#231;&#227;o &#233; incontrol&#225;vel. O negging &#233; a estrat&#233;gia para criar essa necessidade artificialmente &#8212; fazer com que ela busque exatamente o que ele reteve.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O paradoxo da admira&#231;&#227;o t&#243;xica</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ironicamente, o negging &#233; uma forma distorcida de admira&#231;&#227;o. Ele a escolhe como alvo porque a v&#234; como superior. A deprecia&#231;&#227;o &#233; o &#250;nico mecanismo que ele conhece para se aproximar do que o faz sentir inferior.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Perfis do Depreciador</h3></div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>O Cr&#237;tico Disfar&#231;ado de Mentor:</strong> usa a autoridade de &#8220;quem quer o seu bem&#8221; para entregar ofensas embaladas em sabedoria.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>O Humor&#237;sta T&#243;xico:</strong> usa piadas e &#8220;brincadeiras&#8221; como ve&#237;culo, sabendo que qualquer reação sua ser&#225; retratada como excesso.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">✦</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>O Observador Sutil:</strong> inserido na rotina &#8212; na família, no trabalho &#8212; usa coment&#225;rios pontuais mas frequentes, calculados para n&#227;o parecerem padr&#227;o.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Ser alvo do negging n&#227;o &#233; fraqueza &#8212; &#233; o sinal de que o seu valor foi notado. A fraqueza seria n&#227;o reconhec&#234;-lo.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 4,
                titulo: 'O Escudo de Diamante',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Como Responder com Elegância e Autoridade</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A resposta ao negging n&#227;o &#233; a explosão emocional nem o sil&#234;ncio submisso. &#201; a neutraliza&#231;&#227;o soberana &#8212; uma resposta que exibe o n&#237;vel de consci&#234;ncia que o manipulador esperava nunca encontrar.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Arsenal da Soberana</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Espelho de Volta</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Repita a frase de volta em forma de pergunta com curiosidade genuína: &#8220;Curioso. O que exatamente voc&#234; quis dizer com isso?&#8221; Obriga o depreciador a verbalizar o que disse sub-repticiamente &#8212; o que soa muito pior em voz alta.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Pausa Soberana</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">N&#227;o reaja imediatamente. Um silêncio de dois segundos seguido de um olhar calmo comunica: &#8220;Eu ouvi, processei e decidi que n&#227;o merece mais do que isso.&#8221; &#201; a resposta mais poderosa porque rouba o palco.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Nomenação Direta</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Com voz serena e olhar direto: &#8220;Isso foi um elogio com uma cr&#237;tica embutida, e eu prefiro n&#227;o receber desse jeito.&#8221; Sem raiva, sem drama. Apenas o fato &#8212; dito com a autoridade de quem conhece as regras do jogo.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Redirecionamento Elegante</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Agradeça a parte positiva e ignore completamente a parte negativa: &#8220;Obrigada!&#8221; &#8212; e mude de assunto. Voc&#234; honra apenas o que merece ser honrado. O resto morre de indiferença.</p></div></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A Rainha n&#227;o defende o trono. Ela simplesmente vive nele &#8212; e isso &#233; suficiente para tornar qualquer ataque irrelevante.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 5,
                titulo: 'A Consagra&#231;&#227;o do Valor',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Rituais de Afirma&#231;&#227;o da Soberania</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Reconhecer e neutralizar o negging &#233; o primeiro passo. O segundo &#233; limpar o espa&#231;o interno onde as cr&#237;ticas deixaram res&#237;duos. Estes rituais foram desenhados para restaurar a integridade do seu espelho interno.</p></div>
                        <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Pr&#225;ticas Di&#225;rias de Consagra&#231;&#227;o</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Invent&#225;rio do Valor (matinal)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Antes de qualquer contato com o mundo externo, escreva tr&#234;s qualidades que voc&#234; possui que n&#227;o dependem da opini&#227;o de ningu&#233;m. Com o tempo, essa lista se torna o seu escudo prim&#225;rio.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Filtro da Fonte</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Antes de internalizar qualquer cr&#237;tica, pergunte: &#8220;Quem est&#225; dizendo isso? Essa pessoa me conhece profundamente? Ela tem interesse genuíno no meu crescimento?&#8221; Se a resposta for n&#227;o, a cr&#237;tica n&#227;o entra.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Limpeza Verbal (noturna)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ao final do dia, revise qualquer coment&#225;rio que criou desconforto. Pergunte: &#8220;Isso era sobre mim ou sobre ele?&#8221; Devolva mentalmente o que n&#227;o &#233; seu. Limpe o espelho.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Decreto de Inviolabilidade (semanal)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Reserve um momento para declarar em voz alta: &#8220;Meu valor n&#227;o &#233; negoci&#225;vel. Minha confian&#231;a n&#227;o &#233; editada por vozes externas. Eu escolho o que entra.&#8221;</p></div></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Decreto Final da Soberana</h3></div>
                            <div style="display:flex;flex-direction:column;gap:14px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sente-se em silêncio. Respire fundo três vezes.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;N&#227;o permito que ningu&#233;m edite a minha confian&#231;a. Esse poder &#233; meu.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Nomeie &#8212; sem raiva &#8212; cada coment&#225;rio que internalizou indevidamente esta semana.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;Devolvo o que n&#227;o &#233; meu. Fico com o que constru&#237;.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">5</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva uma qualidade sua que nenhuma cr&#237;tica ext&#237;nguir&#225;. Guarde-a como seu decreto.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Trono Permanece</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Esta &#233; a &#250;ltima p&#225;gina &#8212; mas n&#227;o o fim da sua soberania. &#201; o come&#231;o de uma vida onde voc&#234; &#233; a &#250;nica editora do seu valor. O seu trono n&#227;o admite cr&#237;ticas que n&#227;o visem a sua constru&#231;&#227;o.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;N&#227;o permita que ningu&#233;m edite a sua confian&#231;a. O seu valor &#233; um territ&#243;rio inegoci&#225;vel.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            }
        ],
        get conteudo() { return this.paginas[0].conteudo; },
        categoria: 'Manipulação',
        gratis: true
    }
];

/* ── Sidebar: marca o link ativo ────────────────────────────────────────── */
function setActiveLink(activeId) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('sidebar-link--active'));
    const target = document.getElementById(activeId);
    if (target) target.classList.add('sidebar-link--active');
}

/* ── Toggle de expansão dos cards de Guia ────────────────────────────────── */
function toggleGuia(id) {
    const body = document.getElementById('guia-body-' + id);
    const btn  = document.getElementById('guia-btn-'  + id);
    const card = document.getElementById('guia-card-' + id);
    if (!body) return;
    const isOpen = body.style.display !== 'none' && body.style.display !== '';
    if (isOpen) {
        body.style.display = 'none';
        if (btn)  btn.innerHTML = 'Ver Guia <i class="ph ph-caret-down" style="font-size:14px;vertical-align:middle;"></i>';
        if (card) card.classList.remove('guia-card--open');
    } else {
        body.style.display = 'block';
        if (btn)  btn.innerHTML = 'Fechar <i class="ph ph-caret-up" style="font-size:14px;vertical-align:middle;"></i>';
        if (card) card.classList.add('guia-card--open');
        setTimeout(() => { card && card.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 80);
    }
}

/* ── Guias — renderização com paywall ───────────────────────────────────────── */

/* Troca de capítulo no livro Gaslighting */
function switchGasChapter(num) {
    document.querySelectorAll('.gas-chapter').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.gas-tab-btn').forEach(function (el) {
        el.style.background = 'transparent';
        el.style.color = 'var(--gold-dark)';
    });
    var cont = document.getElementById('gas-content-' + num);
    var tab = document.getElementById('gas-tab-' + num);
    if (cont) cont.style.display = 'block';
    if (tab) { tab.style.background = 'var(--gold)'; tab.style.color = '#fff'; }
}
window.switchGasChapter = switchGasChapter;

/* Troca de capítulo no livro Negging */
function switchNegChapter(num) {
    document.querySelectorAll('.neg-chapter').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.neg-tab-btn').forEach(function (el) {
        el.style.background = 'transparent';
        el.style.color = 'var(--gold-dark)';
    });
    var cont = document.getElementById('neg-content-' + num);
    var tab = document.getElementById('neg-tab-' + num);
    if (cont) cont.style.display = 'block';
    if (tab) { tab.style.background = 'var(--gold)'; tab.style.color = '#fff'; }
}
window.switchNegChapter = switchNegChapter;

function renderGuias() {
    setActiveLink('sidebar-link-guias');
    var viewer = document.getElementById('content-viewer');
    var isSubscriber = window.SeniorAuth && window.SeniorAuth.isSubscriber();
    var ids = GUIAS_DATA.map(function (g) { return g.id; });

    var cardsHTML = GUIAS_DATA.map(function (g, idx) {

        /* ── Guia Gaslighting: livro digital unificado ─── */
        if (g.paginas && g.paginas.length) {
            var total = g.paginas.length;
            var pfx = g.id === 'negging' ? 'neg' : 'gas';
            var switchFn = g.id === 'negging' ? 'switchNegChapter' : 'switchGasChapter';
            var chapterClass = g.id === 'negging' ? 'neg-chapter' : 'gas-chapter';
            var tabClass = g.id === 'negging' ? 'neg-tab-btn' : 'gas-tab-btn';

            /* Tabs de capítulo */
            var tabs = g.paginas.map(function (pag) {
                var free = pag.gratis || isSubscriber;
                var lock = free ? '' : ' &#128274;';
                var isFirst = pag.num === 1;
                var tabId = pfx + '-tab-' + pag.num;
                var bg = isFirst ? 'background:var(--gold);color:#fff;' : 'background:transparent;color:var(--gold-dark);';
                return '<button id="' + tabId + '" class="' + tabClass + '"'
                    + ' onclick="' + switchFn + '(' + pag.num + ')"'
                    + ' style="' + bg + 'border:1.5px solid var(--gold);border-radius:99px;'
                    + 'padding:6px 14px;font-size:12px;font-weight:800;cursor:pointer;'
                    + 'white-space:nowrap;transition:background .2s,color .2s;">'
                    + pag.num + '.&nbsp;' + pag.titulo + lock
                    + '</button>';
            }).join('');

            /* Conteúdo de cada capítulo */
            var chapters = g.paginas.map(function (pag) {
                var free = pag.gratis || isSubscriber;
                var show = pag.num === 1 ? 'block' : 'none';
                var prev = pag.num > 1 ? pag.num - 1 : null;
                var next = pag.num < total ? pag.num + 1 : null;

                /* Botões de navegação de capítulo */
                var navPrev = prev
                    ? '<button onclick="' + switchFn + '(' + prev + ')"'
                    + ' style="display:flex;align-items:center;gap:8px;background:#fff;'
                    + 'border:1.5px solid var(--gold);color:var(--gold-dark);'
                    + 'font-size:13px;font-weight:700;padding:10px 20px;border-radius:10px;cursor:pointer;"'
                    + ' onmouseover="this.style.background=\'#fdf8f0\'"'
                    + ' onmouseout="this.style.background=\'#fff\'">'
                    + '<i class="ph ph-arrow-left" style="font-size:15px;"></i> Capítulo anterior</button>'
                    : '<span></span>';
                var navNext = next
                    ? '<button onclick="' + switchFn + '(' + next + ')"'
                    + ' style="display:flex;align-items:center;gap:8px;background:var(--gold);'
                    + 'border:none;color:#fff;font-size:13px;font-weight:800;'
                    + 'padding:10px 20px;border-radius:10px;cursor:pointer;"'
                    + ' onmouseover="this.style.opacity=\'.85\'"'
                    + ' onmouseout="this.style.opacity=\'1\'">'
                    + 'Próximo capítulo <i class="ph ph-arrow-right" style="font-size:15px;"></i></button>'
                    : '<span style="font-size:13px;font-weight:700;color:var(--gold-dark);">&#10003; Fim do guia</span>';
                var nav = '<div style="display:flex;justify-content:space-between;align-items:center;'
                    + 'margin-top:36px;padding-top:24px;border-top:2px solid #f0e8d4;gap:12px;">'
                    + navPrev + navNext + '</div>';

                /* Cabeçalho do capítulo */
                var statusBadge = free
                    ? '<span style="background:#d1fae5;color:#065f46;font-size:11px;font-weight:800;padding:3px 12px;border-radius:99px;">Acesso Livre</span>'
                    : '<span style="background:#1f2937;color:#e8c97a;font-size:11px;font-weight:800;padding:3px 12px;border-radius:99px;">&#128274; Bloqueado</span>';
                var chapHeader = '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #f0e8d4;display:flex;align-items:center;gap:12px;">'
                    + '<span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);'
                    + 'font-size:11px;font-weight:800;letter-spacing:.6px;text-transform:uppercase;'
                    + 'padding:3px 14px;border-radius:99px;">Capítulo ' + pag.num + ' de ' + total + '</span>'
                    + statusBadge + '</div>';

                if (free) {
                    return '<div id="' + pfx + '-content-' + pag.num + '" class="' + chapterClass + '" style="display:' + show + ';">'
                        + chapHeader + pag.conteudo + nav + '</div>';
                } else {
                    /* Paywall elegante com preview borrado */
                    var blurred = '<div style="position:relative;overflow:hidden;max-height:200px;border-radius:12px;" aria-hidden="true">'
                        + '<div style="filter:blur(5px);opacity:.5;pointer-events:none;">' + pag.conteudo + '</div>'
                        + '<div style="position:absolute;inset:0;background:linear-gradient(to bottom,transparent 0%,#fff 90%);"></div>'
                        + '</div>';
                    var paywall = '<div style="text-align:center;padding:36px 24px 28px;display:flex;flex-direction:column;align-items:center;gap:16px;">'
                        + '<div style="width:56px;height:56px;background:linear-gradient(135deg,#2a1a06,#5a3a10);'
                        + 'border-radius:50%;display:flex;align-items:center;justify-content:center;">'
                        + '<i class="ph ph-lock" style="font-size:26px;color:#e8c97a;"></i></div>'
                        + '<h3 style="font-size:20px;font-weight:900;color:#2a1a06;margin:0;">Capítulo ' + pag.num + ': ' + pag.titulo + '</h3>'
                        + '<p style="font-size:15px;color:#6b7280;line-height:1.7;margin:0;max-width:400px;">'
                        + 'Este capítulo é exclusivo para membros do <strong style="color:#2a1a06;">Círculo Rainha</strong>. '
                        + 'Desbloqueie e continue sua jornada de clareza e soberania.</p>'
                        + '<a href="https://pay.hotmart.com/E105391945G" target="_blank" rel="noopener noreferrer"'
                        + ' style="display:inline-flex;align-items:center;gap:10px;'
                        + 'background:linear-gradient(135deg,#2a1a06,#5a3a10);color:#e8c97a;'
                        + 'font-size:15px;font-weight:800;padding:14px 32px;border-radius:12px;'
                        + 'text-decoration:none;box-shadow:0 4px 20px rgba(42,26,6,.25);"'
                        + ' onmouseover="this.style.transform=\'translateY(-2px)\';this.style.boxShadow=\'0 8px 28px rgba(42,26,6,.35)\'"'
                        + ' onmouseout="this.style.transform=\'\';this.style.boxShadow=\'0 4px 20px rgba(42,26,6,.25)\'">'
                        + '&#128081; Reivindicar minha Soberania</a>'
                        + '<p style="font-size:12px;color:#9ca3af;margin:0;">Acesso imediato a todos os 5 capítulos + biblioteca completa</p>'
                        + '</div>';
                    return '<div id="' + pfx + '-content-' + pag.num + '" class="' + chapterClass + '" style="display:' + show + ';">'
                        + chapHeader + blurred + paywall + nav + '</div>';
                }
            }).join('');

            /* Card livro unificado */
            return '<div class="guia-card" id="guia-card-' + g.id + '" style="overflow:hidden;">'
                + '<div class="guia-card__header" onclick="toggleGuia(\'' + g.id + '\')"'
                + ' style="cursor:pointer;background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);'
                + 'border-radius:12px 12px 0 0;padding:24px 28px;">'
                + '<span style="display:inline-block;background:rgba(197,160,89,.28);color:#e8c97a;'
                + 'font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase;'
                + 'padding:3px 14px;border-radius:99px;margin-bottom:10px;">Guia Maestro &#8212; 5 Capítulos</span>'
                + '<h2 style="font-size:26px;font-weight:900;color:#fff;margin:0 0 8px;">' + g.titulo + '</h2>'
                + '<p style="font-size:14px;color:#e8d4a8;margin:0 0 16px;line-height:1.6;">' + g.descricao + '</p>'
                + '<button id="guia-btn-' + g.id + '"'
                + ' style="display:inline-flex;align-items:center;gap:8px;background:#e8c97a;'
                + 'border:none;color:#2a1a06;font-size:13px;font-weight:800;padding:10px 22px;border-radius:10px;cursor:pointer;"'
                + ' onmouseover="this.style.background=\'#f0d98a\'"'
                + ' onmouseout="this.style.background=\'#e8c97a\'">'
                + '<i class="ph ph-book-open" style="font-size:15px;"></i> Abrir Livro</button>'
                + '</div>'
                /* Body */
                + '<div id="guia-body-' + g.id + '" class="guia-card__body" style="display:none;padding:0;">'
                /* Chapter tabs */
                + '<div style="padding:16px 20px 12px;border-bottom:1px solid #f0e8d4;background:#fafaf8;">'
                + '<p style="font-size:11px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;margin:0 0 10px;">Capítulos</p>'
                + '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + tabs + '</div>'
                + '</div>'
                /* Chapter content area */
                + '<div style="padding:28px;">' + chapters + '</div>'
                + '</div></div>';
        }

        /* ── Guias simples (formato padrão) ── */
        var isFree = g.gratis || isSubscriber;
        var guiaBadge = '<span class="guia-badge">Guia</span>';
        var prevId = idx > 0 ? ids[idx - 1] : null;
        var nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
        var navButtons = '<div style="display:flex;justify-content:space-between;align-items:center;'
            + 'margin-top:28px;padding-top:20px;border-top:1px solid #f0e8d4;gap:12px;">'
            + (prevId ? '<button onclick="toggleGuia(\'' + g.id + '\');toggleGuia(\'' + prevId + '\');"'
                + ' style="display:flex;align-items:center;gap:6px;background:#fff;'
                + 'border:1.5px solid var(--gold);color:var(--gold-dark);font-size:13px;font-weight:700;'
                + 'padding:10px 18px;border-radius:8px;cursor:pointer;"'
                + ' onmouseover="this.style.background=\'#fdf8f0\'"'
                + ' onmouseout="this.style.background=\'#fff\'">'
                + '<i class="ph ph-arrow-left" style="font-size:15px;"></i> Guia anterior</button>' : '<span></span>')
            + (nextId ? '<button onclick="toggleGuia(\'' + g.id + '\');toggleGuia(\'' + nextId + '\');"'
                + ' style="display:flex;align-items:center;gap:6px;background:#fff;'
                + 'border:1.5px solid var(--gold);color:var(--gold-dark);font-size:13px;font-weight:700;'
                + 'padding:10px 18px;border-radius:8px;cursor:pointer;transition:background .2s;"'
                + ' onmouseover="this.style.background=\'#fdf8f0\'"'
                + ' onmouseout="this.style.background=\'#fff\'">'
                + 'Próximo guia <i class="ph ph-arrow-right" style="font-size:15px;"></i></button>' : '<span></span>')
            + '</div>';
        var toggleBtn = '<button id="guia-btn-' + g.id + '"'
            + ' onclick="toggleGuia(\'' + g.id + '\')"'
            + ' style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:#fff;'
            + 'border:1.5px solid var(--gold);color:var(--gold-dark);font-size:13px;font-weight:700;'
            + 'padding:9px 18px;border-radius:8px;cursor:pointer;margin-top:8px;transition:background .2s;"'
            + ' onmouseover="this.style.background=\'#fdf8f0\'"'
            + ' onmouseout="this.style.background=\'#fff\'">'
            + 'Ver Guia <i class="ph ph-caret-down" style="font-size:14px;vertical-align:middle;"></i></button>';
        if (isFree) {
            return '<div class="guia-card" id="guia-card-' + g.id + '">'
                + '<div class="guia-card__header" onclick="toggleGuia(\'' + g.id + '\')" style="cursor:pointer;">'
                + guiaBadge + '<h2 class="guia-card__title">' + g.titulo + '</h2>'
                + '<p class="guia-card__desc">' + g.descricao + '</p>' + toggleBtn + '</div>'
                + '<div id="guia-body-' + g.id + '" class="guia-card__body" style="display:none;">'
                + g.conteudo + navButtons + '</div></div>';
        } else {
            return '<div class="guia-card guia-card--locked" id="guia-card-' + g.id + '">'
                + '<div class="guia-card__header" onclick="toggleGuia(\'' + g.id + '\')" style="cursor:pointer;">'
                + guiaBadge + '<h2 class="guia-card__title">' + g.titulo + '</h2>'
                + '<p class="guia-card__desc">' + g.descricao + '</p>' + toggleBtn + '</div>'
                + '<div id="guia-body-' + g.id + '" style="display:none;position:relative;">'
                + '<div class="guia-card__body guia-card__body--blurred" aria-hidden="true">' + g.conteudo + '</div>'
                + '<div class="guia-lock-overlay" style="position:relative;height:auto;background:none;'
                + 'display:flex;flex-direction:column;align-items:center;padding:36px 28px;text-align:center;gap:14px;">'
                + '<div class="guia-lock-icon"><i class="ph ph-lock" style="font-size:32px;color:var(--sage-green);"></i></div>'
                + '<p class="guia-lock-msg">Acesso exclusivo para assinantes do Círculo Rainha</p>'
                + '<a href="__HOTMART__" target="_blank" rel="noopener noreferrer" class="guia-lock-btn">&#128081; Desbloquear Acesso Completo</a>'
                + '</div>' + navButtons + '</div></div>';
        }
    }).join('');

    var wrapper = document.createElement('div');
    wrapper.className = 'recipe-card slide-in-right';
    wrapper.innerHTML = '<p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;'
        + 'color:var(--sage-green);margin-bottom:20px;cursor:pointer;" onclick="loadNewsFeed()">&#8592; Início</p>'
        + '<div style="margin-bottom:36px;">'
        + '<span style="display:inline-block;background:#fdf8f0;color:var(--sage-green);font-size:12px;'
        + 'font-weight:700;text-transform:uppercase;letter-spacing:.6px;padding:4px 14px;border-radius:20px;margin-bottom:14px;">Biblioteca de Guias</span>'
        + '<h1 style="font-size:28px;font-weight:900;color:#2a1a06;margin:0 0 8px;">Guias Práticos para o seu Dia a Dia</h1>'
        + '<p style="font-size:15px;color:var(--text-muted);margin:0;">'
        + (isSubscriber ? 'Acesso completo &#8212; todos os guias estão liberados para você.' : 'Assine o Círculo Rainha para desbloquear os guias')
        + '</p></div>'
        + '<div class="guias-grid">' + cardsHTML + '</div>';
    swapContent(viewer, wrapper);
}


/* ── handleNewsClick (fallback para cards estáticos do feed) ────────────── */
function handleNewsClick(id) {
    // Cards estáticos do feed não têm ação específica — vai para o início
    loadNewsFeed();
}

/* ── Global exports (required for inline onclick attributes in HTML) ─────── */

window.handleBookClick = handleBookClick;
window.loadRecipesFeed = loadRecipesFeed;
window.loadRecipe = loadRecipe;
window.loadBooksShowcase = loadBooksShowcase;
window.loadBookSummary = loadBookSummary;
window.handleRecipeClick = handleRecipeClick;
window.handleNewsClick = handleNewsClick;
window.toggleModal = toggleModal;
window.submitVote = submitVote;
window.loadNewsFeed = loadNewsFeed;
window.renderLojaConforto = renderLojaConforto;
window.renderExercicios = renderExercicios;
window.renderViagens = renderViagens;
window.renderGuias = renderGuias;
window.toggleGuia = toggleGuia;
window.switchNegChapter = switchNegChapter;
