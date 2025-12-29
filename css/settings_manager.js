// js/ui/settings_manager.js

window.gameSettings = {
    lang: localStorage.getItem('game_lang') || 'tr',
    resolution: localStorage.getItem('game_res') || 'fit'
};

window.applySettings = function() {
    // 1. Dili Uygula
    localStorage.setItem('game_lang', window.gameSettings.lang);
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
    
    // HTML'de data-i18n niteliği olan her şeyi bul ve güncelle
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.dataset.i18n;
        if (lang[key]) {
            el.textContent = lang[key];
        }
    });
}