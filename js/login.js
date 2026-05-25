let currentRole = 'user';

function setRole(role) {
  currentRole = role;
  document.getElementById('btn-user').classList.toggle('active', role === 'user');
  document.getElementById('btn-worker').classList.toggle('active', role === 'worker');
  clearStatus('status-msg');
}

async function handleLogin(e) {
  e.preventDefault();
  clearStatus('status-msg');

  const username = document.getElementById('username').value.trim();
  const email = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !email || !password) {
    showStatus('status-msg', 'Please fill in all fields.', 'error');
    return;
  }

  setLoading('submit-btn', true, 'Sign in');

  try {
    const table = currentRole === 'worker' ? 'workers' : 'users';
    const { data: profile, error: lookupErr } = await db.from(table).select('id').eq('username', username).single();

    if (lookupErr || !profile) {
      showStatus('status-msg', 'Username not matching selected profile type role.', 'error');
      setLoading('submit-btn', false, 'Sign in');
      return;
    }

    const { data: authData, error: authErr } = await db.auth.signInWithPassword({ email, password });
    if (authErr) {
      showStatus('status-msg', 'Authentication challenge rejected: bad credentials.', 'error');
      setLoading('submit-btn', false, 'Sign in');
      return;
    }

    sessionStorage.setItem('pm_role', currentRole);
    sessionStorage.setItem('pm_user_id', authData.user.id);
    sessionStorage.setItem('pm_username', username);

    showStatus('status-msg', 'Identity confirmed! Redirecting…', 'success');
    setTimeout(() => {
      window.location.href = currentRole === 'worker' ? 'pages/workers.html' : 'pages/user.html';
    }, 800);

  } catch (err) {
    showStatus('status-msg', 'System connection timeout error.', 'error');
    setLoading('submit-btn', false, 'Sign in');
  }
}