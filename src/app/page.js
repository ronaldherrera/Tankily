"use client";
import { useState } from "react";

export default function Home() {
  const [activeTab, setActiveTab] = useState("generico");

  return (
    <div>
      <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid #ccc', marginBottom: '1rem' }}>
        <button 
          onClick={() => setActiveTab("generico")}
          style={{ 
            background: activeTab === "generico" ? "black" : "white", 
            color: activeTab === "generico" ? "white" : "black",
            border: '1px solid black'
          }}
        >
          Feed Genérico
        </button>
        <button 
          onClick={() => setActiveTab("siguiendo")}
          style={{ 
            background: activeTab === "siguiendo" ? "black" : "white", 
            color: activeTab === "siguiendo" ? "white" : "black",
            border: '1px solid black'
          }}
        >
          Siguiendo
        </button>
      </div>

      <h2>{activeTab === "generico" ? "Comunidad Global" : "Personas y Tiendas que Sigo"}</h2>
      
      <div className="card">
        <h3>Nueva Publicación (Placeholder)</h3>
        <textarea placeholder="¿Qué hay de nuevo en tu tanque?" style={{width: '100%', minHeight: '100px'}}></textarea>
        <br/><br/>
        <button>Publicar</button>
      </div>

      <div className="posts">
        {activeTab === "generico" ? (
          <div className="card">
            <h4>Duda técnica (Global)</h4>
            <p>Tengo el pH en 6.0, ¿es normal para un acuario amazónico?</p>
            <button>Me gusta</button> <button>Responder</button>
          </div>
        ) : (
          <div className="card">
            <h4>Actualización de Tienda Seguida</h4>
            <p>¡Nuevos Corales disponibles en nuestra tienda!</p>
            <button>Me gusta</button> <button>Ver tienda</button>
          </div>
        )}
      </div>
    </div>
  );
}
