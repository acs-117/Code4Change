// ============================================================
// user.js — Logic for user.html
// ============================================================

let userSession = null;
let userMarker = null;
const requestMarkers = {};

// ── Map ──────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
}).addTo(map);
L.control.zoom({ position: 'topright' }).addTo(map);

// ── Cooldown ─────────────────────────────────────────────────
let cooldownInterval = null;

function startCooldownTimer(lastPingTime) {
  if (cooldownInterval) clearInterval(cooldownInterval);

  const btn = document.getElementById('pingActionBtn');
  const info = document.getElementById('statusReport');
  const cooldownMs = 3 * 24 * 60 * 60 * 1000;

  btn.disabled = true;
  if (!info.innerHTML.includes('successfully')) {
    info.innerHTML = "<span style='color:var(--color-warning)'>You can only request a pickup once every 3 days.</span>";
  }

  function updateTimer() {
    const remaining = cooldownMs - (Date.now() - lastPingTime);
    if (remaining <= 0) {
      clearInterval(cooldownInterval);
      btn.disabled = false;
      btn.innerHTML = "⚡ Request Immediate Pickup";
      info.innerHTML = "";
      if (userSession) db.from('users').update({ ping: false }).eq('id', userSession.id);
      localStorage.removeItem('pm_last_ping_' + (userSession?.id || 'anon'));
    } else {
      const s = Math.floor(remaining / 1000);
      const d = Math.floor(s / 86400);
      const h = Math.floor((s % 86400) / 3600).toString().padStart(2, '0');
      const m = Math.floor((s % 3600) / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      btn.innerHTML = `⚡ Ping on Cooldown (${d}d ${h}h ${m}m ${sec}s)`;
    }
  }

  updateTimer();
  cooldownInterval = setInterval(updateTimer, 1000);
}

// ── Toast ────────────────────────────────────────────────────
function showToast(msg, type = "success") {
  const container = document.getElementById("toastContainer");
  if (!container) return;
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === "success" ? "✅" : "❌"}</span> ${msg}`;
  container.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(20px)";
    t.style.transition = "all 0.3s";
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

// ── Counter animation ────────────────────────────────────────
function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target + " XP"; return; }
  const dur = 500, t0 = performance.now();
  const step = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3))) + " XP";
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target + " XP";
  };
  requestAnimationFrame(step);
}

// ── Relative time ────────────────────────────────────────────
function relTime(date) {
  const d = Math.floor((Date.now() - date) / 60000);
  if (d < 1) return "just now";
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

// ── Geolocation helper ───────────────────────────────────────
// function getCurrentPosition() {
//   return new Promise((resolve, reject) => {
//     navigator.geolocation.getCurrentPosition(
//       pos => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
//       reject,
//       { enableHighAccuracy: true, timeout: 8000 }
//     );
//   });
// }

// ── Map marker ───────────────────────────────────────────────
async function updateMapLocation() {
  try {
    const { lat, lng } = await getCurrentPosition();
    if (!userMarker) {
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#4ade80;border:2px solid #fff;box-shadow:0 0 10px rgba(74,222,128,0.6)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        })
      }).addTo(map).bindTooltip("📍 Your Position", { permanent: false });
      map.setView([lat, lng], 14);
    } else {
      userMarker.setLatLng([lat, lng]);
    }
  } catch (err) {
    console.warn("Unable to lock map onto current coordinates:", err);
  }
}

// ── Request markers ──────────────────────────────────────────
function updateRequestMarkers(requests) {
  const activeIds = requests.map(r => r.id);
  for (const id in requestMarkers) {
    if (!activeIds.includes(id)) { map.removeLayer(requestMarkers[id]); delete requestMarkers[id]; }
  }

  requests.forEach(req => {
    const isCollected = req.status === 'collected';
    const color = isCollected ? '#4ade80' : '#fbbf24';
    const border = isCollected ? '#065f46' : '#92400e';
    const shadow = isCollected ? 'rgba(74,222,128,0.4)' : 'rgba(251,191,36,0.4)';

    if (requestMarkers[req.id]) {
      requestMarkers[req.id].setLatLng([req.latitude, req.longitude]);
    } else {
      const icon = L.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;border-radius:50%;background:${color};border:2px solid ${border};box-shadow:0 0 8px ${shadow};cursor:pointer"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6]
      });
      const marker = L.marker([req.latitude, req.longitude], { icon })
        .addTo(map)
        .bindPopup(`<strong style="color:${color}">${isCollected ? 'Collected' : 'Pending Pickup'}</strong><br>${relTime(new Date(req.reported_at))}`);
      requestMarkers[req.id] = marker;
    }
  });
}

// ── Load data ────────────────────────────────────────────────
async function loadPointsAndRequests() {
  if (!userSession) return;

  const { data: profile } = await db.from("users").select("points").eq("id", userSession.id).single();
  if (profile) {
    userSession.points = profile.points;
    document.getElementById('pointsVal').textContent = (profile.points || 0) + " XP";
  }

  const { data: requests, error } = await db
    .from("dashboard")
    .select("id, latitude, longitude, status, reported_at, points_awarded, segregation_type")
    .eq("user_id", userSession.id)
    .order("reported_at", { ascending: false });

  if (!error && requests) {
    document.getElementById('pingsVal').textContent = requests.length;
    renderActivityFeed(requests);
    updateRequestMarkers(requests);
  }
}

// ── Activity feed ────────────────────────────────────────────
function renderActivityFeed(requests) {
  const feed = document.getElementById('activityFeed');
  if (requests.length === 0) {
    feed.innerHTML = `<div style="color:var(--color-text-muted); font-size:0.85rem; text-align:center; padding:1.5rem 0;">No pickup requests sent yet.</div>`;
    return;
  }

  feed.innerHTML = requests.map(req => {
    const timeStr = relTime(new Date(req.reported_at));
    const isCollected = req.status === 'collected';
    const statusColor = isCollected ? 'var(--color-success)' : 'var(--color-warning)';
    const statusText = isCollected ? 'Collected' : 'Pending';
    const details = isCollected
      ? `<div style="font-size:0.75rem; color:var(--color-text-muted); margin-top:0.25rem;">
           Awarded: <strong style="color:var(--color-accent)">+${req.points_awarded || 0} XP</strong> (${req.segregation_type || 'unclassified'})
         </div>`
      : '';

    return `
      <div style="background:rgba(255,255,255,0.02); border:1px solid var(--color-border); border-radius:var(--radius-sm); padding:0.75rem; margin-bottom:0.5rem; display:flex; flex-direction:column; gap:0.2rem;">
        <div style="display:flex; justify-content:space-between; align-items:center; width:100%; gap:0.5rem;">
          <span style="font-size:0.8rem; font-weight:600; flex:1;">📍 Pickup Request</span>
          <span style="font-size:0.7rem; color:var(--color-text-muted);">${timeStr}</span>
        </div>
        <div style="font-family:var(--font-mono); font-size:0.7rem; color:var(--color-text-muted);">
          ${req.latitude.toFixed(5)}, ${req.longitude.toFixed(5)}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:0.4rem; font-size:0.75rem; gap:0.5rem;">
          <span>Status: <strong style="color:${statusColor}">${statusText}</strong></span>
        </div>
        ${details}
      </div>`;
  }).join('');
}

// ── Realtime ─────────────────────────────────────────────────
function setupRealtimeStream() {
  if (!userSession) return;

  db.channel(`public:users:id=eq.${userSession.id}`)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'users', filter: `id=eq.${userSession.id}` },
      (payload) => {
        if (payload.new?.points !== undefined) {
          userSession.points = payload.new.points;
          animateCounter("pointsVal", payload.new.points);
          showToast(`🎉 Points updated! New balance: ${payload.new.points} XP`, "success");
        }
      })
    .subscribe();

  db.channel(`public:dashboard:user_id=eq.${userSession.id}`)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard', filter: `user_id=eq.${userSession.id}` },
      async (payload) => {
        await loadPointsAndRequests();
        if (payload.eventType === 'UPDATE' && payload.new?.status === 'collected') {
          showToast("♻️ Your waste was collected by a worker! Points awarded.", "success");
        }
      })
    .subscribe();
}

// ── Pickup request ───────────────────────────────────────────
async function triggerPickupRequest() {
  const btn = document.getElementById('pingActionBtn');
  const info = document.getElementById('statusReport');
  btn.disabled = true;
  info.innerHTML = "Connecting to GPS and processing signal...";

  try {
    let lat = 12.9716, lng = 77.5946;
    try {
      const pos = await getCurrentPosition();
      lat = pos.lat; lng = pos.lng;
      info.innerHTML = "GPS location locked. Sending pickup request to workers...";
    } catch {
      info.innerHTML = "Using default location. Sending pickup request to workers...";
    }

    const { error } = await db.from("dashboard").insert({
      user_id: userSession.id,
      latitude: lat,
      longitude: lng,
      status: 'pending',
      reported_at: new Date().toISOString()
    });
    if (error) throw error;

    await db.from('users').update({ ping: true }).eq('id', userSession.id);

    const currentPings = parseInt(document.getElementById('pingsVal').textContent) || 0;
    document.getElementById('pingsVal').textContent = currentPings + 1;

    const now = Date.now();
    localStorage.setItem('pm_last_ping_' + (userSession.id || 'anon'), now.toString());

    info.innerHTML = "<span style='color:var(--color-success)'>✓ Ping dispatched successfully! Area workers routed.</span>";
    showToast("Pickup request sent to workers!", "success");
    await loadPointsAndRequests();
    await updateMapLocation();
    startCooldownTimer(now);
  } catch (err) {
    info.innerHTML = `<span style='color:var(--color-error)'>❌ Failed to dispatch: ${err.message}</span>`;
    showToast("Failed to request pickup.", "error");
    btn.disabled = false;
  }
}

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  const { data: { session } } = await db.auth.getSession();
  if (!session) {
    showToast("Not logged in — please sign in first.", "error");
    setTimeout(() => window.location.href = "../login.html", 2000);
    return;
  }

  const { data: profile, error } = await db.from("users")
    .select("id, username, points")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    showToast("User profile not found.", "error");
    setTimeout(() => window.location.href = "../login.html", 2000);
    return;
  }

  userSession = profile;
  document.getElementById('welcomeHeader').innerHTML =
    `User Profile: <span style="color:var(--color-accent)">${profile.username}</span>`;
  document.getElementById('pointsVal').textContent = (profile.points || 0) + " XP";

  // Cooldown check
  let lastPingStr = localStorage.getItem('pm_last_ping_' + (userSession.id || 'anon'));
  let isOnCooldown = false;

  if (lastPingStr) {
    const cooldown = 3 * 24 * 60 * 60 * 1000;
    if (Date.now() - parseInt(lastPingStr) >= cooldown) {
      await db.from('users').update({ ping: false }).eq('id', userSession.id);
      localStorage.removeItem('pm_last_ping_' + (userSession.id || 'anon'));
      lastPingStr = null;
    } else {
      isOnCooldown = true;
    }
  }

  if (!isOnCooldown) {
    try {
      const { data } = await db.from('users').select('ping').eq('id', userSession.id).single();
      if (data?.ping) {
        isOnCooldown = true;
        lastPingStr = Date.now().toString();
        localStorage.setItem('pm_last_ping_' + (userSession.id || 'anon'), lastPingStr);
      }
    } catch (e) { /* ignore */ }
  }

  if (isOnCooldown && lastPingStr) startCooldownTimer(parseInt(lastPingStr));

  await loadPointsAndRequests();
  await updateMapLocation();
  setupRealtimeStream();
}

// ── Event listeners ──────────────────────────────────────────
document.getElementById('pingActionBtn').addEventListener('click', triggerPickupRequest);

document.getElementById('logoutBtn').addEventListener('click', async () => {
  await db.auth.signOut();
  sessionStorage.clear();
  window.location.href = "../login.html";
});

boot();
