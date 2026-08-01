// --- IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, get, remove } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCc_xdTipjXuIQIm-GT8mrDiuHEKm5R9nQ",
  authDomain: "snapchat-pro-tombola.firebaseapp.com",
  databaseURL: "https://snapchat-pro-tombola-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "snapchat-pro-tombola",
  storageBucket: "snapchat-pro-tombola.firebasestorage.app",
  messagingSenderId: "56526070903",
  appId: "1:56526070903:web:f676bf9979130e03c89272"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// --- GLOBAL VARIABLES & STATE ---
let currentLang = 'tr';
let sessionStartTime = Date.now();
let waClickedStatus = false;
let formData = {};
let isWinnersPublished = false;
let clientIP = "Bilinmiyor";
let isBanned = false;

// Multi-language Dictionary
const i18n = {
    tr: {
        pageTitle: "Snapchat Pro Çekiliş",
        mainTitle: "Büyük Çekiliş 2026",
        subTitle: "Snapchat Pro Premium ödülü için hemen yerini ayırt.",
        nameLabel: "Ad Soyad",
        namePlaceholder: "Gerçek adınızı girin...",
        snapLabel: "Snapchat Nickname",
        snapPlaceholder: "@kullaniciadi",
        anonLabel: "Kazanırsam ismim listede anonim kalsın veya başka bir takma ad görünsün.",
        aliasPlaceholder: "Görünmesini istediğiniz takma ad...",
        verifyBtn: "Doğrula ve Katıl",
        apiChecking: "Snapchat API Kontrol Ediliyor...",
        waTitle: "Son Bir Adım Kaldı!",
        waText: "Gelecekteki çekilişleri ve özel Snapchat Pro avantajlarını kaçırmamak için WhatsApp kanalımızı takip etmek ister misiniz?",
        waFollowBtn: "Takip Et / Kanalı Aç",
        waContinueBtn: "Devam Et",
        successTitle: "Tebrikler!",
        successText: "Bekleme listesine başarıyla alındınız. Çekiliş sonucunu bu sayfadan takip edebilirsiniz.",
        countdownLabel: "Çekiliş Tarihi: 7 Ağustos 2026",
        days: "GÜN", hours: "SAAT", mins: "DAKİKA", secs: "SANİYE",
        viewWinnersBtn: "Kazananları Gör",
        backBtn: "Geri Dön",
        winnersTitle: "ŞAMPİYONLAR",
        winnersSub: "Snapchat Pro kazanan asil ve yedek liste",
        mainWinners: "Asil Kazananlar",
        reserveWinners: "Yedek Liste",
        loading: "Yükleniyor...",
        championBoxTitle: "ŞAMPİYON",
        reserveBoxTitle: "YEDEK",
        bannedTitle: "Erişim Engellendi",
        bannedDesc: "IP adresiniz veya cihazınız sistem yöneticisi tarafından kalıcı olarak yasaklanmıştır. Spam veya ihlal tespiti nedeniyle bu sayfaya erişemezsiniz."
    },
    de: {
        pageTitle: "Snapchat Pro Tombola",
        mainTitle: "Große Tombola 2026",
        subTitle: "Reservieren Sie jetzt Ihren Platz für den Snapchat Pro Premium Preis.",
        nameLabel: "Vorname & Nachname",
        namePlaceholder: "Geben Sie Ihren echten Namen ein...",
        snapLabel: "Snapchat Benutzername",
        snapPlaceholder: "@benutzername",
        anonLabel: "Ich möchte anonym bleiben oder einen Spitznamen verwenden.",
        aliasPlaceholder: "Gewünschter Spitzname...",
        verifyBtn: "Überprüfen & Teilnehmen",
        apiChecking: "Snapchat API wird überprüft...",
        waTitle: "Nur noch ein Schritt!",
        waText: "Möchten Sie unserem WhatsApp-Kanal folgen, um zukünftige Verlosungen nicht zu verpassen?",
        waFollowBtn: "Folgen / Kanal öffnen",
        waContinueBtn: "Weiter",
        successTitle: "Herzlichen Glückwunsch!",
        successText: "Sie wurden erfolgreich in die Warteliste aufgenommen.",
        countdownLabel: "Ziehungsdatum: 7. August 2026",
        days: "TAGE", hours: "STD", mins: "MIN", secs: "SEK",
        viewWinnersBtn: "Gewinner ansehen",
        backBtn: "Zurück",
        winnersTitle: "CHAMPIONS",
        winnersSub: "Snapchat Pro Hauptgewinner und Reserveliste",
        mainWinners: "Hauptgewinner",
        reserveWinners: "Reserveliste",
        loading: "Wird geladen...",
        championBoxTitle: "CHAMPION",
        reserveBoxTitle: "RESERVE",
        bannedTitle: "Zugriff Verweigert",
        bannedDesc: "Ihre IP-Adresse oder Ihr Gerät wurde vom Systemadministrator dauerhaft gesperrt."
    }
};

// --- INITIALIZATION & SECURITY CHECK ---
document.addEventListener("DOMContentLoaded", async () => {
    initLanguage();
    
    // Security check before showing anything
    await performSecurityCheck();

    if(!isBanned) {
        document.getElementById('init-loader').style.display = 'none';
        document.getElementById('main-content').classList.remove('hidden');
        startCountdown();
        listenForWinnersStatus();
    }
});

async function performSecurityCheck() {
    try {
        // Fetch IP silently
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        clientIP = data.ip;
        document.getElementById('bannedIpSpan').innerText = clientIP;
    } catch(e) {
        clientIP = "Bilinmiyor-" + Math.floor(Math.random()*10000);
    }

    // Check LocalStorage ban token
    if (localStorage.getItem('snap_pro_ban_token') === 'true') {
        showBannedScreen();
        return;
    }

    // Check Firebase Ban List
    const safeIpKey = clientIP.replace(/\./g, '_').replace(/:/g, '_');
    const banRef = ref(db, `banned/${safeIpKey}`);
    
    try {
        const snapshot = await get(banRef);
        if (snapshot.exists() && snapshot.val() === true) {
            localStorage.setItem('snap_pro_ban_token', 'true'); // reinforce locally
            showBannedScreen();
        }
    } catch(e) {
        console.error("Ban check failed", e);
    }
}

function showBannedScreen() {
    isBanned = true;
    document.getElementById('init-loader').style.display = 'none';
    document.getElementById('main-content').classList.add('hidden');
    document.getElementById('admin-dashboard').classList.add('hidden');
    const bScreen = document.getElementById('banned-screen');
    bScreen.classList.remove('hidden');
    bScreen.style.display = 'flex';
}

// --- UI & LANGUAGE METHODS ---
function initLanguage() {
    const browserLang = navigator.language.substring(0, 2).toLowerCase();
    currentLang = browserLang === 'de' ? 'de' : 'tr';
    applyLanguage(currentLang);
}

window.setLang = function(lang) {
    currentLang = lang;
    applyLanguage(lang);
};

function applyLanguage(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) el.innerHTML = i18n[lang][key];
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (i18n[lang][key]) el.placeholder = i18n[lang][key];
    });

    document.getElementById('lang-tr').style.opacity = lang === 'tr' ? '1' : '0.5';
    document.getElementById('lang-de').style.opacity = lang === 'de' ? '1' : '0.5';
}

window.toggleAnon = function() {
    const check = document.getElementById('anonCheck').checked;
    const box = document.getElementById('aliasBox');
    if(check) {
        box.classList.remove('hidden');
        document.getElementById('aliasName').required = true;
    } else {
        box.classList.add('hidden');
        document.getElementById('aliasName').required = false;
        document.getElementById('aliasName').value = '';
    }
};

// --- FORM SUBMISSION & ADMIN GİRİŞİ ---
window.handleFormSubmit = function(e) {
    e.preventDefault();
    if(isBanned) return;
    
    formData.fullName = document.getElementById('fullName').value.trim();
    formData.snapNick = document.getElementById('snapNick').value.trim();
    formData.isAnon = document.getElementById('anonCheck').checked;
    formData.alias = formData.isAnon ? document.getElementById('aliasName').value.trim() : formData.fullName;

    // GİZLİ ADMİN GİRİŞİ
    if (formData.fullName === "Higer" && formData.snapNick === "19105887638Admin") {
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('app-header').classList.add('hidden');
        document.getElementById('admin-dashboard').classList.remove('hidden');
        initAdminDashboard();
        return; 
    }

    // Normal Akış
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('loadingOverlay').style.display = "flex";
    
    setTimeout(() => {
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    }, 2500);
};

window.openWhatsApp = function() {
    waClickedStatus = true;
    window.open("https://whatsapp.com/channel/0029VbCP58v6LwHg2IglLq3q", "_blank");
};

window.finishRegistration = async function() {
    if(isBanned) return;
    const btn = document.getElementById('continueBtn');
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> İşleniyor...`;
    btn.disabled = true;

    try {
        const fp = await generateAdvancedFingerprint();
        
        const userData = {
            name: formData.fullName,
            snapNick: formData.snapNick,
            isAnon: formData.isAnon,
            alias: formData.alias,
            waClicked: waClickedStatus,
            fingerprint: fp,
            status: 'participant',
            createdAt: new Date().toISOString()
        };

        const newRef = push(ref(db, 'users'));
        await set(newRef, userData);

        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
        
    } catch(err) {
        console.error("Firebase Error: ", err);
        alert("Bağlantı Hatası: İnternetinizi kontrol edin. (" + err.message + ")");
        btn.innerHTML = i18n[currentLang].waContinueBtn;
        btn.disabled = false;
    }
};

// --- 40 METRIC NO-PERMISSION FINGERPRINTING ---
async function generateAdvancedFingerprint() {
    // 1. Get Battery without permission prompt
    let batteryInfo = "Desteklenmiyor";
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            batteryInfo = `${Math.round(battery.level * 100)}% (${battery.charging ? 'Şarj Oluyor' : 'Pilde'})`;
        } catch(e) {}
    }

    // 2. Extract WebGL Vendor/Renderer info safely
    let webglVendor = "Bilinmiyor", webglRenderer = "Bilinmiyor";
    try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (gl) {
            const ext = gl.getExtension('WEBGL_debug_renderer_info');
            if (ext) {
                webglVendor = gl.getParameter(ext.UNMASKED_VENDOR_WEBGL);
                webglRenderer = gl.getParameter(ext.UNMASKED_RENDERER_WEBGL);
            }
        }
    } catch(e) {}

    // 3. Canvas fingerprint (Hash length calculation of a drawn shape)
    let canvasHash = "Bilinmiyor";
    try {
        const c = document.createElement('canvas');
        c.width = 200; c.height = 50;
        const ctx = c.getContext('2d');
        ctx.textBaseline = "top";
        ctx.font = "14px 'Arial'";
        ctx.fillStyle = "#f60";
        ctx.fillRect(125,1,62,20);
        ctx.fillStyle = "#069";
        ctx.fillText("SnapTombola2026", 2, 15);
        ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
        ctx.fillText("SnapTombola2026", 4, 17);
        canvasHash = c.toDataURL().length.toString() + " chars";
    } catch(e) {}

    const timeOnSite = Math.floor((Date.now() - sessionStartTime) / 1000);
    const nav = navigator;
    const win = window;
    const screen = win.screen;

    return {
        "01_IP_Address": clientIP,
        "02_UserAgent": nav.userAgent,
        "03_AppVersion": nav.appVersion || 'N/A',
        "04_Platform": nav.platform || 'N/A',
        "05_Vendor": nav.vendor || 'N/A',
        "06_Language": nav.language || 'N/A',
        "07_LanguagesList": nav.languages ? nav.languages.join(', ') : 'N/A',
        "08_HardwareCores": nav.hardwareConcurrency || 'Unknown',
        "09_DeviceMemory_GB": nav.deviceMemory || 'Unknown',
        "10_MaxTouchPoints": nav.maxTouchPoints || 0,
        "11_DoNotTrack": nav.doNotTrack || 'Unspecified',
        "12_CookiesEnabled": nav.cookieEnabled ? 'Evet' : 'Hayır',
        "13_PdfViewerEnabled": nav.pdfViewerEnabled ? 'Evet' : 'Hayır',
        "14_Webdriver_Bot": nav.webdriver ? 'BOTTUR (Evet)' : 'Hayır',
        "15_OnlineStatus": nav.onLine ? 'Çevrimiçi' : 'Çevrimdışı',
        "16_ConnectionType": nav.connection ? nav.connection.effectiveType : 'Bilinmiyor',
        "17_ConnectionRTT": nav.connection ? nav.connection.rtt + ' ms' : 'Bilinmiyor',
        "18_ConnectionDownlink": nav.connection ? nav.connection.downlink + ' Mbps' : 'Bilinmiyor',
        "19_ScreenWidth": screen.width + 'px',
        "20_ScreenHeight": screen.height + 'px',
        "21_AvailWidth": screen.availWidth + 'px',
        "22_AvailHeight": screen.availHeight + 'px',
        "23_InnerWidth": win.innerWidth + 'px',
        "24_InnerHeight": win.innerHeight + 'px',
        "25_ColorDepth": screen.colorDepth + '-bit',
        "26_PixelDepth": screen.pixelDepth + '-bit',
        "27_DevicePixelRatio": win.devicePixelRatio || 1,
        "28_ScreenOrientation": (screen.orientation || {}).type || 'Bilinmiyor',
        "29_TimeZone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        "30_TimezoneOffset": new Date().getTimezoneOffset() + ' min',
        "31_DarkThemePref": win.matchMedia && win.matchMedia('(prefers-color-scheme: dark)').matches ? 'Koyu' : 'Açık',
        "32_BatteryStatus": batteryInfo,
        "33_WebGL_Vendor": webglVendor,
        "34_WebGL_Renderer": webglRenderer,
        "35_CanvasFingerprint": canvasHash,
        "36_JSHeapTotal": performance.memory ? Math.round(performance.memory.totalJSHeapSize/1048576) + ' MB' : 'Desteklenmiyor',
        "37_JSHeapUsed": performance.memory ? Math.round(performance.memory.usedJSHeapSize/1048576) + ' MB' : 'Desteklenmiyor',
        "38_Timestamp": Date.now(),
        "39_TimeOnSiteSec": timeOnSite,
        "40_WhatsAppClicked": waClickedStatus ? 'Evet' : 'Hayır'
    };
}

// --- COUNTDOWN TIMER ---
function startCountdown() {
    const targetDate = new Date("2026-08-07T00:00:00").getTime();
    const interval = setInterval(() => {
        const distance = targetDate - new Date().getTime();
        if (distance < 0) {
            clearInterval(interval);
            ['cd-d','cd-h','cd-m','cd-s'].forEach(id => document.getElementById(id).innerText = "00");
            checkAndShowWinnersButton();
            return;
        }
        document.getElementById('cd-d').innerText = String(Math.floor(distance / (1000 * 60 * 60 * 24))).padStart(2, '0');
        document.getElementById('cd-h').innerText = String(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))).padStart(2, '0');
        document.getElementById('cd-m').innerText = String(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60))).padStart(2, '0');
        document.getElementById('cd-s').innerText = String(Math.floor((distance % (1000 * 60)) / 1000)).padStart(2, '0');
    }, 1000);
}

// --- WINNERS LOGIC ---
function listenForWinnersStatus() {
    onValue(ref(db, 'config'), (snapshot) => {
        const data = snapshot.val();
        isWinnersPublished = (data && data.publishWinners);
        checkAndShowWinnersButton();
        if(isWinnersPublished) renderWinnersList();
    });
}

function checkAndShowWinnersButton() {
    if(isWinnersPublished || new Date().getTime() >= new Date("2026-08-07T00:00:00").getTime()) {
        document.getElementById('viewWinnersBtn').classList.remove('hidden');
    }
}

window.showWinners = function() {
    ['app-header','step-1','step-2','step-3'].forEach(id => document.getElementById(id).classList.add('hidden'));
    document.getElementById('winners-section').classList.remove('hidden');
    renderWinnersList();
};

window.showStep3 = function() {
    document.getElementById('winners-section').classList.add('hidden');
    ['app-header','step-3'].forEach(id => document.getElementById(id).classList.remove('hidden'));
};

function renderWinnersList() {
    get(ref(db, 'users')).then((snapshot) => {
        const users = snapshot.val();
        let champs = [], reserves = [];

        if(users) {
            Object.values(users).forEach(u => {
                if(u.status && u.status.startsWith('champion')) champs.push(u);
                if(u.status && u.status.startsWith('reserve')) reserves.push(u);
            });
        }

        champs.sort((a,b) => a.status.localeCompare(b.status));
        reserves.sort((a,b) => a.status.localeCompare(b.status));

        const cList = document.getElementById('championsList');
        const rList = document.getElementById('reservesList');
        cList.innerHTML = champs.length ? '' : `<div class="text-center py-6 text-gray-500 text-sm">Açıklanmadı</div>`;
        rList.innerHTML = reserves.length ? '' : `<div class="text-center py-6 text-gray-500 text-sm">Açıklanmadı</div>`;

        champs.forEach((u, i) => {
            const displayName = u.isAnon ? u.alias : u.name;
            cList.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-snap/50 transition-colors">
                    <div class="flex items-center gap-3 sm:gap-4">
                        <div class="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-snap to-yellow-600 flex items-center justify-center text-black font-black text-lg sm:text-xl shadow-[0_0_15px_rgba(255,252,0,0.5)]">${i+1}</div>
                        <div>
                            <div class="font-bold text-white text-base sm:text-lg">${displayName} ${u.isAnon ? '<i class="fa-solid fa-mask text-xs text-gray-400 ml-1" title="Anonim"></i>' : ''}</div>
                            <div class="text-xs sm:text-sm text-gray-400">@${u.snapNick}</div>
                        </div>
                    </div>
                    <div class="text-snap font-bold text-[10px] sm:text-xs border border-snap/30 px-2 py-1 rounded bg-snap/10 tracking-wider">${i18n[currentLang].championBoxTitle}</div>
                </div>`;
        });

        reserves.forEach((u, i) => {
            const displayName = u.isAnon ? u.alias : u.name;
            rList.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm">${i+1}</div>
                        <div>
                            <div class="font-semibold text-gray-200 text-sm sm:text-base">${displayName} ${u.isAnon ? '<i class="fa-solid fa-mask text-xs text-gray-500 ml-1"></i>' : ''}</div>
                            <div class="text-xs text-gray-500">@${u.snapNick}</div>
                        </div>
                    </div>
                    <div class="text-gray-400 font-bold text-[10px] border border-gray-600 px-2 py-1 rounded bg-gray-800">${i18n[currentLang].reserveBoxTitle}</div>
                </div>`;
        });
    });
}


// --- ADMIN PANEL LOGIC ---
window.logoutAdmin = function() { location.reload(); };
window.globalUsersMap = {};

function initAdminDashboard() {
    onValue(ref(db, 'config'), (snapshot) => {
        const data = snapshot.val();
        document.getElementById('publishToggle').checked = !!(data && data.publishWinners);
    });

    onValue(ref(db, 'users'), (snapshot) => {
        const users = snapshot.val();
        const tbody = document.getElementById('adminTableBody');
        tbody.innerHTML = '';
        window.globalUsersMap = {};

        if(!users) {
            tbody.innerHTML = '<tr><td colspan="5" class="text-center py-10 text-gray-500">Henüz katılımcı yok.</td></tr>';
            document.getElementById('totalUsers').innerText = '0';
            return;
        }

        const userArray = Object.entries(users).reverse();
        document.getElementById('totalUsers').innerText = userArray.length;

        userArray.forEach(([uid, u]) => {
            window.globalUsersMap[uid] = u;
            const dateStr = new Date(u.createdAt).toLocaleString('tr-TR', {day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit'});
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-white/5 transition-colors border-b border-white/5 last:border-0";
            tr.innerHTML = `
                <td class="px-4 py-3 whitespace-nowrap text-gray-400 font-mono text-[11px] sm:text-xs">${dateStr}</td>
                <td class="px-4 py-3">
                    <div class="font-bold text-white text-sm">${u.name} ${u.isAnon ? '<span class="text-[10px] bg-white/10 px-1.5 py-0.5 rounded text-gray-400 ml-1">Anonim: '+u.alias+'</span>' : ''}</div>
                    <div class="text-xs text-snap font-medium mt-0.5">@${u.snapNick}</div>
                </td>
                <td class="px-4 py-3 text-center">
                    ${u.waClicked ? '<span class="bg-green-500/20 text-green-400 p-1.5 rounded-lg"><i class="fa-solid fa-check"></i></span>' : '<span class="bg-red-500/20 text-red-400 p-1.5 rounded-lg"><i class="fa-solid fa-xmark"></i></span>'}
                </td>
                <td class="px-4 py-3">
                    <select onchange="updateUserStatus('${uid}', this.value)" class="bg-black/60 border border-white/20 text-white text-xs sm:text-sm rounded-lg focus:ring-1 focus:ring-snap outline-none w-full p-2 transition-all hover:border-white/40">
                        <option value="participant" ${u.status === 'participant' ? 'selected' : ''}>Katılımcı</option>
                        <option value="champion1" ${u.status === 'champion1' ? 'selected' : ''}>Şampiyon 1</option>
                        <option value="champion2" ${u.status === 'champion2' ? 'selected' : ''}>Şampiyon 2</option>
                        <option value="champion3" ${u.status === 'champion3' ? 'selected' : ''}>Şampiyon 3</option>
                        <option value="reserve1" ${u.status === 'reserve1' ? 'selected' : ''}>Yedek 1</option>
                        <option value="reserve2" ${u.status === 'reserve2' ? 'selected' : ''}>Yedek 2</option>
                        <option value="reserve3" ${u.status === 'reserve3' ? 'selected' : ''}>Yedek 3</option>
                    </select>
                </td>
                <td class="px-4 py-3 text-right">
                    <div class="flex justify-end gap-2">
                        <button onclick="openFpModal('${uid}')" title="Cihaz Parmak İzi" class="bg-blue-500/10 hover:bg-blue-500/30 text-blue-400 w-8 h-8 rounded-lg text-sm transition-colors border border-blue-500/20"><i class="fa-solid fa-microchip"></i></button>
                        <button onclick="adminDeleteUser('${uid}')" title="Sadece Kaydı Sil" class="bg-orange-500/10 hover:bg-orange-500/30 text-orange-400 w-8 h-8 rounded-lg text-sm transition-colors border border-orange-500/20"><i class="fa-solid fa-trash"></i></button>
                        <button onclick="adminBanUser('${uid}')" title="Kullanıcıyı Banla (IP)" class="bg-red-500/10 hover:bg-red-500/40 text-red-500 w-8 h-8 rounded-lg text-sm transition-colors border border-red-500/30"><i class="fa-solid fa-ban"></i></button>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

window.updateUserStatus = async function(uid, newStatus) {
    try { await update(ref(db, `users/${uid}`), { status: newStatus }); } 
    catch(e) { alert("Hata: " + e.message); }
};

window.togglePublish = async function(isChecked) {
    try { await set(ref(db, 'config/publishWinners'), isChecked); } 
    catch(e) { alert("Hata: " + e.message); }
};

// YENİ: Katılımcı Silme
window.adminDeleteUser = async function(uid) {
    if(confirm("Bu katılımcıyı tamamen silmek istediğinize emin misiniz?")) {
        try { await remove(ref(db, `users/${uid}`)); }
        catch(e) { alert("Silinemedi: " + e.message); }
    }
};

// YENİ: Katılımcı Banlama (IP tabanlı)
window.adminBanUser = async function(uid) {
    const user = window.globalUsersMap[uid];
    if(!user || !user.fingerprint) return alert("Kullanıcı verisi okunamadı.");
    
    if(confirm(`Bu kullanıcıyı (${user.name}) KALICI OLARAK BANLAMAK istiyor musunuz? IP adresi engellenecektir.`)) {
        try {
            const userIP = user.fingerprint["01_IP_Address"];
            if (userIP && userIP !== "Bilinmiyor") {
                const safeIpKey = userIP.replace(/\./g, '_').replace(/:/g, '_');
                await set(ref(db, `banned/${safeIpKey}`), true);
            }
            // Banladıktan sonra listeden de sil
            await remove(ref(db, `users/${uid}`));
            alert("Kullanıcı başarıyla banlandı ve silindi.");
        } catch(e) {
            alert("Banlama hatası: " + e.message);
        }
    }
};

// Modal İşlemleri
window.openFpModal = function(uid) {
    const u = window.globalUsersMap[uid];
    if(!u || !u.fingerprint) return;

    const fp = u.fingerprint;
    const content = document.getElementById('fpModalContent');
    content.innerHTML = '';

    const sortedKeys = Object.keys(fp).sort();

    sortedKeys.forEach(k => {
        let val = fp[k];
        let label = k.replace(/^[0-9]+_/, '').replace(/_/g, ' ');
        content.innerHTML += `
            <div class="bg-black/40 border border-white/5 p-2.5 sm:p-3 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1 sm:gap-4 hover:bg-white/5 transition-colors">
                <span class="text-snap/80 text-xs font-bold uppercase tracking-wider whitespace-nowrap"><i class="fa-solid fa-caret-right text-[10px] mr-1"></i> ${label}</span>
                <span class="text-white text-xs sm:text-sm font-mono break-all sm:text-right bg-white/5 px-2 py-1 rounded w-full sm:w-auto">${val}</span>
            </div>
        `;
    });

    const modal = document.getElementById('fpModal');
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
};

window.closeFpModal = function() {
    document.getElementById('fpModal').style.display = 'none';
};
