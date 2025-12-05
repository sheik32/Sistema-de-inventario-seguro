# Guía de Despliegue - Sistema de Inventario Seguro

## 📋 Requisitos Previos

1. Cuenta de Google con acceso a:
   - Google Sheets
   - Google Apps Script
2. Un servidor web (opcional, para hosting estático)
3. Acceso a editar archivos de configuración

---

## 🚀 Opción 1: Despliegue Completo (Recomendado)

### Paso 1: Configurar Google Apps Script

1. **Crear un nuevo proyecto en Google Apps Script:**
   - Ve a https://script.google.com
   - Clic en "Nuevo proyecto"
   - Nombra el proyecto: "Inventario Backend"

2. **Pegar el código del servidor:**
   - Abre el archivo `sg.js` de esta carpeta
   - Copia TODO el contenido
   - Pégalo en el editor de Google Apps Script (reemplaza el código por defecto)

3. **Configurar el Spreadsheet ID:**
   - En `sg.js`, línea 4, reemplaza el `SPREADSHEET_ID` con el ID de tu Google Sheet
   - Para obtener el ID: abre tu Google Sheet y mira la URL:
     ```
     https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit
     ```

4. **Guardar el proyecto:**
   - Clic en el ícono de guardar (💾)
   - Nombra el proyecto si aún no lo has hecho

5. **Desplegar como aplicación web:**
   - Clic en "Desplegar" → "Nueva implementación"
   - Tipo: "Aplicación web"
   - Descripción: "Inventario API v2.0"
   - Ejecutar como: "Yo"
   - Quién tiene acceso: 
     - **Para desarrollo:** "Cualquiera" (permite acceso sin autenticación)
     - **Para producción:** "Solo yo" o "Cualquiera con cuenta de Google" (más seguro)
   - Clic en "Desplegar"
   - **COPIA LA URL** que aparece (algo como: `https://script.google.com/macros/s/.../exec`)

### Paso 2: Configurar el Cliente

1. **Editar config.js:**
   - Abre `config.js`
   - Reemplaza `TU_SCRIPT_ID_AQUI` con la URL completa que copiaste en el paso anterior
   - Reemplaza `TU_SPREADSHEET_ID_AQUI` con el ID de tu Google Sheet (el mismo del paso 1.3)

2. **Verificar que todos los archivos estén presentes:**
   ```
   inventario-seguro/
   ├── index.html
   ├── script.js
   ├── security.js
   ├── config.js (¡CONFIGURADO!)
   ├── estilo.css
   └── sg.js (ya desplegado en Google Apps Script)
   ```

### Paso 3: Desplegar Archivos Estáticos

#### Opción A: Google Sites (Gratis y Fácil)

1. Ve a https://sites.google.com
2. Crea un nuevo sitio
3. Inserta → "Insertar código HTML"
4. Sube los archivos o copia el contenido de `index.html`
5. Publica el sitio

#### Opción B: GitHub Pages (Gratis)

1. Crea un repositorio en GitHub
2. Sube todos los archivos EXCEPTO `config.js` (agrega `config.js` al `.gitignore`)
3. Ve a Settings → Pages
4. Selecciona la rama `main` y carpeta `/root`
5. Tu sitio estará en: `https://tu-usuario.github.io/tu-repo`

#### Opción C: Servidor Web Propio

1. Sube todos los archivos a tu servidor web
2. Asegúrate de que `index.html` esté en la raíz
3. Configura HTTPS (obligatorio para algunas funciones)
4. Accede a tu dominio

#### Opción D: Netlify/Vercel (Gratis)

1. Crea cuenta en Netlify o Vercel
2. Conecta tu repositorio de GitHub
3. Configura el build:
   - Build command: (dejar vacío)
   - Publish directory: `/` o la carpeta donde están los archivos
4. Despliega

### Paso 4: Configurar CORS (si es necesario)

Si tienes problemas de CORS, en Google Apps Script:

1. Ve a tu proyecto
2. Clic en "Desplegar" → "Gestionar implementaciones"
3. Edita la implementación
4. Asegúrate de que "Quién tiene acceso" permita las solicitudes desde tu dominio

---

## 🔧 Opción 2: Despliegue Local (Desarrollo)

### Para desarrollo local:

1. **Instalar un servidor local:**
   ```bash
   # Con Python
   python -m http.server 8000
   
   # O con Node.js (http-server)
   npx http-server -p 8000
   ```

2. **Abrir en el navegador:**
   - Ve a `http://localhost:8000`
   - Abre `index.html`

3. **Configurar config.js:**
   - Edita `config.js` con tus credenciales
   - Asegúrate de que el Google Apps Script esté desplegado

---

## ✅ Verificación Post-Despliegue

### Checklist:

- [ ] Google Apps Script desplegado y URL copiada
- [ ] `config.js` configurado con la URL del script
- [ ] `config.js` configurado con el Spreadsheet ID
- [ ] Archivos estáticos desplegados en servidor web
- [ ] La aplicación carga sin errores en la consola
- [ ] Puedes cargar categorías
- [ ] Puedes registrar productos
- [ ] Puedes hacer compras/ventas

### Pruebas de Seguridad:

1. **Abrir la consola del navegador (F12)**
2. Verificar que no hay errores
3. Intentar inyectar código en un campo de texto (debe ser sanitizado)
4. Verificar que las solicitudes usan HTTPS

---

## 🔒 Configuración de Seguridad Adicional

### Para Producción:

1. **Restringir acceso al Google Apps Script:**
   - En "Desplegar" → "Gestionar implementaciones"
   - Cambiar "Quién tiene acceso" a "Solo yo" o "Cualquiera con cuenta de Google"

2. **Configurar permisos del Google Sheet:**
   - Abre tu Google Sheet
   - Clic en "Compartir"
   - Solo da acceso a usuarios autorizados
   - El script debe tener permisos de edición

3. **Usar variables de entorno (avanzado):**
   - Para producción, considera usar un sistema de gestión de secretos
   - No versionar `config.js` con credenciales reales

---

## 🐛 Solución de Problemas

### Error: "No se pudieron cargar las categorías"
- Verifica que el Google Apps Script esté desplegado
- Verifica que la URL en `config.js` sea correcta
- Verifica los permisos del Google Sheet

### Error: "Acceso denegado"
- Verifica los permisos del Google Sheet
- Verifica la configuración de "Quién tiene acceso" en el despliegue

### Error CORS
- Asegúrate de que el dominio esté permitido en Google Apps Script
- Verifica que uses HTTPS en producción

### Los datos no se guardan
- Verifica que el Spreadsheet ID sea correcto
- Verifica que el Google Apps Script tenga permisos de edición en el Sheet

---

## 📞 Soporte

Si encuentras problemas:
1. Revisa la consola del navegador (F12)
2. Revisa los logs de Google Apps Script (Ver → Registros de ejecución)
3. Verifica que todos los pasos se hayan completado correctamente

---

**Última actualización:** $(date)



