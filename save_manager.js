// save_manager.js - Kayıt Sistemi

const SAVE_KEY = "RPG_Adventure_SaveGame";

window.saveGame = function() {
	window.StatsManager.saveToProfile();
    try {
        const saveData = {
			
            hero: window.hero,
            GAME_MAP: window.GAME_MAP,
            saveDate: new Date().toISOString(),
            version: "0.0.5" // Oyun versiyonun
        };
        
        // Objesini yazıya (string) çevir ve tarayıcıya çivile
        localStorage.setItem(SAVE_KEY, JSON.stringify(saveData));
        
        writeLog("💾 Oyun başarıyla kaydedildi.");
        return true;
    } catch (error) {
        console.error("Kayıt hatası:", error);
        writeLog("❌ Kayıt başarısız!");
        return false;
    }
};

window.loadGame = function() {
    try {
        const rawData = localStorage.getItem(SAVE_KEY);
        if (!rawData) return false;

        const saveData = JSON.parse(rawData);

        // Verileri enjekte et
        if (saveData.hero) window.hero = saveData.hero;
        if (saveData.GAME_MAP) window.GAME_MAP = saveData.GAME_MAP;
		if (window.CalendarManager) window.CalendarManager.updateTownUI();

        // UI'ı tazele
        setTimeout(() => {
    if (typeof updateStats === 'function') updateStats();
    
    // Eğer kayıtlı bir harita varsa onu çiz (Yeni üretme!)
    if (window.GAME_MAP && window.GAME_MAP.nodes.length > 0) {
        if (typeof renderMap === 'function') {
            renderMap(); 
        }
    }

    // Oyuncuyu kaldığı yere taşı
    if (window.GAME_MAP.currentNodeId !== null) {
        if (typeof movePlayerMarkerToNode === 'function') {
            movePlayerMarkerToNode(window.GAME_MAP.currentNodeId, true);
        }
    }
}, 150);

        writeLog("📂 Kayıt başarıyla yüklendi.");
        return true;
    } catch (error) {
        console.error("Yükleme hatası:", error);
        return false;
    }
};

window.hasSaveGame = function() {
    return localStorage.getItem(SAVE_KEY) !== null;
};

window.deleteSave = function() {
    try {
        localStorage.removeItem(SAVE_KEY);
        console.log("🗑️ Permadeath Sistemi: Kayıt dosyası başarıyla imha edildi.");
        return true;
    } catch (e) {
        console.error("Kayıt silinemedi:", e);
        return false;
    }
};