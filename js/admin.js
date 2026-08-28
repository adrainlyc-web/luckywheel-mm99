(function () {
  const loginScreen = document.getElementById('login-screen');
  const loginForm = document.getElementById('login-form');
  const passwordEl = document.getElementById('password');
  const loginError = document.getElementById('login-error');
  const dashboard = document.getElementById('dashboard');
  const logoutBtn = document.getElementById('logout-btn');

  const statTotal = document.getElementById('stat-total');
  const statClaimed = document.getElementById('stat-claimed');
  const statPending = document.getElementById('stat-pending');

  const uploadText = document.getElementById('upload-text');
  const uploadBtn = document.getElementById('upload-btn');
  const uploadResult = document.getElementById('upload-result');

  const searchEl = document.getElementById('search');
  const refreshBtn = document.getElementById('refresh-btn');
  const entriesBody = document.getElementById('entries-body');

  const prizesBody = document.getElementById('prizes-body');
  const addPrizeBtn = document.getElementById('add-prize-btn');
  const savePrizesBtn = document.getElementById('save-prizes-btn');
  const prizesResult = document.getElementById('prizes-result');

  let allEntries = [];

  function getPassword() {
    return sessionStorage.getItem('adminPassword');
  }

  function showDashboard() {
    loginScreen.classList.add('hidden');
    dashboard.classList.remove('hidden');
    loadEntries();
    loadPrizes();
  }

  function showLogin() {
    sessionStorage.removeItem('adminPassword');
    dashboard.classList.add('hidden');
    loginScreen.classList.remove('hidden');
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginError.textContent = '';
    const password = passwordEl.value;

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        loginError.textContent = data.error || 'Wrong password.';
        return;
      }
      sessionStorage.setItem('adminPassword', password);
      showDashboard();
    } catch (err) {
      loginError.textContent = 'Network error — please try again.';
    }
  });

  logoutBtn.addEventListener('click', showLogin);

  async function adminFetch(url, options) {
    const password = getPassword();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...(options && options.headers),
        'x-admin-password': password || '',
      },
    });
    if (res.status === 401) {
      showLogin();
      throw new Error('Session expired');
    }
    return res;
  }

  function renderTable(entries) {
    entriesBody.innerHTML = '';
    entries.forEach((e) => {
      const tr = document.createElement('tr');
      const claimedAt = e.claimed_at ? new Date(e.claimed_at).toLocaleString() : '—';
      tr.innerHTML = `
        <td>${escapeHtml(e.name || '—')}</td>
        <td>${escapeHtml(e.phone)}</td>
        <td>${e.claimed ? '<span class="badge claimed">Claimed</span>' : '<span class="badge pending">Pending</span>'}</td>
        <td>${escapeHtml(e.prize || '—')}</td>
        <td>${claimedAt}</td>
      `;
      entriesBody.appendChild(tr);
    });
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  async function loadEntries() {
    try {
      const res = await adminFetch('/api/admin/list');
      const data = await res.json();
      allEntries = data.entries;
      statTotal.textContent = data.total;
      statClaimed.textContent = data.claimed;
      statPending.textContent = data.pending;
      renderTable(allEntries);
    } catch (err) {
      // showLogin already handled the 401 case
    }
  }

  refreshBtn.addEventListener('click', loadEntries);

  searchEl.addEventListener('input', () => {
    const q = searchEl.value.trim().toLowerCase();
    if (!q) {
      renderTable(allEntries);
      return;
    }
    const filtered = allEntries.filter(
      (e) =>
        (e.name || '').toLowerCase().includes(q) ||
        (e.phone || '').toLowerCase().includes(q)
    );
    renderTable(filtered);
  });

  uploadBtn.addEventListener('click', async () => {
    const lines = uploadText.value.split('\n').map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    const entries = lines.map((line) => {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        return { name: parts[0], phone: parts[1] };
      }
      return { name: '', phone: parts[0] };
    });

    uploadBtn.disabled = true;
    uploadResult.textContent = 'Adding…';

    try {
      const res = await adminFetch('/api/admin/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries }),
      });
      const data = await res.json();
      if (!res.ok) {
        uploadResult.textContent = data.error || 'Something went wrong.';
      } else {
        uploadResult.textContent = `Added ${data.added}, skipped ${data.skipped} (already on the list or blank).`;
        uploadText.value = '';
        loadEntries();
      }
    } catch (err) {
      uploadResult.textContent = 'Network error — please try again.';
    } finally {
      uploadBtn.disabled = false;
    }
  });

  function renderPrizeRow(prize) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td><input type="text" class="prize-label" value="${escapeHtml(prize.label || '')}"></td>
      <td><input type="color" class="prize-color" value="${prize.color || '#7c3aed'}"></td>
      <td><input type="number" class="prize-weight" min="1" step="1" value="${prize.weight || 1}"></td>
      <td class="chance-cell">—</td>
      <td><button type="button" class="remove-prize-btn" title="Remove">✕</button></td>
    `;
    tr.querySelector('.remove-prize-btn').addEventListener('click', () => {
      tr.remove();
      updateChances();
    });
    tr.querySelector('.prize-weight').addEventListener('input', updateChances);
    prizesBody.appendChild(tr);
  }

  function updateChances() {
    const rows = Array.from(prizesBody.querySelectorAll('tr'));
    const weights = rows.map((tr) => Number(tr.querySelector('.prize-weight').value) || 0);
    const total = weights.reduce((sum, w) => sum + w, 0);
    rows.forEach((tr, i) => {
      const cell = tr.querySelector('.chance-cell');
      cell.textContent = total > 0 ? `${((weights[i] / total) * 100).toFixed(1)}%` : '—';
    });
  }

  async function loadPrizes() {
    try {
      const res = await adminFetch('/api/admin/prizes');
      const data = await res.json();
      prizesBody.innerHTML = '';
      data.prizes.forEach(renderPrizeRow);
      updateChances();
    } catch (err) {
      // showLogin already handled the 401 case
    }
  }

  addPrizeBtn.addEventListener('click', () => {
    renderPrizeRow({ label: '', color: '#7c3aed', weight: 10 });
    updateChances();
  });

  savePrizesBtn.addEventListener('click', async () => {
    const rows = Array.from(prizesBody.querySelectorAll('tr'));
    const prizes = rows.map((tr) => ({
      label: tr.querySelector('.prize-label').value.trim(),
      color: tr.querySelector('.prize-color').value,
      weight: Number(tr.querySelector('.prize-weight').value),
    }));

    if (prizes.length === 0) {
      prizesResult.textContent = 'Add at least one prize first.';
      return;
    }

    savePrizesBtn.disabled = true;
    prizesResult.textContent = 'Saving…';

    try {
      const res = await adminFetch('/api/admin/prizes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prizes }),
      });
      const data = await res.json();
      if (!res.ok) {
        prizesResult.textContent = data.error || 'Something went wrong.';
      } else {
        prizesResult.textContent = 'Saved.';
        prizesBody.innerHTML = '';
        data.prizes.forEach(renderPrizeRow);
        updateChances();
      }
    } catch (err) {
      prizesResult.textContent = 'Network error — please try again.';
    } finally {
      savePrizesBtn.disabled = false;
    }
  });

  if (getPassword()) {
    showDashboard();
  }
})();
