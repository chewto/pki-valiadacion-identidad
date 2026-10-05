# Prompt para el equipo Backend — Validación de ubicación obligatoria y bloqueo anti-VPN en la firma

> Copia y pega el contenido de abajo tal cual.

---

**Asunto: Contrato API — Ubicación obligatoria + bloqueo anti-VPN en la firma digital**

Hola equipo,

Del lado frontend (SPA React/Vite) ya está implementada la captura de geolocalización, el envío de la ubicación en la petición de firma y la UI de bloqueo. Para cerrar la funcionalidad necesitamos construir/confirmar lo siguiente en `validacion-back`:

### 1. Endpoint nuevo: configuración del documento (ruta PLACEHOLDER, a confirmar)

```
GET /validacion-back/validation/document-config
```

- **Query params:** `hash` (flujo standalone) o `efirmaId` (flujo embebido). El frontend agrega `country` automáticamente.
- **Auth:** Bearer JWT (mismo interceptor que el resto de endpoints).
- **Response 200:**

```json
{
  "require_location_validation": true,
  "block_on_vpn": true,
  "location_radius_meters": 500
}
```

- `require_location_validation` (boolean): si es `true`, el frontend **no** enviará la firma sin haber obtenido GPS fresco.
- `block_on_vpn` (boolean): política anti-VPN del documento. **Solo gobierna al backend**: si es `false`, el backend NO debe rechazar por `VPN_DETECTED` (el frontend no mostrará ningún mensaje de VPN); si es `true`, debe rechazar cuando detecte VPN/proxy.
- `location_radius_meters` (opcional, number en metros): radio de tolerancia geográfica.
- Si el endpoint falla, el frontend asume `false/false` (fail-open); el backend sigue siendo la autoridad.

### 2. Endpoint de firma: aceptar `location` en el payload

Los POST existentes de firma (`/validation/standalone` y `/validation/type-3`) ahora pueden recibir:

```json
{
  "...campos actuales...": "...",
  "location": {
    "latitude": 14.6349,
    "longitude": -90.5069,
    "accuracy": 12.5
  }
}
```

Validaciones requeridas cuando `require_location_validation = true`:

- Si **no viene** `location` → rechazar con **400 `LOCATION_REQUIRED`**.
- Si `accuracy` excede el radio permitido o las coordenadas caen fuera de la región/polígono esperado → **403 `LOCATION_MISMATCH`**.
- **Tipos:** `latitude`/`longitude` number (WGS84 decimal), `accuracy` number en metros.

### 3. Detección anti-VPN/proxy (lógica del backend)

- Evaluar la IP del firmante (reputación, rangos de datacenter/VPN/proxy conocidos, geolocalización de IP vs. `location` enviado).
- Si `block_on_vpn = true` y se detecta VPN/proxy → **403 `VPN_DETECTED`** (o `PROXY_DETECTED` si distingues ambos casos).
- Si `block_on_vpn = false` → no bloquear por este motivo.
- Si la IP no es resoluble/inaccesible → **403 `LOCATION_UNAVAILABLE`**.

### 4. Contrato de errores (obligatorio)

Todo rechazo 4xx/5xx debe responder con este body:

```json
{
  "error": {
    "code": "VPN_DETECTED",
    "message": "Se detectó uso de VPN. Desactíala para continuar."
  }
}
```

| Código | HTTP | Acción del frontend |
|---|---|---|
| `VPN_DETECTED` / `PROXY_DETECTED` | 403 | Modal "Desactiva tu VPN para continuar" + botón Reintentar |
| `LOCATION_REQUIRED` | 400 | Modal de permiso GPS; el frontend aprende que exige ubicación y reintenta con GPS |
| `LOCATION_MISMATCH` | 403 | Modal "Tu ubicación no coincide con la región permitida" |
| `LOCATION_UNAVAILABLE` | 403 | Modal "No pudimos verificar tu ubicación" |

**Importante:** el código va en `error.code` (no en la raíz del body). El frontend tolera `{ "code", "message" }` plano como fallback, y ante 403 sin código asume `VPN_DETECTED` / ante 400 sin código asume `LOCATION_REQUIRED`.

### 5. Criterios de aceptación

1. `document-config` devuelve ambos flags según la configuración del documento.
2. Firma sin `location` cuando es obligatoria → 400 `LOCATION_REQUIRED`.
3. Firma con VPN detectada y `block_on_vpn=true` → 403 `VPN_DETECTED`; con `block_on_vpn=false` → procesa normalmente.
4. Coordenadas fuera de la región permitida → 403 `LOCATION_MISMATCH`.
5. Todas las respuestas de error cumplen el shape `{ error: { code, message } }`.

### Notas para coordinar

- La ruta `validation/document-config` es **placeholder** (marcada como TODO en `src/nucleo/api-urls/urls.ts` del frontend): confirmadnos la definitiva y la actualizamos.
- El frontend envía `location` también de forma opcional cuando ya la capturó, aunque no sea obligatoria; si preferís ignorarla en ese caso, simplemente no la validéis.
- Avisad cuando los endpoints estén en un entorno de pruebas para hacer la integración end-to-end.
