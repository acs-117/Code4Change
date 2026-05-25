/* ============================================================
   signup.js — Plastic Mitra
   Handles tab switching, location capture, form submission.
   Requires: supabase-config.js loaded before this file.
   ============================================================ */

let currentTab = 'user'
let capturedLat = null
let capturedLng = null

/* ── TAB SWITCHING ───────────────────────────────────────── */
function setTab(tab) {
  currentTab = tab

  // Toggle tab buttons
  document.getElementById('tab-user').classList.toggle('active', tab === 'user')
  document.getElementById('tab-worker').classList.toggle('active', tab === 'worker')

  // Toggle panels
  document.getElementById('panel-user').classList.toggle('active', tab === 'user')
  document.getElementById('panel-worker').classList.toggle('active', tab === 'worker')

  // Reset status
  clearStatus('status-msg')

  // Reset location state when switching tabs
  capturedLat = null
  capturedLng = null
  resetLocationBtn()
}

/* ── LOCATION CAPTURE ────────────────────────────────────── */
function resetLocationBtn() {
  const btn = document.getElementById('location-btn')

  if (!btn) return

  btn.className = 'btn-location'

  btn.innerHTML = `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3"/>
      <path d="M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2z" stroke-dasharray="3 3"/>
    </svg>
    Add current location
  `
}

async function captureLocation() {
  const btn = document.getElementById('location-btn')

  btn.disabled = true

  btn.innerHTML = `
    <span class="spinner"
      style="border-top-color:var(--color-accent);
      border-color:var(--color-border)">
    </span> Getting location…
  `

  try {
    const { lat, lng } = await getCurrentPosition()

    capturedLat = lat
    capturedLng = lng

    btn.className = 'btn-location located'

    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <polyline points="20 6 9 17 4 12"/>
      </svg>
      Location saved (${lat.toFixed(4)}, ${lng.toFixed(4)})
    `

    btn.disabled = false

  } catch (err) {
    btn.disabled = false
    resetLocationBtn()
    showStatus('status-msg', err.message, 'error')
  }
}

/* ── SIGNUP HANDLER ──────────────────────────────────────── */
async function handleSignup(e) {
  e.preventDefault()

  clearStatus('status-msg')

  // Read fields based on active tab
  const isUser = currentTab === 'user'
  const prefix = isUser ? 'u' : 'w'

  const username = document.getElementById(prefix + '-username').value.trim()
  const email = document.getElementById(prefix + '-email').value.trim()
  const password = document.getElementById(prefix + '-password').value
  const confirm = document.getElementById(prefix + '-confirm').value

  // Validation
  if (!username || !email || !password || !confirm) {
    showStatus('status-msg', 'Please fill in all fields.', 'error')
    return
  }

  if (password !== confirm) {
    showStatus('status-msg', 'Passwords do not match.', 'error')
    return
  }

  if (password.length < 6) {
    showStatus('status-msg', 'Password must be at least 6 characters.', 'error')
    return
  }

  if (isUser && (capturedLat === null || capturedLng === null)) {
    showStatus('status-msg', 'Please add your current location before signing up.', 'error')
    return
  }

  setLoading('submit-btn', true, 'Create account')

  try {
    // Step 1: Check username is not already taken
    const table = isUser ? 'users' : 'workers'

    const { data: existing } = await db
      .from(table)
      .select('id')
      .eq('username', username)
      .maybeSingle()

    if (existing) {
      showStatus('status-msg', 'Username already taken. Choose another.', 'error')
      setLoading('submit-btn', false, 'Create account')
      return
    }

    // Step 2: Create Supabase Auth account
    const { data: authData, error: authErr } = await db.auth.signUp({
      email: email,
      password
    })

    if (authErr) {
      showStatus('status-msg', authErr.message, 'error')
      setLoading('submit-btn', false, 'Create account')
      return
    }

    const userId = authData.user.id

    // Step 3: Insert profile row into correct table
    let insertError

    if (isUser) {
      const { error } = await db.from('users').insert({
        id: userId,
        username: username,
        email: email,
        latitude: capturedLat,
        longitude: capturedLng,
        points: 0
      })

      insertError = error

    } else {

      const { error } = await db.from('workers').insert({
        id: userId,
        username: username,
        email: email,
        total_collections: 0,
        points: 0
      })

      insertError = error
    }

    if (insertError) {
      showStatus(
        'status-msg',
        'Account created but profile save failed: ' + insertError.message,
        'error'
      )

      setLoading('submit-btn', false, 'Create account')
      return
    }

    // Step 4: Save session and redirect
    sessionStorage.setItem('pm_role', currentTab)
    sessionStorage.setItem('pm_user_id', userId)
    sessionStorage.setItem('pm_username', username)

    showStatus('status-msg', 'Account created! Redirecting…', 'success')

    setTimeout(() => {
      window.location.href = 'dashboard.html'
    }, 900)

  } catch (err) {
    showStatus('status-msg', 'Unexpected error. Please try again.', 'error')
    console.error('[signup]', err)
    setLoading('submit-btn', false, 'Create account')
  }
}

/* ── AUTO-REDIRECT IF ALREADY LOGGED IN ─────────────────── */
// ; (async () => {
//   const { data: { session } } = await db.auth.getSession()

//   if (session) {
//     window.location.href = 'dashboard.html'
//   }
// })()