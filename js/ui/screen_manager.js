// js/ui/screen_manager.js

window.isCharacterUIAllowed = function() {
    const forbidden = [startScreen, nameEntryScreen, starterCityScreen, classSelectionScreen, cutsceneScreen, basicSkillSelectionScreen, gameOverScreen];
    const active = document.querySelector('.screen.active');
    return !forbidden.includes(active);
};

window.updateGoldUI = function() {
    const goldText = document.getElementById('inv-gold-text');
    if(goldText) goldText.textContent = hero.gold;
    if(topHeroName) topHeroName.textContent = hero.playerName;
    if(topHeroLevel) topHeroLevel.textContent = `(Lv.${hero.level})`;
	if(typeof updateNPCStatsDisplay === 'function') updateNPCStatsDisplay();
};

window.switchScreen = function(targetScreen) {
    const screens = [startScreen, nameEntryScreen, starterCityScreen, classSelectionScreen, cutsceneScreen, mapScreen, battleScreen, gameOverScreen, campfireScreen, eventScreen, rewardScreen, townScreen, cityScreen, basicSkillSelectionScreen];
    const topBar = document.getElementById('top-info-bar');
    const mainArea = document.getElementById('main-screen-area');

    // Üst Bar Gizleme
    const isHiddenBar = [startScreen, cutsceneScreen, gameOverScreen].includes(targetScreen);
    if(topBar) topBar.classList.toggle('hidden', isHiddenBar);
    if(mainArea) {
        mainArea.style.top = isHiddenBar ? "0" : "40px";
        mainArea.style.height = isHiddenBar ? "100%" : "calc(100% - 40px)";
    }

    screens.forEach(s => {
        if (!s) return;
        if (s === targetScreen) {
            s.classList.remove('hidden');
            s.classList.add('active');
            s.style.display = "flex";
        } else {
            s.classList.remove('active');
            s.classList.add('hidden');
            s.style.display = "none";
        }
    });

    // Menüleri her geçişte zorla kapat
    if (inventoryScreen) inventoryScreen.classList.add('hidden');
    if (statScreen) statScreen.classList.add('hidden');
    if (skillBookScreen) skillBookScreen.classList.add('hidden');

    if (targetScreen === mapScreen) {
        const mapDisp = document.getElementById('map-display');
        
        // Ekran display: flex olduktan hemen sonra (50ms) bu kodu çalıştır
        setTimeout(() => {
            if (window.GAME_MAP.currentNodeId === null) {
                // Eğer yeni bir oyunsa veya sıfırlanmışsa ZORLA en başa çek
                if (mapDisp) mapDisp.scrollLeft = 0;
            } else {
                // Eğer bir kayıttan geliyorsa kaldığı yere odakla
                if (typeof movePlayerMarkerToNode === 'function') {
                    movePlayerMarkerToNode(window.GAME_MAP.currentNodeId, true);
                }
            }
            
            if (typeof drawAllConnections === 'function') drawAllConnections();
        }, 50); // 50ms, tarayıcının ekranı çizmesi için yeterli, göz için anlıktır.
    }
};

window.writeLog = function(message) {
    console.log("[Oyun]: " + message.replace(/<[^>]*>?/gm, ''));

};

// Oyun içi ayarlar menüsünü aç
window.openInGameSettings = function() {
    document.getElementById('in-game-menu-modal').classList.remove('hidden');
};

// Menüyü kapat (Devam Et)
window.closeInGameSettings = function() {
    document.getElementById('in-game-menu-modal').classList.add('hidden');
};

// Kaydet ve Ana Menüye Dön
window.saveAndExitToMenu = function() {
    if (window.saveGame) {
        window.saveGame(); // Önce kaydet
    }
    
    closeInGameSettings(); // Modalı kapat
    
    // Ana menüye dönmek için (InitGame her şeyi sıfırlıyor zaten)
    if (typeof initGame === 'function') initGame();
    switchScreen(window.startScreen);
    
    writeLog("💾 Oyun kaydedildi ve ana menüye dönüldü.");
};

// ESC Tuşuna basınca menüyü aç/kapat (Kullanım kolaylığı)
document.addEventListener('keydown', (e) => {
    if (e.key === "Escape") {
        const settingsModal = document.getElementById('settings-modal');
        const inGameMenu = document.getElementById('in-game-menu-modal');

        // 1. Eğer en üstteki Ayarlar açıksa, önce onu kapat
        if (!settingsModal.classList.contains('hidden')) {
            closeSettings();
            return;
        }

        // 2. Ayarlar kapalıysa ve oyun içindeysek Duraklat Menüsünü aç/kapat
        if (!startScreen.classList.contains('active')) {
            if (inGameMenu.classList.contains('hidden')) {
                openInGameSettings();
            } else {
                closeInGameSettings();
            }
        }
    }
});