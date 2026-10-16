// Palabras clave de un título para buscar contenido parecido (hilos del foro)
// Palabras que no ayudan a encontrar hilos parecidos (aparecen en casi todos los títulos)
const VACIAS = new Set(['para', 'como', 'cómo', 'este', 'esta', 'estos', 'estas', 'tengo', 'porque', 'cuál', 'cual', 'sobre', 'tiene', 'puedo', 'hacer', 'algo', 'alguien', 'ayuda', 'duda', 'acuario', 'pecera', 'tanque',
  'cuántos', 'cuantos', 'cuántas', 'cuantas', 'cuánto', 'cuanto', 'necesito', 'problema', 'problemas', 'pregunta', 'mejor', 'normal', 'pasa', 'pasando',
  'with', 'have', 'from', 'that', 'this', 'what', 'help', 'aquarium', 'tank', 'need', 'does', 'should', 'many', 'much', 'problem', 'best']);

// Palabras útiles del título (4+ letras), sin caracteres que rompan el filtro de PostgREST
export function palabrasClave(titulo) {
  return [...new Set(titulo.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((p) => p.length >= 4 && !VACIAS.has(p)))].slice(0, 5);
}
