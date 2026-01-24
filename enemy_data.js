window.ENEMY_STATS = {
    // --- TIER 1 ---
    "Zehirli Mantar": { 
        maxHp: 30, attack: 5, defense: 2, xp: 0, // XP artık dinamik hesaplanacak, buradaki 0 önemsiz
        tier: 1, // YENİ EKLENDİ
        idle: 'enemies/zehirli_mantar.webp',
        attackFrames: ['enemies/zehirli_mantar_attack1.webp', 'enemies/zehirli_mantar_attack2.webp', 'enemies/zehirli_mantar_attack3.webp'],
        dead: 'enemies/zehirli_mantar_dead.webp',
		// AI VERİLERİ:
        firstTurnAction: "spore_poison", // İlk tur %100 zehir
        skills: [
            { id: "spore_poison", category: "utility" },
            { id: "fungal_regrow", category: "survival" }
        ]
    },
    "Orman Örümceği": { 
        maxHp: 42, attack: 8, defense: 1, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/orman_orumcegi.webp',
        attackFrames: ['enemies/orman_orumcegi_attack1.webp', 'enemies/orman_orumcegi_attack2.webp', 'enemies/orman_orumcegi_attack3.webp'],
        dead: 'enemies/orman_orumcegi_dead.webp',
		skills: [{ id: "web_trap", category: "utility" }, { id: "chitin_harden", category: "survival" }]
    },
    "Hırsız Kobold": { 
        maxHp: 48, attack: 8, defense: 0, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/hirsiz_kobold.webp',
        attackFrames: ['enemies/hirsiz_kobold_attack1.webp', 'enemies/hirsiz_kobold_attack2.webp'],
        dead: 'enemies/hirsiz_kobold_dead.webp',
		skills: [{ id: "pocket_sand", category: "utility" }, { id: "cowardly_dash", category: "survival" }]
    },
    "Kan Yarasası": { 
        maxHp: 40, attack: 8, defense: 0, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/kan_yarasasi.webp',
        attackFrames: ['enemies/kan_yarasasi_attack1.webp', 'enemies/kan_yarasasi_attack2.webp'], 
        dead: 'enemies/kan_yarasasi_dead.webp',
		skills: [{ id: "vampiric_bite", category: "utility" }, { id: "bat_shriek", category: "survival" }]
    },
	"İskelet": { 
        maxHp: 50, attack: 7, defense: 2, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/skeleton_idle.webp',
        attackFrames: ['enemies/skeleton_attack1.webp', 'enemies/skeleton_attack2.webp', 'enemies/skeleton_attack3.webp'], 
        dead: 'enemies/skeleton_dead.webp',
		// AI VERİLERİ:
        skills: [
            { id: "bone_shatter", category: "utility" }, // Zırh kırma
            { id: "undead_fortitude", category: "survival" } // Defans artışı
        ]
    },

    // --- TIER 2 ---
    "Goblin Devriyesi": { 
        maxHp: 70, attack: 30, defense: 12, xp: 0, 
        tier: 2, // YENİ
        idle: 'enemies/goblin_devriyesi.webp',
        attackFrames: ['enemies/goblin_devriyesi_attack1.webp', 'enemies/goblin_devriyesi_attack2.webp'],
        dead: 'enemies/goblin_devriyesi_dead.webp',
		skills: [{ id: "goblin_yell", category: "utility" }, { id: "shield_wall", category: "survival" }]
    },
    "Kaçak Haydut": { 
        maxHp: 65, attack: 30, defense: 8, xp: 0, 
        tier: 2, // YENİ
        idle: 'enemies/kacak_haydut.webp',
        attackFrames: ['enemies/kacak_haydut_attack1.webp', 'enemies/kacak_haydut_attack2.webp', 'enemies/kacak_haydut_attack3.webp', 'enemies/kacak_haydut_attack4.webp'],
        dead: 'enemies/kacak_haydut_dead.webp',
		skills: [{ id: "dirty_strike", category: "utility" }, { id: "smoke_bomb", category: "survival" }]
    },
    "Gri Kurt": { 
        maxHp: 60, attack: 35, defense: 4, xp: 0, 
        tier: 2, // YENİ
        idle: 'enemies/kurt_surusu.webp',
        attackFrames: ['enemies/kurt_surusu_attack1.webp', 'enemies/kurt_surusu_attack2.webp', 'enemies/kurt_surusu_attack3.webp'],
        dead: 'enemies/kurt_surusu_dead.webp',
		// AI VERİLERİ:
        skills: [
            { id: "vicious_bite", category: "utility" }, // Kanama (Rage azaltma)
            { id: "howl", category: "survival" } // Atak buff
        ]
    },

    // --- TIER 3 ---
    "Yaban Domuzu": { 
        maxHp: 150, attack: 45, defense: 15, xp: 0, 
        tier: 3, // YENİ
        idle: 'enemies/yaban_domuzu.webp',
        attackFrames: ['enemies/yaban_domuzu_attack1.webp', 'enemies/yaban_domuzu_attack2.webp', 'enemies/yaban_domuzu_attack3.webp'],
        dead: 'enemies/yaban_domuzu_dead.webp',
		skills: [{ id: "trample", category: "utility" }, { id: "thick_hide", category: "survival" }]
    },
    "Goblin Savaşçısı": { 
        maxHp: 150, attack: 40, defense: 18, xp: 0, 
        tier: 3, // YENİ
        idle: 'enemies/goblin_savascisi.webp',
        attackFrames: ['enemies/goblin_savascisi_attack1.webp', 'enemies/goblin_savascisi_attack2.webp'],
        dead: 'enemies/goblin_savascisi_dead.webp',
		skills: [{ id: "mace_bash", category: "utility" }, { id: "berserker_rage", category: "survival" }]
    },
    "Kaya Golemi": { 
        maxHp: 200, attack: 20, defense: 23, xp: 0, 
        tier: 3, // YENİ
        idle: 'enemies/kaya_golemi.webp',
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp', 'enemies/kaya_golemi_attack3.webp', 'enemies/kaya_golemi_attack4.webp'],
        dead: 'enemies/kaya_golemi_dead.webp',
		skills: [{ id: "ground_slam", category: "utility" }, { id: "stone_form", category: "survival" }]
    },
    
    "Orc Fedaisi": { 
        maxHp: 250, attack: 50, defense: 21, xp: 0, 
        tier: 4, // YENİ
        idle: 'enemies/orc_fedaisi.webp',
        attackFrames: ['enemies/orc_fedaisi_attack1.webp', 'enemies/orc_fedaisi_attack2.webp'],
        dead: 'enemies/orc_fedaisi_dead.webp',
		skills: [{ id: "crushing_blow", category: "utility" }, { id: "iron_will", category: "survival" }]
    },

    // --- TIER 4 --- // --- BOSS ---
    "Goblin Şefi": { 
        maxHp: 250, attack: 35, defense: 20, xp: 0, isBoss:true,
        tier: 5, // Boss T5 olsun
        idle: 'enemies/goblin_sef.webp',
        attackFrames: ['enemies/goblin_sef_attack1.webp', 'enemies/goblin_sef_attack2.webp'],
        dead: 'enemies/goblin_sef_dead.webp',
		skills: [{ id: "chief_command", category: "utility" }, { id: "last_stand", category: "survival" }]
    }
};
// Düşman Havuzları
window.TIER_ENEMIES = {
    1: ["Zehirli Mantar", "Orman Örümceği", "Hırsız Kobold", "Kan Yarasası", "İskelet"],
    2: ["Goblin Devriyesi", "Kaçak Haydut", "Gri Kurt"],
    3: ["Yaban Domuzu", "Goblin Savaşçısı", "Kaya Golemi", "Orc Fedaisi"],
    4: ["Goblin Şefi"], //Boss
    5: ["İskelet Şövalye", "Gulyabani", "Kemik Golemi"], 
    6: [], // Buradan sonrasını yeni ekleyeceğin düşmanlarla doldurabilirsin
    7: [],
    8: [],
    9: [],
    10: []
};

Object.assign(ENEMY_STATS, {
    "İskelet Şövalye": { maxHp: 180, attack: 25, defense: 15, tier: 3, idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'] },
    "Gulyabani": { maxHp: 150, attack: 35, defense: 5, tier: 3, idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'] },
    "Kemik Golemi": { maxHp: 300, attack: 28, defense: 20, tier: 4, idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'] }
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