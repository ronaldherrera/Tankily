export default function WikiPage() {
  return (
    <div>
      <h2>Wiki de Especies</h2>
      <input type="text" placeholder="Buscar pez, planta o coral..." style={{width: '100%', padding: '0.5rem'}} />
      <br/><br/>
      <div className="card">
        <h3>Neon Tetra (Paracheirodon innesi)</h3>
        <p>Dificultad: Baja | pH: 5.5 - 7.5 | Temp: 20-26°C</p>
        <button>Ver Ficha Completa</button>
      </div>
    </div>
  );
}
