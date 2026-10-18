// Mismos requisitos que Supabase Auth (Authentication → Providers → Email): mínimo 8 caracteres
// con minúsculas, mayúsculas y números. Si no coinciden, Supabase rechaza la contraseña con un error en inglés.
export const contrasenaValida = (p = '') => p.length >= 8 && /[a-z]/.test(p) && /[A-Z]/.test(p) && /\d/.test(p);
