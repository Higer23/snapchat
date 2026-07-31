// --- IMPORTS ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase, ref, set, push, onValue, update, get } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";

// --- FIREBASE CONFIGURATION ---
const firebaseConfig = {
  apiKey: "AIzaSyCc_xdTipjXuIQIm-GT8mrDiuHEKm5R9nQ",
  authDomain: "snapchat-pro-tombola.firebaseapp.com",
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
        backBtn: "Geri",
        winnersTitle: "ŞAMPİYONLAR",
        winnersSub: "Snapchat Pro kazanan asil ve yedek liste",
        mainWinners: "Asil Kazananlar",
        reserveWinners: "Yedek Liste",
        loading: "Yükleniyor...",
        championBoxTitle: "ŞAMPİYON",
        reserveBoxTitle: "YEDEK",
        statusAlert: "Kayıt Başarılı! Sistemde yeriniz ayrıldı."
    },
    de: {
        pageTitle: "Snapchat Pro Tombola",
        mainTitle: "Große Tombola 2026",
        subTitle: "Reservieren Sie jetzt Ihren Platz für den Snapchat Pro Premium Preis.",
        nameLabel: "Vorname & Nachname",
        namePlaceholder: "Geben Sie Ihren echten Namen ein...",
        snapLabel: "Snapchat Benutzername",
        snapPlaceholder: "@benutzername",
        anonLabel: "Ich möchte anonym bleiben oder einen Spitznamen verwenden, falls ich gewinne.",
        aliasPlaceholder: "Gewünschter Spitzname...",
        verifyBtn: "Überprüfen & Teilnehmen",
        apiChecking: "Snapchat API wird überprüft...",
        waTitle: "Nur noch ein Schritt!",
        waText: "Möchten Sie unserem WhatsApp-Kanal folgen, um zukünftige Verlosungen und exklusive Snapchat Pro-Vorteile nicht zu verpassen?",
        waFollowBtn: "Folgen / Kanal öffnen",
        waContinueBtn: "Weiter",
        successTitle: "Herzlichen Glückwunsch!",
        successText: "Sie wurden erfolgreich in die Warteliste aufgenommen. Sie können die Ergebnisse hier verfolgen.",
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
        statusAlert: "Registrierung erfolgreich! Ihr Platz ist gesichert."
    }
};

// --- INITIALIZATION ---
document.addEventListener("DOMContentLoaded", () => {
    initLanguage();
    startCountdown();
    checkAdminRoute();
    listenForWinnersStatus();
    
    window.addEventListener("hashchange", checkAdminRoute);
});

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

    // Update opacity for flag buttons
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

// --- FORM SUBMISSION & FINGERPRINTING ---
window.handleFormSubmit = function(e) {
    e.preventDefault();
    
    formData.fullName = document.getElementById('fullName').value.trim();
    formData.snapNick = document.getElementById('snapNick').value.trim();
    formData.isAnon = document.getElementById('anonCheck').checked;
    formData.alias = formData.isAnon ? document.getElementById('aliasName').value.trim() : formData.fullName;

    // Show Fake API Loader
    document.getElementById('loadingOverlay').classList.remove('hidden');
    document.getElementById('loadingOverlay').style.display = "flex";
    
    setTimeout(() => {
        // Hide Step 1, Show Step 2 (WhatsApp)
        document.getElementById('step-1').classList.add('hidden');
        document.getElementById('step-2').classList.remove('hidden');
    }, 2800);
};

window.openWhatsApp = function() {
    waClickedStatus = true;
    window.open("https://whatsapp.com/channel/0029VbCP58v6LwHg2IglLq3q", "_blank");
};

window.finishRegistration = async function() {
    // Show loading state on button
    const btn = document.getElementById('continueBtn');
    btn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> İşleniyor...`;
    btn.disabled = true;

    try {
        const fp = await generateFingerprint();
        
        const userData = {
            name: formData.fullName,
            snapNick: formData.snapNick,
            isAnon: formData.isAnon,
            alias: formData.alias,
            waClicked: waClickedStatus,
            fingerprint: fp,
            status: 'participant', // default status. Can be champion1,2,3 or reserve1,2,3
            createdAt: new Date().toISOString()
        };

        // Save to Firebase
        const newRef = push(ref(db, 'users'));
        await set(newRef, userData);

        // Hide Step 2, Show Step 3 (Success)
        document.getElementById('step-2').classList.add('hidden');
        document.getElementById('step-3').classList.remove('hidden');
        
    } catch(err) {
        console.error("Firebase Error: ", err);
        alert("Bir hata oluştu. Lütfen bağlantınızı kontrol edin. / Ein Fehler ist aufgetreten.");
        btn.innerHTML = i18n[currentLang].waContinueBtn;
        btn.disabled = false;
    }
};

// Advanced Fingerprinting (22 Metrics) collected without permissions
async function generateFingerprint() {
    let batteryInfo = "Desteklenmiyor / Nicht unterstützt";
    if (navigator.getBattery) {
        try {
            const battery = await navigator.getBattery();
            batteryInfo = `${Math.round(battery.level * 100)}% - ${battery.charging ? 'Şarj Oluyor' : 'Pilde'}`;
        } catch(e) {}
    }

    const timeOnSite = Math.floor((Date.now() - sessionStartTime) / 1000);

    return {
        "1_UserAgent": navigator.userAgent,
        "2_Language": navigator.language,
        "3_Languages": navigator.languages ? navigator.languages.join(', ') : 'N/A',
        "4_ScreenWidth": window.screen.width,
        "5_ScreenHeight": window.screen.height,
        "6_InnerWidth": window.innerWidth,
        "7_InnerHeight": window.innerHeight,
        "8_ColorDepth": window.screen.colorDepth,
        "9_PixelRatio": window.devicePixelRatio,
        "10_HardwareConcurrency": navigator.hardwareConcurrency || 'Unknown',
        "11_DeviceMemory": navigator.deviceMemory || 'Unknown',
        "12_OnLine": navigator.onLine,
        "13_TimeZone": Intl.DateTimeFormat().resolvedOptions().timeZone,
        "14_MaxTouchPoints": navigator.maxTouchPoints,
        "15_Platform": navigator.platform,
        "16_Battery": batteryInfo,
        "17_MemoryHeap": performance.memory ? Math.round(performance.memory.totalJSHeapSize / 1048576) + ' MB' : 'Unsupported',
        "18_Timestamp": Date.now(),
        "19_WaClicked": waClickedStatus,
        "20_TimeOnSiteSec": timeOnSite,
        "21_DoNotTrack": navigator.doNotTrack || 'None',
        "22_ConnectionType": navigator.connection ? navigator.connection.effectiveType : 'Unknown'
    };
}

// --- COUNTDOWN TIMER ---
function startCountdown() {
    const targetDate = new Date("2026-08-07T00:00:00").getTime();

    const interval = setInterval(() => {
        const now = new Date().getTime();
        const distance = targetDate - now;

        if (distance < 0) {
            clearInterval(interval);
            document.getElementById('cd-d').innerText = "00";
            document.getElementById('cd-h').innerText = "00";
            document.getElementById('cd-m').innerText = "00";
            document.getElementById('cd-s').innerText = "00";
            // Check if winners should be displayed automatically
            checkAndShowWinnersButton();
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        document.getElementById('cd-d').innerText = days < 10 ? '0'+days : days;
        document.getElementById('cd-h').innerText = hours < 10 ? '0'+hours : hours;
        document.getElementById('cd-m').innerText = minutes < 10 ? '0'+minutes : minutes;
        document.getElementById('cd-s').innerText = seconds < 10 ? '0'+seconds : seconds;
    }, 1000);
}

// --- WINNERS LOGIC ---
function listenForWinnersStatus() {
    const configRef = ref(db, 'config');
    onValue(configRef, (snapshot) => {
        const data = snapshot.val();
        if(data && data.publishWinners) {
            isWinnersPublished = true;
            checkAndShowWinnersButton();
            renderWinnersList();
        } else {
            isWinnersPublished = false;
            document.getElementById('viewWinnersBtn').classList.add('hidden');
        }
    });
}

function checkAndShowWinnersButton() {
    const targetDate = new Date("2026-08-07T00:00:00").getTime();
    if(isWinnersPublished || new Date().getTime() >= targetDate) {
        document.getElementById('viewWinnersBtn').classList.remove('hidden');
    }
}

window.showWinners = function() {
    document.getElementById('app-header').classList.add('hidden');
    document.getElementById('step-1').classList.add('hidden');
    document.getElementById('step-2').classList.add('hidden');
    document.getElementById('step-3').classList.add('hidden');
    document.getElementById('winners-section').classList.remove('hidden');
    renderWinnersList();
};

window.showStep3 = function() {
    document.getElementById('winners-section').classList.add('hidden');
    document.getElementById('app-header').classList.remove('hidden');
    document.getElementById('step-3').classList.remove('hidden');
};

function renderWinnersList() {
    const usersRef = ref(db, 'users');
    get(usersRef).then((snapshot) => {
        const users = snapshot.val();
        let champs = [];
        let reserves = [];

        if(users) {
            Object.values(users).forEach(u => {
                if(u.status && u.status.startsWith('champion')) champs.push(u);
                if(u.status && u.status.startsWith('reserve')) reserves.push(u);
            });
        }

        // Sort by assigned number
        champs.sort((a,b) => a.status.localeCompare(b.status));
        reserves.sort((a,b) => a.status.localeCompare(b.status));

        const cList = document.getElementById('championsList');
        const rList = document.getElementById('reservesList');

        cList.innerHTML = champs.length ? '' : `<div class="text-center py-4 text-gray-500 text-sm">Açıklanmadı / Nicht bekannt gegeben</div>`;
        rList.innerHTML = reserves.length ? '' : `<div class="text-center py-4 text-gray-500 text-sm">Açıklanmadı / Nicht bekannt gegeben</div>`;

        champs.forEach((u, i) => {
            const displayName = u.isAnon ? u.alias : u.name;
            const rank = i + 1;
            cList.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10 hover:border-snap/50 transition">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-gradient-to-br from-snap to-yellow-600 flex items-center justify-center text-black font-black text-lg shadow-[0_0_10px_rgba(255,252,0,0.4)]">${rank}</div>
                        <div>
                            <div class="font-bold text-white text-lg">${displayName} ${u.isAnon ? '<i class="fa-solid fa-mask text-xs text-gray-400 ml-1" title="Anonim"></i>' : ''}</div>
                            <div class="text-sm text-gray-400">@${u.snapNick}</div>
                        </div>
                    </div>
                    <div class="text-snap font-bold text-xs border border-snap/30 px-2 py-1 rounded bg-snap/10">${i18n[currentLang].championBoxTitle}</div>
                </div>
            `;
        });

        reserves.forEach((u, i) => {
            const displayName = u.isAnon ? u.alias : u.name;
            const rank = i + 1;
            rList.innerHTML += `
                <div class="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-gray-300 font-bold text-sm">${rank}</div>
                        <div>
                            <div class="font-semibold text-gray-200">${displayName} ${u.isAnon ? '<i class="fa-solid fa-mask text-xs text-gray-500 ml-1"></i>' : ''}</div>
                            <div class="text-xs text-gray-500">@${u.snapNick}</div>
                        </div>
                    </div>
                    <div class="text-gray-400 font-bold text-[10px] border border-gray-600 px-2 py-1 rounded bg-gray-800">${i18n[currentLang].reserveBoxTitle}</div>
                </div>
            `;
        });
    });
}


// --- ADMIN PANEL LOGIC ---

window.checkAdminRoute = function() {
    if (window.location.hash === '#admin') {
        document.getElementById('admin-login').classList.remove('hidden');
        document.getElementById('admin-login').style.display = 'flex';
        // Hide main layout scroll
        document.body.style.overflow = 'hidden';
    } else {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
};

window.loginAdmin = function() {
    const pass = document.getElementById('adminPass').value;
    if(pass === "19105887638Admin") {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').classList.remove('hidden');
        initAdminDashboard();
    } else {
        alert("Hatalı Şifre!");
    }
};

window.logoutAdmin = function() {
    window.location.hash = '';
};

// Global reference mapping for admin actions
window.globalUsersMap = {};

function initAdminDashboard() {
    // Listen for config
    onValue(ref(db, 'config'), (snapshot) => {
        const data = snapshot.val();
        if(data && data.publishWinners) {
            document.getElementById('publishToggle').checked = true;
        } else {
            document.getElementById('publishToggle').checked = false;
        }
    });

    // Listen for users
    onValue(ref(db, 'users'), (snapshot) => {
        const users = snapshot.val();
        const tbody = document.getElementById('adminTableBody');
        tbody.innerHTML = '';
        window.globalUsersMap = {}; // Reset

        if(!users) {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center py-8">Henüz katılımcı yok.</td></tr>';
            document.getElementById('totalUsers').innerText = '0';
            return;
        }

        const userArray = Object.entries(users).reverse(); // Newest first
        document.getElementById('totalUsers').innerText = userArray.length;

        userArray.forEach(([uid, u]) => {
            window.globalUsersMap[uid] = u;
            const dateStr = new Date(u.createdAt).toLocaleString('tr-TR', {day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit'});
            
            const tr = document.createElement('tr');
            tr.className = "hover:bg-white/5 transition";
            tr.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap">${dateStr}</td>
                <td class="px-6 py-4">
                    <div class="font-bold text-white">${u.name}</div>
                    <div class="text-xs text-gray-500">${u.isAnon ? 'Anonim: ' + u.alias : ''}</div>
                </td>
                <td class="px-6 py-4 text-snap font-medium">@${u.snapNick}</td>
                <td class="px-6 py-4 text-center">
                    ${u.waClicked ? '<i class="fa-solid fa-check text-green-500"></i>' : '<i class="fa-solid fa-xmark text-red-500"></i>'}
                </td>
                <td class="px-6 py-4">
                    <select onchange="updateUserStatus('${uid}', this.value)" class="bg-black border border-white/20 text-white text-sm rounded-lg focus:ring-snap focus:border-snap block w-full p-2 outline-none">
                        <option value="participant" ${u.status === 'participant' ? 'selected' : ''}>Katılımcı</option>
                        <option value="champion1" ${u.status === 'champion1' ? 'selected' : ''}>Şampiyon 1</option>
                        <option value="champion2" ${u.status === 'champion2' ? 'selected' : ''}>Şampiyon 2</option>
                        <option value="champion3" ${u.status === 'champion3' ? 'selected' : ''}>Şampiyon 3</option>
                        <option value="reserve1" ${u.status === 'reserve1' ? 'selected' : ''}>Yedek 1</option>
                        <option value="reserve2" ${u.status === 'reserve2' ? 'selected' : ''}>Yedek 2</option>
                        <option value="reserve3" ${u.status === 'reserve3' ? 'selected' : ''}>Yedek 3</option>
                    </select>
                </td>
                <td class="px-6 py-4 text-right">
                    <button onclick="openFpModal('${uid}')" class="bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold transition border border-white/10">Detaylar</button>
                </td>
            `;
            tbody.appendChild(tr);
        });
    });
}

window.updateUserStatus = async function(uid, newStatus) {
    try {
        await update(ref(db, `users/${uid}`), { status: newStatus });
        // UI updates automatically via onValue listener
    } catch(e) {
        alert("Güncelleme hatası: " + e.message);
    }
};

window.togglePublish = async function(isChecked) {
    try {
        await set(ref(db, 'config/publishWinners'), isChecked);
    } catch(e) {
        alert("Hata: " + e.message);
    }
};

window.openFpModal = function(uid) {
    const u = window.globalUsersMap[uid];
    if(!u || !u.fingerprint) return;

    const fp = u.fingerprint;
    const content = document.getElementById('fpModalContent');
    content.innerHTML = '';

    const sortedKeys = Object.keys(fp).sort((a,b) => parseInt(a) - parseInt(b));

    sortedKeys.forEach(k => {
        let val = fp[k];
        if (typeof val === 'boolean') val = val ? 'Evet / True' : 'Hayır / False';
        
        content.innerHTML += `
            <div class="bg-white/5 border border-white/5 p-3 rounded-xl mb-2 flex justify-between items-center gap-4">
                <span class="text-gray-400 text-sm font-medium whitespace-nowrap">${k.replace(/^[0-9]+_/, '')}</span>
                <span class="text-white text-sm font-mono text-right break-all">${val}</span>
            </div>
        `;
    });

    document.getElementById('fpModal').classList.remove('hidden');
    document.getElementById('fpModal').style.display = 'flex';
};

window.closeFpModal = function() {
    document.getElementById('fpModal').style.display = 'none';
};

