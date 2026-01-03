const ENEMY_STATS = {
    // --- TIER 1 ---
    "Zehirli Mantar": { 
        maxHp: 30, attack: 10, defense: 6, xp: 0, // XP artık dinamik hesaplanacak, buradaki 0 önemsiz
        tier: 1, // YENİ EKLENDİ
        idle: 'enemies/zehirli_mantar.webp',
        attackFrames: ['enemies/zehirli_mantar_attack1.webp', 'enemies/zehirli_mantar_attack2.webp', 'enemies/zehirli_mantar_attack3.webp'],
        dead: 'enemies/zehirli_mantar_dead.webp'
    },
    "Orman Örümceği": { 
        maxHp: 42, attack: 15, defense: 3, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/orman_orumcegi.webp',
        attackFrames: ['enemies/orman_orumcegi_attack1.webp', 'enemies/orman_orumcegi_attack2.webp', 'enemies/orman_orumcegi_attack3.webp'],
        dead: 'enemies/orman_orumcegi_dead.webp'
    },
    "Hırsız Kobold": { 
        maxHp: 48, attack: 20, defense: 0, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/hirsiz_kobold.webp',
        attackFrames: ['enemies/hirsiz_kobold_attack1.webp', 'enemies/hirsiz_kobold_attack2.webp'],
        dead: 'enemies/hirsiz_kobold_dead.webp'
    },
    "Kan Yarasası": { 
        maxHp: 40, attack: 20, defense: 0, xp: 0, 
        tier: 1, // YENİ
        idle: 'enemies/kan_yarasasi.webp',
        attackFrames: ['enemies/kan_yarasasi_attack1.webp', 'enemies/kan_yarasasi_attack2.webp'], 
        dead: 'enemies/kan_yarasasi_dead.webp'
    },

    // --- TIER 2 ---
    "Goblin Devriyesi": { 
        maxHp: 70, attack: 30, defense: 12, xp: 0, 
        tier: 2, // YENİ
        idle: 'enemies/goblin_devriyesi.webp',
        attackFrames: ['enemies/goblin_devriyesi_attack1.webp', 'enemies/goblin_devriyesi_attack2.webp'],
        dead: 'enemies/goblin_devriyesi_dead.webp'
    },
    "Kaçak Haydut": { 
        maxHp: 65, attack: 30, defense: 8, xp: 0, 
        tier: 2, // YENİ
        idle: 'enemies/kacak_haydut.webp',
        attackFrames: ['enemies/kacak_haydut_attack1.webp', 'enemies/kacak_haydut_attack2.webp', 'enemies/kacak_haydut_attack3.webp', 'enemies/kacak_haydut_attack4.webp'],
        dead: 'enemies/kacak_haydut_dead.webp'
    },
    "Gri Kurt": { 
        maxHp: 60, attack: 35, defense: 4, xp: 0, 
        tier: 2, // YENİ
        idle: 'enemies/kurt_surusu.webp',
        attackFrames: ['enemies/kurt_surusu_attack1.webp', 'enemies/kurt_surusu_attack2.webp', 'enemies/kurt_surusu_attack3.webp'],
        dead: 'enemies/kurt_surusu_dead.webp'
    },

    // --- TIER 3 ---
    "Yaban Domuzu": { 
        maxHp: 150, attack: 45, defense: 15, xp: 0, 
        tier: 3, // YENİ
        idle: 'enemies/yaban_domuzu.webp',
        attackFrames: ['enemies/yaban_domuzu_attack1.webp', 'enemies/yaban_domuzu_attack2.webp', 'enemies/yaban_domuzu_attack3.webp'],
        dead: 'enemies/yaban_domuzu_dead.webp'
    },
    "Goblin Savaşçısı": { 
        maxHp: 150, attack: 40, defense: 18, xp: 0, 
        tier: 3, // YENİ
        idle: 'enemies/goblin_savascisi.webp',
        attackFrames: ['enemies/goblin_savascisi_attack1.webp', 'enemies/goblin_savascisi_attack2.webp'],
        dead: 'enemies/goblin_savascisi_dead.webp'
    },
    "Kaya Golemi": { 
        maxHp: 200, attack: 20, defense: 23, xp: 0, 
        tier: 3, // YENİ
        idle: 'enemies/kaya_golemi.webp',
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp', 'enemies/kaya_golemi_attack3.webp', 'enemies/kaya_golemi_attack4.webp'],
        dead: 'enemies/kaya_golemi_dead.webp'
    },
    
    // --- TIER 4 ---
    "Orc Fedaisi": { 
        maxHp: 250, attack: 50, defense: 21, xp: 0, 
        tier: 4, // YENİ
        idle: 'enemies/orc_fedaisi.webp',
        attackFrames: ['enemies/orc_fedaisi_attack1.webp', 'enemies/orc_fedaisi_attack2.webp'],
        dead: 'enemies/orc_fedaisi_dead.webp'
    },

    // --- BOSS ---
    "Goblin Şefi": { 
        maxHp: 250, attack: 35, defense: 20, xp: 0, 
        tier: 5, // Boss T5 olsun
        idle: 'enemies/goblin_sef.webp',
        attackFrames: ['enemies/goblin_sef_attack1.webp', 'enemies/goblin_sef_attack2.webp'],
        dead: 'enemies/goblin_sef_dead.webp'
    }
};
// Düşman Havuzları
const TIER_1_ENEMIES = ["Zehirli Mantar", "Orman Örümceği", "Hırsız Kobold", "Kan Yarasası"];
const TIER_2_ENEMIES = ["Goblin Devriyesi", "Kaçak Haydut", "Gri Kurt"];
const TIER_3_ENEMIES = ["Yaban Domuzu", "Goblin Savaşçısı", "Kaya Golemi"];
const TIER_4_ENEMIES = ["Orc Fedaisi"];

Object.assign(ENEMY_STATS, {
    "İskelet Şövalye": { maxHp: 180, attack: 25, defense: 15, tier: 3, idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'] },
    "Gulyabani": { maxHp: 150, attack: 35, defense: 5, tier: 3, idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'] },
    "Kemik Golemi": { maxHp: 300, attack: 28, defense: 20, tier: 4, idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'] }
});