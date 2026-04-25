let products = [];
let WA_NUMBER = "";
let currentOrder = {};
let activeFilter = 'all';

async function loadData() {
  try {
    const res = await fetch('harga.json');
    const data = await res.json();
    products = data.products;
    WA_NUMBER = data.wa_number;
    document.querySelector('.wa-float').href = `https://wa.me/${WA_NUMBER}?text=Halo%20JYLIE%20SHOP,%20mau%20tanya%20topup%20FF`;
    renderProducts();
  } catch (e) {
    document.getElementById('products').innerHTML = '<p style="text-align:center">Gagal load data produk</p>';
  }
}

function formatRupiah(angka) {
  return new Intl.NumberFormat('id-ID').format(angka);
}

function showQrisModal(diamonds, price) {
  currentOrder = { diamonds, price };
  const modal = document.getElementById('qrisModal');
  document.getElementById('modalDm').innerText = `${diamonds} Diamonds`;
  document.getElementById('modalTotal').innerText = `Rp ${formatRupiah(price)}`;
  document.getElementById('gameId').value = '';
  document.getElementById('idError').innerText = '';
  document.getElementById('gameId').classList.remove('error');
  modal.style.display = 'block';
}

function konfirmasiWA() {
  const gameIdInput = document.getElementById('gameId');
  const gameId = gameIdInput.value.trim();
  const errorMsg = document.getElementById('idError');

  if (!/^\d{8,12}$/.test(gameId)) {
    errorMsg.innerText = 'ID harus angka 8-12 digit bro!';
    gameIdInput.classList.add('error');
    return;
  }

  errorMsg.innerText = '';
  gameIdInput.classList.remove('error');

  const waText = `Halo JYLIE SHOP
DIAMOND FREE FIRE
ID : ${gameId}
PESANAN : ${currentOrder.diamonds} DM
NOMINAL : Rp ${formatRupiah(currentOrder.price)}`;

  const waLink = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(waText)}`;
  window.open(waLink, '_blank');
  closeModal();
}

function closeModal() {
  document.getElementById('qrisModal').style.display = 'none';
}

function filterProducts(type) {
  activeFilter = type;
  document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
  event.target.classList.add('active');
  renderProducts();
}

function getFilteredProducts() {
  if (activeFilter === 'all') return products;
  if (activeFilter === 'murah') return products.filter(p => p.price < 50000);
  if (activeFilter === 'sedang') return products.filter(p => p.price >= 50000 && p.price <= 100000);
  if (activeFilter === 'mahal') return products.filter(p => p.price > 100000);
  if (activeFilter === 'best') return products.filter(p => p.badge === 'Best Deal' || p.badge === 'Populer' || p.badge?.includes('Hemat'));
  return products;
}

function renderProducts() {
  const container = document.getElementById('products');
  const filtered = getFilteredProducts();
  container.innerHTML = filtered.map(p => `
    <div class="card">
      ${p.badge? `<div class="badge">${p.badge}</div>` : ''}
      <div class="dm">${p.diamonds} DM</div>
      <div class="price">Rp ${formatRupiah(p.price)}</div>
      <button class="btn" onclick="showQrisModal(${p.diamonds}, ${p.price})">Beli Sekarang</button>
    </div>
  `).join('');
}

document.addEventListener('input', function(e) {
  if (e.target.id === 'gameId') {
    e.target.value = e.target.value.replace(/\D/g, '');
  }
});

window.onclick = function(event) {
  const modal = document.getElementById('qrisModal');
  if (event.target == modal) closeModal();
}

document.addEventListener('DOMContentLoaded', loadData);