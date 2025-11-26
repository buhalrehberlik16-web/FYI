// enemy_data.js

// =========================================================
// DÜŞMAN İSTATİSTİKLERİ VE GÖRSEL ADLARI
// Görsel yolları, hero_logic.js'te kolayca kullanılabilmesi için tam adlarıyla tutulmuştur.
// =========================================================

const ENEMY_STATS = {
    // Hafif Düşman
    "Goblin Devriyesi": { 
        maxHp: 60, attack: 12, defense: 2, xp: 50, 
        idle: 'goblin_devriyesi.png',
        attackFrames: ['goblin_devriyesi_attack1.png', 'goblin_devriyesi_attack2.png'],
        dead: 'goblin_devriyesi_dead.png'
    },
    // Tank/Ağır Düşman
    "Yaban Domuzu": { 
        maxHp: 120, attack: 18, defense: 5, xp: 120, 
        idle: 'yaban_domuzu.png',
        attackFrames: ['yaban_domuzu_attack1.png', 'yaban_domuzu_attack2.png', 'yaban_domuzu_attack3.png'],
        dead: 'yaban_domuzu_dead.png'
    },
    // Temel Düşman
    "Goblin Savaşçısı": { 
        maxHp: 80, attack: 15, defense: 3, xp: 75, 
        idle: 'goblin_savascisi.png',
        attackFrames: ['goblin_savascisi_attack1.png', 'goblin_savascisi_attack2.png'],
        dead: 'goblin_savascisi_dead.png'
    },
    // Boss Öncesi Güçlü Düşman
    "Orc Fedaisi": { 
        maxHp: 150, attack: 25, defense: 7, xp: 150, 
        idle: 'orc_fedaisi.png',
        attackFrames: ['orc_fedaisi_attack1.png', 'orc_fedaisi_attack2.png'],
        dead: 'orc_fedaisi_dead.png'
    },
    // Lider Düşman
    "Goblin Şefi": { 
        maxHp: 100, attack: 22, defense: 4, xp: 100, 
        idle: 'goblin_sef.png',
        attackFrames: ['goblin_sef_attack1.png', 'goblin_sef_attack2.png'],
        dead: 'goblin_sef_dead.png'
    }
    // Lütfen buraya kendi dosya adlarınızla diğer düşmanları eklemeyi unutmayın!
};