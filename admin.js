const CONFIG = {
  USER: "ownerjylie", // GANTI username lu
  PASS: "jylie547", // GANTI password lu
  WHITELIST_IP: ["175.158.55.141"] // GANTI IP lu dari whatismyip.com
};

let db = { nomor_wa: '', qris_url: '', produk: [] };

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
}

async function loadData() {
  try {
    const res = await fetch('harga.json?' + Date.now());
    db = await res.json();
    document.getElementById('nomor-wa').value = db.nomor_wa || '';
    renderProduk();
  } catch (e) {
    db = { nomor_wa: '62895336789308', produk: [] };
    notif('Gagal load harga.json, bikin baru', false);
    renderProduk();
  }
}

function renderProduk() {
  const wrap = document.getElementById('produkList');
  wrap.innerHTML = '';

  db.produk.forEach((game, gameIndex) => {
    const gameDiv = document.createElement('div');
    gameDiv.className = 'game-wrap';
    gameDiv.innerHTML = `
      <div class="game-head">
        <div class="flex items-center gap-3">
          <img src="${game.logo}" class="w-10 h-10 rounded object-cover bg-slate-600">
          <div>
            <input value="${game.nama}" onchange="updateGame(${gameIndex}, 'nama', this.value)" class="font-bold bg-transparent text-white">
            <p class="text-xs text-slate-400">ID: ${game.id}</p>
          </div>
        </div>
        <button onclick="hapusGame(${gameIndex})" class="admin-btn btn-del">Hapus Game</button>
      </div>
      <div class="ml-4 mb-3">
        <input value="${game.logo}" onchange="updateGame(${gameIndex}, 'logo', this.value)"
               class="admin-input text-xs" placeholder="Link Logo Game">
      </div>
      <div id="nominal-${gameIndex}" class="space-y-2 mb-3"></div>
      <button onclick="tambahNominal(${gameIndex})" class="admin-btn btn-add w-full">
        + Tambah Nominal
      </button>
    `;
    wrap.appendChild(gameDiv);

    const nominalWrap = document.getElementById(`nominal-${gameIndex}`);
    game.nominal.forEach((item, itemIndex) => {
      const row = document.createElement('div');
      row.className = 'bg-slate-700 p-2 rounded';
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
                 class="w-1/2 bg-slate-800 p-2 rounded text-sm" placeholder="Harga Asli (Diskon)">
        </div>
      `;
      nominalWrap.appendChild(row);
    });
  });
}

function tambahGame() {
  const id = document.getElementById('newGameId').value.trim().toLowerCase().replace(/\s+/g, '');
  const nama = document.getElementById('newGameName').value.trim();
  const logo = document.getElementById('newGameLogo').value.trim();
  if(!id ||!nama ||!logo) return notif('ID, Nama & Logo wajib diisi', false);
  if(db.produk.find(g => g.id === id)) return notif('ID Game udah ada', false);

  db.produk.push({ id, nama, logo, nominal: [] });
  document.getElementById('newGameId').value = '';
  document.getElementById('newGameName').value = '';
  document.getElementById('newGameLogo').value = '';
  renderProduk();
  notif('Game ditambah. Jangan lupa Simpan!');
}

function hapusGame(gameIndex) {
  if(!confirm(`Hapus game ${db.produk[gameIndex].nama}?`)) return;
  db.produk.splice(gameIndex, 1);
  renderProduk();
  notif('Game dihapus. Jangan lupa Simpan!');
}

function tambahNominal(gameIndex) {
  db.produk[gameIndex].nominal.push({ name: "Item Baru", harga: 10000 });
  renderProduk();
  notif('Nominal ditambah. Edit nama + harga, terus Simpan!');
}

function hapusNominal(gameIndex, itemIndex) {
  db.produk[gameIndex].nominal.splice(itemIndex, 1);
  renderProduk();
  notif('Nominal dihapus. Jangan lupa Simpan!');
}

window.updateGame = (i, field, val) => { db.produk[i][field] = val; }
window.updateNominal = (i, j, field, val) => {
  if (field === 'harga' || field === 'harga_asli') {
    val = parseInt(val) || 0;
    if (field === 'harga_asli' && val === 0) {
      delete db.produk[i].nominal[j].harga_asli;
      return;
    }
  }
  db.produk[i].nominal[j][field] = val;
}

async function simpanSemua() {
  notif('Menyimpan...', true);
  db.nomor_wa = document.getElementById('nomor-wa').value;

  try {
    const res = await fetch('/.netlify/functions/save-harga', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(db)
    });
    const hasil = await res.json();
    if(res.ok) {
      notif('Berhasil save! Vercel auto-deploy 20 detik ✅');
    } else {
      throw new Error(hasil.error || 'Gagal save');
    }
  } catch (e) {
    notif('Error: ' + e.message, false);
  }
}
