/* ══════════════════════════════════════════════════════════════════════════════
   SeniorHub — Barra de Pesquisa com Live Search / Autocomplete
   Arquivo: search.js  |  Versão: 1.0
   ══════════════════════════════════════════════════════════════════════════════ */

(function () {
    'use strict';

    /* ── 1. Índice de Conteúdo ─────────────────────────────────────────────── */
    // Categorias fixas do portal
    const CATEGORIAS_FIXAS = [
        {
            label: 'Início',
            keywords: ['início', 'home', 'principal', 'começo', 'pagina inicial'],
            icon: '🏠',
            tipo: 'secao',
            action: () => window.loadNewsFeed()
        },
        {
            label: 'Receitas',
            keywords: ['receitas', 'cozinha', 'comida', 'alimentos', 'culinaria', 'prato', 'livros'],
            icon: '🍎',
            tipo: 'secao',
            action: () => window.loadRecipesFeed()
        },
        {
            label: 'Exercícios em Casa',
            keywords: ['exercicios', 'exercício', 'academia', 'fitness', 'treino', 'atividade fisica', 'musculacao', 'alongamento', 'caminhada'],
            icon: '🏋️',
            tipo: 'secao',
            action: () => window.renderExercicios()
        },
        {
            label: 'Guia de Viagens',
            keywords: ['viagens', 'viagem', 'turismo', 'destinos', 'hotel', 'voo', 'cruzeiro', 'gramado', 'portugal', 'nordeste', 'resort'],
            icon: '✈️',
            tipo: 'secao',
            action: () => window.renderViagens()
        },
        {
            label: 'Conforto do Lar',
            keywords: ['conforto', 'lar', 'casa', 'produtos', 'loja', 'moveis', 'decoracao', 'cama', 'travesseiro', 'poltrona'],
            icon: '🛋️',
            tipo: 'secao',
            action: () => window.renderLojaConforto()
        },
        {
            label: 'Clube SeniorHub',
            keywords: ['clube', 'beneficios', 'desconto', 'membro', 'assinatura', 'senior hub'],
            icon: '🏷️',
            tipo: 'secao',
            action: () => window.toggleModal()
        },
    ];

    // Livros de receitas fixos (carregados de window.BOOKS após DOM ready)
    function getLivrosIndex() {
        if (!window.BOOKS) return [];
        return Object.entries(window.BOOKS).map(([num, book]) => ({
            label: `Livro ${num}: ${book.title}`,
            keywords: normalizarTexto(book.title).split(' '),
            icon: '📖',
            tipo: 'livro',
            bookNum: parseInt(num),
            action: () => window.handleBookClick(parseInt(num))
        }));
    }

    // Receitas individuais de todos os livros disponíveis
    function getReceitasIndex() {
        const resultados = [];
        const fontes = [];

        // Receitas da biblioteca (livro 1 e outros)
        if (window.biblioteca) {
            for (const [key, arr] of Object.entries(window.biblioteca)) {
                if (Array.isArray(arr)) {
                    // Descobre o bookNum pela chave
                    let bookNum = null;
                    if (window.BOOKS) {
                        for (const [num, b] of Object.entries(window.BOOKS)) {
                            if (b.key === key) { bookNum = parseInt(num); break; }
                        }
                    }
                    fontes.push({ arr, bookNum, key });
                }
            }
        }

        for (const fonte of fontes) {
            if (!Array.isArray(fonte.arr)) continue;
            for (const receita of fonte.arr) {
                if (!receita || !receita.title) continue;
                resultados.push({
                    label: receita.title,
                    sublabel: fonte.bookNum ? `Livro ${fonte.bookNum}` : '',
                    keywords: normalizarTexto(receita.title).split(' '),
                    icon: '🍽️',
                    tipo: 'receita',
                    id: receita.id,
                    bookNum: fonte.bookNum,
                    bookKey: fonte.key || (window.BOOKS && window.BOOKS[fonte.bookNum] ? window.BOOKS[fonte.bookNum].key : null),
                    action: function () {
                        // Garante que o livro correto está ativo antes de abrir a receita
                        const key = this.bookKey || (window.BOOKS && window.BOOKS[this.bookNum] ? window.BOOKS[this.bookNum].key : null);
                        if (key) {
                            window.livroAtual = key; // Expõe o estado para app.js
                            // Usa handleBookClick para setar livroAtual corretamente internamente
                            // e depois navega para a receita específica
                            if (window.handleBookClick) {
                                // Seta internamente o livroAtual via handleBookClick
                                // mas depois abre a receita específica
                                // Precisamos acessar o estado interno de app.js
                                // Usamos o padrão já existente:
                                window.handleBookClick(this.bookNum);
                                // handleBookClick abre a primeira receita; precisamos navegar para a correta
                                setTimeout(() => {
                                    if (window.handleRecipeClick) window.handleRecipeClick(this.id);
                                }, 50);
                            }
                        }
                    }
                });
            }
        }
        return resultados;
    }

    /* ── 2. Utilitários ────────────────────────────────────────────────────── */
    function normalizarTexto(str) {
        return (str || '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // remove acentos
            .replace(/[^a-z0-9\s]/g, ' ')
            .trim();
    }

    function destacar(texto, query) {
        if (!query) return texto;
        const queryNorm = normalizarTexto(query);
        const partes = queryNorm.split(/\s+/).filter(Boolean);
        let resultado = texto;
        partes.forEach(parte => {
            if (parte.length < 2) return;
            const regex = new RegExp(`(${parte.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
            resultado = resultado.replace(regex, '<mark>$1</mark>');
        });
        return resultado;
    }

    /* ── 3. Motor de Busca ─────────────────────────────────────────────────── */
    function buscar(query) {
        if (!query || query.trim().length < 2) return [];

        const queryNorm = normalizarTexto(query);
        const termos = queryNorm.split(/\s+/).filter(t => t.length >= 2);
        if (termos.length === 0) return [];

        // Monta índice completo na hora da busca (sempre fresco)
        const indice = [
            ...CATEGORIAS_FIXAS,
            ...getLivrosIndex(),
            ...getReceitasIndex(),
        ];

        const scored = indice.map(item => {
            const labelNorm = normalizarTexto(item.label);
            let score = 0;

            termos.forEach(termo => {
                // Começa com o termo (maior relevância)
                if (labelNorm.startsWith(termo)) score += 10;
                // Contém o termo no início de uma palavra
                else if (new RegExp(`\\b${termo}`).test(labelNorm)) score += 6;
                // Contém o termo em qualquer lugar
                else if (labelNorm.includes(termo)) score += 3;
                // Verifica nas keywords
                (item.keywords || []).forEach(kw => {
                    const kwNorm = normalizarTexto(kw);
                    if (kwNorm === termo) score += 4;
                    else if (kwNorm.startsWith(termo)) score += 2;
                    else if (kwNorm.includes(termo)) score += 1;
                });
            });

            return { item, score };
        });

        return scored
            .filter(s => s.score >= 3)
            .sort((a, b) => {
                // Prioridade: secoes > livros > receitas, depois por score
                const tipoOrder = { secao: 0, livro: 1, receita: 2 };
                const tA = tipoOrder[a.item.tipo] ?? 3;
                const tB = tipoOrder[b.item.tipo] ?? 3;
                if (tA !== tB) return tA - tB;
                return b.score - a.score;
            })
            .slice(0, 10)
            .map(s => s.item);
    }

    /* ── 4. Dropdown UI ────────────────────────────────────────────────────── */
    let dropdownEl = null;
    let inputEl = null;
    let indiceSelecionado = -1;
    let resultadosAtuais = [];

    function criarDropdown() {
        const dd = document.createElement('div');
        dd.id = 'search-dropdown';
        dd.setAttribute('role', 'listbox');
        dd.setAttribute('aria-label', 'Sugestões de pesquisa');
        return dd;
    }

    function renderizarDropdown(resultados, query) {
        if (!dropdownEl) return;
        indiceSelecionado = -1;
        resultadosAtuais = resultados;

        if (resultados.length === 0) {
            fecharDropdown();
            return;
        }

        dropdownEl.innerHTML = '';

        resultados.forEach((item, i) => {
            const li = document.createElement('div');
            li.className = 'search-dropdown-item';
            li.setAttribute('role', 'option');
            li.setAttribute('data-index', i);

            const labelDestacado = destacar(item.label, query);
            const sublabelHtml = item.sublabel
                ? `<span class="search-item-sub">${item.sublabel}</span>`
                : '';
            const tipoLabel = { secao: 'Seção', livro: 'Livro', receita: 'Receita' }[item.tipo] || '';

            li.innerHTML = `
                <span class="search-item-content">
                    <span class="search-item-label">${labelDestacado}</span>
                    ${sublabelHtml}
                </span>
                <span class="search-item-tipo">${tipoLabel}</span>
            `;

            li.addEventListener('mouseenter', () => {
                setAtivo(i);
            });
            li.addEventListener('mouseleave', () => {
                removerAtivo();
            });
            li.addEventListener('mousedown', (e) => {
                e.preventDefault(); // Evita que o input perca o foco antes do click
                executarAcao(item);
            });

            dropdownEl.appendChild(li);
        });

        abrirDropdown();
    }

    function setAtivo(idx) {
        removerAtivo();
        indiceSelecionado = idx;
        const itens = dropdownEl.querySelectorAll('.search-dropdown-item');
        if (itens[idx]) itens[idx].classList.add('search-dropdown-item--ativo');
    }

    function removerAtivo() {
        indiceSelecionado = -1;
        dropdownEl.querySelectorAll('.search-dropdown-item--ativo').forEach(el => {
            el.classList.remove('search-dropdown-item--ativo');
        });
    }

    function abrirDropdown() {
        if (dropdownEl && !dropdownEl.classList.contains('search-dropdown--visivel')) {
            dropdownEl.classList.add('search-dropdown--visivel');
        }
    }

    function fecharDropdown() {
        if (dropdownEl) {
            dropdownEl.classList.remove('search-dropdown--visivel');
            dropdownEl.innerHTML = '';
        }
        indiceSelecionado = -1;
        resultadosAtuais = [];
    }

    function executarAcao(item) {
        if (!item || typeof item.action !== 'function') return;
        fecharDropdown();
        if (inputEl) {
            inputEl.value = '';
            inputEl.blur();
        }
        item.action();
        // Scroll suave ao topo do conteúdo principal
        const viewer = document.getElementById('content-viewer');
        if (viewer) {
            setTimeout(() => {
                window.scrollTo({ top: Math.max(0, viewer.offsetTop - 80), behavior: 'smooth' });
            }, 80);
        }
    }

    /* ── 5. Event Listeners ────────────────────────────────────────────────── */
    function posicionarDropdown() {
        if (!inputEl || !dropdownEl) return;
        const rect = inputEl.getBoundingClientRect();
        dropdownEl.style.left = rect.left + 'px';
        dropdownEl.style.width = rect.width + 'px';
    }

    function inicializarBusca() {
        inputEl = document.querySelector('.search-bar');
        if (!inputEl) return;

        // Adiciona dropdown direto no body para evitar overflow do header
        dropdownEl = criarDropdown();
        document.body.appendChild(dropdownEl);
        posicionarDropdown();

        // Reposiciona ao redimensionar
        window.addEventListener('resize', posicionarDropdown);

        // Input: live search
        let debounceTimer = null;
        inputEl.addEventListener('input', () => {
            clearTimeout(debounceTimer);
            const query = inputEl.value.trim();
            if (query.length < 2) {
                fecharDropdown();
                return;
            }
            debounceTimer = setTimeout(() => {
                const resultados = buscar(query);
                renderizarDropdown(resultados, query);
            }, 120);
        });

        // Teclado: setas + Enter + Escape
        inputEl.addEventListener('keydown', (e) => {
            const itens = dropdownEl ? dropdownEl.querySelectorAll('.search-dropdown-item') : [];
            if (!dropdownEl || !dropdownEl.classList.contains('search-dropdown--visivel')) {
                if (e.key === 'Enter' && inputEl.value.trim().length >= 2) {
                    const resultados = buscar(inputEl.value.trim());
                    if (resultados.length > 0) executarAcao(resultados[0]);
                }
                return;
            }

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                const next = indiceSelecionado < itens.length - 1 ? indiceSelecionado + 1 : 0;
                setAtivo(next);
            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                const prev = indiceSelecionado > 0 ? indiceSelecionado - 1 : itens.length - 1;
                setAtivo(prev);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                if (indiceSelecionado >= 0 && resultadosAtuais[indiceSelecionado]) {
                    executarAcao(resultadosAtuais[indiceSelecionado]);
                } else if (resultadosAtuais.length > 0) {
                    executarAcao(resultadosAtuais[0]);
                }
            } else if (e.key === 'Escape') {
                fecharDropdown();
                inputEl.blur();
            }
        });

        // Fecha ao clicar fora
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-container')) {
                fecharDropdown();
            }
        });

        // Foco: reabre dropdown se houver texto
        inputEl.addEventListener('focus', () => {
            const query = inputEl.value.trim();
            if (query.length >= 2) {
                const resultados = buscar(query);
                renderizarDropdown(resultados, query);
            }
        });
    }

    /* ── 6. Init ───────────────────────────────────────────────────────────── */
    function tryInit() {
        if (document.querySelector && document.querySelector('.search-bar')) {
            inicializarBusca();
        } else {
            setTimeout(tryInit, 150);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', tryInit);
    } else {
        tryInit();
    }

})();