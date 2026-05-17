import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getDatabase, ref, onValue, set, push, remove, update, get } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-database.js";

const FB = {
  apiKey: "AIzaSyDdHVlNZNXmBPo26EScIKtVD0vDvLwvTiA",
  authDomain: "alifam-hub-1b32a.firebaseapp.com",
  databaseURL: "https://alifam-hub-1b32a-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "alifam-hub-1b32a",
  storageBucket: "alifam-hub-1b32a.firebasestorage.app",
  messagingSenderId: "992942156489",
  appId: "1:992942156489:web:a5e24c7d2fa57b13933b18"
};

const CLOUDINARY_CLOUD = 'dcv1j6htu';
const CLOUDINARY_PRESET = 'ml_default';

const app = initializeApp(FB);
const auth = getAuth(app);
const db = getDatabase(app);
const $ = id => document.getElementById(id);

const SUPER_ADMIN = 'aloysilboudoe@gmail.com';
let currentAdminEmail = '';
let isSuperAdmin = false;

/* ══ THEME ADMIN ══ */
const html = document.documentElement;
const sv = localStorage.getItem('lk-adm-theme') || 'light';
html.setAttribute('data-theme', sv);
if ($('admti')) $('admti').className = sv === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
if ($('themeadm')) {
  $('themeadm').addEventListener('click', () => {
    const n = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', n);
    localStorage.setItem('lk-adm-theme', n);
    if ($('admti')) $('admti').className = n === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
  });
}

/* ══ TOAST ══ */
function toast(msg, type = 's') {
  const box = $('toasts');
  if (!box) return;
  const t = document.createElement('div');
  t.className = `toast t${type}`;
  const ic = document.createElement('i');
  ic.className = type === 's' ? 'fas fa-circle-check' : type === 'e' ? 'fas fa-circle-xmark' : type === 'w' ? 'fas fa-exclamation-triangle' : 'fas fa-circle-info';
  const sp = document.createElement('span');
  sp.textContent = msg;
  t.append(ic, sp);
  box.appendChild(t);
  setTimeout(() => {
    t.classList.add('out');
    setTimeout(() => t.parentNode && box.removeChild(t), 220);
  }, 3000);
}

/* ══ AUTHENTIFICATION FIREBASE ══ */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const isSup = user.email === SUPER_ADMIN;
    let isAdmin = isSup;
    
    if (!isSup) {
      const snap = await get(ref(db, 'settings/admins'));
      const admins = snap.val() || {};
      isAdmin = Object.values(admins).some(a => a.email === user.email);
    }
    
    if (!isAdmin) {
      await signOut(auth);
      if ($('adErr')) $('adErr').textContent = 'Accès refusé. Vous n\'êtes pas administrateur.';
      return;
    }
    
    currentAdminEmail = user.email;
    isSuperAdmin = isSup;
    
    if ($('loginPage')) $('loginPage').classList.remove('on');
    if ($('adminPage')) $('adminPage').classList.add('on');
    if ($('sbav')) $('sbav').textContent = user.email.charAt(0).toUpperCase();
    if ($('sbemail')) $('sbemail').textContent = user.email;
    if (isSup && $('sbAdminLink')) $('sbAdminLink').style.display = 'flex';
    
    loadData();
  } else {
    if ($('loginPage')) $('loginPage').classList.add('on');
    if ($('adminPage')) $('adminPage').classList.remove('on');
    currentAdminEmail = '';
    isSuperAdmin = false;
  }
});

// Connexion
if ($('adBtn')) {
  $('adBtn').addEventListener('click', async () => {
    const email = $('adEmail') ? $('adEmail').value.trim() : '';
    const password = $('adPass') ? $('adPass').value : '';
    
    if ($('adErr')) $('adErr').textContent = '';
    if (!email || !password) {
      if ($('adErr')) $('adErr').textContent = 'Remplissez tous les champs.';
      return;
    }
    
    $('adBtn').innerHTML = '<div class="spin"></div> Connexion…';
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      const errors = {
        'auth/invalid-credential': 'Email ou mot de passe incorrect.',
        'auth/user-not-found': 'Aucun compte avec cet email.',
        'auth/wrong-password': 'Mot de passe incorrect.',
        'auth/too-many-requests': 'Trop de tentatives.'
      };
      if ($('adErr')) $('adErr').textContent = errors[err.code] || 'Erreur de connexion.';
      $('adBtn').innerHTML = '<i class="fas fa-lock"></i> Se connecter';
    }
  });
}

// Entrée pour valider
if ($('adPass')) {
  $('adPass').addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && $('adBtn')) $('adBtn').click();
  });
}

// Déconnexion
if ($('sblogout')) {
  $('sblogout').addEventListener('click', async () => {
    await signOut(auth);
    toast('Déconnecté.', 'i');
  });
}

/* ══ SIDEBAR ══ */
const TITLES = {
  dashboard: 'Tableau de bord',
  products: 'Produits',
  categories: 'Catégories',
  reviews: 'Avis Produits',
  shopreviews: 'Avis Boutique',
  promos: 'Codes Promo',
  users: 'Utilisateurs',
  admins: 'Administrateurs',
  shopinfo: 'Infos Boutique'
};

window.sp = function(panel) {
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.sbl').forEach(l => l.classList.remove('active'));
  const panelEl = $(`panel-${panel}`);
  if (panelEl) panelEl.classList.add('active');
  const sblEl = document.querySelector(`[data-p="${panel}"]`);
  if (sblEl) sblEl.classList.add('active');
  if ($('tbtitle')) $('tbtitle').textContent = TITLES[panel] || panel;
  closeSB();
};

const burAdm = $('burgeradm');
const sb = $('sidebar');
const mobov = $('mobov');

function closeSB() {
  if (sb) sb.classList.remove('open');
  if (mobov) mobov.classList.remove('on');
}

if (burAdm) {
  burAdm.addEventListener('click', () => {
    if (sb) sb.classList.toggle('open');
    if (mobov) mobov.classList.toggle('on');
  });
}
if (mobov) mobov.addEventListener('click', closeSB);

/* ══ DATA ══ */
let allProducts = {};
let allUsers = {};
let allPromos = {};
let allReviews = {};
let allShopReviews = {};
let allCategories = {};
let allAdmins = {};
let reviewFilter = 'pending';
let shopReviewFilter = 'pending';

function loadData() {
  onValue(ref(db, 'products'), snap => { allProducts = snap.val() || {}; renderProducts(); renderDash(); updateStats(); refreshPcatSelect(); });
  onValue(ref(db, 'users'), snap => { allUsers = snap.val() || {}; renderUsers(); updateStats(); });
  onValue(ref(db, 'settings/promoCodes'), snap => { allPromos = snap.val() || {}; renderPromos(); updateStats(); });
  onValue(ref(db, 'settings/shopInfo'), snap => { loadShopInfo(snap.val() || {}); });
  onValue(ref(db, 'settings/admins'), snap => { allAdmins = snap.val() || {}; if (isSuperAdmin) renderAdmins(); });
  onValue(ref(db, 'settings/categories'), snap => {
    allCategories = snap.val() || {};
    renderCatAdmin();
    refreshPcatSelect();
    if ($('sbcatc')) $('sbcatc').textContent = Object.keys(allCategories).length;
  });
  onValue(ref(db, 'reviews'), snap => {
    allReviews = snap.val() || {};
    renderReviews();
    renderDashReviews();
    updateStats();
    const pending = Object.values(allReviews).filter(r => !r.approved).length;
    if ($('sbrev')) {
      $('sbrev').style.display = pending > 0 ? 'inline' : 'none';
      $('sbrev').textContent = pending;
    }
  });
  onValue(ref(db, 'shopReviews'), snap => {
    allShopReviews = snap.val() || {};
    renderShopReviews();
    const pending = Object.values(allShopReviews).filter(r => !r.approved).length;
    if ($('sbshoprev')) {
      $('sbshoprev').style.display = pending > 0 ? 'inline' : 'none';
      $('sbshoprev').textContent = pending;
    }
  });
}

function updateStats() {
  const pp = Object.values(allProducts);
  if ($('stp')) $('stp').textContent = pp.length;
  if ($('sbpc')) $('sbpc').textContent = pp.length;
  const uc = Object.keys(allUsers).length;
  if ($('stu')) $('stu').textContent = uc;
  if ($('sbuc')) $('sbuc').textContent = uc;
  if ($('stpr')) $('stpr').textContent = Object.keys(allPromos).length;
  const pendingRev = Object.values(allReviews).filter(r => !r.approved).length + Object.values(allShopReviews).filter(r => !r.approved).length;
  if ($('starev')) $('starev').textContent = pendingRev;
}

/* ══ CATEGORIES ══ */
const CATS = {
  vpn: { icon: 'fas fa-wifi', grad: 'linear-gradient(135deg,#1a56ff,#00b87a)' },
  moov: { icon: 'fas fa-shield-alt', grad: 'linear-gradient(135deg,#00a651,#00c864)' },
  tiktok: { icon: 'fab fa-tiktok', grad: 'linear-gradient(135deg,#111,#fe2c55)' },
  netflix: { icon: 'fas fa-film', grad: 'linear-gradient(135deg,#e50914,#c00)' },
  canal: { icon: 'fas fa-tv', grad: 'linear-gradient(135deg,#002a5c,#ffcc00)' },
  pass: { icon: 'fab fa-tiktok', grad: 'linear-gradient(135deg,#00a651,#fe2c55)' },
  default: { icon: 'fas fa-box', grad: 'linear-gradient(135deg,#ff6b35,#e05020)' }
};

/* ══ RENDER PRODUCTS ══ */
function renderProducts() {
  const tbody = $('prodtbl');
  if (!tbody) return;
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  const pp = Object.entries(allProducts).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.order || 99) - (b.order || 99));
  if (!pp.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.innerHTML = '<div class="emptystate"><i class="fas fa-box-open"></i><p>Aucun produit.</p></div>';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  pp.forEach(p => {
    const cat = CATS[p.category] || CATS.default;
    const tr = document.createElement('tr');
    const tdN = document.createElement('td');
    tdN.style.cssText = 'display:flex;align-items:center;gap:10px';
    if (p.image) {
      const img = document.createElement('img');
      img.className = 'prod-thumb';
      img.src = p.image;
      img.alt = '';
      tdN.appendChild(img);
    } else {
      const id2 = document.createElement('div');
      id2.className = 'prod-icon-sm';
      id2.style.background = cat.grad;
      id2.innerHTML = `<i class="${p.icon || cat.icon}"></i>`;
      tdN.appendChild(id2);
    }
    const strong = document.createElement('strong');
    strong.textContent = p.name || '—';
    tdN.appendChild(strong);
    const tdC = document.createElement('td');
    tdC.textContent = p.category || '—';
    const tdP = document.createElement('td');
    tdP.textContent = Number(p.price || 0).toLocaleString('fr-FR') + ' F';
    const tdS = document.createElement('td');
    tdS.innerHTML = `<span class="badge ${p.active === false ? 'bhid' : 'bact'}">${p.active === false ? 'Masqué' : 'Actif'}</span>`;
    const tdA = document.createElement('td');
    const div = document.createElement('div');
    div.className = 'tdacts';
    const eb = document.createElement('button');
    eb.className = 'tdbtn tde';
    eb.innerHTML = '<i class="fas fa-edit"></i> Modifier';
    eb.addEventListener('click', () => openPM(p.id));
    const tb = document.createElement('button');
    tb.className = 'tdbtn tdt';
    tb.innerHTML = p.active === false ? '<i class="fas fa-eye"></i> Activer' : '<i class="fas fa-eye-slash"></i> Masquer';
    tb.addEventListener('click', () => toggleProd(p.id, p.active));
    const db2 = document.createElement('button');
    db2.className = 'tdbtn tdd';
    db2.innerHTML = '<i class="fas fa-trash"></i>';
    db2.addEventListener('click', () => confirmAction('Supprimer ce produit ?', 'Cette action est irréversible.', async () => { await remove(ref(db, 'products/' + p.id)); toast('Produit supprimé.', 'i'); }));
    div.append(eb, tb, db2);
    tdA.appendChild(div);
    tr.append(tdN, tdC, tdP, tdS, tdA);
    tbody.appendChild(tr);
  });
}

function renderDash() {
  const cont = $('dashprod');
  if (!cont) return;
  const pp = Object.entries(allProducts).map(([id, p]) => ({ id, ...p })).sort((a, b) => (a.order || 99) - (b.order || 99)).slice(0, 5);
  if (!pp.length) {
    cont.innerHTML = '<div class="emptystate"><i class="fas fa-box-open"></i><p>Aucun produit.</p></div>';
    return;
  }
  const t = document.createElement('table');
  t.className = 'tbl';
  t.innerHTML = '<thead><tr><th>Produit</th><th>Prix</th><th>Statut</th></tr></thead>';
  const tb = document.createElement('tbody');
  pp.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${p.name || '—'}</strong></td><td>${Number(p.price || 0).toLocaleString('fr-FR')} F</td><td><span class="badge ${p.active === false ? 'bhid' : 'bact'}">${p.active === false ? 'Masqué' : 'Actif'}</span></td>`;
    tb.appendChild(tr);
  });
  t.appendChild(tb);
  cont.innerHTML = '';
  cont.appendChild(t);
}

/* ══ RENDER REVIEWS ══ */
function renderDashReviews() {
  const cont = $('dashReviews');
  if (!cont) return;
  const pending = Object.entries(allReviews).map(([id, r]) => ({ id, ...r })).filter(r => !r.approved).slice(0, 3);
  if (!pending.length) {
    cont.innerHTML = '<div class="emptystate"><i class="fas fa-star-half-alt"></i><p>Aucun avis en attente.</p></div>';
    return;
  }
  cont.innerHTML = '';
  pending.forEach(r => { renderReviewCard(r, cont, 'review', true); });
}

function renderReviews() {
  const cont = $('reviewsList');
  if (!cont) return;
  cont.innerHTML = '';
  let list = Object.entries(allReviews).map(([id, r]) => ({ id, ...r }));
  if (reviewFilter === 'pending') list = list.filter(r => !r.approved);
  else if (reviewFilter === 'approved') list = list.filter(r => r.approved);
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!list.length) {
    cont.innerHTML = '<div class="emptystate"><i class="fas fa-star"></i><p>Aucun avis dans cette catégorie.</p></div>';
    return;
  }
  list.forEach(r => renderReviewCard(r, cont, 'review', false));
}

function renderShopReviews() {
  const cont = $('shopReviewsList');
  if (!cont) return;
  cont.innerHTML = '';
  let list = Object.entries(allShopReviews).map(([id, r]) => ({ id, ...r }));
  if (shopReviewFilter === 'pending') list = list.filter(r => !r.approved);
  else if (shopReviewFilter === 'approved') list = list.filter(r => r.approved);
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  if (!list.length) {
    cont.innerHTML = '<div class="emptystate"><i class="fas fa-comments"></i><p>Aucun avis dans cette catégorie.</p></div>';
    return;
  }
  list.forEach(r => renderReviewCard(r, cont, 'shopReview', false));
}

function renderReviewCard(r, container, type, mini) {
  const dbPath = type === 'review' ? 'reviews/' + r.id : 'shopReviews/' + r.id;
  const card = document.createElement('div');
  card.className = 'review-mod-card';
  const stars = '★'.repeat(r.stars || 0) + '☆'.repeat(5 - (r.stars || 0));
  const productInfo = (type === 'review' && r.productId && allProducts[r.productId]) ? `<span style="font-size:.72rem;background:rgba(26,86,255,.1);color:var(--blue);padding:2px 7px;border-radius:5px;font-weight:700">${allProducts[r.productId].name}</span>` : '';
  card.innerHTML = `
    <div class="review-mod-top">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap">
        <span class="review-mod-author">${r.author || 'Anonyme'}</span>
        ${productInfo}
        <span class="badge ${r.approved ? 'bact' : 'bpending'}">${r.approved ? 'Approuvé' : 'En attente'}</span>
      </div>
      <span class="review-mod-date">${r.date ? new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}</span>
    </div>
    <div class="review-mod-stars" style="color:#f5c030">${stars}</div>
    <div class="review-mod-text">${r.text || ''}</div>`;
  const acts = document.createElement('div');
  acts.className = 'review-mod-acts';
  if (!r.approved) {
    const ab = document.createElement('button');
    ab.className = 'btn btgr';
    ab.style.cssText = 'padding:5px 11px;font-size:.77rem';
    ab.innerHTML = '<i class="fas fa-check"></i> Approuver';
    ab.addEventListener('click', async () => { await update(ref(db, dbPath), { approved: true }); toast('Avis approuvé ✅'); });
    acts.appendChild(ab);
  } else {
    const rb = document.createElement('button');
    rb.className = 'btn btg';
    rb.style.cssText = 'padding:5px 11px;font-size:.77rem';
    rb.innerHTML = '<i class="fas fa-eye-slash"></i> Masquer';
    rb.addEventListener('click', async () => { await update(ref(db, dbPath), { approved: false }); toast('Avis masqué.', 'i'); });
    acts.appendChild(rb);
  }
  const db2 = document.createElement('button');
  db2.className = 'btn btr';
  db2.style.cssText = 'padding:5px 11px;font-size:.77rem';
  db2.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
  db2.addEventListener('click', () => confirmAction('Supprimer cet avis ?', 'Cette action est irréversible.', async () => { await remove(ref(db, dbPath)); toast('Avis supprimé.', 'i'); }));
  acts.appendChild(db2);
  card.appendChild(acts);
  container.appendChild(card);
}

window.filterReviews = function(f) {
  reviewFilter = f;
  document.querySelectorAll('#reviewTabRow .tab-btn').forEach((b, i) => {
    b.classList.toggle('on', ['pending', 'approved', 'all'][i] === f);
  });
  renderReviews();
};

window.filterShopReviews = function(f) {
  shopReviewFilter = f;
  renderShopReviews();
};

/* ══ RENDER USERS ══ */
function renderUsers() {
  const tbody = $('userstbl');
  if (!tbody) return;
  const query = $('userSearch') ? $('userSearch').value.toLowerCase() : '';
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  let uu = Object.entries(allUsers).map(([id, u]) => ({ id, ...u }));
  if (query) uu = uu.filter(u => (u.name || '').toLowerCase().includes(query) || (u.email || '').toLowerCase().includes(query));
  if (!uu.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 5;
    td.innerHTML = '<div class="emptystate"><i class="fas fa-users"></i><p>Aucun utilisateur.</p></div>';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  uu.forEach(u => {
    const tr = document.createElement('tr');
    const tdU = document.createElement('td');
    tdU.style.cssText = 'display:flex;align-items:center;gap:9px';
    const av = document.createElement('div');
    av.style.cssText = 'width:30px;height:30px;border-radius:50%;background:linear-gradient(135deg,#ff6b35,#e05020);display:flex;align-items:center;justify-content:center;color:#fff;font-size:.73rem;font-weight:800;flex-shrink:0';
    av.textContent = (u.name || u.email || '?').charAt(0).toUpperCase();
    const nm = document.createElement('strong');
    nm.textContent = u.name || 'Utilisateur';
    tdU.append(av, nm);
    const te = document.createElement('td');
    te.textContent = u.email || '—';
    const td2 = document.createElement('td');
    td2.textContent = u.lastLogin ? new Date(u.lastLogin).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
    const tdS = document.createElement('td');
    tdS.innerHTML = u.banned ? '<span class="badge bbanned"><i class="fas fa-ban"></i> Banni</span>' : '<span class="badge bact">Actif</span>';
    const tdA = document.createElement('td');
    const acts = document.createElement('div');
    acts.className = 'tdacts';
    const detBtn = document.createElement('button');
    detBtn.className = 'tdbtn tde';
    detBtn.innerHTML = '<i class="fas fa-eye"></i>';
    detBtn.addEventListener('click', () => openUserMod(u));
    const banBtn = document.createElement('button');
    if (u.banned) {
      banBtn.className = 'tdbtn tdub';
      banBtn.innerHTML = '<i class="fas fa-user-check"></i> Débannir';
      banBtn.addEventListener('click', () => confirmAction('Débannir cet utilisateur ?', 'L\'utilisateur pourra à nouveau accéder à la boutique.', async () => { await update(ref(db, 'users/' + u.id), { banned: false }); toast('Utilisateur débanni.', 'i'); }));
    } else {
      banBtn.className = 'tdbtn tdbr';
      banBtn.innerHTML = '<i class="fas fa-ban"></i> Bannir';
      banBtn.addEventListener('click', () => confirmAction('Bannir cet utilisateur ?', 'Cet utilisateur ne pourra plus se connecter à la boutique.', async () => { await update(ref(db, 'users/' + u.id), { banned: true }); toast('Utilisateur banni.', 'w'); }));
    }
    acts.append(detBtn, banBtn);
    tdA.appendChild(acts);
    tr.append(tdU, te, td2, tdS, tdA);
    tbody.appendChild(tr);
  });
}

if ($('userSearch')) $('userSearch').addEventListener('input', renderUsers);

/* ══ USER DETAIL MODAL ══ */
window.openUserMod = function(u) {
  const body = $('usermodBody');
  if (!body) return;
  body.innerHTML = '';
  const initials = (u.name || u.email || '?').charAt(0).toUpperCase();
  const lastLogin = u.lastLogin ? new Date(u.lastLogin).toLocaleString('fr-FR') : 'Jamais';
  const userRevs = Object.values(allReviews).filter(r => r.userId === u.id);
  const shopRevs = Object.values(allShopReviews).filter(r => r.userId === u.id);
  body.innerHTML = `
    <div class="user-detail-card">
      <div class="user-detail-top">
        <div class="user-av-lg">${initials}</div>
        <div>
          <div style="font-size:.97rem;font-weight:800">${u.name || 'Utilisateur'}</div>
          <div style="font-size:.8rem;color:var(--text3)">${u.email || '—'}</div>
          <div style="margin-top:5px">${u.banned ? '<span class="badge bbanned"><i class="fas fa-ban"></i> Banni</span>' : '<span class="badge bact">Actif</span>'}</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:6px">
        <div style="background:var(--bg2,var(--bg));border-radius:8px;padding:11px;border:1px solid var(--border)">
          <div style="font-size:.72rem;color:var(--text3);margin-bottom:3px">Dernière connexion</div>
          <div style="font-size:.83rem;font-weight:700">${lastLogin}</div>
        </div>
        <div style="background:var(--bg2,var(--bg));border-radius:8px;padding:11px;border:1px solid var(--border)">
          <div style="font-size:.72rem;color:var(--text3);margin-bottom:3px">Avis soumis</div>
          <div style="font-size:.83rem;font-weight:700">${userRevs.length + shopRevs.length} (${userRevs.length} produits · ${shopRevs.length} boutique)</div>
        </div>
      </div>
    </div>
    ${userRevs.length > 0 ? `<div style="font-size:.82rem;font-weight:700;margin-bottom:8px;color:var(--text2)">Avis produits de cet utilisateur :</div>` : ''}
  `;
  userRevs.forEach(r => {
    const d = document.createElement('div');
    d.style.cssText = 'background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:10px 13px;margin-bottom:7px;font-size:.82rem';
    const prod = allProducts[r.productId];
    d.innerHTML = `<div style="font-weight:700;margin-bottom:3px">${prod ? prod.name : 'Produit inconnu'} — ${'★'.repeat(r.stars || 0)}</div><div style="color:var(--text2)">${r.text || ''}</div><div style="font-size:.72rem;color:var(--text3);margin-top:4px">${r.approved ? '✅ Approuvé' : '⏳ En attente'}</div>`;
    body.appendChild(d);
  });
  if ($('usermod')) $('usermod').classList.add('on');
};

window.closeUserMod = function() { if ($('usermod')) $('usermod').classList.remove('on'); };
if ($('usermod')) $('usermod').addEventListener('click', e => { if (e.target === $('usermod')) closeUserMod(); });

/* ══ RENDER PROMOS ══ */
function renderPromos() {
  const tbody = $('promotbl');
  if (!tbody) return;
  while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
  const pp = Object.entries(allPromos).map(([code, v]) => ({ code, ...v }));
  if (!pp.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 4;
    td.innerHTML = '<div class="emptystate"><i class="fas fa-percent"></i><p>Aucun code promo.</p></div>';
    tr.appendChild(td);
    tbody.appendChild(tr);
    return;
  }
  pp.forEach(p => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td><strong>${p.code}</strong></td><td>${p.discount}%</td><td><span class="badge ${p.active ? 'bact' : 'bhid'}">${p.active ? 'Actif' : 'Inactif'}</span></td>`;
    const ta = document.createElement('td');
    const acts = document.createElement('div');
    acts.className = 'tdacts';
    const tb2 = document.createElement('button');
    tb2.className = 'tdbtn tdt';
    tb2.innerHTML = p.active ? '<i class="fas fa-eye-slash"></i>' : '<i class="fas fa-eye"></i>';
    tb2.addEventListener('click', async () => { await update(ref(db, 'settings/promoCodes/' + p.code), { active: !p.active }); toast('Code mis à jour.', 'i'); });
    const db2 = document.createElement('button');
    db2.className = 'tdbtn tdd';
    db2.innerHTML = '<i class="fas fa-trash"></i>';
    db2.addEventListener('click', () => confirmAction('Supprimer ce code promo ?', 'Cette action est irréversible.', async () => { await remove(ref(db, 'settings/promoCodes/' + p.code)); toast('Code supprimé.', 'i'); }));
    acts.append(tb2, db2);
    ta.appendChild(acts);
    tr.appendChild(ta);
    tbody.appendChild(tr);
  });
}

/* ══ SHOP INFO ══ */
function loadShopInfo(d) {
  if ($('shopName')) $('shopName').value = d.name || '';
  if ($('shopTagline')) $('shopTagline').value = d.tagline || '';
  if ($('shopPhone1')) $('shopPhone1').value = d.phone1 || '';
  if ($('shopWhatsapp')) $('shopWhatsapp').value = d.whatsapp || '';
  if ($('shopEmail')) $('shopEmail').value = d.email || '';
  if ($('shopAddr')) $('shopAddr').value = d.address || '';
  if ($('shopClients')) $('shopClients').value = d.clients || '';
  if ($('shopFb')) $('shopFb').value = d.facebook || '';
  if ($('shopIg')) $('shopIg').value = d.instagram || '';
  if ($('shopTg')) $('shopTg').value = d.telegram || '';
  if ($('shopDesc')) $('shopDesc').value = d.description || '';
  if ($('shopFooterDesc')) $('shopFooterDesc').value = d.footerDesc || '';
  if ($('shopCopy')) $('shopCopy').value = d.copy || '';
}

if ($('saveShopInfo')) {
  $('saveShopInfo').addEventListener('click', async () => {
    const data = {
      name: $('shopName') ? $('shopName').value.trim() : '',
      tagline: $('shopTagline') ? $('shopTagline').value.trim() : '',
      phone1: $('shopPhone1') ? $('shopPhone1').value.trim() : '',
      whatsapp: $('shopWhatsapp') ? $('shopWhatsapp').value.trim() : '',
      email: $('shopEmail') ? $('shopEmail').value.trim() : '',
      address: $('shopAddr') ? $('shopAddr').value.trim() : '',
      clients: $('shopClients') ? $('shopClients').value.trim() : '',
      facebook: $('shopFb') ? $('shopFb').value.trim() : '',
      instagram: $('shopIg') ? $('shopIg').value.trim() : '',
      telegram: $('shopTg') ? $('shopTg').value.trim() : '',
      description: $('shopDesc') ? $('shopDesc').value.trim() : '',
      footerDesc: $('shopFooterDesc') ? $('shopFooterDesc').value.trim() : '',
      copy: $('shopCopy') ? $('shopCopy').value.trim() : '',
    };
    if ($('saveShopInfo')) $('saveShopInfo').innerHTML = '<div class="spin"></div>';
    await set(ref(db, 'settings/shopInfo'), data);
    toast('Infos boutique mises à jour ! ✅');
    if ($('saveShopInfo')) $('saveShopInfo').innerHTML = '<i class="fas fa-save"></i> Enregistrer les infos';
  });
}

/* ══ THEMES ══ */
const THEMES_DATA = [
  { id: 'orange', name: 'Orange Soleil', from: '#ff6b35', to: '#e05020' },
  { id: 'midnight', name: 'Midnight', from: '#7c4dff', to: '#5c2ee0' },
  { id: 'forest', name: 'Forêt', from: '#00b87a', to: '#009b68' },
  { id: 'royal', name: 'Royal Blue', from: '#1a56ff', to: '#0038cc' },
  { id: 'onyx', name: 'Onyx Gold', from: '#f0c040', to: '#c9a020' },
];
let selectedTheme = 'orange';

function renderThemes() {
  const g = $('themeGrid');
  if (!g) return;
  g.innerHTML = '';
  THEMES_DATA.forEach(t => {
    const d = document.createElement('div');
    d.className = `theme-pick${selectedTheme === t.id ? ' selected' : ''}`;
    d.style.background = selectedTheme === t.id ? `linear-gradient(135deg,${t.from}18,${t.to}10)` : 'var(--card)';
    d.style.border = selectedTheme === t.id ? `2.5px solid ${t.from}` : '2.5px solid var(--border)';
    const dot = document.createElement('div');
    dot.className = 'tp-dot';
    dot.style.background = `linear-gradient(135deg,${t.from},${t.to})`;
    const nm = document.createElement('div');
    nm.textContent = t.name;
    nm.style.color = selectedTheme === t.id ? t.from : 'var(--text2)';
    d.append(dot, nm);
    d.addEventListener('click', async () => {
      selectedTheme = t.id;
      await set(ref(db, 'settings/theme'), t.id);
      renderThemes();
    });
    g.appendChild(d);
  });
}

/* ══ CATEGORIES ADMIN ══ */
const GRAD_PRESETS = [
  'linear-gradient(135deg,#ff6b35,#e05020)',
  'linear-gradient(135deg,#1a56ff,#7c4dff)',
  'linear-gradient(135deg,#00b87a,#009b68)',
  'linear-gradient(135deg,#e50914,#c00)',
  'linear-gradient(135deg,#f59e0b,#d97706)',
  'linear-gradient(135deg,#111,#fe2c55)',
  'linear-gradient(135deg,#00a651,#00c864)',
  'linear-gradient(135deg,#002a5c,#1a56ff)',
  'linear-gradient(135deg,#7c4dff,#5c2ee0)',
  'linear-gradient(135deg,#f0c040,#c9a020)',
];

function renderCatAdmin() {
  const grid = $('catAdminGrid');
  if (!grid) return;
  grid.innerHTML = '';
  const cats = Object.entries(allCategories).sort((a, b) => (a[1].order || 99) - (b[1].order || 99));
  if (!cats.length) {
    grid.innerHTML = '<div class="cat-admin-empty"><i class="fas fa-th-large" style="font-size:2rem;opacity:.2;display:block;margin-bottom:8px"></i>Aucune catégorie. Créez-en une !</div>';
    return;
  }
  cats.forEach(([id, cat]) => {
    const card = document.createElement('div');
    card.className = 'cat-admin-card';
    const ic = document.createElement('div');
    ic.className = 'cat-admin-icon';
    ic.style.background = cat.grad || 'linear-gradient(135deg,#ff6b35,#e05020)';
    ic.innerHTML = `<i class="${cat.icon || 'fas fa-tag'}"></i>`;
    const nm = document.createElement('div');
    nm.className = 'cat-admin-name';
    nm.textContent = cat.name || id;
    const cnt = Object.values(allProducts).filter(p => p.category === id).length;
    const sub = document.createElement('div');
    sub.style.cssText = 'font-size:.71rem;color:var(--text3)';
    sub.textContent = cnt + ' produit' + (cnt > 1 ? 's' : '');
    const acts = document.createElement('div');
    acts.className = 'cat-admin-acts';
    const eb = document.createElement('button');
    eb.className = 'tdbtn tde';
    eb.innerHTML = '<i class="fas fa-edit"></i>';
    eb.addEventListener('click', () => openCatM(id));
    const db2 = document.createElement('button');
    db2.className = 'tdbtn tdd';
    db2.innerHTML = '<i class="fas fa-trash"></i>';
    db2.addEventListener('click', () => confirmAction('Supprimer cette catégorie ?', 'Les produits associés ne seront pas supprimés.', async () => {
      await remove(ref(db, 'settings/categories/' + id));
      toast('Catégorie supprimée.', 'i');
    }));
    acts.append(eb, db2);
    card.append(ic, nm, sub, acts);
    grid.appendChild(card);
  });
}

const ICONS = ['fas fa-wifi', 'fas fa-shield-alt', 'fas fa-film', 'fas fa-tv', 'fab fa-tiktok', 'fas fa-music', 'fas fa-gamepad', 'fas fa-mobile-alt', 'fas fa-laptop', 'fas fa-headphones', 'fas fa-cloud', 'fas fa-bolt', 'fas fa-fire', 'fas fa-star', 'fas fa-crown', 'fas fa-gem', 'fas fa-rocket', 'fas fa-globe', 'fas fa-video', 'fas fa-play', 'fas fa-podcast', 'fas fa-broadcast-tower', 'fas fa-signal', 'fas fa-rss', 'fas fa-satellite-dish', 'fas fa-user-shield', 'fas fa-lock', 'fas fa-key', 'fas fa-infinity', 'fas fa-chart-line', 'fas fa-dollar-sign', 'fas fa-coins', 'fas fa-percentage', 'fas fa-gift', 'fab fa-instagram', 'fab fa-facebook-f', 'fab fa-youtube', 'fab fa-whatsapp'];

function buildCatIconPicker() {
  const picker = $('catIconPicker');
  if (!picker) return;
  picker.innerHTML = '';
  ICONS.forEach(ic => {
    const d = document.createElement('div');
    d.className = 'icon-pick';
    d.title = ic;
    d.innerHTML = `<i class="${ic}"></i>`;
    d.addEventListener('click', () => {
      picker.querySelectorAll('.icon-pick').forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      if ($('catIcon')) $('catIcon').value = ic;
      if ($('catIconPrev')) $('catIconPrev').style.display = 'flex';
      if ($('catIconI')) $('catIconI').className = ic;
      if ($('catIconDot')) $('catIconDot').style.background = ($('catGrad') ? $('catGrad').value : GRAD_PRESETS[0]);
      if ($('catIconName')) $('catIconName').textContent = ic.split(' ').pop();
    });
    picker.appendChild(d);
  });
}

function buildGradPresets(selectedGrad) {
  const wrap = $('gradPresets');
  if (!wrap) return;
  wrap.innerHTML = '';
  GRAD_PRESETS.forEach(g => {
    const d = document.createElement('div');
    d.className = 'grad-preset' + (selectedGrad === g ? ' sel' : '');
    d.style.background = g;
    d.title = g;
    d.addEventListener('click', () => {
      if ($('catGrad')) $('catGrad').value = g;
      wrap.querySelectorAll('.grad-preset').forEach(x => x.classList.remove('sel'));
      d.classList.add('sel');
      if ($('catIconPrev') && $('catIconPrev').style.display !== 'none' && $('catIconDot')) $('catIconDot').style.background = g;
    });
    wrap.appendChild(d);
  });
}

window.openCatM = function(id = null) {
  buildCatIconPicker();
  buildGradPresets(GRAD_PRESETS[0]);
  if ($('catEditId')) $('catEditId').value = id || '';
  if ($('cattitle')) $('cattitle').textContent = id ? 'Modifier la catégorie' : 'Nouvelle catégorie';
  if ($('catName')) $('catName').value = '';
  if ($('catOrder')) $('catOrder').value = '99';
  if ($('catIcon')) $('catIcon').value = '';
  if ($('catGrad')) $('catGrad').value = GRAD_PRESETS[0];
  if ($('catIconPrev')) $('catIconPrev').style.display = 'none';
  if ($('catIconPicker')) $('catIconPicker').querySelectorAll('.icon-pick').forEach(x => x.classList.remove('selected'));
  if (id && allCategories[id]) {
    const c = allCategories[id];
    if ($('catName')) $('catName').value = c.name || '';
    if ($('catOrder')) $('catOrder').value = c.order || 99;
    if (c.icon) {
      if ($('catIcon')) $('catIcon').value = c.icon;
      if ($('catIconPrev')) $('catIconPrev').style.display = 'flex';
      if ($('catIconI')) $('catIconI').className = c.icon;
      if ($('catIconPicker')) $('catIconPicker').querySelectorAll('.icon-pick').forEach(x => { if (x.querySelector('i').className === c.icon) x.classList.add('selected'); });
    }
    if (c.grad) {
      if ($('catGrad')) $('catGrad').value = c.grad;
      buildGradPresets(c.grad);
      if ($('catIconPrev') && $('catIconPrev').style.display !== 'none' && $('catIconDot')) $('catIconDot').style.background = c.grad;
    }
  }
  if ($('catmod')) $('catmod').classList.add('on');
};

window.closeCatM = function() { if ($('catmod')) $('catmod').classList.remove('on'); };
if ($('catmod')) $('catmod').addEventListener('click', e => { if (e.target === $('catmod')) closeCatM(); });

window.clearCatIcon = function() {
  if ($('catIcon')) $('catIcon').value = '';
  if ($('catIconPrev')) $('catIconPrev').style.display = 'none';
  if ($('catIconPicker')) $('catIconPicker').querySelectorAll('.icon-pick').forEach(x => x.classList.remove('selected'));
};

window.saveCat = async function() {
  const name = $('catName') ? $('catName').value.trim() : '';
  if (!name) { toast('Entrez un nom de catégorie.', 'w'); return; }
  const icon = $('catIcon') ? $('catIcon').value : '';
  if (!icon) { toast('Sélectionnez une icône.', 'w'); return; }
  const id = ($('catEditId') ? $('catEditId').value : '') || name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const data = { name, icon, grad: ($('catGrad') ? $('catGrad').value : GRAD_PRESETS[0]), order: parseInt(($('catOrder') ? $('catOrder').value : '99')) || 99 };
  if ($('savecatbtn')) $('savecatbtn').innerHTML = '<div class="spin"></div>';
  try {
    await set(ref(db, 'settings/categories/' + id), data);
    toast(($('catEditId') && $('catEditId').value) ? 'Catégorie modifiée !' : 'Catégorie créée ! 🎉');
    closeCatM();
  } catch (e) { toast('Erreur : ' + e.message, 'e'); }
  if ($('savecatbtn')) $('savecatbtn').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
};

/* ══ SELECT CATÉGORIE DYNAMIQUE dans le modal produit ══ */
function refreshPcatSelect() {
  const sel = $('pcat');
  if (!sel) return;
  const cur = sel.value;
  sel.innerHTML = '';
  Object.entries(allCategories).sort((a, b) => (a[1].order || 99) - (b[1].order || 99)).forEach(([id, cat]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = cat.name || id;
    sel.appendChild(opt);
  });
  if (!sel.options.length) {
    ['vpn', 'moov', 'pass', 'tiktok', 'netflix', 'canal'].forEach(v => {
      const opt = document.createElement('option');
      opt.value = v;
      opt.textContent = v.charAt(0).toUpperCase() + v.slice(1);
      sel.appendChild(opt);
    });
  }
  const defOpt = document.createElement('option');
  defOpt.value = 'default';
  defOpt.textContent = 'Autre';
  sel.appendChild(defOpt);
  if (cur) sel.value = cur;
}

/* ══ ADMINS ══ */
function renderAdmins() {
  const list = $('adminList');
  if (!list) return;
  list.innerHTML = '';
  const superCard = document.createElement('div');
  superCard.className = 'admin-card';
  superCard.innerHTML = `
    <div class="admin-av admin-av-super">${SUPER_ADMIN.charAt(0).toUpperCase()}</div>
    <div class="admin-info">
      <div class="admin-email">${SUPER_ADMIN}</div>
      <div class="admin-role"><span class="admin-super-badge"><i class="fas fa-crown"></i> Super Admin</span></div>
    </div>`;
  list.appendChild(superCard);
  const admins = Object.entries(allAdmins).sort((a, b) => (a[1].addedAt || 0) - (b[1].addedAt || 0));
  if (!admins.length) {
    const info = document.createElement('div');
    info.style.cssText = 'font-size:.82rem;color:var(--text3);text-align:center;padding:16px 0';
    info.innerHTML = '<i class="fas fa-user-plus" style="display:block;font-size:1.5rem;opacity:.2;margin-bottom:6px"></i>Aucun admin ajouté. Cliquez sur "Ajouter un admin".';
    list.appendChild(info);
    return;
  }
  admins.forEach(([id, a]) => {
    const card = document.createElement('div');
    card.className = 'admin-card';
    card.innerHTML = `
      <div class="admin-av admin-av-reg">${(a.email || '?').charAt(0).toUpperCase()}</div>
      <div class="admin-info">
        <div class="admin-email">${a.email || '—'}</div>
        <div class="admin-role">${a.name || 'Administrateur'} · <span style="color:var(--text3);font-size:.7rem">Ajouté le ${a.addedAt ? new Date(a.addedAt).toLocaleDateString('fr-FR') : '—'}</span></div>
      </div>
      <div class="tdacts">
        <button class="tdbtn tdd" title="Supprimer" id="del-admin-${id}"><i class="fas fa-trash"></i></button>
      </div>`;
    const delBtn = card.querySelector(`#del-admin-${id}`);
    if (delBtn) {
      delBtn.addEventListener('click', () => {
        confirmAction('Supprimer cet admin ?', `${a.email} n'aura plus accès au panel.`, async () => {
          await remove(ref(db, 'settings/admins/' + id));
          toast('Admin supprimé.', 'i');
        });
      });
    }
    list.appendChild(card);
  });
}

window.openAdminM = function() {
  if ($('newAdminEmail')) $('newAdminEmail').value = '';
  if ($('newAdminName')) $('newAdminName').value = '';
  if ($('adminmod')) $('adminmod').classList.add('on');
  setTimeout(() => { if ($('newAdminEmail')) $('newAdminEmail').focus(); }, 100);
};

window.closeAdminM = function() { if ($('adminmod')) $('adminmod').classList.remove('on'); };
if ($('adminmod')) $('adminmod').addEventListener('click', e => { if (e.target === $('adminmod')) closeAdminM(); });

window.saveAdmin = async function() {
  const email = $('newAdminEmail') ? $('newAdminEmail').value.trim().toLowerCase() : '';
  const name = $('newAdminName') ? $('newAdminName').value.trim() : '';
  if (!email) { toast('Entrez un email.', 'w'); return; }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { toast('Email invalide.', 'w'); return; }
  if (email === SUPER_ADMIN) { toast('Cet email est déjà le super admin.', 'w'); return; }
  if (Object.values(allAdmins).some(a => a.email === email)) { toast('Cet admin existe déjà.', 'w'); return; }
  if ($('saveAdminBtn')) $('saveAdminBtn').innerHTML = '<div class="spin"></div>';
  try {
    await push(ref(db, 'settings/admins'), { email, name: name || 'Administrateur', addedAt: new Date().toISOString(), addedBy: currentAdminEmail });
    toast('Admin ajouté avec succès ! 🎉');
    closeAdminM();
  } catch (e) { toast('Erreur : ' + e.message, 'e'); }
  if ($('saveAdminBtn')) $('saveAdminBtn').innerHTML = '<i class="fas fa-user-plus"></i> Ajouter';
};

/* ══ GALERIE IMAGES — UPLOAD CLOUDINARY ══ */
let galleryUrls = [];

function renderGalleryGrid() {
  const grid = $('galleryGrid');
  if (!grid) return;
  grid.innerHTML = '';
  galleryUrls.forEach((url, idx) => {
    const item = document.createElement('div');
    item.className = 'gallery-item';
    const img = document.createElement('img');
    img.src = url;
    img.alt = '';
    const del = document.createElement('button');
    del.className = 'gallery-item-del';
    del.type = 'button';
    del.innerHTML = '<i class="fas fa-times"></i>';
    del.title = 'Supprimer';
    del.addEventListener('click', () => {
      galleryUrls.splice(idx, 1);
      renderGalleryGrid();
    });
    item.append(img, del);
    grid.appendChild(item);
  });
  const tile = document.createElement('div');
  tile.className = 'gallery-add-tile';
  const fileInput = document.createElement('input');
  fileInput.type = 'file';
  fileInput.accept = 'image/*';
  fileInput.multiple = true;
  fileInput.addEventListener('change', () => handleGalleryFiles(fileInput.files));
  tile.innerHTML = '<i class="fas fa-camera"></i><span>Ajouter<br>une image</span>';
  tile.appendChild(fileInput);
  grid.appendChild(tile);
}

async function handleGalleryFiles(files) {
  const arr = Array.from(files).slice(0, 8);
  for (const file of arr) {
    if (file.size > 5 * 1024 * 1024) { toast('Image trop lourde (max 5Mo).', 'e'); continue; }
    await uploadGalleryFile(file);
  }
}

async function uploadGalleryFile(file) {
  const grid = $('galleryGrid');
  if (!grid) return;
  const item = document.createElement('div');
  item.className = 'gallery-item';
  const thumb = document.createElement('img');
  thumb.src = URL.createObjectURL(file);
  thumb.alt = '';
  const prog = document.createElement('div');
  prog.className = 'gallery-item-prog';
  const bar = document.createElement('div');
  bar.className = 'gallery-item-prog-bar';
  const fill = document.createElement('div');
  fill.className = 'gallery-item-prog-fill';
  fill.style.width = '0%';
  const lbl = document.createElement('span');
  lbl.textContent = '0%';
  bar.appendChild(fill);
  prog.append(bar, lbl);
  item.append(thumb, prog);
  const tile = grid.querySelector('.gallery-add-tile');
  grid.insertBefore(item, tile);
  try {
    fill.style.width = '20%';
    lbl.textContent = '20%';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    fill.style.width = '50%';
    lbl.textContent = '50%';
    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
    fill.style.width = '90%';
    lbl.textContent = '90%';
    const data = await res.json();
    if (data.secure_url) {
      fill.style.width = '100%';
      lbl.textContent = '✓';
      setTimeout(() => {
        prog.remove();
        galleryUrls.push(data.secure_url);
        renderGalleryGrid();
      }, 400);
    } else throw new Error('Upload échoué');
  } catch (e) {
    item.remove();
    toast('Erreur upload galerie.', 'e');
  }
}

function getGalleryUrls() { return [...galleryUrls]; }

window.addGalleryRow = function(url = '') {
  if (url && !galleryUrls.includes(url)) { galleryUrls.push(url); }
  renderGalleryGrid();
};

function buildIconPicker() {
  const picker = $('iconPicker');
  if (!picker) return;
  picker.innerHTML = '';
  ICONS.forEach(ic => {
    const d = document.createElement('div');
    d.className = 'icon-pick';
    d.title = ic;
    d.innerHTML = `<i class="${ic}"></i>`;
    d.addEventListener('click', () => {
      picker.querySelectorAll('.icon-pick').forEach(x => x.classList.remove('selected'));
      d.classList.add('selected');
      if ($('selIcon')) $('selIcon').value = ic;
      if ($('iconPrev')) $('iconPrev').style.display = 'flex';
      if ($('iconPrevI')) $('iconPrevI').className = ic;
      const cat = CATS[($('pcat') ? $('pcat').value : 'default')] || CATS.default;
      if ($('iconPrevDot')) $('iconPrevDot').style.background = cat.grad;
      if ($('iconPrevName')) $('iconPrevName').textContent = ic.split(' ').pop();
    });
    picker.appendChild(d);
  });
}

if ($('clearIcon')) {
  $('clearIcon').addEventListener('click', () => {
    if ($('selIcon')) $('selIcon').value = '';
    if ($('iconPrev')) $('iconPrev').style.display = 'none';
    if ($('iconPicker')) $('iconPicker').querySelectorAll('.icon-pick').forEach(x => x.classList.remove('selected'));
  });
}

/* ══ IMAGE UPLOAD TO CLOUDINARY ══ */
if ($('imgFile')) {
  $('imgFile').addEventListener('change', async () => {
    const file = $('imgFile').files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { toast('Image trop lourde (max 5 Mo).', 'e'); return; }
    if ($('uprog')) $('uprog').style.display = 'block';
    if ($('uprogbar')) $('uprogbar').style.width = '20%';
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_PRESET);
    try {
      if ($('uprogbar')) $('uprogbar').style.width = '50%';
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: 'POST', body: fd });
      if ($('uprogbar')) $('uprogbar').style.width = '90%';
      const data = await res.json();
      if (data.secure_url) {
        if ($('selImgUrl')) $('selImgUrl').value = data.secure_url;
        const prev = $('imgPreview');
        if (prev) {
          prev.src = data.secure_url;
          prev.style.display = 'block';
        }
        if ($('clearImg')) $('clearImg').style.display = 'inline-flex';
        if ($('uprogbar')) $('uprogbar').style.width = '100%';
        toast('Image uploadée avec succès !');
        setTimeout(() => { if ($('uprog')) $('uprog').style.display = 'none'; }, 600);
      } else throw new Error('Upload échoué');
    } catch (e) { toast('Erreur upload image.', 'e'); if ($('uprog')) $('uprog').style.display = 'none'; }
  });
}

if ($('clearImg')) {
  $('clearImg').addEventListener('click', () => {
    if ($('selImgUrl')) $('selImgUrl').value = '';
    if ($('imgFile')) $('imgFile').value = '';
    if ($('imgPreview')) $('imgPreview').style.display = 'none';
    if ($('clearImg')) $('clearImg').style.display = 'none';
  });
}

/* ══ PRODUCT MODAL ══ */
let editId = null;

window.openPM = function(id = null) {
  editId = id;
  buildIconPicker();
  refreshPcatSelect();
  if ($('pmtitle')) $('pmtitle').textContent = id ? 'Modifier le produit' : 'Nouveau produit';
  ['pname', 'punit', 'pnote', 'ptags', 'ppromo'].forEach(f => { if ($(f)) $(f).value = ''; });
  if ($('pdesc')) $('pdesc').value = '';
  if ($('pprice')) $('pprice').value = '';
  if ($('porder')) $('porder').value = '99';
  if ($('pbadge')) $('pbadge').value = '';
  if ($('pwide')) $('pwide').checked = false;
  if ($('pactive')) $('pactive').checked = true;
  if ($('pdeadline')) $('pdeadline').value = '';
  if ($('selIcon')) $('selIcon').value = '';
  if ($('selImgUrl')) $('selImgUrl').value = '';
  if ($('imgPreview')) $('imgPreview').style.display = 'none';
  if ($('clearImg')) $('clearImg').style.display = 'none';
  if ($('iconPrev')) $('iconPrev').style.display = 'none';
  if ($('iconPicker')) $('iconPicker').querySelectorAll('.icon-pick').forEach(x => x.classList.remove('selected'));
  galleryUrls = [];
  renderGalleryGrid();
  if (id && allProducts[id]) {
    const p = allProducts[id];
    if ($('pname')) $('pname').value = p.name || '';
    if ($('pdesc')) $('pdesc').value = p.description || '';
    if ($('pprice')) $('pprice').value = p.price || '';
    if ($('punit')) $('punit').value = p.unit || '';
    if ($('pnote')) $('pnote').value = p.note || '';
    if ($('ptags')) $('ptags').value = (p.tags || []).join(', ');
    if ($('pcat')) $('pcat').value = p.category || 'default';
    if ($('pbadge')) $('pbadge').value = p.badge || '';
    if ($('ppromo')) $('ppromo').value = p.promo || '';
    if ($('porder')) $('porder').value = p.order || 99;
    if ($('pwide')) $('pwide').checked = p.wide || false;
    if ($('pactive')) $('pactive').checked = p.active !== false;
    if (p.promoDeadline && $('pdeadline')) $('pdeadline').value = p.promoDeadline;
    if (p.image) {
      if ($('selImgUrl')) $('selImgUrl').value = p.image;
      if ($('imgPreview')) {
        $('imgPreview').src = p.image;
        $('imgPreview').style.display = 'block';
      }
      if ($('clearImg')) $('clearImg').style.display = 'inline-flex';
    }
    if (p.icon) {
      if ($('selIcon')) $('selIcon').value = p.icon;
      if ($('iconPrev')) $('iconPrev').style.display = 'flex';
      if ($('iconPrevI')) $('iconPrevI').className = p.icon;
      if ($('iconPicker')) $('iconPicker').querySelectorAll('.icon-pick').forEach(x => { if (x.querySelector('i').className === p.icon) x.classList.add('selected'); });
    }
    if (p.gallery && Array.isArray(p.gallery)) {
      p.gallery.forEach(url => { if (url && !galleryUrls.includes(url)) galleryUrls.push(url); });
      renderGalleryGrid();
    }
  }
  if ($('prodmod')) $('prodmod').classList.add('on');
};

window.closePM = function() { if ($('prodmod')) $('prodmod').classList.remove('on'); editId = null; };
if ($('prodmod')) $('prodmod').addEventListener('click', e => { if (e.target === $('prodmod')) closePM(); });

window.saveProduct = async function() {
  const name = $('pname') ? $('pname').value.trim() : '';
  const price = $('pprice') ? $('pprice').value : '';
  const desc = $('pdesc') ? $('pdesc').value.trim() : '';
  if (!name || !price || !desc) { toast('Remplissez les champs obligatoires (*).', 'w'); return; }
  const gallery = getGalleryUrls();
  const data = {
    name, description: desc, price: parseInt(price, 10),
    unit: $('punit') ? $('punit').value.trim() : '',
    note: $('pnote') ? $('pnote').value.trim() : '',
    category: $('pcat') ? $('pcat').value : 'default',
    badge: $('pbadge') ? $('pbadge').value : '',
    promo: $('ppromo') ? $('ppromo').value.trim() : '',
    order: parseInt(($('porder') ? $('porder').value : '99'), 10) || 99,
    wide: $('pwide') ? $('pwide').checked : false,
    active: $('pactive') ? $('pactive').checked : true,
    tags: ($('ptags') && $('ptags').value) ? $('ptags').value.split(',').map(t => t.trim()).filter(Boolean) : [],
    icon: ($('selIcon') ? $('selIcon').value : '') || '',
    image: ($('selImgUrl') ? $('selImgUrl').value : '') || '',
    gallery: gallery.length > 0 ? gallery : null,
    promoDeadline: ($('pdeadline') ? $('pdeadline').value : null) || null
  };
  if ($('savepbtn')) $('savepbtn').innerHTML = '<div class="spin"></div>';
  try {
    if (editId) { await update(ref(db, 'products/' + editId), data); toast('Produit modifié !'); }
    else { await push(ref(db, 'products'), data); toast('Produit ajouté ! 🎉'); }
    closePM();
  } catch (e) { toast('Erreur : ' + e.message, 'e'); }
  if ($('savepbtn')) $('savepbtn').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
};

/* ══ PROMO MODAL ══ */
window.openPromoM = function() {
  if ($('promtitle')) $('promtitle').textContent = 'Nouveau code promo';
  if ($('promid')) $('promid').value = '';
  if ($('promcode')) $('promcode').value = '';
  if ($('promdiscount')) $('promdiscount').value = '';
  if ($('promactive')) $('promactive').checked = true;
  if ($('promomod')) $('promomod').classList.add('on');
};

window.closePromoM = function() { if ($('promomod')) $('promomod').classList.remove('on'); };
if ($('promomod')) $('promomod').addEventListener('click', e => { if (e.target === $('promomod')) closePromoM(); });

window.savePromo = async function() {
  const code = $('promcode') ? $('promcode').value.trim().toUpperCase() : '';
  const disc = $('promdiscount') ? $('promdiscount').value : '';
  if (!code || !disc) { toast('Remplissez tous les champs.', 'w'); return; }
  if (disc < 1 || disc > 100) { toast('Réduction entre 1 et 100%.', 'w'); return; }
  if ($('saveprom')) $('saveprom').innerHTML = '<div class="spin"></div>';
  try {
    await set(ref(db, 'settings/promoCodes/' + code), { discount: parseInt(disc), active: ($('promactive') ? $('promactive').checked : true) });
    toast('Code promo sauvegardé !');
    closePromoM();
  } catch (e) { toast('Erreur.', 'e'); }
  if ($('saveprom')) $('saveprom').innerHTML = '<i class="fas fa-save"></i> Enregistrer';
};

/* ══ TOGGLE PRODUCT ══ */
async function toggleProd(id, cur) {
  await update(ref(db, 'products/' + id), { active: cur === false });
  toast(cur === false ? 'Produit activé.' : 'Produit masqué.', 'i');
}

/* ══ CONFIRM GÉNÉRIQUE ══ */
let confCallback = null;

function confirmAction(title, msg, cb) {
  if ($('confTitle')) $('confTitle').textContent = title;
  if ($('confMsg')) $('confMsg').textContent = msg;
  confCallback = cb;
  if ($('confov')) $('confov').classList.add('on');
}

window.closeConf = () => { if ($('confov')) $('confov').classList.remove('on'); confCallback = null; };
if ($('confyes')) {
  $('confyes').addEventListener('click', async () => {
    if (confCallback) { await confCallback(); confCallback = null; }
    closeConf();
  });
}