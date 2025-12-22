// main.js - FİNAL VE HATASIZ SÜRÜM

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
        if (statName === 'str') hero.str++;
        else if (statName === 'dex') hero.dex++;
        else if (statName === 'int') hero.int++;
        else if (statName === 'mp_pow') hero.mp_pow++;
        else if (statName === 'vit') { 
            hero.vit++; 
            // VIT formülü game_data'dan gelir (1 VIT = 10 HP)
            const hpGain = (CLASS_CONFIG && CLASS_CONFIG[hero.class]) ? CLASS_CONFIG[hero.class].vitMultiplier : 10;
            hero.maxHp += hpGain; 
            hero.hp += hpGain; 
        }
        updateStats(); 
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

    const cost = skill.data.tier || 1;

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
    if (className !== 'Barbar') return; // Magus ve Trickster şimdilik seçilemez

    hero.class = className;
    // Barbar seçildiği için varsayılan statları teyit et (opsiyonel)
    hero.str = 15;
    hero.dex = 10;
    hero.int = 5;
    hero.vit = 10;
    
    writeLog(`Sınıf Seçildi: ${className}`);
    
    // Seçimden sonra cutscene (yükleme) ekranına geç
    startCutscene();
}

function startCutscene() {
    switchScreen(cutsceneScreen);
    cutsceneText.textContent = "Zindanlara iniliyor...";
    let timer1 = null; let timer2 = null;
    function transitionToMap() {
        if (timer1) clearTimeout(timer1); if (timer2) clearTimeout(timer2);
        skipCutsceneButton.onclick = null;
        cutsceneText.textContent = "Hazır!";
        
        // Önce Skill Seçimi
        if (typeof openBasicSkillSelection === 'function') {
            openBasicSkillSelection();
        } else {
            switchScreen(mapScreen);
        }
        
        const mapDisplay = document.getElementById('map-display');
        if(mapDisplay) mapDisplay.scrollLeft = 0;
        
        writeLog("Savaş tarzını seç."); 
    }
    skipCutsceneButton.onclick = transitionToMap;
    timer1 = setTimeout(() => {
        cutsceneText.textContent = "Harita Yükleniyor...";
        timer2 = setTimeout(() => { transitionToMap(); }, 1000);
    }, 1500);
}

// --- INIT GAME (TAM SIFIRLAMA) ---
function initGame() {
    hero.maxHp = 100; hero.hp = hero.maxHp;
    hero.baseAttack = 10; hero.baseDefense = 1;
    hero.level = 1; hero.xp = 0; 
    hero.maxRage = 100; hero.rage = 0; hero.gold = 0; 
    
    hero.statPoints = 0;
    hero.str = 15; hero.dex = 10; hero.int = 5; hero.mp_pow = 0; hero.vit = 10;
    hero.skillPoints = 0; 
    hero.unlockedSkills = []; 
    hero.equippedSkills = [null, null, null, null, null, null]; 

    // Yeni sistem verilerini sıfırla
    hero.baseResistances = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    hero.elementalDamage = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    
    // 3. Diğer Veriler
	hero.baseResistances = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    hero.statusEffects = []; hero.mapEffects = []; 
    hero.inventory = new Array(8).fill(null);
    hero.brooches = new Array(6).fill(null);
    hero.equipment = {
        earring1: null, earring2: null, necklace: null, belt: null, ring1: null, ring2: null
    };

    delete hero.lastCampfireStage; 
    delete hero.lastEnemy;

    GAME_MAP.nodes = []; GAME_MAP.connections = []; GAME_MAP.currentNodeId = null; GAME_MAP.completedNodes = [];

    // 4. Görsel Temizlik
    const marker = document.getElementById('player-marker-container');
    if (marker) {
        marker.style.transition = 'none';
        marker.style.display = 'none'; 
        marker.style.left = '10px';    
        marker.style.top = '50%';      
    }
    
    const mapDisplay = document.getElementById('map-display');
    if (mapDisplay) { mapDisplay.scrollLeft = 0; }

    isHeroDefending = false; monster = null; isHeroTurn = true; 

    if (typeof generateMap === 'function') generateMap(); 
    
    // Basic Skill Görsellerini Yükle (UI Manager)
    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();

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

    // Menü Kısayolları
    if (key === 'i' || key === 'ı') { toggleInventory(); }
    if (key === 'k') { if (typeof toggleSkillBook === 'function') toggleSkillBook(); }
    if (key === 'u') { if (typeof toggleStatScreen === 'function') toggleStatScreen(); }
});


startButton.addEventListener('click', () => {
    switchScreen(classSelectionScreen); // Direkt cutscene yerine seçim ekranına git
});

returnToMenuButton.addEventListener('click', () => {
    initGame();
    switchScreen(startScreen);
});

document.addEventListener('DOMContentLoaded', () => {
    initGame(); 
    switchScreen(startScreen); 
    if(btnCloseInventory) btnCloseInventory.addEventListener('click', toggleInventory);
});