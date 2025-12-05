// ⚠️ ARCHIVO DE EJEMPLO - Copia este archivo como config.js y configura tus credenciales
// Este archivo NO debe contener credenciales reales en el repositorio

// Configuración de la aplicación
const APP_CONFIG = {
    // URL del Google Apps Script - REEMPLAZAR con tu URL real después de desplegar
    SCRIPT_URL: 'https://script.google.com/macros/s/TU_SCRIPT_ID_AQUI/exec',
    
    // ID del Google Spreadsheet - REEMPLAZAR con tu ID real
    SPREADSHEET_ID: 'TU_SPREADSHEET_ID_AQUI',
    
    // Configuración de seguridad
    SECURITY: {
        // Tiempo máximo de espera para requests (ms)
        REQUEST_TIMEOUT: 30000,
        
        // Rate limiting - máximo de requests por minuto
        MAX_REQUESTS_PER_MINUTE: 60,
        
        // Longitud máxima de campos
        MAX_FIELD_LENGTH: {
            nombre: 200,
            codigo: 50,
            categoria: 100,
            proveedor: 100,
            cliente: 100
        },
        
        // Rangos válidos para números
        VALID_RANGES: {
            precio_min: 0.01,
            precio_max: 999999.99,
            cantidad_min: 1,
            cantidad_max: 999999,
            stock_min: 0,
            stock_max: 999999
        }
    },
    
    // Configuración de autenticación (si se implementa)
    AUTH: {
        enabled: false, // Cambiar a true cuando se implemente autenticación
        requiredActions: ['iniciar', 'resetear', 'agregarProducto', 'registrarTransaccion']
    }
};

// Validar que las URLs estén configuradas
if (APP_CONFIG.SCRIPT_URL.includes('TU_SCRIPT_ID_AQUI') || 
    APP_CONFIG.SPREADSHEET_ID.includes('TU_SPREADSHEET_ID_AQUI')) {
    console.warn('⚠️ ADVERTENCIA: Las credenciales no han sido configuradas. Por favor, edita config.js');
}



