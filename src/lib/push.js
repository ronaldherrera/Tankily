// Notificaciones push en este dispositivo (la Edge Function `push` las envía; public/sw.js las muestra)
import { supabase } from './supabase';
import { CLAVE_PUSH } from './clavePush';
import { enModoApp, plataforma } from './instalarApp';

// 'activas', 'inactivas', 'bloqueadas' (permiso denegado en el navegador), 'instalar' (iPhone/iPad:
// solo funcionan desde la app añadida a la pantalla de inicio) o 'no' (navegador sin soporte)
export async function estadoPush() {
  if (!CLAVE_PUSH) return 'no';
  if (plataforma() === 'ios' && !enModoApp()) return 'instalar';
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) return 'no';
  if (Notification.permission === 'denied') return 'bloqueadas';
  const registro = await navigator.serviceWorker.getRegistration('/');
  const sub = await registro?.pushManager.getSubscription();
  return sub && Notification.permission === 'granted' ? 'activas' : 'inactivas';
}

// Pide permiso, suscribe este navegador y lo guarda en la cuenta. Devuelve el estado final.
export async function activarPush() {
  const permiso = await Notification.requestPermission();
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueadas' : 'inactivas';
  // En producción AppShell ya registra el service worker; aquí también, para poder probarlo en local
  const registro = await navigator.serviceWorker.register('/sw.js');
  await navigator.serviceWorker.ready;
  const sub = await registro.pushManager.getSubscription()
    || await registro.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: CLAVE_PUSH });
  const { endpoint, keys } = sub.toJSON();
  const { error } = await supabase.rpc('guardar_push', { p_endpoint: endpoint, p_p256dh: keys.p256dh, p_auth: keys.auth });
  if (error) { await sub.unsubscribe(); throw error; }
  return 'activas';
}

export async function desactivarPush() {
  const registro = await navigator.serviceWorker.getRegistration('/');
  const sub = await registro?.pushManager.getSubscription();
  if (sub) {
    await supabase.from('push_suscripciones').delete().eq('endpoint', sub.endpoint);
    await sub.unsubscribe();
  }
  return 'inactivas';
}
