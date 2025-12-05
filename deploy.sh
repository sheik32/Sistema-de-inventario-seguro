#!/bin/bash
# Script de despliegue automatizado para Linux/Mac

echo "🚀 Iniciando despliegue del Sistema de Inventario Seguro"
echo ""

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Verificar que config.js existe y está configurado
if [ ! -f "config.js" ]; then
    echo -e "${YELLOW}⚠️  config.js no encontrado${NC}"
    echo "Creando config.js desde config.example.js..."
    if [ -f "config.example.js" ]; then
        cp config.example.js config.js
        echo -e "${YELLOW}⚠️  Por favor, edita config.js con tus credenciales antes de continuar${NC}"
        exit 1
    else
        echo -e "${RED}❌ Error: config.example.js no encontrado${NC}"
        exit 1
    fi
fi

# Verificar que config.js esté configurado
if grep -q "TU_SCRIPT_ID_AQUI" config.js || grep -q "TU_SPREADSHEET_ID_AQUI" config.js; then
    echo -e "${RED}❌ Error: config.js no está configurado${NC}"
    echo "Por favor, edita config.js con tus credenciales reales"
    exit 1
fi

echo -e "${GREEN}✅ config.js verificado${NC}"

# Verificar archivos necesarios
echo "Verificando archivos necesarios..."
REQUIRED_FILES=("index.html" "script.js" "security.js" "estilo.css" "sg.js")

for file in "${REQUIRED_FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo -e "${RED}❌ Error: $file no encontrado${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✅ Todos los archivos necesarios están presentes${NC}"

# Opciones de despliegue
echo ""
echo "Selecciona el método de despliegue:"
echo "1) Preparar para GitHub Pages"
echo "2) Preparar para servidor web (carpeta dist/)"
echo "3) Solo validar archivos"
read -p "Opción (1-3): " option

case $option in
    1)
        echo "Preparando para GitHub Pages..."
        # Crear carpeta dist si no existe
        mkdir -p dist
        # Copiar archivos (excepto config.js que debe estar en .gitignore)
        cp index.html script.js security.js estilo.css dist/
        # Crear config.js de ejemplo en dist (el usuario debe configurarlo manualmente)
        cp config.example.js dist/config.js
        echo -e "${GREEN}✅ Archivos copiados a dist/${NC}"
        echo -e "${YELLOW}⚠️  Recuerda: No subas config.js con credenciales reales a GitHub${NC}"
        echo "Usa variables de entorno o configuración del servidor"
        ;;
    2)
        echo "Preparando para servidor web..."
        mkdir -p dist
        cp index.html script.js security.js estilo.css config.js dist/
        echo -e "${GREEN}✅ Archivos copiados a dist/${NC}"
        echo "Puedes subir el contenido de dist/ a tu servidor web"
        ;;
    3)
        echo "Validación completada"
        ;;
    *)
        echo -e "${RED}❌ Opción inválida${NC}"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}✅ Proceso completado${NC}"
echo ""
echo "📋 Próximos pasos:"
echo "1. Despliega sg.js en Google Apps Script"
echo "2. Configura las credenciales en config.js"
echo "3. Sube los archivos a tu servidor web"
echo "4. Verifica que todo funcione correctamente"
echo ""
echo "Para más información, consulta DEPLOY.md"



