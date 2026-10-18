// Nombres de usuario: 3–20 caracteres en minúsculas, números, guion bajo, puntos y guiones; el punto y el
// guion no pueden ir al principio ni al final, ni dos seguidos ("..", "--", ".-"). La base de datos exige lo mismo
// (perfiles_usuario_check) y las @menciones usan MENCION, que no se come el punto final de una frase.
export const usuarioValido = (u = '') => /^[a-z0-9_.-]{3,20}$/.test(u) && !/^[.-]|[.-]$|[.-]{2}/.test(u);

// "@nombre" dentro de un texto: empieza y acaba en letra, número o guion bajo (sin el punto o guion de fin de frase)
export const MENCION = '@[a-zA-Z0-9_][a-zA-Z0-9_.-]{1,18}[a-zA-Z0-9_]';
