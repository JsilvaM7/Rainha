const fs = require('fs');

global.window = {};
global.document = {
    addEventListener: () => {},
    getElementById: (id) => ({ innerHTML: '', appendChild: () => {}, classList: { toggle: () => {} } }),
    createElement: (tag) => ({ innerHTML: '', className: '', style: {} })
};

global.BOOK_PAYMENT_LINKS = {};

// Load book files
eval(fs.readFileSync('Livro 1/livro1_a.js', 'utf8'));
eval(fs.readFileSync('Livro 1/livro1_b.js', 'utf8'));
eval(fs.readFileSync('Livro 1/livro1_c.js', 'utf8'));

// load recipes.js
eval(fs.readFileSync('recipes.js', 'utf8'));

global.window.biblioteca = window.biblioteca;
global.window.BOOKS = window.BOOKS;
global.window.SeniorAuth = { isSubscriber: () => true };

eval(fs.readFileSync('app.js', 'utf8'));

global.livroAtual = 'reliquias';
let bookArr = window.biblioteca['reliquias'];
let recipe = bookArr.find(r => r.id === 6);

const result = {
    is_LIVRO1_A_defined: typeof window.LIVRO1_A !== 'undefined',
    reliquias_length: bookArr.length,
    recipe_found: !!recipe,
    is_stub: recipe ? !recipe.ingredientes : null,
    recipe_object: recipe || null
};

fs.writeFileSync('debug_result.json', JSON.stringify(result, null, 2));
