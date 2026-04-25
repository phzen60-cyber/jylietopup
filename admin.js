const CONFIG = {
  USER: "ownerjylie", // GANTI username lu
  PASS: "jylie547", // GANTI password lu
  WHITELIST_IP: ["175.158.55.141"] // GANTI IP lu dari whatismyip.com
};

let dataAdmin = {};
let dataHarga = {};
let lastUpdate = '';

const notif = (msg, sukses = true) => {
  const el = document.getElementById('notif');
  el.textContent = msg;
  el.className = sukses? 'notif-sukses' : 'notif-gagal';
  el.style.display = 'block';
  setTimeout(() => el.style.display = 'none', 3000);
};

async function loadData() {
  try {
    const res = await fetch('harga.json?' + Date.now());
    const json = await res.json();

    // Cek format baru: ada last_update + data
    if(json.last_update && json.data) {
      lastUpdate = json.last_update;
      dataHarga = json.data;
    } else {
      // Format lama: langsung data aja
      dataHarga = json;
      lastUpdate = 'Belum ada data update';
    }
    renderProduk();
    updateLastUpdateText();
  } catch (e) {
    notif('Gagal load harga.json', false);
  }
}

function updateLastUpdateText() {
  let el = document.getElementById('lastUpdate');
  if(!el) {
    // Bikin element kalo belum ada
    const info = document.createElement('div');
    info.id = 'lastUpdate';
    info.style.cssText = 'opacity:.7;font-size:14px;margin-bottom:16px';
    document.querySelector('.admin-wrap h1').after(info);
    el = info;
  }
  el.textContent = `🕒 Last Update: ${lastUpdate}`;
}

function renderProduk() {
  const wrap = document.getElementById('produkList');
  wrap.innerHTML = '';

  for (const [catId, catData] of Object.entries(dataHarga)) {
    const catDiv = document.createElement('div');
    catDiv.className = 'cat-wrap';
    catDiv.innerHTML = `
      <div class="cat-head">
        <div class="cat-title">${catData.nama} <span style="opacity:.5;font-size:14px">${catId}</span></div>
        <button onclick="hapusKategori('${catId}')" class="admin-btn btn-del">Hapus Kategori</button>
      </div>
      <div id="prod-${catId}"></div>
      <button onclick="tambahProduk('${catId}')" class="admin-btn btn-add" style="margin-top:8px">+ Tambah Produk</button>
    `;
    wrap.appendChild(catDiv);

    const prodWrap = document.getElementById(`prod-${catId}`);
    catData.produk.forEach((p, i) => {
      const row = document.createElement('div');
      row.className = 'prod-row';
      row.innerHTML = `
        <input class="admin-input" value="${p.nama}" placeholder="Nama Produk" data-cat="${catId}" data-idx="${i}" data-field="nama">
        <input class="admin-input" type="number" value="${p.harga}" placeholder="Harga" data-cat="${catId}" data-idx="${i}" data-field="harga" style="max-width:120px">
        <button onclick="hapusProduk('${catId}', ${i})" class="admin-btn btn-del">X</button>
      `;
      prodWrap.appendChild(row);
    });
  }

  document.querySelectorAll('.admin-input[data-idx]').forEach(input => {
    input.addEventListener('input', (e) => {
      const {cat, idx, field} = e.target.dataset;
      let val = e.target.value;
      if(field === 'harga') val = parseInt(val) || 0;
      dataHarga[cat].produk[idx][field] = val;
    });
  });
}

function tambahKategori() {
  const id = document.getElementById('newCatId').value.trim();
  const nama = document.getElementById('newCatName').value.trim();
  if(!id ||!nama) return notif('ID dan Nama Kategori wajib diisi', false);
  if(dataHarga[id]) return notif('ID Kategori udah ada', false);

  dataHarga[id] = {nama: nama, produk: []};
  document.getElementById('newCatId').value = '';
  document.getElementById('newCatName').value = '';
  renderProduk();
  notif('Kategori ditambah. Jangan lupa Simpan!');
}

function hapusKategori(catId) {
  if(!confirm(`Hapus kategori ${dataHarga[catId].nama}?`)) return;
  delete dataHarga[catId];
  renderProduk();
  notif('Kategori dihapus. Jangan lupa Simpan!');
}

function tambahProduk(catId) {
  dataHarga[catId].produk.push({nama: "Produk Baru", harga: 0});
  renderProduk();
  notif('Produk ditambah. Edit nama + harga, terus Simpan!');
}

function hapusProduk(catId, idx) {
  dataHarga[catId].produk.splice(idx, 1);
  renderProduk();
  notif('Produk dihapus. Jangan lupa Simpan!');
}

async function simpanSemua() {
  notif('Menyimpan ke GitHub...', true);

  // Bikin format baru: last_update + data
  const now = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const payload = {
    last_update: now,
    data: dataHarga
  };

  try {
    const res = await fetch('/.netlify/functions/save-harga', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const hasil = await res.json();
    if(res.ok) {
      lastUpdate = now;
      updateLastUpdateText();
      notif('Berhasil save! Data + backup udah ke-commit ✅');
    } else {
      throw new Error(hasil.error || 'Gagal save');
    }
  } catch (e) {
    notif('Error: ' + e.message, false);
  }
}

loadData();

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

  const res = await fetch('harga.json');
  dataAdmin = await res.json();
  document.getElementById('waNumber').value = dataAdmin.wa_number || '';
  loadTable();
}

function loadTable() {
  let html = '<table><tr><th>ID</th><th>Nama</th><th>DM</th><th>Harga</th><th>Badge</th><th>Aksi</th></tr>';
  dataAdmin.products.forEach((p, i) => {
    html += `<tr>
      <td><input value="${p.id}" onchange="updateData(${i}, 'id', this.value)" style="width:60px"></td>
      <td><input value="${p.name}" onchange="updateData(${i}, 'name', this.value)"></td>
      <td><input type="number" value="${p.diamonds}" onchange="updateData(${i}, 'diamonds', this.value)" style="width:80px"></td>
      <td><input type="number" value="${p.price}" onchange="updateData(${i}, 'price', this.value)" style="width:100px"></td>
      <td><input value="${p.badge || ''}" onchange="updateData(${i}, 'badge', this.value)" style="width:80px"></td>
      <td><button class="danger" onclick="hapusProduk(${i})">Hapus</button></td>
    </tr>`;
  });
  html += '</table>';
  document.getElementById('tableWrap').innerHTML = html;
}

function updateData(index, key, value) {
  if(key === 'diamonds' || key === 'price') value = parseInt(value) || 0;
  if(key === 'badge' && value === '') delete dataAdmin.products[index][key];
  else dataAdmin.products[index][key] = value;
}

function tambahProduk() {
  dataAdmin.products.push({
    id: Date.now(),
    name: "Produk Baru",
    diamonds: 0,
    price: 0,
    badge: ""
  });
  loadTable();
}

function hapusProduk(index) {
  if(confirm('Yakin hapus produk ini?')) {
    dataAdmin.products.splice(index, 1);
    loadTable();
  }
}

function saveData() {
  document.getElementById('loadingSave').style.display = 'inline';
  dataAdmin.wa_number = document.getElementById('waNumber').value;

  // Sementara masih download manual. Nanti pake Netlify Function auto save
  const blob = new Blob([JSON.stringify(dataAdmin, null, 2)], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'harga.json';
  a.click();

  setTimeout(() => {
    document.getElementById('loadingSave').style.display = 'none';
    alert('File harga.json udah ke-download. Upload ke Netlify buat update harga.');
  }, 500);
}

function tambahKategori() {
  const id = document.getElementById('newCatId').value.trim();
  const nama = document.getElementById('newCatName').value.trim();
  if(!id ||!nama) return notif('ID dan Nama Kategori wajib diisi', false);
  if(dataHarga[id]) return notif('ID Kategori udah ada', false);

  dataHarga[id] = {nama: nama, produk: []};
  document.getElementById('newCatId').value = '';
  document.getElementById('newCatName').value = '';
  renderProduk();
  notif('Kategori ditambah. Jangan lupa Simpan!');
}

function hapusKategori(catId) {
  if(!confirm(`Hapus kategori ${dataHarga[catId].nama}?`)) return;
  delete dataHarga[catId];
  renderProduk();
  notif('Kategori dihapus. Jangan lupa Simpan!');
}

function tambahProduk(catId) {
  dataHarga[catId].produk.push({nama: "Produk Baru", harga: 0});
  renderProduk();
  notif('Produk ditambah. Edit nama + harga, terus Simpan!');
}

function hapusProduk(catId, idx) {
  dataHarga[catId].produk.splice(idx, 1);
  renderProduk();
  notif('Produk dihapus. Jangan lupa Simpan!');
}

async function simpanSemua() {
  notif('Menyimpan ke GitHub...', true);

  // Bikin format baru: last_update + data
  const now = new Date().toLocaleString('id-ID', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });

  const payload = {
    last_update: now,
    data: dataHarga
  };

  try {
    const res = await fetch('/.netlify/functions/save-harga', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify(payload)
    });
    const hasil = await res.json();
    if(res.ok) {
      lastUpdate = now;
      updateLastUpdateText();
      notif('Berhasil save! Data + backup udah ke-commit ✅');
    } else {
      throw new Error(hasil.error || 'Gagal save');
    }
  } catch (e) {
    notif('Error: ' + e.message, false);
  }
}

loadData();
