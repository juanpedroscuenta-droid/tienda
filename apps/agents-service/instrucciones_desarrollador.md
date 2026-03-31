# Guía técnica para el desarrollador: Preparación del Túnel

Esta guía explica cómo levantar el entorno local y exponerlo para la integración. El usuario se encargará de configurar Meta personalmente.

## 1. Levantar el Servidor
Asegúrate de tener las dependencias instaladas y el archivo `.env` configurado.
```bash
node index.js
```
*El servidor debe estar activo en el puerto **3000**.*

## 2. Abrir el Túnel Seguro
Para que el servidor sea accesible externamente, ejecuta:
```bash
npx cloudflared tunnel --url http://localhost:3000
```

## 3. Configuración del Token de Verificación
En el archivo `.env`, existe una variable llamada `VERIFY_TOKEN`.
```bash
VERIFY_TOKEN=omnivendo_agent_2024
```
**¿Qué es esto?** Es una "contraseña" compartida. Cuando el administrador configure el Webhook en Meta, Facebook enviará este token al servidor. El servidor (`index.js`) solo aceptará la conexión si el token que envía Meta coincide exactamente con el que está en el archivo `.env`.

## 4. Entrega de Información
Una vez que el túnel esté arriba, busca la URL que termina en `.trycloudflare.com`.

**IMPORTANTE:** Pasa esa URL exacta al encargado de Meta. Él la usará junto con el `VERIFY_TOKEN` mencionado arriba para activar el sistema.

## Solución de Problemas
* **Meta da error de verificación**: Revisa que `node index.js` esté corriendo y que la URL en Meta termine exactamente en `/webhook/meta/whatsapp`.
* **El túnel se cierra**: Si reinicias la terminal de Cloudflare, la URL cambiará y deberás actualizarla en el panel de Meta.
