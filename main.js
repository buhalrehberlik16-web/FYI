// main.js

function levelUp() {
    if (hero.level >= MAX_LEVEL) return; 
    
    hero.level++;
    hero.maxHp += 5; 
    hero.hp = hero.maxHp; 
    hero.attack += 1; 
    hero.maxRage += 10;
    
    // 3 Stat Puanı + 2 Skill Puanı
    hero.statPoints += 3;
    hero.skillPoints += 2;
    
    hero.xp = hero.xp - FULL_XP_REQUIREMENTS[hero.level - 1]; 
    hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level] || Infinity; 
    
    writeLog(`⬆️ **SEVİYE ATLADIN!** (3 Stat, 2 Skill Puanı Kazandın)`);
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

// YENİ: YETENEK ÖĞRENME
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
        
        // Arayüzü yenile
        if (typeof renderSkillBookList === 'function') renderSkillBookList();
        
        // Puan göstergesini yenile (UI Manager içinde yapılabilir ama burada manuel güncelleyelim)
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
//  Level Up Effekti
function triggerLevelUpEffect() {
    const container = document.getElementById('hero-display');
    if (!container) return;

    // 1. Halo Efektini Oluştur
    const halo = document.createElement('div');
    halo.className = 'levelup-halo';
    container.appendChild(halo);

    // 2. "LEVEL UP!" Yazısı Çıkar (Mevcut floating text sistemini kullanarak)
    // Eğer showFloatingText ui_manager.js'de tanımlıysa direkt çalışır.
    if (typeof showFloatingText === 'function') {
        // Biraz gecikmeli çıksın ki ışıkla uyumlu olsun
        setTimeout(() => {
            showFloatingText(container, "LEVEL UP!", "heal"); 
        }, 200);
    }

    // 3. Temizlik (Animasyon 2sn sürüyor, sonra div'i sil)
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
        switchScreen(mapScreen);
		document.getElementById('map-display').scrollLeft = 0;
        writeLog("Harita Ekranı: Bir yol seç."); 
    }
    skipCutsceneButton.onclick = transitionToMap;
    timer1 = setTimeout(() => {
        cutsceneText.textContent = "Harita Yükleniyor...";
        timer2 = setTimeout(() => { transitionToMap(); }, 1000);
    }, 1500);
}

function initGame() {
    hero.maxHp = 100; hero.attack = 20; hero.defense = 5;
    hero.level = 1; hero.xp = 0; 
    if (typeof FULL_XP_REQUIREMENTS !== 'undefined') hero.xpToNextLevel = FULL_XP_REQUIREMENTS[1]; else hero.xpToNextLevel = 100;
    hero.hp = hero.maxHp; hero.maxRage = 100; hero.rage = 0; 
    
    // Statlar
    hero.str = 15; hero.dex = 10; hero.int = 5; hero.mp_pow = 0; hero.vit = 10;
    hero.statPoints = 0;
    hero.gold = 0;
    hero.statusEffects = []; 
    hero.mapEffects = []; 
    
    // GÜNCEL BAŞLANGIÇ
    hero.skillPoints = 0;
    hero.unlockedSkills = ['slash', 'minor_healing']; // Sadece bunlar açık
    hero.equippedSkills = ['slash', 'minor_healing', null, null];

// YENİ:
GAME_MAP.currentNodeId = null; // Başlangıçta null
generateMap(); // Haritayı üret ve çiz

    isHeroDefending = false;
    monster = null;

    writeLog("--- Oyun Başlatıldı ---");
    heroDisplayImg.src = HERO_IDLE_SRC;
    
    updateStats();
    if(typeof updateGoldUI === 'function') updateGoldUI();
}

// EVENT LISTENERS
attackButton.addEventListener('click', () => { if (isHeroTurn) handleAttackSequence(hero, monster); });

defendButton.addEventListener('click', () => {
    if (isHeroTurn) {
        const minBonus = 5; const maxBonus = 25;
        heroDefenseBonus = Math.floor(Math.random() * (maxBonus - minBonus + 1)) + minBonus;
        isHeroDefending = true; 
		hero.rage = Math.min(hero.maxRage, hero.rage + 15); //Def basınca 15 Rage
        updateStats();
        writeLog(`🛡️ **${hero.name}** savunma pozisyonu aldı (+${heroDefenseBonus} Def).`);
        nextTurn();
    }
});

document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();
    if (battleScreen.classList.contains('active') && isHeroTurn) {
        const slots = document.querySelectorAll('.skill-slot');
        if (key === '1' && slots[0]) slots[0].click();
        if (key === '2' && slots[1]) slots[1].click();
        if (key === '3' && slots[2]) slots[2].click();
        if (key === '4' && slots[3]) slots[3].click();
    }
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
});
