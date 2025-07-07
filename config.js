// Configuración global del Sistema de Reportes Misioneros
const CONFIG = {
    // Información de las filiales
    branches: {
        latekera: {
            name: 'La Tekera',
            logo: 'logo/logo La Tekera.png',
            color: '#2563eb',
            contactInfo: {
                phone: '+58 424-000-0000',
                email: 'latekera@iglesia.com',
                address: 'Dirección La Tekera'
            }
        },
        elsauce: {
            name: 'El Sauce',
            logo: 'logo/Logo El Sauce.jpg',
            color: '#059669',
            contactInfo: {
                phone: '+58 424-111-1111',
                email: 'elsauce@iglesia.com',
                address: 'Dirección El Sauce'
            }
        },
        elpital: {
            name: 'El Pital',
            logo: 'logo/logo El Pital.png',
            color: '#dc2626',
            contactInfo: {
                phone: '+58 424-222-2222',
                email: 'elpital@iglesia.com',
                address: 'Dirección El Pital'
            }
        }
    },

    // Configuración de la aplicación
    app: {
        version: '2.0.0',
        title: 'Sistema de Reportes Misioneros',
        organization: 'Iglesia Central',
        maxDrafts: 10,
        maxHistoryItems: 50,
        autoSaveInterval: 30000, // 30 segundos
        exportFormats: ['pdf', 'excel', 'json']
    },

    // Configuración de validación
    validation: {
        minAge: 0,
        maxAge: 120,
        maxTextLength: 500,
        requiredFields: ['fecha', 'responsable'],
        phoneRegex: /^[\+]?[0-9]{10,14}$/,
        emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },

    // Configuración de localStorage
    storage: {
        prefix: 'reporte_misionero_',
        draftsKey: 'drafts',
        historyKey: 'history',
        statsKey: 'stats',
        configKey: 'user_config',
        themeKey: 'theme'
    },

    // Configuración de notificaciones
    notifications: {
        autoClose: 5000,
        position: 'top-right',
        showProgress: true
    },

    // Configuración de PDF
    pdf: {
        format: 'a4',
        margin: 20,
        headerHeight: 60,
        footerHeight: 40,
        fontSize: {
            title: 18,
            subtitle: 14,
            body: 11,
            caption: 9
        }
    },

    // URLs de la aplicación
    urls: {
        index: 'index.html',
        admin: 'admin.html',
        branches: {
            latekera: 'latekera.html',
            elsauce: 'elsauce.html',
            elpital: 'elpital.html'
        }
    }
};

// Utilidades globales
const Utils = {
    // Formatear fecha
    formatDate: (date = new Date()) => {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },

    // Formatear hora
    formatTime: (date = new Date()) => {
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Validar teléfono
    validatePhone: (phone) => {
        return CONFIG.validation.phoneRegex.test(phone);
    },

    // Validar email
    validateEmail: (email) => {
        return CONFIG.validation.emailRegex.test(email);
    },

    // Generar ID único
    generateId: () => {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Obtener configuración de filial
    getBranchConfig: (branchId) => {
        return CONFIG.branches[branchId] || null;
    },

    // Obtener todas las filiales
    getAllBranches: () => {
        return Object.keys(CONFIG.branches).map(id => ({
            id,
            ...CONFIG.branches[id]
        }));
    },

    // Obtener datos del localStorage con prefijo
    getStorageItem: (key) => {
        try {
            const data = localStorage.getItem(CONFIG.storage.prefix + key);
            return data ? JSON.parse(data) : null;
        } catch (e) {
            console.error('Error al leer del localStorage:', e);
            return null;
        }
    },

    // Guardar datos en localStorage con prefijo
    setStorageItem: (key, value) => {
        try {
            localStorage.setItem(CONFIG.storage.prefix + key, JSON.stringify(value));
            return true;
        } catch (e) {
            console.error('Error al guardar en localStorage:', e);
            return false;
        }
    },

    // Eliminar item del localStorage
    removeStorageItem: (key) => {
        try {
            localStorage.removeItem(CONFIG.storage.prefix + key);
            return true;
        } catch (e) {
            console.error('Error al eliminar del localStorage:', e);
            return false;
        }
    },

    // Limpiar todo el localStorage de la app
    clearAppStorage: () => {
        try {
            const keys = Object.keys(localStorage);
            keys.forEach(key => {
                if (key.startsWith(CONFIG.storage.prefix)) {
                    localStorage.removeItem(key);
                }
            });
            return true;
        } catch (e) {
            console.error('Error al limpiar localStorage:', e);
            return false;
        }
    }
};

// Sistema de notificaciones mejorado
const NotificationSystem = {
    show: (message, type = 'info', duration = CONFIG.notifications.autoClose) => {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-message">${message}</span>
                <button class="toast-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
            ${CONFIG.notifications.showProgress ? '<div class="toast-progress"></div>' : ''}
        `;

        // Estilos dinámicos para el toast
        const style = document.createElement('style');
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: #2563eb;
                color: white;
                padding: 16px 24px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                transform: translateX(400px);
                transition: all 0.3s ease;
                z-index: 10000;
                max-width: 350px;
                min-width: 250px;
            }
            .toast.show { transform: translateX(0); }
            .toast.success { background: #10b981; }
            .toast.error { background: #ef4444; }
            .toast.warning { background: #f59e0b; }
            .toast.info { background: #2563eb; }
            .toast-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 12px;
            }
            .toast-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                padding: 0;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .toast-progress {
                position: absolute;
                bottom: 0;
                left: 0;
                height: 3px;
                background: rgba(255,255,255,0.3);
                border-radius: 0 0 8px 8px;
                animation: progress ${duration}ms linear;
            }
            @keyframes progress {
                from { width: 100%; }
                to { width: 0%; }
            }
        `;

        if (!document.querySelector('style[data-toast-styles]')) {
            style.setAttribute('data-toast-styles', 'true');
            document.head.appendChild(style);
        }

        document.body.appendChild(toast);

        // Mostrar el toast
        setTimeout(() => toast.classList.add('show'), 100);

        // Eliminar automáticamente
        if (duration > 0) {
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => toast.remove(), 300);
            }, duration);
        }

        return toast;
    },

    success: (message) => NotificationSystem.show(message, 'success'),
    error: (message) => NotificationSystem.show(message, 'error'),
    warning: (message) => NotificationSystem.show(message, 'warning'),
    info: (message) => NotificationSystem.show(message, 'info')
};

// Sistema de navegación global
const Navigation = {
    // Navegar a una página
    goTo: (page) => {
        if (CONFIG.urls[page]) {
            window.location.href = CONFIG.urls[page];
        } else if (CONFIG.urls.branches[page]) {
            window.location.href = CONFIG.urls.branches[page];
        } else {
            console.error('Página no encontrada:', page);
        }
    },

    // Obtener página actual
    getCurrentPage: () => {
        const path = window.location.pathname;
        const filename = path.split('/').pop();
        
        if (filename === 'index.html' || filename === '') return 'index';
        if (filename === 'admin.html') return 'admin';
        if (filename === 'latekera.html') return 'latekera';
        if (filename === 'elsauce.html') return 'elsauce';
        if (filename === 'elpital.html') return 'elpital';
        
        return 'unknown';
    },

    // Crear menú de navegación
    createNavMenu: () => {
        const currentPage = Navigation.getCurrentPage();
        const nav = document.createElement('nav');
        nav.className = 'global-nav';
        
        nav.innerHTML = `
            <div class="nav-container">
                <div class="nav-brand">
                    <img src="logo/central.png" alt="Logo" class="nav-logo">
                    <span class="nav-title">${CONFIG.app.title}</span>
                </div>
                <div class="nav-links">
                    <a href="index.html" class="${currentPage === 'index' ? 'active' : ''}">Inicio</a>
                    <a href="latekera.html" class="${currentPage === 'latekera' ? 'active' : ''}">La Tekera</a>
                    <a href="elsauce.html" class="${currentPage === 'elsauce' ? 'active' : ''}">El Sauce</a>
                    <a href="elpital.html" class="${currentPage === 'elpital' ? 'active' : ''}">El Pital</a>
                    <a href="admin.html" class="${currentPage === 'admin' ? 'active' : ''}">Admin</a>
                </div>
                <div class="nav-controls">
                    <button id="global-theme-toggle" class="theme-toggle">🌙</button>
                </div>
            </div>
        `;

        // Estilos para el menú de navegación
        const navStyles = document.createElement('style');
        navStyles.textContent = `
            .global-nav {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border-bottom: 1px solid rgba(0, 0, 0, 0.1);
                padding: 12px 0;
                position: sticky;
                top: 0;
                z-index: 1000;
                margin-bottom: 20px;
            }
            body.dark-theme .global-nav {
                background: rgba(30, 41, 59, 0.95);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            .nav-container {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 0 20px;
            }
            .nav-brand {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            .nav-logo {
                width: 40px;
                height: 40px;
                border-radius: 8px;
            }
            .nav-title {
                font-weight: bold;
                color: #2d3748;
                font-size: 1.2em;
            }
            body.dark-theme .nav-title {
                color: #e2e8f0;
            }
            .nav-links {
                display: flex;
                gap: 24px;
            }
            .nav-links a {
                text-decoration: none;
                color: #4a5568;
                font-weight: 500;
                padding: 8px 16px;
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            body.dark-theme .nav-links a {
                color: #a0aec0;
            }
            .nav-links a:hover {
                background: rgba(37, 99, 235, 0.1);
                color: #2563eb;
            }
            .nav-links a.active {
                background: #2563eb;
                color: white;
            }
            .theme-toggle {
                background: none;
                border: 2px solid #e2e8f0;
                border-radius: 50%;
                width: 40px;
                height: 40px;
                cursor: pointer;
                font-size: 16px;
                transition: all 0.2s ease;
            }
            body.dark-theme .theme-toggle {
                border-color: #4a5568;
            }
            .theme-toggle:hover {
                transform: scale(1.1);
                border-color: #2563eb;
            }
            @media (max-width: 768px) {
                .nav-container {
                    flex-direction: column;
                    gap: 16px;
                }
                .nav-links {
                    gap: 12px;
                    flex-wrap: wrap;
                    justify-content: center;
                }
            }
        `;

        if (!document.querySelector('style[data-nav-styles]')) {
            navStyles.setAttribute('data-nav-styles', 'true');
            document.head.appendChild(navStyles);
        }

        return nav;
    },

    // Inicializar navegación
    init: () => {
        // Insertar menú de navegación al inicio del body
        const nav = Navigation.createNavMenu();
        document.body.insertBefore(nav, document.body.firstChild);

        // Configurar toggle de tema global
        const themeToggle = document.getElementById('global-theme-toggle');
        if (themeToggle) {
            const currentTheme = Utils.getStorageItem(CONFIG.storage.themeKey) || 'light';
            if (currentTheme === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggle.textContent = '☀️';
            }

            themeToggle.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                themeToggle.textContent = isDark ? '☀️' : '🌙';
                Utils.setStorageItem(CONFIG.storage.themeKey, isDark ? 'dark' : 'light');
            });
        }
    }
};

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.Utils = Utils;
    window.NotificationSystem = NotificationSystem;
    window.Navigation = Navigation;
}
