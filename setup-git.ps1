# Script para configurar Git y subir el proyecto
# Ejecutar desde PowerShell en la carpeta inventario-seguro

Write-Host "🔧 Configuración de Git para Inventario Seguro" -ForegroundColor Cyan
Write-Host ""

# Verificar si Git está instalado
try {
    $gitVersion = git --version
    Write-Host "✅ Git encontrado: $gitVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Git no está instalado" -ForegroundColor Red
    Write-Host ""
    Write-Host "Por favor, instala Git desde: https://git-scm.com/download/win" -ForegroundColor Yellow
    Write-Host "O ejecuta: winget install Git.Git" -ForegroundColor Yellow
    exit 1
}

# Verificar que estamos en la carpeta correcta
if (-not (Test-Path "index.html")) {
    Write-Host "❌ Error: No se encuentra index.html" -ForegroundColor Red
    Write-Host "Asegúrate de ejecutar este script desde la carpeta inventario-seguro" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Carpeta correcta detectada" -ForegroundColor Green
Write-Host ""

# Verificar que config.js no se va a subir
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    if ($gitignoreContent -match "config\.js") {
        Write-Host "✅ .gitignore configurado correctamente (config.js será ignorado)" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Advertencia: config.js no está en .gitignore" -ForegroundColor Yellow
    }
} else {
    Write-Host "⚠️  Advertencia: .gitignore no encontrado" -ForegroundColor Yellow
}

Write-Host ""

# Inicializar repositorio si no existe
if (-not (Test-Path ".git")) {
    Write-Host "Inicializando repositorio Git..." -ForegroundColor Cyan
    git init
    Write-Host "✅ Repositorio inicializado" -ForegroundColor Green
} else {
    Write-Host "✅ Repositorio Git ya existe" -ForegroundColor Green
}

Write-Host ""

# Verificar estado
Write-Host "📋 Estado actual del repositorio:" -ForegroundColor Cyan
git status

Write-Host ""
Write-Host "📝 Próximos pasos manuales:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Verifica que config.js NO aparezca en los archivos a agregar" -ForegroundColor White
Write-Host "2. Si todo está bien, ejecuta:" -ForegroundColor White
Write-Host "   git add ." -ForegroundColor Cyan
Write-Host "   git commit -m 'Initial commit: Sistema de inventario seguro'" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. Crea un repositorio en GitHub/GitLab y luego:" -ForegroundColor White
Write-Host "   git remote add origin https://github.com/TU-USUARIO/inventario-seguro.git" -ForegroundColor Cyan
Write-Host "   git branch -M main" -ForegroundColor Cyan
Write-Host "   git push -u origin main" -ForegroundColor Cyan
Write-Host ""
Write-Host "📖 Para más detalles, consulta GIT_SETUP.md" -ForegroundColor Yellow
Write-Host ""

# Preguntar si quiere agregar archivos ahora
$addFiles = Read-Host "¿Deseas agregar los archivos ahora? (S/N)"
if ($addFiles -eq "S" -or $addFiles -eq "s") {
    Write-Host ""
    Write-Host "Agregando archivos..." -ForegroundColor Cyan
    git add .
    
    Write-Host ""
    Write-Host "📋 Archivos agregados. Verificando que config.js NO esté incluido:" -ForegroundColor Cyan
    $stagedFiles = git diff --cached --name-only
    if ($stagedFiles -contains "config.js") {
        Write-Host "⚠️  ADVERTENCIA: config.js está siendo rastreado!" -ForegroundColor Red
        Write-Host "Removiendo config.js del índice..." -ForegroundColor Yellow
        git reset HEAD config.js
        Write-Host "✅ config.js removido del índice" -ForegroundColor Green
    } else {
        Write-Host "✅ config.js NO está siendo rastreado (correcto)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📋 Archivos que se van a committear:" -ForegroundColor Cyan
    git status --short
    
    Write-Host ""
    $commit = Read-Host "¿Deseas hacer commit ahora? (S/N)"
    if ($commit -eq "S" -or $commit -eq "s") {
        $commitMessage = Read-Host "Mensaje del commit (Enter para usar el predeterminado)"
        if ([string]::IsNullOrWhiteSpace($commitMessage)) {
            $commitMessage = "Initial commit: Sistema de inventario seguro con todas las vulnerabilidades resueltas"
        }
        git commit -m $commitMessage
        Write-Host "✅ Commit realizado" -ForegroundColor Green
        Write-Host ""
        Write-Host "📝 Siguiente paso: Crear repositorio en GitHub y ejecutar:" -ForegroundColor Yellow
        Write-Host "   git remote add origin https://github.com/TU-USUARIO/inventario-seguro.git" -ForegroundColor Cyan
        Write-Host "   git push -u origin main" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green


