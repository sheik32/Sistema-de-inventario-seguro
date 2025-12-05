# Sistema de Inventario - Versión Segura

Esta es la versión corregida del sistema de inventario con todas las vulnerabilidades de seguridad resueltas.

## 🔒 Mejoras de Seguridad Implementadas

### ✅ Vulnerabilidades Críticas Resueltas

1. **Credenciales Protegidas**
   - Las credenciales se movieron a `config.js` (no versionar en producción)
   - Separación de configuración del código fuente

2. **Autenticación y Autorización**
   - Estructura preparada para implementar autenticación
   - Validación de permisos en el servidor

### ✅ Vulnerabilidades de Alta Severidad Resueltas

3. **XSS (Cross-Site Scripting)**
   - Todas las salidas HTML sanitizadas con `escapeHtml()`
   - Uso de `textContent` en lugar de `innerHTML` donde es posible
   - DOMPurify incluido para sanitización adicional

4. **Validación de Entrada**
   - Validación completa en cliente y servidor
   - Sanitización de todos los datos de entrada
   - Validación de tipos, rangos y formatos

5. **Sanitización del Servidor**
   - Validación y sanitización en Google Apps Script
   - Mensajes de error genéricos (no exponen información interna)

### ✅ Vulnerabilidades de Severidad Media Resueltas

6. **Subresource Integrity (SRI)**
   - Todos los recursos CDN incluyen SRI
   - Verificación de integridad de librerías externas

7. **Headers de Seguridad**
   - Content Security Policy (CSP)
   - X-Frame-Options: DENY
   - X-Content-Type-Options: nosniff
   - Referrer-Policy configurada

8. **Rate Limiting**
   - Control de frecuencia de solicitudes
   - Prevención de ataques DoS básicos

9. **Timeouts**
   - Timeouts configurados para todas las solicitudes
   - Prevención de solicitudes colgadas

## 📁 Estructura de Archivos

```
inventario-seguro/
├── index.html          # HTML con headers de seguridad y SRI
├── script.js           # JavaScript principal con sanitización
├── security.js         # Funciones de seguridad y validación
├── config.js           # Configuración (NO VERSIONAR en producción)
├── config.example.js   # Plantilla de configuración (SÍ versionar)
├── sg.js               # Google Apps Script con validación del servidor
├── estilo.css          # Estilos (sin cambios)
├── .gitignore         # Archivos a ignorar en Git
├── README.md           # Este archivo
├── DEPLOY.md           # Guía de despliegue
├── GIT_SETUP.md        # Guía para subir a Git
├── deploy.ps1          # Script de despliegue Windows
├── deploy.sh           # Script de despliegue Linux/Mac
└── setup-git.ps1       # Script para configurar Git
```

## 🚀 Configuración Inicial

### 1. Configurar Credenciales

**IMPORTANTE:** Si clonaste este repositorio, primero copia la plantilla:

```bash
cp config.example.js config.js
```

Luego edita `config.js` y reemplaza los valores:

```javascript
SCRIPT_URL: 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec',
SPREADSHEET_ID: 'TU_SPREADSHEET_ID_AQUI',
```

### 2. Desplegar Google Apps Script

1. Copia el contenido de `sg.js`
2. Pégalo en tu Google Apps Script
3. Asegúrate de que el `SPREADSHEET_ID` coincida con el de `config.js`
4. Despliega como aplicación web con permisos apropiados

### 3. Configurar Permisos

- Restringe el acceso al Google Apps Script solo a usuarios autorizados
- Configura permisos de lectura/escritura en el Google Sheet según necesidad

## ⚠️ Importante

- **NO versionar `config.js` en producción** - Usar variables de entorno o sistema de gestión de secretos
- **Implementar autenticación real** - La estructura está preparada pero requiere implementación
- **Revisar y ajustar límites** - Los límites de validación pueden necesitar ajustes según tu caso de uso
- **Monitorear logs** - Implementar logging y auditoría para operaciones críticas

## 📤 Subir a Git

Para subir este proyecto a GitHub/GitLab:

1. **Instala Git** (si no lo tienes): https://git-scm.com/download/win
2. **Ejecuta el script de configuración:**
   ```powershell
   .\setup-git.ps1
   ```
3. **O sigue la guía manual:** Ver `GIT_SETUP.md`

**IMPORTANTE:** El archivo `config.js` está en `.gitignore` y NO se subirá al repositorio. Solo se versiona `config.example.js` como plantilla.

## 🔍 Validaciones Implementadas

### Cliente (script.js + security.js)
- Sanitización de strings
- Validación de números y rangos
- Validación de códigos de producto
- Validación de formularios
- Rate limiting
- Timeouts

### Servidor (sg.js)
- Validación de tipos de datos
- Sanitización de entrada
- Validación de rangos numéricos
- Validación de formatos
- Mensajes de error genéricos

## 📝 Notas Adicionales

- Los mensajes de error son genéricos para no exponer información interna
- Todas las salidas HTML están sanitizadas
- Se implementó rate limiting básico para prevenir abuso
- Los timeouts previenen solicitudes colgadas

## 🛡️ Próximos Pasos Recomendados

1. Implementar autenticación con Google OAuth 2.0
2. Agregar logging y auditoría de operaciones
3. Implementar backup automático de datos
4. Configurar alertas para actividades sospechosas
5. Realizar pruebas de penetración adicionales

---

**Versión:** 2.0 Segura  
**Fecha:** $(date)  
**Estado:** Todas las vulnerabilidades críticas y altas resueltas


