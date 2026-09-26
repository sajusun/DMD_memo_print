/**
 * Electron Main Process for DMD Memo & Billing Application
 * Secure, modern and production-ready
 */

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const XLSX = require('xlsx');
const db = require('./database/db');

let mainWindow = null;
let statsInterval = null;

// Helper to calculate CPU usage across cores
let previousCpuTime = getCpuTimes();

function getCpuTimes() {
  const cpus = os.cpus();
  let user = 0, nice = 0, sys = 0, idle = 0, irq = 0;
  for (const cpu of cpus) {
    user += cpu.times.user;
    nice += cpu.times.nice;
    sys += cpu.times.sys;
    idle += cpu.times.idle;
    irq += cpu.times.irq;
  }
  const total = user + nice + sys + idle + irq;
  return { idle, total };
}

function getCpuUsagePercent() {
  const current = getCpuTimes();
  const idleDiff = current.idle - previousCpuTime.idle;
  const totalDiff = current.total - previousCpuTime.total;
  previousCpuTime = current;
  if (totalDiff === 0) return 0;
  return Math.max(0, Math.min(100, Math.round((1 - idleDiff / totalDiff) * 100)));
}

async function createWindow() {
  // Initialize Database in user data path
  try {
    const userDataPath = path.join(app.getPath('userData'), 'database');
    await db.initDatabase(userDataPath);
  } catch (err) {
    console.error('Failed to initialize database in userData, falling back to local data folder:', err);
    await db.initDatabase();
  }

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 1024,
    minHeight: 700,
    title: 'Dinajpur Metallic Designs (DMD) - মেমো ও বিলিং সিস্টেম',
    icon: path.join(__dirname, 'icon', 'create-icon.png'),
    autoHideMenuBar: true,
    show: false,
    backgroundColor: '#0f172a',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Start periodic system stats
  if (statsInterval) clearInterval(statsInterval);
  statsInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;
    const memUsagePercent = Math.round((usedMem / totalMem) * 100);
    const cpuUsagePercent = getCpuUsagePercent();

    mainWindow.webContents.send('system:stats', {
      cpuUsage: cpuUsagePercent,
      memUsage: memUsagePercent,
      totalMemGB: (totalMem / (1024 * 1024 * 1024)).toFixed(1),
      freeMemGB: (freeMem / (1024 * 1024 * 1024)).toFixed(1)
    });
  }, 2000);
}

// ----------------------------------------------------
// IPC HANDLERS
// ----------------------------------------------------

// Dashboard Stats
ipcMain.handle('stats:getDashboard', async () => {
  return db.getDashboardStats();
});

// Memos
ipcMain.handle('memos:create', async (event, memoData) => {
  return db.createMemo(memoData);
});

ipcMain.handle('memos:getAll', async (event, filters) => {
  return db.getMemos(filters);
});

ipcMain.handle('memos:getById', async (event, id) => {
  return db.getMemoById(id);
});

ipcMain.handle('memos:update', async (event, id, memoData) => {
  return db.updateMemo(id, memoData);
});

ipcMain.handle('memos:delete', async (event, id) => {
  return db.deleteMemo(id);
});

ipcMain.handle('memos:addPayment', async (event, paymentData) => {
  return db.addDuePayment(paymentData);
});

// Customers
ipcMain.handle('customers:search', async (event, query) => {
  return db.searchCustomers(query);
});

ipcMain.handle('customers:getAll', async (event, filters) => {
  return db.getCustomers(filters);
});

// Settings
ipcMain.handle('settings:get', async () => {
  return db.getSettings();
});

ipcMain.handle('settings:save', async (event, settingsData) => {
  return db.updateSettings(settingsData);
});

// System Info
ipcMain.handle('system:getInfo', async () => {
  return {
    node: process.versions.node,
    chrome: process.versions.chrome,
    electron: process.versions.electron,
    platform: process.platform,
    arch: process.arch,
    cpuModel: os.cpus()[0] ? os.cpus()[0].model : 'Unknown',
    totalMemGB: (os.totalmem() / (1024 * 1024 * 1024)).toFixed(1)
  };
});

// Print
ipcMain.handle('print:invoice', async (event, options = {}) => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    mainWindow.webContents.print({
      silent: options.silent || false,
      printBackground: true,
      deviceName: options.deviceName || ''
    }, (success, failureReason) => {
      if (!success) {
        console.warn('Print canceled or failed:', failureReason);
      }
    });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Export PDF
ipcMain.handle('print:exportPdf', async (event, defaultFilename = 'Memo_Invoice.pdf') => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'মেমো পিডিএফ (PDF) হিসেবে সেভ করুন',
      defaultPath: path.join(app.getPath('documents'), defaultFilename),
      filters: [{ name: 'PDF Documents', extensions: ['pdf'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const pdfData = await mainWindow.webContents.printToPDF({
      printBackground: true,
      pageSize: 'A4',
      margins: {
        top: 0.2,
        bottom: 0.2,
        left: 0.2,
        right: 0.2
      }
    });

    fs.writeFileSync(filePath, pdfData);
    return { success: true, filePath };
  } catch (err) {
    console.error('PDF export error:', err);
    return { success: false, error: err.message };
  }
});

// Database Backup
ipcMain.handle('db:backup', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const today = new Date().toISOString().split('T')[0];
    const defaultName = `DMD_Database_Backup_${today}.sqlite`;
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'ডাটাবেজ ব্যাকআপ ফাইল সেভ করুন',
      defaultPath: path.join(app.getPath('documents'), defaultName),
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    db.backupDatabase(filePath);
    return { success: true, filePath };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Database Restore
ipcMain.handle('db:restore', async () => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
      title: 'ডাটাবেজ ব্যাকআপ ফাইল নির্বাচন করুন',
      properties: ['openFile'],
      filters: [{ name: 'SQLite Database', extensions: ['sqlite', 'db'] }]
    });

    if (canceled || !filePaths || !filePaths[0]) return { success: false, canceled: true };

    db.restoreDatabase(filePaths[0]);
    return { success: true, filePath: filePaths[0] };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// ----------------------------------------------------
// REPORTS & EXCEL / CSV EXPORT
// ----------------------------------------------------

ipcMain.handle('reports:getSalesData', async (event, filters) => {
  return db.getSalesReport(filters);
});

ipcMain.handle('reports:exportExcel', async (event, { type, data, defaultFilename = 'DMD_Report.xlsx' }) => {
  if (!mainWindow) return { success: false, error: 'Window not available' };
  try {
    const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
      title: 'এক্সেল ফাইল সেভ করুন',
      defaultPath: path.join(app.getPath('documents'), defaultFilename),
      filters: [{ name: 'Excel Spreadsheet', extensions: ['xlsx'] }]
    });

    if (canceled || !filePath) return { success: false, canceled: true };

    const wb = XLSX.utils.book_new();

    if (type === 'sales_summary') {
      // 1. Summary Sheet
      const summaryRows = [
        ['দিনাজপুর মেটালিক ডিজাইনস - বিক্রয় ও হিসাব রিপোর্ট'],
        ['তারিখ রেঞ্জ:', `${data.fromDate || 'শুরু'} হতে ${data.toDate || 'বর্তমান'}`],
        [],
        ['বিবরণ', 'পরিমাণ / টাকা'],
        ['মোট মেমো সংখ্যা', data.summary.memo_count],
        ['মোট পণ্য মূল্য (Subtotal)', data.summary.total_subtotal],
        ['মোট ছাড় / ডিসকাউন্ট (Discount)', data.summary.total_discount],
        ['সর্বমোট বিক্রয় মূল্য (Grand Total)', data.summary.total_billed],
        ['মেমোর সাথে নেওয়া অগ্রিম জমা (Advance)', data.summary.total_advance],
        ['বকেয়া বাবদ পরবর্তীতে আদায় (Due Collected)', data.summary.total_extra_paid],
        ['সর্বমোট নগদ ক্যাশ জমা (Total Cash Inflow)', data.summary.total_cash_inflow],
        ['বর্তমান মোট বকেয়া পাওনা (Net Due)', data.summary.total_due]
      ];
      const wsSummary = XLSX.utils.aoa_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'হিসাব সারসংক্ষেপ');

      // 2. Memos Sheet
      if (data.memos && data.memos.length) {
        const memoRows = data.memos.map(m => ({
          'মেমো নং': m.memo_no,
          'তারিখ': m.memo_date,
          'গ্রাহকের নাম': m.customer_name,
          'মোবাইল নম্বর': m.customer_phone || '',
          'ঠিকানা': m.customer_address || '',
          'মোট টাকা': m.subtotal,
          'ছাড়': m.discount,
          'সর্বমোট': m.grand_total,
          'অগ্রিম জমা': m.advance_paid,
          'বকেয়া': m.due_amount,
          'স্ট্যাটাস': m.payment_status === 'paid' ? 'পরিশোধিত' : (m.payment_status === 'partial' ? 'আংশিক বাকি' : 'সম্পূর্ণ বাকি')
        }));
        const wsMemos = XLSX.utils.json_to_sheet(memoRows);
        XLSX.utils.book_append_sheet(wb, wsMemos, 'মেমো তালিকা');
      }

      // 3. Item breakdown sheet
      if (data.itemsBreakdown && data.itemsBreakdown.length) {
        const itemRows = data.itemsBreakdown.map(i => ({
          'পণ্যের বিবরণ / কাজের নাম': i.description,
          'মোট পরিমাণ': i.total_quantity,
          'একক': i.unit || 'টি',
          'অর্ডার সংখ্যা': i.orders_count,
          'মোট বিক্রয় মূল্য (টাকা)': i.total_revenue
        }));
        const wsItems = XLSX.utils.json_to_sheet(itemRows);
        XLSX.utils.book_append_sheet(wb, wsItems, 'আইটেম বিক্রয় বিশ্লেষণ');
      }

      // 4. Payments collected
      if (data.payments && data.payments.length) {
        const payRows = data.payments.map(p => ({
          'জমার তারিখ': p.payment_date,
          'মেমো নং': p.memo_no,
          'গ্রাহকের নাম': p.customer_name,
          'মোবাইল': p.customer_phone || '',
          'টাকার পরিমাণ': p.amount,
          'পেমেন্ট মাধ্যম': p.payment_method || 'ক্যাশ',
          'নোট': p.note || ''
        }));
        const wsPayments = XLSX.utils.json_to_sheet(payRows);
        XLSX.utils.book_append_sheet(wb, wsPayments, 'আদায়কৃত বকেয়া');
      }
    } else if (type === 'memos_list') {
      const memoRows = (data || []).map(m => ({
        'মেমো নং': m.memo_no,
        'তারিখ': m.memo_date,
        'গ্রাহকের নাম': m.customer_name,
        'মোবাইল নম্বর': m.customer_phone || '',
        'ঠিকানা': m.customer_address || '',
        'মোট টাকা': m.subtotal,
        'ছাড়': m.discount,
        'সর্বমোট': m.grand_total,
        'অগ্রিম জমা': m.advance_paid,
        'বকেয়া': m.due_amount,
        'স্ট্যাটাস': m.payment_status === 'paid' ? 'পরিশোধিত' : (m.payment_status === 'partial' ? 'আংশিক বাকি' : 'সম্পূর্ণ বাকি')
      }));
      const ws = XLSX.utils.json_to_sheet(memoRows);
      XLSX.utils.book_append_sheet(wb, ws, 'মেমো খাতা');
    } else if (type === 'due_list') {
      const dueRows = (data || []).map(m => ({
        'মেমো নং': m.memo_no,
        'তারিখ': m.memo_date,
        'গ্রাহকের নাম': m.customer_name,
        'মোবাইল': m.customer_phone || '',
        'ঠিকানা': m.customer_address || '',
        'মোট বিল': m.grand_total,
        'জমা': m.advance_paid,
        'বকেয়া পাওনা': m.due_amount
      }));
      const ws = XLSX.utils.json_to_sheet(dueRows);
      XLSX.utils.book_append_sheet(wb, ws, 'বকেয়া তালিকা');
    }

    XLSX.writeFile(wb, filePath);
    return { success: true, filePath };
  } catch (err) {
    console.error('Excel export error:', err);
    return { success: false, error: err.message };
  }
});


// App Lifecycle
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (statsInterval) clearInterval(statsInterval);
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});