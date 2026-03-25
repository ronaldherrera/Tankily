export default function MarketplacePage() {
  return (
    <div>
      <h2>Marketplace / Intercambios</h2>
      <div style={{display: 'flex', gap: '1rem', marginBottom: '1rem'}}>
        <button>Tiendas</button>
        <button>Intercambios Particulares</button>
        <button>Servicios</button>
      </div>
      <div className="card">
        <h3>Filtro Eheim 2213 (Segunda Mano)</h3>
        <p>Precio: 45€ | Estado: Usado</p>
        <button>Contactar</button>
      </div>
    </div>
  );
}
