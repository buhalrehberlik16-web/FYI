// main.js - FİNAL VE HATASIZ SÜRÜM

window.starterCityProgress = {
    classChosen: false,
    skillsChosen: false
};

window.openStarterActivity = function(type) {
    // Mevcut dili al
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    if (type === 'barracks') {
        switchScreen(window.classSelectionScreen);
    } else if (type === 'elder') {
        if (!window.starterCityProgress.classChosen) {
            // Hardcoded alert yerine dilden çekiyoruz
            alert(lang.choose_class_first || "Önce kışladan bir sınıf seçmelisin!");
            return;
        }
        openBasicSkillSelection(); 
    }
};

window.updateStarterCityUI = function() {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    const leaveBtn = document.getElementById('btn-leave-starter-city');
    const msgEl = document.getElementById('starter-city-msg');
    
    // Lambaları güncelle
    document.getElementById('status-barracks').style.background = window.starterCityProgress.classChosen ? "#43FF64" : "#ff4d4d";
    document.getElementById('status-elder').style.background = window.starterCityProgress.skillsChosen ? "#43FF64" : "#ff4d4d";

    // Mesajları dilden çek
    if (!window.starterCityProgress.classChosen) {
        msgEl.textContent = lang.starter_step_1;
    } else if (!window.starterCityProgress.skillsChosen) {
        msgEl.textContent = lang.starter_step_2;
    } else {
        msgEl.textContent = lang.starter_ready;
        leaveBtn.classList.remove('hidden');
        leaveBtn.textContent = lang.leave_starter_city; // Buton yazısını da dilden güncelle
    }
};

window.leaveStarterCity = function() {
    writeLog("Maceran başlıyor...");
    generateMap(); 
    switchScreen(window.mapScreen);
};

function levelUp() {
    if (hero.level >= MAX_LEVEL) return; 
    
    hero.level++;
    hero.maxHp += 5; 
    hero.hp = Math.min(hero.maxHp, hero.hp + 20); 
    hero.attack += 1; 
    hero.maxRage += 0;
    
    hero.statPoints += 4; // Stat puanı sabit 3 kalsın (veya değiştirebilirsin)
    
    // --- YENİ SKILL PUANI MANTIĞI ---
    // Tabloda bu level için özel bir ödül var mı?
    // Varsa onu ver, yoksa 0 (veya 1) ver.
    const spGain = LEVEL_SKILL_REWARDS[hero.level] || 0; // Tabloda yoksa 0 verir
    
    hero.skillPoints += spGain;
    // --------------------------------
    
    hero.xp = hero.xp - FULL_XP_REQUIREMENTS[hero.level - 1]; 
    hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level] || Infinity; 
    
    writeLog(`⬆️ **SEVİYE ATLADIN!** (Lv. ${hero.level}) - Kazanılan SP: ${spGain}`);
    updateStats(); 
    triggerLevelUpEffect();
}

function increaseStat(statName) {
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    if (isInBattle) { writeLog("❌ Savaş sırasında stat puanı dağıtamazsın!"); return; }

     if (hero.statPoints > 0) {
        hero.statPoints--;
        
        // Sadece temel statı artır, çarpanları getHeroEffectiveStats halledecek
        if (statName === 'str') hero.str++;
        else if (statName === 'dex') hero.dex++;
        else if (statName === 'int') hero.int++;
        else if (statName === 'mp_pow') hero.mp_pow++;
        else if (statName === 'vit') { 
            hero.vit++;
			const stats = getHeroEffectiveStats();
            if (hero.hp > stats.maxHp) hero.hp = stats.maxHp;
        }
        
        updateStats(); // Bu fonksiyon barları ve renkleri yeni statlara göre tazeler
    }
}

// YETENEK ÖĞRENME
function learnSkill(skillKey) {
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    if (isInBattle) { writeLog("❌ Savaş sırasında yetenek öğrenemezsin!"); return; }

    const skill = SKILL_DATABASE[skillKey];
    if (!skill) return;

    // Skill Tree Kontrolü
    if (typeof checkSkillTreeRequirement === 'function') {
        if (!checkSkillTreeRequirement(skill.data.category, skill.data.tier)) {
            writeLog(`❌ Önce bu sınıfta **Tier ${skill.data.tier - 1}** bir yetenek açmalısın!`);
            return;
        }
    }

    const cost = skill.data.pointCost !== undefined ? skill.data.pointCost : (skill.data.tier || 1);
	
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const skillName = lang.skills[skillKey]?.name || skill.data.name;


    if (hero.skillPoints >= cost) {
        hero.skillPoints -= cost;
        hero.unlockedSkills.push(skillKey);
        
        writeLog(`📖 Yeni Yetenek Öğrenildi: **${skill.data.name}**`);
        
        // --- PASİF YETENEK KONTROLÜ ---
        if (skill.data.type === 'passive') {
            if (typeof skill.data.onAcquire === 'function') {
                skill.data.onAcquire();
            }
        } 
        else {
            // --- AKTİF YETENEK OTOMATİK KUŞANMA ---
            const emptySlotIndex = hero.equippedSkills.indexOf(null);
            
            if (emptySlotIndex !== -1) {
                hero.equippedSkills[emptySlotIndex] = skillKey;
                writeLog(`⚙️ **${skill.data.name}** otomatik olarak ${emptySlotIndex + 1}. slota yerleşti.`);
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
                if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
            }
        }

        if (typeof renderSkillBookList === 'function') renderSkillBookList();
        const spDisplay = document.getElementById('skill-points-display');
        if(spDisplay) spDisplay.textContent = hero.skillPoints;
		updateStats();
        
    } else {
        writeLog("❌ Yetersiz Skill Puanı!");
    }
}

// AĞAÇ KONTROLÜ
function checkSkillTreeRequirement(category, tier) {
    if (tier === 1) return true;
    const requiredTier = tier - 1;
    return hero.unlockedSkills.some(unlockedKey => {
        const dbSkill = SKILL_DATABASE[unlockedKey];
        if (!dbSkill) return false;
        return dbSkill.data.category === category && dbSkill.data.tier === requiredTier;
    });
}

function gainXP(amount) {
    if (hero.level >= MAX_LEVEL) return;
    hero.xp += amount;
    writeLog(`🌟 ${amount} XP kazanıldı.`);
    while (hero.xp >= hero.xpToNextLevel) {
        levelUp();
        if (hero.level >= MAX_LEVEL) break; 
    }
    updateStats(); 
}

function triggerLevelUpEffect() {
    const container = document.getElementById('hero-display');
    if (!container) return;
    const halo = document.createElement('div');
    halo.className = 'levelup-halo';
    container.appendChild(halo);
    if (typeof showFloatingText === 'function') {
        setTimeout(() => {
            showFloatingText(container, "LEVEL UP!", "heal"); 
        }, 200);
    }
    setTimeout(() => { halo.remove(); }, 2000);
}

// 2. Sınıf Seçme Fonksiyonu:
function selectClass(className) {
    const config = CLASS_CONFIG[className];
    if (!config) return;

    hero.class = className;
	StatsManager.initNewRun(hero.playerName, className); // İstatistikleri sıfırla ve başlat

    // 1. Temel Statları Kopyala
    for (const [stat, value] of Object.entries(config.startingStats)) {
        hero[stat] = value;
    }

    // 2. Dirençleri Kopyala (ESKİDEN BURASI EKSİKTİ)
    hero.baseResistances = { ...config.startingResistances };

    // 3. Element Hasarlarını Kopyala (BURASI DA EKSİKTİ)
    hero.elementalDamage = { ...config.startingElementalDamage };

    // 4. Canı ve Kaynakları Sıfırla/Hesapla
    hero.rage = 0; // Herkes 0 öfke ile başlar

    writeLog(`⚔️ Sınıf Seçildi: ${className}. Statlar ve dirençler yüklendi.`);
    
    // UI'ı hemen güncelle (Özellikle U ekranındaki direnç kutuları dolsun)
    updateStats(); 
    
    // DEĞİŞEN KISIM:
    window.starterCityProgress.classChosen = true;
    switchScreen(window.starterCityScreen); // Şehre geri dön
    updateStarterCityUI();
}


function startCutscene() {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    switchScreen(cutsceneScreen);
    cutsceneText.textContent = lang.descending_dungeons;
    
    let timer1 = null; let timer2 = null;
    
    function transitionToCity() {
        if (timer1) clearTimeout(timer1); 
        if (timer2) clearTimeout(timer2);
        
        skipCutsceneButton.onclick = null;
        
        // Şehre geçiş yap (screen_manager'da artık listede olduğu için çalışacak)
        switchScreen(window.starterCityScreen);
        if(window.updateStarterCityUI) window.updateStarterCityUI(); 
        writeLog("Başlangıç şehrine ulaşıldı."); 
    }
    
    skipCutsceneButton.onclick = transitionToCity;
    
    timer1 = setTimeout(() => {
        cutsceneText.textContent = lang.map_loading;
        timer2 = setTimeout(() => { transitionToCity(); }, 1500);
    }, 2000);
}


window.addItemToInventory = function(item, amount = 1) {
    // 1. Stackable kontrolü
    if (item.isStack) {
        // Çantada aynı isimde/ID'de başka bir stack var mı?
        const existingStack = hero.inventory.find(i => i && i.nameKey === item.nameKey);
        
        if (existingStack) {
            existingStack.count += amount;
            return true; // Mevcut stack'e eklendi
        }
    }

    // 2. Eğer stackable değilse veya mevcut stack yoksa, boş slot bul
    for (let i = 0; i < hero.inventory.length; i++) {
        if (hero.inventory[i] === null) {
            item.count = amount; // İlk miktar
            hero.inventory[i] = item;
            return true; // Boş slot bulundu
        }
    }

    return false; // Çanta dolu
};

// --- INIT GAME (TAM SIFIRLAMA) ---
function initGame() {
	
	window.starterCityProgress = {
        classChosen: false,
        skillsChosen: false
    };
	
	 // UI noktalarını kırmızıya döndürmek için (Görseli de güncelle)
    // Eğer o an Starter City ekranındaysak veya oraya gideceksek:
    const barracksDot = document.getElementById('status-barracks');
    const elderDot = document.getElementById('status-elder');
    const leaveBtn = document.getElementById('btn-leave-starter-city');
    
    if (barracksDot) barracksDot.style.background = "#ff4d4d";
    if (elderDot) elderDot.style.background = "#ff4d4d";
    if (leaveBtn) leaveBtn.classList.add('hidden');

	
    hero.level = 1; hero.xp = 0; 
    hero.maxRage = 100; hero.rage = 0; hero.gold = 0; 
    hero.statPoints = 0; hero.skillPoints = 0;
    hero.unlockedSkills = []; 
    hero.equippedSkills = [null, null, null, null, null, null]; 
    hero.currentAct = 1;
	CalendarManager.init();
	
	const stats = window.getHeroEffectiveStats();
    hero.maxHp = stats.maxHp;
    hero.hp = stats.maxHp; 
    hero.maxRage = stats.maxRage;
    hero.rage = 0;

    hero.baseResistances = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    hero.elementalDamage = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    hero.statusEffects = []; hero.mapEffects = []; 
    hero.inventory = new Array(8).fill(null);
    hero.brooches = new Array(6).fill(null);
    hero.equipment = { earring1: null, earring2: null, necklace: null, belt: null, ring1: null, ring2: null };
    

    GAME_MAP.nodes = []; GAME_MAP.connections = []; GAME_MAP.currentNodeId = null; GAME_MAP.completedNodes = [];

    // 4. Görsel Temizlik
    const marker = document.getElementById('player-marker-container');
    if (marker) {
        marker.style.transition = 'none';
        marker.style.display = 'none'; 
        marker.style.left = '10px';    
        marker.style.top = '50%';      
    }
		
    isHeroDefending = false; monster = null; isHeroTurn = true; 

    if (typeof generateMap === 'function') generateMap(); 
    
    // Basic Skill Görsellerini Yükle (UI Manager)
    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();

    writeLog("--- Yeni Oyun Başlatıldı ---");
    updateStats();
    if(typeof updateGoldUI === 'function') updateGoldUI();
    if(typeof renderInventory === 'function') renderInventory();
}
window.openSettings = function() {
    document.getElementById('settings-modal').classList.remove('hidden');
};

window.closeSettings = function() {
    document.getElementById('settings-modal').classList.add('hidden');
};

// 1. İstatistik Butonu ve invItems Çeviri Mantığı
document.getElementById('btn-show-stats').onclick = () => {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const data = StatsManager.loadProfile();
    const content = document.getElementById('stats-content');
    
    if (!data) {
        content.innerHTML = `<p style='text-align:center;'>${lang.stats_empty}</p>`;
    } else {
        const duration = Math.floor((Date.now() - data.startTime) / 60000);
        const mostMetMonster = data.monsterEncounters ? StatsManager.getMostEncountered(data.monsterEncounters) : "-";
        const translatedMonster = lang.enemy_names[mostMetMonster] || mostMetMonster;

        
        const invItems = data.finalInventory.map(key => lang.items[key] || key).join(", ");

        content.innerHTML = `
            <p><strong>${lang.stats_hero}:</strong> ${data.playerName} (${data.className})</p>
            <p><strong>${lang.stats_nodes}:</strong> ${data.nodesPassed}</p>
            <p><strong>${lang.stats_damage_dealt}:</strong> ${data.totalDamageDealt}</p>
            <p><strong>${lang.stats_damage_taken}:</strong> ${data.totalDamageTaken}</p>
            <p><strong>${lang.stats_most_met}:</strong> ${translatedMonster}</p>
            <p><strong>${lang.stats_duration}:</strong> ${duration} ${lang.stats_minutes}</p>
            <p><strong>${lang.stats_inventory}:</strong> ${invItems || "-"}</p>
        `;
    }
    document.getElementById('modal-stats').classList.remove('hidden');
};

// İsim Ekranından Sınıf Seçimine Geçiş
document.getElementById('btn-confirm-name').onclick = () => {
    const input = document.getElementById('player-nick-input');
    const nick = input.value.trim();
    if (!nick) return;
	
	 // 1. Bayrakları kesin olarak sıfırla
    window.starterCityProgress = {
        classChosen: false,
        skillsChosen: false
    };

    hero.playerName = nick; 
	
	// EĞER KAYIT VARSA UYAR
    if (window.hasSaveGame()) {
        const currentLang = window.gameSettings.lang;
        const msg = currentLang === 'tr' ? 
            "Mevcut bir maceran var! Yeni profil oluşturursan eskisi SİLİNECEK. Devam edilsin mi?" : 
            "You have an existing journey! Creating a new profile will DELETE the old one. Proceed?";
        
        if (!confirm(msg)) return;
    }
	
	initGame(); 
    startCutscene(); // Önce loading/cutscene

};


// --- EVENT LISTENERS ---

// 1. Basic Slot 1 (A)
if (btnBasicAttack) {
    btnBasicAttack.addEventListener('click', () => {
        if (isHeroTurn && !btnBasicAttack.classList.contains('disabled')) {
            // Index 0'daki yeteneği kullan
            const key = hero.equippedSkills[0];
            if (key && typeof handleSkillUse === 'function') handleSkillUse(key);
        }
    });
}

// 2. Basic Slot 2 (D)
if (btnBasicDefend) {
    btnBasicDefend.addEventListener('click', () => {
        if (isHeroTurn && !btnBasicDefend.classList.contains('disabled')) {
            // Index 1'deki yeteneği kullan
            const key = hero.equippedSkills[1];
            if (key && typeof handleSkillUse === 'function') handleSkillUse(key);
        }
    });
}

// Klavye Kontrolleri
document.addEventListener('keydown', (e) => {
    if (startScreen.classList.contains('active') || cutsceneScreen.classList.contains('active')) {
        return; 
    }

    const key = e.key.toLowerCase();

    // Savaş Kısayolları
    if (battleScreen.classList.contains('active') && isHeroTurn) {
        // A ve D (Tıklamayı simüle et)
        if (key === 'a') {
            if (btnBasicAttack && !btnBasicAttack.classList.contains('disabled')) btnBasicAttack.click();
        }
        if (key === 'd') {
            if (btnBasicDefend && !btnBasicDefend.classList.contains('disabled')) btnBasicDefend.click();
        }

        // --- YENİ DİNAMİK TUŞ KONTROLÜ ---
    // 1'den 9'a kadar olan tuşları kontrol et
    const skillSlots = document.querySelectorAll('#skill-bar-container .skill-slot');
    const numKey = parseInt(key);
    
    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        // Eğer basılan rakama karşılık gelen bir slot varsa (Örn: 5 tuşu -> skillSlots[4])
        const targetIndex = numKey - 1;
        if (skillSlots[targetIndex]) {
            skillSlots[targetIndex].click();
        }
    }
    // --------------------------------
}

    // MENÜ KISAYOLLARI (Sadece izin varsa çalışacaklar)
    if (key === 'i' || key === 'ı') { 
        toggleInventory(); 
    }
    if (key === 'k') { 
        toggleSkillBook(); 
    }
    if (key === 'u') { 
        toggleStatScreen(); 
    }
});

returnToMenuButton.addEventListener('click', () => {
    initGame(); // Bu fonksiyon zaten GAME_MAP.currentNodeId'yi null yapıyor.
	// "Devam Et" butonu kontrolü: Kayıt silindiği için artık görünmemeli
    const continueBtn = document.getElementById('btn-continue');
    if (window.hasSaveGame && !window.hasSaveGame()) {
        if (continueBtn) continueBtn.classList.add('hidden');
    }
    switchScreen(startScreen);
});


window.itemver = function(tier = 1) {
    const newItem = generateRandomItem(tier);
    const emptySlot = hero.inventory.indexOf(null);
    
    if (emptySlot !== -1) {
        hero.inventory[emptySlot] = newItem;
        renderInventory();
        writeLog(`🛠️ Hile: Tier ${tier} eşya üretildi.`);
    } else {
        alert("Envanterin dolu!");
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
        alert("Envanterin dolu! Yer açmalısın.");
    }
};

document.addEventListener('touchstart', (e) => {
    // Eğer dokunulan yer bir item-slot değilse tooltip'i kapat
    if (!e.target.closest('.item-slot')) {
        window.hideItemTooltip();
        lastTappedSlot = null; // Seçimi sıfırla
    }
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
	if(typeof applySettings === 'function') applySettings();
    // 1. Oyunu ve İlk Ekranı Başlat
    if (typeof initGame === 'function') initGame(); 
    if (typeof switchScreen === 'function') switchScreen(window.startScreen); 

    // 2. ANA MENÜ VE SEÇİM BUTONLARI
    if (window.startButton) {
    window.startButton.onclick = () => {
        const nickInput = document.getElementById('player-nick-input');
        
        // 1. Önce içeriği temizleyelim (Sıfırlama)
        if (nickInput) {
            nickInput.value = ""; 
        }

        // 2. Ekranı değiştirelim
        switchScreen(window.nameEntryScreen);

        // 3. Odaklanma (Focus) - Süreyi biraz artırdık (150ms) ve ZORLA focus yapıyoruz
        setTimeout(() => {
            if (nickInput) {
                nickInput.focus();
                // Bazı tarayıcılar için imleci sona atma hilesi
                nickInput.click(); 
            }
        }, 150);
    };
}

    if (window.btnConfirmBasicSkills) {
        window.btnConfirmBasicSkills.onclick = () => {
            if (typeof window.confirmBasicSkills === 'function') {
                window.confirmBasicSkills();
            }
        };
    }

    if (window.returnToMenuButton) {
        window.returnToMenuButton.onclick = () => {
            if (typeof initGame === 'function') initGame();
            switchScreen(window.startScreen);
        };
    }

    // 3. ÜST NAVİGASYON BAR BUTONLARI (U, I, K)
    if (window.btnOpenSkills) {
        window.btnOpenSkills.onclick = () => toggleSkillBook();
    }
    if (window.btnOpenStats) {
        window.btnOpenStats.onclick = () => toggleStatScreen();
    }
    if (window.btnOpenInventoryNav) {
        window.btnOpenInventoryNav.onclick = () => toggleInventory();
    } else if (window.btnOpenInventory) {
        window.btnOpenInventory.onclick = () => toggleInventory();
    }

    // 4. PUAN BİLDİRİMLERİ (STAT + / SKILL +)
    if (window.statNotif) {
        window.statNotif.onclick = () => toggleStatScreen();
    }
    if (window.skillNotif) {
        window.skillNotif.onclick = () => toggleSkillBook();
    }

    // 5. YETENEK KİTABI TABLARI (Gelişmiş Bağlama)
    const tabList = ['common', 'brutal', 'chaos', 'fervor'];
    tabList.forEach(tabId => {
        const tabEl = document.getElementById(`tab-${tabId}`);
        if (tabEl) {
            tabEl.onclick = (e) => {
                e.preventDefault();
                if (typeof setSkillTab === 'function') setSkillTab(tabId);
            };
        }
    });

    // 6. TÜM KAPATMA TUŞLARI (X) - KESİN ÇÖZÜM
    if (window.btnCloseSkillBook) {
        window.btnCloseSkillBook.onclick = (e) => {
            e.preventDefault();
            toggleSkillBook();
        };
    }

    if (window.btnCloseStat) {
        window.btnCloseStat.onclick = (e) => {
            e.preventDefault();
            toggleStatScreen();
        };
    }

    if (window.btnCloseInventory) {
        window.btnCloseInventory.onclick = (e) => {
            e.preventDefault();
            console.log("Envanter kapatma tıklandı.");
            toggleInventory();
        };
    }

    // 7. TOWN (KÖY) ÇIKIŞ BUTONU
    if (window.btnLeaveTown) {
        window.btnLeaveTown.onclick = () => {
            writeLog("Köyden ayrıldın.");
            switchScreen(window.mapScreen);
			window.saveGame();
        };
    }
	//8. MENU DÖNÜŞ BUTONU
	if (window.returnToMenuButton) {
        window.returnToMenuButton.onclick = () => {
            // KRİTİK: Ana menüye dönerken siyah perdeyi anında YOK ET
            const overlay = document.getElementById('fade-overlay');
            if (overlay) {
                overlay.style.transition = "none"; // Animasyonu kapat
                overlay.classList.remove('active-fade'); // Sınıfı sil
                setTimeout(() => { overlay.style.transition = "opacity 1.5s ease-in-out"; }, 100); // Animasyonu geri aç
            }

            if (typeof initGame === 'function') initGame();
            switchScreen(window.startScreen);
        };
    }
	//9. KAYIT-DEVAM BUTONLARI
	const continueBtn = document.getElementById('btn-continue');
    
    if (window.hasSaveGame()) {
        continueBtn.classList.remove('hidden'); // Kayıt varsa butonu göster
    }

    continueBtn.onclick = () => {
        if (window.loadGame()) {
            switchScreen(window.mapScreen); // Kayıt yüklendiyse direkt haritaya at
            writeLog("Macera kaldığı yerden devam ediyor...");
        }
    };
});