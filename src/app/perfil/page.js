"use client";
import { useState } from "react";
import { mockApi } from "@/lib/supabase";

export default function ProfilePage() {
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    username: "AcuaristaPro",
    expertise: "Intermedio",
    karma: 150,
    bio: "Apasionado de los acuarios plantados y los discos."
  });

  const handleSave = () => {
    setIsEditing(false);
    // Aquí iría la llamada a Supabase en el futuro
    console.log("Perfil guardado:", profile);
  };

  return (
    <div>
      <h2>Mi Perfil</h2>
      
      <div className="card">
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <label>Nombre de Usuario</label>
            <input 
              value={profile.username} 
              onChange={(e) => setProfile({...profile, username: e.target.value})} 
            />
            
            <label>Bio</label>
            <textarea 
              value={profile.bio} 
              onChange={(e) => setProfile({...profile, bio: e.target.value})} 
              rows={4}
            />
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button onClick={handleSave}>Guardar Cambios</button>
              <button 
                onClick={() => setIsEditing(false)} 
                style={{ background: 'white', color: 'black' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <div>
            <h3>{profile.username}</h3>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
              Expertise: {profile.expertise} | Reputación: {profile.karma} Karma
            </p>
            <p style={{ marginBottom: '1.5rem' }}>{profile.bio}</p>
            <button onClick={() => setIsEditing(true)}>Editar Perfil</button>
          </div>
        )}
      </div>

      <h3>Mis Logros</h3>
      <div className="card" style={{ opacity: 0.5, textAlign: 'center' }}>
        <p>Aún no tienes logros. ¡Ayuda a la comunidad para ganar karma!</p>
      </div>
    </div>
  );
}
