// game_data.js

//////----CLASS YAPISI----/////

const CLASS_CONFIG = {
    "Barbar": {
        // Hangi statlar ATAK verir? (1.0 = Değer kadar, 0.5 = Yarısı kadar)
        // Örn: strDivisor: 2.0 demek, STR'nin yarısı atağa eklenir demektir (Çarpan: 0.5)
        // Matematiksel kolaylık için "Çarpan (Multiplier)" kullanalım:
        atkStats: { "str": 0.5 }, // STR'nin %50'si Atağa eklenir (Eski: str/2)
        
        // Defans
        defStats: { "dex": 0.33 }, // DEX'in %33'ü (Eski: dex/3)
		blockStats: { "dex": 0.8 },
        
        vitMultiplier: 10
    }
    // İleride "Mage": { atkStats: { "int": 0.5 }, ... }
};


// DOM REFERANSLARI
const btnBasicAttack = document.getElementById('btn-basic-attack');
const btnBasicDefend = document.getElementById('btn-basic-defend');
const heroHpBar = document.getElementById('hero-hp-bar');
const monsterHpBar = document.getElementById('monster-hp-bar');
const heroHpText = document.getElementById('hero-hp-text');
const monsterHpText = document.getElementById('monster-hp-text');
const heroNameDisplay = document.getElementById('hero-name');
const monsterNameDisplay = document.getElementById('monster-name');
const heroRageBar = document.getElementById('hero-rage-bar');
const heroRageText = document.getElementById('hero-rage-text');
const townScreen = document.getElementById('town-screen');
const cityScreen = document.getElementById('city-screen');
const btnLeaveTown = document.getElementById('btn-leave-town');
const basicSkillSelectionScreen = document.getElementById('basic-skill-selection-screen');
const basicSkillList = document.getElementById('basic-skill-list');
const btnConfirmBasicSkills = document.getElementById('btn-confirm-basic-skills');
const classSelectionScreen = document.getElementById('class-selection-screen');

// Envanter
const inventoryScreen = document.getElementById('inventory-screen');
const btnCloseInventory = document.getElementById('btn-close-inventory');
const btnOpenInventoryNav = document.getElementById('btn-open-inventory'); 

// Skill Bar
const skillButtonsContainer = document.getElementById('skill-bar-container');
const btnOpenSkills = document.getElementById('btn-open-skills');
const btnOpenStats = document.getElementById('btn-open-stats');

// Ekranlar
const startScreen = document.getElementById('start-screen');
const cutsceneScreen = document.getElementById('cutscene-screen');
const battleScreen = document.getElementById('battle-screen');
const mapScreen = document.getElementById('map-screen'); 
const gameOverScreen = document.getElementById('game-over-screen');
const campfireScreen = document.getElementById('campfire-screen');
const eventScreen = document.getElementById('event-screen');
const skillBookScreen = document.getElementById('skill-book-screen');
const statScreen = document.getElementById('stat-screen');
const rewardScreen = document.getElementById('reward-screen');

// Üst Bar
const topHeroName = document.getElementById('top-hero-name');
const topHeroLevel = document.getElementById('top-hero-level');

// Ödül
const rewardList = document.getElementById('reward-list');
const btnRewardContinue = document.getElementById('btn-reward-continue');

// Stat Elementleri
const statName = document.getElementById('stat-name');
const statClass = document.getElementById('stat-class');
const statLevel = document.getElementById('stat-level');
const statXp = document.getElementById('stat-xp');
const statPointsDisplay = document.getElementById('stat-points-display'); 

const statHp = document.getElementById('stat-hp');
const statRage = document.getElementById('stat-rage'); 
const statAtk = document.getElementById('stat-atk');
const statDef = document.getElementById('stat-def');
const statStr = document.getElementById('stat-str');
const statDex = document.getElementById('stat-dex');
const statInt = document.getElementById('stat-int');
const statVit = document.getElementById('stat-vit');
const statMp = document.getElementById('stat-mp');
const btnCloseStat = document.getElementById('close-stat-screen');

// Butonlar
const startButton = document.getElementById('start-button');
const skipCutsceneButton = document.getElementById('skip-cutscene');
const cutsceneText = document.getElementById('cutscene-text');
const returnToMenuButton = document.getElementById('return-to-menu-button');

// Harita DOM
const mapDisplay = document.getElementById('map-display');
const mapInfoBox = document.getElementById('map-info-box');
const mapActionButtons = document.getElementById('map-action-buttons');
const mapTrailsLayer = document.getElementById('map-trails-layer');

// Görsel Referansları
const heroDisplayContainer = document.getElementById('hero-display');
const heroDisplayImg = document.querySelector('#hero-display img');
const monsterDisplayImg = document.querySelector('#monster-display img');
const monsterIntentionOverlay = document.getElementById('monster-intention-overlay');
const fadeOverlay = document.getElementById('fade-overlay');
const heroStatusContainer = document.getElementById('hero-status-container');

// Campfire
const btnCampRest = document.getElementById('btn-camp-rest');
const btnCampTrain = document.getElementById('btn-camp-train');
const campfireOptionsDiv = document.getElementById('campfire-options');
const campfireResultDiv = document.getElementById('campfire-result');
const campfireResultTitle = document.getElementById('campfire-result-title');
const campfireResultText = document.getElementById('campfire-result-text');
const btnCampContinue = document.getElementById('btn-camp-continue');

// Event
const eventTitle = document.getElementById('event-title');
const eventDesc = document.getElementById('event-desc');
const eventChoicesContainer = document.getElementById('event-choices-container');

// Skill Book
const btnCloseSkillBook = document.getElementById('btn-close-skill-book');
const skillBookList = document.getElementById('skill-book-list');
const tabCommon = document.getElementById('tab-common'); 
const tabAttack = document.getElementById('tab-attack'); 
const tabPassion = document.getElementById('tab-passion'); 
const skillBookEquippedBar = document.getElementById('skill-book-equipped-bar');
const skillPointsDisplay = document.getElementById('skill-points-display'); 

// --- OYUN VERİLERİ ---
let isHeroTurn = true; 
const MAX_LEVEL = 60;

let hero = {
    name: "Barbar",
    playerName: "Oyuncu",
    class: "Barbar",
    baseAttack: 10,
    baseDefense: 1,
	currentAct: 1,
	
    
    // Gelen Hasarı Azaltan Dirençler (Defansif)
    baseResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
    
    // YENİ: Giden Hasara Eklenen Bonuslar (Ofansif - Hasar Motoru Buraya Bakar)
    elementalDamage: { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
    
    maxHp: 100, hp: 100,
    level: 1, xp: 0, xpToNextLevel: 100,
    maxRage: 100, rage: 0,
    gold: 0,
    
    statPoints: 0, 
    str: 15, dex: 10, int: 5, vit: 10, mp_pow: 0,
    
    skillPoints: 0, 
    unlockedSkills: [], 
    statusEffects: [],
    mapEffects: [],
    equippedSkills: [null, null, null, null, null, null], 
    
    inventory: new Array(8).fill(null), 
    brooches: new Array(6).fill(null), 
    equipment: {
        earring1: null, earring2: null,
        necklace: null, belt: null,
        ring1: null, ring2: null
    },
};

function generateXPTable(maxLevel) {
    const table = {};
    // Her level için sabit 5 XP
    for (let level = 1; level <= maxLevel; level++) {
        table[level] = 5;
    }
    return table;
}

// Parametre olarak çarpanı sildik çünkü sabit 5 oldu
const FULL_XP_REQUIREMENTS = generateXPTable(MAX_LEVEL);
hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level];

let monster = null; 

// EVENT HAVUZU
const EVENT_POOL = [
    {
        id: "berserk_brew", type: "turn_based", title: "Öfke İksiri", desc: "Yerde fokurdayan kırmızı bir şişe buldun.",
        option1: {
            text: "İç (Riskli Güç)",
            buff: "3 Tur: <span class='buff'>+15 Saldırı</span>",
            debuff: "3 Tur: <span class='debuff'>TÜM İyileşmeler Kilitli</span>",
            action: (hero) => {
                hero.statusEffects.push({ id: 'atk_up', name: 'Öfke', turns: 3, value: 15, waitForCombat: true });
                hero.statusEffects.push({ id: 'block_type', name: 'İyileşme Kilitli', turns: 3, blockedType: 'defense', waitForCombat: true });
            }
        },
        option2: { text: "Dök (Güvenli)", buff: "<span class='buff'>+10 XP</span>", debuff: "", action: (hero) => { gainXP(10); } }
    },
    {
        id: "stone_skin", type: "turn_based", title: "Taşlaşma Büyüsü", desc: "Eski bir parşömen.",
        option1: {
            text: "Büyüyü Oku",
            buff: "5 Tur: <span class='buff'>+10 Defans</span>",
            debuff: "5 Tur: <span class='debuff'>Yarı Hasar</span>",
            action: (hero) => {
                hero.statusEffects.push({ id: 'def_up', name: 'Taş Deri', turns: 5, value: 10, waitForCombat: true });
                hero.statusEffects.push({ id: 'atk_half', name: 'Hantal', turns: 5, waitForCombat: true }); 
            }
        },
        option2: { text: "Parşömeni Yak", buff: "<span class='buff'>+5 Rage</span>", debuff: "", action: (hero) => { hero.rage = Math.min(hero.maxRage, hero.rage + 5); } }
    },
    {
        id: "cursed_gold", type: "node_based", title: "Yorgunluk Laneti", desc: "Lanetli olduğu belli olan bir altın yığını.",
        option1: { text: "Altınları Al", buff: "Anında: <span class='buff'>+150 XP</span>", debuff: "2 Oda: <span class='debuff'>%60 Hasar</span>", action: (hero) => { gainXP(150); hero.mapEffects.push({ id: 'map_atk_weak', name: 'Yorgunluk', nodesLeft: 2, value: 0.6 }); } },
        option2: { text: "Uzaklaş", buff: "", debuff: "", action: (hero) => { } }
    },
    {
        id: "adrenaline", type: "node_based", title: "Adrenalin Meyvesi", desc: "Çok nadir bir meyve.",
        option1: { text: "Meyveyi Ye", buff: "2 Oda: <span class='buff'>+20 Max HP</span>", debuff: "Etki Bitince: <span class='debuff'>-30 Can Kaybı</span>", action: (hero) => { hero.maxHp += 20; hero.hp += 20; hero.mapEffects.push({ id: 'map_hp_boost', name: 'Adrenalin', nodesLeft: 2, val: 20 }); } },
        option2: { text: "Sakla", buff: "<span class='buff'>+10 HP</span>", debuff: "", action: (hero) => { hero.hp = Math.min(hero.maxHp, hero.hp + 10); } }
    },
    {
        id: "blood_pact", type: "permanent", title: "Kan Anlaşması", desc: "Kadim bir varlık fısıldıyor.",
        option1: { text: "Anlaşmayı Kabul Et", buff: "Kalıcı: <span class='buff'>+5 STR</span>", debuff: "Anında: <span class='debuff'>Canın %50'si Gider</span>", action: (hero) => { hero.str += 5; hero.hp = Math.floor(hero.hp / 2); } },
        option2: { text: "Reddet", buff: "", debuff: "", action: (hero) => {} }
    },
    {
        id: "gambler", type: "permanent", title: "Kumarbazın Ruhu", desc: "Önünde iki kadeh var.",
        option1: { 
            text: "Kırmızı Kadehi İç", 
            buff: "%50: <span class='buff'>Canı Fulle</span>", 
            debuff: "%50: <span class='debuff'>Canı 1'e İndir</span>", 
            action: (hero) => { 
                if (Math.random() > 0.5) { hero.hp = hero.maxHp; writeLog("Şanslısın! Canın fullendi."); } 
                else { hero.hp = 1; writeLog("Zehir! Canın 1'e düştü."); } 
            } 
        },
        option2: { text: "Masadan Kalk", buff: "", debuff: "", action: (hero) => {} }
    },
    {
        id: "random_campfire", 
        type: "neutral", 
        title: "Sönmüş Ateş", 
        desc: "Yol kenarında korları hala sıcak olan bir kamp alanı buldun. Ne yapacaksın?",
        option1: { 
            text: "Dinlen (+HP)", 
            buff: "<span class='buff'>+25 HP</span>", 
            debuff: "", 
            action: (hero) => { 
                const heal = 25;
                hero.hp = Math.min(hero.maxHp, hero.hp + heal); 
                writeLog(`🔥 Ateş başında dinlendin (+${heal} HP).`);
            } 
        },
        option2: { 
            text: "Antrenman Yap (+XP)", 
            buff: "<span class='buff'>+60 XP</span>", 
            debuff: "", 
            action: (hero) => { 
                const xp = 60;
                gainXP(xp); 
                writeLog(`⚔️ Ateş ışığında gölge dövüşü yaptın (+${xp} XP).`);
            } 
        }
    }
];

// DÜŞMAN HAVUZLARI
const TIER_1_ENEMIES = ["Zehirli Mantar", "Orman Örümceği", "Hırsız Kobold", "Kan Yarasası"];
const TIER_2_ENEMIES = ["Goblin Devriyesi", "Kaçak Haydut", "Gri Kurt"];
const TIER_3_ENEMIES = ["Yaban Domuzu", "Goblin Savaşçısı", "Kaya Golemi"];
const TIER_4_ENEMIES = ["Orc Fedaisi"];
const MAP_CONFIG = {
    totalStages: 15, // Toplam sütun sayısı (Soldan sağa uzunluk)
    lanes: 3,        // Satır sayısı (Yukarıdan aşağı genişlik)
    townStages: [4, 8, 12], // Hangi aşamalarda kesin Köy olacak? (0-indexli düşünürsek 3, 7, 11)
};

// Harita Verisi (JS Tarafından Doldurulacak)
let GAME_MAP = {
    nodes: [],      // Tüm düğümlerin listesi
    connections: [], // Hangi düğüm hangisine bağlı
    currentNodeId: null, // Oyuncunun şu anki konumu
    completedNodes: []   // Oyuncunun geçtiği düğümler
};
// SEVİYE ÖDÜL TABLOSU (Level: Verilecek Skill Puanı)
// Listede olmayan seviyeler için varsayılan olarak 0 (veya istersen 1) verilir.
const LEVEL_SKILL_REWARDS = {
    2: 2,  // 2. Seviyeye ulaşınca 2 puan
    4: 4,  // 4. Seviyede 4 puan
    6: 4,  // 6. Seviyede 4 puan
    8: 6,  // 8. Seviyede 6 puan
    10: 8, // Örnek: Tier 4 açılınca
    12: 10 // Örnek: Tier 5 açılınca
};