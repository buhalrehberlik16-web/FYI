const ENEMY_STATS = {
    // --- TIER 1 ---
    "Zehirli Mantar": { 
        maxHp: 30, attack: 10, defense: 6, xp: 0, // XP artık dinamik hesaplanacak, buradaki 0 önemsiz
        tier: 1, // YENİ EKLENDİ
        idle: 'zehirli_mantar.png',
        attackFrames: ['zehirli_mantar_attack1.png', 'zehirli_mantar_attack2.png', 'zehirli_mantar_attack3.png'],
        dead: 'zehirli_mantar_dead.png'
    },
    "Orman Örümceği": { 
        maxHp: 42, attack: 15, defense: 3, xp: 0, 
        tier: 1, // YENİ
        idle: 'orman_orumcegi.png',
        attackFrames: ['orman_orumcegi_attack1.png', 'orman_orumcegi_attack2.png', 'orman_orumcegi_attack3.png'],
        dead: 'orman_orumcegi_dead.png'
    },
    "Hırsız Kobold": { 
        maxHp: 48, attack: 20, defense: 0, xp: 0, 
        tier: 1, // YENİ
        idle: 'hirsiz_kobold.png',
        attackFrames: ['hirsiz_kobold_attack1.png', 'hirsiz_kobold_attack2.png'],
        dead: 'hirsiz_kobold_dead.png'
    },
    "Kan Yarasası": { 
        maxHp: 40, attack: 20, defense: 0, xp: 0, 
        tier: 1, // YENİ
        idle: 'kan_yarasasi.png',
        attackFrames: ['kan_yarasasi_attack1.png', 'kan_yarasasi_attack2.png'], 
        dead: 'kan_yarasasi_dead.png'
    },

    // --- TIER 2 ---
    "Goblin Devriyesi": { 
        maxHp: 70, attack: 30, defense: 12, xp: 0, 
        tier: 2, // YENİ
        idle: 'goblin_devriyesi.png',
        attackFrames: ['goblin_devriyesi_attack1.png', 'goblin_devriyesi_attack2.png'],
        dead: 'goblin_devriyesi_dead.png'
    },
    "Kaçak Haydut": { 
        maxHp: 65, attack: 30, defense: 8, xp: 0, 
        tier: 2, // YENİ
        idle: 'kacak_haydut.png',
        attackFrames: ['kacak_haydut_attack1.png', 'kacak_haydut_attack2.png', 'kacak_haydut_attack3.png', 'kacak_haydut_attack4.png'],
        dead: 'kacak_haydut_dead.png'
    },
    "Gri Kurt": { 
        maxHp: 60, attack: 35, defense: 4, xp: 0, 
        tier: 2, // YENİ
        idle: 'kurt_surusu.png',
        attackFrames: ['kurt_surusu_attack1.png', 'kurt_surusu_attack2.png', 'kurt_surusu_attack3.png'],
        dead: 'kurt_surusu_dead.png'
    },

    // --- TIER 3 ---
    "Yaban Domuzu": { 
        maxHp: 150, attack: 45, defense: 15, xp: 0, 
        tier: 3, // YENİ
        idle: 'yaban_domuzu.png',
        attackFrames: ['yaban_domuzu_attack1.png', 'yaban_domuzu_attack2.png', 'yaban_domuzu_attack3.png'],
        dead: 'yaban_domuzu_dead.png'
    },
    "Goblin Savaşçısı": { 
        maxHp: 150, attack: 40, defense: 18, xp: 0, 
        tier: 3, // YENİ
        idle: 'goblin_savascisi.png',
        attackFrames: ['goblin_savascisi_attack1.png', 'goblin_savascisi_attack2.png'],
        dead: 'goblin_savascisi_dead.png'
    },
    "Kaya Golemi": { 
        maxHp: 200, attack: 20, defense: 23, xp: 0, 
        tier: 3, // YENİ
        idle: 'kaya_golemi.png',
        attackFrames: ['kaya_golemi_attack1.png', 'kaya_golemi_attack2.png', 'kaya_golemi_attack3.png', 'kaya_golemi_attack4.png'],
        dead: 'kaya_golemi_dead.png'
    },
    
    // --- TIER 4 ---
    "Orc Fedaisi": { 
        maxHp: 250, attack: 50, defense: 21, xp: 0, 
        tier: 4, // YENİ
        idle: 'orc_fedaisi.png',
        attackFrames: ['orc_fedaisi_attack1.png', 'orc_fedaisi_attack2.png'],
        dead: 'orc_fedaisi_dead.png'
    },

    // --- BOSS ---
    "Goblin Şefi": { 
        maxHp: 250, attack: 35, defense: 20, xp: 0, 
        tier: 5, // Boss T5 olsun
        idle: 'goblin_sef.png',
        attackFrames: ['goblin_sef_attack1.png', 'goblin_sef_attack2.png'],
        dead: 'goblin_sef_dead.png'
    }
};
Object.assign(ENEMY_STATS, {
    "İskelet Şövalye": { maxHp: 180, attack: 25, defense: 15, tier: 3, idle: 'kaya_golemi.png', dead: 'kaya_golemi_dead.png', attackFrames: ['kaya_golemi_attack1.png'] },
    "Gulyabani": { maxHp: 150, attack: 35, defense: 5, tier: 3, idle: 'kaya_golemi.png', dead: 'kaya_golemi_dead.png', attackFrames: ['kaya_golemi_attack1.png'] },
    "Kemik Golemi": { maxHp: 300, attack: 28, defense: 20, tier: 4, idle: 'kaya_golemi.png', dead: 'kaya_golemi_dead.png', attackFrames: ['kaya_golemi_attack1.png'] }
});