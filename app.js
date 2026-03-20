document.addEventListener('DOMContentLoaded', () => {
    loadNewsFeed();
    initAdShowcase();

    document.getElementById('clube-trigger').addEventListener('click', (e) => {
        e.preventDefault();
        toggleModal();
    });
});

/* ── Modal ──────────────────────────────────────────────────────────────────── */
function toggleModal() {
    document.getElementById('voting-modal').classList.toggle('active');
}

function submitVote(theme) {
    alert(`Voto registrado para: ${theme}! Obrigado por participar.`);
    toggleModal();
}
/* ── State Tracking ─────────────────────────────────────────────────────────── */
let livroAtual = null; // Guarda a chave do livro aberto (ex: 'energia')

/* ── Funnel helpers ─────────────────────────────────────────────────────────── */
function isLocked(id) {
    // 5 free recipes per book; check index position within the book (not raw ID)
    if (!livroAtual) return false;
    const bookArr = window.biblioteca[livroAtual] || [];
    const idx = bookArr.findIndex(r => r.id === id);
    return idx >= 5; // index 5+ means it's the 6th recipe or beyond
}

/* ── Navigation ─────────────────────────────────────────────────────────────── */
function loadRecipesFeed() {
    livroAtual = null; // Reseta o estado
    loadBooksShowcase();
}

function handleRecipeClick(id) {
    loadRecipe(id);
}

function handleBookClick(bookNum) {
    const bookInfo = window.BOOKS[bookNum];
    if (bookInfo && bookInfo.key) {
        livroAtual = bookInfo.key;
        const bookArr = window.biblioteca[bookInfo.key] || [];
        const firstId = bookArr.length > 0 ? bookArr[0].id : 1;
        loadRecipe(firstId); // Abre a primeira receita real do livro clicado
    }
}

/* ── Books Showcase Vitrine ─────────────────────────────────────────────────── */
function loadBooksShowcase() {
    const viewer = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <div style="text-align:center; margin-bottom:36px;">
            <span style="display:inline-block; background:#f1f8f1; color:var(--sage-green); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px; padding:4px 14px; border-radius:20px; margin-bottom:14px;">Biblioteca SeniorHub</span>
            <h1 style="font-size:28px; font-weight:800; color:#374151; margin-bottom:8px;">Escolha o seu Livro de Receitas</h1>
            <p style="color:var(--text-muted); font-size:15px;">5 coleções exclusivas com receitas detalhadas</p>
        </div>
        <div class="books-showcase">
            ${Object.entries(window.BOOKS).map(([num, book]) => `
                <button class="book-showcase-btn" onclick="window.handleBookClick(${num})">
                    <div class="book-info">
                        <div class="book-num">Livro ${num}</div>
                        <div class="book-title">${book.title}</div>
                    </div>
                    <i class="ph ph-caret-right" style="font-size:22px; color:var(--sage-green); flex-shrink:0;"></i>
                </button>
            `).join('')}
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
        return `<li class="summary-item">
                        <a class="summary-link" onclick="handleRecipeClick(${r.id}); event.preventDefault(); return false;" href="#">
                            <span class="summary-num">${pos}.</span>${r.title}
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

    // Mostra paywall se (a) é a 6ª+ receita pela posição, OU (b) a receita é um stub bloqueado
    if (isLocked(id) || (recipe && recipe.locked)) {
        wrapper.innerHTML = renderPaywallHTML(bookMeta);
    } else if (!recipe) {
        wrapper.innerHTML = `<p style="padding:40px; text-align:center; color:var(--text-muted)">Receita não encontrada neste livro.</p>`;
    } else {
        wrapper.innerHTML = renderRecipeHTML(recipe, bookMeta);
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
function renderRecipeHTML(recipe, bookMeta) {
    // Suporte aos dois schemas de campo (Livro 1: prepTime/steps; Livro 2+: time/instructions)
    const tempo = recipe.prepTime || recipe.time || '—';
    const passos = recipe.steps || recipe.instructions || [];
    const bookArr = window.biblioteca[livroAtual] || [];
    const currentIdx = bookArr.findIndex(r => r.id === recipe.id);
    const nextRecipe = currentIdx >= 0 ? bookArr[currentIdx + 1] : null;
    const nextId = nextRecipe ? nextRecipe.id : null;

    const nextBtn = !nextId
        ? ''  // já é a última receita do livro
        : `<button onclick="event.preventDefault(); handleRecipeClick(${nextId})" class="promo-btn next-recipe-btn"
                   style="margin:0; padding:12px 24px; font-size:15px;">Próxima Receita →</button>`;

    return `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:20px;">
            <div>
                <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                          color:var(--sage-green); margin-bottom:8px; cursor:pointer;"
                   onclick="event.preventDefault(); loadBooksShowcase()">
                    ← Vitrine de Livros
                </p>
                <h1 class="recipe-title" style="margin-bottom:0; text-align:left;">${recipe.title}</h1>
            </div>
            <button onclick="event.preventDefault(); loadBookSummary()" title="Ver todas as receitas"
                    style="white-space:nowrap; background:none; border:1.5px solid var(--sage-green);
                           border-radius:10px; cursor:pointer; color:var(--sage-green); display:flex;
                           align-items:center; gap:6px; font-weight:600; font-size:13px;
                           padding:8px 14px; flex-shrink:0; margin-top:4px;">
                <i class="ph ph-list-dashes" style="font-size:18px;"></i> Sumário da Coleção
            </button>
        </div>

        <div style="display:inline-flex; align-items:center; gap:10px; background:#f1f8f1;
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
                    ${recipe.ingredients.map(i => `<li><span class="check-item-icon">✓</span> ${i}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="section-title">Utensílios da Família</h4>
                <ul class="check-list">
                    ${recipe.utensils.map(u => `<li><span class="check-item-icon">◍</span> ${u}</li>`).join('')}
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

        <div style="display:flex; gap:12px; margin-top:36px; justify-content:center; flex-wrap:wrap;">
            <button onclick="event.preventDefault(); loadBooksShowcase()" class="promo-btn"
                    style="margin:0; padding:12px 24px; font-size:15px; background:#e8f0ea; color:var(--sage-green-dark);">← Vitrine de Livros</button>
            ${nextBtn}
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
            <span style="display:inline-block; background:#f1f8f1; color:var(--sage-green); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:4px 14px; border-radius:20px; margin-bottom:20px;">Acesso Completo</span>
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

/* ── Per-book Paywall banner (recipe #6+ in each book) ──────────────────────── */
function renderPaywallHTML(book) {
    const bookTitle = book ? book.title : 'nosso livro completo';
    const payLink   = (book && book.key && BOOK_PAYMENT_LINKS[book.key])
        ? BOOK_PAYMENT_LINKS[book.key] : null;
    const btnHtml   = payLink
        ? `<a href="${payLink}" target="_blank" rel="noopener noreferrer"
               class="promo-btn next-recipe-btn"
               style="font-size:17px; padding:16px 48px; display:inline-block; margin-top:0;">
               📖 Adquirir este Livro em PDF →</a>`
        : `<button disabled class="promo-btn"
               style="font-size:17px; padding:16px 48px; display:inline-block; margin-top:0;
                      opacity:.45; cursor:not-allowed; background:var(--sage-green); border:none; color:#fff;">
               Em Breve</button>`;
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
            ${btnHtml}
            <p style="font-size:12px; color:var(--text-muted); margin-top:24px;">
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

/* ── Mapa de CTAs por Categoria ─────────────────────────────────────────────
   Para cada categoria (chave em MAIÚSCULO) define:
     text  → texto do botão
     url   → link de afiliado/destino padrão (usado quando Link_Noticia está vazio)
   A coluna Link_Noticia da planilha SEMPRE tem prioridade se preenchida. */
const CATEGORIA_CTA = {
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
    'SAUDE': {  // alias sem acento (tolerância de digitação)
        text: 'Cuidar da Saúde →',
        url:  'https://www.amazon.com.br/s?k=saude+senior+60+mais&tag=seniorhub-20'
    },
    'RECEITA': {
        text: '📖 Adquirir Livro de Receitas →',
        url:  'https://pay.hotmart.com/Y104973165O'  // Livro 1 como destino padrão de noticias de receita
    },
    'RECEITAS': {  // alias plural
        text: '📖 Adquirir Livro de Receitas →',
        url:  'https://pay.hotmart.com/Y104973165O'  // Livro 1 como destino padrão de noticias de receita
    },
    'HOTEL': {
        text: '🏨 Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    },
    'HOTEIS': {  // alias sem acento
        text: '🏨 Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    },
    'HOT\u00c9IS': {  // alias com acento (HOT\u00c9IS = HOTÉIS)
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

/* Resolve o texto e URL do botão CTA com base na categoria e no link da planilha.
   Regra: Link_Noticia (coluna da planilha) tem PRIORIDADE; fallback = CATEGORIA_CTA. */
function resolverCTA(categoria, linkNoticia) {
    const catKey = (categoria || '').trim().toUpperCase();
    const config = CATEGORIA_CTA[catKey];

    // Se há link explícito na planilha, ele ganha sempre
    const hasCustomLink = linkNoticia && linkNoticia.trim().startsWith('http');
    const finalUrl  = hasCustomLink ? linkNoticia.trim() : (config ? config.url  : null);
    const finalText = config ? config.text : 'Continuar Lendo →';

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
            <p style="color:var(--text-muted); margin-bottom:24px;">${resumo}</p>
            ${ctaHTML}
        </div>
    `;
    return card;
}

/* Fetches and injects the Google Sheets CSV at the TOP of the feed.
   Called asynchronously after the static feed renders so the page isn't blocked. */
async function carregarFeedNoticias(feedContainer) {
    try {
        const res = await fetch(SHEETS_CSV_URL);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();

        const rows = parseCSV(text);
        if (rows.length < 2) return; // only header or empty

        // Map headers case-insensitively
        const headers = rows[0].map(h => h.toLowerCase()
            .normalize('NFD').replace(/[\u0300-\u036f]/g, '') // strip accents for matching
            .replace(/\s+/g, '_'));

        const col = key => headers.indexOf(key);
        const iCat = col('categoria');
        const iTit = col('titulo');
        const iRes = col('resumo');
        const iLink = col('link_noticia');
        const iImg = col('link_imagem');

        // Filter valid rows (non-empty título), newest first (reverse order after header)
        const dataRows = rows.slice(1)
            .filter(r => r[iTit] && r[iTit].trim() !== '')
            .reverse();

        if (dataRows.length === 0) return;

        // Insert a divider label
        const divider = document.createElement('div');
        divider.style.cssText = 'font-size:11px; font-weight:800; text-transform:uppercase; letter-spacing:.7px; color:var(--sage-green); margin-bottom:12px; padding-top:4px;';
        divider.textContent = '📰 Últimas Notícias';
        feedContainer.insertBefore(divider, feedContainer.firstChild);

        // Prepend dynamic cards above static ones (reversed so newest is first)
        dataRows.forEach(r => {
            const card = criarCardNoticia({
                categoria: r[iCat] || 'Notícia',
                titulo: r[iTit] || '',
                resumo: r[iRes] || '',
                linkNoticia: r[iLink] || '#',
                linkImagem: r[iImg] || ''
            });
            feedContainer.insertBefore(card, divider.nextSibling);
        });

        // Remove loading placeholder if present
        const placeholder = feedContainer.querySelector('.feed-loading');
        if (placeholder) placeholder.remove();

    } catch (err) {
        console.warn('[SeniorHub] Feed dinâmico indisponível:', err.message);
        // Static fallback remains visible — no alert to user
        const placeholder = feedContainer.querySelector('.feed-loading');
        if (placeholder) placeholder.remove();
    }
}

const newsItems = [
    {
        id: 'n1', category: 'Saúde',
        title: '5 Receitas de Sopas que Fortalecem a Imunidade no Inverno',
        image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&q=80&w=800',
        description: 'Descubra como ingredientes simples como gengibre e abóbora podem ser seus melhores aliados.',
        type: 'recipe_teaser'
    },
    {
        id: 'n2', category: 'Exercícios',
        title: 'Mobilidade em Casa: 3 Exercícios Simples para Começar o Dia',
        image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=800',
        description: 'Manter as articulações saudáveis é o segredo para uma vida ativa e sem dores.',
        type: 'article'
    },
    {
        id: 'n3', category: 'Conforto do Lar',
        title: 'A Nova Era das Poltronas Ergonômicas: Design e Saúde',
        image: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?auto=format&fit=crop&q=80&w=800',
        description: 'Conheça as tecnologias que estão transformando o descanso na terceira idade.',
        type: 'tech'
    },
    {
        id: 'n4', category: 'Viagens',
        title: 'Destinos de Inverno: Portugal Além de Lisboa e Porto',
        image: 'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&q=80&w=800',
        description: 'Vilarejos históricos e gastronomia acolhedora esperam por você nesta temporada.',
        type: 'article'
    }
];

function loadNewsFeed() {
    const viewer = document.getElementById('content-viewer');
    viewer.innerHTML = '';
    const feed = document.createElement('div');
    feed.className = 'slide-in-right';

    // Loading placeholder (removed when CSV arrives or fails)
    const placeholder = document.createElement('div');
    placeholder.className = 'feed-loading';
    placeholder.style.cssText = 'font-size:13px; color:var(--text-muted); padding:8px 0 16px; opacity:.7;';
    placeholder.textContent = '⏳ Carregando notícias recentes...';
    feed.appendChild(placeholder);

    // Static fallback cards
    newsItems.forEach(item => {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
            <img src="${item.image}" alt="${item.title}" class="news-image">
            <div class="news-content">
                <span class="news-category">${item.category}</span>
                <h2 class="news-header-title">${item.title}</h2>
                <p style="color:var(--text-muted); margin-bottom:24px;">${item.description}</p>
                <a href="#" class="clube-btn" onclick="handleNewsClick('${item.id}'); return false;">Continuar Lendo →</a>
            </div>
        `;
        feed.appendChild(card);
    });

    viewer.appendChild(feed);

    // Async: fetch CSV and prepend dynamic cards without blocking the UI
    carregarFeedNoticias(feed);
}

/* ── Advertising Showcase — Carrossel dos 5 Livros ─────────────────────────── */
const ads = [
    {
        livro: 1,
        title: "Relíquias da Cozinha",
        subtitle: "50 receitas da culinária brasileira tradicional",
        image: "capas/Capa reliquias da cozinha.jpg",
        link: "https://pay.hotmart.com/Y104973165O",
        btnText: "📖 Adquirir Livro 1 →"
    },
    {
        livro: 2,
        title: "Energia no Prato",
        subtitle: "50 receitas para disposição e vitalidade",
        image: "capas/Livro 2 - Energia no Prato.jpg",
        link: "https://pay.hotmart.com/U104976011H",
        btnText: "📖 Adquirir Livro 2 →"
    },
    {
        livro: 3,
        title: "Prazer Sem Culpa",
        subtitle: "50 receitas saudáveis e irresistíveis",
        image: "capas/Livro 3 prazer sem culpa.jpg",
        link: "https://pay.hotmart.com/S104989388R",
        btnText: "📖 Adquirir Livro 3 →"
    },
    {
        livro: 4,
        title: "Sabores do Mar",
        subtitle: "50 receitas com frutos do mar e peixes",
        image: "capas/Livro 4 Sabores do Mar.jpg",
        link: "https://pay.hotmart.com/C104989538L",
        btnText: "📖 Adquirir Livro 4 →"
    },
    {
        livro: 5,
        title: "Horta no Prato",
        subtitle: "50 receitas da horta à mesa com sabor e saúde",
        image: "capas/Livro 5 Horta no prato.jpg",
        link: "https://pay.hotmart.com/A104989658F",
        btnText: "📖 Adquirir Livro 5 →"
    }
];

let currentAdIndex = 0;
let adIntervalId = null;

function initAdShowcase() {
    renderAd();
    adIntervalId = setInterval(() => {
        advanceAd(1);
    }, 30000); // Alterna a cada 30 segundos
}

function advanceAd(direction) {
    currentAdIndex = (currentAdIndex + direction + ads.length) % ads.length;
    renderAd();
}

function goToAd(index) {
    currentAdIndex = index;
    // Reinicia o timer ao clicar manualmente nos dots
    if (adIntervalId) clearInterval(adIntervalId);
    adIntervalId = setInterval(() => advanceAd(1), 30000);
    renderAd();
}

function renderAd() {
    const container = document.getElementById('ad-showcase-root');
    const ad = ads[currentAdIndex];

    const dotsHtml = ads.map((_, i) =>
        `<span class="ad-dot ${i === currentAdIndex ? 'active' : ''}" onclick="goToAd(${i})" title="Livro ${i + 1}"></span>`
    ).join('');

    container.innerHTML = `
        <div class="ad-showcase">
            <div class="ad-badge">Livro ${ad.livro} de ${ads.length}</div>
            <div class="ad-image-wrapper">
                <img src="${ad.image}" alt="Capa: ${ad.title}" class="ad-image ad-fade-in">
            </div>
            <div class="ad-content">
                <h4 class="ad-title">${ad.title}</h4>
                <p class="ad-subtitle">${ad.subtitle}</p>
                <a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-btn">${ad.btnText}</a>
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

function renderLojaConforto() {
    const viewer = document.getElementById('content-viewer');

    const cards = window.LOJA_TOPICOS.map((t, i) => `
        <a href="${t.link}" target="_blank" rel="noopener noreferrer"
           style="text-decoration:none; display:flex; flex-direction:column;
                  background:#fff; border:1px solid #e4ede6; border-radius:18px;
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

            <h3 style="font-size:20px; font-weight:900; color:#1a2e1a;
                       margin:0; line-height:1.25;">
                ${t.titulo}
            </h3>

            <p style="font-size:14px; color:#5a7060; line-height:1.65; margin:0; flex:1;">
                ${t.beneficio}
            </p>

            <div style="margin-top:4px; background:var(--sage-green); color:#fff;
                        text-align:center; font-size:14px; font-weight:700;
                        padding:13px 16px; border-radius:11px;
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
            <h1 style="font-size:28px; font-weight:900; color:#1a2e1a; margin:0 0 8px;">
                Conforto do Lar
            </h1>
            <p style="font-size:15px; color:#5a7060; margin:0;">
                Os 10 itens que mais melhoram o conforto e a segurança em casa. Clique para ver na Amazon.
            </p>
        </div>

        <p style="font-size:11px; font-weight:800; text-transform:uppercase;
                  letter-spacing:.7px; color:var(--sage-green); margin-bottom:12px;">
            🏆 Top 10 Categorias
        </p>
        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:18px;">
            ${cards}
        </div>

        <p style="font-size:11px; color:#9ab09c; margin-top:32px; text-align:center;
                  padding-top:18px; border-top:1px solid #e8eee9; line-height:1.7;">
            ℹ️ Os links acima são de afiliado Amazon. Ao comprar por aqui, o SeniorHub recebe uma
            pequena comissão — sem custo extra para você. Ajuda o portal a continuar gratuito! 💚
        </p>
    `;


    swapContent(viewer, wrapper);
}

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

function renderExercicios() {
    const viewer = document.getElementById('content-viewer');

    const cards = EXERCICIOS_CARDS.map(c => `
        <a href="${c.link}" target="_blank" rel="noopener noreferrer"
           style="text-decoration:none; display:flex; flex-direction:column;
                  background:#fff; border:1px solid #e4ede6; border-radius:18px;
                  padding:28px 22px 24px; gap:12px;
                  box-shadow:0 2px 10px rgba(0,0,0,0.05);
                  transition:box-shadow .2s,transform .2s;"
           onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; this.style.transform='translateY(-4px)';"
           onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">

            <div style="font-size:44px; line-height:1;">${c.emoji}</div>

            <h3 style="font-size:19px; font-weight:900; color:#1a2e1a; margin:0; line-height:1.25;">
                ${c.titulo}
            </h3>

            <p style="font-size:14px; color:#5a7060; line-height:1.65; margin:0; flex:1;">
                ${c.descricao}
            </p>

            <div style="margin-top:4px; background:var(--sage-green); color:#fff;
                        text-align:center; font-size:14px; font-weight:700;
                        padding:13px 16px; border-radius:11px; letter-spacing:.3px;">
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
            <h1 style="font-size:28px; font-weight:900; color:#1a2e1a; margin:0 0 8px;">
                Exercícios em Casa
            </h1>
            <p style="font-size:15px; color:#5a7060; margin:0;">
                Equipamentos e suplementos para manter o corpo ativo e forte sem sair de casa.
            </p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(2, 1fr); gap:18px;">
            ${cards}
        </div>

        <p style="font-size:11px; color:#9ab09c; margin-top:32px; text-align:center;
                  padding-top:18px; border-top:1px solid #e8eee9; line-height:1.7;">
            ℹ️ Links de afiliado Amazon. Ao comprar por aqui, o SeniorHub recebe uma pequena
            comissão — sem custo extra para você. Obrigado pelo apoio! 💚
        </p>
    `;

    swapContent(viewer, wrapper);
}

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

function renderViagens() {
    const viewer = document.getElementById('content-viewer');

    const cards = VIAGENS_DESTINOS.map(d => `
        <div style="background:#fff; border:1px solid #e4ede6; border-radius:20px;
                    overflow:hidden; box-shadow:0 2px 10px rgba(0,0,0,0.05);
                    transition:box-shadow .2s, transform .2s; display:flex; flex-direction:column;"
             onmouseover="this.style.boxShadow='0 8px 28px rgba(0,0,0,0.12)'; this.style.transform='translateY(-4px)';"
             onmouseout="this.style.boxShadow='0 2px 10px rgba(0,0,0,0.05)'; this.style.transform='translateY(0)';">

            <!-- Card hero -->
            <div style="background:linear-gradient(135deg,#1a2e1a 0%,#3a7d44 100%);
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
                <p style="font-size:14px; color:#5a7060; line-height:1.65; margin:0; flex:1;">
                    ${d.descricao}
                </p>
                <a href="${resolverLinkViagem(d)}" target="_blank" rel="noopener noreferrer"
                   style="display:block; text-align:center; background:var(--sage-green); color:#fff;
                          font-size:14px; font-weight:700; padding:13px 16px; border-radius:11px;
                          text-decoration:none; letter-spacing:.3px;"
                   onmouseover="this.style.background='#2d6a4f';"
                   onmouseout="this.style.background='var(--sage-green)';">
                    ${resolverTextoViagem(d)}
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
            <h1 style="font-size:28px; font-weight:900; color:#1a2e1a; margin:0 0 8px;">
                Guia de Viagens
            </h1>
            <p style="font-size:15px; color:#5a7060; margin:0;">
                Destinos selecionados para quem viaja com conforto, cultura e tranquilidade.
            </p>
        </div>

        <div style="display:grid; grid-template-columns: repeat(2,1fr); gap:18px;">
            ${cards}
        </div>

        <p style="font-size:11px; color:#9ab09c; margin-top:32px; text-align:center;
                  padding-top:18px; border-top:1px solid #e8eee9; line-height:1.7;">
            ℹ️ Alguns links são de afiliado (Decolar &amp; Booking). Ao reservar por aqui, o SeniorHub recebe uma pequena comissão — sem custo extra para você. 💚
        </p>
    `;

    swapContent(viewer, wrapper);
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
