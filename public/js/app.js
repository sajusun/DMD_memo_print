/**
 * Dinajpur Metallic Designs (DMD) - Client-side SPA Controller
 * High-performance, reactive, and enterprise-grade
 */

const app = {
  currentView: 'dashboard',
  settings: {},
  editingMemoId: null,
  itemRowCount: 0,
  customersCache: [],
  activePrintMemo: null,

  async init() {
    this.initTheme();
    this.bindEvents();
    this.setupShortcuts();
    this.listenToSystemStats();

    // Load initial settings
    await this.loadSettings();

    // Start on Dashboard
    this.navigate('dashboard');
  },

  // -------------------------------------------------------------
  // THEME & UTILITIES
  // -------------------------------------------------------------
  initTheme() {
    const savedTheme = localStorage.getItem('dmd_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeButton(savedTheme);
  },

  toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    const next = current === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    localStorage.setItem('dmd_theme', next);
    this.updateThemeButton(next);
  },

  updateThemeButton(theme) {
    const icon = document.getElementById('theme-icon');
    const text = document.getElementById('theme-text');
    if (!icon || !text) return;
    if (theme === 'dark') {
      icon.textContent = '☀️';
      text.textContent = 'লাইট মোড';
    } else {
      icon.textContent = '🌙';
      text.textContent = 'ডার্ক মোড';
    }
  },

  toast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'danger') icon = '❌';
    if (type === 'warning') icon = '⚠️';

    toast.innerHTML = `<span>${icon}</span><span>${message}</span>`;
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('show'));

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  },

  openModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.add('active');
  },

  closeModal(id) {
    const m = document.getElementById(id);
    if (m) m.classList.remove('active');
  },

  // -------------------------------------------------------------
  // NAVIGATION CONTROLLER
  // -------------------------------------------------------------
  navigate(viewName) {
    this.currentView = viewName;

    // Update nav links
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.view === viewName);
    });

    // Toggle views
    document.querySelectorAll('.content-view').forEach(el => {
      el.classList.add('hidden');
    });

    const target = document.getElementById(`view-${viewName}`);
    if (target) target.classList.remove('hidden');

    // Title mapping
    const titleEl = document.getElementById('current-view-title');
    const subEl = document.getElementById('current-view-subtitle');

    switch (viewName) {
      case 'dashboard':
        titleEl.textContent = 'ড্যাশবোর্ড ও ব্যবসায়িক বিবরণ';
        subEl.textContent = 'দিনাজপুর মেটালিক ডিজাইনস মেমো ও বিলিং সিস্টেম';
        this.refreshDashboard();
        break;
      case 'create-memo':
        if (!this.editingMemoId) {
          titleEl.textContent = 'নতুন ক্যাশ মেমো তৈরি';
          subEl.textContent = 'গ্রাহকের তথ্য ও কাজের বিবরণ পূরণ করে মেমো প্রিন্ট করুন';
          this.initNewMemoForm();
        } else {
          titleEl.textContent = 'মেমো সংশোধন (Edit Memo)';
          subEl.textContent = `মেমো নম্বর: ${document.getElementById('memo-number').value}`;
        }
        break;
      case 'memo-list':
        titleEl.textContent = 'মেমো ও চালান খাতা';
        subEl.textContent = 'সকল তৈরি কৃত মেমোর অনুসন্ধান, প্রিন্ট ও হিসাব সংরক্ষণ';
        this.loadMemos();
        break;
      case 'due-ledger':
        titleEl.textContent = 'বকেয়া খাতা (Due Management)';
        subEl.textContent = 'যে সকল কাস্টমারের বকেয়া পাওনা রয়েছে তাদের হিসাব ও আদায়';
        this.loadDueLedger();
        break;
      case 'customers':
        titleEl.textContent = 'কাস্টমার ডিরেক্টরি';
        subEl.textContent = 'সকল গ্রাহকের মোবাইল নম্বর ও লাইফটাইম হিসাব বিবরণী';
        this.loadCustomers();
        break;
      case 'reports':
        titleEl.textContent = 'ব্যবসায়িক হিসাব ও বিক্রয় রিপোর্ট';
        subEl.textContent = 'তারিখ অনুযায়ী বিক্রয়, ক্যাশ আদায় ও মালামাল বিশ্লেষণ এবং এক্সেল ডাউনলোড';
        this.loadReportsView();
        break;
      case 'settings':
        titleEl.textContent = 'সেটিংস ও প্রিন্টার কনফিগারেশন';
        subEl.textContent = 'প্রতিষ্ঠানের নাম, ঠিকানা, প্রিন্টার মোড ও ডাটাবেজ ব্যাকআপ';
        this.loadSettings();
        break;
    }
  },

  // -------------------------------------------------------------
  // DASHBOARD
  // -------------------------------------------------------------
  async refreshDashboard() {
    try {
      const stats = await window.dmdAPI.getDashboardStats();
      const bn = window.dmdAPI.bangla;

      document.getElementById('dash-today-sales').textContent = bn.formatCurrencyBn(stats.todaySales);
      document.getElementById('dash-today-count').textContent = `${bn.en2bn(stats.todayMemosCount)} টি মেমো`;

      document.getElementById('dash-month-sales').textContent = bn.formatCurrencyBn(stats.monthSales);
      document.getElementById('dash-month-count').textContent = `${bn.en2bn(stats.monthMemosCount)} টি মেমো`;

      document.getElementById('dash-cash-collected').textContent = bn.formatCurrencyBn(stats.totalCashCollected);
      document.getElementById('dash-total-due').textContent = bn.formatCurrencyBn(stats.totalDue);

      const tbody = document.getElementById('dash-recent-memos-tbody');
      tbody.innerHTML = '';

      if (!stats.recentMemos || stats.recentMemos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; color: var(--text-dim); padding: 24px;">এখনো কোনো মেমো তৈরি করা হয়নি। নতুন মেমো তৈরি করতে উপরের বাটনে চাপুন।</td></tr>';
        return;
      }

      stats.recentMemos.forEach(m => {
        const tr = document.createElement('tr');
        const badgeClass = m.payment_status === 'paid' ? 'badge-paid' : (m.payment_status === 'partial' ? 'badge-partial' : 'badge-due');
        const statusLabel = m.payment_status === 'paid' ? 'পরিশোধিত' : (m.payment_status === 'partial' ? 'আংশিক বাকি' : 'সম্পূর্ণ বাকি');

        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--accent-primary);">${m.memo_no}</td>
          <td>${m.memo_date}</td>
          <td style="font-weight: 600;">${m.customer_name}</td>
          <td>${m.customer_phone || '-'}</td>
          <td>${bn.formatCurrencyBn(m.grand_total)}</td>
          <td style="color: var(--success);">${bn.formatCurrencyBn(m.advance_paid)}</td>
          <td style="color: var(--danger); font-weight: 600;">${bn.formatCurrencyBn(m.due_amount)}</td>
          <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
          <td>
            <div style="display: flex; gap: 6px;">
              <button class="btn btn-secondary btn-sm" onclick="app.viewAndPrintMemo(${m.id})" title="প্রিন্ট বা দেখুন">🖨️</button>
              ${m.due_amount > 0 ? `<button class="btn btn-success btn-sm" onclick="app.openPaymentModal(${m.id}, '${m.memo_no}', '${m.customer_name}', ${m.due_amount})" title="বকেয়া জমা নিন">💵</button>` : ''}
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error refreshing dashboard:', err);
      this.toast('ড্যাশবোর্ড ডেটা লোড করতে সমস্যা হয়েছে', 'danger');
    }
  },

  // -------------------------------------------------------------
  // MEMO CREATION & EDITING
  // -------------------------------------------------------------
  async initNewMemoForm() {
    this.editingMemoId = null;
    const form = document.getElementById('memo-form');
    form.reset();

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('memo-date').value = today;

    // Fetch next memo number from settings
    const settings = await window.dmdAPI.getSettings();
    if (settings) {
      this.settings = settings;
      const prefix = settings.memo_prefix || 'DMD-';
      const num = settings.next_memo_number || 1001;
      document.getElementById('memo-number').value = `${prefix}${num}`;
    }

    // Clear items table and create 3 initial rows
    const tbody = document.getElementById('items-tbody');
    tbody.innerHTML = '';
    this.itemRowCount = 0;

    this.addItemRow();
    this.addItemRow();
    this.addItemRow();

    this.calculateTotals();
  },

  addItemRow(data = {}) {
    this.itemRowCount++;
    const rowId = `item-row-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const tbody = document.getElementById('items-tbody');
    const tr = document.createElement('tr');
    tr.id = rowId;

    const bn = window.dmdAPI.bangla;
    const currentSl = tbody.children.length + 1;

    tr.innerHTML = `
      <td class="row-sl" style="text-align: center; font-weight: 700;">${bn.en2bn(currentSl)}</td>
      <td>
        <input type="text" class="table-input item-desc" placeholder="মালের বিবরণ (যেমন: মেইন গেট গ্রিল)" value="${data.description || ''}" required>
      </td>
      <td>
        <input type="number" class="table-input item-qty" placeholder="১" value="${data.quantity || ''}" min="0.01" step="any" required>
      </td>
      <td>
        <input type="text" class="table-input item-unit" placeholder="টি" value="${data.unit || 'টি'}">
      </td>
      <td>
        <input type="number" class="table-input item-price" placeholder="০.০০" value="${data.unit_price || ''}" min="0" step="any" required>
      </td>
      <td style="text-align: right; font-weight: 600;" class="item-total-display">
        ${data.total_price ? bn.formatCurrencyBn(data.total_price) : '০/-'}
      </td>
      <td style="text-align: center;">
        <button type="button" class="btn btn-secondary btn-sm" onclick="app.removeItemRow('${rowId}')" title="আইটেম মুছুন" style="padding: 3px 8px; color: var(--danger);">✕</button>
      </td>
    `;

    tbody.appendChild(tr);

    // Event listeners for recalculations
    const qtyInput = tr.querySelector('.item-qty');
    const priceInput = tr.querySelector('.item-price');
    const descInput = tr.querySelector('.item-desc');

    const updateHandler = () => this.calculateTotals();
    qtyInput.addEventListener('input', updateHandler);
    priceInput.addEventListener('input', updateHandler);

    // Enter key to add next row
    priceInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        this.addItemRow();
        const nextTr = tbody.lastElementChild;
        if (nextTr) {
          const nextDesc = nextTr.querySelector('.item-desc');
          if (nextDesc) nextDesc.focus();
        }
      }
    });

    this.reindexRows();
  },

  removeItemRow(rowId) {
    const tr = document.getElementById(rowId);
    if (!tr) return;
    const tbody = document.getElementById('items-tbody');
    if (tbody.children.length <= 1) {
      this.toast('মেমোতে কমপক্ষে একটি আইটেম থাকতে হবে', 'warning');
      return;
    }
    tr.remove();
    this.reindexRows();
    this.calculateTotals();
  },

  reindexRows() {
    const bn = window.dmdAPI.bangla;
    const tbody = document.getElementById('items-tbody');
    Array.from(tbody.children).forEach((tr, index) => {
      const slTd = tr.querySelector('.row-sl');
      if (slTd) slTd.textContent = bn.en2bn(index + 1);
    });
  },

  calculateTotals() {
    const bn = window.dmdAPI.bangla;
    const tbody = document.getElementById('items-tbody');
    let subtotal = 0;

    Array.from(tbody.children).forEach(tr => {
      const qtyInput = tr.querySelector('.item-qty');
      const priceInput = tr.querySelector('.item-price');
      const totalDisplay = tr.querySelector('.item-total-display');

      const qty = parseFloat(qtyInput.value) || 0;
      const price = parseFloat(priceInput.value) || 0;
      const rowTotal = qty * price;

      subtotal += rowTotal;
      if (totalDisplay) {
        totalDisplay.textContent = rowTotal > 0 ? bn.formatCurrencyBn(rowTotal) : '০/-';
      }
    });

    const discountInput = document.getElementById('memo-discount');
    const advanceInput = document.getElementById('memo-advance');

    const discount = parseFloat(discountInput.value) || 0;
    const grandTotal = Math.max(0, subtotal - discount);
    const advance = parseFloat(advanceInput.value) || 0;
    const due = Math.max(0, grandTotal - advance);

    document.getElementById('summary-subtotal').textContent = bn.formatCurrencyBn(subtotal);
    document.getElementById('summary-grand-total').textContent = bn.formatCurrencyBn(grandTotal);
    document.getElementById('summary-due').textContent = bn.formatCurrencyBn(due);

    const inWords = bn.inWordbn(grandTotal);
    document.getElementById('calc-in-words').textContent = inWords || 'শূণ্য টাকা মাত্র';
  },

  collectFormData() {
    const bn = window.dmdAPI.bangla;
    const customerName = document.getElementById('memo-cust-name').value.trim();
    const memoNo = document.getElementById('memo-number').value.trim();
    const memoDate = document.getElementById('memo-date').value;

    if (!customerName) {
      this.toast('গ্রাহকের নাম অবশ্যই দিতে হবে', 'warning');
      document.getElementById('memo-cust-name').focus();
      return null;
    }

    if (!memoNo) {
      this.toast('মেমো নম্বর দিতে হবে', 'warning');
      document.getElementById('memo-number').focus();
      return null;
    }

    const tbody = document.getElementById('items-tbody');
    const items = [];

    Array.from(tbody.children).forEach(tr => {
      const desc = tr.querySelector('.item-desc').value.trim();
      const qty = parseFloat(tr.querySelector('.item-qty').value) || 0;
      const unit = tr.querySelector('.item-unit').value.trim() || 'টি';
      const price = parseFloat(tr.querySelector('.item-price').value) || 0;

      if (desc && qty > 0) {
        items.push({
          description: desc,
          quantity: qty,
          unit,
          unit_price: price,
          total_price: qty * price
        });
      }
    });

    if (items.length === 0) {
      this.toast('কমপক্ষে একটি পণ্যের বিবরণ ও দর পূরণ করুন', 'warning');
      return null;
    }

    let subtotal = 0;
    items.forEach(it => subtotal += it.total_price);

    const discount = parseFloat(document.getElementById('memo-discount').value) || 0;
    const grandTotal = Math.max(0, subtotal - discount);
    const advancePaid = parseFloat(document.getElementById('memo-advance').value) || 0;
    const dueAmount = Math.max(0, grandTotal - advancePaid);

    return {
      memo_no: memoNo,
      customer_name: customerName,
      customer_phone: document.getElementById('memo-cust-phone').value.trim(),
      customer_address: document.getElementById('memo-cust-address').value.trim(),
      memo_date: memoDate,
      delivery_date: document.getElementById('memo-delivery-date').value,
      subtotal,
      discount,
      grand_total: grandTotal,
      advance_paid: advancePaid,
      due_amount: dueAmount,
      in_words_bn: bn.inWordbn(grandTotal),
      notes: document.getElementById('memo-notes').value.trim(),
      items
    };
  },

  async saveMemo(options = { print: false }) {
    const memoData = this.collectFormData();
    if (!memoData) return;

    try {
      let savedMemo;
      if (this.editingMemoId) {
        savedMemo = await window.dmdAPI.updateMemo(this.editingMemoId, memoData);
        this.toast('মেমো সফলভাবে আপডেট হয়েছে', 'success');
      } else {
        savedMemo = await window.dmdAPI.createMemo(memoData);
        this.toast('নতুন মেমো সফলভাবে সংরক্ষিত হয়েছে', 'success');
      }

      if (options.print && savedMemo) {
        this.printInvoice(savedMemo);
      }

      this.initNewMemoForm();
      this.navigate('memo-list');
    } catch (err) {
      console.error('Error saving memo:', err);
      this.toast('মেমো সংরক্ষণে ত্রুটি হয়েছে: ' + err.message, 'danger');
    }
  },

  async editMemo(id) {
    try {
      const memo = await window.dmdAPI.getMemoById(id);
      if (!memo) return;

      this.editingMemoId = memo.id;
      this.navigate('create-memo');

      document.getElementById('memo-cust-name').value = memo.customer_name;
      document.getElementById('memo-cust-phone').value = memo.customer_phone || '';
      document.getElementById('memo-cust-address').value = memo.customer_address || '';
      document.getElementById('memo-number').value = memo.memo_no;
      document.getElementById('memo-date').value = memo.memo_date;
      document.getElementById('memo-delivery-date').value = memo.delivery_date || '';
      document.getElementById('memo-discount').value = memo.discount || 0;
      document.getElementById('memo-advance').value = memo.advance_paid || 0;
      document.getElementById('memo-notes').value = memo.notes || '';

      const tbody = document.getElementById('items-tbody');
      tbody.innerHTML = '';
      this.itemRowCount = 0;

      if (memo.items && memo.items.length > 0) {
        memo.items.forEach(it => this.addItemRow(it));
      } else {
        this.addItemRow();
      }

      this.calculateTotals();
    } catch (err) {
      console.error('Error loading memo for edit:', err);
      this.toast('মেমো তথ্য লোড করতে সমস্যা হয়েছে', 'danger');
    }
  },

  async deleteMemo(id, memoNo) {
    if (!confirm(`আপনি কি নিশ্চিত যে মেমো নং "${memoNo}" মুছে ফেলতে চান?`)) {
      return;
    }

    try {
      const success = await window.dmdAPI.deleteMemo(id);
      if (success) {
        this.toast('মেমো মুছে ফেলা হয়েছে', 'success');
        this.loadMemos();
      }
    } catch (err) {
      console.error('Error deleting memo:', err);
      this.toast('মুছে ফেলতে সমস্যা হয়েছে', 'danger');
    }
  },

  // -------------------------------------------------------------
  // MEMO LIST & SEARCH
  // -------------------------------------------------------------
  async loadMemos() {
    const search = document.getElementById('filter-memo-search').value.trim();
    const status = document.getElementById('filter-memo-status').value;
    const fromDate = document.getElementById('filter-memo-from').value;
    const toDate = document.getElementById('filter-memo-to').value;

    try {
      const { memos, total } = await window.dmdAPI.getMemos({ search, status, fromDate, toDate, limit: 100 });
      const tbody = document.getElementById('memo-list-tbody');
      tbody.innerHTML = '';

      if (!memos || memos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: var(--text-dim); padding: 28px;">কোনো মেমো পাওয়া যায়নি</td></tr>';
        return;
      }

      const bn = window.dmdAPI.bangla;

      memos.forEach(m => {
        const tr = document.createElement('tr');
        const badgeClass = m.payment_status === 'paid' ? 'badge-paid' : (m.payment_status === 'partial' ? 'badge-partial' : 'badge-due');
        const statusLabel = m.payment_status === 'paid' ? 'পরিশোধিত' : (m.payment_status === 'partial' ? 'আংশিক বাকি' : 'সম্পূর্ণ বাকি');

        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--accent-primary);">${m.memo_no}</td>
          <td>${m.memo_date}</td>
          <td style="font-weight: 600;">${m.customer_name}</td>
          <td>${m.customer_phone || '-'}</td>
          <td style="font-size: 12px; color: var(--text-muted);">${m.customer_address || '-'}</td>
          <td>${bn.formatCurrencyBn(m.grand_total)}</td>
          <td style="color: var(--success);">${bn.formatCurrencyBn(m.advance_paid)}</td>
          <td style="color: var(--danger); font-weight: 600;">${bn.formatCurrencyBn(m.due_amount)}</td>
          <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
          <td style="text-align: center;">
            <div style="display: inline-flex; gap: 5px;">
              <button class="btn btn-secondary btn-sm" onclick="app.viewAndPrintMemo(${m.id})" title="প্রিন্ট বা দেখুন">🖨️</button>
              ${m.due_amount > 0 ? `<button class="btn btn-success btn-sm" onclick="app.openPaymentModal(${m.id}, '${m.memo_no}', '${m.customer_name}', ${m.due_amount})" title="বকেয়া জমা নিন">💵</button>` : ''}
              <button class="btn btn-secondary btn-sm" onclick="app.editMemo(${m.id})" title="সংশোধন করুন">✏️</button>
              <button class="btn btn-danger btn-sm" onclick="app.deleteMemo(${m.id}, '${m.memo_no}')" title="মুছুন">🗑️</button>
            </div>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading memos:', err);
      this.toast('মেমো তালিকা লোড করতে সমস্যা হয়েছে', 'danger');
    }
  },

  // -------------------------------------------------------------
  // DUE LEDGER & PAYMENTS
  // -------------------------------------------------------------
  async loadDueLedger() {
    try {
      const { memos } = await window.dmdAPI.getMemos({ status: 'due', limit: 100 });
      const { memos: partialMemos } = await window.dmdAPI.getMemos({ status: 'partial', limit: 100 });
      
      const allDues = [...(memos || []), ...(partialMemos || [])];
      allDues.sort((a, b) => b.due_amount - a.due_amount);

      const tbody = document.getElementById('due-ledger-tbody');
      tbody.innerHTML = '';

      if (allDues.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--success); padding: 32px; font-weight: 600;">আলহামদুলিল্লাহ! কোনো কাস্টমারের কাছে বকেয়া পাওনা নেই।</td></tr>';
        return;
      }

      const bn = window.dmdAPI.bangla;

      allDues.forEach(m => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--accent-primary);">${m.memo_no}</td>
          <td>${m.memo_date}</td>
          <td style="font-weight: 700;">${m.customer_name}</td>
          <td>${m.customer_phone || '-'}</td>
          <td>${bn.formatCurrencyBn(m.grand_total)}</td>
          <td style="color: var(--success);">${bn.formatCurrencyBn(m.advance_paid)}</td>
          <td style="color: var(--danger); font-weight: 700; font-size: 15px;">${bn.formatCurrencyBn(m.due_amount)}</td>
          <td style="text-align: center;">
            <button class="btn btn-success btn-sm" onclick="app.openPaymentModal(${m.id}, '${m.memo_no}', '${m.customer_name}', ${m.due_amount})">
              💵 বকেয়া জমা নিন
            </button>
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading due ledger:', err);
    }
  },

  openPaymentModal(memoId, memoNo, customerName, currentDue) {
    const bn = window.dmdAPI.bangla;
    document.getElementById('pay-memo-id').value = memoId;
    document.getElementById('pay-memo-info').textContent = `${memoNo} - ${customerName}`;
    document.getElementById('pay-current-due').textContent = bn.formatCurrencyBn(currentDue);
    document.getElementById('pay-amount').value = currentDue;
    document.getElementById('pay-amount').max = currentDue;
    document.getElementById('pay-note').value = '';

    this.openModal('modal-payment');
    setTimeout(() => document.getElementById('pay-amount').focus(), 100);
  },

  async confirmPayment() {
    const memoId = document.getElementById('pay-memo-id').value;
    const amount = parseFloat(document.getElementById('pay-amount').value) || 0;
    const method = document.getElementById('pay-method').value;
    const note = document.getElementById('pay-note').value.trim();

    if (amount <= 0) {
      this.toast('সঠিক জমার পরিমাণ লিখুন', 'warning');
      return;
    }

    try {
      const updatedMemo = await window.dmdAPI.addDuePayment({
        memo_id: memoId,
        amount,
        payment_method: method,
        note
      });

      this.closeModal('modal-payment');
      this.toast('বকেয়া টাকা সফলভাবে জমা হয়েছে', 'success');

      this.loadDueLedger();
      this.refreshDashboard();

      if (confirm('পেমেন্ট রসিদ প্রিন্ট করতে চান?')) {
        this.printInvoice(updatedMemo);
      }
    } catch (err) {
      console.error('Payment error:', err);
      this.toast('পেমেন্ট এন্ট্রি করতে ব্যর্থ হয়েছে: ' + err.message, 'danger');
    }
  },

  // -------------------------------------------------------------
  // CUSTOMERS DIRECTORY
  // -------------------------------------------------------------
  async loadCustomers() {
    const search = document.getElementById('filter-customer-search').value.trim();
    try {
      const { customers } = await window.dmdAPI.getCustomers({ search, limit: 100 });
      const tbody = document.getElementById('customers-list-tbody');
      tbody.innerHTML = '';

      if (!customers || customers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 28px;">কোনো কাস্টমার পাওয়া যায়নি</td></tr>';
        return;
      }

      const bn = window.dmdAPI.bangla;

      customers.forEach(c => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td style="font-weight: 700; color: var(--text-main);">${c.name}</td>
          <td>${c.phone || '-'}</td>
          <td>${c.address || '-'}</td>
          <td style="text-align: center; font-weight: 600;">${bn.en2bn(c.total_orders)}</td>
          <td>${bn.formatCurrencyBn(c.total_billed)}</td>
          <td style="color: var(--success);">${bn.formatCurrencyBn(c.total_paid)}</td>
          <td style="color: ${c.total_due > 0 ? 'var(--danger)' : 'var(--success)'}; font-weight: 700;">
            ${bn.formatCurrencyBn(c.total_due)}
          </td>
        `;
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error('Error loading customers:', err);
    }
  },

  // -------------------------------------------------------------
  // SETTINGS & DATABASE
  // -------------------------------------------------------------
  async loadSettings() {
    try {
      const settings = await window.dmdAPI.getSettings();
      if (!settings) return;
      this.settings = settings;

      document.getElementById('set-shop-name').value = settings.shop_name || '';
      document.getElementById('set-tagline').value = settings.tagline || '';
      document.getElementById('set-proprietor').value = settings.proprietor || '';
      document.getElementById('set-phone-1').value = settings.phone_1 || '';
      document.getElementById('set-phone-2').value = settings.phone_2 || '';
      document.getElementById('set-address').value = settings.address || '';
      document.getElementById('set-memo-prefix').value = settings.memo_prefix || 'DMD-';
      document.getElementById('set-next-memo-number').value = settings.next_memo_number || 1001;
      document.getElementById('set-print-mode').value = settings.print_mode || 'full_vector';
      document.getElementById('set-pad-top').value = settings.pad_offset_top_cm || 0.0;
      document.getElementById('set-pad-left').value = settings.pad_offset_left_cm || 0.0;

      // Apply CSS variables for pad offsets
      document.documentElement.style.setProperty('--pad-offset-top', `${settings.pad_offset_top_cm || 0}cm`);
      document.documentElement.style.setProperty('--pad-offset-left', `${settings.pad_offset_left_cm || 0}cm`);
    } catch (err) {
      console.error('Error loading settings:', err);
    }
  },

  async saveSettings() {
    const data = {
      shop_name: document.getElementById('set-shop-name').value.trim(),
      tagline: document.getElementById('set-tagline').value.trim(),
      proprietor: document.getElementById('set-proprietor').value.trim(),
      phone_1: document.getElementById('set-phone-1').value.trim(),
      phone_2: document.getElementById('set-phone-2').value.trim(),
      address: document.getElementById('set-address').value.trim(),
      memo_prefix: document.getElementById('set-memo-prefix').value.trim(),
      next_memo_number: parseInt(document.getElementById('set-next-memo-number').value, 10) || 1001,
      print_mode: document.getElementById('set-print-mode').value,
      pad_offset_top_cm: parseFloat(document.getElementById('set-pad-top').value) || 0.0,
      pad_offset_left_cm: parseFloat(document.getElementById('set-pad-left').value) || 0.0
    };

    try {
      const updated = await window.dmdAPI.saveSettings(data);
      this.settings = updated;
      this.toast('সেটিংস সফলভাবে সংরক্ষিত হয়েছে', 'success');
      this.loadSettings();
    } catch (err) {
      console.error('Error saving settings:', err);
      this.toast('সেটিংস সংরক্ষণে ব্যর্থ: ' + err.message, 'danger');
    }
  },

  async backupDatabase() {
    try {
      const res = await window.dmdAPI.backupDatabase();
      if (res && res.success) {
        this.toast('ডাটাবেজ ব্যাকআপ সম্পন্ন হয়েছে: ' + res.filePath, 'success');
      }
    } catch (err) {
      this.toast('ব্যাকআপে ত্রুটি: ' + err.message, 'danger');
    }
  },

  async restoreDatabase() {
    if (!confirm('সতর্কতা: রিস্টোর করলে বর্তমান ডাটাবেজ নির্বাচিত ফাইল দিয়ে প্রতিস্থাপিত হবে! আপনি কি নিশ্চিত?')) {
      return;
    }
    try {
      const res = await window.dmdAPI.restoreDatabase();
      if (res && res.success) {
        this.toast('ডাটাবেজ সফলভাবে রিস্টোর হয়েছে! অ্যাপ রিলোড করা হচ্ছে...', 'success');
        setTimeout(() => window.location.reload(), 1500);
      }
    } catch (err) {
      this.toast('রিস্টোরে ত্রুটি: ' + err.message, 'danger');
    }
  },

  // -------------------------------------------------------------
  // PRINT & INVOICE ENGINE
  // -------------------------------------------------------------
  async viewAndPrintMemo(id) {
    try {
      const memo = await window.dmdAPI.getMemoById(id);
      if (!memo) return;
      this.activePrintMemo = memo;

      const html = this.buildInvoiceHTML(memo);
      document.getElementById('preview-invoice-content').innerHTML = html;
      this.openModal('modal-preview');
    } catch (err) {
      console.error('Error viewing memo:', err);
    }
  },

  printInvoice(memo = null) {
    const targetMemo = memo || this.activePrintMemo;
    if (!targetMemo) return;

    const html = this.buildInvoiceHTML(targetMemo);
    const container = document.getElementById('printable-invoice');
    container.innerHTML = html;

    window.print();
  },

  async exportPdf(memo = null) {
    const targetMemo = memo || this.activePrintMemo;
    if (!targetMemo) return;

    const html = this.buildInvoiceHTML(targetMemo);
    const container = document.getElementById('printable-invoice');
    container.innerHTML = html;

    const filename = `Memo_${targetMemo.memo_no}_${targetMemo.customer_name}.pdf`.replace(/[\/\\?%*:|"<>]/g, '_');
    try {
      const res = await window.dmdAPI.exportPdf(filename);
      if (res && res.success) {
        this.toast('পিডিএফ সফলভাবে তৈরি হয়েছে: ' + res.filePath, 'success');
      }
    } catch (err) {
      console.error('PDF export error:', err);
      this.toast('পিডিএফ তৈরিতে সমস্যা হয়েছে', 'danger');
    }
  },

  buildInvoiceHTML(memo) {
    const bn = window.dmdAPI.bangla;
    const settings = this.settings || {};
    const mode = settings.print_mode || 'full_vector';

    const itemsRows = (memo.items || []).map((it, idx) => `
      <tr>
        <td class="col-sl">${bn.en2bn(idx + 1)}</td>
        <td class="col-desc">${it.description}</td>
        <td class="col-qty">${bn.en2bn(it.quantity)} ${it.unit || ''}</td>
        <td class="col-rate">${bn.formatCurrencyBn(it.unit_price, false)}</td>
        <td class="col-total">${bn.formatCurrencyBn(it.total_price)}</td>
      </tr>
    `).join('');

    return `
      <div class="print-mode-${mode}">
        <div class="print-header">
          <div class="print-bismillah">বিসমিল্লাহির রাহমানির রাহিম</div>
          <div class="print-shop-name">${settings.shop_name || 'দিনাজপুর মেটালিক ডিজাইনস'}</div>
          <div class="print-tagline">${settings.tagline || 'আধুনিক মেটালিক ও স্টিল ফার্নিচার প্রস্তুতকারক'}</div>
          <div class="print-address-phone">
            <span>ঠিকানা: ${settings.address || 'দিনাজপুর'}</span>
            <span>মোবাইল: ${settings.phone_1 || ''} ${settings.phone_2 ? ', ' + settings.phone_2 : ''}</span>
            ${settings.proprietor ? `<span>প্রোপ্রাইটর: ${settings.proprietor}</span>` : ''}
          </div>
          <div><span class="print-memo-badge">ক্যাশ মেমো / চালান</span></div>
        </div>

        <div class="print-meta-grid">
          <div class="print-meta-left">
            <div>গ্রাহকের নাম: <span class="print-line-field" style="min-width: 240px;">${memo.customer_name}</span></div>
            <div>ঠিকানা: <span class="print-line-field" style="min-width: 270px;">${memo.customer_address || ''}</span></div>
            <div>মোবাইল: <span class="print-line-field" style="min-width: 180px;">${memo.customer_phone || ''}</span></div>
          </div>
          <div class="print-meta-right">
            <div>মেমো নং: <span class="print-line-field" style="font-weight: 800;">${memo.memo_no}</span></div>
            <div>তারিখ: <span class="print-line-field">${memo.memo_date}</span></div>
            ${memo.delivery_date ? `<div>ডেলিভারি: <span class="print-line-field">${memo.delivery_date}</span></div>` : ''}
          </div>
        </div>

        <table class="print-table">
          <thead>
            <tr>
              <th class="col-sl">ক্র.</th>
              <th class="col-desc">মালের বিবরণ</th>
              <th class="col-qty">পরিমাণ</th>
              <th class="col-rate">দর / রেট</th>
              <th class="col-total">মোট টাকা</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="print-footer-grid">
          <div class="print-in-words-box">
            <div>কথায়: <span class="print-in-words-text">${memo.in_words_bn || bn.inWordbn(memo.grand_total)}</span></div>
            ${memo.notes ? `<div style="margin-top: 10px; font-size: 10.5pt; color: #333;"><strong>নোট:</strong> ${memo.notes}</div>` : ''}
          </div>

          <div class="print-totals-box">
            <div class="print-total-row">
              <span>মোট টাকা:</span>
              <span>${bn.formatCurrencyBn(memo.subtotal)}</span>
            </div>
            ${memo.discount > 0 ? `
              <div class="print-total-row">
                <span>বিশেষ ছাড়:</span>
                <span>-${bn.formatCurrencyBn(memo.discount)}</span>
              </div>
            ` : ''}
            <div class="print-total-row grand">
              <span>সর্বমোট:</span>
              <span>${bn.formatCurrencyBn(memo.grand_total)}</span>
            </div>
            <div class="print-total-row">
              <span>অগ্রিম জমা:</span>
              <span>${bn.formatCurrencyBn(memo.advance_paid)}</span>
            </div>
            <div class="print-total-row due">
              <span>অবশিষ্ট বকেয়া:</span>
              <span>${bn.formatCurrencyBn(memo.due_amount)}</span>
            </div>
          </div>
        </div>

        <div class="print-signatures">
          <div class="sig-line">গ্রাহকের স্বাক্ষর</div>
          <div class="sig-line">কর্তৃপক্ষের স্বাক্ষর</div>
        </div>
      </div>
    `;
  },

  // -------------------------------------------------------------
  // REPORTS & EXCEL EXPORTS
  // -------------------------------------------------------------
  activeReportData: null,
  activeReportTab: 'items',

  async loadReportsView() {
    this.applyReportPreset('month');
    await this.fetchAndRenderReport();
  },

  applyReportPreset(preset) {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    document.querySelectorAll('.report-preset-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.preset === preset);
    });

    const fromInput = document.getElementById('report-from-date');
    const toInput = document.getElementById('report-to-date');

    if (preset === 'today') {
      fromInput.value = todayStr;
      toInput.value = todayStr;
    } else if (preset === 'week') {
      const pastWeek = new Date();
      pastWeek.setDate(today.getDate() - 7);
      fromInput.value = pastWeek.toISOString().split('T')[0];
      toInput.value = todayStr;
    } else if (preset === 'month') {
      const firstDay = todayStr.substring(0, 7) + '-01';
      fromInput.value = firstDay;
      toInput.value = todayStr;
    } else if (preset === 'last_month') {
      const y = today.getFullYear();
      const m = today.getMonth(); // 0-indexed, current month
      const lastMonthDate = new Date(y, m - 1, 1);
      const lastMonthEnd = new Date(y, m, 0); // last day of previous month
      fromInput.value = lastMonthDate.toISOString().split('T')[0];
      toInput.value = lastMonthEnd.toISOString().split('T')[0];
    } else if (preset === 'all') {
      fromInput.value = '';
      toInput.value = '';
    }
  },

  async fetchAndRenderReport() {
    const fromDate = document.getElementById('report-from-date').value;
    const toDate = document.getElementById('report-to-date').value;

    try {
      const report = await window.dmdAPI.getSalesReport({ fromDate, toDate });
      this.activeReportData = { ...report, fromDate, toDate };

      const bn = window.dmdAPI.bangla;
      const s = report.summary || {};

      document.getElementById('rep-total-sales').textContent = bn.formatCurrencyBn(s.total_billed || 0);
      document.getElementById('rep-memo-count').textContent = `${bn.en2bn(s.memo_count || 0)} টি মেমো`;
      document.getElementById('rep-total-cash').textContent = bn.formatCurrencyBn(s.total_cash_inflow || 0);
      document.getElementById('rep-total-discount').textContent = bn.formatCurrencyBn(s.total_discount || 0);
      document.getElementById('rep-total-due').textContent = bn.formatCurrencyBn(s.total_due || 0);

      // Render Item breakdown table
      const itemsTbody = document.getElementById('rep-items-tbody');
      itemsTbody.innerHTML = '';
      if (!report.itemsBreakdown || report.itemsBreakdown.length === 0) {
        itemsTbody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: var(--text-dim); padding: 24px;">এই তারিখ রেঞ্জে কোনো পণ্যের বিক্রয় তথ্য নেই</td></tr>';
      } else {
        report.itemsBreakdown.forEach((it, idx) => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td style="text-align: center; font-weight: 700;">${bn.en2bn(idx + 1)}</td>
            <td style="font-weight: 600;">${it.description}</td>
            <td style="text-align: center;">${bn.en2bn(it.total_quantity)} ${it.unit || ''}</td>
            <td style="text-align: center;">${bn.en2bn(it.orders_count)} বার</td>
            <td style="text-align: right; font-weight: 700; color: var(--accent-primary);">${bn.formatCurrencyBn(it.total_revenue)}</td>
          `;
          itemsTbody.appendChild(tr);
        });
      }

      // Render Memos table
      const memosTbody = document.getElementById('rep-memos-tbody');
      memosTbody.innerHTML = '';
      if (!report.memos || report.memos.length === 0) {
        memosTbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-dim); padding: 24px;">কোনো মেমো পাওয়া যায়নি</td></tr>';
      } else {
        report.memos.forEach(m => {
          const tr = document.createElement('tr');
          const badgeClass = m.payment_status === 'paid' ? 'badge-paid' : (m.payment_status === 'partial' ? 'badge-partial' : 'badge-due');
          const statusLabel = m.payment_status === 'paid' ? 'পরিশোধিত' : (m.payment_status === 'partial' ? 'আংশিক বাকি' : 'সম্পূর্ণ বাকি');
          tr.innerHTML = `
            <td style="font-weight: 700; color: var(--accent-primary);">${m.memo_no}</td>
            <td>${m.memo_date}</td>
            <td style="font-weight: 600;">${m.customer_name}</td>
            <td>${m.customer_phone || '-'}</td>
            <td>${bn.formatCurrencyBn(m.grand_total)}</td>
            <td style="color: var(--success);">${bn.formatCurrencyBn(m.advance_paid)}</td>
            <td style="color: var(--danger); font-weight: 600;">${bn.formatCurrencyBn(m.due_amount)}</td>
            <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
          `;
          memosTbody.appendChild(tr);
        });
      }

      // Render Payments table
      const payTbody = document.getElementById('rep-payments-tbody');
      payTbody.innerHTML = '';
      if (!report.payments || report.payments.length === 0) {
        payTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-dim); padding: 24px;">এই সময়ের মধ্যে কোনো পেছনের বকেয়া আদায় এন্ট্রি নেই</td></tr>';
      } else {
        report.payments.forEach(p => {
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${p.payment_date}</td>
            <td style="font-weight: 700;">${p.memo_no || '-'}</td>
            <td>${p.customer_name || '-'}</td>
            <td>${p.customer_phone || '-'}</td>
            <td style="font-weight: 700; color: var(--success);">${bn.formatCurrencyBn(p.amount)}</td>
            <td>${p.payment_method || 'ক্যাশ'}</td>
            <td style="font-size: 12px; color: var(--text-muted);">${p.note || '-'}</td>
          `;
          payTbody.appendChild(tr);
        });
      }
    } catch (err) {
      console.error('Error fetching report:', err);
      this.toast('রিপোর্ট ডেটা লোড করতে সমস্যা হয়েছে', 'danger');
    }
  },

  switchReportTab(tabName) {
    this.activeReportTab = tabName;
    document.querySelectorAll('.report-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    document.querySelectorAll('.rep-tab-content').forEach(el => {
      el.classList.add('hidden');
    });
    const target = document.getElementById(`rep-tab-${tabName}`);
    if (target) target.classList.remove('hidden');
  },

  async exportSalesReportExcel() {
    if (!this.activeReportData) {
      await this.fetchAndRenderReport();
    }
    const fromStr = this.activeReportData.fromDate || 'all';
    const toStr = this.activeReportData.toDate || 'all';
    const filename = `DMD_Sales_Report_${fromStr}_to_${toStr}.xlsx`;

    try {
      const res = await window.dmdAPI.exportExcel({
        type: 'sales_summary',
        data: this.activeReportData,
        defaultFilename: filename
      });
      if (res && res.success) {
        this.toast('এক্সেল রিপোর্ট সফলভাবে সেভ হয়েছে: ' + res.filePath, 'success');
      }
    } catch (err) {
      console.error('Excel export error:', err);
      this.toast('এক্সেল এক্সপোর্টে ত্রুটি হয়েছে', 'danger');
    }
  },

  async exportMemosExcel() {
    try {
      const search = document.getElementById('filter-memo-search').value.trim();
      const status = document.getElementById('filter-memo-status').value;
      const fromDate = document.getElementById('filter-memo-from').value;
      const toDate = document.getElementById('filter-memo-to').value;

      const { memos } = await window.dmdAPI.getMemos({ search, status, fromDate, toDate, limit: 1000 });
      if (!memos || memos.length === 0) {
        this.toast('এক্সপোর্ট করার মতো কোনো মেমো নেই', 'warning');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const res = await window.dmdAPI.exportExcel({
        type: 'memos_list',
        data: memos,
        defaultFilename: `DMD_Memos_Export_${today}.xlsx`
      });

      if (res && res.success) {
        this.toast('মেমো তালিকা এক্সেলে ডাউনলোড হয়েছে: ' + res.filePath, 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      this.toast('এক্সেলে এক্সপোর্টে সমস্যা হয়েছে', 'danger');
    }
  },

  async exportDuesExcel() {
    try {
      const { memos } = await window.dmdAPI.getMemos({ status: 'due', limit: 1000 });
      const { memos: partialMemos } = await window.dmdAPI.getMemos({ status: 'partial', limit: 1000 });
      const allDues = [...(memos || []), ...(partialMemos || [])];

      if (allDues.length === 0) {
        this.toast('কোনো বকেয়া তথ্য নেই', 'warning');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const res = await window.dmdAPI.exportExcel({
        type: 'due_list',
        data: allDues,
        defaultFilename: `DMD_Due_List_${today}.xlsx`
      });

      if (res && res.success) {
        this.toast('বকেয়া তালিকা এক্সেলে ডাউনলোড হয়েছে: ' + res.filePath, 'success');
      }
    } catch (err) {
      console.error('Export error:', err);
      this.toast('এক্সেলে এক্সপোর্টে সমস্যা হয়েছে', 'danger');
    }
  },

  printReport() {
    if (!this.activeReportData) return;
    const bn = window.dmdAPI.bangla;
    const settings = this.settings || {};
    const rep = this.activeReportData;
    const s = rep.summary || {};

    const itemsRows = (rep.itemsBreakdown || []).map((it, idx) => `
      <tr>
        <td style="text-align: center;">${bn.en2bn(idx + 1)}</td>
        <td>${it.description}</td>
        <td style="text-align: center;">${bn.en2bn(it.total_quantity)} ${it.unit || ''}</td>
        <td style="text-align: center;">${bn.en2bn(it.orders_count)}</td>
        <td style="text-align: right; font-weight: 600;">${bn.formatCurrencyBn(it.total_revenue)}</td>
      </tr>
    `).join('');

    const html = `
      <div class="print-mode-full_vector" style="padding: 10mm 15mm;">
        <div class="print-header">
          <div class="print-shop-name">${settings.shop_name || 'দিনাজপুর মেটালিক ডিজাইনস'}</div>
          <div class="print-tagline">বিক্রয় ও হিসাব বিবরণী রিপোর্ট</div>
          <div style="font-size: 11pt; color: #444; margin-top: 4px;">
            তারিখ রেঞ্জ: <strong>${rep.fromDate || 'শুরু'} হতে ${rep.toDate || 'বর্তমান'}</strong>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin: 16px 0; border: 1px solid #000; padding: 10px;">
          <div><small>মোট বিক্রি:</small><br><strong>${bn.formatCurrencyBn(s.total_billed)}</strong></div>
          <div><small>মোট ক্যাশ আদায়:</small><br><strong style="color: #059669;">${bn.formatCurrencyBn(s.total_cash_inflow)}</strong></div>
          <div><small>মোট ছাড়:</small><br><strong>${bn.formatCurrencyBn(s.total_discount)}</strong></div>
          <div><small>বকেয়া পাওনা:</small><br><strong style="color: #dc2626;">${bn.formatCurrencyBn(s.total_due)}</strong></div>
        </div>

        <h4 style="margin: 14px 0 8px 0; font-size: 12pt;">আইটেম ভিত্তিক বিক্রয় বিবরণী</h4>
        <table class="print-table">
          <thead>
            <tr>
              <th style="width: 40px;">ক্র.</th>
              <th>কাজের বিবরণ</th>
              <th style="width: 100px;">মোট পরিমাণ</th>
              <th style="width: 80px;">অর্ডার</th>
              <th style="width: 120px;">মোট টাকা</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="print-signatures" style="margin-top: 50px;">
          <div class="sig-line">হিসাবরক্ষকের স্বাক্ষর</div>
          <div class="sig-line">স্বত্বাধিকারীর স্বাক্ষর</div>
        </div>
      </div>
    `;

    const container = document.getElementById('printable-invoice');
    container.innerHTML = html;
    window.print();
  },


  // -------------------------------------------------------------
  // EVENT BINDINGS & LISTENERS
  // -------------------------------------------------------------
  bindEvents() {
    // Navigation items
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        this.navigate(el.dataset.view);
      });
    });

    // Top actions
    document.getElementById('btn-quick-new-memo').addEventListener('click', () => {
      this.navigate('create-memo');
    });

    document.getElementById('btn-theme-toggle').addEventListener('click', () => {
      this.toggleTheme();
    });

    // Memo Form
    document.getElementById('btn-reset-memo').addEventListener('click', () => {
      this.initNewMemoForm();
    });

    document.getElementById('btn-add-item-row').addEventListener('click', () => {
      this.addItemRow();
    });

    document.getElementById('btn-preview-memo').addEventListener('click', () => {
      const data = this.collectFormData();
      if (data) {
        this.activePrintMemo = data;
        const html = this.buildInvoiceHTML(data);
        document.getElementById('preview-invoice-content').innerHTML = html;
        this.openModal('modal-preview');
      }
    });

    document.getElementById('btn-save-memo').addEventListener('click', () => {
      this.saveMemo({ print: false });
    });

    document.getElementById('btn-save-print-memo').addEventListener('click', () => {
      this.saveMemo({ print: true });
    });

    document.getElementById('memo-discount').addEventListener('input', () => this.calculateTotals());
    document.getElementById('memo-advance').addEventListener('input', () => this.calculateTotals());

    // Autocomplete on customer name
    const custNameInput = document.getElementById('memo-cust-name');
    const custSuggBox = document.getElementById('customer-suggestions');

    custNameInput.addEventListener('input', async (e) => {
      const q = e.target.value.trim();
      if (q.length < 1) {
        custSuggBox.style.display = 'none';
        return;
      }

      const results = await window.dmdAPI.searchCustomers(q);
      if (results && results.length > 0) {
        custSuggBox.innerHTML = results.map(c => `
          <div class="autocomplete-item" data-id="${c.id}" data-name="${c.name}" data-phone="${c.phone || ''}" data-address="${c.address || ''}">
            <strong>${c.name}</strong> • ${c.phone || 'মোবাইল নেই'} • <span style="color: var(--text-dim);">${c.address || ''}</span>
          </div>
        `).join('');
        custSuggBox.style.display = 'block';

        custSuggBox.querySelectorAll('.autocomplete-item').forEach(item => {
          item.addEventListener('click', () => {
            custNameInput.value = item.dataset.name;
            document.getElementById('memo-cust-phone').value = item.dataset.phone;
            document.getElementById('memo-cust-address').value = item.dataset.address;
            custSuggBox.style.display = 'none';
          });
        });
      } else {
        custSuggBox.style.display = 'none';
      }
    });

    document.addEventListener('click', (e) => {
      if (!custNameInput.contains(e.target) && !custSuggBox.contains(e.target)) {
        custSuggBox.style.display = 'none';
      }
    });

    // Memo filters
    ['filter-memo-search', 'filter-memo-status', 'filter-memo-from', 'filter-memo-to'].forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', () => this.loadMemos());
        el.addEventListener('change', () => this.loadMemos());
      }
    });

    // Customer search
    document.getElementById('filter-customer-search').addEventListener('input', () => {
      this.loadCustomers();
    });

    // Payment confirm
    document.getElementById('btn-confirm-payment').addEventListener('click', () => {
      this.confirmPayment();
    });

    // Settings actions
    document.getElementById('btn-save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.getElementById('btn-db-backup').addEventListener('click', () => {
      this.backupDatabase();
    });

    document.getElementById('btn-db-restore').addEventListener('click', () => {
      this.restoreDatabase();
    });

    // Modal print/pdf actions
    document.getElementById('btn-modal-print').addEventListener('click', () => {
      this.printInvoice();
    });

    document.getElementById('btn-modal-pdf').addEventListener('click', () => {
      this.exportPdf();
    });

    // Reports events
    document.querySelectorAll('.report-preset-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.applyReportPreset(btn.dataset.preset);
        this.fetchAndRenderReport();
      });
    });

    document.querySelectorAll('.report-tab-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.switchReportTab(btn.dataset.tab);
      });
    });

    document.getElementById('btn-load-report').addEventListener('click', () => {
      this.fetchAndRenderReport();
    });

    document.getElementById('btn-export-sales-excel').addEventListener('click', () => {
      this.exportSalesReportExcel();
    });

    document.getElementById('btn-export-memos-excel').addEventListener('click', () => {
      this.exportMemosExcel();
    });

    document.getElementById('btn-export-dues-excel').addEventListener('click', () => {
      this.exportDuesExcel();
    });

    document.getElementById('btn-print-report').addEventListener('click', () => {
      this.printReport();
    });
  },

  setupShortcuts() {
    window.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        this.navigate('create-memo');
      } else if (e.ctrlKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        if (this.currentView === 'create-memo') {
          this.saveMemo({ print: false });
        }
      } else if (e.ctrlKey && e.key.toLowerCase() === 'p') {
        e.preventDefault();
        if (this.currentView === 'create-memo') {
          this.saveMemo({ print: true });
        }
      } else if (e.key === 'Escape') {
        this.closeModal('modal-preview');
        this.closeModal('modal-payment');
      }
    });
  },

  listenToSystemStats() {
    if (window.dmdAPI && window.dmdAPI.onSystemStats) {
      window.dmdAPI.onSystemStats(stats => {
        const cpuEl = document.getElementById('stat-cpu');
        const memEl = document.getElementById('stat-mem');
        const cpuBar = document.getElementById('bar-cpu');
        const memBar = document.getElementById('bar-mem');

        if (cpuEl) cpuEl.textContent = `${stats.cpuUsage}%`;
        if (memEl) memEl.textContent = `${stats.memUsage}% (${stats.freeMemGB}G ফ্রি)`;
        if (cpuBar) cpuBar.style.width = `${stats.cpuUsage}%`;
        if (memBar) memBar.style.width = `${stats.memUsage}%`;
      });
    }
  }
};

// Initialize application on DOM ready
window.addEventListener('DOMContentLoaded', () => {
  app.init();
});
