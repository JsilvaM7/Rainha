const fs = require('fs');
global.window = {};

// Load all book files
const files = [
  'Livro 1/livro1_a.js', 'Livro 1/livro1_b.js', 'Livro 1/livro1_c.js',
  'Livro 2/livro2_a.js', 'Livro 2/livro2_b.js', 'Livro 2/livro2_c.js', 'Livro 2/livro2_d.js',
  'Livro 3/livro3_a.js', 'Livro 3/livro3_b.js', 'Livro 3/livro3_c.js', 'Livro 3/livro3_d.js',
  'Livro 4/livro4_a.js', 'Livro 4/livro4_b.js', 'Livro 4/livro4_c.js', 'Livro 4/livro4_d.js',
  'Livro 5/livro5_a.js', 'Livro 5/livro5_b.js', 'Livro 5/livro5_c.js', 'Livro 5/livro5_d.js',
];

for (const f of files) {
  try { eval(fs.readFileSync(f, 'utf8')); } catch(e) { console.log('ERROR loading', f, e.message); }
}

eval(fs.readFileSync('recipes.js', 'utf8'));

const result = {};
for (const [key, arr] of Object.entries(window.biblioteca)) {
  result[key] = { length: arr.length, firstId: arr[0]?.id, lastId: arr[arr.length-1]?.id, hasIngredients: !!(arr[0]?.ingredientes || arr[0]?.ingredients) };
}
fs.writeFileSync('test_result.json', JSON.stringify(result, null, 2));

// Check what var names Livro 4 uses
console.log('LIVRO1_A:', typeof window.LIVRO1_A, window.LIVRO1_A?.length);
console.log('LIVRO4_A:', typeof window.LIVRO4_A, window.LIVRO4_A?.length);
