// Titular de Tankily, para el aviso legal y la política de privacidad (en los 8 idiomas).
// NIF y domicilio vacíos = no se muestran. Al empezar a facturar, la LSSI exige publicarlos:
// basta con rellenarlos aquí (un domicilio profesional u oficina virtual también vale).
export const TITULAR = {
  nombre: 'Ronald Simon Calzadilla Herrera',
  nif: '',
  domicilio: '',
  email: 'hola@ronaldherrera.es',
};

// "Nombre (NIF), domicilio", sin lo que esté vacío
export const identidadTitular = () =>
  [TITULAR.nombre + (TITULAR.nif ? ` (${TITULAR.nif})` : ''), TITULAR.domicilio].filter(Boolean).join(', ');
