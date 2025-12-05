// ============================================
// MÓDULO DE SEGURIDAD Y SANITIZACIÓN
// ============================================

/**
 * Sanitiza texto para prevenir XSS
 * Escapa caracteres HTML especiales
 */
function escapeHtml(text) {
    if (text === null || text === undefined) {
        return '';
    }
    
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Sanitiza y valida un string
 */
function sanitizeString(input, maxLength = 1000) {
    if (input === null || input === undefined) {
        return '';
    }
    
    let sanitized = String(input).trim();
    
    // Limitar longitud
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Remover caracteres de control excepto \n, \r, \t
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
}

/**
 * Valida y sanitiza un número
 */
function sanitizeNumber(input, min = -Infinity, max = Infinity, defaultValue = 0) {
    if (input === null || input === undefined || input === '') {
        return defaultValue;
    }
    
    const num = parseFloat(input);
    
    if (isNaN(num)) {
        return defaultValue;
    }
    
    // Validar rangos
    if (num < min) {
        return min;
    }
    if (num > max) {
        return max;
    }
    
    return num;
}

/**
 * Valida un código de producto
 */
function validateProductCode(code) {
    if (!code || typeof code !== 'string') {
        return { valid: false, error: 'El código es requerido' };
    }
    
    const sanitized = sanitizeString(code, 50);
    
    if (sanitized.length === 0) {
        return { valid: false, error: 'El código no puede estar vacío' };
    }
    
    // Permitir letras, números, guiones y guiones bajos
    if (!/^[a-zA-Z0-9_-]+$/.test(sanitized)) {
        return { valid: false, error: 'El código solo puede contener letras, números, guiones y guiones bajos' };
    }
    
    return { valid: true, value: sanitized };
}

/**
 * Valida datos de un producto
 */
function validateProductData(data) {
    const errors = [];
    const config = APP_CONFIG.SECURITY;
    
    // Validar nombre
    const nombre = sanitizeString(data.nombre, config.MAX_FIELD_LENGTH.nombre);
    if (!nombre || nombre.length === 0) {
        errors.push('El nombre es requerido');
    }
    
    // Validar código
    const codeValidation = validateProductCode(data.codigo);
    if (!codeValidation.valid) {
        errors.push(codeValidation.error);
    }
    
    // Validar categoría
    const categoria = sanitizeString(data.categoria, config.MAX_FIELD_LENGTH.categoria);
    if (!categoria || categoria.length === 0) {
        errors.push('La categoría es requerida');
    }
    
    // Validar precios
    const precioCompra = sanitizeNumber(
        data.precio_compra,
        config.VALID_RANGES.precio_min,
        config.VALID_RANGES.precio_max
    );
    if (precioCompra < config.VALID_RANGES.precio_min) {
        errors.push(`El precio de compra debe ser al menos ${config.VALID_RANGES.precio_min}`);
    }
    
    const precioVenta = sanitizeNumber(
        data.precio_venta,
        config.VALID_RANGES.precio_min,
        config.VALID_RANGES.precio_max
    );
    if (precioVenta < config.VALID_RANGES.precio_min) {
        errors.push(`El precio de venta debe ser al menos ${config.VALID_RANGES.precio_min}`);
    }
    
    // Validar stock
    const stock = sanitizeNumber(
        data.stock,
        config.VALID_RANGES.stock_min,
        config.VALID_RANGES.stock_max,
        0
    );
    if (stock < 0) {
        errors.push('El stock no puede ser negativo');
    }
    
    if (errors.length > 0) {
        return { valid: false, errors };
    }
    
    return {
        valid: true,
        data: {
            nombre: nombre,
            codigo: codeValidation.value,
            categoria: categoria,
            precio_compra: precioCompra,
            precio_venta: precioVenta,
            stock: Math.floor(stock)
        }
    };
}

/**
 * Valida datos de una transacción
 */
function validateTransactionData(data, type) {
    const errors = [];
    const config = APP_CONFIG.SECURITY;
    
    // Validar producto_id
    if (!data.producto_id || String(data.producto_id).trim().length === 0) {
        errors.push('El ID del producto es requerido');
    }
    
    // Validar cantidad
    const cantidad = sanitizeNumber(
        data.cantidad,
        config.VALID_RANGES.cantidad_min,
        config.VALID_RANGES.cantidad_max
    );
    if (cantidad < config.VALID_RANGES.cantidad_min) {
        errors.push(`La cantidad debe ser al menos ${config.VALID_RANGES.cantidad_min}`);
    }
    
    // Validar precio
    const precio = sanitizeNumber(
        data.precio,
        config.VALID_RANGES.precio_min,
        config.VALID_RANGES.precio_max
    );
    if (precio < config.VALID_RANGES.precio_min) {
        errors.push(`El precio debe ser al menos ${config.VALID_RANGES.precio_min}`);
    }
    
    // Validar datos extra (proveedor/cliente)
    const extraField = type === 'compra' ? 'proveedor' : 'cliente';
    const maxLength = config.MAX_FIELD_LENGTH[extraField] || 100;
    const extraData = sanitizeString(data.extra_data || '', maxLength);
    
    if (errors.length > 0) {
        return { valid: false, errors };
    }
    
    return {
        valid: true,
        data: {
            producto_id: String(data.producto_id).trim(),
            cantidad: Math.floor(cantidad),
            precio: precio,
            type: type,
            extra_data: extraData
        }
    };
}

/**
 * Valida datos de una categoría
 */
function validateCategoryData(data) {
    const config = APP_CONFIG.SECURITY;
    const nombre = sanitizeString(data.nombre, config.MAX_FIELD_LENGTH.categoria);
    
    if (!nombre || nombre.length === 0) {
        return { valid: false, error: 'El nombre de la categoría es requerido' };
    }
    
    return { valid: true, data: { nombre: nombre } };
}

/**
 * Rate Limiting básico
 */
const RateLimiter = (function() {
    const requests = [];
    const MAX_REQUESTS = APP_CONFIG.SECURITY.MAX_REQUESTS_PER_MINUTE;
    const WINDOW_MS = 60000; // 1 minuto
    
    function cleanOldRequests() {
        const now = Date.now();
        while (requests.length > 0 && requests[0] < now - WINDOW_MS) {
            requests.shift();
        }
    }
    
    function canMakeRequest() {
        cleanOldRequests();
        return requests.length < MAX_REQUESTS;
    }
    
    function recordRequest() {
        requests.push(Date.now());
    }
    
    return {
        canMakeRequest,
        recordRequest
    };
})();

/**
 * Crea un elemento de forma segura usando textContent
 */
function createSafeElement(tag, text, attributes = {}) {
    const element = document.createElement(tag);
    element.textContent = text;
    
    Object.keys(attributes).forEach(key => {
        if (key === 'class') {
            element.className = attributes[key];
        } else {
            element.setAttribute(key, attributes[key]);
        }
    });
    
    return element;
}

/**
 * Inserta HTML de forma segura
 */
function setSafeHTML(element, html) {
    if (!element) return;
    
    // Si es texto simple, usar textContent
    if (!html.includes('<')) {
        element.textContent = html;
        return;
    }
    
    // Para HTML, usar DOMPurify si está disponible, sino escapar
    if (typeof DOMPurify !== 'undefined') {
        element.innerHTML = DOMPurify.sanitize(html);
    } else {
        // Fallback: crear un contenedor temporal y extraer solo texto
        const temp = document.createElement('div');
        temp.textContent = html.replace(/<[^>]*>/g, '');
        element.textContent = temp.textContent;
    }
}
