"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { wikiTree } from '@/lib/wikiData';

export default function WikiSidebar() {
  const pathname = usePathname();
  const [expandedCats, setExpandedCats] = useState(
    wikiTree.slice(0, 3).map(cat => cat.title) // Expand first few by default
  );

  const toggleCat = (title) => {
    setExpandedCats(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title) 
        : [...prev, title]
    );
  };

  return (
    <aside style={{ 
      width: '320px', 
      borderRight: '1px solid #f0f0f0', 
      padding: '2.5rem 1.5rem',
      position: 'sticky',
      top: '80px',
      height: 'calc(100vh - 80px)',
      overflowY: 'auto',
      background: 'white',
      zIndex: 10
    }}>
      <nav style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <Link 
          href="/wiki"
          style={{ 
            padding: '1rem 1.2rem', 
            borderRadius: '16px',
            textDecoration: 'none',
            color: pathname === '/wiki' ? 'white' : 'black',
            background: pathname === '/wiki' ? 'black' : '#f5f5f5',
            fontWeight: '800',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
            transition: 'all 0.2s',
            border: '1px solid transparent'
          }}
          className="sidebar-home-hover"
        >
          <span style={{ fontSize: '1.2rem' }}>💎</span>
          Dashboard Wiki
        </Link>

        {wikiTree.map((cat, idx) => (
          <div key={idx} style={{ 
            background: '#fafafa', 
            borderRadius: '18px', 
            padding: '1rem',
            border: '1px solid #f0f0f0' 
          }}>
            <button 
              onClick={() => toggleCat(cat.title)}
              style={{
                width: '100%',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                padding: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: '900',
                color: '#aaa',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: expandedCats.includes(cat.title) ? '0.8rem' : '0'
              }}
            >
              {cat.title}
              <span style={{ fontSize: '0.6rem', opacity: 0.5 }}>
                {expandedCats.includes(cat.title) ? '▼' : '▶'}
              </span>
            </button>
            
            {expandedCats.includes(cat.title) && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {cat.items.map((item, itemIdx) => {
                  const itemSlug = `${item.file}#${item.section.toLowerCase().replace(/\s+/g, '-')}`;
                  const href = `/wiki/${itemSlug}`;
                  
                  return (
                    <Link 
                      key={itemIdx}
                      href={href}
                      style={{ 
                        padding: '0.7rem 1rem', 
                        borderRadius: '12px',
                        textDecoration: 'none',
                        color: '#444',
                        fontSize: '0.85rem',
                        fontWeight: '600',
                        transition: 'all 0.2s',
                        background: 'transparent',
                        border: '1px solid transparent'
                      }}
                      className="sidebar-item-hover"
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>

      <style jsx global>{`
        .sidebar-home-hover:hover {
          transform: scale(1.02);
          box-shadow: 0 5px 15px rgba(0,0,0,0.05);
        }
        .sidebar-item-hover:hover {
          background: white !important;
          color: black !important;
          border-color: #eee !important;
          transform: translateX(4px);
          box-shadow: 0 4px 10px rgba(0,0,0,0.02);
        }
      `}</style>
    </aside>
  );
}
