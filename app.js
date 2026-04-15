/* ── Link do Clube (espelho do auth.js para uso no app.js) ─────────────────── */
window.CLUBE_CHECKOUT_URL = window.CLUBE_CHECKOUT_URL || 'https://pay.hotmart.com/B105027530C';

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

const SHEETS_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRNQGosj4jv-wq-YtxUvxvLYRsn31B7zmPDNmUtVJtHLK27Zlj6u078v73fmKQlhwO8dO904kKjt0y-/pub?output=csv';

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
        id: 'g2',
        titulo: 'O Santu\u00e1rio Invis\u00edvel',
        descricao: 'O Checklist da Alma: Como organizar seu ambiente, sua trilha sonora e seus rituais para um acesso inexpugn\u00e1vel \u00e0 paz.',
        conteudo: `
            <div style="display:flex;flex-direction:column;gap:36px;">
                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Arquitetura do Sil&ecirc;ncio</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Existe, em cada ser que chegou &agrave; maturidade, uma constru&ccedil;&atilde;o que o mundo n&atilde;o pode demolir. Os fil&oacute;sofos estoicos chamavam de <em>h&ecirc;gemonikon</em> &mdash; o centro governante da alma. Teresa d&rsquo;&Aacute;vila escreveu sobre ele como o <em>Castelo Interior</em>: sete moradas conc&ecirc;ntricas de autoconhecimento, onde a mais profunda &eacute; inacess&iacute;vel ao barulho do mundo.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Voc&ecirc; j&aacute; habitou esse castelo. Cada vez que sobreviveu a uma perda e encontrou f&ocirc;lego novo, cada vez que o sil&ecirc;ncio da madrugada lhe trouxe uma resposta que o dia n&atilde;o ousou revelar &mdash; voc&ecirc; estava l&aacute; dentro. O problema n&atilde;o &eacute; encontrar o castelo. O problema &eacute; que o mundo moderno lhe vende mil distrac&ccedil;&otilde;es para que voc&ecirc; esque&ccedil;a o caminho de volta.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">A soberania espiritual n&atilde;o &eacute; um privil&eacute;gio dos monges. &Eacute; a heran&ccedil;a leg&iacute;tima de quem viveu o suficiente para parar de confundir velocidade com destino. Voc&ecirc;, que chegou at&eacute; aqui, possui algo que nenhuma juventude compra: a <strong>perspectiva do tempo</strong> &mdash; e com ela, a chave do santu&aacute;rio.</p>
                </div>
                <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Trilha Sonora do Divino</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A m&uacute;sica brasileira guarda alguns dos maiores <em>mantras leigos</em> da humanidade. Tr&ecirc;s nomes funcionam como chaves mestras para o por&atilde;o da alma:</p>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Gilberto Gil &mdash; <em>Se eu quiser falar com Deus</em></p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">As notas abertas dessa can&ccedil;&atilde;o n&atilde;o pedem permiss&atilde;o: elas <em>entram</em>. A progress&atilde;o harm&ocirc;nica desce gradualmente, como quem desce uma escada de pedra em espiral rumo ao n&uacute;cleo da terra. Ouvi-la com os olhos fechados e a respira&ccedil;&atilde;o lenta &eacute; o equivalente auditivo de uma ora&ccedil;&atilde;o de tr&ecirc;s horas. Use-a como portal de entrada ao seu ritual.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Maria Beth&acirc;nia &mdash; <em>A felicidade</em> e <em>Sonho meu</em></p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Beth&acirc;nia n&atilde;o canta: ela evoca. Sua voz carrega a densidade de quem conhece a diferen&ccedil;a entre alegria e profundidade. Quando ela canta, o ouvinte &eacute; convidado a sentar-se diante de si mesmo &mdash; sem julgamento, sem pressa. &Eacute; a banda sonora do encontro com a pr&oacute;pria imagem no espelho &agrave;s cinco da manh&atilde;.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Ivan Lins &mdash; <em>Amar&eacute;</em> e <em>Somos todos iguais nesta noite</em></p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Lins comp&otilde;e com a precis&atilde;o de um relojoeiro e a alma de um pai. Suas mel&oacute;dias constroem pontes entre raz&atilde;o e emo&ccedil;&atilde;o &mdash; perfeitas para quem precisa reconciliar o que pensou com o que sentiu ao longo de uma vida inteira.</p>
                        </div>
                    </div>
                    <p style="font-size:14px;color:#7a5e32;font-style:italic;margin:20px 0 0;line-height:1.7;"><strong>Pr&aacute;tica Imediata:</strong> Monte uma playlist com essas tr&ecirc;s presen&ccedil;as. Dura&ccedil;&atilde;o ideal: 22 minutos. Toque sem interrup&ccedil;&atilde;o, em volume baixo, com os olhos fechados e as palmas das m&atilde;os viradas para cima sobre os joelhos.</p>
                </div>
                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Ritual da Solitude S&ecirc;nior</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">Um ritual s&oacute; tem poder quando &eacute; repetido com inten&ccedil;&atilde;o. N&atilde;o &eacute; a a&ccedil;&atilde;o que transforma &mdash; &eacute; a consci&ecirc;ncia que voc&ecirc; deposita nela. Quatro movimentos que comp&otilde;em o acesso di&aacute;rio ao seu santu&aacute;rio:</p>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">1</div>
                            <div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Esvaziamento (5 min)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sente-se com a coluna ereta. Inspire pelo nariz contando at&eacute; 4, segure por 4, expire pela boca contando at&eacute; 8. Repita 7 vezes. O mundo l&aacute; fora, por ora, pode esperar.</p></div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">2</div>
                            <div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Escuta (22 min)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ative sua playlist do Santu&aacute;rio. N&atilde;o analise as letras. Deixe a melodia agir como &aacute;gua morna em m&uacute;sculos enrijecidos. Se um pensamento vier, reconhe&ccedil;a-o como uma nuvem que passa &mdash; n&atilde;o o persiga.</p></div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">3</div>
                            <div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Declara&ccedil;&atilde;o (3 min)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva &agrave; m&atilde;o uma &uacute;nica frase que descreva o estado que voc&ecirc; quer carregar pelo dia. N&atilde;o uma tarefa. Um estado de ser. Exemplo: <em>&ldquo;Hoje eu sou o olho do furac&atilde;o.&rdquo;</em></p></div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">4</div>
                            <div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Lacre (2 min)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">De p&eacute;, respire fundo tr&ecirc;s vezes. Na terceira exala&ccedil;&atilde;o, diga: <em>&ldquo;Estou pronto.&rdquo;</em> Isso n&atilde;o &eacute; afirma&ccedil;&atilde;o positiva &mdash; &eacute; um comando ao seu pr&oacute;prio sistema nervoso.</p></div>
                        </div>
                    </div>
                </div>
                <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(197,160,89,0.6);color:#e8c97a;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">IV</span>
                        <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0;">O Legado da Calma</h3>
                    </div>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O xadrez nos ensina que o jogador que controla o centro do tabuleiro dita o ritmo do jogo. O Bispo v&ecirc; o que o advers&aacute;rio ainda n&atilde;o percebeu. O Cavalo salta por cima dos obst&aacute;culos &mdash; age onde ningu&eacute;m espera.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Voc&ecirc;, que pratica o Ritual da Solitude, torna-se ambos: a vis&atilde;o longa que enxerga o padr&atilde;o e o movimento &aacute;gil que age no momento certo. A calma n&atilde;o &eacute; aus&ecirc;ncia de for&ccedil;a. &Eacute; a forma mais elevada dela.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 24px;">E o seu legado? N&atilde;o s&atilde;o os bens materiais &mdash; &eacute; a mem&oacute;ria viva de algu&eacute;m que, mesmo sob press&atilde;o, manteve a serenidade. Que, mesmo no barulho, encontrou o sil&ecirc;ncio.</p>
                    <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;">
                        <p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Quem domina a si mesmo domina o tabuleiro. Quem domina o tabuleiro dita a hist&oacute;ria.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Princ&iacute;pio da Soberania S&ecirc;nior &mdash; SeniorHub</span></p>
                    </div>
                </div>
            </div>`,
        categoria: 'Sabedoria',
        gratis: false
    },
    {
        id: 'g3',
        titulo: 'O C&oacute;digo Invis&iacute;vel',
        descricao: 'O Mapa da Linhagem Soberana: Como blindar seu sistema nervoso e imortalizar seu legado atrav&eacute;s da alquimia dos v&iacute;nculos.',
        conteudo: `
            <div style="display:flex;flex-direction:column;gap:36px;">

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Engenharia do Pertencimento</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">H&aacute; um segredo que os pesquisadores das <em>Blue Zones</em> &mdash; as regi&otilde;es do planeta onde os seres humanos mais frequentemente ultrapassam os cem anos &mdash; tentaram esconder atr&aacute;s de dietas e rotinas de exerc&iacute;cio. O segredo real n&atilde;o est&aacute; no prato; est&aacute; na mesa. N&atilde;o est&aacute; no corpo; est&aacute; no c&iacute;rculo de pessoas que se senta ao seu redor.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Em Okinawa, os japoneses chamam de <em>moai</em> &mdash; um grupo de pessoas ligadas por obriga&ccedil;&atilde;o m&uacute;tua que se apoiam financeira, emocional e espiritualmente ao longo de uma vida inteira. Na Sard&eacute;nia, os pastores centeneros n&atilde;o apenas trabalham juntos: eles constroem sua identidade <em>em torno</em> do pertencimento. Em Loma Linda, na Calif&oacute;rnia, os advent&iacute;stas do S&eacute;timo Dia vivem mais n&atilde;o porque rezam mais &mdash; mas porque nunca est&atilde;o sozinhos enquanto rezam.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O pertencimento, compreendido em sua dimens&atilde;o mais profunda, &eacute; uma <strong>tecnologia biol&oacute;gica</strong>. Ele regula o sistema nervoso aut&ocirc;nomo, amortece o impacto do cort&iacute;sol e ativa circuitos cerebrais que nenhum medicamento sintetizado consegue replicar com a mesma precis&atilde;o. O n&uacute;cleo familiar &mdash; seja de sangue ou de escolha &mdash; n&atilde;o &eacute; um detalhe sentimental da sua exist&ecirc;ncia. &Eacute; sua infraestrutura de sobreviv&ecirc;ncia.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Quem ignora essa arquitetura envelhece mais r&aacute;pido. Quem a domina, domina o c&oacute;digo invis&iacute;vel da longevidade.</p>
                </div>

                <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Alquimista Hormonal &mdash; Ocitocina vs. Cortisol</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">Dentro do seu corpo existe uma guerra qu&iacute;mica que ningu&eacute;m te contou. De um lado, o <strong>cortisol</strong> &mdash; o horm&ocirc;nio do alarme, produzido em resposta a amea&ccedil;as reais ou imagin&aacute;rias. Em doses cr&ocirc;nicas, ele corroi o hipocampo, inflama as art&eacute;rias e suprime o sistema imunol&oacute;gico. Do outro lado, a <strong>ocitocina</strong> &mdash; o horm&ocirc;nio do v&iacute;nculo, liberado no contato f&iacute;sico, na convers&atilde;o genuinamente escutada, no olhar de reconhecimento entre pessoas que se amam.</p>
                    <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;">
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid #dc2626;">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Cortisol cr&ocirc;nico &mdash; o inimigo silencioso</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Solidez social baixa = cortisol elevado de forma persistente. O resultado: infla&ccedil;&atilde;o sist&ecirc;mica, compress&atilde;o do tel&ocirc;mero (o rel&oacute;gio biol&oacute;gico das c&eacute;lulas) e reduc&atilde;o da atividade do c&oacute;rtex pr&eacute;-frontal. Em outras palavras: a solidez limpa literalmente encurta o tempo que voc&ecirc; permanece afiado, vital e l&uacute;cido.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Ocitocina &mdash; a pedra filosofal biol&oacute;gica</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Cada abra&ccedil;o prolongado por mais de 20 segundos deflagra uma cascata de ocitocina que reduz a press&atilde;o arterial, aumenta a toler&acirc;ncia &agrave; dor e eleva a imunidade celular. Pesquisas da Universidade de Carnegie Mellon demonstraram que indiv&iacute;duos com redes de suporte robustas resistem 4 vezes mais ao rinovirus do que seus pares isolados. O abra&ccedil;o n&atilde;o &eacute; um gesto afetivo. &Eacute; uma interven&ccedil;&atilde;o farmacol&oacute;gica sem prescri&ccedil;&atilde;o.</p>
                        </div>
                    </div>
                    <p style="font-size:14px;color:#7a5e32;font-style:italic;line-height:1.7;"><strong>A&ccedil;&atilde;o imediata:</strong> Estabele&ccedil;a pelo menos um contato f&iacute;sico intencional por dia &mdash; um abra&ccedil;o, um aperto de m&atilde;o prolongado, um toque no ombro. N&atilde;o como gentileza. Como prescri&ccedil;&atilde;o.</p>
                </div>

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Movimento do Mestre: Rituais de Transfer&ecirc;ncia de Sabedoria</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">Existe uma diferen&ccedil;a fundamental entre quem <em>vive</em> na fam&iacute;lia e quem <em>governa</em> a linhagem. O primeiro ocupa espa&ccedil;o. O segundo define dire&ccedil;&atilde;o. A Transfer&ecirc;ncia de Sabedoria n&atilde;o acontece por acaso &mdash; ela &eacute; arquitetada com inten&ccedil;&atilde;o, repetida como ritual e calibrada como uma pe&ccedil;a de relojoaria.</p>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">1</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Ritual da Mesa Redonda (semanal)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Reserve um momento semanal &mdash; nem que seja uma chamada de v&iacute;deo de 30 minutos &mdash; onde voc&ecirc; compartilha uma hist&oacute;ria da sua trajet&oacute;ria com uma decis&atilde;o e uma li&ccedil;&atilde;o embutidas. N&atilde;o um lamento. Uma parab&oacute;la. Os descendentes n&atilde;o herdam o que voc&ecirc; diz; herdam o padr&atilde;o de como voc&ecirc; pensa.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">2</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Di&aacute;rio da Linhagem</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Inicie um caderno dedicado &mdash; f&iacute;sico, de capa dura &mdash; onde voc&ecirc; registra princ&iacute;pios, n&atilde;o eventos. N&atilde;o &ldquo;fui ao hospital em 1987&rdquo;, mas &ldquo;aprendi que a dignidade n&atilde;o negocia com o medo&rdquo;. Esse caderno &eacute; o seu testamento invis&iacute;vel &mdash; o documento que nenhum cart&oacute;rio registra, mas que nenhuma morte apaga.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">3</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Protocolo da Bussola &Eacute;tica</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando um descendente enfrentar uma decis&atilde;o dif&iacute;cil, n&atilde;o ofere&ccedil;a a resposta. Ofere&ccedil;a a pergunta certa. &ldquo;O que uma pessoa que voc&ecirc; admira faria nesse momento?&rdquo; &Eacute; assim que a b&uacute;ssola &eacute;tica &eacute; calibrada &mdash; n&atilde;o pela obedi&ecirc;ncia, mas pelo exemplo interiorizado. O Mestre Mentor n&atilde;o governa por decreto. Governa por perman&ecirc;ncia.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">4</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Cerim&ocirc;nia do Reconhecimento</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Uma vez por ano, recolha os que importam e nomeie em voz alta o que voc&ecirc; enxerga de excepcional em cada um. N&atilde;o como elogio social &mdash; como ato de consagra&ccedil;&atilde;o. O ser humano que &eacute; visto com clareza tende a tornar-se aquilo que lhe foi refletido. Voc&ecirc;, ao nomear, esculpe o car&aacute;ter de quem ama.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(197,160,89,0.6);color:#e8c97a;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">IV</span>
                        <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0;">A Fortaleza Inexpugn&aacute;vel</h3>
                    </div>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">A ci&ecirc;ncia j&aacute; equiparou o isolamento social cr&ocirc;nico ao h&aacute;bito de fumar quinze cigarros por dia. N&atilde;o metaforicamente &mdash; biologicamente. O c&oacute;digo invis&iacute;vel &eacute; este: a solidez do seu n&uacute;cleo define a qualidade da sua biologia. Manter essa fortaleza n&atilde;o &eacute; sentimentalismo; &eacute; a decis&atilde;o estrat&eacute;gica mais sofisticada que um ser humano pode tomar na segunda metade da vida.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O jogador de xadrez que sacrifica pe&ccedil;as para manter o rei protegido n&atilde;o est&aacute; recuando &mdash; est&aacute; executando a estrat&eacute;gia m&aacute;xima. Da mesma forma, cada intera&ccedil;&atilde;o que voc&ecirc; investe em fortalecer seus v&iacute;nculos &eacute; uma pe&ccedil;a posicionada no centro do tabuleiro da vida. O centro que ningu&eacute;m toma de voc&ecirc;.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 24px;">O seu legado n&atilde;o &eacute; o que voc&ecirc; deixa. &Eacute; o que continua se multiplicando depois que voc&ecirc; passou. Uma palavra certa no momento certo. Um abra&ccedil;o que calibrou um sistema nervoso. Uma hist&oacute;ria que forjou uma decis&atilde;o cr&iacute;tica. Isso &eacute; imortalidade &mdash; a &uacute;nica que a biologia permite e a filosofia consagra.</p>
                    <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;">
                        <p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Sua fortaleza n&atilde;o &eacute; feita de paredes. &Eacute; feita de presen&ccedil;as. Cuide delas como o general cuida do centro do tabuleiro &mdash; com precis&atilde;o, com inten&ccedil;&atilde;o, com soberania.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Princ&iacute;pio da Soberania Biol&oacute;gica &mdash; SeniorHub</span></p>
                    </div>
                </div>

            </div>`,
        categoria: 'Sabedoria',
        gratis: false
    },
    {
        id: 'g4',
        titulo: 'A Sinfonia da Sobreviv&ecirc;ncia',
        descricao: 'A Sinfonia da Sobreviv&ecirc;ncia: O manual pr&aacute;tico para usar frequ&ecirc;ncias sonoras como escudo cognitivo e regulador qu&iacute;mico da alma.',
        conteudo: `
            <div style="display:flex;flex-direction:column;gap:36px;">

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Maestro Interno: Como a M&uacute;sica Governa o C&eacute;rebro</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O c&eacute;rebro humano &eacute; o &uacute;nico &oacute;rg&atilde;o do universo conhecido que responde &agrave; m&uacute;sica como se ela fosse uma l&iacute;ngua nativa. N&atilde;o uma lingua aprendida &mdash; uma lingua <em>lembrada</em>. Enquanto a linguagem verbal ativa regi&otilde;es espec&iacute;ficas e bem delimitadas, uma &uacute;nica nota musical pode acender simultaneamente o c&oacute;rtex auditivo, o sistema l&iacute;mbico, o cerebelo, o corpo caloso e o n&uacute;cleo accumbens. &Eacute; o equivalente neurol&oacute;gico de iluminar um est&aacute;dio inteiro com um &uacute;nico interruptor.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O Global Council on Brain Health &mdash; o painel cient&iacute;fico mais respeitado em sa&uacute;de cerebral do envelhecimento &mdash; classifica o engajamento musical como uma das formas mais completas de estimula&ccedil;&atilde;o cognitiva dispon&iacute;vel ao ser humano. Mais completa que palavras cruzadas. Mais eficiente que jogging. Porque a m&uacute;sica n&atilde;o treina uma faculdade &mdash; ela orquestra o sistema inteiro.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Para o s&ecirc;nior, esse fato carrega uma implica&ccedil;&atilde;o estrat&eacute;gica de primeira ordem: <strong>a m&uacute;sica &eacute; o instrumento mais acess&iacute;vel de soberania neurol&oacute;gica j&aacute; descoberto</strong>. Ela n&atilde;o exige academia. N&atilde;o exige prescri&ccedil;&atilde;o. N&atilde;o tem efeito colateral. Exige apenas a decis&atilde;o consciente de deix&aacute;-la operar como a medicina que &eacute;.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O hipocampo &mdash; a estrutura cerebral respons&aacute;vel pela consolida&ccedil;&atilde;o de mem&oacute;rias &mdash; &eacute; uma das primeiras regi&otilde;es afetadas pelo envelhecimento. Mas possui uma propriedade singular: &eacute; profundamente sens&iacute;vel &agrave; m&uacute;sica afetiva. Ouvir uma melodia que carrega mem&oacute;ria emocional n&atilde;o &eacute; nostalgismo. &Eacute; reativa&ccedil;&atilde;o de cam&oacute;nhos neurais &mdash; um processo que os neurocientistas chamam de <em>priming evocativo</em>. Voc&ecirc; n&atilde;o ouve a m&uacute;sica e lembra. Voc&ecirc; ouve e o c&eacute;rebro <em>acende</em>.</p>
                </div>

                <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Frequ&ecirc;ncias Sagradas: O Segredo dos 432Hz e a Qu&iacute;mica da Dopamina</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">H&aacute; um debate silencioso entre engenheiros de &aacute;udio e neurocientistas sobre uma frequ&ecirc;ncia espec&iacute;fica: 432Hz. O padr&atilde;o moderno de afina&ccedil;&atilde;o musical &eacute; 440Hz &mdash; estabelecido em 1953 pela ISO. Mas antes dessa padroniza&ccedil;&atilde;o, muitos compositores, de Mozart a Verdi, compunham em 432Hz. A diferen&ccedil;a &eacute; de 8 ciclos por segundo. O efeito percebido, segundo estudos de percep&ccedil;&atilde;o auditiva, &eacute; que 432Hz ressoa como mais <em>&iacute;ntima</em>, menos aguda, mais pr&oacute;xima da freq&ucirc;&ecirc;ncia natural da respira&ccedil;&atilde;o humana.</p>
                    <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;">
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Dopamina &mdash; o arquiteto do prazer</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando a m&uacute;sica nos provoca <em>arrepios</em> &mdash; o fen&ocirc;meno chamado de <em>frisson</em> &mdash; o c&eacute;rebro libera dopamina em picos mensur&aacute;veis. A neurocientista Valorie Salimpoor demonstrou em 2011, via PET scan, que esses picos s&atilde;o id&ecirc;nticos aos produzidos por comida, sexo e cocaina. A m&uacute;sica sequestra o sistema de recompensa com a mesma precis&atilde;o de uma subst&acirc;ncia psicoativa &mdash; sem o d&eacute;ficit biol&oacute;gico que as subst&acirc;ncias deixam.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Os Grandes Mestres Brasileiros como Arquitetos da Cura</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Caetano Veloso</strong> constr&oacute;i tens&atilde;o harm&ocirc;nica que mant&eacute;m o c&oacute;rtex auditivo em estado de antecipa&ccedil;&atilde;o &mdash; o equivalente neurol&oacute;gico de uma medita&ccedil;&atilde;o ativa. <strong>Milton Nascimento</strong> opera em registros vocais que ativam o nervo vago, o mais longo do sistema nervoso aut&ocirc;nomo, induzindo calma profunda sem sedac&atilde;o. <strong>Gilberto Gil</strong> tece ritmos africanos que sincronizam as ondas cerebrais com o pulso da terra &mdash; o que os neurocientistas chamam de <em>entrainment</em> neural.</p>
                        </div>
                    </div>
                    <p style="font-size:14px;color:#7a5e32;font-style:italic;line-height:1.7;"><strong>Experimento imediato:</strong> Procure no YouTube por &ldquo;Caetano Veloso 432hz&rdquo; ou &ldquo;Milton Nascimento instrumental&rdquo;. Ou&ccedil;a com fones de ouvido, volume m&eacute;dio, em ambiente silencioso. Note a diferen&ccedil;a na qualidade da sua presen&ccedil;a ap&oacute;s 15 minutos.</p>
                </div>

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Protocolo do Ritmo: Higiene Sonora Di&aacute;ria</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A higiene sonora &eacute; a arte de curar o ambiente auditivo com a mesma intenci&otilde;nalidade com que se cuida da alimenta&ccedil;&atilde;o. O ru&iacute;do cr&ocirc;nico &mdash; TV ligada sem aten&ccedil;&atilde;o, not&iacute;cias em loop, convers&atilde;o ruidosa &mdash; eleva o cortisol e fragmenta a capacidade de foco. A m&uacute;sica estrat&eacute;gica faz o oposto. Aqui est&aacute; o protocolo:</p>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">1</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Playlist do Despertar (6h&ndash;9h)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Tom ascendente, ritmo progressivo. Come&ccedil;e com bossa nova instrumental suave (Jo&atilde;o Gilberto, Baden Powell), avance para MPB mais r&iacute;tmica (Djavan, Ivan Lins). O objetivo &eacute; sincronizar o ritmo circadiano com uma eleva&ccedil;&atilde;o gradual de cort&oacute;l e serotonina. O c&eacute;rebro acorda em estado de antecipa&ccedil;&atilde;o positiva &mdash; n&atilde;o de alarme.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">2</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Playlist do Foco (10h&ndash;12h)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Instrumental sem letra. O processamento verbal compete diretamente com a leitura e o pensamento anal&iacute;tico. Erudita brasileira (Villa-Lobos), jazz minimalista ou m&uacute;sica ambient criam o que neurocientistas chamam de <em>estado de fluxo</em> &mdash; absor&ccedil;&atilde;o total, tempo subjetivo acelerado, produ&ccedil;&atilde;o intelectual m&aacute;xima. Tempo ideal: 90 minutos cont&iacute;nuos.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">3</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Ritual da Mem&oacute;ria (tarde)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Selecione 3 m&uacute;sicas que carregam mem&oacute;rias emocionais significativas &mdash; positivas. Ou&ccedil;a uma por vez, com os olhos fechados, deixando a imagem mental se formar. Isso &eacute; <em>priming evocativo</em> intencional: reativa&ccedil;&atilde;o do hipocampo atrav&eacute;s de trilhas afetivas. Dura&ccedil;&atilde;o: 10 minutos. Freq&ucirc;encia recomendada: 4 vezes por semana.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">4</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Playlist do Repouso Inexpugn&aacute;vel (21h&ndash;23h)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Freq&uuml;&ecirc;ncias binaural delta (abaixo de 4Hz), canto gregoriano ou MPB lento e melanc&oacute;lico (Maria Beth&acirc;nia, Gal Costa em chave baixa). O objetivo &eacute; reduzir a frequ&ecirc;ncia das ondas cerebrais de beta (alerta) para alfa (relaxamento) e theta (sono). Volume: audi&iacute;vel apenas. Nunca ensurdecedor. O sil&ecirc;ncio &eacute; parte da m&uacute;sica.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(197,160,89,0.6);color:#e8c97a;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">IV</span>
                        <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0;">O Concerto da Imortalidade</h3>
                    </div>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Em 2020, pesquisadores da Universidade de Harvard publicaram um dado que a grand&iacute;ncia da descoberta torna quase inc&oacute;modo: adultos maiores que participam ativamente de atividades musicais &mdash; seja cantando em coral, tocando um instrumento ou dan&ccedil;ando com regularidade &mdash; apresentam c&eacute;rebros com volume hipocampal superior e velocidade de processamento 40% maior do que seus pares sedent&aacute;rios sonoramente.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Aprender um instrumento na maturidade &eacute; o feito cognitivo mais ousado que um ser humano pode executar: ele exige coordena&ccedil;&atilde;o motora fina nas duas m&atilde;os, leitura simult&acirc;nea de s&iacute;mbolos, processamento auditivo em tempo real e mem&oacute;ria de trabalho elevada. &Eacute; o treino de elite para o c&eacute;rebro &mdash; e ao contr&aacute;rio da academia, &eacute; tamb&eacute;m uma fonte de beleza, significado e express&atilde;o.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 24px;">A imortalidade que a biologia permite n&atilde;o &eacute; a aus&ecirc;ncia da morte &mdash; &eacute; a presen&ccedil;a plena at&eacute; o &uacute;ltimo compasso. Um c&eacute;rebro que vibra com m&uacute;sica &eacute; um c&eacute;rebro que resiste. Que lembra. Que sente. Que governa. A m&uacute;sica n&atilde;o acompanha a vida &mdash; ela <em>&eacute;</em> a vida organizada em frequ&ecirc;ncia.</p>
                    <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;">
                        <p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O maestro n&atilde;o toca nenhum instrumento. E ainda assim, &eacute; quem produz a m&uacute;sica. Voc&ecirc; &eacute; o maestro do seu c&eacute;rebro. A batuta est&aacute; na sua m&atilde;o.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Princ&iacute;pio da Soberania Neurol&oacute;gica &mdash; SeniorHub</span></p>
                    </div>
                </div>

            </div>`,
        categoria: 'Sabedoria',
        gratis: false
    },
    {
        id: 'g5',
        titulo: 'Como Blindar a Longevidade contra o Estresse',
        descricao: 'Blindagem contra o Estresse: O guia definitivo para gerenciar o cortisol e proteger seu patrim&ocirc;nio celular contra o desgaste do tempo.',
        conteudo: `
            <div style="display:flex;flex-direction:column;gap:36px;">

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Imposto Celular: Como o Cortisol Devora a Longevidade</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Existe um imposto que ningu&eacute;m vota, ningu&eacute;m assina e pouqu&iacute;ssimos percebem at&eacute; que o d&eacute;bito j&aacute; est&aacute; consumado. Chama-se <strong>cortisol cr&ocirc;nico</strong>. Em doses agudas, ele &eacute; um aliado: prepara o corpo para reagir a amea&ccedil;as reais, acelera o metabolismo, afina a aten&ccedil;&atilde;o. Mas quando persiste &mdash; quando o c&eacute;rebro n&atilde;o consegue distinguir entre um predador na savana e uma not&iacute;cia ansiog&ecirc;nica no celular &mdash; ele se torna o agente biol&oacute;gico mais destrutivo da modernidade.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A Nobel&iacute;sta Elizabeth Blackburn demonstrou que o estresse cr&ocirc;nico encurta os <em>tel&ocirc;meros</em> &mdash; as capas protetoras das extremidades dos cromossomos, o rel&oacute;gio biol&oacute;gico da c&eacute;lula. Tel&ocirc;meros curtos = c&eacute;lulas que envelhecem mais r&aacute;pido, se recuperam com mais dificuldade e s&atilde;o mais suscet&iacute;veis ao c&acirc;ncer. Em termos simples: cada dia de estresse n&atilde;o gerenciado deduz horas do seu patrim&ocirc;nio vital.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O cortisol elevado cronicamente tamb&eacute;m:</p>
                    <ul style="list-style:none;padding:0;display:flex;flex-direction:column;gap:10px;margin:0 0 16px;">
                        <li style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--gold);font-weight:800;font-size:17px;flex-shrink:0;">&#9654;</span><span style="font-size:15px;color:#374151;line-height:1.7;">Suprime o sistema imunol&oacute;gico, aumentando a vulnerabilidade a infec&ccedil;&otilde;es e processos autoimunes</span></li>
                        <li style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--gold);font-weight:800;font-size:17px;flex-shrink:0;">&#9654;</span><span style="font-size:15px;color:#374151;line-height:1.7;">Degrada o hipocampo, comprometendo a mem&oacute;ria de trabalho e a consolida&ccedil;&atilde;o de novas informa&ccedil;&otilde;es</span></li>
                        <li style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--gold);font-weight:800;font-size:17px;flex-shrink:0;">&#9654;</span><span style="font-size:15px;color:#374151;line-height:1.7;">Aumenta a inflama&ccedil;&atilde;o sist&ecirc;mica &mdash; o substrato comum das doen&ccedil;as cardiovasculares, diabetes tipo 2 e Alzheimer</span></li>
                        <li style="display:flex;gap:12px;align-items:flex-start;"><span style="color:var(--gold);font-weight:800;font-size:17px;flex-shrink:0;">&#9654;</span><span style="font-size:15px;color:#374151;line-height:1.7;">Reduz a produ&ccedil;&atilde;o de DHEA &mdash; o horm&ocirc;nio da vitalidade que declina com a idade e &eacute; acelerado pelo estresse</span></li>
                    </ul>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Gerenciar o estresse n&atilde;o &eacute; conforto. &Eacute; contabilidade celular de precis&atilde;o. &Eacute; a decis&atilde;o executiva de <em>n&atilde;o pagar um imposto indevido</em> sobre o seu tempo de vida.</p>
                </div>

                <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Interruptor Biol&oacute;gico: Dominando o Nervo Vago</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">O nervo vago &eacute; o cabo submarino do seu sistema nervoso aut&ocirc;nomo &mdash; o canal de comunica&ccedil;&atilde;o mais longo do corpo, que vai do tronco cerebral ao intestino, passando pelo cora&ccedil;&atilde;o, pulm&otilde;es e diafragma. Quando ativado, ele literalmente <em>desliga</em> o modo de alerta e liga o modo de repara&ccedil;&atilde;o. Os militares de opera&ccedil;&otilde;es especiais americanos usam esses protocolos antes de miss&otilde;es cr&iacute;ticas. Voc&ecirc; pode usar antes do caf&eacute; da manh&atilde;.</p>
                    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px;">
                        <div style="background:#fff;border-radius:12px;padding:18px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Respira&ccedil;&atilde;o Vagal (2 min &mdash; o protocolo m&iacute;nimo)</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Inspirar pelo nariz em 4 segundos &rarr; segurar por 1 segundo &rarr; expirar pela boca em 6&ndash;8 segundos. A expira&ccedil;&atilde;o prolongada &eacute; a chave: ela ativa o ramo parassimp&aacute;tico diretamente. A press&atilde;o arterial cai. A variabilidade da freq&uuml;&ecirc;ncia card&iacute;aca aumenta. O c&oacute;rtex pr&eacute;-frontal &mdash; respons&aacute;vel pelo julgamento e pela raz&atilde;o &mdash; volta ao comando.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:18px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Gargare jo com &Aacute;gua Fria (30 segundos)</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O ramo posterior do nervo vago envolve os m&uacute;sculos da faringe. Um gargarejo vigoroso com &aacute;gua fria por 30 segundos estimula diretamente esse ramo, enviando um sinal de &ldquo;seguran&ccedil;a&rdquo; ao tronco cerebral. Simples, imediato, surpreendentemente eficaz. Pode ser feito ap&oacute;s rece ber uma not&iacute;cia perturbadora ou antes de uma conversa importante.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:18px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Entona&ccedil;&atilde;o Vocal &mdash; o Hum do Sistema Nervoso</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Entoar um &ldquo;hmmmm&rdquo; grave e prolongado, sentindo a vibra&ccedil;&atilde;o no peito, estimula o nervo vago atrav&eacute;s da res son&acirc;ncia laringeal. O canto, o gargarejo e o zumbido s&atilde;o formas ancestrais que as culturas desenvolveram instintivamente para regular o sistema nervoso. Cante. Mesmo que sozinho. Especialmente se sozinho.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:18px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Exposi&ccedil;&atilde;o ao Frio (30&ndash;60 segundos)</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Finalizar o banho com &aacute;gua fria por 30 a 60 segundos eleva o tono vagal de forma mensur&aacute;vel. O Dr. Andrew Huberman, da Universidade de Stanford, documenta que esse est&iacute;mulo tamb&eacute;m eleva a dopamina basal em at&eacute; 250% por v&aacute;rias horas. &Eacute; um choque biol&oacute;gico positivo &mdash; o tipo que o corpo foi projetado para receber e do qual emerge mais forte.</p>
                        </div>
                    </div>
                    <p style="font-size:14px;color:#7a5e32;font-style:italic;line-height:1.7;"><strong>Protocolo m&iacute;nimo vi&aacute;vel:</strong> Escolha <em>um</em> desses t&eacute;cnicas e pratique por 7 dias consecutivos. O tono vagal &eacute; como um m&uacute;sculo: melhora com uso regular.</p>
                </div>

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Arquitetura da Calma: A Auditoria de Est&iacute;mulos e a Dieta do Sil&ecirc;ncio</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O c&eacute;rebro humano processou, durante 99% da hist&oacute;ria da esp&eacute;cie, no m&aacute;ximo a informa&ccedil;&atilde;o de uma aldeia. Hoje, em um &uacute;nico dia, ingere o equivalente a 174 jornais completos em dados digitais. O resultado &eacute; o que os neurocientistas chamam de <em>fadiga de decis&atilde;o</em> e <em>exaust&atilde;o sensorial</em> &mdash; estados que elevam o cortisol, reduzem a criatividade e comprometem a qualidade do sono.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A Dieta Digital n&atilde;o &eacute; abst&inuml;&ecirc;ncia. &Eacute; <strong>soberania de aten&ccedil;&atilde;o</strong>: a decis&atilde;o consciente de curar o que entra na sua mente com o mesmo rigor com que um sommelier seleciona o que entra em seu copo. Aqui est&aacute; o protocolo de auditoria:</p>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">1</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Janela de Not&iacute;cias (20 min/dia &mdash; n&atilde;o pela manh&atilde;)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">As primeiras horas do dia s&atilde;o neurol&oacute;gicamente preciosas: o c&eacute;rebro est&aacute; em modo alfa, receptivo e criativo. Consumir not&iacute;cias negativas nesse per&iacute;odo programa o sistema l&iacute;mbico para um estado de amea&ccedil;a que persiste por horas. Reserve as not&iacute;cias para o per&iacute;odo da tarde &mdash; ap&oacute;s o almo&ccedil;o &mdash; e limite a 20 minutos, de fontes selecionadas.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">2</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Regra do SilÃªncio Soberano (30 min/dia)</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Trinta minutos di&aacute;rios sem tela, sem &aacute;udio, sem intera&ccedil;&atilde;o. Apenas voc&ecirc; e o ambiente imediato. N&atilde;o como entedia mento &mdash; como pr&aacute;tica de restaura&ccedil;&atilde;o. &Eacute; nesse sil&ecirc;ncio que o c&eacute;rebro consolida informa&ccedil;&otilde;es, processa emo&ccedil;&otilde;es n&atilde;o resolvidas e produz insight. Os pensamentos mais estrat&eacute;gicos da sua vida provavelmente ocorreram no sil&ecirc;ncio.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">3</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Auditoria Semanal de Relacionamentos</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Nem toda fonte de estresse vem das telas. Relacionamentos que sistematicamente drenam energia, geram culpa ou ativam o sistema de amea&ccedil;a s&atilde;o t&atilde;o corrosivos quanto o cortisol qu&iacute;mico. Uma vez por semana, pergunte a si mesmo: &ldquo;Quais intera&ccedil;&otilde;es desta semana me deixaram mais pesado? Quais me deixaram mais leve?&rdquo; Redirecione o investimento de aten&ccedil;&atilde;o com base nessa auditoria.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(197,160,89,0.6);color:#e8c97a;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">IV</span>
                        <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0;">O Repouso do Mestre: Transformando Lazer em Neuroplasticidade</h3>
                    </div>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">H&aacute; uma diferen&ccedil;a fundamental entre o lazer que anestesia e o lazer que restaura. A televis&atilde;o em loop, o scroll infinito e o entretenimento de baixa densidade ocupam o c&eacute;rebro sem nouri-lo &mdash; como calorias vazias para a mente. O lazer contemplativo &eacute; o oposto: ele coloca o c&eacute;rebro em <em>estado de fluxo</em>, o estado de absor&ccedil;&atilde;o profunda identificado pelo psic&oacute;logo Mih&aacute;ly Cs&iacute;kszentmih&aacute;lyi como o pico do bem-estar humano.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">A jardinagem ativa a aten&ccedil;&atilde;o restaurat&oacute;ria &mdash; o tipo de foco que recupera a reserva cognitiva. A leitura densa constr&oacute;i novas sinapses e amplia o vocabul&aacute;rio emocional. A aprecia&ccedil;&atilde;o art&iacute;stica &mdash; visitar uma exposi&ccedil;&atilde;o, ouvir m&uacute;sica com aten&ccedil;&atilde;o total &mdash; ativa circuitos de recompensa que neutralizam os efeitos do cortisol acumulado.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 24px;">O Mestre n&atilde;o descansa por falta de energia. Descansa como ato estrat&eacute;gico de manuten&ccedil;&atilde;o do seu instrumento mais precioso: o c&eacute;rebro. Um c&eacute;rebro que repousa com inteli g&ecirc;ncia pensa com mais clareza, decide com mais sabedoria e envelhece com mais soberania.</p>
                    <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;">
                        <p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O estresse &eacute; um imposto que o mundo cobra sobre a sua aten&ccedil;&atilde;o. O s&aacute;bio paga o m&iacute;nimo poss&iacute;vel &mdash; e investe a diferen&ccedil;a em longevidade, clareza e paz inexpugn&aacute;vel.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Princ&iacute;pio do Patrim&ocirc;nio Vital &mdash; SeniorHub</span></p>
                    </div>
                </div>

            </div>`,
        categoria: 'Sabedoria',
        gratis: false
    },
    {
        id: 'g6',
        titulo: 'O Labirinto das Frequ&ecirc;ncias',
        descricao: 'O guia secreto para dominar a regula&ccedil;&atilde;o emocional atrav&eacute;s das vibra&ccedil;&otilde;es que sussurram ao cora&ccedil;&atilde;o.',
        conteudo: `
            <div style="display:flex;flex-direction:column;gap:36px;">

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Chave Mestra: O Som como Governo das Emo&ccedil;&otilde;es</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">No baile de m&aacute;scaras da exist&ecirc;ncia, a m&uacute;sica n&atilde;o &eacute; apenas entretenimento. &Eacute; o &uacute;nico est&iacute;mulo que atravessa simultaneamente o c&oacute;rtex racional, o sistema l&iacute;mbico emocional e o cerebelo motor &mdash; as tr&ecirc;s grandes arenas do ser humano &mdash; sem pedir permiss&atilde;o a nenhum deles. Uma nota correta no momento certo n&atilde;o acalma o estado emocional: ela o <em>governa</em>.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O magnetismo oculto entre as notas que os grandes compositores conhecem intuitivamente &eacute; hoje mapeado pela neuroci&ecirc;ncia com precis&atilde;o cir&uacute;rgica. A tens&atilde;o harm&ocirc;nica &mdash; aquela sensa&ccedil;&atilde;o de uma nota que ainda n&atilde;o resolveu, que suspende o tempo &mdash; ativa o c&oacute;rtex parietal e mantenhm o c&eacute;rebro em estado de antecipa&ccedil;&atilde;o prazerosa. A resolu&ccedil;&atilde;o harmÃ´nica &mdash; o acorde que finalmente pousa &mdash; libera dopamina em picos mensur&aacute;veis. O compositor &eacute; um engenheiro da qu&iacute;mica cerebral.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Para o sÃªnior soberano, esse conhecimento confere um superpoder discreto: a capacidade de <em>desenhar o pr&oacute;prio estado interno</em> com a mesma inten&ccedil;Ã£o com que um arquiteto desenha um ambiente. Voc&ecirc; n&atilde;o espera o humor chegar. Voc&ecirc; convoca o humor que precisa, atrav&eacute;s das frequ&ecirc;ncias que j&aacute; conhece e das que ainda vai descobrir.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O hipocampo &mdash; arquivista da mem&oacute;ria emocional &mdash; &eacute; particularmente sens&iacute;vel &agrave;s melodias que carregam hist&oacute;ria afetiva. Ouvir uma can&ccedil;&atilde;o que esteve presente num momento de grande amor ou de grande superac&atilde;o n&atilde;o &eacute; apenas record&acirc;-lo: &eacute; reativar os circuitos neurais que aquele estado produziu. &Eacute; reinstalar, temporariamente, a vers&atilde;o de voc&ecirc; que viveu aquele momento. A chave mestra est&aacute; na m&uacute;sica. A porta &eacute; voc&ecirc;.</p>
                </div>

                <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Enigma dos 432 Hz: Alinhando a Biologia ao Ritmo do Universo</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Em 1953, a ISO (Organiza&ccedil;&atilde;o Internacional de Normaliza&ccedil;&atilde;o) padronizou a afina&ccedil;&atilde;o musical mundial em 440 Hz. Antes disso, compositores de Vivaldi a Verdi escreviam em escalas que naturalmente gravitavam em torno dos 432 Hz. A diferen&ccedil;a &eacute; de apenas 8 ciclos por segundo. Mas a percep&ccedil;&atilde;o humana, segundo estudos de acustica perceptiva, registra essa dist&acirc;ncia como a diferen&ccedil;a entre uma sala friamente iluminada por fluorescentes e uma sala aquecida por velas.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">Os 432 Hz coincidem matematicamente com freq&uuml;&ecirc;ncias encontradas na natureza: o batimento card&iacute;aco em repouso, as ondas do mar em respira&ccedil;&atilde;o lenta, as freq&uuml;&ecirc;ncias eletromagn&eacute;ticas da terra (freq&uuml;&ecirc;ncia de Schumann). Essa ressonÃ¢ncia n&atilde;o &eacute; m&iacute;stica &mdash; &eacute; matem&aacute;tica. O corpo, ao ser exposto a ela de forma sustentada, tende a <em>entrar em sincronicidade</em> com um ritmo que j&aacute; conhece biologicamente.</p>
                    <div style="display:flex;flex-direction:column;gap:14px;margin-bottom:20px;">
                        <div style="background:#fff;border-radius:12px;padding:18px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O Protocolo da Escuta Soberana em 432 Hz (10 minutos)</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>Passo 1:</strong> Encontre no YouTube ou Spotify m&uacute;sicas etiquetadas como &ldquo;432hz&rdquo; (existem vers&otilde;es de MPB, bossa nova e erudita remasterizadas nessa afinaÃ§Ã£o).<br><strong>Passo 2:</strong> Use fones de ouvido de qualidade. Sente-se ou deite-se em posi&ccedil;&atilde;o confort&aacute;vel. Volume: audÃ­vel mas suave.<br><strong>Passo 3:</strong> Feche os olhos e dirija a aten&ccedil;&atilde;o &agrave; regi&atilde;o do peito &mdash; n&atilde;o ao pensamento. Deixe a melodia ressoar no corpo, n&atilde;o na mente.<br><strong>Resultado esperado ap&oacute;s 10 minutos:</strong> redu&ccedil;&atilde;o mensur&aacute;vel da freq&uuml;&ecirc;ncia respirat&oacute;ria, sensa&ccedil;&atilde;o de expans&atilde;o t&oacute;raxica e redu&ccedil;&atilde;o da tens&atilde;o muscular na cervical e ombros.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:18px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A Encontro Clandestino com a Ans iedade</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando a ansiedade surge &mdash; aquela freq&uuml;&ecirc;ncia irregular que condensa o peito e acelera o pensamento &mdash; a tentativa de suprimi-la com for&ccedil;a de vontade raramente funciona. O que funciona &eacute; substituir uma freq&uuml;&ecirc;ncia por outra. Ative sua m&uacute;sica em 432 Hz. Em menos de 3 minutos, o c&eacute;rebro come&ccedil;a a seguir o ritmo do que ouve &mdash; &eacute; o fen&ocirc;meno do <em>entrainment</em> neural. A ansiedade n&atilde;o &eacute; for&ccedil;ada a partir. &Eacute; substituÃ­da por uma freq&uuml;&ecirc;ncia mais poderosa.</p>
                        </div>
                    </div>
                </div>

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Portais Brasileiros: A Geometria Sagrada de Caetano, Milton e Jorge Ben</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A m&uacute;sica brasileira, em seus apogeus, &eacute; uma das express&otilde;es art&iacute;sticas mais sofisticadas que a humanidade produziu. N&atilde;o por acaso &mdash; mas porque nasceu da fus&atilde;o de tr&ecirc;s cosmos musicais distintos (europeu, africano e ind&iacute;gena) num mesmo solo, destilada por g&ecirc;nios que compreenderam intuitivamente o que a neuroci&ecirc;ncia levaria d&eacute;cadas para formalizar. Tr&ecirc;s portais, tr&ecirc;s geometrias, tr&ecirc;s fun&ccedil;&otilde;es neurol&oacute;gicas:</p>
                    <div style="display:flex;flex-direction:column;gap:20px;">
                        <div style="background:#fff;border:1px solid #f0e8d4;border-radius:16px;padding:24px;border-top:4px solid var(--gold);">
                            <p style="font-size:17px;font-weight:900;color:#2a1a06;margin:0 0 4px;">Caetano Veloso &mdash; <em>CajuÃ­na</em></p>
                            <p style="font-size:13px;color:var(--gold-dark);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin:0 0 14px;">Portal da Melancolia Soberana</p>
                            <p style="font-size:15px;color:#374151;line-height:1.85;margin:0;">Caetano construiu em &ldquo;CajuÃ­na&rdquo; algo que poucos compositores conseguem: transformar a saudade em beleza cristalina sem resolv&ecirc;-la. A mel&aacute;ncolia da can&ccedil;&atilde;o n&atilde;o pede para ser consertada &mdash; pede para ser <em>habitada</em>. Neurologicamente, esse &eacute; um estado de processamento emocional profundo: o sistema l&iacute;mbico conclui ciclos afetivos que ficaram abertos. A tristeza que a can&ccedil;&atilde;o evoca n&atilde;o &eacute; negativa &mdash; &eacute; catarse. &Eacute; o choro que limpa. A tens&atilde;o harm&ocirc;nica insolÃºvel de Caetano mant&eacute;m o c&eacute;rebro suspenso num estado meditativo profundo, onde o tempo perde a urgÃªncia e a mente encontra clareza.</p>
                        </div>
                        <div style="background:#fff;border:1px solid #f0e8d4;border-radius:16px;padding:24px;border-top:4px solid var(--gold);">
                            <p style="font-size:17px;font-weight:900;color:#2a1a06;margin:0 0 4px;">Milton Nascimento &mdash; <em>Ponta de Areia</em></p>
                            <p style="font-size:13px;color:var(--gold-dark);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin:0 0 14px;">Portal da Mem&oacute;ria Tel&uacute;rica</p>
                            <p style="font-size:15px;color:#374151;line-height:1.85;margin:0;">A voz de Milton opera em freq&uuml;&ecirc;ncias que ativam o nervo vago diretamente. Sua extens&atilde;o de falsete &mdash; aquela qualidade de voz que parece vir de outro plano &mdash; n&atilde;o &eacute; apenas t&eacute;cnica vocal; &eacute; um est&iacute;mulo neurol&oacute;gico que induz o sistema nervoso parasssimp&aacute;tico sem esfor&ccedil;o. &ldquo;Ponta de Areia&rdquo;, especificamente, evoca a geograf&iacute;a do interior de Minas Gerais com uma densidade temporal que for&ccedil;a o c&eacute;rebro a desacelerar. O hipocampo, ao receber essa paisagem sonora, ativa mem&oacute;rias de lugares seguros, de inf&acirc;ncias protegidas, de ra&iacute;zes. &Eacute; uma &acirc;ncora de resili&ecirc;ncia disfarc&ccedil;ada de can&ccedil;&atilde;o.</p>
                        </div>
                        <div style="background:#fff;border:1px solid #f0e8d4;border-radius:16px;padding:24px;border-top:4px solid var(--gold);">
                            <p style="font-size:17px;font-weight:900;color:#2a1a06;margin:0 0 4px;">Jorge Ben Jor &mdash; <em>Taj Mahal</em> e <em>Que Pena</em></p>
                            <p style="font-size:13px;color:var(--gold-dark);font-weight:700;text-transform:uppercase;letter-spacing:.6px;margin:0 0 14px;">Portal da Vitalidade Solar</p>
                            <p style="font-size:15px;color:#374151;line-height:1.85;margin:0;">Jorge Ben Jor &eacute; o arquiteto do <em>groove</em> cerebral. Seus ritmos sin&ccedil;opados africanos &mdash; o balanÃ§o perpet&iacute;uo entre o tempo e o contratempo &mdash; for&ccedil;am o cerebelo e os gÃ¢nglios da base a sincronizar. O resultado n&atilde;o &eacute; apenas alegria: &eacute; uma ativa&ccedil;&atilde;o motora global que eleva o humor atrav&eacute;s da dopamina e da norepin&eacute;frina. O corpo quer se mover. E mover-se &eacute; vida. Quando o s&ecirc;nior precisa sair de um estado de inÃ©rcia emocional ou combater o torpor do tÃ©dio, Jorge Ben &eacute; a prescri&ccedil;&atilde;o correta &mdash; sem colaterais, sem prescri&ccedil;&atilde;o m&eacute;dica.</p>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(197,160,89,0.6);color:#e8c97a;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">IV</span>
                        <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0;">O Poder do Sil&ecirc;ncio: O Encontro Clandestino com o Pr&oacute;prio Ser</h3>
                    </div>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">H&aacute; um paradoxo que os grandes m&uacute;sicos conhecem e os grandes fil&oacute;sofos documentaram: a m&uacute;sica n&atilde;o existe apenas nas notas. Existe, sobretudo, no sil&ecirc;ncio <em>entre</em> elas. O compositor Claude Debussy afirmou que &ldquo;a m&uacute;sica &eacute; o espa&ccedil;o entre as notas&rdquo;. Neurologicamente, esse espa&ccedil;o &eacute; onde o c&eacute;rebro integra, processa e consolida. &Eacute; onde a emo&ccedil;&atilde;o evocada deposita seu significa do mais profundo.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O sil&ecirc;ncio intencional &mdash; aquele que se escolhe ap&oacute;s a m&uacute;sica, ou que se cultiva antes dela &mdash; &eacute; o labirinto em que o ser se reencontra. Nele, sem o ru&iacute;do do mundo e sem a constru&ccedil;&atilde;o da linguagem, emergem as verdades que o cotidiano mascara. &Eacute; nesse sil&ecirc;ncio que o s&ecirc;nior soberano ouve com clareza o que j&aacute; sabe &mdash; e decide com sabedoria o que ainda fazer.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 24px;">Ao escolher sua trilha sonora com inten&ccedil;&atilde;o, voc&ecirc; n&atilde;o est&aacute; apenas ouvindo. Voc&ecirc; est&aacute; tecendo, nota a nota, o ambiente interno em que seus pensamentos mais elevados nascem. V&ecirc;, &eacute; isso que separa quem &eacute; governado pelas emo&ccedil;&otilde;es de quem as governa: a consci&ecirc;ncia de que o estado interno &eacute; uma escolha &mdash; e a m&uacute;sica correta &eacute; um dos instrumentos mais precisos para exerc&ecirc;-la.</p>
                    <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;">
                        <p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;No labirinto das freq&uuml;&ecirc;ncias, o fio de Ariadne n&atilde;o &eacute; de ouro &mdash; &eacute; de som. Quem o segue com consci&ecirc;ncia sempre encontra o caminho de volta a si mesmo.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Princ&iacute;pio da Soberania Sonora &mdash; SeniorHub</span></p>
                    </div>
                </div>

            </div>`,
        categoria: 'Sabedoria',
        gratis: false
    },
    {
        id: 'g7',
        titulo: 'A Fronteira da Longevidade',
        descricao: 'O guia pr&aacute;tico para transformar suas viagens em um protocolo de renova&ccedil;&atilde;o celular e expans&atilde;o da alma.',
        conteudo: `
            <div style="display:flex;flex-direction:column;gap:36px;">

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Inimigo Invis&iacute;vel: Entropia e a Estagna&ccedil;&atilde;o do Ser</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A entropia &eacute; a segunda lei da termodin&acirc;mica: sistemas fechados tendem Ã  desordem e ao decl&iacute;nio progressivo. O organismo humano n&atilde;o &eacute; exce&ccedil;&atilde;o. Quando o ambiente &eacute; constante &mdash; os mesmos c&oacute;modos, os mesmos caminhos, as mesmas convers&otilde;es &mdash; o c&eacute;rebro entra em modo de economia de energia. Menos sinapses ativas. Menos dopamina bar&aacute;sal. Menos testosterona e DHEA. Em termos biol&oacute;gicos: o organismo interpreta a aus&ecirc;ncia de novidade como o encerramento da necessidade de se manter agudo.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A Universidade Edith Cowan, na Austr&aacute;lia, publicou dados que comprovam o que os grandes viajantes da hist&oacute;ria j&aacute; intuÃ­am: a exposi&ccedil;&atilde;o a novos ambientes &mdash; cheiros desconhecidos, idiomas n&atilde;o familiares, arquiteturas que o olho ainda n&atilde;o mapeou &mdash; <strong>retarda a entropia biol&oacute;gica</strong>. N&atilde;o metaforicamente: nos marcadores biol&oacute;gicos de envelhecimento celular, o viajante consistente exibe tel&ocirc;meros mais longos e infla&ccedil;&atilde;o sist&ecirc;mica mais baixa do que seu par sed ent&aacute;rio.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A l&oacute;gica &eacute; poderosa: o organismo que percebe novidade interpreta que ainda h&aacute; mundo a conquistar. E os sistemas biol&oacute;gicos que acreditam ter uma miss&atilde;o a cumprir resistem ao decl&iacute;nio com uma consist&ecirc;ncia que nenhum suplemento replica.</p>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Viajar, portanto, n&atilde;o &eacute; escapismo. &Eacute; o antidoto mais sofisticado contra a entropia que a exist&ecirc;ncia humana descobriu. &Eacute; um comando biol&oacute;gico de renova&ccedil;&atilde;o entregue diretamente ao c&eacute;rebro atrav&eacute;s da experi&ecirc;ncia.</p>
                </div>

                <div style="background:#fdf8f0;border-radius:16px;padding:28px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Muscula&ccedil;&atilde;o Cerebral: O Impacto Neurobiol&oacute;gico de Novos Horizontes</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">Na maturidade, o c&eacute;rebro prefere a efici&ecirc;ncia &agrave; novidade. &Eacute; uma estrat&eacute;gia evolutiva: consolidar os circuitos que funcionam, poupar energia dos caminhos j&aacute; conhecidos. O problema &eacute; que essa efici&ecirc;ncia, sem o est&iacute;mulo do novo, torna-se rigidez. E rigidez neural &eacute; o substrato do declÃ­nio cognitivo.</p>
                    <div style="display:flex;flex-direction:column;gap:16px;margin-bottom:20px;">
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Neuroplasticidade Geogr&aacute;fica</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Cada novo ambiente for&ccedil;a o hipocampo a construir um mapa espacial inÃ©dito &mdash; um processo chamado de <em>mapeamento cognitivo</em>. Navegar por uma cidade desconhecida, orientar-se por refer&ecirc;ncias visuais ainda n&atilde;o catalogadas, calcular dist&acirc;ncias em outro sistema de medi&ccedil;&atilde;o: tudo isso &eacute; treino de alta intensidade para o c&eacute;rebro. O hipocampo cresce literalmente &mdash; estudos de neuroimagem confirmam aumento de volume em viajantes frequentes acima dos 60 anos.</p>
                        </div>
                        <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);">
                            <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Reserva Cognitiva como Estrat&eacute;gia de Imunidade</p>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O conceito de <em>reserva cognitiva</em> descreve a capacidade do c&eacute;rebro de compensar danos e continuar funcionando com efici&ecirc;ncia. Pessoas com alta reserva cognitiva &mdash; constru&iacute;da atrav&eacute;s de educa&ccedil;&atilde;o, leitura, engajamento social e <strong>experi&ecirc;ncias diversificadas</strong> &mdash; desenvolvem os sintomas do Alzheimer anos ou d&eacute;cadas mais tarde do que seus pares com menor reserva, mesmo com a mesma quantidade de placa amiloide no c&eacute;rebro. Viajar &eacute; um dos investimentos mais potentes nessa reserva.</p>
                        </div>
                    </div>
                    <div style="background:#fff;border-radius:12px;padding:20px 22px;border:1.5px solid var(--gold);">
                        <p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 10px;">O Checklist do Viajante Soberano (Preparo Mental)</p>
                        <div style="display:flex;flex-direction:column;gap:10px;">
                            <div style="display:flex;gap:10px;align-items:flex-start;"><span style="color:var(--gold);font-weight:900;font-size:16px;flex-shrink:0;">&#10003;</span><p style="font-size:14px;color:#374151;line-height:1.7;margin:0;"><strong>Antes de embarcar:</strong> estude 5 palavras no idioma local + 1 prato t&iacute;pico + 1 fato hist&oacute;rico incomum. N&atilde;o para impressionar &mdash; para criar ancoragens cognitivas que dar&atilde;o contexto &agrave; experi&ecirc;ncia.</p></div>
                            <div style="display:flex;gap:10px;align-items:flex-start;"><span style="color:var(--gold);font-weight:900;font-size:16px;flex-shrink:0;">&#10003;</span><p style="font-size:14px;color:#374151;line-height:1.7;margin:0;"><strong>No destino:</strong> reserve pelo menos 2 horas sem roteiro. Caminhe sem mapa. Deixe que a cidade revele sua geometria. &Eacute; nessa desordem controlada que o hipocampo trabalha mais.</p></div>
                            <div style="display:flex;gap:10px;align-items:flex-start;"><span style="color:var(--gold);font-weight:900;font-size:16px;flex-shrink:0;">&#10003;</span><p style="font-size:14px;color:#374151;line-height:1.7;margin:0;"><strong>DiÃ¡rio de Auditoria Cultural:</strong> ao final de cada dia, escreva <em>uma</em> coisa que esse lugar faz diferente do Brasil &mdash; e o que voc&ecirc; aprenderia se adotasse esse padr&atilde;o em sua pr&oacute;pria vida.</p></div>
                            <div style="display:flex;gap:10px;align-items:flex-start;"><span style="color:var(--gold);font-weight:900;font-size:16px;flex-shrink:0;">&#10003;</span><p style="font-size:14px;color:#374151;line-height:1.7;margin:0;"><strong>Interaja com locais:</strong> um caf&eacute; com um morador, uma pergunta a um comerciante, um sorriso trocado com um desconhecido em uma pra&ccedil;a. Esse contato intergeracional e intercultural &eacute; ocitocina e dopamina em dose &uacute;nica.</p></div>
                        </div>
                    </div>
                </div>

                <div>
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:#fdf8f0;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                        <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Alquimia da Jornada: Resili&ecirc;ncia e Contempla&ccedil;&atilde;o em Solo Estrangeiro</h3>
                    </div>
                    <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">H&aacute; dois tipos de viajantes no mundo. O <strong>Turista</strong> atravessa o espa&ccedil;o em busca de checkmarks &mdash; fotos que provam presen&ccedil;a, roteiros cumpridos, museus vistoriados. O <strong>Soberano</strong> atravessa o espa&ccedil;o em busca de percep&ccedil;&atilde;o &mdash; de entender como outros seres humanos resolveram os mesmos problemas que ele enfrenta, com recursos diferentes e em contextos diferentes. A diferen&ccedil;a n&atilde;o &eacute; o destino. &Eacute; a <em>postura interrogativa</em>.</p>
                    <div style="display:flex;flex-direction:column;gap:16px;">
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">1</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Arte da Contempla&ccedil;&atilde;o &mdash; a <em>Dolce Vita</em> como Estado de Esp&iacute;rito</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sentar-se em uma pra&ccedil;a italiana e observar o tempo passar sem culpa. Beber um caf&eacute; em Viena sem o celular sobre a mesa. Assistir ao amanhecer num templo asiatico em sil&ecirc;ncio. Esses n&atilde;o s&atilde;o momentos perdidos &mdash; s&atilde;o momentos de <em>aten&ccedil;&atilde;o restaurativa</em>: um estado comprovado de recupera&ccedil;&atilde;o da reserva cognitiva que a rotina fragment ada sistematicamente drena.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">2</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Imprevisto como Pal&ecirc;stra de Resili&ecirc;ncia</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voo cancelado. Hotel diferente do esperado. Men&uacute; inteiramente em idioma desconhecido. Em solo estrangeiro, o imprevisto &eacute; garantido. E &eacute; exatamente isso que o torna t&atilde;o valioso: cada improviso bem resolv ido recalibra o c&eacute;rebro para a flexibilidade. Voc&ecirc; aprende na pr&aacute;tica que sua paz <em>n&atilde;o depende do controle do ambiente</em> &mdash; depende da qualidade da sua resposta a ele.</p>
                            </div>
                        </div>
                        <div style="display:flex;gap:16px;align-items:flex-start;">
                            <div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">3</div>
                            <div>
                                <p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Conex&atilde;o Intergeracional &mdash; O Ant&iacute;doto contra o Isolamento</p>
                                <p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Interagir com pessoas de outras culturas e gera&ccedil;&otilde;es ativa os circuitos de curiosidade e pertenimento. O sÃªnior que viaja n&atilde;o &eacute; apenas um consumidor de cultura &mdash; &eacute; um embaixador do seu pr&oacute;prio mundo. Cada conversa genuina com um estrangeiro &eacute; uma dose de ocitocina, uma redu&ccedil;&atilde;o do isolamento e uma prova de que o mundo &eacute; vasto, generoso e ainda cheio de surpresas que valem ser encontradas.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                        <span style="background:rgba(255,255,255,0.12);border:1.5px solid rgba(197,160,89,0.6);color:#e8c97a;font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">IV</span>
                        <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0;">O Passaporte da Imortalidade: Como o Movimento Gera Vida</h3>
                    </div>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O passaporte &eacute; o documento que o Estado emite para que voc&ecirc; atravesse fronteiras. Mas h&aacute; um outro passaporte &mdash; invis&iacute;vel, intransfer&iacute;vel, acumulado ao longo de cada jornada &mdash; que &eacute; o capital de experi&ecirc;ncias que transforma a percep&ccedil;&atilde;o do tempo. Quem viaja com consci&ecirc;ncia envelhece cronologicamente, mas percebe subjetivamente uma vida <em>mais longa</em>, porque o c&eacute;rebro mede o tempo passado pelo n&uacute;mero de mem&oacute;rias novas formadas, n&atilde;o pelo n&uacute;mero de dias transcorridos.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Um anode rotina cont&eacute;m, em mem&oacute;rias distintas, muito menos do que duas semanas num lugar desconhecido. Isso n&atilde;o &eacute; poes ia &mdash; &eacute; neuropsicologia do tempo subjetivo. O viajante lembra mais, vive mais intensamente e, ao final, sente que viveu <em>mais</em>. Porque viveu.</p>
                    <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 24px;">O verdadeiro patrim&ocirc;nio de um s&ecirc;nior n&atilde;o est&aacute; nos bens que guarda. Est&aacute; nas mem&oacute;rias que construiu, nos horizontes que cruzou, nas pessoas que encontrou e nos momentos em que ousou ser um estranho num lugar estranho &mdash; e descobriu, invariavelmente, que o mundo acolhe quem chega com abertura e presen&ccedil;a real.</p>
                    <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;">
                        <p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O s&ecirc;nior que viaja n&atilde;o foge da idade &mdash; comanda o tempo. Cada carimbo no passaporte &eacute; uma ordem de renova&ccedil;&atilde;o entregue ao pr&oacute;prio organismo. Mova-se, portanto, com a soberania de quem sabe que o movimento &eacute; vida.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Princ&iacute;pio da Fronteira da Longevidade &mdash; SeniorHub</span></p>
                    </div>
                </div>

            </div>`,
        categoria: 'Sabedoria',
        gratis: false
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

/* ── Guias — renderização com paywall ───────────────────────────────────── */
function renderGuias() {
    setActiveLink('sidebar-link-guias');
    const viewer = document.getElementById('content-viewer');
    const isSubscriber = window.SeniorAuth && window.SeniorAuth.isSubscriber();

    const ids = GUIAS_DATA.map(g => g.id);

    const cardsHTML = GUIAS_DATA.map((g, idx) => {
        const isFree = g.gratis || isSubscriber;
        const guiaBadge = `<span class="guia-badge">Guia</span>`;
        const prevId = idx > 0             ? ids[idx - 1] : null;
        const nextId = idx < ids.length-1  ? ids[idx + 1] : null;

        const navButtons = `
            <div style="display:flex;justify-content:space-between;align-items:center;
                        margin-top:28px;padding-top:20px;border-top:1px solid #f0e8d4;gap:12px;">
                ${ prevId
                    ? `<button onclick="toggleGuia('${g.id}');toggleGuia('${prevId}');"
                              style="display:flex;align-items:center;gap:6px;background:#fff;
                                     border:1.5px solid var(--gold);color:var(--gold-dark);
                                     font-size:13px;font-weight:700;padding:10px 18px;
                                     border-radius:8px;cursor:pointer;transition:background .2s;"
                              onmouseover="this.style.background='#fdf8f0';"
                              onmouseout="this.style.background='#fff';">
                           <i class="ph ph-arrow-left" style="font-size:15px;"></i> Guia anterior
                         </button>`
                    : `<span></span>`}
                ${ nextId
                    ? `<button onclick="toggleGuia('${g.id}');toggleGuia('${nextId}');"
                              style="display:flex;align-items:center;gap:6px;background:#fff;
                                     border:1.5px solid var(--gold);color:var(--gold-dark);
                                     font-size:13px;font-weight:700;padding:10px 18px;
                                     border-radius:8px;cursor:pointer;transition:background .2s;"
                              onmouseover="this.style.background='#fdf8f0';"
                              onmouseout="this.style.background='#fff';">
                           Próximo guia <i class="ph ph-arrow-right" style="font-size:15px;"></i>
                         </button>`
                    : `<span></span>`}
            </div>`;

        // Toggle button shown in the header
        const toggleBtn = `
            <button id="guia-btn-${g.id}" onclick="toggleGuia('${g.id}')"
                    style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px;
                           background:#fff;border:1.5px solid var(--gold);color:var(--gold-dark);
                           font-size:13px;font-weight:700;padding:9px 18px;border-radius:8px;
                           cursor:pointer;margin-top:8px;transition:background .2s;"
                    onmouseover="this.style.background='#fdf8f0';"
                    onmouseout="this.style.background='#fff';">
                Ver Guia <i class="ph ph-caret-down" style="font-size:14px;vertical-align:middle;"></i>
            </button>`;

        if (isFree) {
            return `
            <div class="guia-card" id="guia-card-${g.id}">
                <div class="guia-card__header" onclick="toggleGuia('${g.id}')" style="cursor:pointer;">
                    ${guiaBadge}
                    <h2 class="guia-card__title">${g.titulo}</h2>
                    <p class="guia-card__desc">${g.descricao}</p>
                    ${toggleBtn}
                </div>
                <div id="guia-body-${g.id}" class="guia-card__body" style="display:none;">
                    ${g.conteudo}
                    ${navButtons}
                </div>
            </div>`;
        } else {
            return `
            <div class="guia-card guia-card--locked" id="guia-card-${g.id}">
                <div class="guia-card__header" onclick="toggleGuia('${g.id}')" style="cursor:pointer;">
                    ${guiaBadge}
                    <h2 class="guia-card__title">${g.titulo}</h2>
                    <p class="guia-card__desc">${g.descricao}</p>
                    ${toggleBtn}
                </div>
                <div id="guia-body-${g.id}" style="display:none;position:relative;">
                    <div class="guia-card__body guia-card__body--blurred" aria-hidden="true">
                        ${g.conteudo}
                    </div>
                    <div class="guia-lock-overlay" style="position:relative;height:auto;background:none;
                               display:flex;flex-direction:column;align-items:center;
                               padding:36px 28px;text-align:center;gap:14px;">
                        <div class="guia-lock-icon">
                            <i class="ph ph-lock" style="font-size:32px;color:var(--sage-green);"></i>
                        </div>
                        <p class="guia-lock-msg">Acesso exclusivo para assinantes do Clube SeniorHub</p>
                        <a href="${window.CLUBE_CHECKOUT_URL || '#'}" target="_blank" rel="noopener noreferrer"
                           class="guia-lock-btn">Assinar o Clube — R$ 20/mês</a>
                    </div>
                    ${navButtons}
                </div>
            </div>`;
        }
    }).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card slide-in-right';
    wrapper.innerHTML = `
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;
                  color:var(--sage-green);margin-bottom:20px;cursor:pointer;"
           onclick="loadNewsFeed()">← Início</p>

        <div style="margin-bottom:36px;">
            <span style="display:inline-block;background:#fdf8f0;color:var(--sage-green);
                         font-size:12px;font-weight:700;text-transform:uppercase;
                         letter-spacing:.6px;padding:4px 14px;border-radius:20px;margin-bottom:14px;">
                Biblioteca de Guias
            </span>
            <h1 style="font-size:28px;font-weight:900;color:#2a1a06;margin:0 0 8px;">
                Guias Práticos para o seu Dia a Dia
            </h1>
            <p style="font-size:15px;color:var(--text-muted);margin:0;">
                ${isSubscriber
                    ? 'Acesso completo — todos os guias estão liberados para você.'
                    : 'Assine o Clube para desbloquear os guias'}
            </p>
        </div>

        <div class="guias-grid">
            ${cardsHTML}
        </div>
    `;

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
