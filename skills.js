// skills.js - GÜNCELLENMİŞ TAB YERLEŞİMİ

// --- 1. TEMEL YETENEKLER (Basic Skills - Class Specific) ---
const BASIC_SKILL_DATABASE = {
    "Barbar": {
        // 1. CUT (Kes): Dengeli, Rage üretir
        "cut": {
            name: "Kes",
            icon: "icon_attack.png",
            desc: "Temel Hasar + 0.5x STR. +10 Rage üretir.",
            type: "attack",
            execute: (attacker, defender) => {
                const stats = getHeroEffectiveStats();
                // Hasar: Base(8) + 0.5 * STR
                const dmg = 8 + Math.floor(stats.str * 0.5);
                
                hero.rage = Math.min(hero.maxRage, hero.rage + 10);
                
                return { action: 'attack', damage: dmg, rage: 10 };
            }
        },
        // 2. GUARD (Savun): Hasarı azaltır, Rage HARCAR
        "guard": {
            name: "Siper",
            icon: "icon_defend.png",
            desc: "Gelen hasarı %25 azaltır. -15 Rage.",
            type: "defense",
            rageCost: 15, 
            execute: (attacker, defender) => {
                return { action: 'guard', rage: 0 };
            }
        },
        // 3. STRIKE (Eski Maul): Güçlü vuruş, az Rage
        "maul": { 
            name: "Vuruş", 
            icon: "icon_strike.png",
            desc: "Temel hasar + 0.7x STR. Rastgele +0-5 aralığında Rage üretir.",
            type: "attack",
            execute: (attacker, defender) => {
                const stats = getHeroEffectiveStats();
                // Hasar: Base(8) + 0.7 * STR
                const dmg = 8 + Math.floor(stats.str * 1.2);
                
                const genRage = Math.floor(Math.random() * 6); 
                hero.rage = Math.min(hero.maxRage, hero.rage + genRage);
                
                return { action: 'attack', damage: dmg, rage: genRage };
            }
        },
        // 4. BLOCK (Eski Focus): INT tabanlı blok
        "focus": { 
            name: "Blok",
            icon: "icon_block.png",
            desc: "INT kadar hasar emer. Blok tur sonunda %50 azalır. -10 Rage.",
            type: "utility",
            rageCost: 10,
            execute: (attacker, defender) => {
                const stats = getHeroEffectiveStats();
                // Blok Değeri: Base 5 + (1.5 x INT)
                const blockVal = 5 + Math.floor(hero.int * 1.5);
                return { action: 'block', value: blockVal, rage: 0 };
            }
        }
    }
};

// --- 2. ÖZEL YETENEKLER (Special Skills) ---
const SKILL_DATABASE = {
    
    // ======================================================
    // TAB: COMMON (GENEL)
    // ======================================================
    
    // MINOR HEALING: Küçük İyileşme (Burada kaldı)
    minor_healing: {
        data: {
            name: "Küçük İyileşme",
            description: "Az miktarda can yeniler.",
            menuDescription: "Hızlı pansuman. 20 Öfke harcar.<br><span style='color:#43FF64'>Sabit 15 HP</span> + (0.5 x INT).",
            rageCost: 20,
            levelReq: 1,
            icon: 'icon_minor_healing.png',
            type: 'defense',
            category: 'common', 
            tier: 2
        },
        onCast: function(attacker, defender) {
            const healAmount = 15 + Math.floor((hero.int || 0) * 0.5);
            const oldHp = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
            const actualHeal = hero.hp - oldHp;
            
            updateStats(); 
            if (actualHeal > 0) {
                showFloatingText(document.getElementById('hero-display'), actualHeal, 'heal');
                animateHealingParticles();
                writeLog(`💚 **${this.data.name}**: ${actualHeal} HP iyileşti.`);
                setTimeout(() => { nextTurn(); }, 1500); 
            } else {
                writeLog(`❌ Canın zaten dolu.`);
                nextTurn();
            }
        }
    },

    // ======================================================
    // TAB: BRUTAL (VAHŞET) - Fiziksel Güç
    // ======================================================
    
    // SLASH: Temel Saldırı
    slash: {
        data: {
            name: "Kesik",
            description: "Hızlı bir kılıç darbesi.",
            menuDescription: "25 Öfke harcar.<br>Hasar: <b style='color:orange'>1.2 x STR</b> + 10.",
            rageCost: 25,
            levelReq: 1,
            icon: 'icon_slash.png',
            type: 'attack',
            category: 'brutal', 
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const strBonus = Math.floor(stats.str * 1.2);
            const damage = Math.floor(Math.random() * 4) + 10 + strBonus;
            
            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
        }
    },

    // ARMOR BREAK: Zırh Kıran (Buraya Taşındı)
    armor_break: {
        data: {
            name: "Zırh Kıran",
            description: "Savunmayı yok sayar.",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br>Hasar: <b style='color:orange'>0.8 x STR</b>.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.<br><span style='color:yellow'>Bekleme: 3 Tur</span>",
            rageCost: 30,
            levelReq: 2,
            icon: 'icon_armor_break.png',
            type: 'attack',
            category: 'brutal', // DEĞİŞİKLİK
            tier: 2
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ 
                id: 'block_skill', 
                name: 'Soğuma', 
                blockedSkill: 'armor_break', 
                turns: 3, 
                maxTurns: 3, 
                resetOnCombatEnd: true 
            });

            hero.statusEffects.push({
                id: 'ignore_def',
                name: 'Zırh Kırıldı',
                turns: 2,
                waitForCombat: false,
                resetOnCombatEnd: true
            });

            const stats = getHeroEffectiveStats();
            const strBonus = Math.floor(stats.str * 0.8);
            const damage = 5 + strBonus;

            const animFrames = ['barbarian_attack3.png']; 
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
            writeLog(`🔨 **${this.data.name}**: Zırh parçalandı!`);
        }
    },

    // ======================================================
    // TAB: CHAOS (KAOS) - Elementel/Karanlık
    // ======================================================

    // HELL BLADE: Cehennem Kılıcı
    hell_blade: {
        data: {
            name: "Cehennem Kılıcı",
            description: "Canını feda edip vur.",
            menuDescription: "Kanlı saldırı. 25 Öfke harcar.<br>Hasar: <b style='color:orange'>1.8 x STR</b> + 15.<br><span style='color:#ff4d4d'>Bedel: %10 Mevcut Can</span>.",
            rageCost: 25,
            levelReq: 1,
            icon: 'icon_hell_blade.png',
            type: 'attack',
            category: 'chaos',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const hpCost = Math.floor(hero.hp * 0.10);
            hero.hp = Math.max(1, hero.hp - hpCost);
            showFloatingText(document.getElementById('hero-display'), `-${hpCost}`, 'damage');

            const stats = getHeroEffectiveStats();
            const strBonus = Math.floor(stats.str * 1.8);
            const damage = 15 + strBonus;

            const animFrames = ['barbarian_hellblade_strike1.png', 'barbarian_hellblade_strike2.png', 'barbarian_hellblade_strike3.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            let finalDmg = damage;
            if (Math.random() < 0.20) {
                finalDmg = Math.floor(damage * 1.5);
                writeLog(`🔥 **KRİTİK!** Cehennem ateşi parladı!`);
            }

            animateCustomAttack(finalDmg, fullPathFrames, this.data.name);
        }
    },

    // ======================================================
    // TAB: FERVOR (COŞKU) - Mistik/Duygu
    // ======================================================

    // BATTLE CRY: Savaş Çığlığı (Buraya Taşındı)
    battle_cry: {
        data: {
            name: "Savaş Çığlığı",
            description: "Gücünü topla!",
            menuDescription: "Motive ol. 20 Öfke harcar.<br><span style='color:#43FF64'>3 Tur: %40 STR Artışı</span>.<br><span style='color:yellow'>Bekleme: 4 Tur</span>",
            rageCost: 20,
            levelReq: 2,
            icon: 'icon_battle_cry.png',
            type: 'buff',
            category: 'fervor', // DEĞİŞİKLİK
            tier: 2
        },
        onCast: function(attacker, defender) {
            const bonusStr = Math.floor(hero.str * 0.40);

            hero.statusEffects.push({ 
                id: 'str_up', 
                name: 'Savaş Çığlığı', 
                turns: 3, 
                value: bonusStr, 
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            hero.statusEffects.push({ 
                id: 'block_skill', 
                name: 'Soğuma', 
                blockedSkill: 'battle_cry', 
                turns: 4, 
                maxTurns: 4, 
                resetOnCombatEnd: true 
            });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), `+${bonusStr} STR`, 'heal');
            writeLog(`📢 **${this.data.name}**: STR ${bonusStr} arttı!`);
            
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

    // RESTORE HEALING: Yenilenme
    restore_healing: {
        data: {
            name: "Yenilenme",
            description: "Zamanla can yeniler.",
            menuDescription: "Güçlü iyileşme. 50 Öfke harcar.<br><span style='color:#43FF64'>30 HP + (10 HP x 3 Tur)</span>.<br><span style='color:yellow'>Bekleme: 5 Tur</span>.",
            rageCost: 50,
            levelReq: 3,
            icon: 'restore_healing.png',
            type: 'defense',
            category: 'fervor', 
            tier: 3
        },
        onCast: function(attacker, defender) {
            const initialHeal = 30;
            const oldHp = hero.hp; hero.hp = Math.min(hero.maxHp, hero.hp + initialHeal);
            const actualHeal = hero.hp - oldHp;
            
            if (actualHeal > 0) showFloatingText(document.getElementById('hero-display'), actualHeal, 'heal');

            hero.statusEffects.push({ id: 'regen', name: 'Yenilenme', turns: 3, min: 10, max: 10, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', turns: 5, maxTurns: 5, blockedSkill: 'restore_healing', resetOnCombatEnd: true });

            animateHealingParticles(); updateStats();
            writeLog(`✨ **${this.data.name}**: Yenilenme başladı.`);
            setTimeout(() => { nextTurn(); }, 1000);
        }
    }
};