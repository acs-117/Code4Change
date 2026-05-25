/* ============================================================
   supabase-config.js — Plastic Mitra
   Single place to set your Supabase credentials.
   Import this file in every page BEFORE any other JS.
   ============================================================ */

// ── PUT YOUR KEYS HERE ──────────────────────────────────────
const SUPABASE_URL = 'https://wzdroididrergcjiwoty.supabase.co'
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZHJvaWRpZHJlcmdjaml3b3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTQzNDMsImV4cCI6MjA5NTI3MDM0M30.tvOulsFaLx9-9T-NDyoD0_hOqJL7IRpKNpTUdL48jWU'
// ────────────────────────────────────────────────────────────

const { createClient } = supabase
const db = createClient(SUPABASE_URL, SUPABASE_ANON)


// ── SHARED HELPERS ───────────────────────────────────────────

/** Show a status message inside an element */
function showStatus(elementId, message, type) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.textContent = message
  el.className = 'status-msg ' + type   // 'error' | 'success'
}

/** Hide / clear a status message */
function clearStatus(elementId) {
  const el = document.getElementById(elementId)
  if (!el) return
  el.textContent = ''
  el.className = 'status-msg'
}

/** Toggle loading state on a submit button */
function setLoading(buttonId, on, idleLabel = 'Submit') {
  const btn = document.getElementById(buttonId)
  if (!btn) return
  btn.disabled = on
  btn.innerHTML = on
    ? '<span class="spinner"></span>Please wait…'
    : idleLabel
}

/** Get current GPS position — returns { lat, lng } or throws */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser.'))
      return
    }
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      err => reject(new Error('Could not get location. Please allow location access.'))
    )
  })
}
