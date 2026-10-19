# Logo animado de Tankily (public/logo-animado.svg y logo-animado-oscuro.svg), paso 1 de 3: la ola.
# Una sola onda que avanza despacio (ciclo de 5,5 s) con la misma medida que la ola del icono: en t = 0
# coincide exactamente con el icono estático. Cada fotograma es una curva suave (Catmull-Rom -> Bézier)
# con el mismo número de tramos, para que el navegador interpole entre ellos.
# Uso (en este orden): python scripts/logo_animado/ola.py public/logo-animado.svg public/logo-animado-oscuro.svg
#                      python scripts/logo_animado/burbuja.py public/logo-animado.svg public/logo-animado-oscuro.svg
#                      node scripts/logo_animado/gif.mjs
import math, re, sys

X0, X1 = 14.0, 44.0
L = 30.0            # una longitud de onda entre las dos puntas, como el logo
N_PUNTOS = 17       # puntos de muestreo -> 16 tramos
FOTOGRAMAS = 90

def y(x, t):
    # Una sola onda que avanza despacio: puntas y crestas suben y bajan al mismo compás.
    # Misma medida que la ola del icono (una "S" completa entre las puntas, altura 3,15):
    # en t = 0 la ola es exactamente la del icono estático.
    return 26 - 3.15 * math.sin(2 * math.pi * (x - X0) / 30 - 2 * math.pi * t)

def camino(t):
    xs = [X0 + (X1 - X0) * i / (N_PUNTOS - 1) for i in range(N_PUNTOS)]
    ps = [(x, y(x, t)) for x in xs]
    # puntos fantasma en los extremos siguiendo la misma onda (tangentes naturales)
    paso = xs[1] - xs[0]
    ext = [(X0 - paso, y(X0 - paso, t))] + ps + [(X1 + paso, y(X1 + paso, t))]
    f = lambda v: f"{v:.2f}".rstrip('0').rstrip('.')
    d = f"M{f(ps[0][0])} {f(ps[0][1])}"
    for i in range(1, len(ext) - 2):
        p0, p1, p2, p3 = ext[i - 1], ext[i], ext[i + 1], ext[i + 2]
        c1 = (p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6)
        c2 = (p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6)
        d += f"C{f(c1[0])} {f(c1[1])} {f(c2[0])} {f(c2[1])} {f(p2[0])} {f(p2[1])}"
    return d

fotos = [camino(i / FOTOGRAMAS) for i in range(FOTOGRAMAS + 1)]
valores = ';\n              '.join(fotos)
animacion = f'''<path d="{fotos[0]}" fill="none" stroke="url(#ola)" stroke-width="9.5" stroke-linecap="round">
    <animate attributeName="d" dur="5.5s" repeatCount="indefinite"
      values="{valores}"/>
  </path>'''

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf8').read()
    s, n = re.subn(r'  <!-- Ola:.*?</path>', '  <!-- Ola: onda que avanza de izquierda a derecha (las puntas también suben y bajan),\n       generada con 90 fotogramas -->\n  ' + animacion, s, flags=re.S)
    assert n == 1, ruta
    open(ruta, 'w', encoding='utf8').write(s)
print(fotos[0])
