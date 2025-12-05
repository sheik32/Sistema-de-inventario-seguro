# Script de despliegue automatizado para Windows PowerShell

Write-Host "🚀 Iniciando despliegue del Sistema de Inventario Seguro" -ForegroundColor Cyan
Write-Host ""

# Verificar que config.js existe y está configurado
if (-not (Test-Path "config.js")) {
    Write-Host "⚠️  config.js no encontrado" -ForegroundColor Yellow
    Write-Host "Creando config.js desde config.example.js..."
    if (Test-Path "config.example.js") {
        Copy-Item "config.example.js" "config.js"
        Write-Host "⚠️  Por favor, edita config.js con tus credenciales antes de continuar" -ForegroundColor Yellow
        exit 1
    } else {
        Write-Host "❌ Error: config.example.js no encontrado" -ForegroundColor Red
        exit 1
    }
}

# Verificar que config.js esté configurado
$configContent = Get-Content "config.js" -Raw
if ($configContent -match "TU_SCRIPT_ID_AQUI" -or $configContent -match "TU_SPREADSHEET_ID_AQUI") {
    Write-Host "❌ Error: config.js no está configurado" -ForegroundColor Red
    Write-Host "Por favor, edita config.js con tus credenciales reales"
    exit 1
}

Write-Host "✅ config.js verificado" -ForegroundColor Green

# Verificar archivos necesarios
Write-Host "Verificando archivos necesarios..."
$requiredFiles = @("index.html", "script.js", "security.js", "estilo.css", "sg.js")

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ Error: $file no encontrado" -ForegroundColor Red
        exit 1
    }
}

Write-Host "✅ Todos los archivos necesarios están presentes" -ForegroundColor Green

# Opciones de despliegue
Write-Host ""
Write-Host "Selecciona el método de despliegue:"
Write-Host "1) Preparar para GitHub Pages"
Write-Host "2) Preparar para servidor web (carpeta dist/)"
Write-Host "3) Solo validar archivos"
$option = Read-Host "Opción (1-3)"

switch ($option) {
    "1" {
        Write-Host "Preparando para GitHub Pages..."
        # Crear carpeta dist si no existe
        if (-not (Test-Path "dist")) {
            New-Item -ItemType Directory -Path "dist" | Out-Null
        }
        # Copiar archivos (excepto config.js que debe estar en .gitignore)
        Copy-Item "index.html" "dist/"
        Copy-Item "script.js" "dist/"
        Copy-Item "security.js" "dist/"
        Copy-Item "estilo.css" "dist/"
        # Crear config.js de ejemplo en dist
        Copy-Item "config.example.js" "dist/config.js"
        Write-Host "✅ Archivos copiados a dist/" -ForegroundColor Green
        Write-Host "⚠️  Recuerda: No subas config.js con credenciales reales a GitHub" -ForegroundColor Yellow
        Write-Host "Usa variables de entorno o configuración del servidor"
    }
    "2" {
        Write-Host "Preparando para servidor web..."
        if (-not (Test-Path "dist")) {
            New-Item -ItemType Directory -Path "dist" | Out-Null
        }
        Copy-Item "index.html" "dist/"
        Copy-Item "script.js" "dist/"
        Copy-Item "security.js" "dist/"
        Copy-Item "estilo.css" "dist/"
        Copy-Item "config.js" "dist/"
        Write-Host "✅ Archivos copiados a dist/" -ForegroundColor Green
        Write-Host "Puedes subir el contenido de dist/ a tu servidor web"
    }
    "3" {
        Write-Host "Validación completada" -ForegroundColor Green
    }
    default {
        Write-Host "❌ Opción inválida" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos pasos:"
Write-Host "1. Despliega sg.js en Google Apps Script"
Write-Host "2. Configura las credenciales en config.js"
Write-Host "3. Sube los archivos a tu servidor web"
Write-Host "4. Verifica que todo funcione correctamente"
Write-Host ""
Write-Host "Para más información, consulta DEPLOY.md"



