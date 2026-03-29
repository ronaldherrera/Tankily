"use client";

import React from 'react';
import Link from 'next/link';

export default function Breadcrumbs({ path = [] }) {
  return (
    <nav style={{ 
      width: '100%',
      display: 'flex', 
      gap: '0.3rem', 
      fontSize: '0.65rem', 
      color: '#ccc', 
      marginBottom: 0, 
      alignItems: 'center', 
      fontWeight: '500', 
      textTransform: 'uppercase', 
      letterSpacing: '0.5px' 
    }}>
      <Link href="/wiki" style={{ textDecoration: 'none', color: '#999', transition: 'color 0.2s' }} onMouseEnter={(e) => e.target.style.color = '#000'} onMouseLeave={(e) => e.target.style.color = '#999'}>WIKITANK</Link>
      {path.map((segment, idx) => (
        <React.Fragment key={idx}>
          <span style={{ opacity: 0.3 }}>/</span>
          <Link 
            href={`/wiki/explorer/${path.slice(0, idx + 1).join('/')}`} 
            style={{ 
              textDecoration: 'none', 
              color: idx === path.length - 1 ? '#000' : '#999',
              fontWeight: idx === path.length - 1 ? '800' : '600',
              transition: 'color 0.2s'
            }}
            onMouseEnter={(e) => { if (idx !== path.length - 1) e.target.style.color = '#000' }}
            onMouseLeave={(e) => { if (idx !== path.length - 1) e.target.style.color = '#999' }}
          >
            {segment.replace(/-/g, ' ').toUpperCase()}
          </Link>
        </React.Fragment>
      ))}
    </nav>
  );
}
