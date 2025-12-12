// enemy_data.js - BALANCED VERSION

const ENEMY_STATS = {
    // --- TIER 1 (Çerezler - Düşük HP, Hızlı Ölüm) ---
    "Zehirli Mantar": { 
        maxHp: 40, attack: 10, defense: 0, xp: 40, 
        idle: 'zehirli_mantar.png',
        attackFrames: ['zehirli_mantar_attack1.png', 'zehirli_mantar_attack2.png', 'zehirli_mantar_attack3.png'],
        dead: 'zehirli_mantar_dead.png'
    },
    "Orman Örümceği": { 
        maxHp: 65, attack: 22, defense: 2, xp: 65, 
        idle: 'orman_orumcegi.png',
        attackFrames: ['orman_orumcegi_attack1.png', 'orman_orumcegi_attack2.png', 'orman_orumcegi_attack3.png'],
        dead: 'orman_orumcegi_dead.png'
    },
	 "Hırsız Kobold": { 
        maxHp: 55, attack: 12, defense: 1, xp: 45, 
        idle: 'hirsiz_kobold.png',
        attackFrames: ['hirsiz_kobold_attack1.png', 'hirsiz_kobold_attack2.png'], // 2 Kare yeterli
        dead: 'hirsiz_kobold_dead.png'
    },
    
    "Kan Yarasası": { 
        maxHp: 45, attack: 14, defense: 0, xp: 40, 
        idle: 'kan_yarasasi.png',
        attackFrames: ['kan_yarasasi_attack1.png', 'kan_yarasasi_attack2.png'], 
        dead: 'kan_yarasasi_dead.png'
    },

    // --- TIER 2 (Askerler - Orta HP, Standart Savaş) ---
    "Goblin Devriyesi": { 
        maxHp: 90, attack: 15, defense: 5, xp: 80, 
        idle: 'goblin_devriyesi.png',
        attackFrames: ['goblin_devriyesi_attack1.png', 'goblin_devriyesi_attack2.png'],
        dead: 'goblin_devriyesi_dead.png'
    },
    "Kaçak Haydut": { 
        maxHp: 110, attack: 18, defense: 6, xp: 90, 
        idle: 'kacak_haydut.png',
        attackFrames: ['kacak_haydut_attack1.png', 'kacak_haydut_attack2.png', 'kacak_haydut_attack3.png', 'kacak_haydut_attack4.png'],
        dead: 'kacak_haydut_dead.png'
    },
    "Gri Kurt": { 
        maxHp: 100, attack: 25, defense: 3, xp: 100, 
        idle: 'kurt_surusu.png',
        attackFrames: ['kurt_surusu_attack1.png', 'kurt_surusu_attack2.png', 'kurt_surusu_attack3.png'],
        dead: 'kurt_surusu_dead.png'
    },

    // --- TIER 3 (Tanklar & Elitler - Yüksek HP/Defans) ---
    "Yaban Domuzu": { 
        maxHp: 160, attack: 20, defense: 8, xp: 130, 
        idle: 'yaban_domuzu.png',
        attackFrames: ['yaban_domuzu_attack1.png', 'yaban_domuzu_attack2.png', 'yaban_domuzu_attack3.png'],
        dead: 'yaban_domuzu_dead.png'
    },
    "Goblin Savaşçısı": { 
        maxHp: 150, attack: 22, defense: 12, xp: 140, 
        idle: 'goblin_savascisi.png',
        attackFrames: ['goblin_savascisi_attack1.png', 'goblin_savascisi_attack2.png'],
        dead: 'goblin_savascisi_dead.png'
    },
    "Kaya Golemi": { 
        maxHp: 180, attack: 14, defense: 8, xp: 180, // Armor Break olmadan zor
        idle: 'kaya_golemi.png',
        attackFrames: ['kaya_golemi_attack1.png', 'kaya_golemi_attack2.png', 'kaya_golemi_attack3.png', 'kaya_golemi_attack4.png'],
        dead: 'kaya_golemi_dead.png'
    },
	//Tier 4 (Elit)
    "Orc Fedaisi": { 
        maxHp: 240, attack: 30, defense: 10, xp: 200, 
        idle: 'orc_fedaisi.png',
        attackFrames: ['orc_fedaisi_attack1.png', 'orc_fedaisi_attack2.png'],
        dead: 'orc_fedaisi_dead.png'
    },

    // --- BOSS ---
    "Goblin Şefi": { 
        maxHp: 450, attack: 28, defense: 10, xp: 500, 
        idle: 'goblin_sef.png',
        attackFrames: ['goblin_sef_attack1.png', 'goblin_sef_attack2.png'],
        dead: 'goblin_sef_dead.png'
    }
};