window.goldver = function(amount = 100) {
    hero.gold += amount;
    if (typeof updateGoldUI === 'function') updateGoldUI();
    writeLog(`💰 **Hile**: Hesabına ${amount} altın yatırıldı.`);
};

window.itemver = function(tier = 1) {
    const newItem = generateRandomItem(tier);
    const emptySlot = hero.inventory.indexOf(null);
    
    if (emptySlot !== -1) {
        hero.inventory[emptySlot] = newItem;
        renderInventory();
        writeLog(`🛠️ Hile: Tier ${tier} eşya üretildi.`);
    } else {
        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
		window.showAlert(lang.bag_full_msg);
		return;
    }
};

// Konsoldan test etmek için: window.forceMaster('alchemist') gibi çağırabilirsin.
window.forceMaster = function(type = 'blacksmith') {
    // type: 'blacksmith', 'alchemist' veya 'stable'
    window.currentTownMaster = type;
    
    // Eğer şu an haritadaysak, Town ekranına geçiş yap
    if (typeof enterTown === 'function') {
        enterTown();
    } else {
        switchScreen(townScreen);
    }
    
    console.log(`🛠️ Debug: Bu kasaba için ${type.toUpperCase()} usta olarak atandı.`);
};

window.brosver = function(tier = 1) {
    // 1. Rastgele broş üret (Generator'ı çağır)
    const newBrooch = generateRandomBrooch(tier);
    
    // 2. Çantada boş yer ara
    const emptySlot = hero.inventory.indexOf(null);
    
    if (emptySlot !== -1) {
        // 3. Eşyayı çantaya koy ve UI'ı tazele
        hero.inventory[emptySlot] = newBrooch;
        renderInventory();
        writeLog(`🛠️ Hile: Seviye ${tier} broş üretildi ve çantaya eklendi.`);
    } else {
        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
		window.showAlert(lang.bag_full_msg);
		return;
    }
};

window.enemyver = function(enemyName) {
    if (window.ENEMY_STATS[enemyName]) {
        // Eğer haritadaysak kilidi aç (failsafe)
        window.isMapNodeProcessing = false;
        
        // Savaş başlat
        startBattle(enemyName, false, false);
        writeLog(`🛠️ **Debug**: ${enemyName} zorla çağırıldı.`);
    } else {
        console.error("HATA: Bu isimde bir düşman datası bulunamadı!");
    }
};

window.eventver = function(eventId) {
    const evt = EVENT_POOL.find(e => e.id === eventId);
    if (evt) {
        // Eğer haritadaysak kilidi aç (failsafe)
        window.isMapNodeProcessing = false;
        
        // Event'i zorla başlat
        window.triggerRandomEvent(evt);
        writeLog(`🛠️ **Cheat**: ${eventId} eventi zorla çağırıldı.`);
    } else {
        console.error("HATA: Bu ID'ye sahip bir event bulunamadı!");
        console.log("Mevcut Eventler:", EVENT_POOL.map(e => e.id));
    }
};

window.bossayaklas = function() {
    // 1. Hedef Aşamayı Belirle (Boss Stage - 2'dir, biz Stage - 3'e yani bir önüne gidiyoruz)
    const targetStage = MAP_CONFIG.totalStages - 3; 
    
    // 2. O aşamadaki ilk uygun odayı bul
    const targetNode = GAME_MAP.nodes.find(n => n.stage === targetStage);
    
    if (!targetNode) {
        console.error("HATA: Hedef aşamada oda bulunamadı!");
        return;
    }

    // 3. Karakteri Işınla
    GAME_MAP.currentNodeId = targetNode.id;
    
    // Geçmişteki yolları "tamamlanmış" olarak işaretle (Çizgilerin kırılmaması için)
    GAME_MAP.completedNodes = GAME_MAP.nodes
        .filter(n => n.stage < targetStage)
        .map(n => n.id);
    GAME_MAP.completedNodes.push(targetNode.id);

    // 4. Zamanı Boss için "Normal" seviyeye ayarla (25. Gün)
    // Bu sayede Boss ne çok güçlü (penalty) ne çok zayıf (bonus) olur.
    hero.calendar.daysPassed = 25;

    // 5. UI ve Haritayı Güncelle
    window.isMapNodeProcessing = false; // Kilit varsa aç
    if (typeof movePlayerMarkerToNode === 'function') {
        movePlayerMarkerToNode(targetNode.id, true); // Anında ışınla
    }
    
    if (typeof renderMap === 'function') renderMap();
    updateStats();
    
    writeLog("🌀 **Hile**: Boss kapısına ışınlandın! Zaman dengelendi (25. Gün).");
};

window.haritayiAc = function() {
    // 1. Hile bayrağını aktif et (Mekanik kilidi açar)
    window.isCheatMapOpen = true;
    window.isMapNodeProcessing = false; // Tıklama kilidi varsa aç

    // 2. Tüm node butonlarını bul ve "Işınlanma" moduna sok
    const nodes = document.querySelectorAll('.map-node');
    nodes.forEach(btn => {
        btn.disabled = false;           // Tıklanabilir yap
        btn.classList.add('available'); // Görsel olarak aktif yap
        
        // Biyom resimlerini görünür yap (Sis perdesini kaldır)
        // CSS'deki .available::before kuralı sayesinde otomatik görünürler
    });

    // 3. Dile duyarlı log bas
    const lang = window.getCombatLang();
    if (lang && lang.combat && lang.combat.log_cheat_map) {
        writeLog(lang.combat.log_cheat_map);
    }

    console.log("🗺️ Harita Sırları Açıldı: Artık her odaya tıklayarak ışınlanabilirsin.");
};

window.olayVer = function(eventKey) {
    if (!window.monster) {
        console.error("HATA: Sadece savaş sırasında oda olayı tetiklenebilir!");
        return;
    }

    const lang = window.getCombatLang();
    const possibleEvents = ["none", "reinforcement", "wind", "horde", "kings_path", "storm"];
    
    if (!possibleEvents.includes(eventKey)) {
        console.warn("Geçersiz Olay! Şunları deneyin:", possibleEvents.join(", "));
        return;
    }

    // 1. Mevcut Oda Olayını Güncelle
    monster.roomEvent = eventKey;

    // 2. UI ve Banner'ı Tetikle
    window.showRoomEventBanner(eventKey);

    // 3. ANLIK MEKANİK TETİKLEYİCİLERİ
    if (eventKey === "reinforcement") {
        const bonus = Math.floor(Math.random() * 5) + 1;
        monster.attack += bonus;
        applyStatusEffect(hero, { id: 'atk_up', name: 'Takviye', value: bonus, turns: 99, resetOnCombatEnd: true });
        writeLog("🪄 **Hile**: Büyüsel Takviye anında uygulandı.");
    } 
    else if (eventKey === "kings_path") {
        hero.calendar.daysPassed = Math.max(0, hero.calendar.daysPassed - 1);
        updateStats();
        writeLog("👑 **Hile**: Kral Yolu bulundu, zaman 1 gün geri sarıldı.");
    }

    writeLog(`🛠️ **Cheat**: Oda olayı '${eventKey}' olarak değiştirildi.`);
};

window.stormDmgCheat = undefined; // Başlangıçta hile kapalı

window.firtinaGucu = function(val) {
    // val: vurmasını istediğin ham hasar miktarı (Örn: 10)
    window.stormDmgCheat = val;
    
    if (val > 0) {
        writeLog(`🛠️ **Hile**: Biyom fırtınası gücü '${val}' olarak ayarlandı. (Zırhınla düşecektir)`);
    } else {
        window.stormDmgCheat = undefined; // 0 yazarsan hileyi kapatır, Act kuralına döner
        writeLog(`🛠️ **Hile**: Fırtına gücü normale (Act bazlı) döndürüldü.`);
    }
};

window.odaver = function(bgName) {
    const battleScreenEl = document.getElementById('battle-screen');
    
    if (!battleScreenEl) {
        console.error("HATA: Savaş ekranı (battle-screen) bulunamadı!");
        return;
    }

    // bgName: "plains1", "forest4", "cave2" gibi gelmeli
    // Senin sistemindeki dosya yolu: images/utils/battlebg/biyom+numara.webp
    const fullPath = `images/utils/battlebg/${bgName.toLowerCase()}.webp`;

    // Arka planı değiştir
    battleScreenEl.style.backgroundImage = `url('${fullPath}')`;

    // Konsola ve Log'a bilgi bas
    console.log(`🛠️ Debug: Savaş arka planı '${bgName}' olarak değiştirildi.`);
    
    // Eğer şu an savaş ekranında değilsek bir uyarı verelim
    if (!battleScreenEl.classList.contains('active')) {
        writeLog(`⚠️ **Hile**: Arka plan değiştirildi ama şu an savaşta değilsin!`);
    } else {
        writeLog(`🖼️ **Hile**: Savaş alanı '${bgName}' olarak değiştirildi.`);
    }
};

window.itemtier = function(val) {
    if (val < 1) val = 1;
    hero.highestTierDefeated = val;
    writeLog(`🌟 **Hile**: En yüksek yenilen düşman seviyesi ${val} olarak ayarlandı. (Dükkanlar etkilenecek)`);
    
    // Dükkan stoklarını anında yenilemek istersen:
    if (typeof refreshMerchantStock === 'function') refreshMerchantStock(8);
};

window.scoutver = function() {
    if (!window.GAME_MAP || window.GAME_MAP.nodes.length === 0) {
        console.error("HATA: Harita henüz oluşturulmamış!");
        return;
    }

    const lang = window.getCombatLang();
    // Kaydırılabilir şık bir kapsayıcı oluşturuyoruz
    let report = "<div style='text-align: left; font-family: \"Cinzel\", serif; max-height: 450px; overflow-y: auto; padding-right: 10px; -ms-overflow-style: none; scrollbar-width: none;'>";

    // Tüm aşamaları (0'dan son aşamaya kadar) tara
    for (let s = 0; s < MAP_CONFIG.totalStages; s++) {
        const nodesInStage = window.GAME_MAP.nodes.filter(n => n.stage === s);
        
        if (nodesInStage.length > 0) {
            report += "<div style='margin-bottom: 10px; border-bottom: 1px solid rgba(255,215,0,0.2); padding-bottom: 5px;'>";
            report += "<strong style='color: #ffd700;'>" + lang.scout_stage + " " + (s + 1) + ":</strong><br>";
            
            nodesInStage.forEach(node => {
                const isVisited = window.GAME_MAP.completedNodes.includes(node.id);
                const isCurrent = GAME_MAP.currentNodeId === node.id;
                const style = isVisited ? "text-decoration: line-through; opacity: 0.5;" : "";
                
                let displayTitle = lang["node_" + node.type] || node.type;
                let color = isVisited ? "#777" : "#bbb";

                if (isCurrent) { color = "#ffd700"; displayTitle += " [BURADASIN]"; }

                // --- YENİ: TIER ETİKETİ (GÜVENLİ YAZIM) ---
                // SİLME YAPILMADI: Mantık eklendi, tırnak hataları giderildi.
                let tierLabel = "";
                if (node.type === 'encounter' || node.type === 'start') {
                    let tText = "T" + node.tier;
                    if (node.isHalfTier) tText += ".5";
                    if (node.isHard) tText += " <span style='color:#ff4d4d'>+25%</span>";
                    if (node.isWeak) tText += " <span style='color:#43FF64'>-20%</span>";
                    
                    tierLabel = " <small style='color:#666;'>(" + tText + ")</small>";
                }
                // ------------------------------------------

                if (node.type === 'encounter') {
                    const enemyName = lang.enemy_names[node.enemyName] || node.enemyName;
                    displayTitle = enemyName;
                    if(!isVisited) color = "#ff4d4d";
                }

                let biomeInfo = "";
                if (node.biome) {
                    const biomeLabel = lang.items["biome_" + node.biome] || node.biome;
                    biomeInfo = " <span style='color: " + (isVisited ? '#555' : '#43FF64') + "; font-size: 0.8em;'>(" + biomeLabel + ")</span>";
                }

                let roomEventInfo = "";
                const isCombat = (node.type === 'encounter' || node.type === 'boss' || node.type === 'start');
                if (isCombat) {
                    const eventKey = node.roomEvent || "none";
                    const eventLabel = lang.room_events["event_" + eventKey] || eventKey;
                    roomEventInfo = " <span style='color: " + (isVisited ? '#555' : '#df9cff') + "; font-size: 0.8em;'>[" + eventLabel + "]</span>";
                }

                // Satır birleştirme (Unexpected token hatasını önleyen temiz yapı)
                report += "<span style='font-size: 0.85em; margin-left: 10px; color: " + color + "; " + style + "'>• " + displayTitle + tierLabel + biomeInfo + roomEventInfo + "</span><br>";
            });
            report += "</div>";
        }
    }
    report += "</div>";

    window.showGameInfo(lang.full_scout_title, report, "#9b59b6");
    writeLog(lang.log_cheat_scout);
};

window.sehreGit = function() {
    // 1. Şehir için gerekli dükkan ayarlarını yap
    window.isBroochTrade = false;
    window.currentMerchantDiscount = 1.0;
    
    // 2. 12 slotluk Şehir stoğunu üret
    if (typeof refreshMerchantStock === 'function') {
        refreshMerchantStock(12);
    }

	
    // 3. Şehir ekranına geçiş yap
    if (typeof enterCity === 'function') {
        enterCity();
    } else {
        switchScreen(window.cityScreen);
    }

    writeLog("🌀 **Hile**: Eldoria şehrine ışınlandın ve Ulu Tüccar hazırlandı.");
    console.log("🛠️ Debug: Şehir moduna 12 slotluk stokla geçiş yapıldı.");
};
