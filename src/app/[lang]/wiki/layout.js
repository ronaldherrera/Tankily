"use client";

import './wiki.css';
import GlossaryWidget from './components/GlossaryWidget';
import { GlossaryProvider } from './context/GlossaryContext';

export default function WikiLayout({ children }) {
  return (
    <GlossaryProvider>
      <div className="wiki">
        {children}
      </div>
      {/* Diccionario flotante disponible en toda la wiki */}
      <GlossaryWidget />
    </GlossaryProvider>
  );
}
