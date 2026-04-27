
with open('app.js', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # Botao 1 - Veu da Juventude
    ('background: linear-gradient(135deg, #4A0404 0%, #8B0000 60%, #c62828 100%);',
     'background: linear-gradient(135deg, #2D0058 0%, #4B0082 60%, #6A0DAD 100%);'),
    ('border: 1px solid rgba(200,0,0,0.4);',
     'border: 1px solid rgba(75,0,130,0.4);'),
    ('box-shadow: 0 4px 20px rgba(139,0,0,0.3);',
     'box-shadow: 0 4px 20px rgba(75,0,130,0.3);'),
    ("this.style.boxShadow='0 8px 32px rgba(180,0,0,0.5)'",
     "this.style.boxShadow='0 8px 32px rgba(75,0,130,0.5)'"),
    ("this.style.boxShadow='0 4px 20px rgba(139,0,0,0.3)'",
     "this.style.boxShadow='0 4px 20px rgba(75,0,130,0.3)'"),
    # Botao 2 - Pintura da Sereia
    ('background: linear-gradient(135deg, #1a0a0a 0%, #3d0a0a 60%, #8B0000 100%);',
     'background: linear-gradient(135deg, #1a0030 0%, #2D0058 60%, #4B0082 100%);'),
    ('border: 1px solid rgba(200,0,0,0.35);',
     'border: 1px solid rgba(75,0,130,0.35);'),
    ('box-shadow: 0 4px 20px rgba(74,4,4,0.4);',
     'box-shadow: 0 4px 20px rgba(75,0,130,0.4);'),
    ("this.style.boxShadow='0 8px 32px rgba(139,0,0,0.5)'",
     "this.style.boxShadow='0 8px 32px rgba(75,0,130,0.5)'"),
    ("this.style.boxShadow='0 4px 20px rgba(74,4,4,0.4)'",
     "this.style.boxShadow='0 4px 20px rgba(75,0,130,0.4)'"),
    # Badge Biblioteca e botoes subscriber
    ('background:rgba(139,0,0,0.1); color:#8B0000;',
     'background:rgba(75,0,130,0.1); color:#4B0082;'),
    ('border:1px solid rgba(139,0,0,0.2);',
     'border:1px solid rgba(75,0,130,0.2);'),
    ('border:1.5px solid rgba(139,0,0,0.3);',
     'border:1.5px solid rgba(75,0,130,0.3);'),
    ('box-shadow:0 2px 10px rgba(139,0,0,0.08);',
     'box-shadow:0 2px 10px rgba(75,0,130,0.08);'),
    ('font-size:10px;background:#8B0000;color:#fff;',
     'font-size:10px;background:#4B0082;color:#fff;'),
]

for old, new in replacements:
    c = c.replace(old, new)

with open('app.js', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK - replacements done')
