/* -- Link do Clube (espelho do auth.js para uso no app.js) ------------------- */
window.CLUBE_CHECKOUT_URL = window.CLUBE_CHECKOUT_URL || 'https://pay.hotmart.com/E105391945G';

/* -- Links Google Drive — acesso exclusivo de assinantes (/preview = iframe sem barra) -- */
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

/* -- Modal -------------------------------------------------------------------- */
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
        // Logado mas não assinante ? abre modal explicando
        toggleModal();
        return;
    }
    
    firebase.firestore().collection('votos').doc(user.uid).set({
        uid: user.uid,
        email: user.email,
        nome: user.displayName || user.email,
        pilar: theme,
        data: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true })
    .then(() => {
        const primeiroNome = (user.displayName || user.nome || 'amigo').split(' ')[0];
        alert(`? Voto registrado com sucesso! Obrigado, ${primeiroNome}!`);
    })
    .catch(err => {
        console.error("Erro ao registrar voto", err);
        alert('Ocorreu um erro ao registrar seu voto. Tente novamente.');
    });
}
/* -- State Tracking ----------------------------------------------------------- */
let livroAtual = null; // Guarda a chave do livro aberto (ex: 'energia')

/* -- Funnel helpers ----------------------------------------------------------- */
function isLocked(id) {
    // Assinante pago tem acesso completo a todas as receitas no site
    if (window.SeniorAuth && window.SeniorAuth.isSubscriber()) return false;
    if (!livroAtual) return false;
    const bookArr = window.biblioteca[livroAtual] || [];
    const idx = bookArr.findIndex(r => r.id === id);
    return idx >= 5; // não-assinante: só 5 receitas grátis por livro
}

/* -- Navigation --------------------------------------------------------------- */
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

    // Assinante e não-assinante ? mesmo fluxo de portal.
    // isLocked() já retorna false para assinantes, liberando todas as 50 receitas.
    if (bookInfo.key) {
        livroAtual = bookInfo.key;
        const bookArr = window.biblioteca[bookInfo.key] || [];
        const firstId = bookArr.length > 0 ? bookArr[0].id : 1;
        loadRecipe(firstId);
    }
}

/* -- Visualizador PDF Integrado (apenas assinantes) ------------------------ */
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
                   onclick="event.preventDefault(); loadBooksShowcase()">? Biblioteca</p>
                <span style="color:#d1d5db;">|</span>
                <span style="font-size:14px; font-weight:700; color:#374151;">${title}</span>
            </div>
            <span style="display:inline-flex; align-items:center; gap:5px; background:#f0fdf4;
                         color:#166534; font-weight:700; font-size:12px; padding:4px 12px;
                         border-radius:20px; border:1px solid #86efac; flex-shrink:0;">
                ? Acesso de Assinante
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
                  onclick="loadBooksShowcase()">Escolher outro livro ?</span>
        </div>
    `;

    swapContent(viewer, wrapper);
}

/* -- Books Showcase Vitrine --------------------------------------------------- */
function loadBooksShowcase() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <!-- Dois botões Véu acima dos livros -->
        <div class="veu-cards-grid">
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
                <div style="font-size:28px; margin-bottom:10px;">??</div>
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
                <div style="font-size:28px; margin-bottom:10px;">?????</div>
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
                                        ? Incluso
                                    </span>
                                </div>
                                <div class="book-title">${book.title}</div>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:6px;flex-shrink:0;">
                                <button onclick="window.handleBookClick(${num})"
                                        style="background:#E1306C;color:#fff;border:none;
                                               border-radius:8px;padding:8px 16px;font-size:13px;
                                               font-weight:700;cursor:pointer;white-space:nowrap;">
                                    ?? Ler no Portal
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

/* -- Véu Content — Paywall de Luxo ------------------------------------------
   Tipo: 'veu-juventude' | 'pintura-sereia'
   Página 1 ? livre. Páginas 2-11 ? exclusivo para assinantes.               */

const VEU_CONTENT = {
    'veu-juventude': {
        icon: '??',
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
            },
            {
                titulo: 'A Limpeza como Ritual de Reinvenção',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Mulheres que entendem o poder da pele não lavam o rosto — elas o <em>purificam com intenção</em>. A limpeza não é higiene; é o primeiro gesto do dia onde você decide quem será nas próximas horas.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Use um limpador de pH balanceado — entre 4.5 e 5.5 — para não destruir a barreira cutânea que mantém a pele luminosa. Água morna, nunca quente. Movimentos circulares ascendentes, nunca para baixo. Você está esculpindo, não esfregando.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    O segredo que poucas sabem: o <strong style="color:#8B0000;">double cleansing noturno</strong> — primeiro um óleo para dissolver a maquiagem e as impurezas lipofílicas, depois o limpador aquoso para remover o restante — não é modismo coreano. É a razão pela qual a pele das mulheres do Oriente Médio e da Ásia mantém uma aparência de décadas mais jovem.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Encerre com água fria sobre o rosto. Trinta segundos. Esse choque térmico fecha os poros, ativa a microcirculação e dá à pele aquele rubor discreto que ele vai notar mesmo sem entender por quê.
                </p>`
            },
            {
                titulo: 'A Hidratação que Cria o Brilho Magnético',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Hidratação não é sobre colocar creme. É sobre criar as condições internas e externas para que a pele brilhe com sua própria luz — aquele <em>glow</em> que não sai de nenhuma câmera, que só existe quando você está na sala.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    A sequência correta importa mais que os produtos: primeiro o <strong style="color:#8B0000;">tônico hidratante</strong> para preparar o terreno, depois o <strong style="color:#8B0000;">sérum com ácido hialurônico</strong> ainda com a pele úmida — o HA precisa de umidade ambiente para funcionar, caso contrário, extrai água das camadas profundas. Por último, o hidratante para selar tudo.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Beba água com eletrólitos, não apenas pura. Adicione uma pitada de sal do Himalaia e suco de limão a um copo pela manhã. Os eletrólitos garantem que a água penetre nas células, e não apenas passe pelo organismo. A diferença na pele é visível em três semanas.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    À noite, aplique o hidratante sobre pele ainda levemente úmida com uma técnica de <em>patting</em> — bata suavemente com as palmas aquecidas, nunca esfregue. O calor das mãos ativa a absorção e a pele acorda diferente no dia seguinte.
                </p>`
            },
            {
                titulo: 'O Ritual do Sérum: Onde a Ciência Encontra o Poder',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Um sérum bem escolhido é a sua arma mais silenciosa. Ninguém vê o que você aplica às 22h, mas todos percebem o resultado às 10h da manhã seguinte quando sua pele parece descansar em uma frequência diferente das outras.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Vitamina C (L-ácido ascórbico a pelo menos 10%):</strong> aplique pela manhã. Ela inibe a melanina, uniformiza o tom e protege contra radicais livres. A pele fica mais brilhante em 4 semanas. Mas atenção — vitamina C instável oxida e faz o oposto. Escolha fórmulas estabilizadas com vitamina E e ferúlico.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Retinol à noite:</strong> comece com 0.025%, duas vezes por semana. É o ingrediente com mais evidência científica para renovação celular. Ele acelera o turnover da pele, apaga manchas e estimula colágeno. Em seis meses, a diferença é tão visível que pessoas ao seu redor começarão a comentar sem saber o porquê.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Não misture retinol com ácidos na mesma noite. Alterne: ácidos nas terças e quintas, retinol nas segundas, quartas e sextas. Domingos, pele descansa. Esse calendário simples evita irritação e maximiza resultado.
                </p>`
            },
            {
                titulo: 'Proteção Solar: O Escudo Invisível da Mulher Poderosa',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Nenhum sérum, nenhum procedimento, nenhum ritual noturno sobrevive sem o protetor solar. O sol é o maior destruidor de colágeno — silencioso, diário, implacável. Mas quando você o bloqueia com inteligência, preserva décadas.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">FPS 50+ com proteção UVA (PPD ou PA+++) é inegociável.</strong> Aplique 2mg por cm² — na prática, uma colher de chá no rosto. Reaplicar a cada 2 horas em exposição, ou usar pós com FPS para retoques ao longo do dia.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    O segredo de mulheres que aos 45 parecem ter 32 não é genética — é protetor solar consistente desde os 20. A pele que você tem agora é resultado do que fez há 10 anos. A pele que você terá aos 50 é o que você faz hoje.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Escolha fórmulas com <em>cor e leveza</em>: protetores com tint e acabamento luminoso substituem a base no dia a dia e ainda protegem. Sua pele fica uniforme, protegida e com aquele brilho natural que nenhum filtro recria.
                </p>`
            },
            {
                titulo: 'Esfoliação: O Segredo do Renascimento Semanal',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Sua pele se renova a cada 28 dias. Mas sem ajuda, as células mortas se acumulam acima das novas — opacizando, engrossando, apagando o brilho que estava lá embaixo esperando para ser revelado. A esfoliação não adiciona nada. Ela <em>remove o que esconde</em>.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Prefira esfoliação <strong style="color:#8B0000;">química à física</strong>. Esfoliantes com grãos físicos criam microlesões invisíveis na pele. Os ácidos são mais suaves e mais precisos: o <strong style="color:#8B0000;">AHA (glicólico, mandélico)</strong> dissolve as células mortas da superfície e ilumina o tom. O <strong style="color:#8B0000;">BHA (salicílico)</strong> penetra o poro e dissolve impurezas internas — ideal para peles com tendência a acne.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Use uma ou duas vezes por semana, nunca mais. A pele sobre-esfoliada fica vermelha, sensível e produz mais oleosidade em reação — o oposto do que você quer. Menos é poder.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Após a esfoliação, a pele absorve tudo em dobro. Esse é o momento para o sérum mais nobre da sua coleção. O que você aplica nos 10 minutos seguintes penetra mais fundo do que em qualquer outro momento da semana.
                </p>`
            },
            {
                titulo: 'O Poder da Massagem Facial: Esculpir sem Bisturi',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Há uma razão pela qual mulheres japonesas que praticam o <em>Kobido</em> — massagem facial tradicional — envelhecem de forma impressionantemente diferente. O rosto tem 43 músculos. Quando linfas se acumulam, quando tensão se instala, o rosto afunda. Quando você os trabalha, ele se eleva.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Com o gua sha ou simplesmente com os dedos, faça movimentos de drenagem <strong style="color:#8B0000;">sempre do centro para as laterais e de baixo para cima</strong>. Cinco minutos à noite, após o sérum, com óleo facial como deslizante. Esse ritual reduz inchaço, define o contorno do maxilar e ilumina a pele através da ativação da microcirculação.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Pressione os três pontos de reflexologia facial: o espaço entre as sobrancelhas, as têmporas e os ângulos da mandíbula. Segure cada ponto por 10 segundos com pressão firme. Isso libera tensão acumulada que, com o tempo, se torna rugas de expressão.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    A mulher que faz isso regularmente não apenas parece mais jovem — ela parece mais <em>presente</em>. Há algo na face relaxada e bem cuidada que comunica domínio de si mesma. Ele sente isso antes de analisar qualquer traço.
                </p>`
            },
            {
                titulo: 'Alimentação e Pele: O Que Você Come Aparece no Rosto',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Sua pele é um espelho do seu interior. Não metaforicamente — literalmente. O colágeno é feito de proteína e vitamina C. O brilho depende de gorduras boas. A clareza do tom está ligada ao microbioma intestinal. O que você come hoje aparece no seu rosto em 28 dias.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Inclua diariamente:</strong> salmão ou sardinha (ômega-3 que hidrata de dentro para fora), frutas vermelhas (antioxidantes que bloqueiam o envelhecimento oxidativo), abacate (gorduras que mantêm a barreira cutânea intacta), e vegetais verdes escuros (vitamina K que reduz olheiras e inchaço).
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Reduza implacavelmente:</strong> açúcar refinado (glicação destrói o colágeno — cada grama a mais enrijece as fibras e aprofunda as linhas), laticínios em excesso (ligados à acne hormonal em mulheres adultas), e álcool (desidrata e dilata os vasos permanentemente).
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Suplementação estratégica: colágeno veiculado com vitamina C, vitamina D3 com K2, e zinco. Não são gastos — são investimentos com retorno visível em meses.
                </p>`
            },
            {
                titulo: 'Sono: O Ritual de Beleza que Nenhum Produto Substitui',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Entre 23h e 3h da manhã, seu corpo libera picos de hormônio do crescimento que reparam tecidos, sintetizam colágeno e regeneram células. Se você está acordada nesse horário — mesmo que descanse depois — perdeu a janela. Não há creme no mercado que replique isso.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Crie um <strong style="color:#8B0000;">ritual de descanso às 21h30</strong>: banho morno (baixa a temperatura corporal e induz o sono), tela desligada (a luz azul bloqueia a melatonina por até 2 horas), sérum de retinol aplicado, e um ambiente com temperatura entre 18 e 20 graus.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Invista em uma fronha de seda ou cetim. Algodão cria fricção e imprime vincos no rosto que, com o tempo, comprometem a pele. A seda desliza — nenhuma marca, nenhuma fricção, e o sebo da pele não é absorvido pelo tecido, preservando a hidratação.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Durma de costas sempre que possível. Dormir de lado comprime consistentemente o mesmo lado do rosto — a assimetria que você vê com o tempo não é só genética. É postura durante o sono. A mulher que dorme de costas preserva a simetria que é o núcleo do magnetismo facial.
                </p>`
            },
            {
                titulo: 'O Ritual Completo: A Mulher que a Pele Revela',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Agora você tem as peças. Não são produtos — são práticas. E a diferença entre a mulher que as aplica e a que não aplica não é de aparência superficial. É de <em>presença</em>. A pele bem cuidada comunica uma mensagem que o cérebro dele recebe antes da consciência processar: <em>essa mulher cuida de si. Ela tem disciplina. Ela tem padrões elevados.</em>
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Seu ritual matinal:</strong> limpeza suave ? tônico ? vitamina C ? hidratante ? FPS 50+. Concluído em 7 minutos. Resultados em semanas.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Seu ritual noturno:</strong> double cleanse ? esfoliação (2x/semana) ou tônico ? sérum ativo (vitamina C ou retinol, alternado) ? hidratante rico ? óleo facial com massagem. Concluído em 12 minutos. Transformação em meses.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    A pele não mente. Ela conta a história da mulher que a habita — seus hábitos, sua saúde, seu nível de autocuidado. Quando você a trata como território sagrado, ela devolve o investimento com uma clareza e uma luminosidade que nenhuma maquiagem precisa compensar. Esse é o Véu da Juventude: não esconder a idade, mas <strong style="color:#8B0000;">tornar a idade irrelevante</strong>.
                </p>`
            }
        ]
    },
    'pintura-sereia': {
        icon: '??',
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
            },
            {
                titulo: 'A Base Perfeita: A Pele que Parece Ser Pele',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    A base não existe para esconder — existe para <em>unificar</em>. A mulher que usa base demais parece coberta. A mulher que domina a base parece ter uma pele impossível que você não consegue parar de olhar sem entender por quê.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    O segredo está no <strong style="color:#8B0000;">preparo da pele</strong>: primer com silicone que preenche os poros antes, hidratante leve que cria a base úmida ideal, e então a base aplicada com esponja úmida — nunca pincel para cobertura leve. A esponja úmida distribui a base sem mascará-la.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Escolha uma base <em>um tom mais claro</em> que o seu pescoço para refletir mais luz no rosto — isso cria aquela luminosidade natural que a câmera ama e que os olhos masculinos seguem instintivamente. Finalize com pó translúcido apenas na zona T, para fixar sem apagar o glow.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Menos quantidade, mais técnica. Uma base aplicada em três camadas finas estratégicas cobre mais e parece mais natural do que uma camada grossa. A sereia não esconde — ela revela a versão mais perfeita do que já existe.
                </p>`
            },
            {
                titulo: 'Contorno e Iluminador: Escultura de Luz e Sombra',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    O rosto humano comunica poder através de estrutura. Maçãs do rosto elevadas, mandíbula definida, nariz fino no centro da composição — esses são os sinais que o olhar masculino lê como magnetismo sem conseguir nomear o porquê. O contorno cria essa estrutura quando a genética não a entregou completamente.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Contorno:</strong> sombra fria (dois tons abaixo da pele, nunca laranja) nas têmporas, abaixo das maçãs em diagonal descendente, e na linha da mandíbula. Buche de peixe levemente e aplique na reentrância — mais natural do que qualquer técnica baseada em réguas e fórmulas.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Iluminador:</strong> aplique nos pontos que a luz natural toca primeiro — topo das maçãs, arco do cupido, ponta do nariz, centro da testa e canto interno dos olhos. Isso cria tridimensionalidade e aquele efeito de pele iluminada de dentro que é impossível de ignorar.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Blend, blend, blend. Uma sombra não blendada denuncia o produto. Uma sombra blendada à perfeição convence o mundo de que você nasceu assim. Esse é o poder da maquiagem — fazer o impossível parecer inevitável.
                </p>`
            },
            {
                titulo: 'Sobrancelhas: O Enquadramento do Olhar que Domina',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    As sobrancelhas são o enquadramento. Mude o enquadramento e toda a pintura muda de significado. Uma sobrancelha bem desenhada eleva o olhar, rejuvenesce o rosto e projeta uma expressão de autoridade que antecede qualquer palavra.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">A regra dos três pontos:</strong> o início da sobrancelha alinha com a asa do nariz. O arco alinha com o centro da pupila olhando para frente. O final alinha com o canto externo do olho. Esses três pontos criam a estrutura ideal para qualquer formato de rosto.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Use lápis fino para definir o contorno inferior, pomada ou gel para preencher com movimentos de cima para baixo imitando pelos reais, e finalize com o spoolie para dissipar qualquer excesso. Sobrancelha desenhada com movimentos fluídos — nunca preenchida em bloco, nunca angular demais.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Uma sobrancelha levemente arqueada no pico transmite expressão de curiosidade e inteligência — o olhar de quem está sempre um passo à frente. Esse micro-detalhe recalibra como os outros te percebem antes de você abrir a boca.
                </p>`
            },
            {
                titulo: 'O Olhar da Sereia: Técnicas para Fixar a Atenção',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Os olhos são o ponto de ancoragem mais poderoso do rosto humano. Quando você os enquadra com precisão, você controla onde o olhar dele vai primeiro, onde fica e o que sente ao estar lá.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Delineado interno (waterline):</strong> lápis nude ou cor champagne na linha d'água inferior abre os olhos instantaneamente, criando a ilusão de olhos maiores e mais luminosos. Lápis preto na linha d'água inferior encolhe o olho — reservado para looks mais intensos e noturnos.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Cat eye suave:</strong> puxe o delineado apenas 2-3mm além do canto externo seguindo a direção natural da pálpebra. Esse traço pequeno alonga o olho horizontalmente e cria aquele efeito de leveza felina que ele não consegue parar de olhar. Nada de triângulos exagerados — a sedução mora na sutileza.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Sombra iluminada no canto interno do olho e sombra esfumada escura no externo cria profundidade e dimensão. Seus olhos passam a ter um território — luz de um lado, mistério do outro. E ele ficará tentando descobrir o que está no meio.
                </p>`
            },
            {
                titulo: 'Máscara de Cílios: O Toque Final que Prende o Olhar',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Os cílios são as molduras finais do olhar. Quando são longos, curvados e separados, criam uma amplitude que ativa o instinto. O olhar com cílios bem aplicados parece sempre levemente úmido, levemente vulnerável — e essa combinação é o que dispara a atenção masculina de forma consistente.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Comece com o rizador antes da máscara — nunca depois. O rizador a frio cria um arco natural; aquecido levemente com o secador por 3 segundos, fixa a curva por horas. Aplique a máscara com movimento de zigue-zague na base dos cílios para depositar o produto e depois puxe até a ponta.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Duas camadas, com pausa de 30 segundos entre elas.</strong> A primeira cobre; a segunda volumiza. Uma terceira fina apenas nas pontas alonga. Separe com um spoolie enquanto ainda úmido para eliminar grumos — cílios agrupados são amadores; cílios separados são obra-prima.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Cílios postiços individuais no canto externo — sem linha inteira — criam um efeito de olhar levantado que é impossível de replicar com máscara. É o acabamento que transforma makeup em arte e olhar em armadilha.
                </p>`
            },
            {
                titulo: 'A Bochecha: Cor que Transmite Vida e Vitalidade',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    O rubor nas bochechas é um sinal biológico antiquíssimo — comunica irrigação sanguínea, saúde, emoção. Quando você recria isso com habilidade, está falando diretamente ao instinto dele. Não ao julgamento consciente. Ao instinto.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Sorria suavemente e aplique o blush nas partes mais salientes — mas não fique no sorriso. Leve o produto com o pincel em movimento ascendente em direção à têmpora. Isso eleva visualmente o rosto e cria juventude instantânea. A cor deve parecer que surgiu de dentro, nunca que foi colocada por fora.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Para peles mais escuras:</strong> tons terracota, ameixado e coral queimado. <strong style="color:#8B0000;">Para peles médias:</strong> pêssego, rosado e nude. <strong style="color:#8B0000;">Para peles claras:</strong> rosa malva, baby pink e lilás suave. Nunca vermelho puro — é festivo, não sedutor.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    Blush no nariz — uma técnica sul-coreana — cria a ilusão de que você acabou de sair do vento ou de um momento de leveza. Jovem, calorosa, viva. Isso ativa nele o impulso de se aproximar.
                </p>`
            },
            {
                titulo: 'Os Lábios: O Traço que Ele Não Consegue Parar de Olhar',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Os lábios são o segundo ponto de fixação visual mais poderoso depois dos olhos. Quando você os pinta com intenção, você cria um ponto de ancoragem que ele retorna involuntariamente durante toda a conversa — e enquanto ele olha para seus lábios, ele está ouvindo você de uma forma que vai além das palavras.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Delineie sempre antes do batom</strong>, mesmo que levemente, mesmo que com um lápis nude. O delineio define a forma, evita que o batom borre e cria aquele acabamento nítido que a câmera e o olhar masculino percebem imediatamente.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Para criar lábios mais volumosos: delineie <em>um fio além</em> do contorno natural no arco do cupido e no centro do lábio inferior. Aplique iluminador pontual no arco do cupido e no centro do lábio inferior. Não é ilusão — é arquitetura.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    O batom vermelho é poder declarado — para noites em que você quer ser a sala inteira. O nude rosado é sedução discreta — para quando você quer que ele chegue perto para ver melhor. Ambos são linguagens. Escolha conforme a mensagem que quer enviar.
                </p>`
            },
            {
                titulo: 'A Fixação: Garantir que a Tela Dure até o Último Olhar',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    De nada adianta uma maquiagem impecável às 20h se às 22h ela escorreu, oxidou e entrou nas linhas de expressão. A fixação é o capítulo final que garante que o trabalho que você fez seja visto durante todo o tempo que você precisar.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">Setting spray matte</strong> para zonas de oleosidade — testa e queixo. <strong style="color:#8B0000;">Setting spray com glow</strong> no resto do rosto para selar e adicionar aquele véu de luminosidade que fotografa e seduz. Aplique de olhos fechados em movimento circular a 30cm do rosto.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Para retoque ao longo da noite: papel absorvente (nunca pó direto sobre oleosidade) ? pó compacto translúcido apenas na zona T ? reaplique iluminador nas maçãs. O batom pode ser reaplicado sem remover o que estava — basta secar os lábios, aplicar e pressionar com papel suave.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    A sereia que dura a noite inteira não é mais bonita que as outras. Ela simplesmente sabe mais. E esse conhecimento — silencioso, invisível, absolutamente devastador — é o que a torna inesquecível.
                </p>`
            },
            {
                titulo: 'A Pintura Completa: A Arte de Ser Impossível de Esquecer',
                corpo: `<p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    Você chegou ao final deste guia com uma compreensão que a maioria das mulheres nunca terá: maquiagem não é cobertura. É <em>comunicação visual estratégica</em>. Cada produto que você usa é uma decisão sobre o que vai transmitir antes de falar, o que vai fazer ele sentir antes de perceber, onde vai guiar o olhar antes dele escolher.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a; margin-bottom:20px;">
                    <strong style="color:#8B0000;">A pintura completa da sereia:</strong> pele preparada ? base leve ? contorno e iluminador blendados ? sobrancelha estruturada ? olhos enquadrados ? cílios magistrais ? blush que transmite vida ? batom que ancora o olhar ? fixação que dura.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#2d0a0a; margin-bottom:20px;">
                    Não é sobre usar tudo de uma vez. É sobre saber o que selecionar para cada contexto. No trabalho: pele + sobrancelha + batom nude = autoridade. No encontro: olho + blush + batom cheio = magnetismo. No fim de semana: pele + blush luminoso + gloss = leveza que aproxima.
                </p>
                <p style="font-size:17px; line-height:1.9; color:#1a0a0a;">
                    A sereia que sabe pintar a si mesma não precisa de armadilha. Ela <em>é</em> a armadilha. E quando ele percebe isso — já é tarde demais para não pensar nela.
                </p>`
            }
        ]
    }
};

/* -- Estado de navegação do guia ---------------------------------------------- */
let _veuTipoAtual    = null;
let _veuPaginaAtual  = 0;

/* -- Navega para uma página específica do guia -------------------------------- */
function renderVeuPagina(tipo, idx) {
    _veuTipoAtual   = tipo;
    _veuPaginaAtual = idx;
    const isSub   = window.SeniorAuth && window.SeniorAuth.isSubscriber();
    const config  = VEU_CONTENT[tipo];
    if (!config) return;
    const pagina  = config.paginas[idx];
    if (!pagina)  return;
    const total   = config.paginas.length;

    if (idx > 0 && !isSub) { openVelvetModal(); return; }

    const viewer  = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;color:#8B0000;
                  margin-bottom:20px;cursor:pointer;" onclick="renderVeuConteudo('${tipo}')">? ${config.titulo}</p>
        <div style="text-align:center;margin-bottom:28px;">
            <div style="font-size:38px;margin-bottom:8px;filter:drop-shadow(0 0 10px rgba(200,0,0,0.4));">${config.icon}</div>
            <h1 style="font-family:'Playfair Display',serif;font-size:24px;font-weight:900;
                       background:linear-gradient(135deg,#4A0404,#8B0000,#c62828);
                       -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                       background-clip:text;margin-bottom:4px;">${config.titulo}</h1>
            <p style="color:#6b4a4a;font-size:13px;font-style:italic;">${config.subtitulo}</p>
        </div>
        <div style="background:#fff;border:1px solid rgba(139,0,0,0.15);border-radius:16px;padding:36px;margin-bottom:24px;">
            <div style="display:inline-block;background:rgba(139,0,0,0.08);color:#8B0000;font-size:10px;
                        font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:4px 14px;
                        border-radius:99px;margin-bottom:18px;border:1px solid rgba(139,0,0,0.2);">Página ${idx+1} de ${total}</div>
            <h2 style="font-family:'Playfair Display',serif;font-size:21px;font-weight:900;
                       color:#1a0a0a;margin-bottom:20px;line-height:1.35;">${pagina.titulo}</h2>
            ${pagina.corpo}
        </div>
        <div style="display:flex;justify-content:space-between;gap:12px;">
            ${idx > 0
                ? `<button onclick="renderVeuPagina('${tipo}', ${idx-1})" style="flex:1;padding:14px;
                     background:#ffffff;border:1px solid rgba(139,0,0,0.25);border-radius:10px;
                     color:#8B0000;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;
                     transition:background .2s;" onmouseover="this.style.background='#fce4ec'" onmouseout="this.style.background='#ffffff'">? Anterior</button>`
                : '<div style="flex:1"></div>'}
            ${idx < total-1
                ? `<button onclick="renderVeuPagina('${tipo}', ${idx+1})" style="flex:1;padding:14px;
                     background:linear-gradient(135deg,#8B0000,#c62828);border:none;border-radius:10px;
                     color:#fff;font-weight:700;cursor:pointer;font-size:14px;font-family:inherit;
                     transition:opacity .2s;" onmouseover="this.style.opacity='.85'" onmouseout="this.style.opacity='1'">Próxima Página ?</button>`
                : '<div style="flex:1;padding:14px;text-align:center;color:#8B0000;font-weight:700;font-size:14px;">? Guia Completo</div>'}
        </div>
    `;
    swapContent(viewer, wrapper);
}


/* Injeta o modal DOM apenas uma vez */
function ensureVelvetModal() {
    if (document.getElementById('velvet-modal-overlay')) return;
    const overlay = document.createElement('div');
    overlay.id = 'velvet-modal-overlay';
    overlay.className = 'velvet-modal-overlay';
    overlay.innerHTML = `
        <div class="velvet-modal-box">
            <button class="velvet-modal-close" onclick="closeVelvetModal()">&times;</button>
            <div class="velvet-modal-icon">??</div>
            <div class="velvet-modal-title">Este sussurro é apenas para quem já despertou.</div>
            <p class="velvet-modal-text">
                Reivindique sua face oculta e domine o jogo no Círculo Rainha. O acesso completo a todos os segredos está reservado para as iniciadas.
            </p>
            <a href="${window.CLUBE_CHECKOUT_URL || 'https://pay.hotmart.com/B105027530C'}"
               target="_blank" rel="noopener noreferrer"
               class="velvet-modal-btn">
                ?? Entrar no Círculo Rainha ?
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

    const paginasList = config.paginas.map((p, i) => {
        const locked = i > 0 && !isSub;
        return `
        <button onclick="${locked ? 'openVelvetModal()' : `renderVeuPagina('${tipo}', ${i})`}"
                style="background:${locked ? '#ffffff' : '#fff'};
                       border:1px solid rgba(139,0,0,${locked ? '0.2' : '0.3'});
                       border-radius:12px; padding:18px 24px; cursor:pointer;
                       display:flex; align-items:center; justify-content:space-between;
                       transition:background .2s, box-shadow .2s; font-family:inherit; width:100%;"
                onmouseover="this.style.background='#fce4ec';this.style.boxShadow='0 4px 14px rgba(139,0,0,0.12)'"
                onmouseout="this.style.background='${locked ? '#ffffff' : '#fff'}';this.style.boxShadow='none'">
            <div style="display:flex; align-items:center; gap:14px;">
                <span style="width:28px;height:28px;background:rgba(139,0,0,${locked ? '0.08' : '0.15'});
                             border-radius:50%;display:flex;align-items:center;justify-content:center;
                             font-size:12px;color:#8B0000;font-weight:800;flex-shrink:0;">${i+1}</span>
                <span style="font-family:'Playfair Display',serif;font-size:15px;
                             color:${locked ? '#6b4a4a' : '#1a0a0a'};font-weight:700;">
                    ${locked ? '?? ' : '?? '}${p.titulo}
                </span>
            </div>
            <span style="color:#8B0000;font-size:18px;">›</span>
        </button>`;
    }).join('');

    wrapper.innerHTML = `
        <p style="font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.6px;
                  color:#8B0000;margin-bottom:20px;cursor:pointer;" onclick="loadBooksShowcase()">? Biblioteca</p>

        <div style="text-align:center;margin-bottom:36px;">
            <div style="font-size:48px;margin-bottom:12px;
                        filter:drop-shadow(0 0 12px rgba(200,0,0,0.5));">${config.icon}</div>
            <h1 style="font-family:'Playfair Display',serif;font-size:28px;font-weight:900;
                       background:linear-gradient(135deg,#4A0404,#8B0000,#c62828,#8B0000);
                       -webkit-background-clip:text;-webkit-text-fill-color:transparent;
                       background-clip:text;margin-bottom:8px;">${config.titulo}</h1>
            <p style="color:#6b4a4a;font-size:14px;font-style:italic;">${config.subtitulo}</p>
            ${isSub ? '<div style="margin-top:10px;display:inline-block;background:rgba(139,0,0,0.08);color:#8B0000;font-size:11px;font-weight:800;letter-spacing:1px;text-transform:uppercase;padding:4px 16px;border-radius:99px;border:1px solid rgba(139,0,0,0.25);">?? Acesso Completo Desbloqueado</div>' : ''}
        </div>

        <div style="display:flex;flex-direction:column;gap:10px;">
            ${paginasList}
        </div>

        ${!isSub ? `
        <div style="margin-top:32px;text-align:center;background:linear-gradient(135deg,#1a0a0a,#2d0808);
                    border-radius:20px;padding:40px 32px;border:1px solid rgba(200,0,0,0.3);">
            <div style="font-size:36px;margin-bottom:12px;">??</div>
            <h3 style="font-family:'Playfair Display',serif;color:#fff;font-size:20px;
                       font-weight:900;margin-bottom:12px;line-height:1.4;">
                Desbloqueie todas as ${config.paginas.length} páginas
            </h3>
            <p style="color:rgba(255,190,190,0.75);font-size:14px;margin-bottom:24px;line-height:1.7;">
                Cada segredo escondido é um nível de poder que ainda não ativou. O Círculo Rainha é o lugar onde as iniciadas chegam antes de todos os outros.
            </p>
            <button onclick="openVelvetModal()" class="velvet-modal-btn" style="width:auto;padding:14px 40px;">
                Reivindique sua face oculta ?
            </button>
        </div>` : ''}
    `;

    swapContent(viewer, wrapper);
}


/* -- Book Summary View -------------------------------------------------------- */
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
           onclick="event.preventDefault(); loadBooksShowcase()">? Vitrine de Livros</p>
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

/* -- Recipe Detail View ------------------------------------------------------- */
function loadRecipe(id) {
    id = parseInt(id, 10);
    if (!livroAtual) return;

    const viewer = document.getElementById('content-viewer');
    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';

    const bookMeta = Object.values(window.BOOKS).find(b => b.key === livroAtual);
    const bookArr = window.biblioteca[livroAtual] || [];
    const recipe = bookArr.find(r => r.id === id);

    // Só assinante pago acessa receitas bloqueadas (logado ? assinante)
    const isSubscriber = window.SeniorAuth && window.SeniorAuth.isSubscriber();

    if (!recipe && !isSubscriber) {
        wrapper.innerHTML = `<p style="padding:40px; text-align:center; color:var(--text-muted)">Receita não encontrada neste livro.</p>`;
    } else if ((isLocked(id) || (recipe && recipe.locked)) && !isSubscriber) {
        // Não assinante ? paywall por livro (link individual Hotmart)
        wrapper.innerHTML = renderPaywallHTML(bookMeta);
    } else if (!recipe) {
        wrapper.innerHTML = `<p style="padding:40px; text-align:center; color:var(--text-muted)">Receita não encontrada neste livro.</p>`;
    } else {
        wrapper.innerHTML = renderRecipeHTML(recipe, bookMeta, isSubscriber);
    }

    swapContent(viewer, wrapper);
}


/* -- Swap helper (reusable slide-out + unroll-in) ----------------------------- */
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

/* -- Recipe HTML renderer ----------------------------------------------------- */
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
                   style="margin:0; padding:12px 24px; font-size:15px;">Próxima Receita ?</button>`;

    // Assinante: troca "Adquirir Livro" por "Ler no Portal" (sem link de download)
    const bookKey = bookMeta ? bookMeta.key : null;
    const payLink = bookKey && BOOK_PAYMENT_LINKS[bookKey] ? BOOK_PAYMENT_LINKS[bookKey] : null;
    const btnAquisicao = isSubscriber
        ? `<span style="display:inline-flex; align-items:center; gap:6px; background:#f0fdf4;
                        color:#166534; font-weight:700; font-size:13px; padding:6px 14px;
                        border-radius:20px; border:1px solid #86efac;">
               ? Acesso de Assinante
           </span>`
        : '';

    return `
        <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:24px; gap:20px;">
            <div>
                <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                          color:var(--sage-green); margin-bottom:8px; cursor:pointer;"
                   onclick="event.preventDefault(); loadBooksShowcase()">
                    ? Vitrine de Livros
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

        <div style="display:inline-flex; align-items:center; gap:10px; background:#ffffff;
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
                    ${ingredients.map(i => `<li><span class="check-item-icon">?</span> ${i}</li>`).join('')}
                </ul>
            </div>
            <div>
                <h4 class="section-title">Utensílios da Família</h4>
                <ul class="check-list">
                    ${utensils.map(u => `<li><span class="check-item-icon">?</span> ${u}</li>`).join('')}
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
                    style="margin:0; padding:12px 24px; font-size:15px; background:#ffffff; color:var(--sage-green-dark);">? Vitrine de Livros</button>
            ${nextBtn}
            ${btnAquisicao}
        </div>
    `;
}

/* -- Global Paywall (after 5 reads across all books) -------------------------- */
function renderGlobalPaywallHTML() {
    return `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                  color:var(--sage-green); margin-bottom:24px; cursor:pointer;"
           onclick="event.preventDefault(); loadBooksShowcase()">
            ? Vitrine de Livros
        </p>
        <div class="promo-banner" style="margin-top:0; padding:52px 40px;">
            <div style="font-size:48px; margin-bottom:16px;">??</div>
            <span style="display:inline-block; background:#ffffff; color:var(--sage-green); font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.5px; padding:4px 14px; border-radius:20px; margin-bottom:20px;">Acesso Completo</span>
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
                ?? Adquirir Livro 1 em PDF ?
            </a>
            <p style="font-size:12px; color:var(--text-muted); margin-top:24px;">
                ? Acesso imediato &nbsp;·&nbsp; ? PDF alta qualidade &nbsp;·&nbsp; ? 50 receitas exclusivas
            </p>
        </div>
    `;
}

/* -- Per-book Paywall banner (recipe #6+ in each book) — só para NÃO-assinantes -- */
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
               ?? Adquirir este Livro em PDF — R$ 19,90</a>`
        : `<button disabled class="promo-btn"
               style="font-size:17px; padding:16px 48px; display:inline-block; margin-top:0;
                      opacity:.45; cursor:not-allowed; background:var(--sage-green); border:none; color:#fff;">
               Em Breve</button>`;

    // Alternativa: assinar o clube para acessar todos os livros
    const ctaClube = isLogged
        ? `<a href="${window.CLUBE_CHECKOUT_URL}" target="_blank" rel="noopener noreferrer"
               style="display:inline-block; margin-top:12px; font-size:14px; color:var(--sage-green-dark);
                      font-weight:700; text-decoration:underline;">
               ? Ou assine o Clube e acesse todos os livros por R$ 28/mês ?</a>`
        : `<button onclick="window.SeniorAuth.loginComGoogle()"
               style="display:inline-block; margin-top:12px; font-size:14px; color:var(--sage-green-dark);
                      font-weight:700; background:none; border:none; cursor:pointer; text-decoration:underline;">
               ?? Entrar e assinar o Clube — acesse tudo por R$ 28/mês ?</button>`;

    return `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase; letter-spacing:.6px;
                  color:var(--sage-green); margin-bottom:24px; cursor:pointer;"
           onclick="event.preventDefault(); loadBooksShowcase()">
            ? Vitrine de Livros
        </p>
        <div class="promo-banner" style="margin-top:0; padding:52px 40px;">
            <div style="font-size:48px; margin-bottom:16px;">??</div>
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
                ? Pagamento seguro &nbsp;·&nbsp; ? PDF enviado por e-mail &nbsp;·&nbsp; ? 50 receitas completas
            </p>
        </div>
    `;
}


/* -- News Feed ---------------------------------------------------------------- */

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

/* -- Mapa de CTAs por Categoria --------------------------------------------- */
const CATEGORIA_CTA = {
    /* -- Rainha: categorias principais -------------------------- */
    'BELEZA': {
        text: '? Descobrir mais sobre Beleza',
        url:  null
    },
    'FEMININA': {
        text: '?? Explorar conteúdo Feminina',
        url:  null
    },
    'MANIPULAÇÃO': {
        text: '?? Saber mais sobre Manipulação',
        url:  null
    },
    'MANIPULACAO': {  // alias sem acento
        text: '?? Saber mais sobre Manipulação',
        url:  null
    },
    'POSICIONAMENTO': {
        text: '?? Estratégias de Posicionamento',
        url:  null
    },
    /* -- Legado (mantidos para compatibilidade) --------------- */
    'CRUZEIROS': {
        text: '?? Ver Ofertas de Cruzeiros',
        url:  'https://b2c-decolar.krooze.com.br/'
    },
    'VIAGENS': {
        text: '?? Explorar Destinos',
        url:  'https://www.decolar.com/'
    },
    'CONFORTO': {
        text: 'Ver na Amazon ?',
        url:  'https://www.amazon.com.br/s?k=conforto+idoso&tag=seniorhub-20'
    },
    'SAÚDE': {
        text: 'Cuidar da Saúde ?',
        url:  'https://www.amazon.com.br/s?k=saude+senior+60+mais&tag=seniorhub-20'
    },
    'SAUDE': {  // alias sem acento
        text: 'Cuidar da Saúde ?',
        url:  'https://www.amazon.com.br/s?k=saude+senior+60+mais&tag=seniorhub-20'
    },
    'RECEITA': {
        text: '?? Adquirir Livro de Receitas ?',
        url:  'https://pay.hotmart.com/Y104973165O'
    },
    'RECEITAS': {
        text: '?? Adquirir Livro de Receitas ?',
        url:  'https://pay.hotmart.com/Y104973165O'
    },
    'HOTEL': {
        text: '?? Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    },
    'HOTEIS': {
        text: '?? Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    },
    'HOT\u00c9IS': {
        text: '?? Reservar Hotel Agora',
        url:  'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236'
    }
};

/* -- Links de Pagamento por Livro (Hotmart) ----------------------------------
   Chave = book.key conforme window.BOOKS.
   Adicione o link de cada livro quando for publicado na Hotmart.           */
const BOOK_PAYMENT_LINKS = {
    'reliquias': 'https://pay.hotmart.com/Y104973165O',  // Livro 1 ? ativo
    'livro2'   : 'https://pay.hotmart.com/U104976011H',  // Livro 2 ? ativo
    'prazersem' : 'https://pay.hotmart.com/S104989388R',  // Livro 3 ? ativo
    'saboresmar': 'https://pay.hotmart.com/C104989538L',  // Livro 4 ? ativo
    'horta'     : 'https://pay.hotmart.com/A104989658F'   // Livro 5 ? ativo
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

    // Botão inteligente: link de compra ? "Adquirir [Categoria]"
    let finalText;
    if (hasCustomLink && isLinkDeCompra(linkNoticia)) {
        const nomeCategoria = (categoria || 'Agora').trim();
        finalText = `Adquirir ${nomeCategoria}`;
    } else {
        finalText = config ? config.text : 'Continuar Lendo ?';
    }

    return { url: finalUrl, text: finalText };
}

/* Map de título de notícia ? chave do guia (para links diretos) */
const NOTICIA_GUIA_MAP = {
    'hoovering'       : { tipo: null, guia: 'guia-hoovering' },
    'stonewalling'    : { tipo: null, guia: 'guia-stonewalling' },
    'gaslighting'     : { tipo: null, guia: 'guia-gaslighting' },
    'véu da juventude': { tipo: 'veu-juventude', guia: null },
    'veu da juventude': { tipo: 'veu-juventude', guia: null },
    'pintura da sereia': { tipo: 'pintura-sereia', guia: null },
};

/* Descobre o link de destino a partir do título da notícia */
function resolverLinkGuia(titulo) {
    const norm = (titulo || '').toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    for (const [keyword, dest] of Object.entries(NOTICIA_GUIA_MAP)) {
        const keyNorm = keyword.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
        if (norm.includes(keyNorm)) return dest;
    }
    return null;
}

/* Gera um ID único para cada card */
let _newsCardId = 0;

/* Builds a single news card DOM element from a data object */
function criarCardNoticia({ categoria, titulo, resumo, linkNoticia, linkImagem }) {
    const card = document.createElement('div');
    card.className = 'news-card feed-dinamico';
    const cardId = 'newscard-' + (++_newsCardId);

    const fallbackImg = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&q=80&w=800';
    const imgSrc = linkImagem && linkImagem.trim() ? linkImagem.trim() : fallbackImg;

    // Divide o resumo no primeiro break de parágrafo (\n\n ou \n simples entre parágrafos)
    const partes = (resumo || '').split(/\n{2,}|(?<=\.)\s*\n/);
    const primeiroPar = (partes[0] || '').trim();
    const restante    = partes.slice(1).join('\n\n').trim();
    const temResto    = restante.length > 0;

    // Botão universal: sempre aponta para a aba de Guias
    const ctaHTML = `<button class="clube-btn" style="display:inline-block;font-weight:700;cursor:pointer;" onclick="renderGuias()">Acessar o Guia \u2192</button>`;

    card.innerHTML = `
        <img src="${imgSrc}"
             alt="${titulo}" class="news-image"
             onerror="this.src='${fallbackImg}'">
        <div class="news-content">
            <span class="news-category">${categoria}</span>
            <h2 class="news-header-title">${titulo}</h2>

            <!-- Primeiro parágrafo sempre visível -->
            <p style="color:var(--text-muted); white-space:pre-wrap; margin:0 0 ${temResto ? '0' : '24px'};">${primeiroPar}</p>

            ${temResto ? `
            <!-- Parágrafos restantes retráteis -->
            <div class="news-body" id="${cardId}-body">
                <p style="color:var(--text-muted); white-space:pre-wrap; margin:12px 0 0;">${restante}</p>
            </div>
            <div class="news-fade" id="${cardId}-fade"></div>
            <button class="news-expand-btn" id="${cardId}-btn"
                    onclick="toggleNewsCard('${cardId}')" style="margin-top:4px;margin-bottom:16px;">
                Ler mais <span id="${cardId}-arrow">?</span>
            </button>
            ` : '<div style="height:16px"></div>'}

            ${ctaHTML}
        </div>
    `;
    return card;
}

/* Expande / recolhe um card de notícia */
function toggleNewsCard(id) {
    const body  = document.getElementById(id + '-body');
    const fade  = document.getElementById(id + '-fade');
    const btn   = document.getElementById(id + '-btn');
    const arrow = document.getElementById(id + '-arrow');
    if (!body) return;
    const open = body.classList.toggle('news-body--open');
    if (fade)  fade.style.display = open ? 'none' : 'block';
    if (arrow) arrow.textContent  = open ? '?' : '?';
    if (btn) {
        btn.childNodes[0].textContent = open ? 'Recolher ' : 'Ler mais ';
    }
}


/* Fetches and injects the Google Sheets CSV at the TOP of the feed.
   Called asynchronously after the static feed renders so the page isn't blocked. */
/* Categorias válidas do portal Rainha (comparadas sem acento, em minúsculo) */
const CATEGORIAS_VALIDAS = ['beleza', 'feminina', 'manipulacao', 'dinamicas de controle', 'posicionamento'];

/* Normaliza string para comparação de categoria (sem acento, minúscula) */
function normalizarCat(s) {
    return (s || '').trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[.,;!?]+$/, '').trim();
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
        const idxDestaque = dataRows.findIndex(r => ['manipulacao', 'dinamicas de controle'].includes(normalizarCat(r[iCat])));

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
    placeholder.textContent = '? Carregando inteligência feminina...';
    feed.appendChild(placeholder);

    viewer.appendChild(feed);
    carregarFeedNoticias(feed);
}

/* Alias para o menu Beleza (carrega a vitrine de livros com rótulo atualizado) */
function loadBeleza() {
    loadRecipesFeed();
}

/* -- Oráculo de Promoção Mística — 7 Itens (Sidebar Direita) -----------------
   Itens 1-5 = Os Cinco Livros do Domínio  |  Itens 6-7 = Campos de Especialidade */
const ads = [
    {
        id: 'livro-1', livro: 1, emoji: '??',
        title: 'O Rastro de Vênus',
        subtitle: 'O perfume da pele que domina instintos.',
        link: 'https://pay.hotmart.com/Y104973165O',
        btnText: 'Despertar Agora', tipo: 'livro'
    },
    {
        id: 'livro-2', livro: 2, emoji: '??',
        title: 'O Compasso da Lua',
        subtitle: 'Sincronize sua essência com o ciclo do poder.',
        link: 'https://pay.hotmart.com/U104976011H',
        btnText: 'Despertar Agora', tipo: 'livro'
    },
    {
        id: 'livro-3', livro: 3, emoji: '??',
        title: 'A Melodia das Curvas',
        subtitle: 'A arquitetura corporal que silencia o ambiente.',
        link: 'https://pay.hotmart.com/S104989388R',
        btnText: 'Adquirir Volume', tipo: 'livro'
    },
    {
        id: 'livro-4', livro: 4, emoji: '??',
        title: 'O Fogo das Sombras',
        subtitle: 'Vitalidade oculta para desarmar resistências.',
        link: 'https://pay.hotmart.com/C104989538L',
        btnText: 'Adquirir Volume', tipo: 'livro'
    },
    {
        id: 'livro-5', livro: 5, emoji: '??',
        title: 'O Néctar das Musas',
        subtitle: 'A alquimia do sabor que o torna dependente.',
        link: 'https://pay.hotmart.com/A104989658F',
        btnText: 'Adquirir Volume', tipo: 'livro'
    },
    {
        id: 'veu-juventude', livro: null, emoji: '??',
        title: 'O Véu da Juventude',
        subtitle: 'O segredo da pele que ele deseja desvendar.',
        link: null, btnText: 'Despertar Agora',
        tipo: 'veu', veuKey: 'veu-juventude'
    },
    {
        id: 'pintura-sereia', livro: null, emoji: '?????',
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

    // Botão CTA — Cavalo?Bispo
    let adBtnHtml;
    if (ad.tipo === 'livro') {
        adBtnHtml = isSubscriber
            ? `<button onclick="window.handleBookClick(${ad.livro})" class="ad-btn ad-btn--crimson">
                   ?? Ler no Portal ?
               </button>`
            : `<a href="${ad.link}" target="_blank" rel="noopener noreferrer" class="ad-btn ad-btn--crimson">
                   ${ad.btnText} ?
               </a>`;
    } else {
        adBtnHtml = `<button onclick="renderVeuConteudo('${ad.veuKey}')" class="ad-btn ad-btn--crimson">
               ${ad.btnText} ?
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

/* -- Conforto do Lar — Top 10 Tópicos de Afiliados ----------------------- */
window.LOJA_TOPICOS = [
    {
        emoji: '???',
        titulo: 'Dormir Sem Dores',
        beneficio: 'Travesseiros Cervicais e Almofadas de Gel para noites tranquilas',
        link: 'https://www.amazon.com.br/s?k=travesseiro+cervical+ortopedico&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Segurança no Banheiro',
        beneficio: 'Barras de Apoio e Tapetes Antiderrapantes que previnem quedas',
        link: 'https://www.amazon.com.br/s?k=barra+de+apoio+banheiro&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Alívio Muscular',
        beneficio: 'Massageadores de Pescoço, Pés e Lombar para descansar de verdade',
        link: 'https://www.amazon.com.br/s?k=massageador+pescoco+e+costas&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Cozinha Sem Esforço',
        beneficio: 'Abridores de Potes e Utensílios Ergonômicos para mãos seguras',
        link: 'https://www.amazon.com.br/s?k=abridor+de+potes+ergonomico&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Iluminação Inteligente',
        beneficio: 'Luminárias com Sensor de Movimento para corredores e banheiros',
        link: 'https://www.amazon.com.br/s?k=luminaria+sensor+movimento&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Postura e Assento',
        beneficio: 'Almofadas Terapêuticas e Encostos Ortopédicos para longas horas',
        link: 'https://www.amazon.com.br/s?k=almofada+gel+assento&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Saúde sob Controle',
        beneficio: 'Medidores de Pressão e Oxímetros de Fácil Leitura para monitorar sem sair de casa',
        link: 'https://www.amazon.com.br/s?k=medidor+pressao+digital+bra%C3%A7o&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Organização de Remédios',
        beneficio: 'Porta-comprimidos Inteligentes e com Alarme para nunca esquecer uma dose',
        link: 'https://www.amazon.com.br/s?k=porta+comprimidos+semanal&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Pernas e Circulação',
        beneficio: 'Meias de Compressão e Exercitadores de Pernas contra inchaço',
        link: 'https://www.amazon.com.br/s?k=meia+compressao+suave&tag=seniorhub-20'
    },
    {
        emoji: '??',
        titulo: 'Lazer e Leitura',
        beneficio: 'Kindles, Lupas Eletrônicas e Suportes de Tablet para o seu tempo livre',
        link: 'https://www.amazon.com.br/s?k=kindle+dispositivo&tag=seniorhub-20'
    }
];

/* -- Posicionamento — Presença e Poder Feminino ------------------ */
function renderPosicionamento() {
    setActiveLink('');
    const viewer = document.getElementById('content-viewer');

    const cards = window.LOJA_TOPICOS.map((t, i) => `
        <a href="${t.link}" target="_blank" rel="noopener noreferrer"
           style="text-decoration:none; display:flex; flex-direction:column; outline:none;
                  background:#fff; border:1px solid #dbdbdb; border-radius:18px;
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
                Ver na Amazon ?
            </div>
        </a>
    `).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:var(--sage-green); margin-bottom:20px;
                  cursor:pointer;"
           onclick="loadNewsFeed()">? Início</p>

        <div style="margin-bottom:32px;">
            <h1 style="font-size:28px; font-weight:900; color:#2a1a06; margin:0 0 8px;">
                ?? Posicionamento
            </h1>
            <p style="font-size:15px; color:#7a5e32; margin:0;">
                Estratégias de presença, autoridade e poder feminino. Posicione-se com inteligência e elegante distinção.
            </p>
        </div>

        <p style="font-size:11px; font-weight:800; text-transform:uppercase;
                  letter-spacing:.7px; color:var(--sage-green); margin-bottom:12px;">
            ?? Recursos Selecionados
        </p>
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap:18px;">
            ${cards}
        </div>

    `;


    swapContent(viewer, wrapper);
}

/* Alias de retrocompatibilidade */
function renderLojaConforto() { renderPosicionamento(); }

/* -- Exercícios em Casa — Vitrine de Afiliados ---------------------------- */
const EXERCICIOS_CARDS = [
    {
        emoji: '???',
        titulo: 'Fortalecimento e Mobilidade',
        descricao: 'Faixas elásticas e halteres leves para fazer em casa.',
        link: 'https://www.amazon.com.br/s?k=exercicios+idosos+mobilidade&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '??',
        titulo: 'Cardio Sentado (Fisioterapia)',
        descricao: 'Mini bicicletas e pedais para exercitar as pernas sentado.',
        link: 'https://www.amazon.com.br/s?k=mini+bicicleta+ergometrica+fisioterapia&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '??',
        titulo: 'Proteínas e Músculos',
        descricao: 'Nutren Senior, Whey Protein e suplementos para massa muscular.',
        link: 'https://www.amazon.com.br/s?k=nutren+senior+suplemento+proteina&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '??',
        titulo: 'Vitaminas e Imunidade',
        descricao: 'Ômega 3, Vitamina D e Magnésio para longevidade.',
        link: 'https://www.amazon.com.br/s?k=vitaminas+senior+50+mais&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    }
];

/* -- Feminina — Inteligência e Presença Feminina ---------------- */
const FEMININA_CARDS = [
    {
        emoji: '??',
        titulo: 'Psicologia Feminina',
        descricao: 'Livros e recursos sobre comportamento, autopercepção e inteligência emocional feminina.',
        link: 'https://www.amazon.com.br/s?k=psicologia+feminina+livros&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '??',
        titulo: 'Beleza e Autocuidado',
        descricao: 'Produtos premium de beleza, skincare e cuidados que realçam sua presença e confìança.',
        link: 'https://www.amazon.com.br/s?k=skincare+premium+feminino&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '??',
        titulo: 'Leitura Transformadora',
        descricao: 'Obras sobre poder feminino, liderança, sedução intelectual e arte da conversção.',
        link: 'https://www.amazon.com.br/s?k=poder+feminino+liderança+livros&tag=seniorhub-20',
        btn: 'Ver na Amazon'
    },
    {
        emoji: '?????',
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
                  background:#fff; border:1px solid #dbdbdb; border-radius:18px;
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
                ${c.btn} ?
            </div>
        </a>
    `).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:var(--sage-green); margin-bottom:20px; cursor:pointer;"
           onclick="loadNewsFeed()">? Início</p>

        <div style="margin-bottom:32px;">
            <h1 style="font-size:28px; font-weight:900; color:#2a1a06; margin:0 0 8px;">
                ?? Feminina
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

/* -- Guia de Viagens — Destinos Decolar -------------------------------- */
const VIAGENS_DESTINOS = [
    {
        emoji: '??',
        destino: 'Charme em Gramado (RS)',
        descricao: 'O melhor da Serra Gaúcha: hotéis requintados e o melhor da gastronomia nacional.',
        link: 'https://www.decolar.com/hoteis/h-251025/hoteis-em-gramado',
        badge: 'Nacional'
    },
    {
        emoji: '????',
        destino: 'O Melhor de Portugal',
        descricao: 'Explore Lisboa e Porto com conforto. História, cultura e vinhos em uma viagem inesquecível.',
        link: 'https://www.decolar.com/pacotes/lis/pacotes-para-lisboa',
        badge: 'Internacional'
    },
    {
        emoji: '??',
        destino: 'Cruzeiros All-Inclusive',
        descricao: 'Viaje pelo litoral brasileiro com todo o conforto de um hotel 5 estrelas móvel.',
        link: 'https://b2c-decolar.krooze.com.br/',
        badge: 'Cruzeiro'
    },
    {
        emoji: '??',
        destino: 'Resorts no Nordeste',
        descricao: 'Sol e descanso em Maceió ou Porto de Galinhas nos melhores resorts pé na areia.',
        link: 'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fresorts%2Findex.pt-br.html%3Faid%3D2311236',
        badge: 'Nacional'
    },
    {
        emoji: '??',
        destino: 'Hotéis e Pousadas',
        descricao: 'As melhores hospedagens com cancelamento grátis e selo de confiança SeniorHub.',
        link: 'https://www.awin1.com/cread.php?awinmid=18120&awinaffid=2787542&ued=https%3A%2F%2Fwww.booking.com%2Fhotel%2Findex.pt-br.html%3Faid%3D2311236',
        badge: 'Hotel'
    }
];

/* -- Helpers de CTA para o Guia de Viagens ---------------------------------
   Regras:
   • badge 'Cruzeiro'             ? Krooze (d.link)
   • destino contém 'Resort'     ? BOOKING_RESORTS_URL + '?? Ver Melhores Resorts'
   • badge 'Hotel'               ? BOOKING_HOTELS_URL  + '?? Reservar Hotel Agora'
   • Nacional / Internacional     ? BOOKING_FLIGHTS_URL + '?? Ver Voos na Booking' */
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
    if (badge === 'CRUZEIRO')          return '?? Ver Ofertas de Cruzeiros';
    if (destino.includes('RESORT'))    return '?? Ver Melhores Resorts';
    if (badge === 'HOTEL')             return '?? Reservar Hotel Agora';
    if (badge === 'NACIONAL' || badge === 'INTERNACIONAL') return '?? Ver Voos na Booking';
    return '??? Explorar Destino';
}

/* -- Manipulação — Inteligência Relacional e Comportamental -------- */
const MANIPULACAO_TEMAS = [
    {
        emoji: '??',
        destino: 'A Arte da Persuasão',
        descricao: 'Domine as técnicas de influência social, persuasão e retórica que movem o mundo.',
        link: 'https://www.amazon.com.br/s?k=persuasao+influencia+livros&tag=seniorhub-20',
        badge: 'Psicologia'
    },
    {
        emoji: '??',
        destino: 'Dinâmicas de Poder',
        descricao: 'Compreenda as hierarquias sociais e como naveguem com elegância e estratégia.',
        link: 'https://www.amazon.com.br/s?k=dinamicas+poder+relacoes+sociais&tag=seniorhub-20',
        badge: 'Relacional'
    },
    {
        emoji: '???',
        destino: 'Leitura de Pessoas',
        descricao: 'Linguagem corporal, microexpressões e sinais que revelam as verdadeiras intenções.',
        link: 'https://www.amazon.com.br/s?k=leitura+linguagem+corporal+livros&tag=seniorhub-20',
        badge: 'Comportamento'
    },
    {
        emoji: '??',
        destino: 'Inteligência Emocional',
        descricao: 'Controle emocional, empatia estratégica e gestão de relacionamentos com profundidade.',
        link: 'https://www.amazon.com.br/s?k=inteligencia+emocional+livros&tag=seniorhub-20',
        badge: 'Emocional'
    },
    {
        emoji: '??',
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
        <div style="background:#fff; border:1px solid #dbdbdb; border-radius:20px;
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
                   onmouseover="this.style.background='#ffffff';"
                   onmouseout="this.style.background='#ffffff';">
                    ?? Explorar
                </a>
            </div>
        </div>
    `).join('');

    const wrapper = document.createElement('div');
    wrapper.className = 'recipe-card';
    wrapper.innerHTML = `
        <p style="font-size:12px; font-weight:700; text-transform:uppercase;
                  letter-spacing:.6px; color:var(--sage-green); margin-bottom:20px; cursor:pointer;"
           onclick="loadNewsFeed()">? Início</p>

        <div style="margin-bottom:32px;">
            <h1 style="font-size:28px; font-weight:900; color:#2a1a06; margin:0 0 8px;">
                ??? Manipulação
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

/* -- Guias — Dados --------------------------------------------------------- */
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
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Voc&#234; N&#227;o Est&#225; Inventando</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">H&#225; uma voz dentro de voc&#234; que sussurra h&#225; muito tempo. Ela diz que algo est&#225; errado &#8212; n&#227;o com o mundo, mas com a forma como <em>voc&#234;</em> est&#225; experienciando o mundo. Uma sensa&#231;&#227;o de que a realidade que lhe &#233; apresentada n&#227;o coincide com o que seus olhos, ouvidos e cora&#231;&#227;o registraram.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Voc&#234; pergunta: &#8220;Mas ser&#225; que sou eu?&#8221; E essa pergunta, repetida vezes o suficiente, come&#231;a a parecer uma resposta. Come&#231;a a parecer que a d&#250;vida em si &#233; a prova da sua instabilidade.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">N&#227;o &#233;. A d&#250;vida &#233; o sintoma de algo que algu&#233;m fez <em>com</em> voc&#234; &#8212; metodicamente, pacientemente, ao longo do tempo. E o primeiro ato de coragem &#233; este: nomear o que voc&#234; sente, antes mesmo de entend&#234;-lo completamente.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
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
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Sinais Que Voc&#234; N&#227;o Devia Ignorar</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voc&#234; saiu de conversas sentindo que estava errada, mas n&#227;o consegue explicar exatamente por qu&#234;.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voc&#234; come&#231;ou a se desculpar antes mesmo de terminar de falar.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A sua mem&#243;ria de eventos importantes diverge consistentemente da mem&#243;ria de outra pessoa &#8212; e a sua vers&#227;o nunca &#233; a verdadeira.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Voc&#234; passou a evitar certos assuntos para n&#227;o &#8220;criar confus&#227;o&#8221; &#8212; mesmo quando s&#227;o assuntos sobre voc&#234; mesma.</p></div>
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Como a Realidade &#201; Tecnicamente Distorcida</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O gaslighting n&#227;o &#233; acidente &#8212; &#233; m&#233;todo. Ele opera em camadas, com uma sofistica&#231;&#227;o que explica por que &#233; t&#227;o dif&#237;cil de nomear enquanto acontece. A n&#233;voa n&#227;o aparece de repente; ela se instala como uma umidade que voc&#234; n&#227;o percebe at&#233; que o ambiente inteiro esteja encharcado.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Dicion&#225;rio das Frases que Desorientam</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O gaslighting tem uma linguagem pr&#243;pria &#8212; frases que parecem razo&#225;veis na superf&#237;cie mas t&#234;m uma fun&#231;&#227;o espec&#237;fica: desmantelar a sua percep&#231;&#227;o da realidade. Quando voc&#234; entende a inten&#231;&#227;o por tr&#225;s da palavra, a palavra perde o poder que tinha.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Reconstruindo o Ch&#227;o Sob os Seus P&#233;s</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Quando algu&#233;m sistematicamente questiona a sua percep&#231;&#227;o, o dano se instala na estrutura com que voc&#234; avalia a realidade. Reconstruir essa estrutura &#233; uma pr&#225;tica &#8212; uma s&#233;rie de exerc&#237;cios intencionais que restabelecem a confian&#231;a na sua pr&#243;pria mente.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Rito da Desconex&#227;o Emocional</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Existe um ponto em toda jornada de recupera&#231;&#227;o em que a an&#225;lise cede lugar &#224; decis&#227;o. Voc&#234; j&#225; nomeou o que aconteceu. Voc&#234; j&#225; entendeu os mecanismos. Agora vem o ato final e o mais soberano: a desconex&#227;o emocional do que n&#227;o lhe pertence mais.</p>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Desconex&#227;o emocional n&#227;o &#233; indiferen&#231;a. &#201; a decis&#227;o consciente de n&#227;o mais permitir que a realidade de outra pessoa colonize a sua.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Fronteiras Inegoci&#225;veis</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fronteira de Realidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Eu n&#227;o continuarei conversas em que minha mem&#243;ria seja questionada como evid&#234;ncia do meu problema. Posso estar errada &#8212; mas essa conclus&#227;o ser&#225; minha, ap&#243;s reflex&#227;o, n&#227;o sua por decreto.&#8221;</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fronteira de Emo&#231;&#227;o</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Eu n&#227;o justificarei o que sinto. Sinto. Isso basta como dado.&#8221;</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fronteira de Narrativa</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Minha hist&#243;ria &#233; minha. Voc&#234; pode ter uma vers&#227;o diferente &#8212; ela pode coexistir com a minha. Mas ela n&#227;o a substitui. Nunca mais.&#8221;</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Rito Final</h3></div>
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
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Golpe que N&#227;o Deixa Marca Vis&#237;vel</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O <em>negging</em> &#233; uma t&#225;tica de deprecia&#231;&#227;o sutil, desenhada para desestabilizar a confian&#231;a de uma mulher atrav&#233;s de insultos disfarçados de feedback, preocupa&#231;&#227;o ou &#8220;honestidade brutal&#8221;. Diferente de uma ofensa direta, que geraria uma rea&#231;&#227;o imediata de defesa, o negging opera abaixo do radar.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Ele &#233; projetado para fazer voc&#234; se questionar, gerando uma pequena ferida na sua autoimagem que, com o tempo, se torna uma cicatriz de inseguran&#231;a. O objetivo &#233; simples: diminuir o seu valor percebido para que o manipulador pare&#231;a estar &#8220;acima&#8221; de voc&#234;, fazendo com que voc&#234; busque desesperadamente a aprova&#231;&#227;o dele para se sentir adequada novamente.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">A din&#226;mica come&#231;a de forma quase imperceptível &#8212; &#233; aquele coment&#225;rio sobre como seu vestido &#233; &#8220;corajoso&#8221; para o seu tipo de corpo, ou como voc&#234; &#233; &#8220;surpreendentemente inteligente para algu&#233;m t&#227;o bonita&#8221;.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
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
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Cavalos de Troia Verbais</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Voc&#234; &#233; t&#227;o bonita para uma mulher da sua idade.&#8221; &#8212; O que soa como elogio esconde a redu&#231;&#227;o.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Sua apresenta&#231;&#227;o foi boa, considerando o tempo que voc&#234; teve.&#8221; &#8212; A ressalva apaga a conquista.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Voc&#234; &#233; corajosa de usar isso.&#8221; &#8212; Elogio que embrulha uma cr&#237;tica ao seu corpo.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Sorte que voc&#234; &#233; bonita!&#8221; &#8212; Anula a intelig&#234;ncia ou compet&#234;ncia com ironia disfar&#231;ada.</p></div>
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Decifrando as Frases Comuns</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Por tr&#225;s de cada frase de negging existe uma inten&#231;&#227;o precisa. Quando voc&#234; aprende a traduzir o que est&#225; sendo dito, a frase perde seu veneno. Aqui est&#227;o os c&#243;digos mais usados e o que eles realmente significam.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Dicionário do Reconvite</h3>
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Por Que Mulheres de Alto Valor S&#227;o o Alvo</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O negging n&#227;o &#233; usado aleatoriamente. Ele &#233; uma t&#225;tica que homens inseguros reservam especificamente para mulheres que percebem como superiores a eles &#8212; mulheres confiantes, bem-sucedidas, belas e independentes. Entender isso muda tudo.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">A Psicologia por Tr&#225;s do Alvo</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Ele a percebe como inacess&#237;vel</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A mulher de alto valor gera uma sensa&#231;&#227;o de amea&#231;a em homens com autoestima fr&#225;gil. O negging &#233; a tentativa de reduzir esse &#8220;diferencial de poder&#8221; &#8212; de baixar voc&#234; ao n&#237;vel onde ele se sente confort&#225;vel.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Ela n&#227;o precisa dele &#8212; e isso o aterroriza</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Uma mulher que n&#227;o precisa de aprova&#231;&#227;o &#233; incontrol&#225;vel. O negging &#233; a estrat&#233;gia para criar essa necessidade artificialmente &#8212; fazer com que ela busque exatamente o que ele reteve.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O paradoxo da admira&#231;&#227;o t&#243;xica</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ironicamente, o negging &#233; uma forma distorcida de admira&#231;&#227;o. Ele a escolhe como alvo porque a v&#234; como superior. A deprecia&#231;&#227;o &#233; o &#250;nico mecanismo que ele conhece para se aproximar do que o faz sentir inferior.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Perfis do Depreciador</h3></div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>O Cr&#237;tico Disfar&#231;ado de Mentor:</strong> usa a autoridade de &#8220;quem quer o seu bem&#8221; para entregar ofensas embaladas em sabedoria.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>O Humor&#237;sta T&#243;xico:</strong> usa piadas e &#8220;brincadeiras&#8221; como ve&#237;culo, sabendo que qualquer reação sua ser&#225; retratada como excesso.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><strong>O Observador Sutil:</strong> inserido na rotina &#8212; na família, no trabalho &#8212; usa coment&#225;rios pontuais mas frequentes, calculados para n&#227;o parecerem padr&#227;o.</p></div>
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Como Responder com Elegância e Autoridade</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A resposta ao negging n&#227;o &#233; a explosão emocional nem o sil&#234;ncio submisso. &#201; a neutraliza&#231;&#227;o soberana &#8212; uma resposta que exibe o n&#237;vel de consci&#234;ncia que o manipulador esperava nunca encontrar.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
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
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Rituais de Afirma&#231;&#227;o da Soberania</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Reconhecer e neutralizar o negging &#233; o primeiro passo. O segundo &#233; limpar o espa&#231;o interno onde as cr&#237;ticas deixaram res&#237;duos. Estes rituais foram desenhados para restaurar a integridade do seu espelho interno.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Pr&#225;ticas Di&#225;rias de Consagra&#231;&#227;o</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Invent&#225;rio do Valor (matinal)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Antes de qualquer contato com o mundo externo, escreva tr&#234;s qualidades que voc&#234; possui que n&#227;o dependem da opini&#227;o de ningu&#233;m. Com o tempo, essa lista se torna o seu escudo prim&#225;rio.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Filtro da Fonte</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Antes de internalizar qualquer cr&#237;tica, pergunte: &#8220;Quem est&#225; dizendo isso? Essa pessoa me conhece profundamente? Ela tem interesse genuíno no meu crescimento?&#8221; Se a resposta for n&#227;o, a cr&#237;tica n&#227;o entra.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Limpeza Verbal (noturna)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ao final do dia, revise qualquer coment&#225;rio que criou desconforto. Pergunte: &#8220;Isso era sobre mim ou sobre ele?&#8221; Devolva mentalmente o que n&#227;o &#233; seu. Limpe o espelho.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Decreto de Inviolabilidade (semanal)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Reserve um momento para declarar em voz alta: &#8220;Meu valor n&#227;o &#233; negoci&#225;vel. Minha confian&#231;a n&#227;o &#233; editada por vozes externas. Eu escolho o que entra.&#8221;</p></div></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Decreto Final da Soberana</h3></div>
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
    },

    {
        id: 'triangulacao',
        titulo: 'Triangulação',
        descricao: 'A terceira sombra e a insegurança como ferramenta de governo. Cinco cap&#237;tulos para reconhecer, desarmar e sair do ringue invis&#237;vel onde o manipulador se torna o árbitro da sua vida.',
        paginas: [
            {
                num: 1,
                titulo: 'Triangulação',
                gratis: true,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Governo pela Insegurança</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A <em>triangulação</em> é uma manobra psicológica onde o manipulador introduz uma terceira pessoa na dinâmica do relacionamento para criar um ambiente de competição, ciúmes e instabilidade. Essa &#8220;terceira ponta&#8221; pode ser uma ex-namorada que &#8220;ainda o procura&#8221;, uma amiga &#8220;muito próxima&#8221; ou até um flerte platônico que ele faz questão de mencionar.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O objetivo não é necessariamente a traição física, mas sim o controle emocional. Ao fazer você sentir que a sua posição no coração e na vida dele é frágil e disputada, ele garante que você se esforce o dobro para agradá-lo, tentando &#8220;vencer&#8221; uma concorrência que ele mesmo criou.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Enquanto você se ocupa em monitorar a &#8220;rival&#8221;, ele se torna o juiz supremo da disputa, colhendo os frutos da sua atenção redobrada e do seu medo de perdê-lo.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Infiltração Sutil</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A tática de infiltração é sutil: ele faz comparações &#8220;inocentes&#8221; ou elogia virtudes da outra pessoa que, por entrelinhas, sugerem que faltam em você. Ele utiliza a sua necessidade natural de ser única e especial para coloçá-la em um ringue invisível.</p>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A escassez de afeto como moeda</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">É uma forma de governo baseada na escassez: ele distribui migalhas de atenção apenas para quem &#8220;vencer&#8221; o desafio do dia. O afeto se torna prêmio de consolation, não direito natural de um relacionamento saudável.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A soberana reconhece o ringue</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A triangulação prospera no silêncio e na dúvida; ela morre quando você se recusa a competir por um lugar que já deveria ser seu por direito e respeito.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Sinais do Triângulo</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ele menciona espontaneamente outras mulheres que o admiram ou o desejam, sem que você tenha perguntado.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Compara suas atitudes com as de uma ex ou amiga, sempre de forma que você sai em desvantagem.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Deixa conversas ou encontros ambiguamente indefinidos, criando espaço para que você tema a &#8220;concorrente&#8221;.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Fica mais atencioso e carinhoso exatamente após mencionar outra mulher &#8212; reforço condicionado deliberado.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Trono É Individual</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Retomar a soberania significa entender que o amor real oferece segurança, não uma corda bamba. Se o ambiente exige disputa para garantir afeto, o problema não está na sua &#8220;concorrente&#8221;, mas na mão que segura o chicote da insegurança.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;No seu domínio, o trono é individual e inegociável. Não há vaga para competição.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 2,
                titulo: 'Os Fantasmas do Passado e do Presente',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Identificando as Pontas do Triângulo</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O manipulador escolhe com cuidado quem coloca como &#8220;terceira ponta&#8221;. Cada tipo de fantasma tem uma função específica na sua estratégia de controle. Identificar o perfil é o primeiro passo para desfazer o triângulo.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Os Três Fantasmas Mais Comuns</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A Ex Imortalizad</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Usada para criar uma referência de &#8220;passado ideal&#8221;. Frases como &#8220;ela entendia meu trabalho&#8221; ou &#8220;ela nunca reclamava&#8221; estabelecem um padrão que você é constantemente comparada &#8212; e que provavelmente nunca existiu da forma que ele descreve.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A Admiradroa Misteriosa</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Uma mulher no trabalho, academia ou redes sociais que &#8220;manda mensagens o tempo todo&#8221;. A vagueza é intencional: dúhbia o suficiente para ativar o ciúmes, mas nunca concreta o suficiente para que você possa confrontar.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A Amiga Especial</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Apresentada como &#8220;só amiga&#8221;, mas com uma intimidade que é exibida seletivamente. O objetivo é fazer você questionar seus limites e parecer &#8220;ciumenta&#8221; se reagir &#8212; enquanto ele colhe o prazer do seu desconforto.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O fantasma só tem poder na escuridão da dúvida. Quando você acende a luz da consciência, ele desaparece.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 3,
                titulo: 'A Psicologia do Árbitro',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Por Que Ele Sente Prazer no Triângulo</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Entender a psicologia por trás da triangulação é um ato de emancipação. Quando você compreende o que move o árbitro, o jogo perde o sentido &#8212; e você para de jogar.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Os Três Pilares da Necessidade do Árbitro</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Validação Narcisista</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ver mulheres competindo por sua atenção preenche uma necessidade profunda de validação. Não é sobre você &#8212; é sobre a imagem que ele tem de si mesmo como homem &#8220;de alto valor&#8221;.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Controle pelo Medo</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Uma mulher com medo de perder diminui a assertividade, torna-se mais maleável e menos propensa a estabelecer limites. O triângulo é a ferramenta mais eficiente para manter o controle sem conflito direto.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Fuga da Intimidade Real</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A presença de uma &#8220;terceira ponta&#8221; cria uma distância emocional que ele gere. Enquanto houver um &#8220;rival&#8221;, nunca há necessidade de uma intimidade genuinamente vulneravel &#8212; o que ele teme mais do que qualquer coisa.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Quem precisa de um placar de admirã para se sentir valioso ainda não encontrou o próprio valor. Não é sua função preencher esse vazio.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 4,
                titulo: 'Saído do Ringue',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Técnicas para Desarmar Triangulação</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Sair do ringue não é uma ato de resignação &#8212; é um ato de soberania. A seguir estão as técnicas de comunicação assertiva que desarmam a triangulação sem drama e sem perder a classe.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Arsenal da Recusa ao Ringue</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Nomeação Serena</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Com calma e olhar direto: &#8220;Percebo que você menciona outras mulheres com frequência. Isso é intencion? Prefiro não ter esse tipo de referência no nosso espaço.&#8221; Sem acusação, sem ciúmes exposto &#8212; apenas clareza.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Desengajamento Elegante</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando ele mencionar a &#8220;concorrente&#8221;, não reaja com ansiedade nem com frieza hostil. Simplesmente mude de assunto com naturalidade. Sua indiferença estratégica remove o prazer que ele busca.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Decreto de Exclusividade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Em conversa franca: &#8220;Eu não me relaciono em ambientes de competição. Se você não tem certeza sobre o que quer, eu entendo &#8212; mas não vou ficar aguardando enquanto você decide.&#8221; Isso reequilibra o poder.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Foco no Seu Próprio Elo</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Invista energia em seus próprios projetos, amizades e práticas de auto desenvolvimento. Quando sua vida está plena, a sombra da &#8220;concorrente&#8221; perde a dimensão que ele projetou para ela.</p></div></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A Rainha não entra no ringue. Ela observa de cima e decide se o campo vale o seu tempo.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 5,
                titulo: 'A Exclusividade da Coroa',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Padrões de Relacionamento Fundados na Segurança</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Depois de sair do ringue, o trabalho mais profundo começa: construção de padrões de relacionamento onde a segurança é o pilar central &#8212; não a exceção, mas a regra inegociável.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Os Quatro Pilares da Exclusividade Real</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Pilar da Segurança Basica</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Em um relacionamento saudável, sua posição não é debatida, testada ou submetida a aprovação periódica. Defina internamente: &#8220;Eu apenas me relaciono com quem me oferece segurança emocional como padrão mínimo, não como recompensa.&#8221;</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Pilar da Convers Inicial</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">No início de relacionamentos, nomeie o que é inaceitável para você antes que seja testado. Não como ameaça &#8212; como autoapresentação. Quem se afastar fez um favor; quem ficar sabe os termos.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Pilar da Vida Própria</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Mantenha projetos, amizades e ambições que existem independentemente de qualquer relacionamento. Uma mulher com uma vida plena não precisa ganhar o &#8220;concurso&#8221; &#8212; ela simplesmente é insubstituível.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Pilar da Saída Digna</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Se após o decreto o triângulo persiste, a saída com dignidade é o ato mais soberano possível. Proteger o seu reino significa também reconhecer quando um intrúso não tem intenção de sair &#8212; e fechar as portas com serença.</p></div></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Decreto de Inviolabilidade</h3></div>
                            <div style="display:flex;flex-direction:column;gap:14px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sente-se em silêncio. Respire fundo três vezes.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;Meu lugar único não é conquistado em dispute. Ele é reconhecido ou não existe.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva o padrão que você estabelece para relacionamentos a partir de hoje.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;Protéjo o meu reino de invasores. A paz é o meu padrão inegociável.&#8221;</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">A Coroa É Sua</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Sua paz não é um prêmio para ser disputado. Vocêé a única autoridade sobre o seu próprio valor &#8212; e o amor que merece é aquele que nunca exigiu que você provasse esse valor.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;No seu domínio, o trono é individual e inegociável. Cuide-o.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            }
        ],
        get conteudo() { return this.paginas[0].conteudo; },
        categoria: 'Manipulação',
        gratis: true
    }
,

    {
        id: 'stonewalling',
        titulo: 'Stonewalling',
        descricao: 'O muro de silêncio e a prisão da indiferença. Cinco capítulos para entender, resistir e governar sua própria paz quando o manipulador elege o gelo como arma.',
        paginas: [
            {
                num: 1,
                titulo: 'A Barreira Invisível',
                gratis: true,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Silêncio Como Punição</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O <em>stonewalling</em>, ou &#8220;tratamento de silêncio&#8221;, é uma das táticas de manipulação mais frias e paralisantes que existem. Ocorre quando, diante de um conflito ou de uma simples tentativa de diálogo, o homem se retira emocionalmente, erguendo um muro intransponível de mudez e desdém.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Não é um tempo para &#8220;esfriar a cabeça&#8221; &#8212; é uma punição deliberada. Ao se recusar a responder, ele retira de você o direito básico à comunicação, deixando-a em um vácuo de ansiedade onde você se vê obrigada a mendigar por uma palavra ou a pedir desculpas por algo que não cometeu.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Cada tentativa sua de quebrar o muro reforça o poder dele. É uma forma de governo baseada no abandono temporário, onde ele te expulsa do reino emocional dele até que você se &#8220;comporte&#8221; da maneira que ele deseja.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Infiltração pelo Desejo de Conexão</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">Ele utiliza o seu desejo natural de conexão e harmonia contra você mesma. Ao ver você se esforçando, chorando ou tentando explicar seu ponto de vista repetidamente, o manipulador se sente no controle total da situação.</p>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O muro que você não deve bater</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A soberana entende que o silêncio de quem não quer ouvir é um território que não vale a pena ser invadido. Quando o manipulador ergue o muro, a reação da Rainha não é bater na porta, mas dar as costas e cuidar do seu próprio jardim.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O silêncio como presente</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O stonewalling só funciona se você estiver do outro lado esperando a porta abrir. No momento em que você redireciona sua atenção para si mesma e aceita o silêncio dele como um presente de solitude, o muro perde a utilidade estratégica e desaba.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Sinais do Stonewalling</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Responde com monossilabos ou simplesmente não responde, mesmo quando você está claramente angustiada.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sai da sala, coloca fone de ouvido ou finge dormir no meio de uma discussão importante.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Volta ao normal sem nenhuma resolução, esperando que você aja como se nada tivesse acontecido.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Usa o silêncio seletivamente &#8212; conversa normalmente com outros, mas te ignora especificamente.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Governo É Inabalável</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O seu valor não diminui porque alguém se recusa a validá-lo com palavras. Se ele escolheu o silêncio, deixe-o habitar nele sozinho. A sua voz é um tesouro, e a sua paz é um território sagrado que nenhuma barreira de gelo tem o poder de congelar.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A comunicação é um privilégio concedido a quem tem maturidade para caminhar nela.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 2,
                titulo: 'A Psicologia do Gelo',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Por Que Ele Usa o Silêncio Para Punir</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Entender a psicologia por trás do stonewalling transforma o que parece uma parede impenetrável em algo previsível e neutralizável. O manipulador não age por impulso &#8212; ele age por medo disfarçado de poder.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Os Três Motores do Stonewalling</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Evitação da Vulnerabilidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O conflito exige expressão emocional. Para alguém que teme a própria vulnerabilidade, o silêncio é a armadura mais fácil. Ao calar-se, ele evita ter de admitir erros, sentimentos ou responsabilidades.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Controle da Narrativa</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quem não fala não pode ser responsabilizado. O silêncio é a forma mais eficiente de escapar de qualquer conversa difícil enquanto ainda mantém o controle emocional do ambiente.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Recompensa Condicionada</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Se no passado o silêncio fez você ceder, pedir desculpas ou se dobrar, ele aprendeu que essa é a ferramenta que funciona. O comportamento é reforçado toda vez que produz o resultado desejado.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O silêncio é um ato de covardia disfarçado de força. Reconhecer isso é a primeira vitória.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 3,
                titulo: 'A Armadilha da Ansiedade',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Protegendo Seu Sistema Nervoso</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O stonewalling produz uma resposta fisiológica real: o sistema nervoso entra em estado de alerta, o cortisol sobe e a mente entra em loop tentando resolver o que o outro se recusa a discutir. Proteger-se biologicamente é tão importante quanto proteger-se emocionalmente.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Protocolo de Proteção Durante o Isolamento</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Regra das 24 Horas</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Permita-se uma única tentativa de diálogo por dia durante o período de silêncio. Após isso, redirecione sua energia. Múltiplas tentativas aumentam sua ansiedade e o prazer dele.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Ancoramento no Corpo</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Caminhe, beba água, respire fundo. O sistema nervoso não distingue entre ameaça real e silêncio emocional &#8212; processar fisicamente o estresse interrompe o loop mental.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Diário do Fato</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva o que aconteceu, o que você sente e o que você sabe ser verdade. Externalizar o loop mental para o papel libera o córtex pré-frontal do ciclo de ruminação.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Investimento Soberano</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Use o período de silêncio dele para algo que nutre você: um livro, uma aula, um encontro com amigas. Isso transforma o tempo de abandono em tempo de crescimento.</p></div></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Quem protege a própria paz durante a tempestade é a governante, não a vítima.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 4,
                titulo: 'O Contra-Silêncio',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Indiferença Soberana vs. Punição</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Existe uma diferença crucial entre a indiferença soberana e devolver o tratamento de silêncio como punição. A primeira é um ato de autorrespeito; a segunda é entrar no mesmo jogo &#8212; e abdicando do seu próprio padrão de comunicação.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">A Linha Que Separa os Dois</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid #dc2626;"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Silêncio Punitivo (não é o seu caminho)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Motivado pela intenção de machucar, de fazer ele sentir o que você sentiu. Perpetua o ciclo de manipulação mútua e rebaixa seu padrão de relacionamento.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-top:3px solid var(--gold);"><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 8px;">Indiferença Soberana (o seu caminho)</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Motivada pela decisão de não desperdiçar energia em quem não está disponível. Você não se cala para punir &#8212; você simplesmente redireciona sua atenção para o que merece ela.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A Frase da Soberana</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Estou disponível para uma conversa quando você estiver pronto para dialogar com respeito. Até lá, vou continuar com a minha vida.&#8221; &#8212; e de fato continuar. Sem esperar, sem verificar.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A Rainha não grita para ser ouvida. Ela simplesmente para de justificar sua presença a quem não merece.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 5,
                titulo: 'Fronteiras Verbais',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Regras de Diálogo Que Não Admitem Abandono</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Estabelecer fronteiras verbais claras define como o diálogo vai funcionar no seu relacionamento &#8212; sem aceitar o abandono emocional como opção válida.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">As Quatro Fronteiras do Diálogo Soberano</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Fronteira do Tempo Mínimo</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Se você precisar de espaço, diga-me por quanto tempo. Silêncio indefinido não é aceito aqui.&#8221;</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Fronteira da Dignidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Posso discutir com respeito. Não posso aceitar ser ignorada. Se não há diálogo, cada um decide o que fazer com isso.&#8221;</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Fronteira da Não Normalização</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Após cada episódio, nomeie o que aconteceu: &#8220;O que aconteceu nesses dias não foi saudável. Preciso saber que isso não vai se repetir.&#8221;</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Fronteira da Saída Digna</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Se o stonewalling se repete após o decreto, a saída digna é optar por um ambiente onde sua voz é honrada &#8212; mesmo que esse ambiente seja a própria solitude.</p></div></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Decreto da Paz Interior</h3></div>
                            <div style="display:flex;flex-direction:column;gap:14px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sente-se em silêncio. Respire fundo três vezes &#8212; este silêncio é seu.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;O silêncio dele não dita a minha paz. Eu sou minha própria resposta.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva a fronteira de diálogo que você detém a partir de hoje.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;A minha voz é um tesouro. Compartilho apenas com quem sabe honorá-la.&#8221;</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">A Paz É Sua</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O silêncio dele não deve ditar a sua paz. O seu governo é inabalável, mesmo diante da mudez mais profunda.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;A sua paz é um território sagrado que nenhuma barreira de gelo tem o poder de congelar.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            }
        ],
        get conteudo() { return this.paginas[0].conteudo; },
        categoria: 'Manipulação',
        gratis: true
    }
,

    {
        id: 'hoovering',
        titulo: 'Hoovering',
        descricao: 'O aspirador emocional e a armadilha do resgate. Cinco capítulos para reconhecer o retorno manipulador, desativar as iscas de empatia e manter seu reino inviolável.',
        paginas: [
            {
                num: 1,
                titulo: 'O Chamado das Sombras',
                gratis: true,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Retorno que Não É Retorno</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O <em>hoovering</em> é a manobra de resgate executada pelo manipulador no momento em que ele sente que perdeu o controle sobre você ou que você finalmente decidiu seguir em frente. O nome deriva da marca de aspiradores de pó, pois o objetivo é exatamente esse: &#8220;sugar&#8221; você de volta para dentro da dinâmica de abuso.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Esta tática se manifesta através de contatos inesperados, declarações dramáticas de mudança ou crises repentinas de saúde e tristeza que visam ativar a sua empatia. O manipulador não volta porque mudou, ele volta porque não suporta a ideia de que o suprimento de atenção e controle que você fornecia foi interrompido.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Assim que você é sugada de volta e as coisas se estabilizam, o ciclo de desvalorização recomeça exatamente de onde parou.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Infiltração pela Nostalgia</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">A infiltração ocorre através da nostalgia e da esperança. A mensagem &#8220;lembrei de você ao ouvir essa música&#8221; ou o pedido de desculpas tardio que você esperou por meses. É como se uma ferida quase fechada fosse reaberta com um toque macio.</p>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A isca do <em>closure</em></p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ele utiliza o seu desejo de encerramento para manter a porta aberta. Ao demonstrar uma vulnerabilidade súbita, faz com que você se sinta responsável pelo bem-estar dele, invertendo os papéis: o agressor se torna uma vítima que precisa do seu &#8220;amor salvador&#8221;.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A verdade da mudança</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A verdadeira mudança não acontece no desespero da perda, mas na consistência do tempo. O hoovering é um espetáculo de curta duração; assim que você retorna, o show acaba e o ciclo reinicia.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Sinais Clássicos dos Hoovering</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Mensagens sentimentais enviadas exatamente quando você está se sentindo bem e seguindo em frente.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Crises de saúde, depressão ou tragédias familiares que surgem no momento do seu distanciamento.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Promessas de mudança radical acompanhadas de gestos grandiosos &#8212; flores, viagens, declarações públicas.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Contato através de terceiros &#8212; amigos ou familiares que &#8220;sem querer&#8221; mencionam o quanto ele está sofrendo.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Portal do Passado Permanece Fechado</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">Retomar a soberania é ter a coragem de ser &#8220;cruel&#8221; com a própria esperança para proteger a sua paz futura. O seu reino não é uma oficina de consertos para homens que se recusam a crescer.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Não se resgata quem usa a própria dor como isca para te prender.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 2,
                titulo: 'A Falsa Redenção',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Por Que as Promessas de Mudança Não se Sustentam</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">A promessa de mudança após o retorno é o componente mais sedutor do hoovering &#8212; e o mais previsível. Entender a estrutura dessa promessa é desarmar a armadilha antes que ela se feche.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Ciclo da Redenção Falsa</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Lua de Mel do Retorno</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">As primeiras semanas são genuinamente diferentes. O esforço é real porque o medo de perdê-la ainda é vivo. Isso faz com que você acredite que a mudança é definitiva.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Estabilização do Controle</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Conforme você se sente segura novamente, o controle dele sobre o suprimento de atenção se restabelece. O esforço começa a diminuir gradualmente, quase de forma imperceptível.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Retorno do Padrão Original</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sem trabalho terapêutico real e consistente, os mecanismos de defesa e manipulação retornam. O ciclo de desvalorização reinicia, geralmente com mais intensidade.</p></div></div>
                            </div>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 14px;">A Pergunta que Desvela Tudo</h3>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 16px;">Antes de qualquer decisão, pergunte-se: <strong>&#8220;O que mudou concretamente &#8212; além das palavras?&#8221;</strong></p>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ele está em terapia há quanto tempo?</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quais comportamentos específicos já mudaram antes de você retornar?</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Pessoas próximas a ele notaram mudanças reais, independente de você?</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Mudança real é silenciosa e consistente. Promessa de mudança é barulhenta e temporária.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 3,
                titulo: 'Iscas de Empatia',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Identificando Emergências Falsas</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">A empatia é um dom. O hoovering a sequestra. Aprender a identificar quando a sua empatia está sendo usada como alavanca de controle não é cinismo &#8212; é discernimento soberano.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">As Cinco Iscas Mais Comuns</h3>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Crise de Saúde</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Doença repentina, acidente ou problema de saúde que aparece logo após o distanciamento. Ativa o instinto de cuidado e faz você se sentir culpada por se afastar nesse momento.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Tragédia Familiar</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Morte ou problema grave na família que o deixa &#8220;sem rede de apoio&#8221; e convenientemente precisando de você especificamente. Dificulta a recusa por parecer insensibível.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Ameaça Velada</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Insinuações sobre &#8220;não ver sentido em nada&#8221; ou &#8220;não saber o que vai fazer consigo mesmo&#8221;. Transfere a responsabilidade pela saúde mental dele para os seus ombros.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Favor Inofensivo</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">&#8220;Preciso só de um minuto para buscar um objeto&#8221; ou &#8220;é só uma pergunta rápida&#8221;. Parece pequeno, mas reabre o canal de contato que você fechou.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Conquista Espiritual</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">&#8220;Comecei a fazer terapia&#8221; / &#8220;Encontrei espiritualidade&#8221; / &#8220;O pastor me falou de você&#8221;. Usa linguagem de transformação que é difícil de questionar sem parecer cetíca.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Sua empatia é sagrada demais para ser sequestrada. Discernimento não é crueldade &#8212; é autopreservação.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 4,
                titulo: 'O Contato Zero Absoluto',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Tornando Seu Reino Invisível ao Aspirador</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O contato zero não é punição &#8212; é protocolo de proteção. Cada canal aberto é uma porta por onde o aspirador pode operar. Fechar todos eles é o ato mais soberano que existe.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Protocolo de Invisibilidade Total</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Bloqueio Digital Completo</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Telefone, WhatsApp, Instagram, Facebook, e-mail, LinkedIn &#8212; todos. Não deixar janelas abertas &#8220;só para ver&#8221;. Meio bloqueio é acesso parcial, que ele sabe explorar.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Fechamento do Canal de Terceiros</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Informe amigos e familiares que você não deseja receber mensagens, notícias ou atualizações sobre ele. Quem respeitar seus limites é alinhado. Quem não respeitar, é um canal a ser gerenciado.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Regra do Não-Monitoramento</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Não verificar o perfil dele mesmo &#8220;só para ver&#8221;. O monitoramento inverte a proteção: você abre uma janela emocional que o mantém presente na sua mente mesmo sem contato físico.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Script de Não-Resposta</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Se o contato chegar por um canal que você não pode bloquear (trabalho, condomínio, filhos), limite-se a respostas curtas, funcionais e sem abertura emocional. Sem explicações, sem julgamentos.</p></div></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;Invisibilidade não é fraqueza. É a forma mais elegante de dizer que o espetáculo encerrou.&rdquo;</strong></p></div>
                        </div>
                    </div>`
            },
            {
                num: 5,
                titulo: 'A Liberdade Definitiva',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div><div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Cortando os Fios Invisíveis</h3></div>
                        <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O contato zero externo é o primeiro passo. O segundo &#8212; e mais profundo &#8212; é o corte dos fios emocionais que ainda ligam a sua mente ao passado, mesmo sem contato físico.</p></div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Rituais de Libertação</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Inventário da Realidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva em duas colunas: &#8220;O que eu idealizei&#8221; e &#8220;O que foi real&#8221;. A nostalgia ama o ideal, não o real. Quando você confronta as duas colunas, o aspirador perde a eletricidade.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Arquivo Fechado</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Fotos, presentes, conversas salvas &#8212; coloque em lugar que exija esforço para acessar, ou descarte. O acesso fácil à memória é o combustivel do loop mental.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Construção do Novo</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">A melhor forma de ocupar o espaço mental que ele habitava é construír algo novo: um projeto, uma prática, uma conexão. Vazio é convidativo; construção é blindagem.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Decreto de Encerramento</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Escreva uma carta para ele &#8212; que você nunca envia. Diga tudo. Depois, queime-a, rasge-a ou apague-a. É o seu ritual de encerramento soberano, feito para você, não para ele.</p></div></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;"><span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span><h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Decreto da Liberdade</h3></div>
                            <div style="display:flex;flex-direction:column;gap:14px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sente-se. Respire fundo. Afirme: &#8220;O passado está encerrado. Ele não tem acesso ao meu futuro.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;A minha empatia pertence a quem a honra. Não sou oficial de resgate de quem me abandonou.&#8221;</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Liste três coisas que estão sendo construídas na sua vida neste momento.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Diga: &#8220;O meu reino não admite visitas de quem só sabe destruir.&#8221;</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">A Liberdade É Sua</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">A lucidez é o seu escudo mais forte. Use-a para enxergar através do drama e mantenha seus pés firmes no caminho da liberdade.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:16px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&ldquo;O trono que você conquistou não admite visitas de quem só sabe destruir o palácio.&rdquo;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            }
        ],
        get conteudo() { return this.paginas[0].conteudo; },
        categoria: 'Manipulação',
        gratis: true
    }
,

    {
        id: 'love-bombing',
        titulo: 'Love Bombing',
        descricao: 'O cerco emocional disfarçado de amor absoluto. Cinco capítulos para reconhecer o bombardeio de atenção calculada, desativar a dependência criada e retomar o comando do seu próprio ritmo.',
        paginas: [
            {
                num: 1,
                titulo: 'O Cerco da Atenção',
                gratis: true,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Amor que Não Pede Tempo</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O <em>love bombing</em> é uma das táticas de infiltração mais sofisticadas porque se disfarça daquilo que todas nós fomos ensinadas a desejar: o amor absoluto. É um cerco emocional executado através de uma inundação de atenção, elogios e promessas grandiosas — projetado para cegar sua percepção crítica antes mesmo de você saber o sobrenome dele.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Diferente de um romance saudável que floresce no tempo da natureza, o bombardeio emocional é um incêndio controlado. Não pela paixão — mas pelo calculista que precisa queimar suas defesas e criar uma dependência da presença dele antes que você tenha clareza suficiente para avaliá-lo.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Pense em um cavaleiro que não avança passo a passo pelo campo: ele salta. Atravessa as barreiras que o tempo deveria erguer e aparece no centro do seu mundo antes que você tenha sequer percebido o movimento. É exatamente assim que o love bomber opera.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Infiltração pelo Desejo</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 20px;">No início, a sensação é de que o destino finalmente sorriu. São mensagens de bom dia que parecem poesias, planos para viagens feitos na segunda semana e uma disponibilidade que beira o sobrenatural. Mas ele não está amando você — está espelhando a imagem da mulher que você quer ser, para que você se sinta numa dívida de gratidão impagável por ter sido &#8220;escolhida&#8221; por alguém tão perfeito.</p>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">O espelho calculado</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ele descobre o que você sempre quis ouvir — em uma conversa, num perfil, num olhar — e se transforma exatamente nisso. Não é coincidência ele gostar das mesmas músicas, sonhar com as mesmas viagens e sentir as mesmas dores. É estratégia.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:20px 22px;border-left:4px solid var(--gold);"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 8px;">A dívida impagável</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando alguém oferece atenção em abundância, o cérebro registra uma dívida emocional automática. Questionar o afeto parece ingratidão. Essa culpa é o primeiro fio da armadilha.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">III</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Os Sinais do Cerco no Início</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Declarações de amor intensas nas primeiras duas semanas de conversa.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Planos de futuro grandiosos (casamento, filhos, viagens) feitos antes dos três meses.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Disponibilidade irreal: responde instantaneamente, nunca tem outros compromissos, vive para você.</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:12px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Pressão sutil para exclusividade antes do tempo natural de conhecimento mútuo.</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">O Abismo que Não Parecia Abismo</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">A vertigem do love bombing é que ele se sente exatamente como o amor dos sonhos. Não existe alarme. Existe a sensação de ter chegado em casa. E é exatamente essa sensação que a soberana precisa aprender a questionar: amor real não tem pressa de te trancar.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&#8220;A pressa dele é, quase sempre, a urgência de te trancar em um castelo antes que você perceba as rachaduras nas paredes.&#8221;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 2,
                titulo: 'A Arquitetura da Dependência',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">A Química da Captura</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O love bombing não é apenas um comportamento — é uma engenharia emocional. Cada mensagem de madrugada, cada elogio preciso, cada gesto grandioso libera dopamina e oxitocina no seu cérebro com uma intensidade que o cortejo natural nunca produziria em tão pouco tempo.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">O resultado é uma dependência química real: a presença dele se torna necessária para o seu equilíbrio emocional antes mesmo de você tê-lo avaliado como parceiro. Você já está viciada antes de saber quem ele é de verdade.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Os Três Estágios do Vício Emocional</h3>
                            <div style="display:flex;flex-direction:column;gap:18px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Inundação</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Atenção em excesso, todos os dias, em todos os canais. O volume é tão alto que apaga qualquer voz interna que poderia questionar a velocidade do que está acontecendo.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Calibração</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Quando você já está acostumada ao volume alto, ele começa a variar a intensidade: momentos de frio e calor que criam ansiedade e fazem você trabalhar para recuperar a atenção que antes era gratuita.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Consolidação</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Você já reorganizou sua rotina, seus planos e sua identidade em torno dele. O custo de sair agora parece insuportável. Esse custo foi calculado e construído por ele, tijolo a tijolo.</p></div></div>
                            </div>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 14px;">O Diálogo que Você Reconhece</h3>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 16px;">Lembra quando ele disse: <strong>&#8220;Nunca senti isso por ninguém. Você é diferente de todas as outras&#8221;</strong> — na terceira semana? Esse é o texto. Não é poesia espontânea. É um roteiro.</p>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><em>&#8220;Eu sei que é cedo, mas eu quero construir algo sério com você.&#8221;</em></p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><em>&#8220;Minha família vai te adorar. Já falei de você para todo mundo.&#8221;</em></p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;"><em>&#8220;Eu nunca fui assim com ninguém. Você é especial demais.&#8221;</em></p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&#8220;Você não escolheu o vício. Ele foi instalado. Reconhecer a arquitetura é o primeiro ato de libertação.&#8221;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 3,
                titulo: 'O Preço Oculto do Banquete',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">Quando a Asa Vira Âncora</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Esse banquete de afeto tem um preço invisível que começa a ser cobrado assim que a primeira sombra de dúvida surge. Quando o bombardeio atinge seu objetivo e você está emocionalmente rendida, a intensidade que era um presente vira uma ferramenta de controle.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Se você precisa de espaço, ele se sente <em>rejeitado</em>. Se você sai com amigas, ele se sente <em>negligenciado</em>. O amor, que antes era uma asa, torna-se uma âncora. E o mais perturbador: a transição acontece tão gradualmente que você mal percebe o exato momento em que o porto virou prisão.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">A Inversão do Controle</h3>
                            <div style="display:flex;flex-direction:column;gap:16px;">
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Antes: ele dava atenção livremente</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Depois: a atenção se torna recompensa condicionada ao seu comportamento. Você aprende, sem perceber, a não incomodá-lo para não perder o calor.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Antes: ele respeitava sua agenda</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Depois: qualquer compromisso seu é lido como preferência pelos outros. A culpa que ele instala é sutil, mas constante.</p></div>
                                <div style="background:#fff;border-radius:12px;padding:18px 20px;border-left:4px solid #dc2626;"><p style="font-size:15px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Antes: seus limites eram &#8220;respeitosos&#8221;</p><p style="font-size:14px;color:#374151;line-height:1.8;margin:0;">Depois: qualquer limite é reframed como &#8220;você não confia em mim&#8221; ou &#8220;se me amasse, não precisaria disso&#8221;.</p></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Objetivo era o Castelo, Não o Amor</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">O objetivo do love bomber nunca foi te amar. Foi te convencer de que ele é insubstituível antes que você pudesse ver quem ele realmente é. Uma vez dentro do castelo emocional que ele construiu ao redor de você, as paredes que pareciam proteção revelam sua função real: contenção.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">A soberana precisa fazer uma pergunta fría e honesta: <strong>&#8220;Ele me amava, ou amava o controle que exercia sobre mim?&#8221;</strong> A resposta muda tudo.</p>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&#8220;O amor que precisa te isolar para sobreviver não é amor. É cercamento.&#8221;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 4,
                titulo: 'O Avanço Diagonal',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Avanço Sempre na Mesma Direção</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">Há um tipo de figura que nunca muda de caminho: avança sempre em diagonal, sempre na mesma direção, com a certeza de quem sabe exatamente onde quer chegar. O bispo de um rei não hesita — ele avança. O love bomber também.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Cada mensagem, cada gesto, cada declaração segue a mesma trajetória: aproximar, envolver, consolidar. O que parece espontaneidade é uma rota. O que parece paixão é uma estratégia. E a dinâmica só muda de nome — nunca de natureza.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">Como o Movimento Evolui</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Atenção Vira Vigilância</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O que era &#8220;saudade&#8221; se torna necessidade de saber onde você está, com quem e por quê. A frequência das mensagens não diminui — muda de tom.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">O Cuidado Vira Posse</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">&#8220;Fiz tudo por você&#8221; passa a ser usado como argumento de dívida. O histórico de gestos que ele construiu agora é uma fatura a ser paga com obediência.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">A Exclusividade Vira Isolamento</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O que era &#8220;eu quero só você&#8221; se transforma em redução progressiva de suas redes de apoio. Suas amigas são &#8220;influências ruins&#8221;. Sua família &#8220;não entende&#8221;. Até você precisar só dele.</p></div></div>
                            </div>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 14px;">A Pergunta que Desarma</h3>
                            <p style="font-size:15px;color:#374151;line-height:1.8;margin:0 0 16px;">Antes de qualquer decisão, pergunte: <strong>&#8220;O que mudou nele — além da intensidade?&#8221;</strong></p>
                            <div style="display:flex;flex-direction:column;gap:12px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Ele respeita o seu &#8220;não&#8221; sem drama?</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Você se sente mais ela mesma ou mais dependente após cada encontro?</p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;min-width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:11px;">?</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Suas amigas e família estão mais perto ou mais distantes desde que ele chegou?</p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&#8220;Quem te ama quer que você floresça. Quem te possui quer que você murche até caber no vaso que ele escolheu.&#8221;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            },
            {
                num: 5,
                titulo: 'O Tempo É Seu Cetro',
                gratis: false,
                conteudo: `
                    <div style="display:flex;flex-direction:column;gap:32px;">
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:18px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">I</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Tempo É Seu Cetro</h3>
                            </div>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0 0 16px;">A verdadeira soberania reside no domínio do próprio tempo. Uma Rainha não se deixa levar pela correnteza de um afeto que não foi testado pelo caráter e pela consistência. Identificar o love bombing exige a coragem de desacelerar o que ele quer acelerar.</p>
                            <p style="font-size:16px;color:#374151;line-height:1.85;margin:0;">Quando você dita o ritmo, você reassume o comando do seu reino emocional. O amor real sobrevive à paciência. A manipulação, não. Proteger suas fronteiras contra o excesso é tão vital quanto protegê-las contra a escâssez.</p>
                        </div>
                        <div style="background:#ffffff;border-radius:16px;padding:28px;">
                            <h3 style="font-size:18px;font-weight:900;color:#2a1a06;margin:0 0 18px;">O Protocolo da Soberana</h3>
                            <div style="display:flex;flex-direction:column;gap:20px;">
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Imponha seu próprio ritmo deliberadamente</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Se ele quer ver você todo dia na primeira semana, aceite um encontro por semana. Observe a reação. A raiva, a manipulação ou a pressão que vem depois da sua desaceleração é o seu raio-X emocional mais honesto.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Mantenha sua vida intacta</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Suas amigas, seus compromissos, seus projetos existiam antes dele e devem continuar existindo. Qualquer relação que exija que você se esvaúie para caber dentro dela não é relação — é absorción.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Teste o caráter, não o sentimento</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Sentimento é fácil de fabricar. Caráter é revelado sob pressão, no desacordo, no tempo. Observe como ele trata quem não pode lhe dar nada. Esse é o homem real.</p></div></div>
                                <div style="display:flex;gap:16px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><div><p style="font-size:16px;font-weight:800;color:#2a1a06;margin:0 0 6px;">Não confunda intensidade com profundidade</p><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">O oceano é profundo e silencioso. O love bombing é uma tempestade que faz muito barulho e passa. Profundidade se constrói devagar; intensidade excessiva no início é quase sempre um sinal de aviso.</p></div></div>
                            </div>
                        </div>
                        <div>
                            <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
                                <span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);font-size:11px;font-weight:800;letter-spacing:.8px;text-transform:uppercase;padding:3px 14px;border-radius:99px;">II</span>
                                <h3 style="font-size:21px;font-weight:900;color:#2a1a06;margin:0;">O Decreto da Rainha</h3>
                            </div>
                            <div style="display:flex;flex-direction:column;gap:14px;">
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">1</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Afirme: <em>&#8220;Quem me ama respeita meu ritmo. Quem pressiona revela sua agenda.&#8221;</em></p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">2</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Lembre-se: <em>&#8220;A minha atenção é o bem mais valioso do meu reino. Não se vende por intensidade.&#8221;</em></p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">3</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Pergunte sempre: <em>&#8220;Depois de estar com ele, eu me sinto maior ou menor?&#8221;</em></p></div>
                                <div style="display:flex;gap:14px;align-items:flex-start;"><div style="background:var(--gold);color:#fff;font-size:13px;font-weight:900;min-width:28px;height:28px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">4</div><p style="font-size:15px;color:#374151;line-height:1.8;margin:0;">Decrete: <em>&#8220;Meu trono só é ocupado por quem respeita a liturgia do tempo e a integridade da minha paz.&#8221;</em></p></div>
                            </div>
                        </div>
                        <div style="background:linear-gradient(135deg,#2a1a06 0%,#5a3a10 100%);border-radius:16px;padding:32px;">
                            <h3 style="font-size:21px;font-weight:900;color:#fff;margin:0 0 16px;">A Soberania do Seu Tempo</h3>
                            <p style="font-size:16px;color:#e8d4a8;line-height:1.9;margin:0 0 16px;">O trono que você protege não se conquista com inundação. Conquista-se com consistência. Qualquer um que tente tomar seu castelo pela velocidade e pelo excesso já revelou que não merece as chaves.</p>
                            <div style="background:rgba(255,255,255,0.08);border-radius:12px;padding:20px 24px;border-left:4px solid #C5A059;"><p style="font-size:15px;color:#fff;font-style:italic;line-height:1.85;margin:0;"><strong style="color:#e8c97a;">&#8220;Amor real sobrevive à paciência. Manipulação, não. Você não precisa de fogo — precisa de luz.&#8221;</strong><br><span style="font-size:13px;color:#c4a87a;margin-top:8px;display:block;">Portal Rainha</span></p></div>
                        </div>
                    </div>`
            }
        ],
        get conteudo() { return this.paginas[0].conteudo; },
        categoria: 'Manipulação',
        gratis: true
    }
];

/* -- Sidebar: marca o link ativo ------------------------------------------ */
function setActiveLink(activeId) {
    document.querySelectorAll('.sidebar-link').forEach(el => el.classList.remove('sidebar-link--active'));
    const target = document.getElementById(activeId);
    if (target) target.classList.add('sidebar-link--active');
}

/* -- Toggle de expansão dos cards de Guia ---------------------------------- */
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

/* -- Guias — renderização com paywall ----------------------------------------- */

/* Função genérica de troca de capítulo – suporta todos os guias livro */
function switchBookChapter(guiaId, num) {
    document.querySelectorAll('.' + guiaId + '-chapter').forEach(function (el) { el.style.display = 'none'; });
    document.querySelectorAll('.' + guiaId + '-tab-btn').forEach(function (el) {
        el.style.background = 'transparent';
        el.style.color = 'var(--gold-dark)';
    });
    var cont = document.getElementById(guiaId + '-content-' + num);
    var tab  = document.getElementById(guiaId + '-tab-' + num);
    if (cont) cont.style.display = 'block';
    if (tab)  { tab.style.background = 'var(--gold)'; tab.style.color = '#fff'; }
}
window.switchBookChapter = switchBookChapter;
GUIAS_DATA.forEach(function (g) {
    if (g.paginas && g.paginas.length) {
        window['switchBookChapter_' + g.id] = function (num) { switchBookChapter(g.id, num); };
    }
});

function renderGuias() {
    setActiveLink('sidebar-link-guias');
    var viewer = document.getElementById('content-viewer');
    var isSubscriber = window.SeniorAuth && window.SeniorAuth.isSubscriber();
    var ids = GUIAS_DATA.map(function (g) { return g.id; });

    var cardsHTML = GUIAS_DATA.map(function (g, idx) {

        /* -- Guias com formato livro (capítulos) --- */
        if (g.paginas && g.paginas.length) {
            var total = g.paginas.length;
            var pfx = g.id;                                  /* prefixo dinâmico por id */
            var switchFn = 'switchBookChapter_' + g.id;
            var chapterClass = pfx + '-chapter';
            var tabClass = pfx + '-tab-btn';

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
                    + ' onmouseover="this.style.background=\'#ffffff\'"'
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
                    + 'margin-top:36px;padding-top:24px;border-top:2px solid #dbdbdb;gap:12px;">'
                    + navPrev + navNext + '</div>';

                /* Cabeçalho do capítulo */
                var statusBadge = free
                    ? '<span style="background:#d1fae5;color:#065f46;font-size:11px;font-weight:800;padding:3px 12px;border-radius:99px;">Acesso Livre</span>'
                    : '<span style="background:#1f2937;color:#e8c97a;font-size:11px;font-weight:800;padding:3px 12px;border-radius:99px;">&#128274; Bloqueado</span>';
                var chapHeader = '<div style="margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #dbdbdb;display:flex;align-items:center;gap:12px;">'
                    + '<span style="background:#ffffff;border:1.5px solid var(--gold);color:var(--gold-dark);'
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
                        + '&#128081; Garantir meu Lugar Único</a>'
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
                + '<div style="padding:16px 20px 12px;border-bottom:1px solid #dbdbdb;background:#fafaf8;">'
                + '<p style="font-size:11px;font-weight:800;color:#9ca3af;text-transform:uppercase;letter-spacing:.6px;margin:0 0 10px;">Capítulos</p>'
                + '<div style="display:flex;flex-wrap:wrap;gap:8px;">' + tabs + '</div>'
                + '</div>'
                /* Chapter content area */
                + '<div style="padding:28px;">' + chapters + '</div>'
                + '</div></div>';
        }

        /* -- Guias simples (formato padrão) -- */
        var isFree = g.gratis || isSubscriber;
        var guiaBadge = '<span class="guia-badge">Guia</span>';
        var prevId = idx > 0 ? ids[idx - 1] : null;
        var nextId = idx < ids.length - 1 ? ids[idx + 1] : null;
        var navButtons = '<div style="display:flex;justify-content:space-between;align-items:center;'
            + 'margin-top:28px;padding-top:20px;border-top:1px solid #dbdbdb;gap:12px;">'
            + (prevId ? '<button onclick="toggleGuia(\'' + g.id + '\');toggleGuia(\'' + prevId + '\');"'
                + ' style="display:flex;align-items:center;gap:6px;background:#fff;'
                + 'border:1.5px solid var(--gold);color:var(--gold-dark);font-size:13px;font-weight:700;'
                + 'padding:10px 18px;border-radius:8px;cursor:pointer;"'
                + ' onmouseover="this.style.background=\'#ffffff\'"'
                + ' onmouseout="this.style.background=\'#fff\'">'
                + '<i class="ph ph-arrow-left" style="font-size:15px;"></i> Guia anterior</button>' : '<span></span>')
            + (nextId ? '<button onclick="toggleGuia(\'' + g.id + '\');toggleGuia(\'' + nextId + '\');"'
                + ' style="display:flex;align-items:center;gap:6px;background:#fff;'
                + 'border:1.5px solid var(--gold);color:var(--gold-dark);font-size:13px;font-weight:700;'
                + 'padding:10px 18px;border-radius:8px;cursor:pointer;transition:background .2s;"'
                + ' onmouseover="this.style.background=\'#ffffff\'"'
                + ' onmouseout="this.style.background=\'#fff\'">'
                + 'Próximo guia <i class="ph ph-arrow-right" style="font-size:15px;"></i></button>' : '<span></span>')
            + '</div>';
        var toggleBtn = '<button id="guia-btn-' + g.id + '"'
            + ' onclick="toggleGuia(\'' + g.id + '\')"'
            + ' style="align-self:flex-start;display:inline-flex;align-items:center;gap:6px;background:#fff;'
            + 'border:1.5px solid var(--gold);color:var(--gold-dark);font-size:13px;font-weight:700;'
            + 'padding:9px 18px;border-radius:8px;cursor:pointer;margin-top:8px;transition:background .2s;"'
            + ' onmouseover="this.style.background=\'#ffffff\'"'
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
        + '<span style="display:inline-block;background:#ffffff;color:var(--sage-green);font-size:12px;'
        + 'font-weight:700;text-transform:uppercase;letter-spacing:.6px;padding:4px 14px;border-radius:20px;margin-bottom:14px;">Biblioteca de Guias</span>'
        + '<h1 style="font-size:28px;font-weight:900;color:#2a1a06;margin:0 0 8px;">Guias Práticos para a Evolução</h1>'
        + '<p style="font-size:15px;color:var(--text-muted);margin:0;">'
        + (isSubscriber ? 'Acesso completo &#8212; todos os guias estão liberados para você.' : 'Assine o Círculo Rainha para desbloquear os guias')
        + '</p></div>'
        + '<div class="guias-grid">' + cardsHTML + '</div>';
    swapContent(viewer, wrapper);
}


/* -- handleNewsClick (fallback para cards estáticos do feed) -------------- */
function handleNewsClick(id) {
    // Cards estáticos do feed não têm ação específica — vai para o início
    loadNewsFeed();
}

/* -- Global exports (required for inline onclick attributes in HTML) ------- */

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
