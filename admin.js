const CONFIG = {
  USER: "ownerjylie", // GANTI username lu
  PASS: "jylie547", // GANTI password lu
  WHITELIST_IP: ["175.158.55.141"] // GANTI IP lu dari whatismyip.com
};

let dataAdmin = {};

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