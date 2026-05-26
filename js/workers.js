// ============================================================
// workers.js — Logic for workers.html
// ============================================================

const SUPABASE_URL = "https://wzdroididrergcjiwoty.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZHJvaWRpZHJlcmdjaml3b3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTQzNDMsImV4cCI6MjA5NTI3MDM0M30.tvOulsFaLx9-9T-NDyoD0_hOqJL7IRpKNpTUdL48jWU";
const sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let workerSession = null;
let pendingJobs = [];
let activeJobId = null;
let selectedFile = null;
let selectedWasteType = null;
let segregatedCount = 0;
let mixedCount = 0;
let workerLocation = null;
let routingControl = null;
const mapMarkers = {};

// ── Map ───────────────────────────────────────────────────────
const map = L.map('map', { zoomControl: false }).setView([20.5937, 78.9629], 5);
L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
  attribution: '&copy; OpenStreetMap &copy; CARTO', maxZoom: 19
}).addTo(map);
L.control.zoom({ position: 'topright' }).addTo(map);

// Worker GPS tracking
if (navigator.geolocation) {
  navigator.geolocation.watchPosition(async (pos) => {
    workerLocation = [pos.coords.latitude, pos.coords.longitude];

    if (!window.workerMarker) {
      window.workerMarker = L.marker(workerLocation, {
        icon: L.divIcon({
          className: '',
          html: `<div style="width:14px;height:14px;border-radius:50%;background:#4ade80;border:2px solid #fff;box-shadow:0 0 10px rgba(74,222,128,0.6)"></div>`,
          iconSize: [14, 14], iconAnchor: [7, 7]
        })
      }).addTo(map).bindTooltip("📍 Your Position", { permanent: false });
      map.setView(workerLocation, 13);
    } else {
      window.workerMarker.setLatLng(workerLocation);
    }

    if (workerSession) {
      await sb.from("workers").update({
        current_lat: pos.coords.latitude,
        current_lng: pos.coords.longitude
      }).eq("id", workerSession.id);
    }
  }, () => {
    showToast("Field localization failed. Route tracing disabled.", "warn");
  }, { enableHighAccuracy: true, timeout: 10000 });
}

// ── Map markers ───────────────────────────────────────────────
function addMapMarker(job) {
  if (mapMarkers[job.id]) return;
  const icon = L.divIcon({
    className: '',
    html: `<div style="width:13px;height:13px;border-radius:50%;background:var(--color-warning, #fbbf24);border:2px solid #92400e;box-shadow:0 0 8px rgba(251,191,36,0.5);cursor:pointer"></div>`,
    iconSize: [13, 13], iconAnchor: [6, 6]
  });
  const marker = L.marker([job.lat, job.lng], { icon }).addTo(map);
  marker.bindPopup(`
    <span class="map-popup-title">♻️ Waste Report</span>
    <span class="map-popup-sub">By @${job.username}<br>${job.lat.toFixed(4)}, ${job.lng.toFixed(4)}</span>
    <button class="map-popup-btn" style="margin-bottom:5px;background:#3b82f6;color:#fff;" onclick="calculateRoute(${job.lat}, ${job.lng})">🧭 Trace Route</button>
    <button class="map-popup-btn" onclick="openModal('${job.id}')">📸 Collect</button>`);
  mapMarkers[job.id] = marker;
}

function removeMapMarker(jobId) {
  if (mapMarkers[jobId]) { map.removeLayer(mapMarkers[jobId]); delete mapMarkers[jobId]; }
  if (routingControl) { map.removeControl(routingControl); routingControl = null; }
}

// ── Routing ───────────────────────────────────────────────────
function calculateRoute(targetLat, targetLng) {
  if (!workerLocation) { showToast("Waiting on high-precision GPS lock...", "warn"); return; }
  if (routingControl) { map.removeControl(routingControl); }

  showToast("Tracing best tactical transit paths...", "success");

  routingControl = L.Routing.control({
    waypoints: [L.latLng(workerLocation[0], workerLocation[1]), L.latLng(targetLat, targetLng)],
    router: L.Routing.osrmv1({ serviceUrl: 'https://router.project-osrm.org/route/v1' }),
    lineOptions: { styles: [{ color: '#4ade80', opacity: 0.85, weight: 5 }] },
    createMarker: () => null,
    addWaypoints: false,
    draggableWaypoints: false,
    fitSelectedRoutes: true
  }).addTo(map);

  routingControl.on('routesfound', (e) => {
    const s = e.routes[0].summary;
    showToast(`Route traced: ${(s.totalDistance / 1000).toFixed(2)} km (~${Math.round(s.totalTime / 60)} mins)`, "success");
  });
}

// ── Utils ─────────────────────────────────────────────────────
function relTime(date) {
  const d = Math.floor((Date.now() - date) / 60000);
  if (d < 1) return "just now";
  if (d < 60) return `${d}m ago`;
  if (d < 1440) return `${Math.floor(d / 60)}h ago`;
  return `${Math.floor(d / 1440)}d ago`;
}

function showToast(msg, type = "success") {
  const t = document.createElement("div");
  t.className = `toast toast-${type}`;
  t.innerHTML = `<span>${type === "success" ? "✅" : type === "warn" ? "⚠️" : "❌"}</span> ${msg}`;
  document.getElementById("toastContainer").appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(20px)";
    t.style.transition = "all 0.3s";
    setTimeout(() => t.remove(), 300);
  }, 3500);
}

function animateCounter(id, target) {
  const el = document.getElementById(id);
  if (!el) return;
  const start = parseInt(el.textContent) || 0;
  if (start === target) { el.textContent = target; return; }
  const dur = 500, t0 = performance.now();
  const step = now => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(start + (target - start) * (1 - Math.pow(1 - p, 3)));
    if (p < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

// ── Queue ─────────────────────────────────────────────────────
async function loadQueue() {
  const { data, error } = await sb
    .from("dashboard")
    .select("id, user_id, latitude, longitude, reported_at, assigned_worker_id, users(username)")
    .eq("status", "pending")
    .or(`assigned_worker_id.is.null,assigned_worker_id.eq.${workerSession.id}`)
    .order("reported_at", { ascending: true });

  if (error) { showToast("Failed to load queue: " + error.message, "error"); return; }

  pendingJobs = (data || []).map(r => ({
    id: r.id,
    userId: r.user_id,
    username: r.users?.username || "Mitra_User",
    lat: r.latitude,
    lng: r.longitude,
    reportedAt: r.reported_at
  }));

  renderQueue();
  pendingJobs.forEach(addMapMarker);
}

function renderQueue() {
  const container = document.getElementById("jobQueue");
  document.getElementById("queueBadge").textContent = pendingJobs.length;
  const pendingEl = document.getElementById("wPending");
  if (pendingEl) pendingEl.textContent = pendingJobs.length;

  if (pendingJobs.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">✅</span>All tasks complete — great work!</div>`;
    return;
  }

  container.innerHTML = "";
  pendingJobs.forEach((job, i) => {
    const card = document.createElement("div");
    card.className = "job-card";
    card.id = `jcard-${job.id}`;
    card.style.animationDelay = `${i * 0.05}s`;
    card.innerHTML = `
      <div class="job-card-header">
        <span class="job-card-reporter">@${job.username}</span>
        <span class="job-card-time">${relTime(new Date(job.reportedAt))}</span>
      </div>
      <div class="job-card-coords">${job.lat.toFixed(5)}, ${job.lng.toFixed(5)}</div>
      <div class="job-card-footer">
        <button class="btn-nav"     onclick="panToJob('${job.id}')">🧭 View</button>
        <button class="btn-route"   onclick="calculateRoute(${job.lat}, ${job.lng})">🗺 Route</button>
        <button class="btn-collect" onclick="openModal('${job.id}')">📸 Collect</button>
      </div>`;
    container.appendChild(card);
  });
}

function panToJob(jobId) {
  const job = pendingJobs.find(j => j.id === jobId);
  if (!job) return;
  map.setView([job.lat, job.lng], 15);
  if (mapMarkers[jobId]) mapMarkers[jobId].openPopup();
  document.querySelectorAll(".job-card").forEach(c => c.style.borderColor = "");
  const card = document.getElementById(`jcard-${jobId}`);
  if (card) { card.style.borderColor = "var(--color-accent)"; card.scrollIntoView({ behavior: "smooth", block: "nearest" }); }
}

// ── History ───────────────────────────────────────────────────
async function loadHistory() {
  const { data, error } = await sb
    .from("dashboard")
    .select("latitude, longitude, collected_at, points_awarded, segregation_type")
    .eq("collected_by", workerSession.id)
    .eq("status", "collected")
    .order("collected_at", { ascending: false })
    .limit(20);

  if (error || !data) return;

  segregatedCount = data.filter(h => h.segregation_type === "segregated").length;
  mixedCount = data.filter(h => h.segregation_type === "mixed").length;
  animateCounter("wSegregated", segregatedCount);
  animateCounter("wMixed", mixedCount);
  renderHistory(data);
}

function renderHistory(rows) {
  const container = document.getElementById("pointsLog");
  document.getElementById("historyBadge").textContent = rows.length;

  if (rows.length === 0) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">📊</span>Collect waste to start earning points</div>`;
    return;
  }

  container.innerHTML = rows.map(h => {
    const icon = h.segregation_type === "segregated" ? "♻️" : "🔀";
    const color = h.segregation_type === "segregated" ? "var(--color-segregated)" : "var(--color-mixed)";
    return `
      <div class="points-log-item">
        <div class="points-log-left">
          <span class="points-log-amount">+${h.points_awarded} pts</span>
          <span class="points-log-desc">${icon} ${h.latitude.toFixed(3)}, ${h.longitude.toFixed(3)} · <span style="color:${color}">${h.segregation_type || "—"}</span></span>
        </div>
        <span class="points-log-time">${relTime(new Date(h.collected_at))}</span>
      </div>`;
  }).join("");
}

// ── Modal ─────────────────────────────────────────────────────
function openModal(jobId) {
  const job = pendingJobs.find(j => j.id === jobId);
  if (!job) return;
  activeJobId = jobId;
  selectedFile = null;
  selectedWasteType = null;
  map.closePopup();

  document.getElementById("modalContainer").innerHTML = `
    <div class="modal-overlay" id="modalOverlay" onclick="handleOverlayClick(event)">
      <div class="camera-modal" onclick="event.stopPropagation()">
        <div class="camera-modal-header">
          <h3>📸 Collect Waste</h3>
          <button class="camera-modal-close" onclick="closeModal()">✕</button>
        </div>
        <div class="camera-modal-body">
          <div class="modal-job-info">
            📍 @${job.username} · ${job.lat.toFixed(5)}, ${job.lng.toFixed(5)} · ${relTime(new Date(job.reportedAt))}
          </div>
          <div class="camera-capture-zone" id="captureZone" onclick="triggerCamera()">
            <div class="camera-capture-icon">📷</div>
            <div class="camera-capture-label">Tap to take a photo</div>
            <div class="camera-capture-sub">Photograph the collected waste</div>
          </div>
          <input type="file" accept="image/*" capture="environment" class="camera-input" id="cameraInput" onchange="handlePhoto(event)">
          <div id="classifyRow" style="display:none;"></div>
        </div>
        <div class="camera-modal-footer">
          <button class="btn-secondary" onclick="closeModal()">Cancel</button>
          <button class="btn-primary" id="confirmBtn" disabled onclick="confirmCollection()">
            Confirm & Award Points
          </button>
        </div>
      </div>
    </div>`;
}

function closeModal() {
  const overlay = document.getElementById("modalOverlay");
  if (overlay) {
    overlay.style.animation = "fadeIn 0.15s ease reverse forwards";
    setTimeout(() => { document.getElementById("modalContainer").innerHTML = ""; }, 150);
  }
  activeJobId = null;
  selectedFile = null;
  selectedWasteType = null;
}

function handleOverlayClick(e) { if (e.target.id === "modalOverlay") closeModal(); }
function triggerCamera() { document.getElementById("cameraInput").click(); }

function handlePhoto(e) {
  const file = e.target.files[0];
  if (!file) return;
  selectedFile = file;
  const reader = new FileReader();
  reader.onload = ev => {
    const zone = document.getElementById("captureZone");
    zone.classList.add("has-photo");
    zone.onclick = null;
    zone.innerHTML = `
      <img src="${ev.target.result}" alt="Waste photo" class="photo-preview">
      <button class="photo-retake" onclick="retakePhoto(event)">🔄 Retake</button>`;
    showClassifyOptions();
  };
  reader.readAsDataURL(file);
}

function retakePhoto(e) {
  e.stopPropagation();
  selectedFile = null;
  selectedWasteType = null;
  const zone = document.getElementById("captureZone");
  zone.classList.remove("has-photo");
  zone.onclick = triggerCamera;
  zone.innerHTML = `
    <div class="camera-capture-icon">📷</div>
    <div class="camera-capture-label">Tap to take a photo</div>
    <div class="camera-capture-sub">Photograph the collected waste</div>`;
  document.getElementById("classifyRow").style.display = "none";
  document.getElementById("confirmBtn").disabled = true;
  document.getElementById("cameraInput").value = "";
}

// ── Scoring questionnaire ─────────────────────────────────────
function showClassifyOptions() {
  selectedWasteType = null;
  const row = document.getElementById("classifyRow");
  row.style.display = "block";
  renderScoringForm();
}

function renderScoringForm() {
  const row = document.getElementById("classifyRow");
  row.innerHTML = `
    <div class="classify-section">
      <div class="classify-label">Select Waste Classification</div>
      <div class="classify-options">
        <label class="classify-option opt-segregated">
          <input type="radio" name="waste_type" value="segregated" ${selectedWasteType === 'segregated' ? 'checked' : ''} onclick="pickWasteType('segregated')">
          <div class="classify-option-card">
            <span class="classify-icon">♻️</span>
            <span class="classify-type" style="color: var(--color-accent); font-weight: 700;">Segregated Waste</span>
            <span class="classify-pts" style="color: var(--color-accent); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; margin: 0.2rem 0;">+20 User pts</span>
            <span style="font-size: 0.7rem; color: var(--color-text-muted); line-height: 1.3;">Sorted, clean plastic & dry recyclables</span>
          </div>
        </label>
        <label class="classify-option opt-mixed">
          <input type="radio" name="waste_type" value="mixed" ${selectedWasteType === 'mixed' ? 'checked' : ''} onclick="pickWasteType('mixed')">
          <div class="classify-option-card">
            <span class="classify-icon">🔀</span>
            <span class="classify-type" style="color: var(--color-mixed); font-weight: 700;">Mixed Waste</span>
            <span class="classify-pts" style="color: var(--color-mixed); font-family: var(--font-mono); font-size: 0.8rem; font-weight: 700; margin: 0.2rem 0;">+10 User pts</span>
            <span style="font-size: 0.7rem; color: var(--color-text-muted); line-height: 1.3;">Unsorted, wet organic or contaminated waste</span>
          </div>
        </label>
      </div>
      
      <div class="score-total-row" style="margin-top: 0.5rem;">
        <span class="score-total-label" style="font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; gap: 0.35rem;">👷 Worker Reward</span>
        <span class="score-total-val" style="color: var(--color-accent); font-family: var(--font-mono); font-weight: 700; font-size: 0.95rem;">+20 pts earned</span>
      </div>
    </div>`;

  document.getElementById("confirmBtn").disabled = !selectedWasteType;
}

function pickWasteType(type) {
  selectedWasteType = type;
  renderScoringForm();
}

// ── Confirm collection ────────────────────────────────────────
async function confirmCollection() {
  const job = pendingJobs.find(j => j.id === activeJobId);
  if (!job || !selectedFile) return;

  if (!selectedWasteType) return;

  const userPts = selectedWasteType === "segregated" ? 20 : 10;
  const workerPts = 20;

  const btn = document.getElementById("confirmBtn");
  btn.disabled = true;
  btn.innerHTML = `<span class="spinner"></span> Uploading…`;

  // Upload photo
  let photoUrl = "";
  try {
    const ext = selectedFile.name.split(".").pop() || "jpg";
    const filePath = `${workerSession.id}/${job.id}_${Date.now()}.${ext}`;
    const { error: uploadErr } = await sb.storage.from("waste-photos").upload(filePath, selectedFile, { upsert: true });

    if (uploadErr) {
      console.warn("Storage upload failed:", uploadErr.message);
      photoUrl = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80";
    } else {
      const { data: urlData } = sb.storage.from("waste-photos").getPublicUrl(filePath);
      photoUrl = urlData?.publicUrl || "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80";
    }
  } catch {
    photoUrl = "https://images.unsplash.com/photo-1611284446314-60a58ac0deb9?auto=format&fit=crop&w=600&q=80";
  }

  try {
    const { error: dashErr } = await sb.from("dashboard").update({
      status: "collected",
      collected_at: new Date().toISOString(),
      collected_by: workerSession.id,
      photo_url: photoUrl,
      points_awarded: userPts,
      segregation_type: selectedWasteType
    }).eq("id", job.id);
    if (dashErr) throw new Error("Dashboard: " + dashErr.message);

    const newPts = (workerSession.points || 0) + workerPts;
    const newDone = (workerSession.total_collections || 0) + 1;
    const { error: wErr } = await sb.from("workers").update({
      points: newPts, total_collections: newDone
    }).eq("id", workerSession.id);
    if (wErr) throw new Error("Worker: " + wErr.message);

    workerSession.points = newPts;
    workerSession.total_collections = newDone;

    if (job.userId) {
      const { data: u } = await sb.from("users").select("points").eq("id", job.userId).single();
      if (u) await sb.from("users").update({ points: (u.points || 0) + userPts }).eq("id", job.userId);
    }

    if (selectedWasteType === "segregated") segregatedCount++; else mixedCount++;
    pendingJobs = pendingJobs.filter(j => j.id !== job.id);
    removeMapMarker(job.id);
    closeModal();
    renderQueue();
    animateCounter("wPoints", newPts);
    animateCounter("wDone", newDone);
    animateCounter("wSegregated", segregatedCount);
    animateCounter("wMixed", mixedCount);
    await loadHistory();
    showSuccessModal(userPts, selectedWasteType, newPts);

  } catch (err) {
    showToast(err.message, "error");
    btn.disabled = false;
    btn.textContent = "Confirm & Award Points";
  }
}

// ── Success modal ─────────────────────────────────────────────
function showSuccessModal(userPts, type, total) {
  const overlay = document.createElement("div");
  overlay.className = "success-overlay";
  overlay.innerHTML = `
    <div class="success-card">
      <span class="success-icon">${type === "segregated" ? "♻️" : "🔀"}</span>
      <div class="success-title">Collection Complete!</div>
      <div class="success-pts">+20 pts</div>
      <div class="success-desc">
        Classified as <strong style="color:${type === 'segregated' ? 'var(--color-accent)' : 'var(--color-mixed)'}">${type === 'segregated' ? 'Segregated' : 'Mixed'}</strong> waste.<br>
        👷 Worker XP: <strong>+20 pts</strong><br>
        👤 User XP: <strong>+${userPts} pts</strong>
      </div>
      <div class="success-total">Total: ${total} pts earned</div>
      <button class="btn-success" onclick="this.closest('.success-overlay').remove()">Continue ✓</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 6000);
}

// ── Realtime ──────────────────────────────────────────────────
function setupRealtimeStream() {
  sb.channel('public:dashboard')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'dashboard' },
      async (payload) => {
        const isTargeted = !payload.new.assigned_worker_id || payload.new.assigned_worker_id === workerSession.id;
        if (payload.new.status === 'pending' && isTargeted) {
          const { data: userProfile } = await sb.from("users").select("username").eq("id", payload.new.user_id).single();
          const newJob = {
            id: payload.new.id,
            userId: payload.new.user_id,
            username: userProfile?.username || "Mitra_User",
            lat: payload.new.latitude,
            lng: payload.new.longitude,
            reportedAt: payload.new.reported_at
          };
          pendingJobs.unshift(newJob);
          renderQueue();
          addMapMarker(newJob);
          showToast("🚨 Closest priority alert routed to your terminal!", "warn");
          calculateRoute(newJob.lat, newJob.lng);
        }
      })
    .subscribe();
}

// ── Boot ─────────────────────────────────────────────────────
async function boot() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) {
    showToast("Not logged in — please sign in first.", "error");
    setTimeout(() => window.location.href = "../login.html", 2000);
    return;
  }

  const { data: profile, error } = await sb
    .from("workers")
    .select("id, username, points, total_collections")
    .eq("id", session.user.id)
    .single();

  if (error || !profile) {
    showToast("Worker profile not found.", "error");
    document.getElementById("loadingOverlay").style.display = "none";
    return;
  }

  workerSession = profile;
  const name = profile.username;
  document.getElementById("workerTitle").textContent = name;
  document.getElementById("workerName").textContent = name;
  document.getElementById("workerAvatar").textContent = name.substring(0, 2).toUpperCase();

  animateCounter("wPoints", profile.points || 0);
  animateCounter("wDone", profile.total_collections || 0);

  await loadHistory();
  await loadQueue();
  setupRealtimeStream();

  document.getElementById("loadingOverlay").style.display = "none";

  document.getElementById("signOutBtn").addEventListener("click", async () => {
    await sb.auth.signOut();
    window.location.href = "../login.html";
  });
}

boot();