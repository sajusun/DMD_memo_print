/**
 * Database Module for DMD Memo & Billing Application
 * Powered by SQLite (sql.js) with zero-native dependency and automatic disk persistence.
 */

const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

let db = null;
let dbFilePath = null;
let SQL = null;

/**
 * Initialize the SQLite database
 * @param {string} [storagePath] - Custom storage path or userData path
 */
async function initDatabase(storagePath) {
  if (!SQL) {
    SQL = await initSqlJs();
  }

  const baseDir = storagePath || path.join(__dirname, '..', 'data');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  dbFilePath = path.join(baseDir, 'dmd_database.sqlite');

  if (fs.existsSync(dbFilePath)) {
    try {
      const fileBuffer = fs.readFileSync(dbFilePath);
      db = new SQL.Database(fileBuffer);
    } catch (err) {
      console.error('Failed to load existing SQLite database, creating fresh one:', err);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  createSchema();
  seedInitialSettings();
  saveToDisk();

  return db;
}

/**
 * Persist database state to the SQLite file
 */
function saveToDisk() {
  if (!db || !dbFilePath) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbFilePath, buffer);
  } catch (err) {
    console.error('Error saving SQLite database to disk:', err);
  }
}

/**
 * Create tables if they do not exist
 */
function createSchema() {
  db.run(`
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      shop_name TEXT NOT NULL,
      tagline TEXT,
      proprietor TEXT,
      phone_1 TEXT,
      phone_2 TEXT,
      address TEXT,
      memo_prefix TEXT DEFAULT 'DMD-',
      next_memo_number INTEGER DEFAULT 1001,
      print_mode TEXT DEFAULT 'full_vector',
      pad_offset_top_cm REAL DEFAULT 0.0,
      pad_offset_left_cm REAL DEFAULT 0.0,
      theme TEXT DEFAULT 'slate',
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT,
      address TEXT,
      total_orders INTEGER DEFAULT 0,
      total_billed REAL DEFAULT 0.0,
      total_paid REAL DEFAULT 0.0,
      total_due REAL DEFAULT 0.0,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS memos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memo_no TEXT UNIQUE NOT NULL,
      customer_id INTEGER,
      customer_name TEXT NOT NULL,
      customer_phone TEXT,
      customer_address TEXT,
      memo_date TEXT NOT NULL,
      delivery_date TEXT,
      subtotal REAL DEFAULT 0.0,
      discount REAL DEFAULT 0.0,
      grand_total REAL DEFAULT 0.0,
      advance_paid REAL DEFAULT 0.0,
      due_amount REAL DEFAULT 0.0,
      payment_status TEXT DEFAULT 'due',
      in_words_bn TEXT,
      notes TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS memo_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memo_id INTEGER NOT NULL,
      sl_no INTEGER NOT NULL,
      description TEXT NOT NULL,
      quantity REAL NOT NULL,
      unit TEXT DEFAULT 'টি',
      unit_price REAL NOT NULL,
      total_price REAL NOT NULL,
      FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      memo_id INTEGER NOT NULL,
      customer_id INTEGER,
      payment_date TEXT NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT DEFAULT 'ক্যাশ',
      note TEXT,
      created_at TEXT,
      FOREIGN KEY (memo_id) REFERENCES memos(id) ON DELETE CASCADE
    );
  `);
}

/**
 * Seed initial settings
 */
function seedInitialSettings() {
  const result = db.exec("SELECT COUNT(*) AS cnt FROM settings WHERE id = 1");
  const count = result.length && result[0].values.length ? result[0].values[0][0] : 0;

  if (count === 0) {
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO settings (
        id, shop_name, tagline, proprietor, phone_1, phone_2, address,
        memo_prefix, next_memo_number, print_mode, pad_offset_top_cm, pad_offset_left_cm, theme, created_at, updated_at
      ) VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run([
      'দিনাজপুর মেটালিক ডিজাইনস (DMD)',
      'গ্রিল, গেট, শাটার, এসএস ও এমএস রেলিং এবং আধুনিক মেটালিক ফার্নিচার প্রস্তুতকারক',
      'মোঃ সাখাওয়াত হোসেন',
      '০১৭১২-০৮৭৮০৫',
      '০১৭৩৩-০৬০০৫৫',
      'মডার্ন মোড়, দিনাজপুর',
      'DMD-',
      1001,
      'full_vector',
      0.0,
      0.0,
      'slate',
      now,
      now
    ]);
    stmt.free();
  }
}

/**
 * Helper to convert sql.js exec result into an array of objects
 */
function resultToObjects(res) {
  if (!res || !res.length) return [];
  const columns = res[0].columns;
  const values = res[0].values;
  return values.map(row => {
    const obj = {};
    columns.forEach((col, idx) => {
      obj[col] = row[idx];
    });
    return obj;
  });
}

/**
 * Get Settings
 */
function getSettings() {
  const res = db.exec("SELECT * FROM settings WHERE id = 1");
  const list = resultToObjects(res);
  return list.length ? list[0] : null;
}

/**
 * Update Settings
 */
function updateSettings(settingsObj) {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    UPDATE settings SET
      shop_name = ?,
      tagline = ?,
      proprietor = ?,
      phone_1 = ?,
      phone_2 = ?,
      address = ?,
      memo_prefix = ?,
      next_memo_number = ?,
      print_mode = ?,
      pad_offset_top_cm = ?,
      pad_offset_left_cm = ?,
      theme = ?,
      updated_at = ?
    WHERE id = 1
  `);

  stmt.run([
    settingsObj.shop_name || 'দিনাজপুর মেটালিক ডিজাইনস',
    settingsObj.tagline || '',
    settingsObj.proprietor || '',
    settingsObj.phone_1 || '',
    settingsObj.phone_2 || '',
    settingsObj.address || '',
    settingsObj.memo_prefix || 'DMD-',
    parseInt(settingsObj.next_memo_number, 10) || 1001,
    settingsObj.print_mode || 'full_vector',
    parseFloat(settingsObj.pad_offset_top_cm) || 0.0,
    parseFloat(settingsObj.pad_offset_left_cm) || 0.0,
    settingsObj.theme || 'slate',
    now
  ]);
  stmt.free();
  saveToDisk();

  return getSettings();
}

/**
 * Find or create customer
 */
function findOrCreateCustomer(name, phone, address) {
  const trimmedName = (name || '').trim();
  const trimmedPhone = (phone || '').trim();
  const trimmedAddress = (address || '').trim();
  const now = new Date().toISOString();

  let customerId = null;

  if (trimmedPhone) {
    const findStmt = db.prepare("SELECT id FROM customers WHERE phone = ? LIMIT 1");
    findStmt.bind([trimmedPhone]);
    if (findStmt.step()) {
      customerId = findStmt.get()[0];
    }
    findStmt.free();
  }

  if (!customerId && trimmedName) {
    const findStmt = db.prepare("SELECT id FROM customers WHERE name = ? AND (phone IS NULL OR phone = '') LIMIT 1");
    findStmt.bind([trimmedName]);
    if (findStmt.step()) {
      customerId = findStmt.get()[0];
    }
    findStmt.free();
  }

  if (customerId) {
    const updateStmt = db.prepare(`
      UPDATE customers SET 
        name = ?,
        address = CASE WHEN (? != '') THEN ? ELSE address END,
        updated_at = ?
      WHERE id = ?
    `);
    updateStmt.run([trimmedName, trimmedAddress, trimmedAddress, now, customerId]);
    updateStmt.free();
  } else {
    const insertStmt = db.prepare(`
      INSERT INTO customers (name, phone, address, total_orders, total_billed, total_paid, total_due, created_at, updated_at)
      VALUES (?, ?, ?, 0, 0, 0, 0, ?, ?)
    `);
    insertStmt.run([trimmedName, trimmedPhone, trimmedAddress, now, now]);
    insertStmt.free();

    const idRes = db.exec("SELECT last_insert_rowid()");
    customerId = idRes[0].values[0][0];
  }

  return customerId;
}

/**
 * Recalculate customer metrics (total_orders, billed, paid, due)
 */
function recalculateCustomer(customerId) {
  if (!customerId) return;

  const res = db.exec(`
    SELECT 
      COUNT(*) AS orders,
      COALESCE(SUM(grand_total), 0) AS billed,
      COALESCE(SUM(advance_paid), 0) AS advance,
      COALESCE(SUM(due_amount), 0) AS due
    FROM memos
    WHERE customer_id = ${customerId}
  `);

  const stats = resultToObjects(res)[0] || { orders: 0, billed: 0, advance: 0, due: 0 };

  // Also include subsequent payments
  const payRes = db.exec(`
    SELECT COALESCE(SUM(amount), 0) AS total_extra_payments
    FROM payments
    WHERE customer_id = ${customerId}
  `);
  const extraPaid = payRes.length && payRes[0].values.length ? payRes[0].values[0][0] : 0;

  const totalPaid = stats.advance + extraPaid;
  const netDue = Math.max(0, stats.billed - totalPaid);

  const now = new Date().toISOString();
  db.run(`
    UPDATE customers SET
      total_orders = ${stats.orders},
      total_billed = ${stats.billed},
      total_paid = ${totalPaid},
      total_due = ${netDue},
      updated_at = '${now}'
    WHERE id = ${customerId}
  `);
}

/**
 * Generate next memo number
 */
function getNextMemoNumber() {
  const settings = getSettings();
  const prefix = settings.memo_prefix || 'DMD-';
  const num = settings.next_memo_number || 1001;
  return `${prefix}${num}`;
}

/**
 * Increment next memo number
 */
function incrementMemoNumber() {
  db.run("UPDATE settings SET next_memo_number = next_memo_number + 1 WHERE id = 1");
  saveToDisk();
}

/**
 * Create a new memo
 */
function createMemo(memoData) {
  const now = new Date().toISOString();
  const customerId = findOrCreateCustomer(memoData.customer_name, memoData.customer_phone, memoData.customer_address);

  let memoNo = memoData.memo_no ? memoData.memo_no.trim() : getNextMemoNumber();

  // Ensure unique memo_no
  const checkStmt = db.prepare("SELECT id FROM memos WHERE memo_no = ?");
  checkStmt.bind([memoNo]);
  if (checkStmt.step()) {
    checkStmt.free();
    memoNo = `${memoNo}-${Date.now().toString().slice(-4)}`;
  } else {
    checkStmt.free();
  }

  const subtotal = parseFloat(memoData.subtotal) || 0;
  const discount = parseFloat(memoData.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const advancePaid = parseFloat(memoData.advance_paid) || 0;
  const dueAmount = Math.max(0, grandTotal - advancePaid);

  let paymentStatus = 'due';
  if (dueAmount <= 0) {
    paymentStatus = 'paid';
  } else if (advancePaid > 0) {
    paymentStatus = 'partial';
  }

  const insertMemoStmt = db.prepare(`
    INSERT INTO memos (
      memo_no, customer_id, customer_name, customer_phone, customer_address,
      memo_date, delivery_date, subtotal, discount, grand_total, advance_paid, due_amount,
      payment_status, in_words_bn, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertMemoStmt.run([
    memoNo,
    customerId,
    memoData.customer_name,
    memoData.customer_phone || '',
    memoData.customer_address || '',
    memoData.memo_date || new Date().toISOString().split('T')[0],
    memoData.delivery_date || '',
    subtotal,
    discount,
    grandTotal,
    advancePaid,
    dueAmount,
    paymentStatus,
    memoData.in_words_bn || '',
    memoData.notes || '',
    now,
    now
  ]);
  insertMemoStmt.free();

  const memoIdRes = db.exec("SELECT last_insert_rowid()");
  const memoId = memoIdRes[0].values[0][0];

  // Insert items
  if (Array.isArray(memoData.items)) {
    const itemStmt = db.prepare(`
      INSERT INTO memo_items (memo_id, sl_no, description, quantity, unit, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    memoData.items.forEach((item, index) => {
      const desc = (item.description || '').trim();
      if (!desc) return;
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unit_price) || 0;
      const total = qty * price;

      itemStmt.run([
        memoId,
        index + 1,
        desc,
        qty,
        item.unit || 'টি',
        price,
        total
      ]);
    });
    itemStmt.free();
  }

  // Increment settings next memo sequence
  incrementMemoNumber();

  // Recalculate customer metrics
  recalculateCustomer(customerId);

  saveToDisk();

  return getMemoById(memoId);
}

/**
 * Get full memo details by ID
 */
function getMemoById(id) {
  const res = db.exec(`SELECT * FROM memos WHERE id = ${id}`);
  const list = resultToObjects(res);
  if (!list.length) return null;

  const memo = list[0];

  const itemsRes = db.exec(`SELECT * FROM memo_items WHERE memo_id = ${id} ORDER BY sl_no ASC`);
  memo.items = resultToObjects(itemsRes);

  const paymentsRes = db.exec(`SELECT * FROM payments WHERE memo_id = ${id} ORDER BY id ASC`);
  memo.payments = resultToObjects(paymentsRes);

  return memo;
}

/**
 * Get list of memos with optional search, status and date filters
 */
function getMemos({ search = '', status = '', fromDate = '', toDate = '', limit = 50, offset = 0 } = {}) {
  let whereClauses = [];

  if (search && search.trim()) {
    const s = search.trim().replace(/'/g, "''");
    whereClauses.push(`(memo_no LIKE '%${s}%' OR customer_name LIKE '%${s}%' OR customer_phone LIKE '%${s}%' OR customer_address LIKE '%${s}%')`);
  }

  if (status && status !== 'all') {
    const st = status.trim().replace(/'/g, "''");
    whereClauses.push(`payment_status = '${st}'`);
  }

  if (fromDate) {
    whereClauses.push(`memo_date >= '${fromDate}'`);
  }

  if (toDate) {
    whereClauses.push(`memo_date <= '${toDate}'`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const countRes = db.exec(`SELECT COUNT(*) AS total FROM memos ${whereSql}`);
  const total = countRes.length && countRes[0].values.length ? countRes[0].values[0][0] : 0;

  const res = db.exec(`
    SELECT * FROM memos 
    ${whereSql} 
    ORDER BY id DESC 
    LIMIT ${limit} OFFSET ${offset}
  `);

  return {
    total,
    memos: resultToObjects(res)
  };
}

/**
 * Update an existing memo
 */
function updateMemo(id, memoData) {
  const currentMemo = getMemoById(id);
  if (!currentMemo) throw new Error('Memo not found');

  const now = new Date().toISOString();
  const customerId = findOrCreateCustomer(memoData.customer_name, memoData.customer_phone, memoData.customer_address);

  const subtotal = parseFloat(memoData.subtotal) || 0;
  const discount = parseFloat(memoData.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);
  const advancePaid = parseFloat(memoData.advance_paid) || 0;

  // Calculate remaining due taking existing payments into account
  const payRes = db.exec(`SELECT COALESCE(SUM(amount), 0) AS total_extra FROM payments WHERE memo_id = ${id}`);
  const extraPaid = payRes.length && payRes[0].values.length ? payRes[0].values[0][0] : 0;

  const totalPaid = advancePaid + extraPaid;
  const dueAmount = Math.max(0, grandTotal - totalPaid);

  let paymentStatus = 'due';
  if (dueAmount <= 0) {
    paymentStatus = 'paid';
  } else if (totalPaid > 0) {
    paymentStatus = 'partial';
  }

  const updateStmt = db.prepare(`
    UPDATE memos SET
      customer_id = ?,
      customer_name = ?,
      customer_phone = ?,
      customer_address = ?,
      memo_date = ?,
      delivery_date = ?,
      subtotal = ?,
      discount = ?,
      grand_total = ?,
      advance_paid = ?,
      due_amount = ?,
      payment_status = ?,
      in_words_bn = ?,
      notes = ?,
      updated_at = ?
    WHERE id = ?
  `);

  updateStmt.run([
    customerId,
    memoData.customer_name,
    memoData.customer_phone || '',
    memoData.customer_address || '',
    memoData.memo_date || currentMemo.memo_date,
    memoData.delivery_date || '',
    subtotal,
    discount,
    grandTotal,
    advancePaid,
    dueAmount,
    paymentStatus,
    memoData.in_words_bn || '',
    memoData.notes || '',
    now,
    id
  ]);
  updateStmt.free();

  // Replace items
  db.run(`DELETE FROM memo_items WHERE memo_id = ${id}`);
  if (Array.isArray(memoData.items)) {
    const itemStmt = db.prepare(`
      INSERT INTO memo_items (memo_id, sl_no, description, quantity, unit, unit_price, total_price)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    memoData.items.forEach((item, index) => {
      const desc = (item.description || '').trim();
      if (!desc) return;
      const qty = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.unit_price) || 0;
      const total = qty * price;

      itemStmt.run([
        id,
        index + 1,
        desc,
        qty,
        item.unit || 'টি',
        price,
        total
      ]);
    });
    itemStmt.free();
  }

  recalculateCustomer(customerId);
  if (currentMemo.customer_id && currentMemo.customer_id !== customerId) {
    recalculateCustomer(currentMemo.customer_id);
  }

  saveToDisk();

  return getMemoById(id);
}

/**
 * Delete a memo
 */
function deleteMemo(id) {
  const memo = getMemoById(id);
  if (!memo) return false;

  const customerId = memo.customer_id;

  db.run(`DELETE FROM payments WHERE memo_id = ${id}`);
  db.run(`DELETE FROM memo_items WHERE memo_id = ${id}`);
  db.run(`DELETE FROM memos WHERE id = ${id}`);

  if (customerId) {
    recalculateCustomer(customerId);
  }

  saveToDisk();
  return true;
}

/**
 * Add a payment towards an existing memo's due amount
 */
function addDuePayment({ memo_id, amount, payment_method = 'ক্যাশ', note = '', payment_date }) {
  const memo = getMemoById(memo_id);
  if (!memo) throw new Error('Memo not found');

  const payAmount = parseFloat(amount) || 0;
  if (payAmount <= 0) throw new Error('Payment amount must be greater than zero');

  const now = new Date().toISOString();
  const payDate = payment_date || new Date().toISOString().split('T')[0];

  const payStmt = db.prepare(`
    INSERT INTO payments (memo_id, customer_id, payment_date, amount, payment_method, note, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  payStmt.run([
    memo_id,
    memo.customer_id,
    payDate,
    payAmount,
    payment_method,
    note || '',
    now
  ]);
  payStmt.free();

  // Recalculate memo due
  const payRes = db.exec(`SELECT COALESCE(SUM(amount), 0) AS total_extra FROM payments WHERE memo_id = ${memo_id}`);
  const totalExtra = payRes.length && payRes[0].values.length ? payRes[0].values[0][0] : 0;

  const totalPaid = (memo.advance_paid || 0) + totalExtra;
  const newDue = Math.max(0, memo.grand_total - totalPaid);

  let newStatus = 'due';
  if (newDue <= 0) {
    newStatus = 'paid';
  } else if (totalPaid > 0) {
    newStatus = 'partial';
  }

  db.run(`
    UPDATE memos SET
      due_amount = ${newDue},
      payment_status = '${newStatus}',
      updated_at = '${now}'
    WHERE id = ${memo_id}
  `);

  if (memo.customer_id) {
    recalculateCustomer(memo.customer_id);
  }

  saveToDisk();

  return getMemoById(memo_id);
}

/**
 * Search customers for autocomplete
 */
function searchCustomers(query) {
  if (!query || !query.trim()) return [];
  const q = query.trim().replace(/'/g, "''");
  const res = db.exec(`
    SELECT id, name, phone, address, total_due 
    FROM customers 
    WHERE name LIKE '%${q}%' OR phone LIKE '%${q}%'
    ORDER BY total_orders DESC 
    LIMIT 10
  `);
  return resultToObjects(res);
}

/**
 * Get all customers
 */
function getCustomers({ search = '', limit = 50, offset = 0 } = {}) {
  let whereSql = '';
  if (search && search.trim()) {
    const s = search.trim().replace(/'/g, "''");
    whereSql = `WHERE name LIKE '%${s}%' OR phone LIKE '%${s}%' OR address LIKE '%${s}%'`;
  }

  const countRes = db.exec(`SELECT COUNT(*) AS total FROM customers ${whereSql}`);
  const total = countRes.length && countRes[0].values.length ? countRes[0].values[0][0] : 0;

  const res = db.exec(`
    SELECT * FROM customers 
    ${whereSql} 
    ORDER BY total_due DESC, total_orders DESC 
    LIMIT ${limit} OFFSET ${offset}
  `);

  return {
    total,
    customers: resultToObjects(res)
  };
}

/**
 * Dashboard statistics
 */
function getDashboardStats() {
  const today = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = today.substring(0, 7) + '-01';

  // Total sales today
  const todayRes = db.exec(`
    SELECT 
      COUNT(*) AS count,
      COALESCE(SUM(grand_total), 0) AS sales,
      COALESCE(SUM(advance_paid), 0) AS advance
    FROM memos 
    WHERE memo_date = '${today}'
  `);
  const todayStats = resultToObjects(todayRes)[0] || { count: 0, sales: 0, advance: 0 };

  // Total sales this month
  const monthRes = db.exec(`
    SELECT 
      COUNT(*) AS count,
      COALESCE(SUM(grand_total), 0) AS sales,
      COALESCE(SUM(advance_paid), 0) AS advance
    FROM memos 
    WHERE memo_date >= '${firstDayOfMonth}'
  `);
  const monthStats = resultToObjects(monthRes)[0] || { count: 0, sales: 0, advance: 0 };

  // Overall totals
  const overallRes = db.exec(`
    SELECT 
      COUNT(*) AS total_memos,
      COALESCE(SUM(grand_total), 0) AS total_billed,
      COALESCE(SUM(advance_paid), 0) AS total_advance,
      COALESCE(SUM(due_amount), 0) AS total_due
    FROM memos
  `);
  const overallStats = resultToObjects(overallRes)[0] || { total_memos: 0, total_billed: 0, total_advance: 0, total_due: 0 };

  // Extra payments collected
  const payRes = db.exec("SELECT COALESCE(SUM(amount), 0) AS extra_paid FROM payments");
  const extraPaid = payRes.length && payRes[0].values.length ? payRes[0].values[0][0] : 0;

  const totalCashCollected = overallStats.total_advance + extraPaid;

  // Recent 6 memos
  const recentRes = db.exec(`
    SELECT id, memo_no, customer_name, customer_phone, memo_date, grand_total, advance_paid, due_amount, payment_status
    FROM memos 
    ORDER BY id DESC 
    LIMIT 6
  `);
  const recentMemos = resultToObjects(recentRes);

  return {
    todaySales: todayStats.sales,
    todayMemosCount: todayStats.count,
    monthSales: monthStats.sales,
    monthMemosCount: monthStats.count,
    totalBilled: overallStats.total_billed,
    totalCashCollected,
    totalDue: overallStats.total_due,
    totalMemosCount: overallStats.total_memos,
    recentMemos
  };
}

/**
 * Backup database to destination file path
 */
function backupDatabase(destPath) {
  if (!fs.existsSync(dbFilePath)) {
    throw new Error('Database file does not exist');
  }
  fs.copyFileSync(dbFilePath, destPath);
  return true;
}

/**
 * Restore database from source file path
 */
function restoreDatabase(srcPath) {
  if (!fs.existsSync(srcPath)) {
    throw new Error('Selected backup file does not exist');
  }
  const fileBuffer = fs.readFileSync(srcPath);
  // Verify it's a valid SQLite DB
  const testDb = new SQL.Database(fileBuffer);
  testDb.exec("SELECT COUNT(*) FROM settings");
  testDb.close();

  // Replace active DB
  fs.writeFileSync(dbFilePath, fileBuffer);
  db = new SQL.Database(fileBuffer);
  return true;
}

/**
 * Get comprehensive sales report for a date range
 */
function getSalesReport({ fromDate, toDate } = {}) {
  let memoWhere = [];
  let payWhere = [];

  if (fromDate) {
    memoWhere.push(`memo_date >= '${fromDate}'`);
    payWhere.push(`payment_date >= '${fromDate}'`);
  }
  if (toDate) {
    memoWhere.push(`memo_date <= '${toDate}'`);
    payWhere.push(`payment_date <= '${toDate}'`);
  }

  const memoWhereSql = memoWhere.length ? `WHERE ${memoWhere.join(' AND ')}` : '';
  const payWhereSql = payWhere.length ? `WHERE ${payWhere.join(' AND ')}` : '';

  // Memos summary
  const summaryRes = db.exec(`
    SELECT 
      COUNT(*) AS memo_count,
      COALESCE(SUM(subtotal), 0) AS total_subtotal,
      COALESCE(SUM(discount), 0) AS total_discount,
      COALESCE(SUM(grand_total), 0) AS total_billed,
      COALESCE(SUM(advance_paid), 0) AS total_advance,
      COALESCE(SUM(due_amount), 0) AS total_due
    FROM memos
    ${memoWhereSql}
  `);
  const summary = resultToObjects(summaryRes)[0] || {
    memo_count: 0, total_subtotal: 0, total_discount: 0, total_billed: 0, total_advance: 0, total_due: 0
  };

  // Payments collected in date range
  const payRes = db.exec(`
    SELECT 
      p.id, p.memo_id, p.payment_date, p.amount, p.payment_method, p.note,
      m.memo_no, m.customer_name, m.customer_phone
    FROM payments p
    LEFT JOIN memos m ON p.memo_id = m.id
    ${payWhereSql}
    ORDER BY p.id DESC
  `);
  const payments = resultToObjects(payRes);

  let extraPaymentsTotal = 0;
  payments.forEach(p => extraPaymentsTotal += p.amount);

  // Total cash collected = advance on memos created in this period + subsequent due payments collected in this period
  summary.total_extra_paid = extraPaymentsTotal;
  summary.total_cash_inflow = summary.total_advance + extraPaymentsTotal;

  // List of all memos in this period
  const memosRes = db.exec(`
    SELECT * FROM memos
    ${memoWhereSql}
    ORDER BY id DESC
  `);
  const memos = resultToObjects(memosRes);

  // Item wise sales
  const itemWhere = memoWhere.length ? `WHERE m.${memoWhere.join(' AND m.')}` : '';
  const itemsRes = db.exec(`
    SELECT 
      mi.description, 
      mi.unit, 
      SUM(mi.quantity) AS total_quantity, 
      SUM(mi.total_price) AS total_revenue, 
      COUNT(*) AS orders_count
    FROM memo_items mi
    JOIN memos m ON mi.memo_id = m.id
    ${itemWhere}
    GROUP BY mi.description
    ORDER BY total_revenue DESC
  `);
  const itemsBreakdown = resultToObjects(itemsRes);

  return {
    summary,
    memos,
    payments,
    itemsBreakdown
  };
}

module.exports = {
  initDatabase,
  getSettings,
  updateSettings,
  createMemo,
  getMemoById,
  getMemos,
  updateMemo,
  deleteMemo,
  addDuePayment,
  searchCustomers,
  getCustomers,
  getDashboardStats,
  getNextMemoNumber,
  getSalesReport,
  backupDatabase,
  restoreDatabase
};

