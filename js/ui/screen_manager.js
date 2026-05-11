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
        // --- YENİ: HARİTAYA DÖNÜLDÜĞÜNDE KİLİDİ AÇ VE BUTONLARI GÜNCELLE ---
        window.isMapNodeProcessing = false; 
        if (typeof updateAvailableNodes === 'function') {
            updateAvailableNodes(); 
        }
        // ------------------------------------------------------------------

        const mapDisp = document.getElementById('map-display');
        setTimeout(() => {
            if (window.GAME_MAP.currentNodeId === null) {
                if (mapDisp) mapDisp.scrollLeft = 0;
            } else {
                if (typeof movePlayerMarkerToNode === 'function') {
                    movePlayerMarkerToNode(window.GAME_MAP.currentNodeId, true);
                }
            }
            if (typeof drawAllConnections === 'function') drawAllConnections();
        }, 50); 
    }
	const mapCloseBtn = document.getElementById('close-map-preview');
	if (mapCloseBtn) {
    // Sadece previousScreenBeforeMap doluysa (yani bir yerden bakmaya geldiysek) X görünsün
    mapCloseBtn.style.display = (targetScreen === window.mapScreen && window.previousScreenBeforeMap) ? "flex" : "none";
	}
	
	window.updateLogVisibility();
};

window.updateLogVisibility = function() {
    const logWrapper = document.getElementById('combat-log-wrapper');
    const logTrigger = document.getElementById('combat-log-trigger');
    if (!logWrapper || !logTrigger) return;

    // Şu an aktif olan ekranı bul
    const activeScreen = document.querySelector('.screen.active');
    const isGameOver = (activeScreen === window.gameOverScreen);
    const isBattle = (activeScreen === window.battleScreen);

    // 1. ÖLÜM MODU TASARIM KONTROLÜ
    if (isGameOver) logWrapper.classList.add('death-mode');
    else logWrapper.classList.remove('death-mode');

    // 2. GÖRÜNÜRLÜK KARAR MEKANİZMASI
    if (!window.gameSettings.showLog || (!isGameOver && !isBattle)) {
        // Durum A: Ayarlardan kapalı VEYA Savaş/Ölüm dışında bir ekrandayız (Örn: Harita)
        logWrapper.style.display = "none";
        logTrigger.style.display = "none";
    } 
    else {
        // Durum B: Ayarlardan açık VE doğru ekrandayız
        if (window.isLogMinimized) {
            logWrapper.style.display = "none";
            logTrigger.style.display = "flex"; // Ok işareti (>) modunda
        } else {
            logWrapper.style.display = "block"; // Tam boy log modunda
            logTrigger.style.display = "none";
        }
    }
};

window.writeLog = function(message) {
    // 1. Konsola her zaman yaz (Debug için)
    console.log("[Oyun]: " + message.replace(/<[^>]*>?/gm, ''));

    // 2. Savaş Günlüğü Filtreleme
    const combatLogArea = document.getElementById('combat-log-area');
    if (!combatLogArea) return;

    // Sadece bu ikonlarla başlayan mesajları UI'a bas
    const allowedIcons = ['⚔️', '⚠️', '✨', '📿', '🛡️', '🧪', '💥', '💀', '☣️', '🔥', '🩸', '🧘', '🩹', '💚', '💫', '😓', '😫', '😱']; 

    // Mesajın bu ikonlardan biriyle başlayıp başlamadığını kontrol et
    const shouldDisplay = allowedIcons.some(icon => message.trim().startsWith(icon));

    if (shouldDisplay) {
        const entry = document.createElement('div');
        entry.className = 'log-entry';
        entry.innerHTML = message; // HTML etiketlerini (b, span) korur
        
        combatLogArea.appendChild(entry);

        // Otomatik olarak en aşağı kaydır (Yeni mesajı göster)
        combatLogArea.scrollTop = combatLogArea.scrollHeight;

        // Çok birikirse eski logları sil (Performans için max 30 satır)
        if (combatLogArea.childElementCount > 30) {
            combatLogArea.removeChild(combatLogArea.firstChild);
        }
    }
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
    closeInGameSettings(); // Modalı kapat
    
    // Ana menüye dönmek için (InitGame her şeyi sıfırlıyor zaten)
    if (typeof initGame === 'function') initGame();
    switchScreen(window.startScreen);
    
    writeLog("Ana menüye dönüldü.");
};

window.previousScreenBeforeMap = null; // Haritaya bakmadan önceki ekranı tutar

window.toggleMapPreview = function() {
    const activeScreen = document.querySelector('.screen.active');
    
    // Eğer şu an haritadaysak ve daha önce bir yerden geldiysek: Geri dön
    if (activeScreen === window.mapScreen) {
        if (window.previousScreenBeforeMap) {
            window.switchScreen(window.previousScreenBeforeMap);
            window.previousScreenBeforeMap = null;
        }
    } 
    // Haritada değilsek: Mevcut ekranı kaydet ve haritayı aç
    else {
        // Savaş ekranındayken haritaya bakmayı engelleyebiliriz (opsiyonel)
        if (activeScreen === window.battleScreen) return;

        window.previousScreenBeforeMap = activeScreen;
        window.switchScreen(window.mapScreen);
        
        // Loga bilgi ver
        const lang = window.getCombatLang();
        writeLog(`🗺️ ${lang.combat.log_map_preview || "Haritaya göz atılıyor..."}`);
    }
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
	const key = e.key.toLowerCase();
	// M tuşu ile haritaya bak (Savaşta değilsek)
    if (key === 'm') {
    window.toggleMapPreview();
	}

    // H tuşu ile Rehberi aç
    if (key === 'h' && isCharacterUIAllowed()) {
        window.openCodex();
    }
});