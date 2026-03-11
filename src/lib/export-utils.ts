import Papa from 'papaparse';
import * as XLSX from 'xlsx';

/**
 * Utilitário para exportar dados para CSV no navegador.
 */
export function exportToCSV(data: any[], filename: string) {
    if (typeof window === 'undefined') return;

    const csv = Papa.unparse(data);
    // Adiciona BOM para o Excel reconhecer UTF-8 corretamente
    const csvContent = "\uFEFF" + csv;
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

/**
 * Utilitário para exportar dados para Excel (.xlsx) no navegador.
 */
export function exportToExcel(data: any[], filename: string, sheetName: string = 'Dados') {
    if (typeof window === 'undefined') return;

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

    // Gera o arquivo e inicia o download
    XLSX.writeFile(workbook, `${filename}.xlsx`);
}
