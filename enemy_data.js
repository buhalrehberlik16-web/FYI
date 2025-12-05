// enemy_data.js

// =========================================================
// DÜŞMAN İSTATİSTİKLERİ VE GÖRSEL ADLARI
// =========================================================

const ENEMY_STATS = {
    // --- ESKİ DÜŞMANLAR (Act 1 Standart) ---
    "Goblin Devriyesi": { 
        maxHp: 60, attack: 12, defense: 2, xp: 50, 
        idle: 'goblin_devriyesi.png',
        attackFrames: ['goblin_devriyesi_attack1.png', 'goblin_devriyesi_attack2.png'],
        dead: 'goblin_devriyesi_dead.png'
    },
    "Yaban Domuzu": { 
        maxHp: 120, attack: 18, defense: 5, xp: 120, 
        idle: 'yaban_domuzu.png',
        attackFrames: ['yaban_domuzu_attack1.png', 'yaban_domuzu_attack2.png', 'yaban_domuzu_attack3.png'],
        dead: 'yaban_domuzu_dead.png'
    },
    "Goblin Savaşçısı": { 
        maxHp: 85, attack: 16, defense: 4, xp: 80, 
        idle: 'goblin_savascisi.png',
        attackFrames: ['goblin_savascisi_attack1.png', 'goblin_savascisi_attack2.png'],
        dead: 'goblin_savascisi_dead.png'
    },
    "Orc Fedaisi": { 
        maxHp: 160, attack: 25, defense: 8, xp: 180, 
        idle: 'orc_fedaisi.png',
        attackFrames: ['orc_fedaisi_attack1.png', 'orc_fedaisi_attack2.png'],
        dead: 'orc_fedaisi_dead.png'
    },
    "Goblin Şefi": { 
        maxHp: 110, attack: 24, defense: 5, xp: 150, 
        idle: 'goblin_sef.png',
        attackFrames: ['goblin_sef_attack1.png', 'goblin_sef_attack2.png'],
        dead: 'goblin_sef_dead.png'
    },

    // --- YENİ EKLENEN DÜŞMANLAR (3 Kare Saldırı Animasyonlu) ---

    // 1. Zayıf Başlangıç Düşmanı
    "Zehirli Mantar": { 
        maxHp: 45, attack: 10, defense: 0, xp: 40, 
        idle: 'zehirli_mantar.png',
        attackFrames: [
            'zehirli_mantar_attack1.png', 
            'zehirli_mantar_attack2.png',
            'zehirli_mantar_attack3.png'
        ],
        dead: 'zehirli_mantar_dead.png'
    },

    // 2. Hızlı ve Kırılgan
    "Orman Örümceği": { 
        maxHp: 55, attack: 22, defense: 1, xp: 65, 
        idle: 'orman_orumcegi.png',
        attackFrames: [
            'orman_orumcegi_attack1.png', 
            'orman_orumcegi_attack2.png',
            'orman_orumcegi_attack3.png'
        ],
        dead: 'orman_orumcegi_dead.png'
    },

    // 3. İnsan Tipi Düşman
    "Kaçak Haydut": { 
        maxHp: 80, attack: 15, defense: 5, xp: 75, 
        idle: 'kacak_haydut.png',
        attackFrames: [
            'kacak_haydut_attack1.png', 
            'kacak_haydut_attack2.png',
            'kacak_haydut_attack3.png',
			'kacak_haydut_attack4.png'
        ],
        dead: 'kacak_haydut_dead.png'
    },

    // 4. Grup Düşmanı
    "Kurt Sürüsü": { 
        maxHp: 70, attack: 20, defense: 3, xp: 95, 
        idle: 'kurt_surusu.png',
        attackFrames: [
            'kurt_surusu_attack1.png', 
            'kurt_surusu_attack2.png',
            'kurt_surusu_attack3.png'
        ],
        dead: 'kurt_surusu_dead.png'
    },

    // 5. Dayanıklı Düşman (Tank) - Yosunlu Kaya Golemi
    "Kaya Golemi": { 
        maxHp: 150, attack: 12, defense: 12, xp: 140, 
        idle: 'kaya_golemi.png',
        attackFrames: [
            'kaya_golemi_attack1.png', 
            'kaya_golemi_attack2.png',
            'kaya_golemi_attack3.png',
			'kaya_golemi_attack4.png'
        ],
        dead: 'kaya_golemi_dead.png'
    }
};