// Utilidades de exportación para el panel administrativo
class ExportUtilities {
    constructor() {
        this.initializeExcelLibrary();
    }

    // Inicializar la librería de Excel (SheetJS)
    initializeExcelLibrary() {
        if (!window.XLSX) {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
            script.onload = () => {
                console.log('Librería Excel cargada correctamente');
            };
            document.head.appendChild(script);
        }
    }

    // Obtener todos los reportes del localStorage
    getAllReports() {
        const allReports = [];
        const branches = Object.keys(CONFIG.branches);
        
        branches.forEach(branchId => {
            const history = Utils.getStorageItem(`${branchId}_history`) || [];
            history.forEach(report => {
                allReports.push({
                    ...report,
                    filial: CONFIG.branches[branchId].name,
                    filialId: branchId
                });
            });
        });

        return allReports.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
    }

    // Obtener reportes por filial
    getReportsByBranch(branchId) {
        const history = Utils.getStorageItem(`${branchId}_history`) || [];
        return history.map(report => ({
            ...report,
            filial: CONFIG.branches[branchId].name,
            filialId: branchId
        }));
    }

    // Obtener estadísticas generales
    getGeneralStats() {
        const allReports = this.getAllReports();
        const today = Utils.formatDate();
        const thisWeek = this.getWeekDates();
        
        const stats = {
            total: allReports.length,
            today: allReports.filter(r => r.fecha === today).length,
            thisWeek: allReports.filter(r => this.isInCurrentWeek(r.fecha)).length,
            byBranch: {}
        };

        Object.keys(CONFIG.branches).forEach(branchId => {
            const branchReports = allReports.filter(r => r.filialId === branchId);
            stats.byBranch[branchId] = {
                name: CONFIG.branches[branchId].name,
                total: branchReports.length,
                today: branchReports.filter(r => r.fecha === today).length,
                thisWeek: branchReports.filter(r => this.isInCurrentWeek(r.fecha)).length
            };
        });

        return stats;
    }

    // Verificar si una fecha está en la semana actual
    isInCurrentWeek(dateString) {
        const date = new Date(dateString.split('/').reverse().join('-'));
        const today = new Date();
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        const weekEnd = new Date(weekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        return date >= weekStart && date <= weekEnd;
    }

    // Obtener fechas de la semana actual
    getWeekDates() {
        const today = new Date();
        const start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        const end = new Date(start);
        end.setDate(start.getDate() + 6);
        
        return {
            start: Utils.formatDate(start),
            end: Utils.formatDate(end)
        };
    }

    // Exportar a PDF (usando jsPDF)
    async exportToPDF(data, options = {}) {
        const { jsPDF } = window.jspdf || {};
        if (!jsPDF) {
            throw new Error('jsPDF no está disponible');
        }

        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.width;
        const margin = 20;
        let yPosition = margin;

        // Configuración
        const title = options.title || 'Reporte de Datos';
        const branchFilter = options.branchFilter || 'todas';
        const dateRange = options.dateRange;

        // Título
        doc.setFontSize(16);
        doc.setFont(undefined, 'bold');
        doc.text(title, pageWidth / 2, yPosition, { align: 'center' });
        yPosition += 15;

        // Información del reporte
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Generado: ${Utils.formatDate()} ${Utils.formatTime()}`, margin, yPosition);
        yPosition += 8;
        
        if (branchFilter !== 'todas') {
            const branchName = CONFIG.branches[branchFilter]?.name || branchFilter;
            doc.text(`Filial: ${branchName}`, margin, yPosition);
            yPosition += 8;
        }

        if (dateRange) {
            doc.text(`Periodo: ${dateRange.start} - ${dateRange.end}`, margin, yPosition);
            yPosition += 8;
        }

        yPosition += 10;

        // Estadísticas generales
        const stats = this.getGeneralStats();
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Estadísticas Generales:', margin, yPosition);
        yPosition += 10;

        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Total de reportes: ${stats.total}`, margin, yPosition);
        yPosition += 6;
        doc.text(`Reportes hoy: ${stats.today}`, margin, yPosition);
        yPosition += 6;
        doc.text(`Reportes esta semana: ${stats.thisWeek}`, margin, yPosition);
        yPosition += 15;

        // Datos por filial si no hay filtro específico
        if (branchFilter === 'todas') {
            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Datos por Filial:', margin, yPosition);
            yPosition += 10;

            Object.values(stats.byBranch).forEach(branch => {
                doc.setFontSize(10);
                doc.setFont(undefined, 'bold');
                doc.text(`${branch.name}:`, margin, yPosition);
                yPosition += 6;
                
                doc.setFont(undefined, 'normal');
                doc.text(`  • Total: ${branch.total}`, margin, yPosition);
                yPosition += 5;
                doc.text(`  • Hoy: ${branch.today}`, margin, yPosition);
                yPosition += 5;
                doc.text(`  • Esta semana: ${branch.thisWeek}`, margin, yPosition);
                yPosition += 10;

                if (yPosition > 250) { // Nueva página si es necesario
                    doc.addPage();
                    yPosition = margin;
                }
            });
        }

        // Tabla de reportes recientes (últimos 10)
        const recentReports = data.slice(0, 10);
        if (recentReports.length > 0) {
            // Nueva página para la tabla
            doc.addPage();
            yPosition = margin;

            doc.setFontSize(12);
            doc.setFont(undefined, 'bold');
            doc.text('Últimos 10 Reportes:', margin, yPosition);
            yPosition += 15;

            // Encabezados de tabla
            doc.setFontSize(8);
            doc.setFont(undefined, 'bold');
            doc.text('Fecha', margin, yPosition);
            doc.text('Filial', margin + 30, yPosition);
            doc.text('Responsable', margin + 60, yPosition);
            doc.text('Visitantes', margin + 110, yPosition);
            doc.text('Conversiones', margin + 140, yPosition);
            yPosition += 8;

            // Línea separadora
            doc.line(margin, yPosition, pageWidth - margin, yPosition);
            yPosition += 5;

            // Datos de la tabla
            doc.setFont(undefined, 'normal');
            recentReports.forEach(report => {
                doc.text(report.fecha || '', margin, yPosition);
                doc.text(report.filial || '', margin + 30, yPosition);
                doc.text(report.responsable || '', margin + 60, yPosition);
                doc.text((report.visitantes || 0).toString(), margin + 110, yPosition);
                doc.text((report.conversiones || 0).toString(), margin + 140, yPosition);
                yPosition += 6;

                if (yPosition > 270) {
                    doc.addPage();
                    yPosition = margin;
                }
            });
        }

        // Descargar PDF
        const filename = `reporte_${branchFilter}_${Utils.formatDate().replace(/\//g, '-')}.pdf`;
        doc.save(filename);
        
        return filename;
    }

    // Exportar a Excel
    async exportToExcel(data, options = {}) {
        if (!window.XLSX) {
            throw new Error('Librería Excel no está disponible');
        }

        const branchFilter = options.branchFilter || 'todas';
        const workbook = XLSX.utils.book_new();

        // Hoja de estadísticas generales
        const stats = this.getGeneralStats();
        const statsData = [
            ['Estadísticas Generales', ''],
            ['Total de reportes', stats.total],
            ['Reportes hoy', stats.today],
            ['Reportes esta semana', stats.thisWeek],
            [''],
            ['Datos por Filial', '']
        ];

        Object.values(stats.byBranch).forEach(branch => {
            statsData.push([branch.name, '']);
            statsData.push(['  Total', branch.total]);
            statsData.push(['  Hoy', branch.today]);
            statsData.push(['  Esta semana', branch.thisWeek]);
            statsData.push(['']);
        });

        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, 'Estadísticas');

        // Hoja de datos detallados
        if (data.length > 0) {
            const detailData = data.map(report => ({
                'Fecha': report.fecha || '',
                'Filial': report.filial || '',
                'Responsable': report.responsable || '',
                'Visitantes': report.visitantes || 0,
                'Conversiones': report.conversiones || 0,
                'Bautismos': report.bautismos || 0,
                'Nuevos Miembros': report.nuevos_miembros || 0,
                'Contactos': report.contactos || 0,
                'Observaciones': report.observaciones || ''
            }));

            const detailSheet = XLSX.utils.json_to_sheet(detailData);
            XLSX.utils.book_append_sheet(workbook, detailSheet, 'Reportes Detallados');
        }

        // Hojas por filial (si no hay filtro específico)
        if (branchFilter === 'todas') {
            Object.keys(CONFIG.branches).forEach(branchId => {
                const branchReports = this.getReportsByBranch(branchId);
                if (branchReports.length > 0) {
                    const branchData = branchReports.map(report => ({
                        'Fecha': report.fecha || '',
                        'Responsable': report.responsable || '',
                        'Visitantes': report.visitantes || 0,
                        'Conversiones': report.conversiones || 0,
                        'Bautismos': report.bautismos || 0,
                        'Nuevos Miembros': report.nuevos_miembros || 0,
                        'Contactos': report.contactos || 0,
                        'Observaciones': report.observaciones || ''
                    }));

                    const branchSheet = XLSX.utils.json_to_sheet(branchData);
                    XLSX.utils.book_append_sheet(workbook, branchSheet, CONFIG.branches[branchId].name);
                }
            });
        }

        // Descargar archivo
        const filename = `datos_${branchFilter}_${Utils.formatDate().replace(/\//g, '-')}.xlsx`;
        XLSX.writeFile(workbook, filename);
        
        return filename;
    }

    // Exportar backup completo
    exportBackup() {
        const backup = {
            version: CONFIG.app.version,
            exported: new Date().toISOString(),
            data: {}
        };

        // Recopilar todos los datos del localStorage
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(CONFIG.storage.prefix)) {
                const cleanKey = key.replace(CONFIG.storage.prefix, '');
                try {
                    backup.data[cleanKey] = JSON.parse(localStorage.getItem(key));
                } catch (e) {
                    backup.data[cleanKey] = localStorage.getItem(key);
                }
            }
        });

        // Añadir estadísticas
        backup.stats = this.getGeneralStats();

        // Crear archivo JSON
        const dataStr = JSON.stringify(backup, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        
        // Descargar
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `backup_completo_${Utils.formatDate().replace(/\//g, '-')}.json`;
        link.click();
        
        URL.revokeObjectURL(link.href);
        return `backup_completo_${Utils.formatDate().replace(/\//g, '-')}.json`;
    }

    // Importar backup
    async importBackup(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    
                    if (!backup.version || !backup.data) {
                        throw new Error('Archivo de backup inválido');
                    }

                    // Confirmar importación
                    if (confirm('¿Está seguro de que desea importar este backup? Esto sobrescribirá todos los datos actuales.')) {
                        // Limpiar datos actuales
                        Utils.clearAppStorage();
                        
                        // Importar nuevos datos
                        Object.keys(backup.data).forEach(key => {
                            Utils.setStorageItem(key, backup.data[key]);
                        });

                        resolve({
                            success: true,
                            message: 'Backup importado correctamente',
                            stats: backup.stats
                        });
                    } else {
                        resolve({
                            success: false,
                            message: 'Importación cancelada por el usuario'
                        });
                    }
                } catch (error) {
                    reject({
                        success: false,
                        message: 'Error al procesar el archivo: ' + error.message
                    });
                }
            };

            reader.onerror = () => {
                reject({
                    success: false,
                    message: 'Error al leer el archivo'
                });
            };

            reader.readAsText(file);
        });
    }

    // Limpiar datos antiguos (más de X días)
    cleanOldData(daysToKeep = 365) {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
        
        let totalCleaned = 0;
        
        Object.keys(CONFIG.branches).forEach(branchId => {
            const history = Utils.getStorageItem(`${branchId}_history`) || [];
            const cleanedHistory = history.filter(report => {
                const reportDate = new Date(report.fecha.split('/').reverse().join('-'));
                return reportDate >= cutoffDate;
            });
            
            totalCleaned += history.length - cleanedHistory.length;
            Utils.setStorageItem(`${branchId}_history`, cleanedHistory);
        });

        return totalCleaned;
    }
}

// Crear instancia global
if (typeof window !== 'undefined') {
    window.ExportUtilities = new ExportUtilities();
}
