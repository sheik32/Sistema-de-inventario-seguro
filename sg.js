// ============================================
// GOOGLE APPS SCRIPT - VERSIÓN SEGURA
// ============================================

// ⚠️ CONFIGURACIÓN: Reemplazar con el ID real de tu Google Sheet
// Este valor debe coincidir con el configurado en config.js del cliente
const SPREADSHEET_ID = "1j4vfZHoaq2YqG63tAuz97gb79IWoOmJFPWlls1eZ64k"; 

// Nombres de las pestañas
const HOJA_CATEGORIAS = "Categorias";
const HOJA_PRODUCTOS = "Productos";
const HOJA_COMPRAS = "Compras";
const HOJA_VENTAS = "Ventas";
const HOJA_RESUMEN = "resumen_diario";

// Encabezados
const CATEGORIAS_HEADERS = ["id", "nombre"];
const PRODUCTOS_HEADERS = ["id", "nombre", "código", "categoría", "precio_compra", "precio_venta", "stock", "fecha_creado"];
const COMPRAS_HEADERS = ["id", "producto_id", "cantidad", "precio_compra", "fecha", "proveedor"];
const VENTAS_HEADERS = ["id", "producto_id", "cantidad", "precio_venta", "fecha", "cliente"];
const RESUMEN_HEADERS = ["fecha", "total_ventas", "total_compras", "ganancia", "productos_vendidos"];

// Límites de validación
const VALIDATION_LIMITS = {
  nombre_max: 200,
  codigo_max: 50,
  categoria_max: 100,
  proveedor_max: 100,
  cliente_max: 100,
  precio_min: 0.01,
  precio_max: 999999.99,
  cantidad_min: 1,
  cantidad_max: 999999,
  stock_min: 0,
  stock_max: 999999
};

// --- FUNCIÓN CENTRAL PARA ACCEDER A LA HOJA ---
function getSpreadsheet() {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
}

// 🔑 FUNCIÓN: Generación de ID Único
function generateUniqueAppId() {
    return 'id-' + (new Date().getTime().toString(36) + Math.random().toString(36).substring(2, 9)).toUpperCase();
}

// ============================================
// FUNCIONES DE VALIDACIÓN Y SANITIZACIÓN
// ============================================

function sanitizeString(input, maxLength) {
    if (input === null || input === undefined) {
        return '';
    }
    
    let sanitized = String(input).trim();
    
    // Limitar longitud
    if (maxLength && sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }
    
    // Remover caracteres de control
    sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
    
    return sanitized;
}

function sanitizeNumber(input, min, max, defaultValue) {
    if (input === null || input === undefined || input === '') {
        return defaultValue;
    }
    
    const num = parseFloat(input);
    
    if (isNaN(num)) {
        return defaultValue;
    }
    
    if (min !== undefined && num < min) {
        return min;
    }
    
    if (max !== undefined && num > max) {
        return max;
    }
    
    return num;
}

function validateCategoryData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Datos inválidos' };
    }
    
    const nombre = sanitizeString(data.nombre, VALIDATION_LIMITS.categoria_max);
    
    if (!nombre || nombre.length === 0) {
        return { valid: false, error: 'El nombre de la categoría es requerido' };
    }
    
    return { valid: true, data: { nombre: nombre } };
}

function validateProductData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Datos inválidos' };
    }
    
    const nombre = sanitizeString(data.nombre, VALIDATION_LIMITS.nombre_max);
    if (!nombre || nombre.length === 0) {
        return { valid: false, error: 'El nombre es requerido' };
    }
    
    const codigo = sanitizeString(data.codigo, VALIDATION_LIMITS.codigo_max);
    if (!codigo || codigo.length === 0) {
        return { valid: false, error: 'El código es requerido' };
    }
    
    // Validar formato de código
    if (!/^[a-zA-Z0-9_-]+$/.test(codigo)) {
        return { valid: false, error: 'El código tiene formato inválido' };
    }
    
    const categoria = sanitizeString(data.categoria, VALIDATION_LIMITS.categoria_max);
    if (!categoria || categoria.length === 0) {
        return { valid: false, error: 'La categoría es requerida' };
    }
    
    const precioCompra = sanitizeNumber(
        data.precio_compra,
        VALIDATION_LIMITS.precio_min,
        VALIDATION_LIMITS.precio_max
    );
    if (precioCompra < VALIDATION_LIMITS.precio_min) {
        return { valid: false, error: 'El precio de compra es inválido' };
    }
    
    const precioVenta = sanitizeNumber(
        data.precio_venta,
        VALIDATION_LIMITS.precio_min,
        VALIDATION_LIMITS.precio_max
    );
    if (precioVenta < VALIDATION_LIMITS.precio_min) {
        return { valid: false, error: 'El precio de venta es inválido' };
    }
    
    const stock = sanitizeNumber(
        data.stock,
        VALIDATION_LIMITS.stock_min,
        VALIDATION_LIMITS.stock_max,
        0
    );
    
    return {
        valid: true,
        data: {
            nombre: nombre,
            codigo: codigo,
            categoria: categoria,
            precio_compra: precioCompra,
            precio_venta: precioVenta,
            stock: Math.floor(stock)
        }
    };
}

function validateTransactionData(data) {
    if (!data || typeof data !== 'object') {
        return { valid: false, error: 'Datos inválidos' };
    }
    
    const productoId = sanitizeString(data.producto_id, 100);
    if (!productoId || productoId.length === 0) {
        return { valid: false, error: 'El ID del producto es requerido' };
    }
    
    const cantidad = sanitizeNumber(
        data.cantidad,
        VALIDATION_LIMITS.cantidad_min,
        VALIDATION_LIMITS.cantidad_max
    );
    if (cantidad < VALIDATION_LIMITS.cantidad_min) {
        return { valid: false, error: 'La cantidad es inválida' };
    }
    
    const precio = sanitizeNumber(
        data.precio,
        VALIDATION_LIMITS.precio_min,
        VALIDATION_LIMITS.precio_max
    );
    if (precio < VALIDATION_LIMITS.precio_min) {
        return { valid: false, error: 'El precio es inválido' };
    }
    
    const type = String(data.type || '').toLowerCase();
    if (type !== 'compra' && type !== 'venta') {
        return { valid: false, error: 'Tipo de transacción inválido' };
    }
    
    const maxExtraLength = type === 'compra' ? VALIDATION_LIMITS.proveedor_max : VALIDATION_LIMITS.cliente_max;
    const extraData = sanitizeString(data.extra_data || '', maxExtraLength);
    
    return {
        valid: true,
        data: {
            producto_id: productoId,
            cantidad: Math.floor(cantidad),
            precio: precio,
            type: type,
            extra_data: extraData
        }
    };
}

// ============================================
// ENTRADA PRINCIPAL PARA SOLICITUDES GET
// ============================================
function doGet(e) {
    const action = e.parameter.action;
    const query = e.parameter.query;
    const sheetName = e.parameter.sheetName;
    let result;

    try {
        // Sanitizar parámetros
        const sanitizedAction = sanitizeString(action, 50);
        const sanitizedQuery = query ? sanitizeString(query, 100) : null;
        const sanitizedSheetName = sheetName ? sanitizeString(sheetName, 50) : null;
        
        if (sanitizedAction === "iniciar" || sanitizedAction === "resetear") {
            result = sanitizedAction === "iniciar" ? iniciarBaseDeDatos() : resetearBaseDeDatos();
        } else if (sanitizedAction === "getCategorias") {
            result = getCategorias();
        } else if (sanitizedAction === "buscarProducto") {
            if (!sanitizedQuery) {
                result = { status: "error", message: "Parámetro de búsqueda requerido" };
            } else {
                result = buscarProducto(sanitizedQuery);
            }
        } else if (sanitizedAction === "getInventario") {
            result = getInventario();
        } else if (sanitizedAction === "getResumenDiario") {
            result = getResumenDiario();
        } else if (sanitizedAction === "getData" && sanitizedSheetName) {
            result = getData(sanitizedSheetName);
        } else {
            result = { status: "error", message: "Acción no válida o faltan parámetros" };
        }
    } catch (error) {
        // No exponer detalles del error
        result = { status: "error", message: "Error al procesar la solicitud" };
    }

    return ContentService.createTextOutput(JSON.stringify(result))
           .setMimeType(ContentService.MimeType.JSON);
}

// ============================================
// ENTRADA PRINCIPAL PARA SOLICITUDES POST
// ============================================
function doPost(e) {
    try {
        if (!e.postData || !e.postData.contents) {
            return ContentService.createTextOutput(JSON.stringify({ 
                status: "error", 
                message: "No se recibieron datos en la solicitud" 
            })).setMimeType(ContentService.MimeType.JSON);
        }
        
        const requestData = JSON.parse(e.postData.contents);
        const action = sanitizeString(requestData.action, 50);

        let result;
        if (action === "agregarCategoria") {
            const validation = validateCategoryData(requestData);
            if (validation.valid) {
                result = agregarCategoria(validation.data);
            } else {
                result = { status: "error", message: validation.error };
            }
        } else if (action === "agregarProducto") {
            const validation = validateProductData(requestData);
            if (validation.valid) {
                result = agregarProducto(validation.data);
            } else {
                result = { status: "error", message: validation.error };
            }
        } else if (action === "registrarTransaccion") {
            const validation = validateTransactionData(requestData);
            if (validation.valid) {
                result = registrarTransaccion(validation.data);
            } else {
                result = { status: "error", message: validation.error };
            }
        } else {
            result = { status: "error", message: "Acción no reconocida" };
        }
        
        return ContentService.createTextOutput(JSON.stringify(result))
               .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        // No exponer detalles del error
        return ContentService.createTextOutput(JSON.stringify({ 
            status: "error", 
            message: "Error al procesar la solicitud" 
        })).setMimeType(ContentService.MimeType.JSON);
    }
}

// ============================================
// FUNCIONES DE GESTIÓN DE CATEGORÍAS
// ============================================
function getCategorias() {
    return getData(HOJA_CATEGORIAS);
}

function agregarCategoria(data) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_CATEGORIAS);

    if (!sheet) {
        return { status: "error", message: "Error de configuración. Contacte al administrador." };
    }

    const newId = generateUniqueAppId();
    
    const newRow = [
        newId,
        data.nombre
    ];

    try {
        sheet.appendRow(newRow);
        return { status: "success", message: "Categoría agregada exitosamente." };
    } catch (e) {
        return { status: "error", message: "Error al guardar la categoría" };
    }
}

// ============================================
// FUNCIONES DE GESTIÓN DE PRODUCTOS Y BÚSQUEDA
// ============================================
function getInventario() {
    return getData(HOJA_PRODUCTOS);
}

function buscarProducto(query) {
    const data = getData(HOJA_PRODUCTOS);

    if (data.status !== 'success') return data;
    
    const products = data.data;
    const lowerQuery = query.toLowerCase().trim();

    if (lowerQuery.length === 0) {
        return { status: "warning", message: "Especifique un criterio de búsqueda" };
    }

    const results = products.filter(p => {
        const idStr = String(p.id || '').toLowerCase();
        const codigoStr = String(p.código || '').toLowerCase();
        const nombreStr = String(p.nombre || '').toLowerCase();

        return idStr.includes(lowerQuery) ||
               codigoStr.includes(lowerQuery) ||
               nombreStr.includes(lowerQuery);
    });

    if (results.length > 0) {
        return { status: "success", data: results, message: "Búsqueda completada" };
    } else {
        return { status: "warning", message: "Producto no encontrado" };
    }
}

function agregarProducto(data) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(HOJA_PRODUCTOS);

    if (!sheet) {
        return { status: "error", message: "Error de configuración. Contacte al administrador." };
    }
    
    const newId = generateUniqueAppId();

    const newRow = [
        newId,
        data.nombre,
        data.codigo,
        data.categoria,
        data.precio_compra,
        data.precio_venta,
        data.stock,
        new Date()
    ];

    try {
        sheet.appendRow(newRow);
        return { status: "success", message: "Producto registrado exitosamente." };
    } catch (e) {
        return { status: "error", message: "Error al guardar el producto" };
    }
}

// ============================================
// FUNCIONES DE GESTIÓN DE TRANSACCIONES
// ============================================
function registrarTransaccion(data) {
    const ss = getSpreadsheet();
    const action = data.type;
    const isCompra = action === "compra";
    const sheetName = isCompra ? HOJA_COMPRAS : HOJA_VENTAS;
    const sheet = ss.getSheetByName(sheetName);
    const sheetProductos = ss.getSheetByName(HOJA_PRODUCTOS);

    if (!sheet || !sheetProductos) {
        return { status: "error", message: "Error de configuración. Contacte al administrador." };
    }

    const { rowData, rowIndex } = findProductRow(sheetProductos, data.producto_id);
    
    if (rowIndex === -1) {
        return { status: "error", message: "Producto no encontrado" };
    }
    
    const stockColIndex = 6;
    const precioCompraColIndex = 4;
    const precioVentaColIndex = 5;
    
    const cantidad = data.cantidad;
    const precioTransaccion = data.precio;
    
    let stockActual = sanitizeNumber(rowData[stockColIndex], 0, Infinity, 0);
    let nuevoStock;

    if (!isCompra) {
        if (stockActual < cantidad) {
            return { 
                status: "warning", 
                message: "Stock insuficiente para completar la venta" 
            };
        }
        nuevoStock = stockActual - cantidad;
    } else {
        nuevoStock = stockActual + cantidad;
    }

    const transaccionId = generateUniqueAppId(); 
    const newRow = [
        transaccionId,
        data.producto_id,
        cantidad,
        precioTransaccion,
        new Date(),
        data.extra_data || ''
    ];

    try {
        sheet.appendRow(newRow);
    } catch (e) {
        return { status: "error", message: "Error al registrar la transacción" };
    }

    try {
        sheetProductos.getRange(rowIndex + 1, stockColIndex + 1).setValue(nuevoStock);
        
        if (isCompra) {
            const precioActualCompra = sanitizeNumber(rowData[precioCompraColIndex], 0, Infinity, 0);
            if (precioTransaccion !== precioActualCompra) {
                sheetProductos.getRange(rowIndex + 1, precioCompraColIndex + 1).setValue(precioTransaccion);
            }
        } else {
            const precioActualVenta = sanitizeNumber(rowData[precioVentaColIndex], 0, Infinity, 0);
            if (precioTransaccion !== precioActualVenta) {
                sheetProductos.getRange(rowIndex + 1, precioVentaColIndex + 1).setValue(precioTransaccion);
            }
        }

        return { 
            status: "success", 
            message: "Transacción registrada exitosamente" 
        };

    } catch (e) {
        try {
            sheet.deleteRow(sheet.getLastRow());
        } catch (revertError) {
            // Ignorar error de reversión
        }
        return { status: "error", message: "Error al actualizar el inventario" };
    }
}

// ============================================
// FUNCIÓN PARA OBTENER RESUMEN DIARIO
// ============================================
function getResumenDiario() {
    return getData(HOJA_RESUMEN);
}

// ============================================
// FUNCIONES DE UTILIDAD GENERAL
// ============================================
function getData(sheetName) {
    const ss = getSpreadsheet();
    const sheet = ss.getSheetByName(sheetName);

    if (!sheet || sheet.getLastRow() < 2) {
        return { status: "error", message: "No hay datos disponibles" };
    }

    const data = sheet.getDataRange().getValues();
    const headers = data[0];
    const rows = data.slice(1);

    const mappedData = rows.map(row => {
        let entry = {};
        headers.forEach((header, index) => {
            let value = row[index];
            
            if (value === '' || value === null || value === undefined) {
                value = '';
            } else if (typeof value === 'number') {
                value = value;
            } else if (typeof value === 'string' && !isNaN(value) && value.trim() !== '') {
                if (header === 'código' && /[a-zA-Z]/.test(value)) {
                    value = value;
                } else {
                    value = parseFloat(value);
                }
            } else if (value instanceof Date) {
                // Mantener como Date
            } else {
                value = String(value);
            }
            
            entry[header] = value;
        });
        return entry;
    });

    const filteredData = mappedData.filter(entry => {
        return Object.values(entry).some(value => value !== '' && value !== null);
    });

    return { status: "success", data: filteredData };
}

function findProductRow(sheetProductos, productoId) {
    try {
        const data = sheetProductos.getDataRange().getValues();
        const idColIndex = 0;

        for (let i = 1; i < data.length; i++) {
            const rowId = String(data[i][idColIndex] || '');
            const searchId = String(productoId || '');
            
            if (rowId.toLowerCase() === searchId.toLowerCase()) {
                return { rowData: data[i], rowIndex: i };
            }
        }
        return { rowData: null, rowIndex: -1 };
    } catch (error) {
        return { rowData: null, rowIndex: -1 };
    }
}

// ============================================
// FUNCIONES DE CONFIGURACIÓN DE BASE DE DATOS
// ============================================
function createOrResetSheet(ss, name, headers) {
    let sheet = ss.getSheetByName(name);
    let action = "verificada";

    if (!sheet) {
        sheet = ss.insertSheet(name);
        action = "creada";
    }

    sheet.clearContents();
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.setFrozenRows(1);

    return `Pestaña '${name}' ${action}.`;
}

function iniciarBaseDeDatos() {
    const ss = getSpreadsheet();
    let msg = [];

    msg.push(createOrResetSheet(ss, HOJA_CATEGORIAS, CATEGORIAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_PRODUCTOS, PRODUCTOS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_COMPRAS, COMPRAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_VENTAS, VENTAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_RESUMEN, RESUMEN_HEADERS));

    return { status: "success", message: "Base de datos inicializada correctamente" };
}

function resetearBaseDeDatos() {
    const ss = getSpreadsheet();
    let msg = [];

    ss.getSheets().forEach(sheet => {
        const sheetName = sheet.getName();
        if (sheetName !== "Hoja 1") {
            ss.deleteSheet(sheet);
            msg.push(`Pestaña '${sheetName}' eliminada.`);
        }
    });

    msg.push(createOrResetSheet(ss, HOJA_CATEGORIAS, CATEGORIAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_PRODUCTOS, PRODUCTOS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_COMPRAS, COMPRAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_VENTAS, VENTAS_HEADERS));
    msg.push(createOrResetSheet(ss, HOJA_RESUMEN, RESUMEN_HEADERS));

    return { status: "success", message: "Base de datos reseteada correctamente" };
}



