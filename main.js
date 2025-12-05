// main.js - Ana Oyun Döngüsü

// LEVEL VE XP SİSTEMİ
function levelUp() {
    if (hero.level >= MAX_LEVEL) return; 
    
    hero.level++;
    hero.maxHp += 15; 
    hero.hp = hero.maxHp; 
    hero.attack += 3; 
    hero.defense += 1; 
    hero.maxRage += 10;
    hero.rage = hero.maxRage; 
    
    // Stat artışı
    hero.str += 2; 
    hero.dex += 1; 
    hero.int += 1;
    
    // FULL_XP_REQUIREMENTS artık game_data.js'in tepesinde tanımlı, hata vermez.
    hero.xp = hero.xp - (FULL_XP_REQUIREMENTS[hero.level - 1] || 0); 
    hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level] || Infinity; 

    writeLog(`⬆️ **SEVİYE ATLADIN!** Yeni Seviye: ${hero.level}`);
    updateStats(); 
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

// OYUN AKIŞI
function startCutscene() {
    switchScreen(cutsceneScreen);
    cutsceneText.textContent = "Zindanlara iniliyor...";
    let timer1 = null; let timer2 = null;
    
    function transitionToMap() {
        if (timer1) clearTimeout(timer1); 
        if (timer2) clearTimeout(timer2);
        
        skipCutsceneButton.onclick = null;
        cutsceneText.textContent = "Hazır!";
        
        switchScreen(mapScreen);
        movePlayerMarkerToNode(ACT_1_MAP.currentNodeId, true);
        
        writeLog("Harita Ekranı: Maceran Başladı.");
        checkCurrentNodeAction(); 
    }

    skipCutsceneButton.onclick = transitionToMap;

    timer1 = setTimeout(() => {
        cutsceneText.textContent = "Harita Yükleniyor...";
        timer2 = setTimeout(() => { transitionToMap(); }, 1000);
    }, 1500);
}

function initGame() {
    // 1. Karakteri Sıfırla
    hero.maxHp = 100; hero.attack = 20; hero.defense = 5;
    hero.level = 1; hero.xp = 0; 
    
    // Güvenlik kontrolü
    if (typeof FULL_XP_REQUIREMENTS !== 'undefined') {
        hero.xpToNextLevel = FULL_XP_REQUIREMENTS[1];
    } else {
        console.error("FULL_XP_REQUIREMENTS tanımlı değil! game_data.js'i kontrol et.");
        hero.xpToNextLevel = 100; // Fallback
    }

    hero.hp = hero.maxHp; hero.maxRage = 100; hero.rage = 0; 
    hero.str = 15; hero.dex = 10; hero.int = 5; hero.mp_pow = 0;
    hero.statusEffects = []; // Buffları temizle
    hero.mapEffects = []; // Harita etkilerini temizle
    
    // Varsayılan yetenekler
    hero.equippedSkills = ['hell_blade', 'minor_healing', null, null];

    // 2. Haritayı Sıfırla
    ACT_1_MAP.currentNodeId = 1; 
    if (typeof clearTrails === 'function') clearTrails();

    // Rastgele Harita
    if (typeof randomizeMap === 'function') {
        randomizeMap();
    }

    // 3. Savaş Durumunu Sıfırla
    isHeroDefending = false;
    monster = null;

    writeLog("--- Oyun Başlatıldı ---");
    heroDisplayImg.src = HERO_IDLE_SRC;
    updateStats();
}

// EVENT LISTENERS
attackButton.addEventListener('click', () => { 
    if (isHeroTurn) handleAttackSequence(hero, monster); 
});

defendButton.addEventListener('click', () => {
    if (isHeroTurn) {
        const minBonus = 5; const maxBonus = 25;
        heroDefenseBonus = Math.floor(Math.random() * (maxBonus - minBonus + 1)) + minBonus;
        isHeroDefending = true; 
        writeLog(`🛡️ **${hero.name}** savunma pozisyonu aldı (+${heroDefenseBonus} Def).`);
        nextTurn();
    }
});

// KLAVYE KISAYOLLARI
document.addEventListener('keydown', (e) => {
    const key = e.key.toLowerCase();

    // Savaş Kısayolları (1, 2, 3, 4)
    if (battleScreen.classList.contains('active') && isHeroTurn) {
        const slots = document.querySelectorAll('.skill-slot');
        if (key === '1' && slots[0]) slots[0].click();
        if (key === '2' && slots[1]) slots[1].click();
        if (key === '3' && slots[2]) slots[2].click();
        if (key === '4' && slots[3]) slots[3].click();
    }

    // Yetenek Kitabı (K)
    if (key === 'k') {
        if (typeof toggleSkillBook === 'function') toggleSkillBook();
    }

    // Stat Ekranı (U)
    if (key === 'u') {
        if (typeof toggleStatScreen === 'function') toggleStatScreen();
    }
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