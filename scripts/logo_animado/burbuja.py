# Logo animado de Tankily, paso 2 de 3: la burbuja, sincronizada con la ola (ciclo de 5,5 s).
# Se ejecuta después de ola.py (ver su cabecera).
# nace en la punta derecha cuando está arriba y explota cuando la punta llega abajo (medio ciclo después).
# La punta derecha (x = 44) de y = 26 - 3,15·sin(2π(x-14)/30 - 2πt) está arriba en t = 0.75 y abajo en t = 0.25.
# En t = 0 (un cuarto de vida de la burbuja) todo coincide con el icono estático: ola, y burbuja en (51, 13) con r 4,6.
#
# Explosión inspirada en una burbuja real: tiembla un instante (la película se tensa), revienta en ~60 ms
# con un leve crecimiento, la película se rompe en un anillo a trozos que se abre y adelgaza, y las gotitas
# salen de la superficie (no del centro), de tamaños distintos y casi todas hacia arriba: frenan, encogen
# y caen un poco por la gravedad.
import math, sys

DUR = 5.5
FASE = 0.0
t_arriba = ((FASE - math.pi / 2) / (2 * math.pi)) % 1  # 0.75
inicio = -round((1 - t_arriba) * DUR, 3)  # las animaciones empiezan "adelantadas": su instante 0 cae en t_arriba
y_punta = 26 - 3.15
CX, CY, R = 51, 13, 4.6
b = f'begin="{inicio}s" dur="{DUR}s" repeatCount="indefinite"'
f = lambda v: f"{v:.2f}".rstrip('0').rstrip('.')

# Tiempos locales (fracción del ciclo desde que nace). 0.01 del ciclo = 55 ms
POP = 0.5          # revienta (punta de la ola abajo)
SALIDA = 0.545     # las gotitas terminan de salir despedidas (~250 ms)
FIN = 0.6          # han caído y desaparecido (~550 ms)
SALE = '0.12 0.75 0.3 1'   # sale muy rápido y frena
CAE = '0.5 0 0.9 0.6'      # cae acelerando

# (ángulo en grados, distancia que recorre fuera de la superficie, tamaño)
GOTAS = [(-95, 4.6, 1.25), (-62, 3.6, 0.9), (-128, 3.9, 1.0), (-28, 2.6, 0.7), (-160, 2.8, 0.75), (20, 1.9, 0.55)]

gotas = []
for ang, dist, tam in GOTAS:
    a = math.radians(ang)
    x0, y0 = CX + R * math.cos(a), CY + R * math.sin(a)
    x1, y1 = CX + (R + dist) * math.cos(a), CY + (R + dist) * math.sin(a)
    x2, y2 = x1 + 0.35 * math.cos(a), y1 + 1.6          # sigue un poco y cae
    gotas.append(f'''    <circle cx="{f(x0)}" cy="{f(y0)}" r="0">
      <animate attributeName="cx" {b} calcMode="spline" keyTimes="0;{POP};{SALIDA};{FIN};1"
        keySplines="0 0 1 1;{SALE};{CAE};0 0 1 1" values="{f(x0)};{f(x0)};{f(x1)};{f(x2)};{f(x2)}"/>
      <animate attributeName="cy" {b} calcMode="spline" keyTimes="0;{POP};{SALIDA};{FIN};1"
        keySplines="0 0 1 1;{SALE};{CAE};0 0 1 1" values="{f(y0)};{f(y0)};{f(y1)};{f(y2)};{f(y2)}"/>
      <animate attributeName="r" {b} keyTimes="0;{POP};0.503;{SALIDA};{FIN};1" values="0;0;{f(tam)};{f(tam * 0.75)};0;0"/>
    </circle>''')

bloque = f'''  <!-- Burbuja: se forma dentro de la ola cuando la punta derecha está arriba; con el filtro "goo" la ola se
       abomba, se estira en un cuello y la gota se desprende. Sube, coincide con el icono y explota cuando la
       punta llega abajo. Generada con scripts (tiempos ligados a la ola). -->
  <!-- La posición la da un único recorrido curvo (animateMotion): sube casi en vertical al soltarse y se
       inclina hacia su sitio; arranca despacio, acelera y frena al llegar. Luego flota (cy) y tiembla (rx/ry). -->
  <ellipse cx="0" cy="0" rx="{R}" ry="{R}" fill="#4fc3e8">
    <animateMotion {b} calcMode="spline" keyTimes="0;0.22;1" keyPoints="0;1;1"
      keySplines="0.45 0 0.2 1;0 0 1 1" path="M41 23.5C41.4 18.6 44.6 13.4 {CX} {CY}"/>
    <animate attributeName="cy" {b} calcMode="spline" keyTimes="0;0.27;0.35;0.43;0.5;1"
      keySplines="0 0 1 1;0.45 0 0.55 1;0.45 0 0.55 1;0.45 0 0.55 1;0 0 1 1" values="0;0;-0.4;0;-0.25;0"/>
    <animate attributeName="rx" {b} calcMode="spline" keyTimes="0;0.22;0.465;0.477;0.489;{POP};0.506;1"
      keySplines="0.3 0 0.3 1;0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1" values="1.5;{R};{R};4.95;4.35;{R};5.2;5.2"/>
    <animate attributeName="ry" {b} calcMode="spline" keyTimes="0;0.22;0.465;0.477;0.489;{POP};0.506;1"
      keySplines="0.2 0 0.3 1;0 0 1 1;0.4 0 0.6 1;0.4 0 0.6 1;0.4 0 0.6 1;0 0 1 1;0 0 1 1" values="1.8;{R};{R};4.3;4.85;{R};5.2;5.2"/>
    <animate attributeName="opacity" {b} keyTimes="0;{POP};0.511;1" values="1;1;0;0"/>
    <!-- Nace del mismo azul que la ola en ese punto y se aclara hasta el color del icono -->
    <animate attributeName="fill" {b} keyTimes="0;0.06;0.16;1" values="#3287fd;#3287fd;#4fc3e8;#4fc3e8"/>
  </ellipse>
  </g>

  <!-- Explosión: la película se rompe en un anillo a trozos que se abre y adelgaza -->
  <circle cx="{CX}" cy="{CY}" r="{R}" fill="none" stroke="#4fc3e8" stroke-dasharray="3.2 2.4" stroke-linecap="round" opacity="0">
    <animate attributeName="r" {b} calcMode="spline" keyTimes="0;{POP};0.535;1" keySplines="0 0 1 1;{SALE};0 0 1 1" values="{R};{R};7.6;7.6"/>
    <animate attributeName="stroke-width" {b} keyTimes="0;{POP};0.535;1" values="1.8;1.8;0.2;0.2"/>
    <animate attributeName="opacity" {b} keyTimes="0;0.499;0.503;0.535;1" values="0;0;0.85;0;0"/>
  </circle>

  <!-- Gotitas: salen de la superficie, frenan, encogen y caen -->
  <g fill="#4fc3e8">
{chr(10).join(gotas)}
  </g>
</svg>
'''

GOO = '''    <!-- "Goo": funde las formas que se tocan, para que la burbuja se forme y se desprenda de la ola -->
    <filter id="goo" filterUnits="userSpaceOnUse" x="4" y="2" width="56" height="56">
      <feGaussianBlur in="SourceGraphic" stdDeviation="1.6" result="borroso"/>
      <feColorMatrix in="borroso" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -9" result="goo"/>
      <feComposite in="SourceGraphic" in2="goo" operator="atop"/>
    </filter>
'''

for ruta in sys.argv[1:]:
    s = open(ruta, encoding='utf8').read()
    if 'id="goo"' not in s:
        s = s.replace('  </defs>', GOO + '  </defs>', 1)
    if '<g filter="url(#goo)">' not in s:
        s = s.replace('  <!-- Ola:', '  <g filter="url(#goo)">\n  <!-- Ola:', 1)
    i = s.index('  <!-- Burbuja')
    open(ruta, 'w', encoding='utf8').write(s[:i] + bloque)
print('inicio', inicio)
