// js/ui/ui_elements.js

// --- EKRANLAR ---
window.startScreen = document.getElementById('start-screen');
window.nameEntryScreen = document.getElementById('name-entry-screen');
window.classSelectionScreen = document.getElementById('class-selection-screen');
window.cutsceneScreen = document.getElementById('cutscene-screen');
window.mapScreen = document.getElementById('map-screen');
window.battleScreen = document.getElementById('battle-screen');
window.inventoryScreen = document.getElementById('inventory-screen');
window.statScreen = document.getElementById('stat-screen');
window.skillBookScreen = document.getElementById('skill-book-screen');
window.rewardScreen = document.getElementById('reward-screen');
window.gameOverScreen = document.getElementById('game-over-screen');
window.townScreen = document.getElementById('town-screen');
window.cityScreen = document.getElementById('city-screen');
window.basicSkillSelectionScreen = document.getElementById('basic-skill-selection-screen');
window.campfireScreen = document.getElementById('campfire-screen');
window.eventScreen = document.getElementById('event-screen');
window.starterCityScreen = document.getElementById('starter-city-screen');

// --- ÜST BAR VE NAVİGASYON ---
window.topHeroName = document.getElementById('top-hero-name');
window.topHeroLevel = document.getElementById('top-hero-level');
window.btnOpenSkills = document.getElementById('btn-open-skills');
window.btnOpenStats = document.getElementById('btn-open-stats');
window.btnOpenInventory = document.getElementById('btn-open-inventory');
window.statNotif = document.getElementById('notif-stat');
window.skillNotif = document.getElementById('notif-skill');

// --- SAVAŞ HUD ELEMENTLERİ ---
window.heroNameDisplay = document.getElementById('hero-name');
window.heroHpBar = document.getElementById('hero-hp-bar');
window.heroHpText = document.getElementById('hero-hp-text');
window.heroRageBar = document.getElementById('hero-rage-bar');
window.heroRageText = document.getElementById('hero-rage-text');
window.monsterNameDisplay = document.getElementById('monster-name');
window.monsterHpBar = document.getElementById('monster-hp-bar');
window.monsterHpText = document.getElementById('monster-hp-text');
window.monsterIntentionOverlay = document.getElementById('monster-intention-overlay');
window.heroStatusContainer = document.getElementById('hero-status-container');
window.heroDisplayContainer = document.getElementById('hero-display');
window.heroDisplayImg = document.querySelector('#hero-display img');
window.monsterDisplayImg = document.querySelector('#monster-display img');
window.btnBasicAttack = document.getElementById('btn-basic-attack');
window.btnBasicDefend = document.getElementById('btn-basic-defend');
window.turnCountDisplay = document.getElementById('turn-count-display');

// --- STAT (U) ELEMENTLERİ ---
window.statName = document.getElementById('stat-name');
window.statClass = document.getElementById('stat-class');
window.statLevel = document.getElementById('stat-level');
window.statXp = document.getElementById('stat-xp');
window.statHp = document.getElementById('stat-hp');
window.statRage = document.getElementById('stat-rage'); 
window.statAtk = document.getElementById('stat-atk');
window.statDef = document.getElementById('stat-def');
window.statStr = document.getElementById('stat-str');
window.statDex = document.getElementById('stat-dex');
window.statInt = document.getElementById('stat-int');
window.statVit = document.getElementById('stat-vit');
window.statMp = document.getElementById('stat-mp');
window.statPointsDisplay = document.getElementById('stat-points-display');

// --- YETENEK KİTABI (K) ---
window.skillBookList = document.getElementById('skill-book-list');
window.skillBookEquippedBar = document.getElementById('skill-book-equipped-bar');
window.skillPointsDisplay = document.getElementById('skill-points-display');
window.skillButtonsContainer = document.getElementById('skill-bar-container');

// --- BUTONLAR VE METİNLER ---
window.startButton = document.getElementById('start-button');
window.skipCutsceneButton = document.getElementById('skip-cutscene');
window.cutsceneText = document.getElementById('cutscene-text'); // Hata buradaydı!
window.btnConfirmBasicSkills = document.getElementById('btn-confirm-basic-skills');
window.returnToMenuButton = document.getElementById('return-to-menu-button');
window.btnCloseSkillBook = document.getElementById('btn-close-skill-book');
window.btnCloseStat = document.getElementById('close-stat-screen');
window.btnCloseInventory = document.getElementById('btn-close-inventory');
window.btnLeaveTown = document.getElementById('btn-leave-town');
window.fadeOverlay = document.getElementById('fade-overlay');

// --- KAMP VE ÖDÜL ---
window.rewardList = document.getElementById('reward-list');
window.btnRewardContinue = document.getElementById('btn-reward-continue');
window.eventTitle = document.getElementById('event-title');
window.eventDesc = document.getElementById('event-desc');
window.eventChoicesContainer = document.getElementById('event-choices-container');
window.btnCampRest = document.getElementById('btn-camp-rest');
window.btnCampTrain = document.getElementById('btn-camp-train');
window.btnCampContinue = document.getElementById('btn-camp-continue');
window.campfireOptionsDiv = document.getElementById('campfire-options');
window.campfireResultDiv = document.getElementById('campfire-result');
window.campfireResultTitle = document.getElementById('campfire-result-title');
window.campfireResultText = document.getElementById('campfire-result-text');


// --- TIER VE BADGE ---
window.getItemBadgeHTML = function(item) {
    if (!item) return "";
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;
    if (rules.badgeType === "craft") {
        return `<span class="item-tier-badge badge-craft">C</span>`;
    }
    return `<span class="item-tier-badge badge-${item.tier}">T${item.tier}</span>`;
};

// UI Kısıtlamasını merkezi kurala göre kontrol eder
window.isItemAllowedInUI = function(item, uiKey) {
    if (!item) return false;
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;
    const permissions = {
        'blacksmith': rules.canSalvage,
        'alchemist_transmute': rules.canTransmute,
        'alchemist_synthesis': rules.canSynthesize,
        'equip': rules.canEquip,
		'reforge': rules.canReforge,
    };
    return permissions[uiKey] || false;
};

window.getItemLevelLabel = function(item) {
    if (!item) return "";
    
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    // 1. ÖNCE BROŞ KONTROLÜ
    if (item.type === 'brooch') {
        // Eğer tier_label yoksa yedek olarak "SEVİYE" yaz
        const label = lang.tier_label || (currentLang === 'tr' ? "SEVİYE" : "TIER");
        return `${label} ${item.tier}`;
    }

    // 2. MATERYAL KONTROLÜ
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;
    if (rules.badgeType === "craft") {
        return lang.items.material_label || (currentLang === 'tr' ? "MATERYAL" : "MATERIAL");
    }
    
    // 3. NORMAL TAKILAR
    const label = lang.tier_label || (currentLang === 'tr' ? "SEVİYE" : "TIER");
    return `${label} ${item.tier}`;
};