const fs = require('fs');

global.window = {};
const recipesCode = fs.readFileSync('recipes.js', 'utf8');
const l1aCode = fs.readFileSync('Livro 1/livro1_a.js', 'utf8');

// evaluate l1a
eval(l1aCode);
// evaluate recipes
eval(recipesCode);

console.log('reliquias len:', window.biblioteca.reliquias.length);
console.log('reliquias[5]:', window.biblioteca.reliquias[5]);
console.log('livro2 len:', window.biblioteca.livro2.length);

