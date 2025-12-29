

const BARBARIAN_SKILLS = {

    // ======================================================
    // TAB: BRUTAL (VAHŞET)
    // ======================================================

	Pommel_Bash: { 
        data: {
            name: "Kabzayla Vur",
            menuDescription: "Str'nin %120'si kadar hasar. +18 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
			cooldown: 0,
            icon: 'fervor_pommel_bash.png',
            type: 'attack',
            category: 'brutal',
            tier: 1,
            scaling: { atkMult: 0, stats: { str: 1.2 }, elements: { physical: 1.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = SkillEngine.calculate(attacker, this.data);
            hero.rage = Math.min(hero.maxRage, hero.rage + 18);
            showFloatingText(document.getElementById('hero-display'), "+18 Rage", 'heal');
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },
	
    slash: {
        data: {
            name: "Kesik",
            menuDescription: "Saldırı gücü + %60 Str bonusu. 20 Öfke harcar.",
            rageCost: 20,
            levelReq: 1,
			cooldown: 0,
            icon: 'brutal_slash.png',
            type: 'attack',
            category: 'brutal', 
            tier: 1,
            scaling: { atkMult: 1.0, stats: { str: 0.6 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = SkillEngine.calculate(attacker, this.data);
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'slash', turns: 1, maxTurns: 1, resetOnCombatEnd: true });
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },
    
    reckless_strike: {
        data: {
            name: "Pervasız Vuruş",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 1.5 x STR</b>.<br><span style='color:#ff4d4d'>2 Tur: Defansın 0 olur.</span>",
            rageCost: 20,
            levelReq: 1,
			cooldown: 1,
            icon: 'brutal_reckless_strike.png',
            type: 'attack',
            category: 'brutal',
            tier: 1,
            scaling: { atkMult: 1.0, stats: { str: 1.5 } }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'defense_zero', name: 'Savunmasız', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'reckless_strike', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            const dmg = SkillEngine.calculate(attacker, this.data);
            animateCustomAttack(dmg, ['images/barbarian_attack2.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },


    bash: {
        data: {
            name: "Balyoz",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 0.8 x STR</b>.<br><span style='color:cyan'>%30 Şansla Sersemletir (1 Tur).</span>",
            rageCost: 30,
            levelReq: 3,
			cooldown: 2,
            icon: 'brutal_bash.png',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { atkMult: 1.0, stats: { str: 0.8 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = SkillEngine.calculate(attacker, this.data);
            if (Math.random() < 0.30) hero.statusEffects.push({ id: 'monster_stunned', name: 'Düşman Sersem', turns: 1, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'bash', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    pierce_through: {
        data: {
            name: "Delip Geç",
            menuDescription: "Hasar: <b style='color:orange'>1.5 x ATK + 0.8 x STR</b>.<br><span style='color:cyan'>Düşman Defansının %50'sini yok sayar.</span>",
            rageCost: 30,
            levelReq: 3,
			cooldown: 1,
            icon: 'brutal_pierce_through.png',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { atkMult: 1.5, stats: { str: 0.8 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = SkillEngine.calculate(attacker, this.data);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'pierce_through', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            let monsterDef = monster.defense;
            if(typeof isMonsterDefending !== 'undefined' && isMonsterDefending) monsterDef += monsterDefenseBonus;
            const ignoredDef = Math.floor(monsterDef * 0.50);
            animateCustomAttack(dmg + ignoredDef, ['images/barbarian_attack2.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    daze: {
        data: {
            name: "Afallat",
            menuDescription: "Hasar: <b style='color:orange'>2 x ATK</b>.<br><span style='color:#b19cd9'>2 Tur: Düşman ATK %25 azalır.</span>",
            rageCost: 25,
            levelReq: 3,
			cooldown: 2,
            icon: 'brutal_daze.png',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { atkMult: 2.0 }
        },
        onCast: function(attacker, defender) {
			const currentLang = window.gameSettings.lang || 'tr';
			const lang = window.LANGUAGES[currentLang];
            const dmg = SkillEngine.calculate(attacker, this.data);
            applyStatusEffect({ id: 'debuff_enemy_atk', name: lang.status.debuff_enemy_atk, value: 0.25, turns: 3, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'daze', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },

    armor_break: {
        data: {
            name: "Zırh Kıran",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.",
            rageCost: 30,
            levelReq: 3,
			cooldown: 2,
            icon: 'brutal_armor_break.png',
            type: 'attack',
            category: 'brutal', 
            tier: 3,
            scaling: { atkMult: 1.0, stats: { str: 0.5 } }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'armor_break', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'ignore_def', name: 'Zırh Kırıldı', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            const dmg = SkillEngine.calculate(attacker, this.data);
            animateCustomAttack(dmg, ['images/barbarian_attack2.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    fury: {
        data: {
            name: "Hiddet",
            menuDescription: "50 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: Hasarın %25'i kadar Rage kazan.</span>",
            rageCost: 50,
            levelReq: 6,
			cooldown: 5,
            icon: 'brutal_fury.png',
            type: 'buff',
            category: 'brutal',
            tier: 4
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'fury_active', name: 'Hiddetli', turns: 5, value: 0.25, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'fury', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "HİDDET!", 'heal');
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

    // ======================================================
    // TAB: CHAOS (KAOS)
    // ======================================================
		blood_price: {
        data: {
            name: "Kan Bedeli",
            menuDescription: "Maksimum Canın %15'ini feda et, o kadar Öfke kazan. <br><span style='color:cyan'>(Hızlı Aksiyon)</span>",
            rageCost: 10, 
            levelReq: 1, 
            cooldown: 5, 
            icon: 'chaos_blood_price.png',
            type: 'utility', 
            category: 'chaos', 
            tier: 1
        },
        onCast: function() {
            const hpLoss = Math.floor(hero.maxHp * 0.15);
            hero.hp = Math.max(1, hero.hp - hpLoss);
            hero.rage = Math.min(hero.maxRage, hero.rage + hpLoss);

            // Cooldown ekle (6 yazıyoruz ki 5 tam tur kilitli kalsın)
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'blood_price', turns: 6, maxTurns: 6, resetOnCombatEnd: true });

            showFloatingText(document.getElementById('hero-display'), hpLoss, 'damage');
            showFloatingText(document.getElementById('hero-display'), `+${hpLoss} Rage`, 'heal');
            writeLog(`🩸 **Kan Bedeli**: ${hpLoss} Can feda ederek ${hpLoss} Öfke kazandın.`);

            updateStats();
            // Hızlı aksiyon olduğu için nextTurn() çağrılmıyor, turu sana geri veriyoruz
            setTimeout(() => { 
                window.isHeroTurn = true; 
                toggleSkillButtons(false); 
            }, 300);
        }
    },
	
	// --- CHAOS TIER 2 ---
    fiery_blade: {
        data: {
            name: "Alevli Kılıç",
            menuDescription: "3 Tur boyunca tüm saldırıların %50 daha fazla vurur (Ateş Hasarı).",
            rageCost: 30, 
            levelReq: 1, 
            cooldown: 4, 
            icon: 'chaos_fiery_blade.png',
            type: 'buff', 
            category: 'chaos', 
            tier: 2			
        },
        onCast: function() {
            // Mevcut hasar motorumuzdaki atk_up_percent çarpanını kullanıyoruz
            hero.statusEffects.push({ 
                id: 'atk_up_percent', 
                name: 'Alevli Kılıç', 
                value: 0.50, 
                turns: 4, // Bu tur + 3 tam tur
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            // Skill Cooldown
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'fiery_blade', turns: 5, maxTurns: 5, resetOnCombatEnd: true });

            updateStats();
            showFloatingText(document.getElementById('hero-display'), "ALEVLENDİ!", 'heal');
            writeLog(`🔥 **Alevli Kılıç**: Silahın alev aldı! 3 tur boyunca %50 ekstra hasar vereceksin.`);
            
            setTimeout(nextTurn, 1000);
        }
    },
	
    hell_blade: {
        data: {
            name: "Cehennem Kılıcı",
            menuDescription: "Kanlı saldırı. 25 Öfke.<br>Hasar: <b style='color:orange'>ATK + 0.8 x INT</b>.<br><span style='color:#ff4d4d'>Bedel: %10 Can</span>.",
            rageCost: 25,
            levelReq: 2,
			cooldown: 0,
            icon: 'chaos_hell_blade.png',
            type: 'attack',
            category: 'chaos', 
            tier: 2,
            scaling: { atkMult: 1.0, stats: { int: 0.8 }, elements: { fire: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const hpCost = Math.floor(hero.hp * 0.10);
            hero.hp = Math.max(1, hero.hp - hpCost);
            showFloatingText(document.getElementById('hero-display'), `-${hpCost}`, 'damage');
            const dmg = SkillEngine.calculate(attacker, this.data);
            animateCustomAttack(dmg, ['images/barbarian_hellblade_strike1.png', 'images/barbarian_hellblade_strike2.png', 'images/barbarian_hellblade_strike3.png'], this.data.name);
        }
    },

	// --- CHAOS TIER 3 ---
    double_blade: {
        data: {
            name: "İki Uçlu Değnek",
            menuDescription: "Kendini umursamadan düşmana saldır.",
            rageCost: 20, 
            levelReq: 3, 
            cooldown: 4, 
            icon: 'chaos_double_blade.png',
            type: 'buff', 
            category: 'chaos', 
            tier: 3			
        },
        onCast: function() {
            // Mevcut hasar motorumuzdaki atk_up_percent çarpanını kullanıyoruz
            hero.statusEffects.push({ 
                id: 'atk_up_percent', 
                name: 'Alevli Kılıç', 
                value: 0.50, 
                turns: 4, // Bu tur + 3 tam tur
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            // Skill Cooldown
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'double_blade', turns: 5, maxTurns: 5, resetOnCombatEnd: true });

            updateStats();
            showFloatingText(document.getElementById('hero-display'), "ALEVLENDİ!", 'heal');
            writeLog(`🔥 **Alevli Kılıç**: Silahın alev aldı! 3 tur boyunca %50 ekstra hasar vereceksin.`);
            
            setTimeout(nextTurn, 1000);
        }
    },
	
    Cauterize: {
		//Lose 10% HP, gain 5%HP+?xInt per turn
        data: {
            name: "Yenilenme",
            menuDescription: "Güçlü iyileşme. 50 Öfke harcar.<br><span style='color:#43FF64'>30 HP + (10 HP x 3 Tur)</span>.",
            rageCost: 50,
            levelReq: 3,
			cooldown: 4,
            icon: 'chaos_cauterize.png',
            type: 'defense',
            category: 'chaos', 
            tier: 3
        },
        onCast: function(attacker, defender) {
            const initialHeal = 30;
            const oldHp = hero.hp; hero.hp = Math.min(hero.maxHp, hero.hp + initialHeal);
            if ((hero.hp - oldHp) > 0) showFloatingText(document.getElementById('hero-display'), (hero.hp - oldHp), 'heal');
            hero.statusEffects.push({ id: 'regen', name: 'Yenilenme', turns: 3, min: 10, max: 10, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', turns: 5, maxTurns: 5, blockedSkill: 'Cauterize', resetOnCombatEnd: true });
            animateHealingParticles(); updateStats();
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

	// Ulti 1 (Lose all HP, deal as much Dmg) 
	// Path_of_Pain (Cost: All Rage - Deal ?xInt based damage, gain HP equal to Rage Spent)

    // ======================================================
    // TAB: FERVOR (COŞKU)
    // ======================================================
    
    wind_up: {
    	data: {
        name: "Kurulma",
        menuDescription: "Sonraki saldırın <b style='color:orange'>+1 x STR</b> fazla vurur. +15 Rage kazandırır.",
        rageCost: 0,
        levelReq: 1,
		cooldown: 2,
        icon: 'brutal_wind_up.png',
        type: 'buff',
        category: 'fervor',
        tier: 1,
        // Bu bir buff olduğu için hasar motoruna direkt girmez ama 
        // bonusu belirlemek için scaling verisini burada tutabiliriz.
        scaling: { stats: { str: 1.0 } } 
    },
    onCast: function(attacker, defender) {
        // Motoru kullanarak bonusu hesapla (Atak mult 0, sadece stat)
        const bonusDmg = SkillEngine.calculate(attacker, this.data);
        
        hero.statusEffects.push({ 
            id: 'wind_up', 
            name: 'Güç Toplandı', 
            value: bonusDmg, 
            turns: 5, 
            waitForCombat: false, 
            resetOnCombatEnd: true 
        });

        hero.rage = Math.min(hero.maxRage, hero.rage + 15);
        hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'wind_up', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
        
        updateStats();
        showFloatingText(document.getElementById('hero-display'), "GÜÇ TOPLANIYOR!", 'heal');
        writeLog(`💨 **${this.data.name}**: Bir sonraki vuruşa +${bonusDmg} güç eklendi.`);
        setTimeout(() => { nextTurn(); }, 1000);
    }
},
	
    battle_cry: {
        data: {
            name: "Savaş Çığlığı",
            menuDescription: "Motive ol. 20 Öfke harcar.<br><span style='color:#43FF64'>3 Tur: %40 STR Artışı</span>.",
            rageCost: 20,
            levelReq: 2,
			cooldown: 3,
            icon: 'icon_battle_cry.png',
            type: 'buff',
            category: 'fervor', 
            tier: 2
        },
        onCast: function(attacker, defender) {
            const bonusStr = Math.floor(hero.str * 0.40);
            hero.statusEffects.push({ id: 'str_up', name: 'Savaş Çığlığı', turns: 3, value: bonusStr, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'battle_cry', turns: 4, maxTurns: 4, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('hero-display'), `+${bonusStr} STR`, 'heal');
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },
	//Light_Up 1.5Atk+1.5MP Dmg (light or fire), Reduce enemy def for 2 turns,
    Healing_Light: {
    data: {
        name: "İyileştiren Işık",
        rageCost: 50,
        levelReq: 3,
        cooldown: 5,
        icon: 'fervor_healing_light.png',
        type: 'defense',
        category: 'fervor', 
        tier: 3
    },
    onCast: function(attacker, defender) {
        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
        
        // --- 1. KAHRAMAN ANLIK İYİLEŞME (%20 MAX HP) ---
        const heroBurstHeal = Math.floor(hero.maxHp * 0.20);
        const oldHeroHp = hero.hp;
        hero.hp = Math.min(hero.maxHp, hero.hp + heroBurstHeal);
        showFloatingText(document.getElementById('hero-display'), (hero.hp - oldHeroHp), 'heal');

        // --- 2. DÜŞMAN ANLIK İYİLEŞME (%15 MAX HP) ---
        const monsterBurstHeal = Math.floor(monster.maxHp * 0.15);
        const oldMonsterHp = monster.hp;
        monster.hp = Math.min(monster.maxHp, monster.hp + monsterBurstHeal);
        showFloatingText(document.getElementById('monster-display'), (monster.hp - oldMonsterHp), 'heal');

        // --- 3. KAHRAMAN İÇİN ÖZEL YENİLENME EFEKTİ (%10 CURRENT HP) ---
        hero.statusEffects.push({ 
            id: 'percent_regen', // Standart 'regen'den ayırmak için farklı ID verdik
            name: lang.skills.Healing_Light.name, 
            turns: 3, 
            value: 0.10, // %10
            resetOnCombatEnd: true 
        });

        // --- 4. COOLDOWN VE GÖRSELLER ---
        hero.statusEffects.push({ 
            id: 'block_skill', 
            turns: 6, 
            maxTurns: 6, 
            blockedSkill: 'Healing_Light', 
            resetOnCombatEnd: true 
        });

        animateHealingParticles(); 
        updateStats();
        writeLog(lang.combat.log_healing_light);
        setTimeout(() => { nextTurn(); }, 1000);
    }
},
};


