export const CLAVE_TEMA = 'tk-tema';

// Se inyecta en <head> y se ejecuta antes de pintar: evita el destello del tema equivocado.
// También marca data-sesion si hay una sesión de Supabase guardada, para que la portada de
// visitantes (que va en el HTML estático por SEO) no se vea un instante a quien ya ha entrado.
export const SCRIPT_TEMA = `(function(){try{var p=localStorage.getItem('${CLAVE_TEMA}')||'oscuro';var t=p==='auto'?(matchMedia('(prefers-color-scheme: light)').matches?'claro':'oscuro'):p;document.documentElement.dataset.tema=t;}catch(e){document.documentElement.dataset.tema='oscuro';}
try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k.indexOf('sb-')===0&&k.slice(-11)==='-auth-token'){document.documentElement.dataset.sesion='1';break;}}}catch(e){}})();`;
