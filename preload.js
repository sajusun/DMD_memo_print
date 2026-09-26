/**
 * Electron Preload Script for DMD Memo Print Application
 * Securely exposes APIs to the Renderer process using contextBridge
 */

const { contextBridge, ipcRenderer } = require('electron');
const { bn2en, en2bn, formatCurrencyBn, inWordbn } = require('./utils/banglaConverter');

contextBridge.exposeInMainWorld('dmdAPI', {
  // Dashboard & Metrics
  getDashboardStats: () => ipcRenderer.invoke('stats:getDashboard'),

  // Memos
  createMemo: (memoData) => ipcRenderer.invoke('memos:create', memoData),
  getMemos: (filters) => ipcRenderer.invoke('memos:getAll', filters),
  getMemoById: (id) => ipcRenderer.invoke('memos:getById', id),
  updateMemo: (id, memoData) => ipcRenderer.invoke('memos:update', id, memoData),
  deleteMemo: (id) => ipcRenderer.invoke('memos:delete', id),
  addDuePayment: (paymentData) => ipcRenderer.invoke('memos:addPayment', paymentData),

  // Customers
  searchCustomers: (query) => ipcRenderer.invoke('customers:search', query),
  getCustomers: (filters) => ipcRenderer.invoke('customers:getAll', filters),

  // Settings
  getSettings: () => ipcRenderer.invoke('settings:get'),
  saveSettings: (settingsData) => ipcRenderer.invoke('settings:save', settingsData),

  // Printing & PDF
  printInvoice: (options) => ipcRenderer.invoke('print:invoice', options),
  exportPdf: (defaultFilename) => ipcRenderer.invoke('print:exportPdf', defaultFilename),

  // Database Backup & Restore
  backupDatabase: () => ipcRenderer.invoke('db:backup'),
  restoreDatabase: () => ipcRenderer.invoke('db:restore'),

  // Reports & Excel Export
  getSalesReport: (filters) => ipcRenderer.invoke('reports:getSalesData', filters),
  exportExcel: (options) => ipcRenderer.invoke('reports:exportExcel', options),

  // System & OS Info
  getSystemInfo: () => ipcRenderer.invoke('system:getInfo'),
  onSystemStats: (callback) => {
    const handler = (event, stats) => callback(stats);
    ipcRenderer.on('system:stats', handler);
    return () => ipcRenderer.removeListener('system:stats', handler);
  },

  // Bengali Conversion Utilities (Runs client-side instantly)
  bangla: {
    bn2en,
    en2bn,
    formatCurrencyBn,
    inWordbn
  }
});