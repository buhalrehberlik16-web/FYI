// js/ui/settings_manager.js

window.gameSettings = {
    lang: localStorage.getItem('game_lang') || 'tr',
    resolution: localStorage.getItem('game_res') || 'fit',
    // Varsayılan olarak true (açık) kabul et
    showNotifs: localStorage.getItem('game_notifs') !== 'false', 
	showImpacts: localStorage.getItem('game_impacts') !== 'false',
	showLog: localStorage.getItem('game_log_visible') !== 'false',
	showGuide: localStorage.getItem('game_guide_visible') !== 'false' // Varsayılan true
};

window.applySettings = function() {
	
	// 1. Dili Uygula
    localStorage.setItem('game_lang', window.gameSettings.lang);
    document.documentElement.lang = window.gameSettings.lang;
    document.body.className = `lang-${window.gameSettings.lang}`;
    updateUITexts();

    // 2. Çözünürlük Uygula (Mevcut kodun aynı kalıyor)
    const container = document.getElementById('game-container');
    localStorage.setItem('game_res', window.gameSettings.resolution);
    if (window.gameSettings.resolution === 'fit') {
        container.style.width = '95%';
        container.style.height = '90vh';
        container.style.maxWidth = '1400px';
    } else {
        const [w, h] = window.gameSettings.resolution.split('x');
        container.style.width = w + 'px';
        container.style.height = h + 'px';
        container.style.maxWidth = 'none';
    }

    // 3. Toggle Checkboxlarını Güncelle
    const logToggle = document.getElementById('setting-log-toggle');
    if (logToggle) logToggle.checked = window.gameSettings.showLog;

    const notifToggle = document.getElementById('setting-notif-toggle');
    if (notifToggle) notifToggle.checked = window.gameSettings.showNotifs;
	
	const impactToggle = document.getElementById('setting-impact-toggle');
	if (impactToggle) impactToggle.checked = window.gameSettings.showImpacts;
	
	// 4.
	const guideToggle = document.getElementById('setting-guide-toggle');
	if (guideToggle) guideToggle.checked = window.gameSettings.showGuide;

	const guideBtn = document.getElementById('btn-open-codex');
	if (guideBtn) {
    // Ayar kapalıysa butonu komple yok et, açıysa göster
    guideBtn.style.display = window.gameSettings.showGuide ? "flex" : "none";
	}

    // --- YENİ: MERKEZİ GÖRÜNÜRLÜK KONTROLÜNÜ ÇAĞIR ---
    if (typeof window.updateLogVisibility === 'function') {
        window.updateLogVisibility();
    }

    if (typeof updateStats === 'function') updateStats();
};

window.setGuideSetting = function(val) {
    window.gameSettings.showGuide = val;
    localStorage.setItem('game_guide_visible', val);
    window.applySettings(); // Ayarları anında uygula (updateUITexts ve buton gizleme tetiklenir)
};

window.setNotificationToggle = function(val) {
    window.gameSettings.showNotifs = val;
    localStorage.setItem('game_notifs', val);
    // Hemen etkisini göster
    updateStats();
};

window.setLanguage = function(langCode) {
    window.gameSettings.lang = langCode;
    window.applySettings();
};

window.setResolution = function(resString) {
    window.gameSettings.resolution = resString;
    window.applySettings();
};

function updateUITexts() {
    const lang = window.LANGUAGES[window.gameSettings.lang];
    if (!lang) return; // Dil verisi henüz yüklenmediyse çık

    // Input placeholder'ı güncelle
    const nickInput = document.getElementById('player-nick-input');
    if(nickInput) nickInput.placeholder = lang.profile_placeholder;
    
    // HTML'deki tüm data-i18n niteliklerini tara ve değiştir
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const path = el.dataset.i18n;
        
        /// --- YENİ AKILLI ARAMA MANTIĞI ---
        // "codex.title" yazısını parçalar ve lang["codex"]["title"] değerine ulaşır
        const keys = path.split('.');
        let translatedText = lang;

        keys.forEach(key => {
            if (translatedText) translatedText = translatedText[key];
        });

        if (translatedText) {
            // Eğer element bir input ise placeholder'ını, değilse textContent'ini değiştir
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translatedText;
            } else {
                el.textContent = translatedText;
            }
        }
    });
}

// Yeni toggle fonksiyonunu en alta ekle:
window.setImpactEffectsToggle = function(val) {
    window.gameSettings.showImpacts = val;
    localStorage.setItem('game_impacts', val);
};

// Logun küçültülüp küçültülmediğini tutan değişken (Başlangıçta açık başlasın)
window.isLogMinimized = false; 

// 1. Log Başlığına (Header) Basınca: Ayarı bozma, sadece küçült (>)
window.toggleCombatLog = function() {
    window.isLogMinimized = true; // Sadece modu değiştir
    window.applySettings(); // Görseli güncelle
};

// 2. Soldaki Ok (>) işaretine Basınca: Tekrar genişlet
window.enableAndOpenCombatLog = function() {
    window.isLogMinimized = false; // Küçültme modundan çık
    window.applySettings(); // Görseli güncelle
};

// 3. Ayarlardaki Toggle Değişince (Master Switch)
window.setCombatLogSetting = function(val) {
    window.gameSettings.showLog = val;
    localStorage.setItem('game_log_visible', val);
    
    // Eğer ayarlardan tekrar açılırsa, otomatik olarak "geniş" modda gelsin
    if (val) window.isLogMinimized = false; 
	// Loga bilgi mesajı düş
    //const lang = window.getCombatLang();
    //if (lang && lang.combat.log_combat_log_enabled) {
    //    writeLog(lang.combat.log_combat_log_enabled);
    //}

    window.applySettings(); 
};