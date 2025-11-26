// game_data.js

// =========================================================
// 1. DOM Referansları
//    (Bu değişkenler, index.html'deki elementleri JavaScript'e bağlar.)
// =========================================================

// Savaş Butonları ve Çubukları
const attackButton = document.getElementById('attack-button');
const defendButton = document.getElementById('defend-button');
const heroHpBar = document.getElementById('hero-hp-bar');
const monsterHpBar = document.getElementById('monster-hp-bar');
const heroHpText = document.getElementById('hero-hp-text');
const monsterHpText = document.getElementById('monster-hp-text');
const heroNameDisplay = document.getElementById('hero-name');
const monsterNameDisplay = document.getElementById('monster-name');
const log = document.getElementById('log');

// YENİ: RAGE STATLARI
const heroRageBar = document.getElementById('hero-rage-bar');
const heroRageText = document.getElementById('hero-rage-text');

// YENİ: YETENEK BUTONLARI
const skillButtonsContainer = document.getElementById('skill-buttons-container');

// Yeni Ekran Referansları (Harita, Ara Sahneler ve Game Over için)
const startScreen = document.getElementById('start-screen');
const cutsceneScreen = document.getElementById('cutscene-screen');
const battleScreen = document.getElementById('battle-screen');
const mapScreen = document.getElementById('map-screen'); 
const gameOverScreen = document.getElementById('game-over-screen'); // Game Over
const returnToMenuButton = document.getElementById('return-to-menu-button'); // Game Over

const startButton = document.getElementById('start-button');
const skipCutsceneButton = document.getElementById('skip-cutscene');
const cutsceneText = document.getElementById('cutscene-text');

// Yeni: Canavar Niyet Göstergesi Referansı
const monsterIntentionOverlay = document.getElementById('monster-intention-overlay');

// Harita DOM Referansları
const mapDisplay = document.getElementById('map-display');
const mapInfoBox = document.getElementById('map-info-box');
const mapActionButtons = document.getElementById('map-action-buttons'); // Harita Aksiyon Butonları
// const currentNodename = document.getElementById('current-node-name'); // Eğer gerekiyorsa

// =========================================================
// 2. OYUN DURUMU VE KARAKTER VERİLERİ
// =========================================================

let isHeroTurn = true; 

let hero = {
    name: "Barbar",
    maxHp: 100,
    hp: 100,
    attack: 20,
    defense: 5,
    level: 1,       
    xp: 0,          
    xpToNextLevel: 100,
    // YENİ: RAGE STATLARI
    maxRage: 100,
    rage: 0 
};

let monster = null; 
const MAX_LEVEL = 60;

// =========================================================
// 3. YETENEK TANIMLARI (YENİ GÖRSELLER EKLENDİ)
// =========================================================

const HERO_SKILLS = {
    // 1. Yetenek: Hell Blade
    hell_blade: {
        name: "Cehennem Kılıcı",
        description: "Yüksek hasar veren, öfke harcayan saldırı. %60 şansla 20+ hasar verir.",
        rageCost: 40,
        minDamage: 5,
        maxDamage: 45,
        highDamageThreshold: 20, 
        
        animFrames: [ 
            'barbarian_hellblade_strike1.png', // Hazırlık
            'barbarian_hellblade_strike2.png', // Vuruş Anı
            'barbarian_hellblade_strike3.png'  // Vuruş Sonrası
        ]
    },
    // 2. Yetenek: Minor Healing
    minor_healing: {
        name: "Küçük İyileşme",
        description: "Az miktarda can yeniler. %60 şansla başarısız olur (1-5 heal).",
        rageCost: 15,
        minHeal: 1,
        maxHeal: 15,
        weakHealThreshold: 5,
        weakChance: 0.60, // %60 şansla 1-5 arası iyileştirir (Risk)
    }
};

// =========================================================
// 4. HARİTA YAPISI (ACT 1)
// =========================================================

const ACT_1_MAP = {
    totalNodes: 8,
    currentNodeId: 1, 
    nodes: {
        // 'enemy' değerleri artık enemy_data.js'te tanımlanan isimlerle eşleşmelidir.
        1: { type: 'encounter', enemy: 'Goblin Savaşçısı', text: "Yolun başında ilk engelin: bir Goblin Savaşçısı!", next: [2] }, 
        2: { type: 'choice', text: "Yol üçe ayrılıyor: Sol (Yoğun Orman), Orta (Patika), Sağ (Nehir Kenarı).", next: [3, 4, 5] }, 
        3: { type: 'encounter', enemy: 'Yaban Domuzu', text: "Gürültülü bir Yaban Domuzu önünü kesiyor. Güçlü görünüyor!", next: [6] }, 
        4: { type: 'encounter', enemy: 'Goblin Şefi', text: "Goblin Şefi, çevresindeki bölgeyi denetliyor.", next: [6] }, 
        5: { type: 'encounter', enemy: 'Goblin Devriyesi', text: "Tek başına bir Goblin Devriyesi fark etmedin bile.", next: [7] }, 
        6: { type: 'encounter', enemy: 'Orc Fedaisi', text: "Devasa bir Orc Fedaisi köye giden yolu tıkıyor!", next: [8] }, 
        7: { type: 'encounter', enemy: 'Goblin Savaşçısı', text: "Son bir Goblin devriyesi daha.", next: [8] }, 
        8: { type: 'town', text: "Köy güvenliğine ulaştın! Maceran devam ediyor.", next: [] }
    }
};

// =========================================================
// 5. XP HESAPLAMA FONKSİYONLARI (Level sistemi için)
// =========================================================

/** Maksimum 60. seviyeye kadar XP gereksinimlerini hesaplar. */
function generateXPTable(maxLevel, multiplier) {
    const table = {};
    table[1] = 100;
    table[2] = 200;
    table[3] = 400;

    let currentXP = 400; 
    
    for (let level = 4; level < maxLevel; level++) {
        currentXP = Math.floor(currentXP * multiplier);
        if (currentXP > 10000000) { 
             currentXP = 10000000;
        }
        table[level] = currentXP;
    }
    table[maxLevel] = Infinity; 
    return table;
}

const FULL_XP_REQUIREMENTS = generateXPTable(MAX_LEVEL, 2); 

// Hero'nun başlangıç XP gereksinimini tablodan al
hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level];