const fs = require('fs');

global.window = {};
global.document = {
    addEventListener: () => {},
    getElementById: (id) => ({
        innerHTML: '',
        appendChild: () => {},
        classList: { toggle: () => {} }
    }),
    createElement: (tag) => ({
        innerHTML: '',
        className: '',
        style: {}
    })
};

// Load recipes.js
const r = fs.readFileSync('./recipes.js', 'utf8');
eval(r);

// Load app.js (mocking some stuff)
global.window.BOOKS = global.BOOKS;
const a = fs.readFileSync('./app.js', 'utf8');
eval(a);

// Load livro1
const l1a = fs.readFileSync('./Livro 1/livro1_a.js', 'utf8');
eval(l1a);

global.window.biblioteca = global.biblioteca;
global.window.biblioteca.reliquias[5] = global.LIVRO1_A[0]; 
// Actually, let's just re-evaluate recipes.js to populate window.biblioteca properly
eval(r);

global.window.SeniorAuth = { isSubscriber: () => true, getUser: () => ({nome:'Test'}) };
global.livroAtual = 'reliquias';
try {
    loadRecipe(6);
    console.log('SUCCESS: Generated HTML for recipe 6');
} catch(e) {
    console.error('ERROR:', e.message);
}
