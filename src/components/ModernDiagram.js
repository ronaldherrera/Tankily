import React from 'react';

const AlgaeTriangle = () => (
  <div className="diagrama" style={{ padding: '3rem 2rem', display: 'flex', justifyContent: 'center' }}>
    <svg width="100%" style={{ maxWidth: 450 }} viewBox="0 0 450 380" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Background shadow triangle */}
      <path d="M225 60L385 310H65L225 60Z" fill="rgba(170,215,245,0.04)" stroke="rgba(170,215,245,0.18)" strokeWidth="1" strokeLinejoin="round" />
      
      {/* LUZ (Top) */}
      <circle cx="225" cy="60" r="48" fill="rgba(251,192,45,0.14)" stroke="#FBC02D" strokeWidth="3" />
      <text x="225" y="62" fontSize="14" fontWeight="900" textAnchor="middle" fill="#ffe48a" fontFamily="Inter, sans-serif">LUZ</text>
      <path d="M225 35V45M225 75V85M200 60H210M240 60H250" stroke="#FBC02D" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

      {/* NUTRIENTES (Bottom Right) - Green */}
      <circle cx="385" cy="310" r="48" fill="rgba(76,175,80,0.14)" stroke="#4CAF50" strokeWidth="3" />
      <text x="385" y="315" fontSize="12" fontWeight="900" textAnchor="middle" fill="#a9efb4" fontFamily="Inter, sans-serif">NUTRIENTES</text>
      <text x="385" y="375" fontSize="11" fontWeight="600" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">(N, P, K, Fe, Mn, etc.)</text>

      {/* CO2 (Bottom Left) - Blue */}
      <circle cx="65" cy="310" r="48" fill="rgba(33,150,243,0.16)" stroke="#2196F3" strokeWidth="3" />
      <text x="65" y="315" fontSize="14" fontWeight="900" textAnchor="middle" fill="#9fd0ff" fontFamily="Inter, sans-serif">CO₂</text>
      
      {/* Warning Text in the center - simplified */}
      <text x="225" y="210" fontSize="14" fontWeight="900" textAnchor="middle" fill="#e6f1f7" fontFamily="Inter, sans-serif" opacity="0.1">EQUILIBRIO</text>
      <text x="225" y="225" fontSize="11" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">Cualquier desequilibrio genera algas</text>
    </svg>
  </div>
);

const NitrogenCycle = () => (
  <div className="diagrama" style={{ padding: '2rem' }}>
    <svg width="100%" height="auto" viewBox="0 0 600 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Title */}
      <text x="300" y="30" fontSize="14" fontWeight="900" textAnchor="middle" fill="#e6f1f7" fontFamily="Inter, sans-serif" letterSpacing="1px">EL CICLO DEL NITRÓGENO</text>
      <text x="300" y="45" fontSize="8" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif" letterSpacing="2px">PROCESO BIOLÓGICO</text>

      {/* AMONIACO */}
      <rect x="50" y="80" width="80" height="80" rx="20" fill="rgba(255,77,79,0.14)" stroke="#FF4D4F" strokeWidth="2" />
      <text x="90" y="115" fontSize="24" textAnchor="middle">🧪</text>
      <text x="90" y="180" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FF4D4F" fontFamily="Inter, sans-serif">AMONIACO</text>
      <text x="90" y="195" fontSize="10" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">NH₃ / NH₄⁺</text>

      {/* Transition: Nitrosomonas */}
      <path d="M140 120H250" stroke="#FFAB40" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M250 120L242 115M250 120L242 125" stroke="#FFAB40" strokeWidth="3" strokeLinecap="round" />
      <text x="195" y="110" fontSize="9" fontWeight="800" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">Nitrosomonas</text>

      {/* NITRITOS */}
      <rect x="260" y="80" width="80" height="80" rx="20" fill="rgba(250,173,20,0.14)" stroke="#FAAD14" strokeWidth="2" />
      <text x="300" y="115" fontSize="24" textAnchor="middle">⚠️</text>
      <text x="300" y="180" fontSize="12" fontWeight="900" textAnchor="middle" fill="#FAAD14" fontFamily="Inter, sans-serif">NITRITOS</text>
      <text x="300" y="195" fontSize="10" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">NO₂⁻</text>

      {/* Transition: Nitrospira */}
      <path d="M350 120H460" stroke="#52C41A" strokeWidth="3" strokeDasharray="4 4" strokeLinecap="round" />
      <path d="M460 120L452 115M460 120L452 125" stroke="#52C41A" strokeWidth="3" strokeLinecap="round" />
      <text x="405" y="110" fontSize="9" fontWeight="800" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">Nitrospira</text>

      {/* NITRATOS */}
      <rect x="470" y="80" width="80" height="80" rx="20" fill="rgba(82,196,26,0.14)" stroke="#52C41A" strokeWidth="2" />
      <text x="510" y="115" fontSize="24" textAnchor="middle">🌿</text>
      <text x="510" y="180" fontSize="12" fontWeight="900" textAnchor="middle" fill="#52C41A" fontFamily="Inter, sans-serif">NITRATOS</text>
      <text x="510" y="195" fontSize="10" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">NO₃⁻</text>

      {/* Bottom Note Area */}
      <rect x="50" y="225" width="500" height="40" rx="12" fill="rgba(170,215,245,0.05)" stroke="rgba(170,215,245,0.18)" />
      <text x="300" y="245" fontSize="10" textAnchor="middle" fill="#a9bfce" fontFamily="Inter, sans-serif">
        <tspan fontWeight="900" fill="#e6f1f7">Regla de seguridad: </tspan>
        AMONIACO y NITRITOS deben estar siempre a 0 ppm.
      </text>
      <text x="300" y="258" fontSize="9" textAnchor="middle" fill="#8aa3b5" fontFamily="Inter, sans-serif">
        Los nitratos son alimento para plantas, pero en exceso (&gt;25 ppm) favorecen las algas.
      </text>
    </svg>
  </div>
);

const EcosystemChain = () => (
  <div className="diagrama" style={{ padding: '2.5rem' }}>
    <svg width="100%" height="auto" viewBox="0 0 400 480" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="200" y="30" fontSize="13" fontWeight="950" textAnchor="middle" fill="#e6f1f7" fontFamily="Inter, sans-serif" letterSpacing="1px">CADENA DE NUTRIENTES DEL ACUARIO</text>
      
      {[
        { icon: '☀️', label: 'ENERGÍA', sub: 'Luz solar o LED', color: '#FBC02D', y: 80 },
        { icon: '🌱', label: 'PRODUCTORES', sub: 'Plantas y Algas', color: '#4CAF50', y: 160 },
        { icon: '🦐', label: 'CONSUMIDORES', sub: 'Peces e Invertebrados', color: '#2196F3', y: 240 },
        { icon: '🦠', label: 'DESCOMPONEDORES', sub: 'Bacterias y Microfauna', color: '#7E57C2', y: 320 },
        { icon: '🔄', label: 'MINERALIZACIÓN', sub: 'Retorno de Nutrientes', color: '#9fe7f5', y: 400 }
      ].map((item, i, arr) => (
        <React.Fragment key={i}>
          {/* Connector line */}
          {i < arr.length - 1 && (
            <path d={`M200 ${item.y + 40}V${item.y + 80}`} stroke="rgba(170,215,245,0.18)" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 4" />
          )}
          
          <rect x="50" y={item.y - 25} width="300" height="50" rx="15" fill="rgba(170,215,245,0.05)" stroke="rgba(170,215,245,0.18)" />
          <circle cx="80" cy={item.y} r="20" fill={`${item.color}15`} stroke={item.color} strokeWidth="1.5" />
          <text x="80" y={item.y + 5} fontSize="14" textAnchor="middle">{item.icon}</text>
          
          <text x="115" y={item.y - 2} fontSize="10" fontWeight="900" fill="#e6f1f7" fontFamily="Inter, sans-serif">{item.label}</text>
          <text x="115" y={item.y + 12} fontSize="8" fill="#8aa3b5" fontFamily="Inter, sans-serif">{item.sub}</text>
        </React.Fragment>
      ))}
      
      {/* Feedback loop arrow (cycle) */}
      <path d="M50 400C10 400 10 80 50 80" stroke="rgba(170,215,245,0.18)" strokeWidth="1" strokeDasharray="3 3" />
    </svg>
  </div>
);

const RuleOfThirds = () => (
  <div className="diagrama" style={{ padding: '2rem' }}>
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem' }}>
      <div style={{ fontWeight: '900', fontSize: '1.1rem', letterSpacing: '-0.5px' }}>REGLA DE LOS TERCIOS</div>
      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', aspectRatio: '5 / 3', background: 'rgba(170,215,245,0.04)', borderRadius: '16px', border: '1px solid rgba(170,215,245,0.18)', overflow: 'hidden' }}>
        {/* Grid Lines */}
        <div style={{ position: 'absolute', left: '33.33%', top: 0, bottom: 0, width: '1px', background: 'rgba(170,215,245,0.18)' }}></div>
        <div style={{ position: 'absolute', left: '66.66%', top: 0, bottom: 0, width: '1px', background: 'rgba(170,215,245,0.18)' }}></div>
        <div style={{ position: 'absolute', top: '33.33%', left: 0, right: 0, height: '1px', background: 'rgba(170,215,245,0.18)' }}></div>
        <div style={{ position: 'absolute', top: '66.66%', left: 0, right: 0, height: '1px', background: 'rgba(170,215,245,0.18)' }}></div>
        
        {/* Intersection Points (X) */}
        {[
          { top: '33.33%', left: '33.33%' },
          { top: '33.33%', left: '66.66%' },
          { top: '66.66%', left: '33.33%' },
          { top: '66.66%', left: '66.66%' }
        ].map((p, i) => (
          <div key={i} style={{ 
            position: 'absolute', 
            top: p.top, 
            left: p.left, 
            width: '12px', 
            height: '12px', 
            background: 'var(--agua)', 
            borderRadius: '50%', 
            transform: 'translate(-50%, -50%)',
            boxShadow: '0 0 0 4px var(--agua-tinta)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <div style={{ width: '4px', height: '4px', background: 'var(--abismo)', borderRadius: '50%' }}></div>
          </div>
        ))}
      </div>
      <div style={{ fontSize: '0.85rem', color: 'var(--texto-3)', textAlign: 'center' }}>
        Los puntos marcados indican los <strong style={{ color: 'var(--texto)' }}>focos de atención</strong> naturales del ojo humano.
      </div>
    </div>
  </div>
);

const SetupSteps = () => (
  <div className="diagrama" style={{ padding: '2.5rem' }}>
    <svg width="100%" height="auto" viewBox="0 0 500 700" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="250" y="30" fontSize="14" fontWeight="950" textAnchor="middle" fill="#e6f1f7" fontFamily="Inter, sans-serif" letterSpacing="1px">PASOS PARA MONTAR TU ACUARIO</text>
      
      {[
        { n: 1, title: 'TANQUE', sub: 'Elegir tamaño (mín. 60L)', icon: '📦' },
        { n: 2, title: 'EQUIPO', sub: 'Filtro, calentador y luz', icon: '⚙️' },
        { n: 3, title: 'SUSTRATO', sub: 'Capa base para plantas', icon: '🏜️' },
        { n: 4, title: 'LLENADO', sub: 'Agua + acondicionador', icon: '💧' },
        { n: 5, title: 'PLANTADO', sub: 'Vegetación (opcional)', icon: '🌿' },
        { n: 6, title: 'CICLADO', sub: 'Madurar (4-8 semanas)', icon: '🕰️' },
        { n: 7, title: 'TESTS', sub: 'Medir parámetros clave', icon: '📊' },
        { n: 8, title: 'PECES', sub: 'Introducción lenta', icon: '🐠' }
      ].map((step, i, arr) => {
        const y = 80 + (i * 75);
        return (
          <React.Fragment key={i}>
            {/* Guide line */}
            {i < arr.length - 1 && (
              <line x1="60" y1={y + 15} x2="60" y2={y + 60} stroke="rgba(170,215,245,0.18)" strokeWidth="2" strokeDasharray="4 4" />
            )}
            
            <circle cx="60" cy={y} r="18" fill="rgba(170,215,245,0.05)" stroke="#9fe7f5" strokeWidth="1.5" />
            <text x="60" y={y + 5} fontSize="10" fontWeight="900" textAnchor="middle" fill="#e6f1f7" fontFamily="Inter, sans-serif">{step.n}</text>
            
            <rect x="100" y={y - 25} width="350" height="50" rx="15" fill="rgba(170,215,245,0.05)" stroke="rgba(170,215,245,0.18)" />
            <text x="120" y={y + 5} fontSize="18" textAnchor="middle">{step.icon}</text>
            <text x="150" y={y - 2} fontSize="11" fontWeight="900" fill="#e6f1f7" fontFamily="Inter, sans-serif">{step.title}</text>
            <text x="150" y={y + 12} fontSize="9" fill="#8aa3b5" fontFamily="Inter, sans-serif">{step.sub}</text>
          </React.Fragment>
        );
      })}
    </svg>
  </div>
);

export default function ModernDiagram({ type }) {
  switch (type) {
    case 'algae-triangle': return <AlgaeTriangle />;
    case 'nitrogen-cycle': return <NitrogenCycle />;
    case 'ecosystem-chain': return <EcosystemChain />;
    case 'rule-of-thirds': return <RuleOfThirds />;
    case 'setup-steps': return <SetupSteps />;
    default: return null;
  }
}
