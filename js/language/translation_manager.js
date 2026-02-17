// js/language/translation_manager.js

// Beklemeden direkt dilleri birleştir
window.LANGUAGES = {
    tr: window.LANG_TR || {},
    en: window.LANG_EN || {}
};

console.log("Translation Manager: Diller anlık olarak belleğe alındı.");

// Opsiyonel: Eski isimlendirmeyi korumak için kontrol fonksiyonu
window.getLang = () => window.LANGUAGES[window.gameSettings.lang || 'tr'];