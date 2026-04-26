const CONFIG = {
  USER: "ownerjylie", // GANTI username lu
  PASS: "jylie547", // GANTI password lu
  WHITELIST_IP: ["175.158.55.141"] // GANTI IP lu dari whatismyip.com
};

// STRUKTUR BARU DB.JSON
let db = { username_tele: '', toko_buka: true, games: [] };

const notif = (msg, sukses = true) => {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.className = sukses? 'notif-sukses' : 'notif-gagal';
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
};

async function login() {
  const loginMsg = document.getElementById('loginMsg');
  loginMsg.innerText = "Cek IP...";

  try {
    const ipRes = await fetch('https://api.ipify.org?format=json');
    const ipData = await ipRes.json();
    const userIP = ipData.ip;
    document.getElementById('ipText').innerText = userIP;

    if (!CONFIG.WHITELIST_IP.includes(userIP)) {
      loginMsg.innerText = `Akses ditolak! IP ${userIP} ga terdaftar.`;
      return;
    }
  } catch(e) {
    loginMsg.innerText = 'Gagal cek IP. Coba refresh.';
    return;
  }

  const user = document.getElementById('user').value;
  const pass = document.getElementById('pass').value;

  if(user!== CONFIG.USER || pass!== CONFIG.PASS) {
    loginMsg.innerText = 'Username atau Password salah!';
    return;
  }

  document.getElementById('loginBox').style.display = 'none';
  document.getElementById('adminBox').style.display = 'block';
  loadData();
  loadLocalSettings();
}

function logout() {
  document.getElementById('adminBox').style.display = 'none';
  document.getElementById('loginBox').style.display = 'flex';
  document.getElementById('user').value = '';
  document.getElementById('pass').value = '';
  document.getElementById('loginMsg').innerText = '';
}

function loadLocalSettings() {
  document.getElementById('gh-token').value = localStorage.getItem('gh_token') || '';
  document.getElementById('gh-user').value = localStorage.getItem('gh_user') || '';
  document.getElementById('gh-repo').value = localStorage.getItem('gh_repo') || '';
}

function setToko(status) {
  db.toko_buka = status;
  document.getElementById('btn-buka').className = status ? 'flex-1 bg-green-600 ring-4 ring-green-400 py-3 rounded-lg font-bold admin-btn' : 'flex-1 bg-slate-600 hover:bg-green-700 py-3 rounded-lg font-bold admin-btn';
  document.getElementById('btn-tutup').className = !status ? 'flex-1 bg-red-600 ring-4 ring-red-400 py-3 rounded-lg font-bold admin-btn' : 'flex-1 bg-slate-600 hover:bg-red-700 py-3 rounded-lg font-bold admin-btn';
  notif(status ? 'Toko di-SET BUKA' : 'Toko di-SET TUTUP. Jangan lupa Simpan!');
}

async function loadData() {
  try {
    const res = await fetch('db.json?' + Date.now());
    db = await res.json();
    document.getElementById('username-tele').value = db.username_tele || '';
    setToko(db.toko_buka !== false);
    renderProduk();
  } catch (e) {
    db = { username_tele: 'jyliestoreid', toko_buka: true, games: [] };
    notif('Gagal load db.json, bikin baru', false);
    setToko(true);
    renderProduk();
  }
}

function renderProduk() {
  const wrap = document.getElementById('produkList');
  wrap.innerHTML = '';

  if (db.games.length === 0) {
    wrap.innerHTML = '<p class="text-slate-400 text-center">Belum ada game. Tambah di atas.</p>';
    return;
  }

  db.games.forEach((game, gameIndex) => {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-wrap bg-slate-700 rounded-lg p-4';
    gameDiv.innerHTML = `
      <div class="game-head flex justify-between items-center mb-3">
        <div class="flex items-center gap-3">
          <img src="${game.icon}" class="w-10 h-10 rounded object-cover bg-slate-600">
          <div>
            <input value="${game.name}" onchange="updateGame(${gameIndex}, 'name', this.value)" class="font-bold bg-transparent text-white">
            <p class="text-xs text-slate-400">ID: ${game.id}</p>
          </div>
        </div>
        <button onclick="hapusGame(${gameIndex})" class="admin-btn btn-del bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-sm">Hapus Game</button>
      </div>
      <div class="ml-4 mb-3">
        <input value="${game.icon}" onchange="updateGame(${gameIndex}, 'icon', this.value)"
               class="admin-input text-xs w-full p-2 rounded" placeholder="Link Logo Game">
      </div>
      <div id="nominal-${gameIndex}" class="space-y-2 mb-3"></div>
      <button onclick="tambahNominal(${gameIndex})" class="admin-btn btn-add w-full bg-slate-600 hover:bg-slate-500 py-2 rounded text-sm">
        + Tambah Nominal
      </button>
    `;
    wrap.appendChild(gameDiv);

    const nominalWrap = document.getElementById(`nominal-${gameIndex}`);
    game.products.forEach((item, itemIndex) => {
      const row = document.createElement('div');
      row.className = 'bg-slate-600 p-2 rounded';
      row.innerHTML = `
        <div class="flex gap-2 items-center mb-2">
          <input value="${item.name}" onchange="updateNominal(${gameIndex}, ${itemIndex}, 'name', this.value)"
                 class="flex-1 bg-slate-800 p-2 rounded text-sm" placeholder="Nama Item">
          <button onclick="hapusNominal(${gameIndex}, ${itemIndex})" class="bg-red-500 px-2 py-2 rounded text-sm">X</button>
        </div>
        <div class="flex gap-2 items-center">
          <input value="${item.harga}" type="number" onchange="updateNominal(${gameIndex}, ${itemIndex}, 'harga', this.value)"
                 class="w-1/2 bg-slate-800 p-2 rounded text-sm" placeholder="Harga Jual">
          <input value="${item.harga_asli || ''}" type="number" onchange="updateNominal(${gameIndex}, ${itemIndex}, 'harga_asli', this.value)"
                 class="w-1/2 bg-slate-800 p-2 rounded text-sm" placeholder="Harga Asli">
        </div>
      `;
      nominalWrap.appendChild(row);
    });
  });
}

function tambahGame() {
  const id = document.getElementById('newGameId').value.trim().toLowerCase().replace(/\s+/g, '');
  const name = document.getElementById('newGameName').value.trim();
  const icon = document.getElementById('newGameLogo').value.trim();
  if(!id ||!name ||!icon) return notif('ID, Nama & Logo wajib diisi', false);
  if(db.games.find(g => g.id === id)) return notif('ID Game udah ada', false);

  db.games.push({ id, name, icon, products: [] });
  document.getElementById('newGameId').value = '';
  document.getElementById('newGameName').value = '';
  document.getElementById('newGameLogo').value = '';
  renderProduk();
  notif('Game ditambah. Jangan lupa Simpan!');
}

function hapusGame(gameIndex) {
  if(!confirm(`Hapus game ${db.games[gameIndex].name}?`)) return;
  db.games.splice(gameIndex, 1);
  renderProduk();
  notif('Game dihapus. Jangan lupa Simpan!');
}

function tambahNominal(gameIndex) {
  const newId = db.games[gameIndex].id + '_' + Date.now();
  db.games[gameIndex].products.push({ id: newId, name: "Item Baru", harga: 10000 });
  renderProduk();
  notif('Nominal ditambah. Edit nama + harga, terus Simpan!');
}

function hapusNominal(gameIndex, itemIndex) {
  db.games[gameIndex].products.splice(itemIndex, 1);
  renderProduk();
  notif('Nominal dihapus. Jangan lupa Simpan!');
}

window.updateGame = (i, field, val) => { db.games[i][field] = val; }
window.updateNominal = (i, j, field, val) => {
  if (field === 'harga' || field === 'harga_asli') {
    val = parseInt(val) || 0;
    if (field === 'harga_asli' && val === 0) {
      delete db.games[i].products[j].harga_asli;
      return;
    }
  }
  db.games[i].products[j][field] = val;
}

// SAVE KE GITHUB LANGSUNG - GA PAKE NETLIFY FUNCTION
async function simpanSemua() {
  const token = document.getElementById('gh-token').value;
  const user = document.getElementById('gh-user').value;
  const repo = document.getElementById('gh-repo').value;

  if (!token ||!user ||!repo) {
    notif('Isi Setting GitHub dulu di atas!', false);
    return;
  }

  localStorage.setItem('gh_token', token);
  localStorage.setItem('gh_user', user);
  localStorage.setItem('gh_repo', repo);

  notif('Menyimpan ke GitHub...', true);
  db.username_tele = document.getElementById('username-tele').value;

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(db, null, 2))));
  const apiUrl = `https://api.github.com/repos/${user}/${repo}/contents/db.json`;

  try {
    let fileSHA = null;
    const getRes = await fetch(apiUrl, { headers: { 'Authorization': `token ${token}` } });
    if (getRes.ok) {
      const fileData = await getRes.json();
      fileSHA = fileData.sha;
    }

    const updateRes = await fetch(apiUrl, {
      method: 'PUT',
      headers: { 'Authorization': `token ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Update db.json dari Admin Panel',
        content: content,
        sha: fileSHA
      })
    });

    if (updateRes.ok) {
      notif('✅ Sukses! Vercel auto-deploy 20 detik');
    } else {
      const err = await updateRes.json();
      throw new Error(err.message);
    }
  } catch (error) {
    notif('❌ Gagal: ' + error.message, false);
  }
    }
