import fs from 'fs';
import path from 'path';
import { wikiTankTree } from '@/lib/wikiData';
import ExplorerClient from './ExplorerClient';

// Función para encontrar el nodo en el árbol basado en el array de slugs
function findNodeByPath(nodes, pathArray) {
  if (!pathArray || pathArray.length === 0) return null;
  const currentSlug = pathArray[0];
  const node = nodes.find(n => n.slug === currentSlug);
  
  if (!node) return null;
  if (pathArray.length === 1) return node;
  
  return findNodeByPath(node.children, pathArray.slice(1));
}

// Generar todos los caminos posibles para exportación estática
export async function generateStaticParams() {
  const paths = [];
  
  function collectPaths(nodes, currentPath = []) {
    for (const node of nodes) {
      const nodePath = [...currentPath, node.slug];
      paths.push({ path: nodePath });
      if (node.children) {
        collectPaths(node.children, nodePath);
      }
    }
  }
  
  collectPaths(wikiTankTree);
  return paths;
}

export default async function WikiExplorerPage({ params }) {
  const { path: pathArray } = await params;
  const currentNode = findNodeByPath(wikiTankTree, pathArray);

  if (!currentNode) {
    return <div>Sección no encontrada</div>;
  }

  // Leer contenido de todos los archivos Markdown si existen
  let content = '';
  if (currentNode.contentFiles && currentNode.contentFiles.length > 0) {
    const contents = currentNode.contentFiles.map(file => {
      const fullPath = path.join(process.cwd(), 'WikiTank', file);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath, 'utf8');
      }
      return '';
    });
    content = contents.filter(c => c).join('\n\n---\n\n');
  }

  return (
    <ExplorerClient 
      currentNode={currentNode} 
      pathArray={pathArray} 
      content={content} 
    />
  );
}
