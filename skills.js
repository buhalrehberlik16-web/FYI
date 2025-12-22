// skills.js - STANDARTLAŞTIRILMIŞ HASAR SİSTEMİ (SCALING)

const SKILL_DATABASE = {
    
    // ======================================================
    // TAB: COMMON (GENEL)
    // ======================================================
    
    // --- TIER 1 ---
    cut: {
        data: {
            name: "Kes",
            menuDescription: "Atağın kadar hasar. +10 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
            icon: 'icon_attack.png',
            type: 'attack',
            category: 'common',
            tier: 1,
            scaling: { atkMult: 1.0, stats: { str: 0.0 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = calculateSkillRawDamage(attacker, this.data);
            hero.rage = Math.min(hero.maxRage, hero.rage + 10);
            showFloatingText(document.getElementById('hero-display'), "+10 Rage", 'heal');
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },

    guard: {
        data: {
            name: "Siper",
            menuDescription: "Gelen hasarı %25 azaltır. -15 Rage.",
            rageCost: 15,
            levelReq: 1,
            icon: 'icon_defend.png',
            type: 'defense',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'guard_active', name: 'Koruma', value: 0.25, turns: 1, waitForCombat: false, resetOnCombatEnd: true });
            isHeroDefending = true;
            updateStats();
            writeLog(`🛡️ **${this.data.name}**: Savunma pozisyonu (%25 Hasar Azaltma).`);
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

    strike: { 
        data: {
            name: "Vuruş",
            menuDescription: "Atağın %115'i kadar hasar. +0-9 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
            icon: 'icon_strike.png',
            type: 'attack',
            category: 'common',
            tier: 1,
            scaling: { atkMult: 1.18, stats: { str: 0.0 }, elements: { physical: 1.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = calculateSkillRawDamage(attacker, this.data);
            const genRage = Math.floor(Math.random() * 13);
            hero.rage = Math.min(hero.maxRage, hero.rage + genRage);
            if(genRage > 0) showFloatingText(document.getElementById('hero-display'), `+${genRage} Rage`, 'heal');
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },

    block: { 
        data: {
            name: "Blok",
            menuDescription: "Dex değerinin %80'i kadar blok kazanır. Blok tur sonunda %50 azalır. -10 Rage.",
            rageCost: 10,
            levelReq: 1,
            icon: 'icon_block.png',
            type: 'utility',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const blockVal = stats.blockPower;
            if(typeof addHeroBlock === 'function') addHeroBlock(blockVal);
            writeLog(`🧱 **${this.data.name}**: ${blockVal} Blok kazandın.`);
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

    // --- TIER 2 ---
    minor_healing: {
        data: {
            name: "Küçük İyileşme",
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
            updateStats(); 
            showFloatingText(document.getElementById('hero-display'), (hero.hp - oldHp), 'heal');
            animateHealingParticles();
            writeLog(`💚 **${this.data.name}**: HP iyileşti.`);
            setTimeout(() => { nextTurn(); }, 1500);
        }
    },

    distract: {
        data: {
            name: "Dikkat Dağıt",
            menuDescription: "<b>(Hızlı Aksiyon)</b><br>Düşman ATK %25 azalır (1 Tur).<br>Düşman DEF %50 azalır (2 Tur).<br><span style='color:cyan'>-50 Rage. Tur harcamaz.</span>",
            rageCost: 50,
            levelReq: 1,
            icon: 'icon_distract.png',
            type: 'debuff',
            category: 'common',
            tier: 2
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'distract', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'debuff_enemy_atk', name: 'Düşman Güçsüz', value: 0.25, turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'debuff_enemy_def', name: 'Düşman Savunmasız', value: 0.50, turns: 3, waitForCombat: false, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('monster-display'), "ZAYIFLADI!", 'damage');
            setTimeout(() => { toggleSkillButtons(false); }, 300); 
        }
    },
	
	tactical_strike: {
        data: {
            name: "Taktiksel Vuruş",
            menuDescription: "Saldırı gücünün %130'u kadar hasar. 15 Öfke harcar.<br><span style='color:cyan'>10 Defansı Yok Sayar.</span>",
            rageCost: 15,
            levelReq: 1, 
            icon: 'icon_tactical_strike.png',
            type: 'attack',
            category: 'common', 
            tier: 2,
            scaling: { atkMult: 1.3, stats: { dex: 0.0 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const damage = calculateSkillRawDamage(attacker, this.data);
            let currentMonsterDef = monster.defense + (isMonsterDefending ? monsterDefenseBonus : 0);
            const ignoredAmount = Math.min(currentMonsterDef, 10);
            
            animateCustomAttack(damage + ignoredAmount, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },

    // --- TIER 3 (PASİFLER) ---
    hoarder: {
        data: {
            name: "İstifçi",
            description: "Daha fazla takı takabilirsin.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+2 Broş Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 2,
            icon: 'icon_hoarder.png',
            type: 'passive',
            category: 'common',
            tier: 3,
            onAcquire: function() {
                hero.brooches.push(null, null);
                writeLog("📿 Broş kapasitesi arttı! (+2 Slot)");
            }
        }
    },

    loot_junkie: {
        data: {
            name: "Ganimetçi",
            description: "Çantanda daha çok yer açar.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+1 Çanta Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 2,
            icon: 'icon_loot_junkie.png',
            type: 'passive',
            category: 'common',
            tier: 3,
            onAcquire: function() {
                hero.inventory.push(null);
                writeLog("🎒 Çanta kapasitesi arttı! (+1 Slot)");
            }
        }
    },

    fired_up: {
        data: {
            name: "Ateşli",
            description: "Savaşta daha fazla yetenek kullan.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+1 Yetenek Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 3,
            icon: 'icon_fired_up.png',
            type: 'passive',
            category: 'common',
            tier: 3,
            onAcquire: function() {
                hero.equippedSkills.push(null);
                writeLog("⚔️ Savaş kapasitesi arttı! (+1 Skill Slotu)");
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
                if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
            }
        }
    },

    // --- TIER 4 ---
    sharpen: {
        data: {
            name: "Bileme",
            menuDescription: "30 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: +%25 Saldırı Gücü</span>.",
            rageCost: 30,
            levelReq: 6, 
            icon: 'icon_sharpen.png',
            type: 'buff',
            category: 'common',
            tier: 4
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'atk_up_percent', name: 'Keskinlik', turns: 4, value: 0.25, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'sharpen', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "KESKİNLEŞTİ!", 'heal');
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

    curse: {
        data: {
            name: "Lanet",
            menuDescription: "20 Öfke harcar.<br><span style='color:#b19cd9'>5 Tur: Düşman %20 Fazla Hasar Alır.</span>",
            rageCost: 20,
            levelReq: 6,
            icon: 'icon_curseskill.png',
            type: 'debuff',
            category: 'common',
            tier: 4
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'curse_damage', name: 'Lanetli', turns: 5, value: 0.20, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'curse', turns: 10, maxTurns: 10, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('monster-display'), "LANETLENDİ!", 'damage'); 
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

	// --- TIER 5 ---
	willful_strike: {
        data: {
            name: "İradeli Vuruş",
            menuDescription: "Mevcut <b>TÜM ÖFKEYİ</b> harcar.<br>Hasar: ATK x (1 + Harcanan Öfke%).",
            rageCost: 0, 
            levelReq: 8, 
            icon: 'icon_willful_strike.png',
            type: 'attack',
            category: 'common',
            tier: 5,
            scaling: { atkMult: 1.0, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const spentRage = hero.rage;
            const multiplier = 1 + (spentRage / 100);
            hero.rage = 0; 
            updateStats();
            const damage = calculateSkillRawDamage(attacker, this.data);
            const totalDamage = Math.floor(damage * multiplier);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'willful_strike', turns: 5, maxTurns: 5, resetOnCombatEnd: true });
            animateCustomAttack(totalDamage, ['images/barbarian_attack2.png','images/barbarian_attack3.png'], this.data.name);
        }
    },	

    // ======================================================
    // TAB: BRUTAL (VAHŞET)
    // ======================================================

    slash: {
        data: {
            name: "Kesik",
            menuDescription: "Saldırı gücü + %60 Str bonusu. 20 Öfke harcar.",
            rageCost: 20,
            levelReq: 1,
            icon: 'brutal_slash.png',
            type: 'attack',
            category: 'brutal', 
            tier: 1,
            scaling: { atkMult: 1.0, stats: { str: 0.6 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const damage = calculateSkillRawDamage(attacker, this.data);
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'slash', turns: 1, maxTurns: 1, resetOnCombatEnd: true });
            animateCustomAttack(damage, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },
    
    reckless_strike: {
        data: {
            name: "Pervasız Vuruş",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 1.5 x STR</b>.<br><span style='color:#ff4d4d'>2 Tur: Defansın 0 olur.</span>",
            rageCost: 20,
            levelReq: 1,
            icon: 'brutal_reckless_strike.png',
            type: 'attack',
            category: 'brutal',
            tier: 1,
            scaling: { atkMult: 1.0, stats: { str: 1.5 } }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'defense_zero', name: 'Savunmasız', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'reckless_strike', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            const damage = calculateSkillRawDamage(attacker, this.data);
            animateCustomAttack(damage, ['images/barbarian_attack2.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    wind_up: {
    data: {
        name: "Kurulma",
        menuDescription: "Sonraki saldırın <b style='color:orange'>+1 x STR</b> fazla vurur. +15 Rage kazandırır.",
        rageCost: 0,
        levelReq: 1,
        icon: 'brutal_wind_up.png',
        type: 'buff',
        category: 'brutal',
        tier: 1,
        // Bu bir buff olduğu için hasar motoruna direkt girmez ama 
        // bonusu belirlemek için scaling verisini burada tutabiliriz.
        scaling: { stats: { str: 1.0 } } 
    },
    onCast: function(attacker, defender) {
        // Motoru kullanarak bonusu hesapla (Atak mult 0, sadece stat)
        const bonusDmg = calculateSkillRawDamage(attacker, this.data);
        
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

    bash: {
        data: {
            name: "Balyoz",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 0.8 x STR</b>.<br><span style='color:cyan'>%30 Şansla Sersemletir (1 Tur).</span>",
            rageCost: 30,
            levelReq: 3,
            icon: 'brutal_bash.png',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { atkMult: 1.0, stats: { str: 0.8 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const damage = calculateSkillRawDamage(attacker, this.data);
            if (Math.random() < 0.30) hero.statusEffects.push({ id: 'monster_stunned', name: 'Düşman Sersem', turns: 1, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'bash', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(damage, ['images/barbarian_attack1.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    pierce_through: {
        data: {
            name: "Delip Geç",
            menuDescription: "Hasar: <b style='color:orange'>1.5 x ATK + 0.8 x STR</b>.<br><span style='color:cyan'>Düşman Defansının %50'sini yok sayar.</span>",
            rageCost: 30,
            levelReq: 3,
            icon: 'brutal_pierce_through.png',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { atkMult: 1.5, stats: { str: 0.8 }, elements: { physical: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const damage = calculateSkillRawDamage(attacker, this.data);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'pierce_through', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            let monsterDef = monster.defense;
            if(typeof isMonsterDefending !== 'undefined' && isMonsterDefending) monsterDef += monsterDefenseBonus;
            const ignoredDef = Math.floor(monsterDef * 0.50);
            animateCustomAttack(damage + ignoredDef, ['images/barbarian_attack2.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    daze: {
        data: {
            name: "Afallat",
            menuDescription: "Hasar: <b style='color:orange'>2 x ATK</b>.<br><span style='color:#b19cd9'>2 Tur: Düşman ATK %25 azalır.</span>",
            rageCost: 25,
            levelReq: 3,
            icon: 'brutal_daze.png',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { atkMult: 2.0 }
        },
        onCast: function(attacker, defender) {
            const damage = calculateSkillRawDamage(attacker, this.data);
            hero.statusEffects.push({ id: 'debuff_enemy_atk', name: 'Düşman Güçsüz', value: 0.25, turns: 3, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'daze', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(damage, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },

    armor_break: {
        data: {
            name: "Zırh Kıran",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.",
            rageCost: 30,
            levelReq: 3,
            icon: 'brutal_armor_break.png',
            type: 'attack',
            category: 'brutal', 
            tier: 3,
            scaling: { atkMult: 1.0, stats: { str: 0.5 } }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'armor_break', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'ignore_def', name: 'Zırh Kırıldı', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            const damage = calculateSkillRawDamage(attacker, this.data);
            animateCustomAttack(damage, ['images/barbarian_attack2.png', 'images/barbarian_attack3.png'], this.data.name);
        }
    },

    fury: {
        data: {
            name: "Hiddet",
            menuDescription: "50 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: Hasarın %25'i kadar Rage kazan.</span>",
            rageCost: 50,
            levelReq: 6,
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

    hell_blade: {
        data: {
            name: "Cehennem Kılıcı",
            menuDescription: "Kanlı saldırı. 25 Öfke.<br>Hasar: <b style='color:orange'>ATK + 0.8 x INT</b>.<br><span style='color:#ff4d4d'>Bedel: %10 Can</span>.",
            rageCost: 25,
            levelReq: 1,
            icon: 'icon_hell_blade.png',
            type: 'attack',
            category: 'chaos', 
            tier: 1,
            scaling: { atkMult: 1.0, stats: { int: 0.8 }, elements: { fire: 0.0 } }
        },
        onCast: function(attacker, defender) {
            const hpCost = Math.floor(hero.hp * 0.10);
            hero.hp = Math.max(1, hero.hp - hpCost);
            showFloatingText(document.getElementById('hero-display'), `-${hpCost}`, 'damage');
            const damage = calculateSkillRawDamage(attacker, this.data);
            animateCustomAttack(damage, ['images/barbarian_hellblade_strike1.png', 'images/barbarian_hellblade_strike2.png', 'images/barbarian_hellblade_strike3.png'], this.data.name);
        }
    },

    // ======================================================
    // TAB: FERVOR (COŞKU)
    // ======================================================
    
	Pummel_Bash: { 
        data: {
            name: "Kabzayla Vur",
            menuDescription: "Str'nin %120'si kadar hasar. +18 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
            icon: 'icon_strike.png',
            type: 'attack',
            category: 'fervor',
            tier: 1,
            scaling: { atkMult: 0, stats: { str: 1.2 }, elements: { physical: 1.0 } }
        },
        onCast: function(attacker, defender) {
            const dmg = calculateSkillRawDamage(attacker, this.data);
            hero.rage = Math.min(hero.maxRage, hero.rage + 18);
            showFloatingText(document.getElementById('hero-display'), "+18 Rage", 'heal');
            animateCustomAttack(dmg, ['images/barbarian_attack1.png', 'images/barbarian_attack2.png'], this.data.name);
        }
    },
	
    battle_cry: {
        data: {
            name: "Savaş Çığlığı",
            menuDescription: "Motive ol. 20 Öfke harcar.<br><span style='color:#43FF64'>3 Tur: %40 STR Artışı</span>.",
            rageCost: 20,
            levelReq: 2,
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

    restore_healing: {
        data: {
            name: "Yenilenme",
            menuDescription: "Güçlü iyileşme. 50 Öfke harcar.<br><span style='color:#43FF64'>30 HP + (10 HP x 3 Tur)</span>.",
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
            if ((hero.hp - oldHp) > 0) showFloatingText(document.getElementById('hero-display'), (hero.hp - oldHp), 'heal');
            hero.statusEffects.push({ id: 'regen', name: 'Yenilenme', turns: 3, min: 10, max: 10, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', turns: 5, maxTurns: 5, blockedSkill: 'restore_healing', resetOnCombatEnd: true });
            animateHealingParticles(); updateStats();
            setTimeout(() => { nextTurn(); }, 1000);
        }
    }

};
