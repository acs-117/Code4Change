/* ============================================================
   login.js — Plastic Mitra
   Handles role toggle, form submission, Supabase auth.
   Requires: supabase-config.js loaded before this file.
   ============================================================ */

let currentRole = 'user'

/* ── ROLE TOGGLE ─────────────────────────────────────────── */
function setRole(role) {
  currentRole = role
  document.getElementById('btn-user').classList.toggle('active', role === 'user')
  document.getElementById('btn-worker').classList.toggle('active', role === 'worker')
  clearStatus('status-msg')
}

/* ── LOGIN HANDLER ───────────────────────────────────────── */
async function handleLogin(e) {
  e.preventDefault()
  clearStatus('status-msg')

  const username = document.getElementById('username').value.trim()
  const email = document.getElementById('email').value.trim()
  const password = document.getElementById('password').value

  if (!username || !email || !password) {
    showStatus('status-msg', 'Please fill in all fields.', 'error')
    return
  }

  setLoading('submit-btn', true, 'Sign in')

  try {
    // Step 1: Verify username exists in the right table
    const table = currentRole === 'worker' ? 'workers' : 'users'

    const { data: profile, error: lookupErr } = await db
      .from(table)
      .select('id')
      .eq('username', username)
      .single()

    if (lookupErr || !profile) {
      showStatus('status-msg', 'Username not found. Check your role selection.', 'error')
      setLoading('submit-btn', false, 'Sign in')
      return
    }

    // Step 2: Sign in via Supabase Auth
    const { data: authData, error: authErr } = await db.auth.signInWithPassword({
      email: email,
      password
    })

    if (authErr) {
      showStatus('status-msg', 'Incorrect email or password.', 'error')
      setLoading('submit-btn', false, 'Sign in')
      return
    }

    // Step 3: Save session context and redirect
    sessionStorage.setItem('pm_role', currentRole)
    sessionStorage.setItem('pm_user_id', authData.user.id)
    sessionStorage.setItem('pm_username', username)

    showStatus('status-msg', 'Signed in! Redirecting…', 'success')

    setTimeout(() => {
      window.location.href = 'dashboard.html'
    }, 800)

  } catch (err) {
    showStatus('status-msg', 'Unexpected error. Please try again.', 'error')
    console.error('[login]', err)
    setLoading('submit-btn', false, 'Sign in')
  }
}

/* ── AUTO-REDIRECT IF ALREADY LOGGED IN ─────────────────── */
// ; (async () => {
//   const { data: { session } } = await db.auth.getSession()

//   if (session) {
//     window.location.href = 'dashboard.html'
//   }
// })()