# Resolución de Errores: Identificadores y Seguridad del Webhook

Si tu servidor ya conecta (el "apretón de manos" funciona) pero los mensajes no se procesan o dan errores de seguridad, es vital entender la diferencia entre los distintos identificadores de verificación que exige Meta.

---

## 1. El Token de Verificación (Verify Token - GET)
Este es el "Identificador de Verificación" inicial. 
*   **Función**: Se usa solo **UNA VEZ** para que Meta eche un vistazo a tu servidor y vea si respondes correctamente.
*   **Ubicación**: Tú inventas una palabra (ej: `hola`) y la pones tanto en tu código (en el `.env`) como en el campo "Token de verificación" en el panel de Facebook Developers.

---

## 2. Firma HMAC (X-Hub-Signature-256 - POST)
Este es el **Identificador de Verificación de Integridad**. Meta lo envía en la cabecera de cada mensaje que te llega por POST.

*   **Función**: Sirve para que tu servidor esté 100% seguro de que el mensaje viene de los servidores oficiales de Meta y no de un tercero malintencionado.
*   **Clave Secreta**: Para verificar esta firma, necesitas el **App Secret** (Clave secreta de la app) que encuentras en *Configuración -> Básica* en tu panel de Meta.
*   **Error Común ❌**: Si tu backend tiene activada la validación de firma pero no tienes configurado el App Secret correcto, el servidor rechazará todos los mensajes entrantes (dará error 401 o 403) aunque la conexión inicial GET haya funcionado.

---

## 3. Identificador de Aplicación (App ID)
En algunos frameworks avanzados, se pide el **App ID** como identificador de seguridad adicional. 
*   Asegúrate de que el `APP_ID` configurado en tu código coincida exactamente con el número que aparece en la parte superior de tu panel de Meta Developers.

---

## 4. Checklist de Seguridad (Por qué falla la entrega del mensaje)
Si la URL valida (GET funciona) pero no recibes mensajes (POST falla):

1.  [ ] **Firma Inválida**: Estás validando la firma `x-hub-signature-256` con un App Secret incorrecto o caducado.
2.  [ ] **Suscripción de Webhook**: Validar la URL no activa los mensajes. Debes entrar en **WhatsApp -> Configuración de Webhook -> Administrar** y suscribirte manualmente al campo `messages`. Si no estás suscrito, Meta no te mandará nada aunque la URL sea válida.
3.  [ ] **Body Parser**: Asegúrate de que tu servidor esté configurado para leer el cuerpo de la petición (Payload) como un flujo de datos (Stream) si vas a validar la firma HMAC.

---

## 5. Resumen de Identificadores (No confundir)
*   **Verify Token**: Se usa para la "Prueba inicial" (GET). Es una palabra inventada por ti.
*   **App Secret / Firma**: Se usa para validar cada mensaje entrante (POST). Es un código largo generado por Meta.
*   **Hub Challenge**: Es un número aleatorio que Meta te manda en el GET para que tú se lo devuelvas; es el "reto" de la verificación.
