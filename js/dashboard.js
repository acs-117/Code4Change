
// ============================================================
// dashboard.js — Logic for dashboard.html (Globe view)
// Dark Green Eco Theme Version
// ============================================================

const SUPABASE_URL = "https://wzdroididrergcjiwoty.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZHJvaWRpZHJlcmdjaml3b3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTQzNDMsImV4cCI6MjA5NTI3MDM0M30.tvOulsFaLx9-9T-NDyoD0_hOqJL7IRpKNpTUdL48jWU";

let sb = null, sbOk = false;
try {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  sbOk = true;
} catch (_) { }

// ── Globe setup ───────────────────────────────────────────────
const BLANK_IMG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const globe = Globe()(document.getElementById('globeViz'))
  .globeImageUrl(BLANK_IMG)

  // 🌿 DARK GREEN THEME BACKGROUND
  .backgroundColor('rgba(160, 255, 198, 0.85)')

  .showAtmosphere(true)
  .atmosphereColor('#c5ffdcff')
  .atmosphereAltitude(0.08)
  .showGraticules(true)

  // 🌿 LAND POLYGONS (subtle forest grid)
  .polygonAltitude(0.005)
  .polygonCapColor(() => 'rgba(176, 249, 205, 1)')
  .polygonSideColor(() => 'rgba(193, 255, 169, 0)')
  .polygonStrokeColor(() => 'rgba(34, 197, 94, 0.18)')
  .polygonsTransitionDuration(0)

  // 📍 POINTS (waste markers)
  .pointsData([])
  .pointAltitude(0.018)
  .pointRadius(0.4)
  .pointColor(d => d.color)
  .pointsMerge(false)

  // 🌿 PULSE RINGS (softer eco glow)
  .ringsData([])
  .ringColor(() => t => `rgba(34, 197, 94, ${0.6 * (1 - t)})`)
  .ringMaxRadius(4)
  .ringPropagationSpeed(2)
  .ringRepeatPeriod(1200);

// ── Globe Material (dark earthy tone) ─────────────────────────
// With this:
const T = window.THREE;
if (T) {
  globe.globeMaterial(new T.MeshPhongMaterial({
    color: new T.Color('#c6ffc8'),
    emissive: new T.Color('#a8f0aa'),
    emissiveIntensity: 0.4,
    transparent: true,
    opacity: 0.92,
    shininess: 8
  }));

  // Add ambient + directional light so the material renders
  const ambientLight = new T.AmbientLight(0xffffff, 1.2);
  const dirLight = new T.DirectionalLight(0xffffff, 0.8);
  dirLight.position.set(1, 1, 1);
  globe.scene().add(ambientLight);
  globe.scene().add(dirLight);
}

// ── Controls ──────────────────────────────────────────────────
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.3;
globe.controls().enableDamping = true;
globe.controls().dampingFactor = 0.12;
globe.controls().minDistance = 120;
globe.controls().maxDistance = 600;
globe.pointOfView({ lat: 15, lng: 78, altitude: 2.2 });

// ── Country borders ───────────────────────────────────────────
fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(r => r.json())
  .then(geo => globe.polygonsData(geo.features))
  .catch(err => console.warn('Could not load country borders:', err));

// ── Loader ────────────────────────────────────────────────────
function dismissLoader() {
  const l = document.getElementById('loader');
  if (l && !l.classList.contains('hidden')) l.classList.add('hidden');
}

globe.onGlobeReady(() => {
  if (T) {
    globe.scene().traverse(obj => {
      if ((obj.type === 'Line' || obj.type === 'LineSegments') && obj.material) {
        obj.material.color = new T.Color('#14532d');
        obj.material.opacity = 0.08;
        obj.material.transparent = true;
      }
    });
  }
  dismissLoader();
});

setTimeout(dismissLoader, 2500);

// ── DATA HELPERS ──────────────────────────────────────────────

// 🌿 greener + calmer palette
function markerColor(ping) {
  return ping ? '#22c55e' : '#0ea5e9';
}

function applyData(rows) {
  const points = rows
    .filter(r => r.latitude != null && r.longitude != null)
    .map(r => ({
      lat: r.latitude,
      lng: r.longitude,
      color: markerColor(r.ping),
      label: r.username || ''
    }));

  const rings = rows
    .filter(r => r.ping && r.latitude != null && r.longitude != null)
    .map(r => ({ lat: r.latitude, lng: r.longitude }));

  globe.pointsData(points);
  globe.ringsData(rings);

  const total = rows.length;
  const active = rows.filter(r => r.ping).length;
  updateStats(total, active);
}

// ── LOAD DATA ────────────────────────────────────────────────
async function loadMarkers() {
  if (!sbOk) { loadDemo(); return; }

  try {
    const { data, error } = await sb
      .from('users')
      .select('id, username, latitude, longitude, ping')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) {
      console.error('Supabase error:', error.message);
      loadDemo();
      return;
    }

    if (!data?.length) {
      updateStats(0, 0);
      return;
    }

    applyData(data);
  } catch (e) {
    console.error('Fetch failed:', e);
    loadDemo();
  }
}

// ── DEMO DATA ────────────────────────────────────────────────
function loadDemo() {
  applyData([
    { latitude: 12.870, longitude: 74.842, ping: true, username: 'demo_user_1' },
    { latitude: 12.895, longitude: 74.836, ping: true, username: 'demo_user_2' },
    { latitude: 12.915, longitude: 74.860, ping: false, username: 'demo_user_3' },
    { latitude: 12.850, longitude: 74.880, ping: true, username: 'demo_user_4' },
    { latitude: 28.613, longitude: 77.209, ping: true, username: 'demo_user_5' },
    { latitude: 19.076, longitude: 72.878, ping: false, username: 'demo_user_6' },
    { latitude: 13.083, longitude: 80.270, ping: true, username: 'demo_user_7' },
    { latitude: 12.972, longitude: 77.595, ping: true, username: 'demo_user_8' },
    { latitude: 51.507, longitude: -0.128, ping: true, username: 'demo_user_9' },
    { latitude: 40.713, longitude: -74.006, ping: false, username: 'demo_user_10' }
  ]);
}

// ── STATS ────────────────────────────────────────────────────
function updateStats(total, active) {
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = active;
  document.getElementById('statTime').textContent =
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// init
loadMarkers();

// ── REALTIME ────────────────────────────────────────────────
if (sbOk) {
  sb.channel('users-rt')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'users'
    }, () => loadMarkers())
    .subscribe();
}

// ── RESIZE ──────────────────────────────────────────────────
window.addEventListener('resize', () => {
  globe.width(window.innerWidth);
  globe.height(window.innerHeight);
});