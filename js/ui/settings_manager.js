// js/ui/settings_manager.js

window.gameSettings = {
    lang: localStorage.getItem('game_lang') || 'tr',
    resolution: localStorage.getItem('game_res') || 'fit',
    // Varsayılan olarak true (açık) kabul et
    showNotifs: localStorage.getItem('game_notifs') !== 'false', 
	showImpacts: localStorage.getItem('game_impacts') !== 'false',
	showLog: localStorage.getItem('game_log_visible') !== 'false' // Varsayılan true
};

window.applySettings = function() {
	
	const logToggle = document.getElementById('setting-log-toggle');
	if (logToggle) logToggle.checked = window.gameSettings.showLog;

	const logWrapper = document.getElementById('combat-log-wrapper');
	const logTrigger = document.getElementById('combat-log-trigger');

	if (window.gameSettings.showLog) {
		if(logWrapper) logWrapper.style.display = "block";
		if(logTrigger) logTrigger.style.display = "none";
	} else {
		if(logWrapper) logWrapper.style.display = "none";
		if(logTrigger) logTrigger.style.display = "flex"; // Kapalıysa ok görünsün
	}
	
    // 1. Dili Uygula
    localStorage.setItem('game_lang', window.gameSettings.lang);
    document.documentElement.lang = window.gameSettings.lang;
    document.body.className = `lang-${window.gameSettings.lang}`;
    updateUITexts();

    // 2. Çözünürlüğü Uygula
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

    // 3. Toggle Durumunu UI'da Güncelle (Checkbox'ı işaretle/kaldır)
    const notifToggle = document.getElementById('setting-notif-toggle');
    if (notifToggle) {
        notifToggle.checked = window.gameSettings.showNotifs;
    }
	
	// Ayarları uygulama fonksiyonuna (applySettings) şu satırı ekle:
	const impactToggle = document.getElementById('setting-impact-toggle');
	if (impactToggle) impactToggle.checked = window.gameSettings.showImpacts;

    // Değişiklikten sonra bildirimleri hemen güncelle
    if (typeof updateStats === 'function') updateStats();
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
        const key = el.dataset.i18n;
        
        // Eğer anahtar düz bir anahtarsa (örn: invest_gold_hint)
        if (lang[key]) {
            el.textContent = lang[key];
        } 
        // Eğer anahtar items içindeyse (Opsiyonel: data-i18n="items.name" yaparsan)
        else if (key.includes('.') && lang.items) {
             const subKey = key.split('.')[1];
             if(lang.items[subKey]) el.textContent = lang.items[subKey];
        }
    });
}

// Yeni toggle fonksiyonunu en alta ekle:
window.setImpactEffectsToggle = function(val) {
    window.gameSettings.showImpacts = val;
    localStorage.setItem('game_impacts', val);
};
window.setCombatLogSetting = function(val) {
    window.gameSettings.showLog = val;
    localStorage.setItem('game_log_visible', val);
    window.applySettings(); // UI'ı tazele
};
window.enableAndOpenCombatLog = function() {
    // 1. Ayarı kalıcı olarak true yap (Settings'deki toggle da otomatik güncellenir)
    window.setCombatLogSetting(true);
    
    // 2. Log kutusunun 'collapsed' sınıfını silerek açık gelmesini sağla
    const wrapper = document.getElementById('combat-log-wrapper');
    if (wrapper) {
        wrapper.classList.remove('collapsed');
    }
    
    const lang = window.getCombatLang();
    
    if (lang && lang.combat && lang.combat.log_combat_log_enabled) {
        writeLog(lang.combat.log_combat_log_enabled);
    }
};