// ============================================================
// dashboard.js — Logic for dashboard.html (Globe view)
// ============================================================

const SUPABASE_URL      = "https://wzdroididrergcjiwoty.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZHJvaWRpZHJlcmdjaml3b3R5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTQzNDMsImV4cCI6MjA5NTI3MDM0M30.tvOulsFaLx9-9T-NDyoD0_hOqJL7IRpKNpTUdL48jWU";

let sb = null, sbOk = false;
try {
  if (SUPABASE_URL !== "YOUR_SUPABASE_URL") {
    sb   = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    sbOk = true;
  }
} catch (_) {}

// ── Globe setup ───────────────────────────────────────────────
const BLANK_IMG = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';

const globe = Globe()(document.getElementById('globeViz'))
  .globeImageUrl(BLANK_IMG)
  .backgroundColor('rgba(0,0,0,0)')
  .showAtmosphere(true)
  .atmosphereColor('#4ade80')
  .atmosphereAltitude(0.15)
  .showGraticules(true)
  .polygonAltitude(0.005)
  .polygonCapColor(() => 'rgba(74, 222, 128, 0.015)')
  .polygonSideColor(() => 'rgba(0,0,0,0)')
  .polygonStrokeColor(() => '#4ade8055')
  .polygonsTransitionDuration(0)
  .pointsData([])
  .pointAltitude(0.018)
  .pointRadius(0.4)
  .pointColor(d => d.color)
  .pointsMerge(false)
  .ringsData([])
  .ringColor(() => t => `rgba(74, 222, 128, ${1 - t})`)
  .ringMaxRadius(4)
  .ringPropagationSpeed(2)
  .ringRepeatPeriod(1200);

// Wireframe globe material
const T = window.THREE;
if (T) {
  globe.globeMaterial(new T.MeshBasicMaterial({
    color: new T.Color('#0d1f15'),
    wireframe: true,
    transparent: true,
    opacity: 0.35
  }));
}

// Controls
globe.controls().autoRotate      = true;
globe.controls().autoRotateSpeed = 0.3;
globe.controls().enableDamping   = true;
globe.controls().dampingFactor   = 0.12;
globe.controls().minDistance     = 120;
globe.controls().maxDistance     = 600;
globe.pointOfView({ lat: 15, lng: 78, altitude: 2.2 });

// Country borders
fetch('https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson')
  .then(r => r.json())
  .then(geo => globe.polygonsData(geo.features))
  .catch(err => console.warn('Could not load country borders:', err));

// Loader
function dismissLoader() {
  const l = document.getElementById('loader');
  if (l && !l.classList.contains('hidden')) l.classList.add('hidden');
}

globe.onGlobeReady(() => {
  if (T) {
    globe.scene().traverse(obj => {
      if ((obj.type === 'Line' || obj.type === 'LineSegments') && obj.material) {
        obj.material.color       = new T.Color('#1a3d28');
        obj.material.opacity     = 0.15;
        obj.material.transparent = true;
      }
    });
  }
  dismissLoader();
});

setTimeout(dismissLoader, 2500);

// ── Data ──────────────────────────────────────────────────────
function markerColor(status) {
  return status === 'collected' ? '#38bdf8' : '#4ade80';
}

function applyData(rows) {
  const points = rows.map(r => ({ lat: r.latitude, lng: r.longitude, color: markerColor(r.status) }));
  const rings  = rows.filter(r => r.status === 'pending').map(r => ({ lat: r.latitude, lng: r.longitude }));
  globe.pointsData(points);
  globe.ringsData(rings);
  updateStats(rows.length, rows.filter(r => r.status === 'pending').length);
}

async function loadMarkers() {
  if (!sbOk) { loadDemo(); return; }
  try {
    const { data, error } = await sb.from('dashboard').select('*');
    if (error || !data?.length) { updateStats(0, 0); return; }
    applyData(data);
  } catch (e) { console.error('Fetch failed:', e); }
}

function loadDemo() {
  applyData([
    { latitude: 12.870, longitude: 74.842, status: 'pending' },
    { latitude: 12.895, longitude: 74.836, status: 'pending' },
    { latitude: 12.915, longitude: 74.860, status: 'collected' },
    { latitude: 12.850, longitude: 74.880, status: 'pending' },
    { latitude: 28.613, longitude: 77.209, status: 'pending' },
    { latitude: 19.076, longitude: 72.878, status: 'collected' },
    { latitude: 13.083, longitude: 80.270, status: 'pending' },
    { latitude: 12.972, longitude: 77.595, status: 'pending' },
    { latitude: 51.507, longitude: -0.128, status: 'pending' },
    { latitude: 40.713, longitude: -74.006, status: 'collected' },
    { latitude: 35.682, longitude: 139.692, status: 'pending' },
    { latitude: -33.869, longitude: 151.209, status: 'pending' },
    { latitude: -1.286, longitude: 36.817, status: 'pending' },
    { latitude: 48.857, longitude: 2.352, status: 'collected' },
    { latitude: -23.551, longitude: -46.634, status: 'pending' },
  ]);
}

function updateStats(total, pending) {
  document.getElementById('statTotal').textContent   = total;
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statTime').textContent    = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

loadMarkers();

// Realtime
if (sbOk) {
  sb.channel('dashboard-rt')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dashboard' }, () => loadMarkers())
    .subscribe();
}

// Resize
window.addEventListener('resize', () => {
  globe.width(window.innerWidth);
  globe.height(window.innerHeight);
});
