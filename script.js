// ============================================
// SCRIPT PRINCIPAL - VERSIÓN SEGURA
// ============================================

// Obtener configuración
const SCRIPT_URL = APP_CONFIG.SCRIPT_URL;
let productDataCache = {};
let resumenFinancieroChart, tendenciasChart;

document.addEventListener('DOMContentLoaded', () => {
    setupNavigation();
    loadInitialData();
    setupForms();
});

function setupNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.main-content .content-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('data-section');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            sections.forEach(section => {
                if (section.id === targetId) {
                    section.classList.add('active');
                    if (targetId === 'dashboard') {
                        handleLoadDashboard();
                    } else if (targetId === 'inventario') {
                        document.getElementById('cargarInventarioBtn').click();
                    }
                } else {
                    section.classList.remove('active');
                }
            });
        });
    });
}

async function loadInitialData() {
    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus('statusProducto', 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(`${SCRIPT_URL}?action=getCategorias`, {
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const data = await response.json();
        
        if (data.status === 'success') {
            populateCategories(data.data);
        } else {
            displayStatus('statusProducto', 'warning', 'No se pudieron cargar las categorías.');
            populateCategories([]);
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus('statusProducto', 'error', 'Tiempo de espera agotado. Intente nuevamente.');
        } else {
            displayStatus('statusProducto', 'error', 'Error de conexión al cargar categorías.');
        }
        populateCategories([]);
    }
}

function populateCategories(categories) {
    const selectProducto = document.getElementById('p_categoria');
    selectProducto.innerHTML = '';
    
    if (categories.length === 0) {
        const option = createSafeElement('option', 'No hay categorías registradas', {
            value: '',
            disabled: true,
            selected: true
        });
        selectProducto.appendChild(option);
        
        const listaCategorias = document.getElementById('listaCategorias');
        listaCategorias.innerHTML = '';
        const li = createSafeElement('li', 'No hay categorías.');
        listaCategorias.appendChild(li);
        return;
    }

    const defaultOption = createSafeElement('option', 'Seleccione una categoría', {
        value: '',
        disabled: true,
        selected: true
    });
    selectProducto.appendChild(defaultOption);
    
    const listaCategorias = document.getElementById('listaCategorias');
    listaCategorias.innerHTML = '';
    
    categories.forEach(cat => {
        const name = escapeHtml(cat.nombre || `(ID ${cat.id})`);
        const option = createSafeElement('option', name, { value: name });
        selectProducto.appendChild(option);
        
        const li = document.createElement('li');
        li.textContent = `ID: ${escapeHtml(String(cat.id))} | Nombre: ${name}`;
        listaCategorias.appendChild(li);
    });
}

function setupForms() {
    // Configuración
    document.getElementById('iniciarDBBtn').addEventListener('click', () => handleConfigAction('iniciar'));
    document.getElementById('resetDBBtn').addEventListener('click', () => {
        if (window.confirm("¡ADVERTENCIA! ¿Deseas RESETEAR TODA la base de datos? Esto es irreversible.")) {
            handleConfigAction('resetear');
        }
    });

    // Categorías y Productos
    document.getElementById('categoriaForm').addEventListener('submit', (e) => handlePostAction(e, 'agregarCategoria', 'statusCategoria'));
    document.getElementById('productoForm').addEventListener('submit', (e) => handlePostAction(e, 'agregarProducto', 'statusProducto'));
    
    // Compras/Ventas
    document.getElementById('co_query').addEventListener('input', (e) => handleQueryFilter(e.target.value, 'co'));
    document.getElementById('v_query').addEventListener('input', (e) => handleQueryFilter(e.target.value, 'v'));
    
    document.getElementById('compraForm').addEventListener('submit', (e) => handleTransactionPost(e, 'compra'));
    document.getElementById('ventaForm').addEventListener('submit', (e) => handleTransactionPost(e, 'venta'));

    // Resúmenes
    document.getElementById('resumenVentasBtn').addEventListener('click', () => loadSummary('Ventas'));
    document.getElementById('resumenComprasBtn').addEventListener('click', () => loadSummary('Compras'));

    // Dashboard
    document.getElementById('cargarInventarioBtn').addEventListener('click', loadInventario);
    document.getElementById('cargarDatosGraficosBtn').addEventListener('click', handleLoadDashboard);
    document.getElementById('calcularResumenBtn').addEventListener('click', calcularResumenFinanciero);
}

// ================= DASHBOARD FUNCTIONS =================

async function handleLoadDashboard() {
    await calcularResumenFinanciero();
    await cargarDatosGraficos();
}

async function calcularResumenFinanciero() {
    displayStatus('statusDashboard', 'info', 'Calculando resumen financiero...');
    
    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus('statusDashboard', 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            return { totalVentas: 0, totalCompras: 0, ganancias: 0 };
        }
        
        RateLimiter.recordRequest();
        RateLimiter.recordRequest(); // Dos requests
        
        const [ventasResponse, comprasResponse] = await Promise.all([
            fetch(`${SCRIPT_URL}?action=getData&sheetName=VENTAS`, {
                signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
            }),
            fetch(`${SCRIPT_URL}?action=getData&sheetName=COMPRAS`, {
                signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
            })
        ]);

        const ventasData = await ventasResponse.json();
        const comprasData = await comprasResponse.json();

        let totalVentas = 0;
        let totalCompras = 0;

        if (ventasData.status === 'success' && ventasData.data) {
            totalVentas = ventasData.data.reduce((sum, venta) => {
                const cantidad = sanitizeNumber(venta.cantidad, 0, Infinity, 0);
                const precio = sanitizeNumber(venta.precio_venta, 0, Infinity, 0);
                return sum + (cantidad * precio);
            }, 0);
        }

        if (comprasData.status === 'success' && comprasData.data) {
            totalCompras = comprasData.data.reduce((sum, compra) => {
                const cantidad = sanitizeNumber(compra.cantidad, 0, Infinity, 0);
                const precio = sanitizeNumber(compra.precio_compra, 0, Infinity, 0);
                return sum + (cantidad * precio);
            }, 0);
        }

        const ganancias = totalVentas - totalCompras;

        document.getElementById('totalVentas').textContent = `$${totalVentas.toFixed(2)}`;
        document.getElementById('totalCompras').textContent = `$${totalCompras.toFixed(2)}`;
        document.getElementById('totalGanancias').textContent = `$${ganancias.toFixed(2)}`;
        document.getElementById('totalGastos').textContent = `$${totalCompras.toFixed(2)}`;

        const gananciasElement = document.getElementById('totalGanancias');
        if (ganancias > 0) {
            gananciasElement.style.color = 'var(--secondary-color)';
        } else if (ganancias < 0) {
            gananciasElement.style.color = 'var(--danger-color)';
        } else {
            gananciasElement.style.color = '#666';
        }

        displayStatus('statusDashboard', 'success', `Resumen calculado: Ventas: $${totalVentas.toFixed(2)} | Compras: $${totalCompras.toFixed(2)} | Ganancia: $${ganancias.toFixed(2)}`);

        return { totalVentas, totalCompras, ganancias };

    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus('statusDashboard', 'error', 'Tiempo de espera agotado al calcular resumen.');
        } else {
            displayStatus('statusDashboard', 'error', 'Error al calcular resumen.');
        }
        return { totalVentas: 0, totalCompras: 0, ganancias: 0 };
    }
}

async function cargarDatosGraficos() {
    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus('statusDashboard', 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            return;
        }
        
        RateLimiter.recordRequest();
        const resumenResponse = await fetch(`${SCRIPT_URL}?action=getResumenDiario`, {
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const resumenData = await resumenResponse.json();

        if (resumenData.status === 'success' && resumenData.data && resumenData.data.length > 0) {
            renderCharts(resumenData.data);
        } else {
            await renderChartsFromRawData();
        }

    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus('statusDashboard', 'error', 'Tiempo de espera agotado al cargar gráficos.');
        } else {
            displayStatus('statusDashboard', 'error', 'Error al cargar gráficos.');
        }
    }
}

async function renderChartsFromRawData() {
    try {
        if (!RateLimiter.canMakeRequest()) {
            return;
        }
        
        RateLimiter.recordRequest();
        RateLimiter.recordRequest();
        
        const [ventasResponse, comprasResponse] = await Promise.all([
            fetch(`${SCRIPT_URL}?action=getData&sheetName=VENTAS`, {
                signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
            }),
            fetch(`${SCRIPT_URL}?action=getData&sheetName=COMPRAS`, {
                signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
            })
        ]);

        const ventasData = await ventasResponse.json();
        const comprasData = await comprasResponse.json();

        const ventasPorFecha = {};
        const comprasPorFecha = {};

        if (ventasData.status === 'success' && ventasData.data) {
            ventasData.data.forEach(venta => {
                try {
                    const fecha = new Date(venta.fecha).toLocaleDateString();
                    const cantidad = sanitizeNumber(venta.cantidad, 0, Infinity, 0);
                    const precio = sanitizeNumber(venta.precio_venta, 0, Infinity, 0);
                    const monto = cantidad * precio;
                    ventasPorFecha[fecha] = (ventasPorFecha[fecha] || 0) + monto;
                } catch (e) {
                    console.error('Error procesando venta:', e);
                }
            });
        }

        if (comprasData.status === 'success' && comprasData.data) {
            comprasData.data.forEach(compra => {
                try {
                    const fecha = new Date(compra.fecha).toLocaleDateString();
                    const cantidad = sanitizeNumber(compra.cantidad, 0, Infinity, 0);
                    const precio = sanitizeNumber(compra.precio_compra, 0, Infinity, 0);
                    const monto = cantidad * precio;
                    comprasPorFecha[fecha] = (comprasPorFecha[fecha] || 0) + monto;
                } catch (e) {
                    console.error('Error procesando compra:', e);
                }
            });
        }

        const todasFechas = [...new Set([...Object.keys(ventasPorFecha), ...Object.keys(comprasPorFecha)])];
        todasFechas.sort((a, b) => new Date(a) - new Date(b));

        const datosResumen = todasFechas.map(fecha => ({
            fecha: fecha,
            total_ventas: ventasPorFecha[fecha] || 0,
            total_compras: comprasPorFecha[fecha] || 0,
            ganancia: (ventasPorFecha[fecha] || 0) - (comprasPorFecha[fecha] || 0)
        }));

        renderCharts(datosResumen);

    } catch (error) {
        console.error('Error al procesar datos para gráficos:', error);
        displayStatus('statusDashboard', 'warning', 'No hay datos suficientes para generar gráficos.');
    }
}

function renderCharts(resumenData) {
    const labels = resumenData.map(row => {
        if (row.fecha instanceof Date) {
            return row.fecha.toLocaleDateString();
        }
        return String(row.fecha || '');
    });

    const ventas = resumenData.map(row => sanitizeNumber(row.total_ventas, 0, Infinity, 0));
    const compras = resumenData.map(row => sanitizeNumber(row.total_compras, 0, Infinity, 0));
    const ganancias = resumenData.map(row => sanitizeNumber(row.ganancia, -Infinity, Infinity, 0));

    const ctx1 = document.getElementById('resumenFinancieroChart').getContext('2d');
    if (resumenFinancieroChart) resumenFinancieroChart.destroy();
    resumenFinancieroChart = new Chart(ctx1, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ventas',
                    data: ventas,
                    backgroundColor: 'rgba(0, 123, 255, 0.7)',
                    borderColor: 'rgba(0, 123, 255, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Compras',
                    data: compras,
                    backgroundColor: 'rgba(23, 162, 184, 0.7)',
                    borderColor: 'rgba(23, 162, 184, 1)',
                    borderWidth: 1
                },
                {
                    label: 'Ganancias',
                    data: ganancias,
                    type: 'line',
                    fill: false,
                    backgroundColor: 'rgba(40, 167, 69, 0.7)',
                    borderColor: 'rgba(40, 167, 69, 1)',
                    borderWidth: 2,
                    tension: 0.1
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Resumen Financiero - Ventas, Compras y Ganancias'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto ($)'
                    }
                }
            }
        }
    });

    const ctx2 = document.getElementById('tendenciasChart').getContext('2d');
    if (tendenciasChart) tendenciasChart.destroy();
    tendenciasChart = new Chart(ctx2, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Ventas Acumuladas',
                    data: ventas.reduce((acc, curr, i) => [...acc, (acc[i-1] || 0) + curr], []),
                    borderColor: 'rgba(0, 123, 255, 1)',
                    backgroundColor: 'rgba(0, 123, 255, 0.1)',
                    tension: 0.1,
                    fill: true
                },
                {
                    label: 'Compras Acumuladas',
                    data: compras.reduce((acc, curr, i) => [...acc, (acc[i-1] || 0) + curr], []),
                    borderColor: 'rgba(23, 162, 184, 1)',
                    backgroundColor: 'rgba(23, 162, 184, 0.1)',
                    tension: 0.1,
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Tendencias Acumuladas - Ventas vs Compras'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Monto Acumulado ($)'
                    }
                }
            }
        }
    });
}

// ================= REST OF THE FUNCTIONS =================

async function handlePostAction(e, action, statusDivId) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = e.submitter;
    submitBtn.disabled = true;
    displayStatus(statusDivId, 'info', 'Procesando...');

    let data = {};
    let validationResult = null;

    if (action === 'agregarCategoria') {
        const formData = {
            nombre: document.getElementById('c_nombre').value
        };
        validationResult = validateCategoryData(formData);
    } else if (action === 'agregarProducto') {
        const formData = {};
        Array.from(form.elements).forEach(input => {
            if (input.id && input.id.startsWith('p_')) {
                const key = input.id.replace(/^p_/, '');
                formData[key] = input.value;
            }
        });
        validationResult = validateProductData(formData);
    }

    if (!validationResult || !validationResult.valid) {
        const errorMsg = validationResult?.errors?.join(', ') || validationResult?.error || 'Datos inválidos';
        displayStatus(statusDivId, 'error', errorMsg);
        submitBtn.disabled = false;
        return;
    }

    data = validationResult.data || validationResult;
    data.action = action;

    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus(statusDivId, 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            submitBtn.disabled = false;
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(data),
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const responseData = await response.json();

        if (responseData.status === 'success') {
            displayStatus(statusDivId, 'success', 'Operación completada exitosamente.');
            form.reset(); 
            if (action === 'agregarCategoria') {
                loadInitialData();
            }
        } else {
            displayStatus(statusDivId, 'error', 'Error al procesar la solicitud.');
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus(statusDivId, 'error', 'Tiempo de espera agotado. Intente nuevamente.');
        } else {
            displayStatus(statusDivId, 'error', 'Error de conexión.');
        }
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleQueryFilter(query, prefix) {
    const detailDiv = document.getElementById(`${prefix}_product_details`);
    const submitBtn = document.getElementById(`${prefix}_submit_btn`);
    const idInput = document.getElementById(`${prefix}_producto_id`);
    
    detailDiv.classList.add('hidden');
    detailDiv.innerHTML = '';
    idInput.value = '';
    submitBtn.disabled = true;

    const sanitizedQuery = sanitizeString(query, 100);
    if (sanitizedQuery.length < 2) return;

    try {
        if (!RateLimiter.canMakeRequest()) {
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(`${SCRIPT_URL}?action=buscarProducto&query=${encodeURIComponent(sanitizedQuery)}`, {
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const data = await response.json();

        if (data.status === 'success' && data.data && data.data.length > 0) {
            const product = data.data[0];
            productDataCache[product.id] = product;
            updateProductDetails(product, detailDiv, prefix);
            idInput.value = escapeHtml(String(product.id));
            submitBtn.disabled = false;
        } else {
            detailDiv.classList.remove('hidden');
            const p = createSafeElement('p', 'No se encontraron productos.', {
                style: 'color:var(--danger-color);'
            });
            detailDiv.appendChild(p);
        }

    } catch (error) {
        detailDiv.classList.remove('hidden');
        const p = createSafeElement('p', 'Error de búsqueda. Intente nuevamente.', {
            style: 'color:var(--danger-color);'
        });
        detailDiv.appendChild(p);
    }
}

function updateProductDetails(product, detailDiv, prefix) {
    detailDiv.classList.remove('hidden');
    detailDiv.innerHTML = '';
    
    const isCompra = prefix === 'co';
    const price = sanitizeNumber(
        isCompra ? product.precio_compra : product.precio_venta,
        0,
        Infinity,
        0
    );
    const priceLabel = isCompra ? 'Precio Compra Actual' : 'Precio Venta Actual';
    const stock = sanitizeNumber(product.stock, 0, Infinity, 0);
    const stockStyle = stock < 5 ? 'font-weight:bold; color:var(--danger-color);' : 'font-weight:bold; color:var(--secondary-color);';

    const p1 = document.createElement('p');
    p1.innerHTML = `<b>ID:</b> ${escapeHtml(String(product.id))} | <b>Producto:</b> ${escapeHtml(String(product.nombre || ''))} (Cód: ${escapeHtml(String(product.código || ''))})`;
    
    const p2 = document.createElement('p');
    p2.innerHTML = `<b>Categoría:</b> ${escapeHtml(String(product.categoría || ''))}`;
    
    const p3 = document.createElement('p');
    p3.innerHTML = `<b>Stock Actual:</b> <span style="${stockStyle}">${escapeHtml(String(stock))}</span>`;
    
    const p4 = document.createElement('p');
    p4.innerHTML = `<b>${priceLabel}:</b> $${price.toFixed(2)}`;
    
    detailDiv.appendChild(p1);
    detailDiv.appendChild(p2);
    detailDiv.appendChild(p3);
    detailDiv.appendChild(p4);
    
    const priceInput = document.getElementById(`${prefix}_precio_${isCompra ? 'compra' : 'venta'}`);
    if (priceInput) {
        priceInput.value = price.toFixed(2);
    }
    
    if (!isCompra && stock < 5) {
        const warningP = document.createElement('p');
        warningP.className = 'status-message warning';
        warningP.style.display = 'block';
        warningP.style.marginTop = '10px';
        warningP.textContent = `Stock bajo. Solo quedan ${stock} unidades.`;
        detailDiv.appendChild(warningP);
    }
}

async function handleTransactionPost(e, type) {
    e.preventDefault();
    const form = e.target;
    const prefix = type === 'compra' ? 'co' : 'v';
    const statusDivId = type === 'compra' ? 'statusCompra' : 'statusVenta';
    
    const submitBtn = document.getElementById(`${prefix}_submit_btn`);
    submitBtn.disabled = true;
    displayStatus(statusDivId, 'info', `Registrando ${type}...`);

    const productoId = document.getElementById(`${prefix}_producto_id`).value;
    
    if (!productoId) {
        displayStatus(statusDivId, 'error', 'No hay producto seleccionado. Busque y seleccione uno.');
        submitBtn.disabled = false;
        return;
    }

    const formData = {
        producto_id: productoId,
        cantidad: document.getElementById(`${prefix}_cantidad`).value,
        precio: document.getElementById(`${prefix}_precio_${type === 'compra' ? 'compra' : 'venta'}`).value,
        extra_data: document.getElementById(`${prefix}_${type === 'compra' ? 'proveedor' : 'cliente'}`).value
    };

    const validationResult = validateTransactionData(formData, type);
    
    if (!validationResult.valid) {
        displayStatus(statusDivId, 'error', validationResult.errors.join(', '));
        submitBtn.disabled = false;
        return;
    }

    const transaccionData = {
        action: 'registrarTransaccion',
        ...validationResult.data
    };

    // Validar stock antes de enviar (para ventas)
    if (type === 'venta' && productDataCache[productoId]) {
        const stockActual = sanitizeNumber(productDataCache[productoId].stock, 0, Infinity, 0);
        if (stockActual < transaccionData.cantidad) {
            displayStatus(statusDivId, 'error', `Stock insuficiente. Solo hay ${stockActual} unidades disponibles.`);
            submitBtn.disabled = false;
            return;
        }
    }

    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus(statusDivId, 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            submitBtn.disabled = false;
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(transaccionData),
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const data = await response.json();

        if (data.status === 'success') {
            displayStatus(statusDivId, 'success', 'Transacción registrada exitosamente.');
            form.reset(); 
            delete productDataCache[productoId]; 
            document.getElementById(`${prefix}_product_details`).classList.add('hidden');
        } else {
            displayStatus(statusDivId, 'error', 'Error al registrar la transacción.');
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus(statusDivId, 'error', 'Tiempo de espera agotado. Intente nuevamente.');
        } else {
            displayStatus(statusDivId, 'error', 'Error de conexión.');
        }
    } finally {
        submitBtn.disabled = false;
    }
}

async function loadInventario() {
    displayStatus('statusInventario', 'info', 'Cargando datos de inventario...');
    const tableBody = document.getElementById('inventarioTableBody');
    tableBody.innerHTML = '';
    
    const loadingRow = document.createElement('tr');
    const loadingCell = document.createElement('td');
    loadingCell.colSpan = 6;
    loadingCell.textContent = 'Cargando...';
    loadingRow.appendChild(loadingCell);
    tableBody.appendChild(loadingRow);

    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus('statusInventario', 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(`${SCRIPT_URL}?action=getInventario`, {
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const data = await response.json();

        if (data.status === 'success' && data.data && data.data.length > 0) {
            displayStatus('statusInventario', 'success', `Inventario cargado: ${data.data.length} productos.`);
            tableBody.innerHTML = '';
            
            data.data.forEach(p => {
                const row = document.createElement('tr');
                const stock = sanitizeNumber(p.stock, 0, Infinity, 0);
                const stockStyle = stock < 5 ? 'color: var(--danger-color); font-weight: bold;' : '';
                
                const cells = [
                    escapeHtml(String(p.id || '')),
                    escapeHtml(String(p.nombre || '')),
                    escapeHtml(String(p.código || '')),
                    escapeHtml(String(p.categoría || '')),
                    stock,
                    `$${sanitizeNumber(p.precio_venta, 0, Infinity, 0).toFixed(2)}`
                ];
                
                cells.forEach((cellText, index) => {
                    const cell = document.createElement('td');
                    if (index === 4 && stockStyle) {
                        cell.style.cssText = stockStyle;
                    }
                    cell.textContent = cellText;
                    row.appendChild(cell);
                });
                
                tableBody.appendChild(row);
            });
        } else {
            displayStatus('statusInventario', 'warning', 'No hay productos en inventario.');
            tableBody.innerHTML = '';
            const row = document.createElement('tr');
            const cell = document.createElement('td');
            cell.colSpan = 6;
            cell.textContent = 'No hay productos en inventario.';
            row.appendChild(cell);
            tableBody.appendChild(row);
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus('statusInventario', 'error', 'Tiempo de espera agotado al cargar inventario.');
        } else {
            displayStatus('statusInventario', 'error', 'Error al cargar inventario.');
        }
        tableBody.innerHTML = '';
        const row = document.createElement('tr');
        const cell = document.createElement('td');
        cell.colSpan = 6;
        cell.textContent = 'Error al cargar datos.';
        row.appendChild(cell);
        tableBody.appendChild(row);
    }
}

async function loadSummary(type) {
    const sheetName = type === 'Ventas' ? 'VENTAS' : 'COMPRAS';
    displayStatus('statusResumen', 'info', `Cargando resumen de ${sheetName}...`);
    const table = document.getElementById('resumenTable');
    const tableHead = table.querySelector('thead');
    const tableBody = document.getElementById('resumenTableBody');
    table.classList.add('hidden');
    tableBody.innerHTML = '';

    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus('statusResumen', 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(`${SCRIPT_URL}?action=getData&sheetName=${sheetName}`, {
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const data = await response.json();

        if (data.status === 'success' && data.data.length > 0) {
            displayStatus('statusResumen', 'success', `${data.data.length} ${sheetName} registradas.`);
            table.classList.remove('hidden');
            
            tableHead.innerHTML = '';
            const headerRow = document.createElement('tr');
            Object.keys(data.data[0]).forEach(h => {
                const th = document.createElement('th');
                th.textContent = h.toUpperCase().replace('_', ' ');
                headerRow.appendChild(th);
            });
            tableHead.appendChild(headerRow);

            tableBody.innerHTML = '';
            data.data.forEach(row => {
                const tr = document.createElement('tr');
                Object.values(row).forEach(value => {
                    const td = document.createElement('td');
                    if (value instanceof Date) {
                        td.textContent = value.toLocaleDateString();
                    } else if (typeof value === 'number') {
                        td.textContent = value.toFixed(2);
                    } else {
                        td.textContent = escapeHtml(String(value || ''));
                    }
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });

        } else {
            displayStatus('statusResumen', 'warning', `No hay datos disponibles.`);
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus('statusResumen', 'error', 'Tiempo de espera agotado al cargar resumen.');
        } else {
            displayStatus('statusResumen', 'error', 'Error al cargar resumen.');
        }
    }
}

async function handleConfigAction(action) {
    setButtonState(true);
    displayStatus('statusConfig', 'info', 'Procesando...');

    try {
        if (!RateLimiter.canMakeRequest()) {
            displayStatus('statusConfig', 'error', 'Demasiadas solicitudes. Por favor, espere un momento.');
            setButtonState(false);
            return;
        }
        
        RateLimiter.recordRequest();
        const response = await fetch(`${SCRIPT_URL}?action=${encodeURIComponent(action)}`, {
            signal: AbortSignal.timeout(APP_CONFIG.SECURITY.REQUEST_TIMEOUT)
        });
        const data = await response.json();

        if (data.status === 'success') {
            displayStatus('statusConfig', 'success', 'Operación completada exitosamente.');
            loadInitialData();
        } else {
            displayStatus('statusConfig', 'error', 'Error al procesar la solicitud.');
        }
    } catch (error) {
        if (error.name === 'TimeoutError') {
            displayStatus('statusConfig', 'error', 'Tiempo de espera agotado. Intente nuevamente.');
        } else {
            displayStatus('statusConfig', 'error', 'Error de conexión.');
        }
    } finally {
        setButtonState(false);
    }
}

function setButtonState(disabled) {
    document.getElementById('iniciarDBBtn').disabled = disabled;
    document.getElementById('resetDBBtn').disabled = disabled;
}

function displayStatus(elementId, type, message) {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.style.display = 'block';
    el.className = `status-message ${type}`;
    
    const iconMap = {
        'success': 'check',
        'error': 'times',
        'warning': 'exclamation-triangle',
        'info': 'info'
    };
    
    const icon = iconMap[type] || 'info';
    const safeMessage = escapeHtml(String(message));
    
    el.innerHTML = `<i class="fas fa-${icon}-circle"></i> ${safeMessage}`;
}
