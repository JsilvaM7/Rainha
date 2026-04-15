const fs = require('fs');
global.window = {};
eval(fs.readFileSync('Livro 1/livro1_a.js', 'utf8'));
console.log('LIVRO1_A[0]:', JSON.stringify(window.LIVRO1_A[0], null, 2));

const recipesCode = fs.readFileSync('recipes.js', 'utf8');
eval(recipesCode);
console.log('reliquias[5]:', JSON.stringify(window.biblioteca.reliquias[5], null, 2));

console.log('Does reliquias[5] === window.LIVRO1_A[0] ?', window.biblioteca.reliquias[5] === window.LIVRO1_A[0]);
