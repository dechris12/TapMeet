/* ------------------------------
   FIREBASE CONFIG
   ------------------------------ */
const firebaseConfig = {
  apiKey: "AIzaSyBH6Vj9ntsOqu2tXFhw2PBKyjR-zu_V7b0",
  authDomain: "justanoobcommunity.firebaseapp.com",
  projectId: "justanoobcommunity",
  storageBucket: "justanoobcommunity.firebasestorage.app",
  messagingSenderId: "973033453399",
  appId: "1:973033453399:web:3ae1ee2f36c3ea1d76f012",
  measurementId: "G-ZGRJ3HN3BR"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

/* ------------------------------
   Small helpers
   ------------------------------ */
function showLoading(text) {
  const el = document.getElementById('loadingText');
  if (el) el.innerText = text || 'Please wait...';
  document.getElementById('loadingPopup').style.display = 'flex';
}
function hideLoading() {
  const lp = document.getElementById('loadingPopup');
  if (lp) lp.style.display = 'none';
}
function showFeedback(id, msg, ok = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerText = msg;
  el.classList.remove('error', 'success');
  el.classList.add(ok ? 'success' : 'error');
}

/* ------------------------------
   Page Navigation
   ------------------------------ */
function setNavActive(id) {
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) el.classList.add('active');
}
function showPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById(name);
  if (el) el.classList.add('active');
  setNavActive(`nav_${name}`);
  if (name === 'explore') loadProfiles();
}

/* ------------------------------
   Theme Toggle
   ------------------------------ */
function toggleMode() {
  document.body.classList.toggle('light');
}

/* ------------------------------
   Remember Me
   ------------------------------ */
function saveRemember(email, pass) {
  localStorage.setItem('tapmeet_remember', JSON.stringify({ email, pass }));
}
function loadRemember() {
  try { return JSON.parse(localStorage.getItem('tapmeet_remember')); }
  catch { return null; }
}
function prefillFromRemember() {
  const r = loadRemember();
  if (r) {
    document.getElementById('li_email').value = r.email;
    document.getElementById('li_password').value = r.pass;
    showFeedback('login_feedback', 'Credentials filled from Remember Me', true);
  } else showFeedback('login_feedback', 'No saved credentials.', false);
}

/* ------------------------------
   Tabs
   ------------------------------ */
let currentTab = 'near';
function setTab(name) {
  currentTab = name;
  document.getElementById('tab_ne').classList.toggle('active', name === 'near');
  document.getElementById('tab_all').classList.toggle('active', name === 'all');
  loadProfiles();
}

/* ------------------------------
   SIGNUP (Firestore)
   ------------------------------ */
async function signup() {
  const agree = document.getElementById('agree_warn').checked;
  if (!agree) return showFeedback('signup_feedback', 'Please agree to safety warning.', false);

  const data = {
    name: document.getElementById('su_name').value.trim(),
    age: document.getElementById('su_age').value.trim(),
    height: document.getElementById('su_height').value.trim(),
    blood: document.getElementById('su_blood').value.trim(),
    genotype: document.getElementById('su_genotype').value.trim(),
    location: document.getElementById('su_location').value.trim(),
    desc: document.getElementById('su_desc').value.trim(),
    telegram: document.getElementById('su_telegram').value.trim(),
    whatsapp: document.getElementById('su_whatsapp').value.trim(),
    email: document.getElementById('su_email').value.trim(),
    password: document.getElementById('su_password').value,
    photo: document.getElementById('su_photo_url').value.trim(),
    createdAt: new Date().toISOString()
  };

  if (!data.name || !data.email || !data.password)
    return showFeedback('signup_feedback', 'Name, email & password required.', false);

  showLoading('🚀 Creating account...');

  try {
    const existing = await db.collection('users').where('email', '==', data.email).get();
    if (!existing.empty) {
      hideLoading();
      return showFeedback('signup_feedback', 'Email already exists.', false);
    }

    await db.collection('users').add(data);
    hideLoading();
    showFeedback('signup_feedback', '✅ Signup successful! Please login.', true);
    document.getElementById('li_email').value = data.email;
    showPage('login');
  } catch (err) {
    hideLoading();
    showFeedback('signup_feedback', '❌ Error: ' + err.message, false);
  }
}

/* ------------------------------
   LOGIN (Firestore)
   ------------------------------ */
async function login() {
  const email = document.getElementById('li_email').value.trim();
  const password = document.getElementById('li_password').value;
  const remember = document.getElementById('remember_me').checked;
  if (!email || !password) return showFeedback('login_feedback', 'Enter email & password.', false);

  showLoading('🔐 Signing in...');
  try {
    const snapshot = await db.collection('users')
      .where('email', '==', email)
      .where('password', '==', password)
      .get();

    hideLoading();

    if (snapshot.empty) return showFeedback('login_feedback', 'Invalid email or password.', false);

    const user = snapshot.docs[0].data();
    localStorage.setItem('tapmeet_user', JSON.stringify(user));
    if (remember) saveRemember(email, password); else localStorage.removeItem('tapmeet_remember');
    showFeedback('login_feedback', '✅ Welcome, ' + user.name, true);
    showPage('explore');
  } catch (err) {
    hideLoading();
    showFeedback('login_feedback', '❌ Error: ' + err.message, false);
  }
}

/* ------------------------------
   LOAD PROFILES (Firestore)
   ------------------------------ */
async function loadProfiles() {
  showLoading('🔎 Loading profiles...');
  try {
    const snap = await db.collection('users').get();
    hideLoading();
    const users = snap.docs.map(doc => doc.data());
    renderProfiles(users);
  } catch (err) {
    hideLoading();
    document.getElementById('profiles').innerHTML = '<div class="error">Error loading profiles: ' + err.message + '</div>';
  }
}

/* ------------------------------
   Render Profiles
   ------------------------------ */
function renderProfiles(users) {
  const container = document.getElementById('profiles');
  container.innerHTML = '';
  if (!users.length) return container.innerHTML = '<div class="small-muted">No users found.</div>';

  const loggedIn = !!localStorage.getItem('tapmeet_user');
  users.forEach(u => {
    const el = document.createElement('div');
    el.className = 'profile';
    const imgSrc = u.photo || '';
    const imgHtml = imgSrc ? `<div class="imgwrap"><img src="${escapeHtml(imgSrc)}"></div>`
      : `<div class="imgwrap"><div style="color:var(--muted);padding:12px">No photo</div></div>`;
    const genotype = u.genotype || u.blood || 'N/A';

    el.innerHTML = `
      ${imgHtml}
      <h3>${escapeHtml(u.name || 'Unnamed')} ${u.age ? ', ' + escapeHtml(u.age) : ''}</h3>
      <p>${loggedIn ? `Genotype: ${escapeHtml(genotype)} • Height: ${escapeHtml(u.height || 'N/A')}` : ''}</p>
      <p class="small-muted">${escapeHtml(u.location || '')}</p>
      ${loggedIn ? `<p>${escapeHtml(u.desc || '')}</p>
        <p>Telegram: ${escapeHtml(u.telegram || '—')}</p>
        <p>Contact: ${escapeHtml(u.whatsapp || '—')}</p>`
        : `<p class="small-muted">Login to see more details.</p>`}
    `;
    if (!loggedIn) {
      const imgEl = el.querySelector('img');
      if (imgEl) imgEl.style.filter = 'blur(6px)';
    }
    container.appendChild(el);
  });
}

/* ------------------------------
   Misc Utils
   ------------------------------ */
function escapeHtml(str) {
  if (!str && str !== 0) return '';
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}
function clearSignup() {
  ['su_name', 'su_age', 'su_height', 'su_blood', 'su_genotype', 'su_location', 'su_desc',
   'su_telegram', 'su_whatsapp', 'su_email', 'su_password', 'su_photo_url']
   .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('agree_warn').checked = false;
  showFeedback('signup_feedback', 'Cleared.', true);
}

/* ------------------------------
   PWA + Initial load
   ------------------------------ */
let deferredPrompt;
function hideInitialLoading() {
  const el = document.getElementById('initialLoading');
  if (!el) return;
  el.style.opacity = '0';
  setTimeout(() => el.style.display = 'none', 500);
}

document.addEventListener('DOMContentLoaded', () => {
  const progressBar = document.getElementById('progressBar');
  setTimeout(() => { if (progressBar) progressBar.style.width = '100%'; }, 50);
  setTimeout(hideInitialLoading, 3000);

  hideLoading();
  const rem = loadRemember();
  if (rem) {
    document.getElementById('li_email').value = rem.email;
    document.getElementById('li_password').value = rem.pass;
    document.getElementById('remember_me').checked = true;
  }
  setNavActive('nav_home');

  document.getElementById('nav_home').addEventListener('click', () => showPage('home'));
  document.getElementById('nav_signup').addEventListener('click', () => showPage('signup'));
  document.getElementById('nav_login').addEventListener('click', () => showPage('login'));
  document.getElementById('nav_explore').addEventListener('click', () => showPage('explore'));

  document.getElementById('home_signup_btn').addEventListener('click', () => showPage('signup'));
  document.getElementById('home_browse_btn').addEventListener('click', () => showPage('explore'));
  document.getElementById('home_account_btn').addEventListener('click', () => showPage('login'));

  document.getElementById('signupBtn').addEventListener('click', signup);
  document.getElementById('clearSignupBtn').addEventListener('click', clearSignup);
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('prefillBtn').addEventListener('click', prefillFromRemember);

  document.getElementById('tab_ne').addEventListener('click', () => setTab('near'));
  document.getElementById('tab_all').addEventListener('click', () => setTab('all'));
  document.getElementById('toggleModeBtn').addEventListener('click', toggleMode);

  const installBtn = document.getElementById('installBtn');
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (installBtn) installBtn.style.display = 'inline-flex';
  });
  if (installBtn) {
    installBtn.addEventListener('click', async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') installBtn.style.display = 'none';
      deferredPrompt = null;
    });
  }
});
