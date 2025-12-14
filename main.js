// main.js - DÜZELTİLMİŞ FİNAL SÜRÜM

function levelUp() {
    if (hero.level >= MAX_LEVEL) return; 
    
    hero.level++;
    hero.maxHp += 5; 
    hero.hp = Math.min(hero.maxHp, hero.hp + 20); 
    hero.attack += 1; 
    hero.maxRage += 10;
    
    hero.statPoints += 3;
    hero.skillPoints += 2;
    
    hero.xp = hero.xp - FULL_XP_REQUIREMENTS[hero.level - 1]; 
    hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level] || Infinity; 
    
    writeLog(`⬆️ **SEVİYE ATLADIN!** (Lv. ${hero.level})`);
    updateStats(); 
    triggerLevelUpEffect();
}

function increaseStat(statName) {
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    if (isInBattle) { writeLog("❌ Savaş sırasında stat puanı dağıtamazsın!"); return; }

    if (hero.statPoints > 0) {
        hero.statPoints--;
        if (statName === 'str') hero.str++;
        else if (statName === 'dex') hero.dex++;
        else if (statName === 'int') hero.int++;
        else if (statName === 'mp_pow') hero.mp_pow++;
        else if (statName === 'vit') { hero.vit++; hero.maxHp += 10; hero.hp += 10; }
        updateStats(); 
    }
}

function learnSkill(skillKey) {
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    if (isInBattle) { writeLog("❌ Savaş sırasında yetenek öğrenemezsin!"); return; }

    const skill = SKILL_DATABASE[skillKey];
    if (!skill) return;

    const cost = skill.data.tier || 1;

    if (hero.skillPoints >= cost) {
        hero.skillPoints -= cost;
        hero.unlockedSkills.push(skillKey);
        
        writeLog(`📖 Yeni Yetenek Öğrenildi: **${skill.data.name}**`);
        
        // OTOMATİK KUŞANMA
        const emptySlotIndex = hero.equippedSkills.indexOf(null);
        if (emptySlotIndex !== -1) {
            hero.equippedSkills[emptySlotIndex] = skillKey;
            writeLog(`⚙️ **${skill.data.name}** otomatik olarak ${emptySlotIndex + 1}. slota yerleşti.`);
            if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
            if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
        }
        
        if (typeof renderSkillBookList === 'function') renderSkillBookList();
        
        const spDisplay = document.getElementById('skill-points-display');
        if(spDisplay) spDisplay.textContent = hero.skillPoints;
        
    } else {
        writeLog("❌ Yetersiz Skill Puanı!");
    }
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

    setTimeout(() => {
        halo.remove();
    }, 2000);
}

function startCutscene() {
    switchScreen(cutsceneScreen);
    cutsceneText.textContent = "Zindanlara iniliyor...";
    let timer1 = null; let timer2 = null;
    function transitionToMap() {
        if (timer1) clearTimeout(timer1); if (timer2) clearTimeout(timer2);
        skipCutsceneButton.onclick = null;
        cutsceneText.textContent = "Hazır!";
        
        // Önce Skill Seçimi, Sonra Harita
        // Eğer selection fonksiyonu varsa aç, yoksa direkt haritaya git (Hata önleyici)
        if (typeof openBasicSkillSelection === 'function') {
            openBasicSkillSelection();
        } else {
            switchScreen(mapScreen);
        }
        
        document.getElementById('map-display').scrollLeft = 0;
        writeLog("Savaş tarzını seç."); 
    }
    skipCutsceneButton.onclick = transitionToMap;
    timer1 = setTimeout(() => {
        cutsceneText.textContent = "Harita Yükleniyor...";
        timer2 = setTimeout(() => { transitionToMap(); }, 1000);
    }, 1500);
}

function initGame() {
    // 1. Hero Statları
    hero.maxHp = 100; 
    hero.hp = hero.maxHp;
    hero.attack = 20; 
    hero.defense = 5;
    hero.level = 1; 
    hero.xp = 0; 
    
    hero.xpToNextLevel = (typeof FULL_XP_REQUIREMENTS !== 'undefined') ? FULL_XP_REQUIREMENTS[1] : 100;
    hero.maxRage = 100; 
    hero.rage = 0; 
    hero.gold = 0; 
    
    // 2. Statlar ve Skiller
    hero.statPoints = 0;
    hero.str = 15; hero.dex = 10; hero.int = 5; hero.mp_pow = 0; hero.vit = 10;
    hero.skillPoints = 0; 
    hero.unlockedSkills = []; 
    hero.equippedSkills = [null, null, null, null];
    
    // --- DÜZELTME: Varsayılan Basic Skiller Tanımlandı ---
    // Böylece seçim ekranı gelmese bile slotlar boş kalmaz.
    hero.equippedBasic = ['cut', 'guard']; 

    // 3. Diğer Veriler
    hero.statusEffects = []; 
    hero.mapEffects = []; 
    hero.inventory = new Array(8).fill(null);
    hero.brooches = new Array(6).fill(null);
    hero.equipment = {
        earring1: null, earring2: null,
        necklace: null, belt: null,
        ring1: null, ring2: null
    };

    // 4. Geçmişi Temizle
    delete hero.lastCampfireStage; 
    delete hero.lastEnemy;

    GAME_MAP.nodes = [];
    GAME_MAP.connections = [];
    GAME_MAP.currentNodeId = null;
    GAME_MAP.completedNodes = [];

    // 5. Görsel Temizlik
    const marker = document.getElementById('player-marker-container');
    if (marker) {
        marker.style.transition = 'none';
        marker.style.display = 'none'; 
        marker.style.left = '10px';    
        marker.style.top = '50%';      
    }
    
    const mapDisplay = document.getElementById('map-display');
    if (mapDisplay) {
        mapDisplay.scrollLeft = 0; 
    }

    isHeroDefending = false;
    monster = null;
    isHeroTurn = true; 

    if (typeof generateMap === 'function') generateMap(); 
    
    // --- DÜZELTME: Basic Skill Görsellerini Yükle ---
    // (Burası silinmişti, geri eklendi. Bu fonksiyon ui_manager.js içindedir)
    if (typeof initializeBasicSkills === 'function') {
        initializeBasicSkills();
    }

    writeLog("--- Yeni Oyun Başlatıldı ---");
    const heroImg = document.querySelector('#hero-display img');
    if(heroImg) heroImg.src = HERO_IDLE_SRC;
    
    updateStats();
    if(typeof updateGoldUI === 'function') updateGoldUI();
    if(typeof renderInventory === 'function') renderInventory();
}

// --- EVENT LISTENERS ---

// 1. Basic Slot 1 (A)
if (btnBasicAttack) {
    btnBasicAttack.addEventListener('click', () => {
        if (isHeroTurn && !btnBasicAttack.classList.contains('disabled')) {
            if (typeof handleBasicSkillUse === 'function') handleBasicSkillUse(0); 
        }
    });
}

// 2. Basic Slot 2 (D)
if (btnBasicDefend) {
    btnBasicDefend.addEventListener('click', () => {
        if (isHeroTurn && !btnBasicDefend.classList.contains('disabled')) {
            if (typeof handleBasicSkillUse === 'function') handleBasicSkillUse(1); 
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
        // A ve D
        if (key === 'a') {
            if (btnBasicAttack && !btnBasicAttack.classList.contains('disabled')) btnBasicAttack.click();
        }
        if (key === 'd') {
            if (btnBasicDefend && !btnBasicDefend.classList.contains('disabled')) btnBasicDefend.click();
        }

        // 1-2-3-4
        const skillSlots = document.querySelectorAll('#skill-bar-container .skill-slot');
        if (key === '1' && skillSlots[0]) skillSlots[0].click();
        if (key === '2' && skillSlots[1]) skillSlots[1].click();
        if (key === '3' && skillSlots[2]) skillSlots[2].click();
        if (key === '4' && skillSlots[3]) skillSlots[3].click();
    }

    // Menü Kısayolları
    if (key === 'i' || key === 'ı') { toggleInventory(); }
    if (key === 'k') { if (typeof toggleSkillBook === 'function') toggleSkillBook(); }
    if (key === 'u') { if (typeof toggleStatScreen === 'function') toggleStatScreen(); }
});

startButton.addEventListener('click', startCutscene);

returnToMenuButton.addEventListener('click', () => {
    initGame();
    switchScreen(startScreen);
});

document.addEventListener('DOMContentLoaded', () => {
    initGame(); 
    switchScreen(startScreen); 
    if(btnCloseInventory) btnCloseInventory.addEventListener('click', toggleInventory);
});