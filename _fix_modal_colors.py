
with open('index.css', 'r', encoding='utf-8') as f:
    c = f.read()

replacements = [
    # Fundo dos modais: gradiente marrom-escuro -> roxo-escuro
    ('linear-gradient(160deg, #130000 0%, #220505 45%, #130000 100%)',
     'linear-gradient(160deg, #0a0020 0%, #160040 45%, #0a0020 100%)'),

    # Overlay membro: vermelho escuro -> roxo escuro
    ('background: rgba(8, 0, 0, 0.78)',
     'background: rgba(5, 0, 20, 0.78)'),

    # Sombra inset vermelho -> roxo
    ('inset 0 1px 0 rgba(255, 80, 80, 0.06)',
     'inset 0 1px 0 rgba(150, 80, 220, 0.06)'),

    # Botao fechar: backgrounds e bordas vermelhas
    ('background: rgba(255, 80, 80, 0.08)',
     'background: rgba(150, 80, 220, 0.08)'),
    ('border: 1px solid rgba(255, 80, 80, 0.15)',
     'border: 1px solid rgba(150, 80, 220, 0.2)'),
    ('color: rgba(255, 140, 140, 0.6)',
     'color: rgba(180, 130, 220, 0.7)'),
    ('background: rgba(255, 80, 80, 0.18)',
     'background: rgba(150, 80, 220, 0.18)'),
    ('border-color: rgba(255, 80, 80, 0.4)',
     'border-color: rgba(150, 80, 220, 0.45)'),
    ('color: rgba(255, 100, 100, 0.95)',
     'color: rgba(180, 130, 255, 0.95)'),

    # Animacao da coroa: vermelho -> roxo
    ('0%, 100% { filter: drop-shadow(0 0 14px rgba(220, 0, 0, 0.65)); }',
     '0%, 100% { filter: drop-shadow(0 0 14px rgba(106, 13, 173, 0.7)); }'),
    ('50%       { filter: drop-shadow(0 0 26px rgba(255, 80, 80, 0.9)); }',
     '50%       { filter: drop-shadow(0 0 26px rgba(150, 80, 220, 0.9)); }'),

    # Coroa filter drop-shadow vermelho
    ('filter: drop-shadow(0 0 14px rgba(220, 0, 0, 0.65))',
     'filter: drop-shadow(0 0 14px rgba(106, 13, 173, 0.7))'),

    # Headline gradient: ffb3ae (rosa avermelhado) -> roxo claro
    ('linear-gradient(135deg, #B38DEA 0%, #6A0DAD 50%, #ffb3ae 100%)',
     'linear-gradient(135deg, #B38DEA 0%, #6A0DAD 50%, #D4AAFF 100%)'),

    # Subtitulo e textos rosados -> lilás
    ('color: rgba(255, 200, 200, 0.68)',
     'color: rgba(210, 185, 240, 0.75)'),
    ('color: rgba(255, 220, 220, 0.92)',
     'color: rgba(225, 210, 245, 0.92)'),
    ('color: rgba(255, 160, 160, 0.55)',
     'color: rgba(180, 150, 220, 0.6)'),
    ('color: rgba(255, 150, 150, 0.35)',
     'color: rgba(160, 120, 210, 0.45)'),
    ('color: rgba(255, 150, 150, 0.38)',
     'color: rgba(160, 120, 210, 0.45)'),

    # Input focus: borda vermelha -> roxa
    ('border-color: rgba(220, 40, 40, 0.9)',
     'border-color: rgba(106, 13, 173, 0.9)'),

    # Botao Acessar hover: vermelho -> roxo mais escuro
    ('background: linear-gradient(135deg, #a50000 0%, #e53535 100%)',
     'background: linear-gradient(135deg, #2D0058 0%, #6A0DAD 100%)'),
]

for old, new in replacements:
    count = c.count(old)
    c = c.replace(old, new)
    print(f'[{count}x] {old[:60]}')

with open('index.css', 'w', encoding='utf-8') as f:
    f.write(c)
print('OK')
