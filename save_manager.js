// save_manager.js - Kayıt Sistemi

window.activeProfile = localStorage.getItem("RPG_Active_Profile_Name") || null;

window.saveGame = function() {
	if (!window.activeProfile) return false; // Profil seçili değilse kaydetme
	window.StatsManager.saveToProfile();
    try {
		
		const townEl = document.getElementById('town-screen');
        const isTownVisible = townEl && (townEl.classList.contains('active') || townEl.style.display === 'flex');
		
		// --- YENİ: ŞEHİR GÖRÜNÜRLÜK KONTROLÜ ---
        const cityEl = document.getElementById('city-screen');
        const isCityVisible = cityEl && (cityEl.classList.contains('active') || cityEl.style.display === 'flex');
        // ---------------------------------------
		
        const saveData = {
			
            hero: window.hero,
            GAME_MAP: window.GAME_MAP,
			compendiumData: window.StatsManager.currentRun,
            saveDate: new Date().toISOString(),
            version: "0.0.5", // Oyun versiyonun
			isInsideTown: isTownVisible, // Artık daha garantili
			isInsideCity: isCityVisible,
            currentTownMaster: window.currentTownMaster 
        };
        
		const profileKey = "RPG_Save_" + window.activeProfile;
        localStorage.setItem(profileKey, JSON.stringify(saveData));
        
        writeLog("💾 Oyun başarıyla kaydedildi.");
        return true;
    } catch (error) {
        console.error("Kayıt hatası:", error);
        writeLog("❌ Kayıt başarısız!");
        return false;
    }
};

window.loadGame = function(profileName = null) {
    const targetProfile = profileName || window.activeProfile;
    if (!targetProfile) return false;
    try {
        const profileKey = "RPG_Save_" + targetProfile;
        const rawData = localStorage.getItem(profileKey);
        if (!rawData) return false;

        const saveData = JSON.parse(rawData);

        // Verileri enjekte et
        if (saveData.hero) window.hero = saveData.hero;
        if (saveData.GAME_MAP) window.GAME_MAP = saveData.GAME_MAP;
		if (saveData.compendiumData) window.StatsManager.currentRun = saveData.compendiumData;
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

		window.activeProfile = targetProfile;
        localStorage.setItem("RPG_Active_Profile_Name", targetProfile);
        writeLog("📂 Kayıt başarıyla yüklendi.");
        return true;
    } catch (error) {
        console.error("Yükleme hatası:", error);
        return false;
    }
};

// --- GÜNCELLEME: PROFİLE DUYARLI KONTROL ---
window.hasSaveGame = function() {
    if (!window.activeProfile) return false;
    const profileKey = "RPG_Save_" + window.activeProfile;
    return localStorage.getItem(profileKey) !== null;
};

// --- GÜNCELLEME: PROFİLE DUYARLI SİLME ---
window.deleteSave = function() {
    if (!window.activeProfile) return false;
    try {
        const profileKey = "RPG_Save_" + window.activeProfile;
        localStorage.removeItem(profileKey);
        console.log(`🗑️ Permadeath Sistemi: ${window.activeProfile} adlı kahramanın kaydı imha edildi.`);
        return true;
    } catch (e) {
        console.error("Kayıt silinemedi:", e);
        return false;
    }
};