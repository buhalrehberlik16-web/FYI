// --- START OF FILE enemy_data.js ---

window.TRIBE_BASES = {
    "Greenskins": { fire: -5, cold: 0, lightning: 0, poison: 10, curse: 0 },
    "Humans": { fire: 0, cold: 0, lightning: 0, poison: 0, curse: -5 },
    //"Beasts&Monstrosities"
    "B&M": { fire: -10, cold: 5, lightning: 0, poison: 0, curse: 0 },
    "Plants": { fire: -20, cold: 0, lightning: 0, poison: 30, curse: 0 },
    "Undead": { fire: 10, cold: 20, lightning: 0, poison: 80, curse: -25 },
    "Dragonkind": { fire: 40, cold: 0, lightning: 0, poison: 0, curse: 10 },
    "Magical Creatures": { fire: 15, cold: 15, lightning: 15, poison: 0, curse: 20 }
};

window.ENEMY_STATS = {
    // --- TIER 1 ---
    "Zehirli Mantar": { 
        tribe: "Plants",
        specificResists: { poison: 20 },
        maxHp: 46, attack: 4, defense: 2, xp: 0, 
        tier: 1, 
        idle: 'enemies/zehirli_mantar.webp',
        attackFrames: ['enemies/zehirli_mantar_attack1.webp', 'enemies/zehirli_mantar_attack2.webp', 'enemies/zehirli_mantar_attack3.webp'],
        dead: 'enemies/zehirli_mantar_dead.webp',
        // AI VERİLERİ:
        firstTurnAction: "spore_poison", 
        skills: [
            { 
                id: "spore_poison", 
                category: "attack", // Hasar vurduğu için attack
                damageSplit: { physical: 0.5, poison: 0.8 } 
            },
            { id: "fungal_regrow", category: "buff" }
        ]
    },
    "Orman Örümceği": { 
        tribe: "B&M",
        specificResists: { poison: 20 },
        maxHp: 32, attack: 9, defense: 0, xp: 0, 
        tier: 1, 
        idle: 'enemies/orman_orumcegi.webp',
        attackFrames: ['enemies/orman_orumcegi_attack1.webp', 'enemies/orman_orumcegi_attack2.webp', 'enemies/orman_orumcegi_attack3.webp'],
        dead: 'enemies/orman_orumcegi_dead.webp',
        skills: [
            { id: "web_trap", category: "debuff" },
            { id: "chitin_harden", category: "buff" }
        ]
    },
    "Hırsız Kobold": {
        tribe: "Dragonkind",
        specificResists: { fire: 10, curse: 10 },
        maxHp: 48, attack: 7, defense: 0, xp: 0, 
        tier: 1, 
        idle: 'enemies/hirsiz_kobold.webp',
        attackFrames: ['enemies/hirsiz_kobold_attack1.webp', 'enemies/hirsiz_kobold_attack2.webp'],
        dead: 'enemies/hirsiz_kobold_dead.webp',
        skills: [
            { id: "pocket_sand", category: "debuff" },
            { id: "cowardly_dash", category: "buff" }
        ]
    },
    "Kan Yarasası": { 
        tribe: "B&M",
        specificResists: { poison: 20 },
        maxHp: 36, attack: 8, defense: 0, xp: 0, 
        tier: 1, 
        idle: 'enemies/kan_yarasasi.webp',
        attackFrames: ['enemies/kan_yarasasi_attack1.webp', 'enemies/kan_yarasasi_attack2.webp'], 
        dead: 'enemies/kan_yarasasi_dead.webp',
        skills: [
            { 
                id: "vampiric_bite", 
                category: "attack", 
                damageSplit: { physical: 0.4, curse: 0.6 } // Can çalma skilli
            }, 
            { id: "bat_shriek", category: "debuff" }
        ]
    },
    "İskelet": { 
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 40, attack: 6, defense: 3, xp: 0, 
        tier: 1, 
        idle: 'enemies/skeleton_idle.webp',
        attackFrames: ['enemies/skeleton_attack1.webp', 'enemies/skeleton_attack2.webp', 'enemies/skeleton_attack3.webp'], 
        dead: 'enemies/skeleton_dead.webp',
        // AI VERİLERİ:
        skills: [
            { id: "bone_shatter", category: "debuff" }, 
            { id: "undead_fortitude", category: "buff" } 
        ]
    },

    // --- TIER 2 ---
    "Goblin Devriyesi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 70, attack: 12, defense: 6, xp: 0, 
        tier: 2, 
        idle: 'enemies/goblin_devriyesi.webp',
        attackFrames: ['enemies/goblin_devriyesi_attack1.webp', 'enemies/goblin_devriyesi_attack2.webp'],
        dead: 'enemies/goblin_devriyesi_dead.webp',
        skills: [
            { id: "goblin_yell", category: "buff" }, 
            { id: "shield_wall", category: "debuff" }
        ]
    },
    "Kaçak Haydut": { 
        tribe: "Humans",
        specificResists: { cold: 10 },
        maxHp: 62, attack: 15, defense: 4, xp: 0, 
        tier: 2, 
        idle: 'enemies/kacak_haydut.webp',
        attackFrames: ['enemies/kacak_haydut_attack1.webp', 'enemies/kacak_haydut_attack2.webp', 'enemies/kacak_haydut_attack3.webp', 'enemies/kacak_haydut_attack4.webp'],
        dead: 'enemies/kacak_haydut_dead.webp',
        skills: [
            { 
                id: "dirty_strike", 
                category: "attack",
                damageSplit: { physical: 1.2, poison: 0.3 }
            }, 
            { id: "smoke_bomb", category: "debuff" }
        ]
    },
    "Gri Kurt": { 
        tribe: "B&M",
        specificResists: { cold: 20 },
        maxHp: 56, attack: 16, defense: 4, xp: 0, 
        tier: 2, 
        idle: 'enemies/kurt_surusu.webp',
        attackFrames: ['enemies/kurt_surusu_attack1.webp', 'enemies/kurt_surusu_attack2.webp', 'enemies/kurt_surusu_attack3.webp'],
        dead: 'enemies/kurt_surusu_dead.webp',
        // AI VERİLERİ:
        skills: [
            { id: "vicious_bite", category: "debuff" }, 
            { id: "howl", category: "buff" } 
        ]
    },

    // --- TIER 3 ---
    "Yaban Domuzu": { 
        tribe: "B&M",
        specificResists: { cold: 10 },
        maxHp: 120, attack: 25, defense: 12, xp: 0, 
        tier: 3, 
        idle: 'enemies/yaban_domuzu.webp',
        attackFrames: ['enemies/yaban_domuzu_attack1.webp', 'enemies/yaban_domuzu_attack2.webp', 'enemies/yaban_domuzu_attack3.webp'],
        dead: 'enemies/yaban_domuzu_dead.webp',
        skills: [
            { id: "trample", category: "debuff" }, 
            { id: "thick_hide", category: "buff" }
        ]
    },
    "Goblin Savaşçısı": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 100, attack: 30, defense: 15, xp: 0, 
        tier: 3, 
        idle: 'enemies/goblin_savascisi.webp',
        attackFrames: ['enemies/goblin_savascisi_attack1.webp', 'enemies/goblin_savascisi_attack2.webp'],
        dead: 'enemies/goblin_savascisi_dead.webp',
        skills: [
            { id: "mace_bash", category: "debuff" },
            { id: "berserker_rage", category: "buff" }
        ]
    },
    "Kaya Golemi": { 
        tribe: "Magical Creatures",
        specificResists: { lightning: 10 },
        maxHp: 150, attack: 18, defense: 23, xp: 0, 
        tier: 3, 
        idle: 'enemies/kaya_golemi.webp',
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp', 'enemies/kaya_golemi_attack3.webp', 'enemies/kaya_golemi_attack4.webp'],
        dead: 'enemies/kaya_golemi_dead.webp',
        skills: [
            { id: "ground_slam", category: "debuff" }, 
            { id: "stone_form", category: "buff" }
        ]
    },
    
    "Orc Fedaisi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 200, attack: 40, defense: 21, xp: 0, 
        tier: 4, 
        idle: 'enemies/orc_fedaisi.webp',
        attackFrames: ['enemies/orc_fedaisi_attack1.webp', 'enemies/orc_fedaisi_attack2.webp'],
        dead: 'enemies/orc_fedaisi_dead.webp',
        skills: [
            { 
                id: "crushing_blow", 
                category: "attack",
                damageSplit: { physical: 1.5, fire: 0.2 } 
            }, 
            { id: "iron_will", category: "buff" }
        ]
    },

    // --- TIER 4 --- // --- BOSS ---
    "Goblin Şefi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 250, attack: 35, defense: 20, isBoss:true,
        tier: 4, 
        idle: 'enemies/goblin_sef.webp',
        attackFrames: ['enemies/goblin_sef_attack1.webp', 'enemies/goblin_sef_attack2.webp'],
        dead: 'enemies/goblin_sef_dead.webp',
        skills: [
            { id: "chief_command", category: "buff" },
            { id: "last_stand", category: "buff" }
        ]
    }
};

// Düşman Havuzları
window.TIER_ENEMIES = {
    1: ["Zehirli Mantar", "Orman Örümceği", "Hırsız Kobold", "Kan Yarasası", "İskelet"],
    2: ["Goblin Devriyesi", "Kaçak Haydut", "Gri Kurt"],
    3: ["Yaban Domuzu", "Goblin Savaşçısı", "Kaya Golemi"],
    "B1": ["Goblin Şefi"], //Boss
    4: ["İskelet Şövalye", "Gulyabani", "Kemik Golemi", "Orc Fedaisi"], 
    5: [], 
    6: [],
    "B2": [],
    7: [],
    8: [],
    9: [],
    "B3": [],
    10: []
};

Object.assign(ENEMY_STATS, {
    "İskelet Şövalye": { 
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 180, attack: 25, 
        defense: 15, tier: 4, 
        idle: 'enemies/kaya_golemi.webp', 
        dead: 'enemies/kaya_golemi_dead.webp', 
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'],
        skills: [{ id: "cursed_blade", category: "attack", damageSplit: { physical: 0.8, curse: 0.5 } }] 
    },
    
    "Gulyabani": {
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 150, 
        attack: 35, 
        defense: 5, 
        tier: 4, 
        idle: 'enemies/kaya_golemi.webp', 
        dead: 'enemies/kaya_golemi_dead.webp', 
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'],
        skills: [{ id: "paralyzing_claws", category: "debuff" }]
    },
    
    "Kemik Golemi": { 
        tribe: "Magical Creatures",
        specificResists: { cold: 10 },
        maxHp: 300, 
        attack: 28, 
        defense: 20, 
        tier: 4, 
        idle: 'enemies/kaya_golemi.webp', 
        dead: 'enemies/kaya_golemi_dead.webp', 
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'],
        skills: [{ id: "marrow_drain", category: "attack", damageSplit: { physical: 0.3, curse: 1.0 } }]
    },
});

window.BIOME_WEIGHTS = {
    // Düşman İsmi: { biyom_adi: ihtimal_orani }
    "Zehirli Mantar": { forest: 0.6, plains: 0.2, cave: 0.1, iceland: 0.05, mountain: 0.05, urban: 0.0 },
    "Orman Örümceği": { forest: 0.5, cave: 0.3, plains: 0.1, iceland: 0.0, mountain: 0.1, urban: 0.0 },
    "Hırsız Kobold":  { plains: 0.4, forest: 0.3, urban: 0.2, mountain: 0.1, cave: 0.0, iceland: 0.0 },
    "Kan Yarasası":   { cave: 0.5, urban: 0.2, forest: 0.1, mountain: 0.1, plains: 0.05, iceland: 0.05 },
    "İskelet":        { urban: 0.4, cave: 0.3, forest: 0.1, plains: 0.1, mountain: 0.1, iceland: 0.0 },
    "Goblin Devriyesi": { plains: 0.4, forest: 0.4, mountain: 0.1, urban: 0.1, cave: 0.0, iceland: 0.0 },
    "Kaçak Haydut":   { urban: 0.5, plains: 0.3, forest: 0.1, mountain: 0.1, cave: 0.0, iceland: 0.0 },
    "Gri Kurt":       { iceland: 0.4, forest: 0.3, plains: 0.2, mountain: 0.1, cave: 0.0, urban: 0.0 },
    "Yaban Domuzu":   { forest: 0.4, plains: 0.4, mountain: 0.1, iceland: 0.1, cave: 0.0, urban: 0.0 },
    "Goblin Savaşçısı": { plains: 0.3, urban: 0.3, forest: 0.2, cave: 0.1, mountain: 0.1, iceland: 0.0 },
    "Kaya Golemi":    { mountain: 0.6, cave: 0.3, plains: 0.1, iceland: 0.0, forest: 0.0, urban: 0.0 },
    "İskelet Şövalye": { urban: 0.6, cave: 0.2, mountain: 0.1, forest: 0.1, plains: 0.0, iceland: 0.0 },
    "Gulyabani":      { cave: 0.4, urban: 0.4, forest: 0.1, mountain: 0.1, plains: 0.0, iceland: 0.0 },
    "Orc Fedaisi":    { mountain: 0.4, urban: 0.3, plains: 0.2, forest: 0.1, cave: 0.0, iceland: 0.0 },
    "Kemik Golemi":   { urban: 0.4, cave: 0.4, mountain: 0.2, forest: 0.0, plains: 0.0, iceland: 0.0 },
    "Goblin Şefi":    { urban: 0.7, plains: 0.2, mountain: 0.1, forest: 0.0, cave: 0.0, iceland: 0.0 }
};

// Savaş dışı node'lar (Town, Choice) için varsayılan ağırlıklar
window.DEFAULT_BIOME_WEIGHTS = { forest: 0.2, plains: 0.2, cave: 0.1, iceland: 0.1, mountain: 0.2, urban: 0.2 };