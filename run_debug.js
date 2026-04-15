const fs = require('fs');

global.window = {};
global.document = {
    addEventListener: () => {},
    getElementById: (id) => {
        return {
            innerHTML: '',
            appendChild: () => {},
            classList: { toggle: () => {} }
        };
    },
    createElement: (tag) => ({
        innerHTML: '',
        className: '',
        style: {}
    })
};

global.BOOK_PAYMENT_LINKS = {};

// Load book files
eval(fs.readFileSync('Livro 1/livro1_a.js', 'utf8'));
eval(fs.readFileSync('Livro 1/livro1_b.js', 'utf8'));
eval(fs.readFileSync('Livro 1/livro1_c.js', 'utf8'));
eval(fs.readFileSync('Livro 2/livro2_a.js', 'utf8'));
eval(fs.readFileSync('Livro 3/livro3_a.js', 'utf8'));

// load recipes.js
eval(fs.readFileSync('recipes.js', 'utf8'));

// globalize
global.window.biblioteca = window.biblioteca;
global.window.BOOKS = window.BOOKS;
global.window.SeniorAuth = { isSubscriber: () => true };

eval(fs.readFileSync('app.js', 'utf8'));



console.log("\n--- DEBUG INFO ---");
console.log("LIVRO1_A defined:", typeof window.LIVRO1_A !== 'undefined');
console.log("biblioteca.reliquias length:", window.biblioteca.reliquias ? window.biblioteca.reliquias.length : "undefined");
console.log("biblioteca.livro2 length:", window.biblioteca.livro2 ? window.biblioteca.livro2.length : "undefined");

try {
    global.livroAtual = 'reliquias';
    let wrapper = {innerHTML: ''};
    
    // Simulate what loadRecipe(6) does
    let bookArr = window.biblioteca['reliquias'];
    let recipe = bookArr.find(r => r.id === 6);
    console.log("\nRecipe 6 found:", !!recipe);
    if(recipe) {
        console.log("Is Stub? (no ingredients):", !recipe.ingredientes);
        console.log("HTML Render Output contains ingredients?", renderRecipeHTML(recipe, null, true).includes("Ingredientes Necessários"));
    }
} catch (e) {
    console.log("ERROR:", e);
}

