// ============================================================
// dashboard.js — Plastic Mitra Globe View
// Dark Green Terminal Theme — standalone, no theme.css dep
// ============================================================

const SUPABASE_URL = "https://wzdroididrergcjiwoty.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZHJvaWRpZHJlcmdjaml3b3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTQzNDMsImV4cCI6MjA5NTI3MDM0M30.tvOulsFaLx9-9T-NDyoD0_hOqJL7IRpKNpTUdL48jWU";

let sb = null, sbOk = false;
try {
  sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  sbOk = true;
} catch (_) { }

// ── Color palette (mirrors CSS tokens) ────────────────────────
const C = {
  greenBright: '#00ff88',
  blueAccent: '#00d4ff',
  globeSurface: '#071a0e',
  globeEmissive: '#0a2e14',
  atmosphere: '#00ff8844',
  graticule: '#0d3320',
  countryFill: '#0c2416',
  countryStroke: '#1a5c2e',
};

// ── Blank 1×1 pixel PNG (no default globe texture) ────────────
const BLANK =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

// ── Globe init ─────────────────────────────────────────────────
const globe = Globe()(document.getElementById('globeViz'))
  .globeImageUrl(BLANK)
  .backgroundColor('rgba(0,0,0,0)')        // transparent — let body bg show

  // Atmosphere
  .showAtmosphere(true)
  .atmosphereColor(C.atmosphere)
  .atmosphereAltitude(0.12)

  // Grid lines
  .showGraticules(true)

  // Country polygons
  .polygonAltitude(0.004)
  .polygonCapColor(() => C.countryFill)
  .polygonSideColor(() => 'rgba(0,0,0,0)')
  .polygonStrokeColor(() => C.countryStroke)
  .polygonsTransitionDuration(0)

  // Waste markers
  .pointsData([])
  .pointAltitude(0.022)
  .pointRadius(0.38)
  .pointColor(d => d.color)
  .pointsMerge(false)

  // Pulse rings (pending only)
  .ringsData([])
  .ringColor(() => t => `rgba(0,255,136,${0.7 * (1 - t)})`)
  .ringMaxRadius(4.5)
  .ringPropagationSpeed(2.2)
  .ringRepeatPeriod(1100);

// ── Globe material — deep dark green sphere ────────────────────
const T = window.THREE;
if (T) {
  globe.globeMaterial(new T.MeshPhongMaterial({
    color: new T.Color(C.globeSurface),
    emissive: new T.Color(C.globeEmissive),
    emissiveIntensity: 0.55,
    transparent: true,
    opacity: 0.97,
    shininess: 6,
  }));

  // Tint graticule lines to match theme
  const applyGraticuleTint = () => {
    globe.scene().traverse(obj => {
      if ((obj.type === 'Line' || obj.type === 'LineSegments') && obj.material) {
        obj.material.color = new T.Color('#0d3320');
        obj.material.opacity = 0.45;
        obj.material.transparent = true;
      }
    });
  };

  // Lighting — dim ambient + cool directional
  const ambient = new T.AmbientLight(0x112211, 1.8);
  const sun = new T.DirectionalLight(0x88ffaa, 1.1);
  sun.position.set(2, 1.5, 1);
  const rim = new T.DirectionalLight(0x00ff88, 0.3);
  rim.position.set(-2, -1, -1);
  globe.scene().add(ambient, sun, rim);

  globe.onGlobeReady(() => {
    applyGraticuleTint();
    dismissLoader();
  });
} else {
  globe.onGlobeReady(dismissLoader);
}

// ── Controls ───────────────────────────────────────────────────
globe.controls().autoRotate = true;
globe.controls().autoRotateSpeed = 0.28;
globe.controls().enableDamping = true;
globe.controls().dampingFactor = 0.1;
globe.controls().minDistance = 115;
globe.controls().maxDistance = 580;
globe.pointOfView({ lat: 15, lng: 78, altitude: 2.1 });

// ── Country borders ────────────────────────────────────────────
fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(r => r.json())
  .then(geo => globe.polygonsData(geo.features))
  .catch(err => console.warn('Could not load country borders:', err));

// ── Loader ─────────────────────────────────────────────────────
function dismissLoader() {
  const el = document.getElementById('loader');
  if (el && !el.classList.contains('hidden')) el.classList.add('hidden');
}
setTimeout(dismissLoader, 3000); // fallback

// ── Marker colors ──────────────────────────────────────────────
function markerColor(ping) {
  return ping ? C.greenBright : C.blueAccent;
}

// ── Apply data to globe ────────────────────────────────────────
function applyData(rows) {
  const valid = rows.filter(r => r.latitude != null && r.longitude != null);
  const points = valid.map(r => ({
    lat: r.latitude,
    lng: r.longitude,
    color: markerColor(r.ping),
    label: r.username || '',
  }));
  const rings = valid
    .filter(r => r.ping)
    .map(r => ({ lat: r.latitude, lng: r.longitude }));

  globe.pointsData(points).ringsData(rings);
  updateStats(rows.length, rows.filter(r => r.ping).length);
}

// ── Load from Supabase ─────────────────────────────────────────
async function loadMarkers() {
  if (!sbOk) { loadDemo(); return; }
  try {
    const { data, error } = await sb
      .from('users')
      .select('id, username, latitude, longitude, ping')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);

    if (error) { console.error('Supabase error:', error.message); loadDemo(); return; }
    if (!data?.length) { updateStats(0, 0); return; }
    applyData(data);
  } catch (e) {
    console.error('Fetch failed:', e);
    loadDemo();
  }
}

// ── Demo fallback ──────────────────────────────────────────────
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
    { latitude: 40.713, longitude: -74.006, ping: false, username: 'demo_user_10' },
  ]);
}

// ── Stats display ──────────────────────────────────────────────
function updateStats(total, active) {
  document.getElementById('statTotal').textContent = total;
  document.getElementById('statPending').textContent = active;
  document.getElementById('statTime').textContent =
    new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// ── Init ───────────────────────────────────────────────────────
loadMarkers();

// ── Realtime subscription ──────────────────────────────────────
if (sbOk) {
  sb.channel('users-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, loadMarkers)
    .subscribe();
}

// ── Resize ────────────────────────────────────────────────────
window.addEventListener('resize', () => {
  globe.width(window.innerWidth).height(window.innerHeight);
});