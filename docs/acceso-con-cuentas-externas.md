# Acceso con Google, Apple, Facebook y Microsoft

La web ya está preparada: los botones "Continuar con…" aparecen solos en las pantallas de entrar y de registro en cuanto un proveedor se activa en Supabase. No hay que tocar código.

Para cada proveedor hay que crear una "app" en su consola de desarrollador, copiar dos datos (ID de cliente y secreto) y pegarlos en Supabase.

**Dirección de vuelta (callback)** que piden todas las consolas:

```
https://ivizkgmogzvscygcxepy.supabase.co/auth/v1/callback
```

## 0. Antes de nada (una sola vez)

En Supabase → **Authentication → URL Configuration**:

- **Site URL**: `https://tankily.com`
- **Redirect URLs**: añade `https://tankily.com/**` (y `http://localhost:3210/**` para probar en local).

Sin esto, después de entrar con Google te devolvería a una página de error.

## 1. Google (prioridad máxima: se usa en todo el mundo)

1. Entra en https://console.cloud.google.com → crea un proyecto "Tankily".
2. **APIs y servicios → Pantalla de consentimiento de OAuth**: tipo "Externo", nombre "Tankily", logotipo, email de soporte, dominio `tankily.com` y enlaces a la política de privacidad (`https://tankily.com/es/legal/privacidad/`) y a las normas.
3. **Credenciales → Crear credenciales → ID de cliente de OAuth** → tipo "Aplicación web".
   - Orígenes autorizados: `https://tankily.com`
   - URI de redireccionamiento: la dirección de vuelta de arriba.
4. Copia el **ID de cliente** y el **secreto**.
5. Supabase → **Authentication → Providers → Google** → actívalo y pega los dos datos.

Coste: gratis.

## 2. Apple (muy usado en iPhone; obligatorio si algún día hay app de iOS)

Requiere una cuenta de **Apple Developer** (99 $/año).

1. https://developer.apple.com → Certificates, Identifiers & Profiles.
2. Crea un **App ID** con "Sign in with Apple" activado.
3. Crea un **Services ID** (será el "ID de cliente"), activa "Sign in with Apple" y configura el dominio `tankily.com` y la dirección de vuelta.
4. Crea una **Key** con "Sign in with Apple" y descarga el archivo `.p8`.
5. Supabase → **Providers → Apple**: pega el Services ID, el Team ID, el Key ID y el contenido del `.p8` (Supabase genera el secreto).

Nota: Apple permite al usuario ocultar su email real (te llega una dirección @privaterelay.appleid.com). Funciona igual.

## 3. Facebook (fuerte en Latinoamérica, Brasil y Polonia)

1. https://developers.facebook.com → **Crear app** → tipo "Consumidor" / caso de uso "Autenticar usuarios con Facebook Login".
2. En **Facebook Login → Configuración**: añade la dirección de vuelta en "URI de redireccionamiento de OAuth válidos".
3. **Configuración → Básica**: copia el **Identificador de la app** y la **Clave secreta**; rellena la URL de la política de privacidad y la de eliminación de datos (puede ser la de ajustes, donde se borra la cuenta).
4. Pasa la app a modo **Activo** (en modo desarrollo solo pueden entrar los administradores).
5. Supabase → **Providers → Facebook**: pega ID y secreto.

Coste: gratis. Meta puede pedir verificar la empresa para algunos permisos; para nombre, email y foto no suele hacer falta.

## 4. Microsoft (Outlook, Hotmail y cuentas de trabajo; útil en Alemania y Países Bajos)

1. https://portal.azure.com → **Microsoft Entra ID → Registros de aplicaciones → Nuevo registro**.
   - Tipos de cuenta: "Cuentas de cualquier directorio organizativo y cuentas personales de Microsoft".
   - URI de redirección (Web): la dirección de vuelta.
2. Copia el **ID de aplicación (cliente)**.
3. **Certificados y secretos → Nuevo secreto de cliente** → copia el **valor**.
4. Supabase → **Providers → Azure**: pega ID y secreto; deja la URL del tenant vacía (o `https://login.microsoftonline.com/common`).

Coste: gratis.

## Qué pasa con las cuentas

- Si alguien ya tenía cuenta con email y contraseña y entra con Google usando el mismo email (verificado), Supabase une las dos: es la misma cuenta.
- El perfil nuevo hereda el nombre y la foto de la cuenta externa, y el nombre de usuario se genera a partir del nombre real ("Laura Ferrer" → `lauraferrer`). Se puede cambiar en Editar perfil.
- **Enlace sin contraseña**: ya funciona sin configurar nada. Envía un enlace al email de una cuenta existente.

## Legal

Añade a la política de privacidad que, si eliges entrar con Google, Apple, Facebook o Microsoft, recibimos de ellos tu nombre, email y foto de perfil, y que puedes desvincularlos borrando la cuenta.
