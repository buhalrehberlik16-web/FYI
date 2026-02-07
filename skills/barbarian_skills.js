// barbarian_skills.js - Elemental & Physical Scaling Entegre Edilmiş Güncel Sürüm

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
            icon: 'skills/barbarian/brutal/brutal_pommel_bash.webp',
            type: 'attack',
            category: 'brutal',
            tier: 1,
            // YENİ SİSTEM: Physical ve Elemental ayrımı
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.2},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            // SkillEngine artık {total, phys, elem} paketi döner
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
			const stats = getHeroEffectiveStats(); 
            hero.rage = Math.min(stats.maxRage, hero.rage + 18);
            showFloatingText(document.getElementById('hero-display'), "+18 Rage", 'heal');
            
            // Animasyona artık sayı değil, paket gönderiyoruz
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },
	
    slash: {
        data: {
            name: "Kesik",
            menuDescription: "Saldırı gücü + %60 Str bonusu. 20 Öfke harcar.",
            rageCost: 20,
            levelReq: 1,
			cooldown: 0,
            icon: 'skills/barbarian/brutal/brutal_slash.webp',
            type: 'attack',
            category: 'brutal', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.6 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'slash', turns: 1, maxTurns: 1, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },
    

    bash: {
        data: {
            name: "Balyoz",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 0.8 x STR</b>.<br><span style='color:cyan'>%30 Şansla Sersemletir (1 Tur).</span>",
            rageCost: 30,
            levelReq: 3,
			cooldown: 2,
            icon: 'skills/barbarian/brutal/brutal_bash.webp',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.8 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            if (Math.random() < 0.30) hero.statusEffects.push({ id: 'monster_stunned', name: 'Düşman Sersem', turns: 1, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'bash', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
        }
    },

    pierce_through: {
        data: {
            name: "Delip Geç",
            menuDescription: "Hasar: <b style='color:orange'>1.5 x ATK + 0.8 x STR</b>.<br><span style='color:cyan'>Düşman Defansının %50'sini yok sayar.</span>",
            rageCost: 30,
            levelReq: 3,
			cooldown: 1,
            icon: 'skills/barbarian/brutal/brutal_pierce_through.webp',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.5, stat: "str", statMult: 0.8 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            // "Defansın %50'sini Yok Sayar" özel bir durumdur, dmgPack hesaplandıktan sonra müdahale edelim
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'pierce_through', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            
            let monsterDef = defender.defense + (window.isMonsterDefending ? (window.monsterDefenseBonus || 0) : 0);
            const ignoredDef = Math.floor(monsterDef * 0.50);
            
            // Defansın yarısını fiziksel hasara iade et
            dmgPack.total += ignoredDef;
            dmgPack.phys += ignoredDef;

            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack2.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
        }
    },

    daze: {
        data: {
            name: "Afallat",
            menuDescription: "Hasar: <b style='color:orange'>2 x ATK</b>.<br><span style='color:#b19cd9'>2 Tur: Düşman ATK %25 azalır.</span>",
            rageCost: 25,
            levelReq: 3,
			cooldown: 2,
            icon: 'skills/barbarian/brutal/brutal_daze.webp',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { 
                physical: { atkMult: 2.0, stat: "str", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
			const currentLang = window.gameSettings.lang || 'tr';
			const lang = window.LANGUAGES[currentLang];
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
            applyStatusEffect({ id: 'debuff_enemy_atk', name: lang.status.debuff_enemy_atk, value: 0.25, turns: 3, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'daze', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },

    armor_break: {
        data: {
            name: "Zırh Kıran",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.",
            rageCost: 30,
            levelReq: 3,
			cooldown: 2,
            icon: 'skills/barbarian/brutal/brutal_armor_break.webp',
            type: 'attack',
            category: 'brutal', 
            tier: 3,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.5 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'armor_break', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'ignore_def', name: 'Zırh Kırıldı', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            
            // ignore_def aktif olduğu için SkillEngine targetDef'i 0 görecektir
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack2.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
        }
    },

    fury: {
        data: {
            name: "Hiddet",
            menuDescription: "50 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: Hasarın %25'i kadar Rage kazan.</span>",
            rageCost: 50,
            levelReq: 6,
			cooldown: 5,
            icon: 'skills/barbarian/brutal/brutal_fury.webp',
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
            icon: 'skills/barbarian/chaos/chaos_blood_price.webp',
            type: 'utility', 
            category: 'chaos', 
            tier: 1
        },
        onCast: function() {
            const hpLoss = Math.floor(hero.maxHp * 0.15);
			const stats = getHeroEffectiveStats(); 
            hero.hp = Math.max(1, hero.hp - hpLoss);
            hero.rage = Math.min(stats.maxRage, hero.rage + hpLoss);

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
	
		
	    reckless_strike: {
        data: {
            name: "Pervasız Vuruş",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 1.3 x STR</b>.<br><span style='color:#ff4d4d'>2 Tur: Defansın 0 olur.</span>",
            rageCost: 35,
            levelReq: 1,
			cooldown: 1,
            icon: 'skills/barbarian/brutal/brutal_reckless_strike.webp',
            type: 'attack',
            category: 'chaos',
            tier: 1,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 1.3 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'defense_zero', name: 'Savunmasız', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'reckless_strike', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack2.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
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
            icon: 'skills/barbarian/chaos/chaos_fiery_blade.webp',
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
            menuDescription: "Kanlı saldırı. 25 Öfke.<br>Hasar: <b style='color:orange'>ATK + 1.3 x INT</b>.<br><span style='color:#ff4d4d'>Bedel: %10 Can</span>.",
            rageCost: 25,
            levelReq: 2,
			cooldown: 0,
            icon: 'skills/barbarian/chaos/chaos_hell_blade.webp',
            type: 'attack',
            category: 'chaos', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.0, stat: "int", statMult: 1.3 },
                elemental: { fire: 1.0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const hpCost = Math.floor(hero.hp * 0.10);
            hero.hp = Math.max(1, hero.hp - hpCost);
            showFloatingText(document.getElementById('hero-display'), `-${hpCost}`, 'damage');
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_hellblade_strike1.webp', 'images/heroes/barbarian/barbarian_hellblade_strike2.webp', 'images/heroes/barbarian/barbarian_hellblade_strike3.webp'], this.data.name);
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
            icon: 'skills/barbarian/chaos/chaos_double_blade.webp',
            type: 'buff', 
            category: 'chaos', 
            tier: 3			
        },
        onCast: function() {
            // Mevcut hasar motorumuzdaki atk_up_percent çarpanını kullanıyoruz
            hero.statusEffects.push({ 
                id: 'atk_up_percent', 
                name: 'Hücum!', 
                value: 0.50, 
                turns: 4, 
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            // Skill Cooldown
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'double_blade', turns: 5, maxTurns: 5, resetOnCombatEnd: true });

            updateStats();
            showFloatingText(document.getElementById('hero-display'), "ÖFKELENDİ!", 'heal');
            
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
            icon: 'skills/barbarian/chaos/chaos_cauterize.webp',
            type: 'defense',
            category: 'chaos', 
            tier: 3
        },
        onCast: function(attacker, defender) {
            const initialHeal = 25;
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
        icon: 'skills/barbarian/fervor/fervor_wind_up.webp',
        type: 'buff',
        category: 'fervor',
        tier: 1,
        // Bu bir buff olduğu için hasar motoruna direkt girmez ama 
        // bonusu belirlemek için scaling verisini burada tutabiliriz.
        scaling: { 
            physical: { atkMult: 0, stat: "str", statMult: 1.0 },
            elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
        } 
    },
    onCast: function(attacker, defender) {
        // Motoru kullanarak bonusu hesapla
        const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
		const stats = getHeroEffectiveStats(); 
        
        hero.statusEffects.push({ 
            id: 'wind_up', 
            name: 'Güç Toplandı', 
            value: dmgPack.total, 
            turns: 5, 
            waitForCombat: false, 
            resetOnCombatEnd: true 
        });

        hero.rage = Math.min(stats.maxRage, hero.rage + 15);
        hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'wind_up', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
        
        updateStats();
        showFloatingText(document.getElementById('hero-display'), "GÜÇ TOPLANIYOR!", 'heal');
        writeLog(`💨 **${this.data.name}**: Bir sonraki vuruşa +${dmgPack.total} güç eklendi.`);
        setTimeout(() => { nextTurn(); }, 1000);
    }
},

    light_blade: {
        data: {
            name: "Işığın Kılıcı",
            menuDescription: "Cesur saldırı. 35 Öfke.<br>Hasar: <b style='color:orange'>ATK + 1.5 x MP</b>.",
            rageCost: 35,
            levelReq: 2,
			cooldown: 0,
            icon: 'skills/barbarian/chaos/chaos_hell_blade.webp',
            type: 'attack',
            category: 'fervor', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.0, stat: "mp_pow", statMult: 1.5 },
                elemental: { fire: 0, cold: 0, lightning: 1.0, poison: 0, curse: 0 }
            }
        },
		onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'light_blade', turns: 1, maxTurns: 1, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },
	
    battle_cry: {
        data: {
            name: "Savaş Çığlığı",
            menuDescription: "Motive ol. 20 Öfke harcar.<br><span style='color:#43FF64'>3 Tur: %40 STR Artışı</span>.",
            rageCost: 20,
            levelReq: 2,
			cooldown: 3,
            icon: 'skills/barbarian/fervor/icon_battle_cry.webp',
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
        icon: 'skills/barbarian/fervor/fervor_healing_light.webp',
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

