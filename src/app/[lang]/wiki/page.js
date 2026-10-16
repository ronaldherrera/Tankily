"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { wikiTankTree } from '@/lib/wikiData';

export default function WikiIndex() {
  const contentTree = useMemo(() => {
    // El Glosario se ha mudado al botón interactivo flotante (GlossaryWidget), lo ocultamos del listado base.
    return wikiTankTree.filter(node => node.slug !== 'glosario');
  }, []);

  return (
    <div className="wiki-container" style={{ paddingBottom: '8rem', minHeight: '100vh' }}>
      {/* Header Section */}
      <div style={{ 
        padding: '4rem 0 3rem 0',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem'
      }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'baseline', 
          gap: '1.5rem',
          flexWrap: 'wrap'
        }}>
          <h1 style={{ 
            fontSize: 'max(4vw, 3rem)', 
            fontWeight: '950', 
            letterSpacing: '-4px', 
            lineHeight: '0.9', 
            textTransform: 'uppercase',
            margin: 0,
            color: '#000'
          }}>
            WIKI<span style={{ color: '#e0e0e0' }}>TANK</span>
          </h1>
          <div style={{ 
            height: '2px', 
            flex: 1, 
            background: 'linear-gradient(to right, #eee, transparent)',
            alignSelf: 'center',
            minWidth: '50px'
          }} />
        </div>
        
        <p style={{ 
          fontSize: '1.25rem', 
          color: '#666', 
          maxWidth: '600px', 
          lineHeight: '1.6',
          fontWeight: '450',
          margin: 0
        }}>
          Accede al conocimiento técnico más profundo del acuarismo moderno. Guías, química, biología y especies en un solo lugar.
        </p>
      </div>

      {/* Grid Content */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2.5rem'
      }}>
        {contentTree.map((node, idx) => (
          <Link 
            key={idx} 
            href={`/wiki/explorer/${node.slug}`}
            style={{
              position: 'relative',
              background: '#fff',
              borderRadius: '32px',
              height: '240px',
              overflow: 'hidden',
              textDecoration: 'none',
              transition: 'all 0.5s cubic-bezier(0.19, 1, 0.22, 1)',
              border: '1px solid #f0f0f0',
              display: 'block',
              boxShadow: '0 4px 6px rgba(0,0,0,0.02)'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.borderColor = '#000';
              e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.1)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.borderColor = '#f0f0f0';
              e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.02)';
            }}
          >
            {/* Background Image/Fallback */}
            {node.previewImage && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                backgroundImage: `url("${encodeURI(`/wiki-media/${node.previewImage}`)}")`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
              }} />
            )}
            {!node.previewImage && (
              <div style={{
                position: 'absolute',
                top: 0, left: 0, right: 0, bottom: 0,
                background: '#f8f8f8',
              }} />
            )}
            
            {/* Overlay Gradient */}
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              background: node.previewImage 
                ? 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)'
                : 'linear-gradient(to top, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 100%)'
            }} />

            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '2rem', zIndex: 2 }}>
              <span style={{ 
                display: 'block', fontSize: '0.75rem', fontWeight: '800', 
                letterSpacing: '2px', textTransform: 'uppercase',
                color: node.previewImage ? 'rgba(255,255,255,0.6)' : '#aaa',
                marginBottom: '0.5rem'
              }}>
                SECCIÓN
              </span>
              <h2 style={{ 
                fontSize: '1.8rem', fontWeight: '900', 
                color: node.previewImage ? '#fff' : '#000',
                margin: 0, letterSpacing: '-1px', lineHeight: '1.1'
              }}>
                {node.title}
              </h2>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
