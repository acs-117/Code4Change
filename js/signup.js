let currentTab = 'user';
let capturedLat = null;
let capturedLng = null;

function setTab(tab) {
  currentTab = tab;
  document.getElementById('tab-user').classList.toggle('active', tab === 'user');
  document.getElementById('tab-worker').classList.toggle('active', tab === 'worker');
  document.getElementById('panel-user').classList.toggle('active', tab === 'user');
  document.getElementById('panel-worker').classList.toggle('active', tab === 'worker');
  clearStatus('status-msg');
  capturedLat = null; capturedLng = null;
  resetLocationBtn();
}

function resetLocationBtn() {
  const btn = document.getElementById('location-btn');
  if (!btn) return;
  btn.className = 'btn-location';
  btn.innerHTML = `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke-dasharray="3 3"/></svg> Add current location`;
}

async function captureLocation() {
  const btn = document.getElementById('location-btn');
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Syncing GPS coordinates...`;
  try {
    const { lat, lng } = await getCurrentPosition();
    capturedLat = lat; capturedLng = lng;
    btn.className = 'btn-location located';
    btn.innerHTML = `✓ Core Location Locked (${lat.toFixed(2)}, ${lng.toFixed(2)})`;
    btn.disabled = false;
  } catch (err) {
    btn.disabled = false;
    resetLocationBtn();
    showStatus('status-msg', err.message, 'error');
  }
}

async function handleSignup(e) {
  e.preventDefault();
  clearStatus('status-msg');

  const isUser = currentTab === 'user';
  const prefix = isUser ? 'u' : 'w';

  const username = document.getElementById(prefix + '-username').value.trim();
  const email = document.getElementById(prefix + '-email').value.trim();
  const password = document.getElementById(prefix + '-password').value;
  const confirm = document.getElementById(prefix + '-confirm').value;

  if (!username || !email || !password || !confirm) {
    showStatus('status-msg', 'Please complete all required fields.', 'error');
    return;
  }
  if (password !== confirm) {
    showStatus('status-msg', 'Passwords fields mismatch.', 'error');
    return;
  }
  if (isUser && capturedLat === null) {
    showStatus('status-msg', 'Geographic tracking point position missing.', 'error');
    return;
  }

  setLoading('submit-btn', true, 'Create account');

  try {
    const table = isUser ? 'users' : 'workers';
    const { data: taking } = await db.from(table).select('id').eq('username', username).maybeSingle();

    if (taking) {
      showStatus('status-msg', 'Username already locked by another account instance.', 'error');
      setLoading('submit-btn', false, 'Create account');
      return;
    }

    const { data: authData, error: authErr } = await db.auth.signUp({ email, password });
    if (authErr) { showStatus('status-msg', authErr.message, 'error'); setLoading('submit-btn', false, 'Create account'); return; }

    const profileData = isUser ? { id: authData.user.id, username, email, latitude: capturedLat, longitude: capturedLng, points: 0 } : { id: authData.user.id, username, email, total_collections: 0, points: 0 };
    const { error: insErr } = await db.from(table).insert(profileData);

    if (insErr) { showStatus('status-msg', 'DB Profile provisioning fault.', 'error'); setLoading('submit-btn', false); return; }

    sessionStorage.setItem('pm_role', currentTab);
    sessionStorage.setItem('pm_user_id', authData.user.id);
    sessionStorage.setItem('pm_username', username);

    showStatus('status-msg', 'Profile allocated! Entering console...', 'success');
    setTimeout(() => { window.location.href = isUser ? 'user.html' : 'workers.html'; }, 900);
  } catch (err) {
    setLoading('submit-btn', false, 'Create account');
  }
}