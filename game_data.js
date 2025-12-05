// game_data.js

// =========================================================
// 1. DOM REFERANSLARI
// =========================================================

const attackButton = document.getElementById('attack-button');
const defendButton = document.getElementById('defend-button');
const heroHpBar = document.getElementById('hero-hp-bar');
const monsterHpBar = document.getElementById('monster-hp-bar');
const heroHpText = document.getElementById('hero-hp-text');
const monsterHpText = document.getElementById('monster-hp-text');
const heroNameDisplay = document.getElementById('hero-name');
const monsterNameDisplay = document.getElementById('monster-name');
const heroRageBar = document.getElementById('hero-rage-bar');
const heroRageText = document.getElementById('hero-rage-text');

// Skill Bar
const skillButtonsContainer = document.getElementById('skill-bar-container');

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

// Stat Elementleri
const statName = document.getElementById('stat-name');
const statClass = document.getElementById('stat-class');
const statLevel = document.getElementById('stat-level');
const statXp = document.getElementById('stat-xp');
const statHp = document.getElementById('stat-hp');
const statAtk = document.getElementById('stat-atk');
const statDef = document.getElementById('stat-def');
const statStr = document.getElementById('stat-str');
const statDex = document.getElementById('stat-dex');
const statInt = document.getElementById('stat-int');
const statMp = document.getElementById('stat-mp');
const btnCloseStat = document.getElementById('close-stat-screen');

// Butonlar ve Metinler
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

// Campfire Elementleri
const btnCampRest = document.getElementById('btn-camp-rest');
const btnCampTrain = document.getElementById('btn-camp-train');
const campfireOptionsDiv = document.getElementById('campfire-options');
const campfireResultDiv = document.getElementById('campfire-result');
const campfireResultTitle = document.getElementById('campfire-result-title');
const campfireResultText = document.getElementById('campfire-result-text');
const btnCampContinue = document.getElementById('btn-camp-continue');

// Event Elementleri
const eventTitle = document.getElementById('event-title');
const eventDesc = document.getElementById('event-desc');
const eventChoicesContainer = document.getElementById('event-choices-container');

// Skill Book
const btnCloseSkillBook = document.getElementById('btn-close-skill-book');
const skillBookList = document.getElementById('skill-book-list');
const tabAttack = document.getElementById('tab-attack');
const tabDefense = document.getElementById('tab-defense');
const skillBookEquippedBar = document.getElementById('skill-book-equipped-bar');

// =========================================================
// 2. OYUN VERİLERİ & XP
// =========================================================

let isHeroTurn = true; 
const MAX_LEVEL = 60;

let hero = {
    name: "Barbar",
    playerName: "Oyuncu",
    maxHp: 100, hp: 100,
    attack: 20, defense: 5,
    level: 1, xp: 0, xpToNextLevel: 100,
    maxRage: 100, rage: 0,
    
    str: 15, dex: 10, int: 5, mp_pow: 0,
    
    statusEffects: [],
    mapEffects: [],

    equippedSkills: ['hell_blade', 'minor_healing', null, null] 
};

function generateXPTable(maxLevel, multiplier) {
    const table = {};
    table[1] = 100; table[2] = 200; table[3] = 400;
    let currentXP = 400; 
    for (let level = 4; level < maxLevel; level++) {
        currentXP = Math.floor(currentXP * multiplier);
        if (currentXP > 10000000) currentXP = 10000000;
        table[level] = currentXP;
    }
    table[maxLevel] = Infinity; 
    return table;
}

const FULL_XP_REQUIREMENTS = generateXPTable(MAX_LEVEL, 2);
hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level];

let monster = null; 

// =========================================================
// 3. EVENT HAVUZU (GÜNCELLENDİ: +15 DEFANS & HEAL BLOCK)
// =========================================================
const EVENT_POOL = [
    // --- KATEGORİ 1: TURN-BASED (Savaş İçi) ---
    {
        id: "berserk_brew",
        type: "turn_based",
        title: "Koruyucu İksir",
        desc: "Şişenin içindeki sıvı taşa benziyor. Seni koruyabilir ama büyü yapmanı engelleyebilir.",
        option1: {
            text: "İç (Riskli Koruma)",
            // GÜNCELLEME: Atak yerine Defans veriyor
            buff: "Sonraki Savaş: 3 Tur <span class='buff'>+15 Defans</span>",
            debuff: "Sonraki Savaş: 3 Tur <span class='debuff'>TÜM İyileşmeler Kilitli</span>",
            action: (hero) => {
                // +15 Defans
                hero.statusEffects.push({ 
                    id: 'def_up', name: 'Taş Koruma', turns: 3, value: 15, waitForCombat: true 
                });
                // İyileşme (Defense type) kilitli
                hero.statusEffects.push({ 
                    id: 'block_type', name: 'İyileşme Kilitli', turns: 3, blockedType: 'defense', waitForCombat: true 
                });
            }
        },
        option2: {
            text: "Dök (Güvenli)",
            buff: "<span class='buff'>+10 XP</span>",
            debuff: "",
            action: (hero) => { gainXP(10); }
        }
    },
    {
        id: "stone_skin",
        type: "turn_based",
        title: "Taşlaşma Büyüsü",
        desc: "Eski bir parşömen. Okursan derini taşa çevirebilir.",
        option1: {
            text: "Büyüyü Oku",
            buff: "Sonraki Savaş: 5 Tur <span class='buff'>+10 Defans</span>",
            debuff: "Sonraki Savaş: 5 Tur <span class='debuff'>Yarı Hasar</span>",
            action: (hero) => {
                hero.statusEffects.push({ 
                    id: 'def_up', name: 'Taş Deri', turns: 5, value: 10, waitForCombat: true 
                });
                hero.statusEffects.push({ 
                    id: 'atk_half', name: 'Hantal', turns: 5, waitForCombat: true 
                }); 
            }
        },
        option2: {
            text: "Parşömeni Yak",
            buff: "<span class='buff'>+5 Rage</span>",
            debuff: "",
            action: (hero) => { hero.rage = Math.min(hero.maxRage, hero.rage + 5); }
        }
    },

    // --- KATEGORİ 2: NODE-BASED (Harita/Oda Bazlı) ---
    {
        id: "cursed_gold",
        type: "node_based",
        title: "Yorgunluk Laneti",
        desc: "Lanetli olduğu belli olan bir altın yığını. Alırsan tecrübe kazanırsın ama yorulursun.",
        option1: {
            text: "Altınları Al",
            buff: "Anında: <span class='buff'>+150 XP</span>",
            debuff: "2 Oda Boyunca: <span class='debuff'>%60 Hasar</span>",
            action: (hero) => {
                gainXP(150);
                hero.mapEffects.push({ id: 'map_atk_weak', name: 'Yorgunluk', nodesLeft: 2, value: 0.6 }); 
            }
        },
        option2: { text: "Uzaklaş", buff: "", debuff: "", action: (hero) => { } }
    },
    {
        id: "adrenaline",
        type: "node_based",
        title: "Adrenalin Meyvesi",
        desc: "Çok nadir bir meyve. Seni geçici olarak insanüstü yapar.",
        option1: {
            text: "Meyveyi Ye",
            buff: "2 Oda Boyunca: <span class='buff'>+20 Max HP</span>",
            debuff: "Etki Bitince: <span class='debuff'>-30 Can Kaybı</span>",
            action: (hero) => {
                hero.maxHp += 20;
                hero.hp += 20;
                hero.mapEffects.push({ id: 'map_hp_boost', name: 'Adrenalin', nodesLeft: 2, val: 20 });
            }
        },
        option2: {
            text: "Sakla (Sadece ye)",
            buff: "<span class='buff'>+10 HP</span>",
            debuff: "",
            action: (hero) => { hero.hp = Math.min(hero.maxHp, hero.hp + 10); }
        }
    },

    // --- KATEGORİ 3: PERMANENT / INSTANT ---
    {
        id: "blood_pact",
        type: "permanent",
        title: "Kan Anlaşması",
        desc: "Kadim bir varlık fısıldıyor.",
        option1: {
            text: "Anlaşmayı Kabul Et",
            buff: "Kalıcı: <span class='buff'>+5 STR</span>",
            debuff: "Anında: <span class='debuff'>Canın %50'si Gider</span>",
            action: (hero) => {
                hero.str += 5;
                hero.hp = Math.floor(hero.hp / 2);
            }
        },
        option2: { text: "Reddet", buff: "", debuff: "", action: (hero) => {} }
    },
    {
        id: "gambler",
        type: "permanent",
        title: "Kumarbazın Ruhu",
        desc: "Önünde iki kadeh var.",
        option1: {
            text: "Kırmızı Kadehi İç",
            buff: "%50: <span class='buff'>Canı Fulle</span>",
            debuff: "%50: <span class='debuff'>Canı 1'e İndir</span>",
            action: (hero) => {
                if (Math.random() > 0.5) {
                    hero.hp = hero.maxHp;
                    writeLog("Şanslısın! Canın fullendi.");
                } else {
                    hero.hp = 1;
                    writeLog("Zehir! Canın 1'e düştü.");
                }
            }
        },
        option2: { text: "Masadan Kalk", buff: "", debuff: "", action: (hero) => {} }
    }
];

const RANDOM_ENEMY_POOL = ["Goblin Devriyesi", "Yaban Domuzu", "Goblin Savaşçısı", "Zehirli Mantar", "Orman Örümceği", "Kaçak Haydut", "Kurt Sürüsü", "Kaya Golemi"];

const ACT_1_MAP = {
    totalNodes: 12, currentNodeId: 1, 
    nodes: {
        1: { type: 'encounter', enemy: 'Goblin Devriyesi', text: "Maceran başlıyor.", next: [2] }, 
        2: { type: 'choice', text: "Yol ikiye ayrılıyor.", next: [3, 4] }, 
        3: { type: 'encounter', enemy: 'Orman Örümceği', text: "Örümcek yolu.", next: [5] }, 
        4: { type: 'encounter', enemy: 'Kaçak Haydut', text: "Haydut pusu.", next: [5] }, 
        5: { type: 'encounter', enemy: 'Zehirli Mantar', text: "Zehirli mantar.", next: [6] }, 
        6: { type: 'campfire', text: "Güvenli kamp.", next: [7, 8] }, 
        7: { type: 'encounter', enemy: 'Kurt Sürüsü', text: "Kurtlar.", next: [9] }, 
        8: { type: 'encounter', enemy: 'Yaban Domuzu', text: "Domuz.", next: [9] }, 
        9: { type: 'encounter', enemy: 'Kaya Golemi', text: "Golem.", next: [10] }, 
        10: { type: 'encounter', enemy: 'Orc Fedaisi', text: "Orc.", next: [11] }, 
        11: { type: 'encounter', enemy: 'Goblin Şefi', text: "Boss.", next: [12] }, 
        12: { type: 'town', text: "Köy.", next: [] }
    }
};