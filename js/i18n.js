/* ============================================================
   i18n.js — Plastic Mitra Multilingual Engine
   Supports: English (en), Hindi (hi), Kannada (kn)
   ============================================================ */

const TRANSLATIONS = {
  en: {
    /* ── Common ── */
    sign_out:               "Sign Out",
    view_dashboard:         "🌍 View Dashboard",
    lang_label:             "🌐 Language",

    /* ── Login ── */
    login_title:            "Welcome back",
    login_sub:              "Sign in to your account to continue",
    role_user:              "User",
    role_worker:            "Worker",
    label_username:         "Username",
    label_email:            "Email",
    label_password:         "Password",
    btn_sign_in:            "Sign in",
    login_footer:           "New here?",
    login_footer_link:      "Create an account",

    /* ── Signup ── */
    signup_title:           "Create an account",
    signup_sub:             "Join Plastic Mitra and help keep your community clean",
    label_confirm_pw:       "Confirm password",
    label_home_location:    "Home location",
    btn_add_location:       "Add current location",
    btn_create_account:     "Create account",
    signup_footer:          "Already have an account?",
    signup_footer_link:     "Sign in",

    /* ── User page ── */
    available_balance:      "Available Balance",
    disposal_requests:      "Disposal Requests Sent",
    pickup_title:           "Request Waste Disposal Pickup",
    pickup_desc:            "Tap the trigger mechanism below to beam an instant notification locator ping directly to nearest garbage workers.",
    btn_pickup:             "⚡ Request Immediate Pickup",
    recent_logs:            "Recent Logs",
    pickup_request:         "📍 Pickup Request",
    status_label:           "Status:",
    status_collected:       "Collected",
    status_pending:         "Pending",
    awarded_label:          "Awarded:",
    no_requests:            "No pickup requests sent yet.",

    /* ── Workers page ── */
    worker_portal:          "⚙ Worker Portal:",
    points_earned:          "Points Earned",
    reward_xp:              "Reward XP",
    collections_done:       "Collections Done",
    total_pickups:          "Total pickups",
    pending_tasks:          "Pending Tasks",
    in_your_radius:         "In your radius",
    segregated_pickups:     "Segregated Pickups",
    pts_each_20:            "+20 pts each",
    mixed_waste:            "Mixed Waste Pickups",
    pts_each_10:            "+10 pts each",
    active_queue:           "📋 Active Pickup Queue",
    points_history:         "🏆 Points History",
    loading_reports:        "Loading reports…",
    earn_points:            "Collect waste to earn points",
  },

  hi: {
    /* ── Common ── */
    sign_out:               "साइन आउट",
    view_dashboard:         "🌍 डैशबोर्ड देखें",
    lang_label:             "🌐 भाषा",

    /* ── Login ── */
    login_title:            "वापस स्वागत है",
    login_sub:              "जारी रखने के लिए अपने खाते में साइन इन करें",
    role_user:              "उपयोगकर्ता",
    role_worker:            "कर्मचारी",
    label_username:         "उपयोगकर्ता नाम",
    label_email:            "ईमेल",
    label_password:         "पासवर्ड",
    btn_sign_in:            "साइन इन करें",
    login_footer:           "नए हैं?",
    login_footer_link:      "खाता बनाएं",

    /* ── Signup ── */
    signup_title:           "खाता बनाएं",
    signup_sub:             "प्लास्टिक मित्र से जुड़ें और अपने समुदाय को स्वच्छ रखने में मदद करें",
    label_confirm_pw:       "पासवर्ड की पुष्टि करें",
    label_home_location:    "घर का स्थान",
    btn_add_location:       "वर्तमान स्थान जोड़ें",
    btn_create_account:     "खाता बनाएं",
    signup_footer:          "पहले से खाता है?",
    signup_footer_link:     "साइन इन करें",

    /* ── User page ── */
    available_balance:      "उपलब्ध शेष",
    disposal_requests:      "निपटान अनुरोध भेजे गए",
    pickup_title:           "कचरा निपटान पिकअप का अनुरोध करें",
    pickup_desc:            "निकटतम कचरा कर्मचारियों को तत्काल सूचना भेजने के लिए नीचे बटन दबाएं।",
    btn_pickup:             "⚡ तत्काल पिकअप का अनुरोध करें",
    recent_logs:            "हाल की गतिविधियाँ",
    pickup_request:         "📍 पिकअप अनुरोध",
    status_label:           "स्थिति:",
    status_collected:       "एकत्र किया",
    status_pending:         "लंबित",
    awarded_label:          "पुरस्कार:",
    no_requests:            "अभी तक कोई पिकअप अनुरोध नहीं भेजा।",

    /* ── Workers page ── */
    worker_portal:          "⚙ कर्मचारी पोर्टल:",
    points_earned:          "अर्जित अंक",
    reward_xp:              "इनाम XP",
    collections_done:       "संग्रह पूर्ण",
    total_pickups:          "कुल पिकअप",
    pending_tasks:          "लंबित कार्य",
    in_your_radius:         "आपके क्षेत्र में",
    segregated_pickups:     "पृथक पिकअप",
    pts_each_20:            "+20 अंक प्रत्येक",
    mixed_waste:            "मिश्रित कचरा पिकअप",
    pts_each_10:            "+10 अंक प्रत्येक",
    active_queue:           "📋 सक्रिय पिकअप कतार",
    points_history:         "🏆 अंक इतिहास",
    loading_reports:        "रिपोर्ट लोड हो रही है…",
    earn_points:            "अंक अर्जित करने के लिए कचरा संग्रह करें",
  },

  kn: {
    /* ── Common ── */
    sign_out:               "ಸೈನ್ ಔಟ್",
    view_dashboard:         "🌍 ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ನೋಡಿ",
    lang_label:             "🌐 ಭಾಷೆ",

    /* ── Login ── */
    login_title:            "ಮರಳಿ ಸ್ವಾಗತ",
    login_sub:              "ಮುಂದುವರಿಯಲು ನಿಮ್ಮ ಖಾತೆಗೆ ಸೈನ್ ಇನ್ ಮಾಡಿ",
    role_user:              "ಬಳಕೆದಾರ",
    role_worker:            "ಕಾರ್ಮಿಕ",
    label_username:         "ಬಳಕೆದಾರ ಹೆಸರು",
    label_email:            "ಇಮೇಲ್",
    label_password:         "ಪಾಸ್‌ವರ್ಡ್",
    btn_sign_in:            "ಸೈನ್ ಇನ್ ಮಾಡಿ",
    login_footer:           "ಹೊಸಬರೇ?",
    login_footer_link:      "ಖಾತೆ ರಚಿಸಿ",

    /* ── Signup ── */
    signup_title:           "ಖಾತೆ ರಚಿಸಿ",
    signup_sub:             "ಪ್ಲಾಸ್ಟಿಕ್ ಮಿತ್ರ ಸೇರಿ ಮತ್ತು ನಿಮ್ಮ ಸಮುದಾಯವನ್ನು ಸ್ವಚ್ಛವಾಗಿ ಇಡಲು ಸಹಾಯ ಮಾಡಿ",
    label_confirm_pw:       "ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ",
    label_home_location:    "ಮನೆ ಸ್ಥಳ",
    btn_add_location:       "ಪ್ರಸ್ತುತ ಸ್ಥಳ ಸೇರಿಸಿ",
    btn_create_account:     "ಖಾತೆ ರಚಿಸಿ",
    signup_footer:          "ಈಗಾಗಲೇ ಖಾತೆ ಇದೆಯೇ?",
    signup_footer_link:     "ಸೈನ್ ಇನ್ ಮಾಡಿ",

    /* ── User page ── */
    available_balance:      "ಲಭ್ಯವಿರುವ ಶಿಲ್ಕು",
    disposal_requests:      "ವಿಲೇವಾರಿ ವಿನಂತಿಗಳು ಕಳುಹಿಸಲಾಗಿದೆ",
    pickup_title:           "ತ್ಯಾಜ್ಯ ವಿಲೇವಾರಿ ಪಿಕಪ್ ವಿನಂತಿಸಿ",
    pickup_desc:            "ಹತ್ತಿರದ ಕಸ ಕಾರ್ಮಿಕರಿಗೆ ತ್ವರಿತ ಅಧಿಸೂಚನೆ ಕಳುಹಿಸಲು ಕೆಳಗಿನ ಬಟನ್ ಒತ್ತಿ.",
    btn_pickup:             "⚡ ತಕ್ಷಣದ ಪಿಕಪ್ ವಿನಂತಿಸಿ",
    recent_logs:            "ಇತ್ತೀಚಿನ ದಾಖಲೆಗಳು",
    pickup_request:         "📍 ಪಿಕಪ್ ವಿನಂತಿ",
    status_label:           "ಸ್ಥಿತಿ:",
    status_collected:       "ಸಂಗ್ರಹಿಸಲಾಗಿದೆ",
    status_pending:         "ಬಾಕಿ ಇದೆ",
    awarded_label:          "ನೀಡಲಾಗಿದೆ:",
    no_requests:            "ಇನ್ನೂ ಯಾವುದೇ ಪಿಕಪ್ ವಿನಂತಿ ಕಳುಹಿಸಾಗಿಲ್ಲ.",

    /* ── Workers page ── */
    worker_portal:          "⚙ ಕಾರ್ಮಿಕ ಪೋರ್ಟಲ್:",
    points_earned:          "ಗಳಿಸಿದ ಅಂಕಗಳು",
    reward_xp:              "ಪ್ರತಿಫಲ XP",
    collections_done:       "ಸಂಗ್ರಹ ಮಾಡಲಾಗಿದೆ",
    total_pickups:          "ಒಟ್ಟು ಪಿಕಪ್",
    pending_tasks:          "ಬಾಕಿ ಕಾರ್ಯಗಳು",
    in_your_radius:         "ನಿಮ್ಮ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ",
    segregated_pickups:     "ಪ್ರತ್ಯೇಕ ಪಿಕಪ್",
    pts_each_20:            "+20 ಅಂಕ ಪ್ರತಿ",
    mixed_waste:            "ಮಿಶ್ರ ತ್ಯಾಜ್ಯ ಪಿಕಪ್",
    pts_each_10:            "+10 ಅಂಕ ಪ್ರತಿ",
    active_queue:           "📋 ಸಕ್ರಿಯ ಪಿಕಪ್ ಸರತಿ",
    points_history:         "🏆 ಅಂಕ ಇತಿಹಾಸ",
    loading_reports:        "ವರದಿಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ…",
    earn_points:            "ಅಂಕ ಗಳಿಸಲು ತ್ಯಾಜ್ಯ ಸಂಗ್ರಹ ಮಾಡಿ",
  }
};

/* ─── Core engine ─── */
function t(key) {
  const lang = localStorage.getItem('pm_lang') || 'en';
  return (TRANSLATIONS[lang] && TRANSLATIONS[lang][key]) || TRANSLATIONS['en'][key] || key;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const attr = el.getAttribute('data-i18n-attr'); // e.g. placeholder
    if (attr) {
      el.setAttribute(attr, t(key));
    } else {
      el.textContent = t(key);
    }
  });
}

function setLanguage(lang) {
  localStorage.setItem('pm_lang', lang);
  // Update selector UI on all pickers present on the page
  document.querySelectorAll('.lang-select').forEach(sel => sel.value = lang);
  applyTranslations();
}

/* Run on load */
(function () {
  const saved = localStorage.getItem('pm_lang') || 'en';
  // Set initial select value after DOM ready
  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.lang-select').forEach(sel => sel.value = saved);
    applyTranslations();
  });
})();
