import fs from 'fs';
import path from 'path';

function toSlug(str) {
  return str.toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, '-');
}

function findFuzzyPath(currentBase, segments) {
  if (segments.length === 0) return currentBase;
  
  const segment = decodeURIComponent(segments[0]);
  const remaining = segments.slice(1);
  
  const exactPath = path.join(currentBase, segment);
  if (fs.existsSync(exactPath)) {
    return findFuzzyPath(exactPath, remaining);
  }
  
  const variations = [
    segment.replace(/\s+/g, '_'),
    segment.replace(/_/g, ' '),
    segment.replace(/\s+/g, '-'),
    segment.replace(/-/g, ' '),
    segment.replace(/-/g, '_')
  ];
  
  if (fs.existsSync(currentBase)) {
    const items = fs.readdirSync(currentBase);
    
    for (const variant of variations) {
       const match = items.find(i => i.toLowerCase() === variant.toLowerCase());
       if (match) {
         return findFuzzyPath(path.join(currentBase, match), remaining);
       }
    }
    
    const caseInsensitiveMatch = items.find(i => i.toLowerCase() === segment.toLowerCase());
    if (caseInsensitiveMatch) {
      return findFuzzyPath(path.join(currentBase, caseInsensitiveMatch), remaining);
    }

    const segmentSlug = toSlug(segment);
    const slugMatch = items.find(i => toSlug(i) === segmentSlug);
    if (slugMatch) {
      return findFuzzyPath(path.join(currentBase, slugMatch), remaining);
    }
  }
  
  return null;
}

const pathArray = ['Acuarios', 'Acuario plantado', 'Acuario_plantado.webp'];
const wikiPath = findFuzzyPath(path.join(process.cwd(), 'WikiTank'), pathArray);
console.log('wikiPath:', wikiPath);
