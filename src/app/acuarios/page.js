"use client";
import { useState } from "react";

export default function AquariumsPage() {
  const [showForm, setShowForm] = useState(false);
  const [aquariums, setAquariums] = useState([
    { id: 1, name: "Acuario de Amazonía", type: "Dulce", volume: "120L", ph: 6.5, temp: 26 }
  ]);
  const [newAq, setNewAq] = useState({ name: "", type: "Dulce", volume: "" });

  const handleAdd = () => {
    if (!newAq.name) return;
    setAquariums([...aquariums, { ...newAq, id: Date.now(), ph: "-", temp: "-" }]);
    setShowForm(false);
    setNewAq({ name: "", type: "Dulce", volume: "" });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Mis Acuarios</h2>
        <button onClick={() => setShowForm(!showForm)}>
          {showForm ? "Cancelar" : "+ Añadir Acuario"}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ borderStyle: 'dashed' }}>
          <h3>Nuevo Acuario</h3>
          <input 
            placeholder="Nombre del acuario" 
            value={newAq.name}
            onChange={(e) => setNewAq({...newAq, name: e.target.value})}
          />
          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <select 
              value={newAq.type}
              onChange={(e) => setNewAq({...newAq, type: e.target.value})}
              style={{ flex: 1, padding: '0.75rem', borderRadius: '4px', border: '1px solid var(--border)' }}
            >
              <option value="Dulce">Agua Dulce</option>
              <option value="Salada">Agua Salada / Marino</option>
              <option value="Estanque">Estanque</option>
            </select>
            <input 
              placeholder="Volumen (L)" 
              type="number"
              style={{ flex: 1, marginBottom: 0 }}
              value={newAq.volume}
              onChange={(e) => setNewAq({...newAq, volume: e.target.value})}
            />
          </div>
          <button onClick={handleAdd} style={{ width: '100%' }}>Crear Acuario</button>
        </div>
      )}

      <div className="aquariums-grid">
        {aquariums.map(aq => (
          <div key={aq.id} className="card">
            <h3>{aq.name}</h3>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Tipo: {aq.type} | Volumen: {aq.volume}{typeof aq.volume === 'string' && aq.volume.includes('L') ? '' : 'L'}
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              Último pH: <strong>{aq.ph}</strong> | Temperatura: <strong>{aq.temp}°C</strong>
            </p>
            <div style={{ marginTop: '1.5rem', display: 'flex', gap: '0.5rem' }}>
              <button style={{ flex: 1 }}>Detalles</button> 
              <button style={{ flex: 1, background: 'white', color: 'black' }}>Medición</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
