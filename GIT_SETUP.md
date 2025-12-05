# Guía para Subir el Proyecto a Git

## 📋 Requisitos Previos

1. **Instalar Git** (si no lo tienes):
   - Descarga desde: https://git-scm.com/download/win
   - O instala desde: `winget install Git.Git`
   - Reinicia PowerShell después de instalar

2. **Crear cuenta en GitHub/GitLab/Bitbucket** (si no tienes):
   - GitHub: https://github.com
   - GitLab: https://gitlab.com
   - Bitbucket: https://bitbucket.org

---

## 🚀 Pasos para Subir el Proyecto

### Paso 1: Verificar que Git esté instalado

Abre PowerShell o CMD y ejecuta:
```bash
git --version
```

Si muestra una versión, Git está instalado. Si no, instálalo primero.

### Paso 2: Configurar Git (solo la primera vez)

```bash
git config --global user.name "Tu Nombre"
git config --global user.email "tu-email@ejemplo.com"
```

### Paso 3: Inicializar el Repositorio

Abre PowerShell en la carpeta `inventario-seguro` y ejecuta:

```bash
# Navegar a la carpeta del proyecto
cd inventario-seguro

# Inicializar repositorio Git
git init

# Verificar que config.js NO se va a subir (está en .gitignore)
git status
```

**IMPORTANTE:** Verifica que `config.js` aparezca en "Untracked files" pero que NO se agregue cuando hagas `git add .`

### Paso 4: Agregar Archivos

```bash
# Agregar todos los archivos (config.js será ignorado automáticamente)
git add .

# Verificar qué se va a subir
git status
```

**Debes ver:**
- ✅ index.html
- ✅ script.js
- ✅ security.js
- ✅ estilo.css
- ✅ sg.js
- ✅ config.example.js
- ✅ README.md
- ✅ DEPLOY.md
- ✅ .gitignore
- ❌ config.js (NO debe aparecer)

### Paso 5: Hacer el Primer Commit

```bash
git commit -m "Initial commit: Sistema de inventario seguro con todas las vulnerabilidades resueltas"
```

### Paso 6: Crear Repositorio en GitHub

1. Ve a https://github.com
2. Clic en el botón "+" (arriba derecha) → "New repository"
3. Nombre: `inventario-seguro` (o el que prefieras)
4. Descripción: "Sistema de inventario seguro con Google Sheets"
5. **NO marques** "Initialize this repository with a README"
6. Clic en "Create repository"

### Paso 7: Conectar y Subir

GitHub te mostrará comandos. Ejecuta estos (reemplaza `tu-usuario` con tu usuario de GitHub):

```bash
# Agregar el repositorio remoto
git remote add origin https://github.com/tu-usuario/inventario-seguro.git

# Cambiar a la rama main (si es necesario)
git branch -M main

# Subir el código
git push -u origin main
```

Te pedirá autenticación. Puedes usar:
- **Personal Access Token** (recomendado): https://github.com/settings/tokens
- O autenticación por navegador

---

## 🔒 Seguridad: Verificar que config.js NO se suba

### Antes de hacer push, verifica:

```bash
# Ver qué archivos están siendo rastreados
git ls-files

# config.js NO debe aparecer en la lista
```

### Si config.js aparece accidentalmente:

```bash
# Remover del índice (pero mantener el archivo local)
git rm --cached config.js

# Verificar que .gitignore lo ignore
git status

# Hacer commit de la corrección
git commit -m "Remove config.js from tracking"
```

---

## 📝 Estructura del Repositorio

Tu repositorio debe tener esta estructura:

```
inventario-seguro/
├── .gitignore              ✅ (ignora config.js)
├── config.example.js       ✅ (plantilla sin credenciales)
├── config.js               ❌ (NO se sube - está en .gitignore)
├── DEPLOY.md               ✅
├── GIT_SETUP.md            ✅
├── README.md                ✅
├── deploy.ps1               ✅
├── deploy.sh                ✅
├── estilo.css               ✅
├── index.html               ✅
├── script.js                ✅
├── security.js              ✅
└── sg.js                    ✅
```

---

## 🔄 Comandos Útiles para el Futuro

### Ver cambios:
```bash
git status
```

### Agregar cambios:
```bash
git add .
git commit -m "Descripción de los cambios"
git push
```

### Actualizar desde el repositorio:
```bash
git pull
```

### Ver historial:
```bash
git log
```

---

## ⚠️ IMPORTANTE: Nunca Subas Credenciales

### ✅ SÍ hacer:
- Subir `config.example.js` (sin credenciales reales)
- Documentar cómo configurar `config.js`
- Usar variables de entorno en producción

### ❌ NO hacer:
- Subir `config.js` con credenciales reales
- Committear tokens o API keys
- Compartir credenciales en issues o PRs

### Si accidentalmente subiste credenciales:

1. **CAMBIA LAS CREDENCIALES INMEDIATAMENTE**
2. Remueve el archivo del historial:
   ```bash
   git filter-branch --force --index-filter \
     "git rm --cached --ignore-unmatch config.js" \
     --prune-empty --tag-name-filter cat -- --all
   ```
3. Fuerza el push:
   ```bash
   git push origin --force --all
   ```

---

## 🎯 Alternativa: Usar GitHub Desktop

Si prefieres una interfaz gráfica:

1. Descarga GitHub Desktop: https://desktop.github.com
2. Abre el proyecto en GitHub Desktop
3. Haz clic en "Publish repository"
4. GitHub Desktop manejará todo automáticamente

---

## 📞 Solución de Problemas

### Error: "fatal: not a git repository"
```bash
# Asegúrate de estar en la carpeta correcta
cd inventario-seguro
git init
```

### Error: "fatal: remote origin already exists"
```bash
# Ver el remoto actual
git remote -v

# Remover y agregar de nuevo
git remote remove origin
git remote add origin https://github.com/tu-usuario/inventario-seguro.git
```

### Error de autenticación
- Usa Personal Access Token en lugar de contraseña
- O configura SSH keys: https://docs.github.com/en/authentication/connecting-to-github-with-ssh

---

**¡Listo!** Tu proyecto estará en Git y podrás compartirlo de forma segura sin exponer credenciales.


