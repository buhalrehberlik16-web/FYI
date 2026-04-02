// common_skills.js - Elemental & Physical Scaling Entegre Edilmiş Güncel Sürüm

const COMMON_SKILLS = {
// ======================================================
    // TAB: COMMON (GENEL)
    // ======================================================
    
	// --- TIER 0 ---
	rest: {
        data: {
            name: "Dinlen", // Bu isim aslında çeviriden gelecek ama kütüphanede kalabilir
            rageCost: 0,
            levelReq: 1,
            icon: 'skills/common/icon_rest.webp',
            type: 'utility',
            category: 'common',
            tier: 0
        },
        onCast: function() {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
			
            // Manuel kullanım sayısını al
            const usage = hero.skillUsage["rest"] || 0;
            
            // Kural: 5'ten başlar, her kullanımda 1 azalır, 0'da çakılı kalır.
            const reduction = Math.max(0, 5 - usage);
            
            hero.exhaustion = Math.max(0, hero.exhaustion - reduction);
            hero.skillUsage["rest"] = usage + 1;
			
			const arenaCenter = document.getElementById('arena-center-notif');
			showFloatingText(arenaCenter, lang.exhaustion_rest, 'heal');
            
            // Loglama
            writeLog(lang.log_rest_skill.replace("$1", reduction));
            
            updateStats();
            window.updateExhaustionUI();
            setTimeout(nextTurn, 1000);
        }
    },
	
    // --- TIER 1 ---
    cut: {
        data: {
            name: "Kes",
            menuDescription: "Atağın kadar hasar. +7 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
            icon: 'skills/common/icon_attack.webp',
            type: 'attack',
            category: 'common',
            tier: 1,
            // YENİ SİSTEM: Physical ve Elemental ayrımı
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            // SkillEngine artık {total, phys, elem} paketi döner
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
            const stats = getHeroEffectiveStats(); 
            showFloatingText(document.getElementById('hero-display'), "+7 Rage", 'heal');
            
            // Animasyona artık sayı değil, paket gönderiyoruz
            animateCustomAttack(dmgPack, null, this.data.name); 
        }
    },

    guard: {
        data: {
            name: "Siper",
            menuDescription: "Gelen hasarı %25 azaltır. 0 Rage.",
            rageCost: -1,
            levelReq: 1,
            icon: 'skills/common/icon_defend.webp',
            type: 'defense',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            // Guard_active etkisi SkillEngine içinde %25 (0.25) sönümleme yapar
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
            icon: 'skills/common/icon_strike.webp',
            type: 'attack',
            category: 'common',
            tier: 1,
            scaling: { 
                physical: { atkMult: 1.15, stat: "str", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
            const genRage = Math.floor(Math.random() * 10);
            const stats = getHeroEffectiveStats(); 
            if(genRage > 0) showFloatingText(document.getElementById('hero-display'), `+${genRage} Rage`, 'heal');
            
            animateCustomAttack(dmgPack, null, this.data.name); 
        }
    },

    block: { 
        data: {
            name: "Blok",
            menuDescription: "Dex değerinin %80'i kadar blok kazanır. Blok tur sonunda %50 azalır. -10 Rage.",
            rageCost: 10,
            levelReq: 1,
            icon: 'skills/common/icon_block.webp',
            type: 'utility',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const currentLang = window.gameSettings.lang || 'tr';
            const lang = window.LANGUAGES[currentLang];
            
            const stats = getHeroEffectiveStats();
            const blockVal = stats.blockPower;
            
            if(typeof addHeroBlock === 'function') addHeroBlock(blockVal);

            const skillName = lang.skills.block.name;
            const logMsg = currentLang === 'tr' ? "kazandın." : "gained.";
            const blockLabel = lang.combat.f_block.replace('!', '');

            writeLog(`🧱 **${skillName}**: ${blockVal} ${blockLabel} ${logMsg}`);
            
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

    // --- TIER 2 ---
    minor_healing: {
        data: {
            name: "Küçük İyileşme",
            menuDescription: "Hızlı pansuman. 20 Öfke harcar.<br><span style='color:#43FF64'>Sabit 10 HP</span> + (0.5 x INT).",
            rageCost: 20,
            levelReq: 1,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'defense',
            category: 'common', 
            tier: 2,
            pointCost: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const healAmount = 10 + Math.floor((stats.int || 0) * 0.5);
            const oldHp = hero.hp;
            hero.hp = Math.min(stats.maxHp, hero.hp + healAmount);
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
            cooldown: 1,
            icon: 'skills/common/icon_distract.webp',
            type: 'debuff',
            category: 'common',
            tier: 2,
            pointCost: 1
        },
        onCast: function(attacker, defender) {
            const currentLang = window.gameSettings.lang || 'tr';
            const lang = window.LANGUAGES[currentLang];
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'distract', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            applyStatusEffect(defender, { id: 'debuff_enemy_atk', name: lang.status.debuff_enemy_atk, value: 0.25, turns: 2, waitForCombat: false, resetOnCombatEnd: true });
			applyStatusEffect(defender, { id: 'debuff_enemy_def', name: 'Düşman Savunmasız', value: 0.50, turns: 3, waitForCombat: false, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('monster-display'), "ZAYIFLADI!", 'damage');
            setTimeout(() => {  window.isHeroTurn = true; toggleSkillButtons(false); }, 300); 
        }
    },
	
    tactical_strike: {
        data: {
            name: "Taktiksel Vuruş",
            menuDescription: "Saldırı gücünün %130'u kadar hasar. 15 Öfke harcar.<br><span style='color:cyan'>10 Defansı Yok Sayar.</span>",
            rageCost: 15,
            levelReq: 1, 
            icon: 'skills/common/icon_tactical_strike.webp',
            type: 'attack',
            category: 'common', 
            tier: 2,
            pointCost: 1,
            scaling: { 
                physical: { atkMult: 1.3, stat: "dex", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            // Önce normal paketimizi hesaplayalım
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
            // "10 Defansı Yok Sayar" mantığı: 
            // Eğer fiziksel hasar defansa takıldıysa (physRaw < def), aradaki kaybın 10 puanını geri verelim.
            let monsterDef = defender.defense + (window.isMonsterDefending ? (window.monsterDefenseBonus || 0) : 0);
            const ignoredAmount = Math.min(monsterDef, 10);
            
            // Paketi el yordamıyla güncelleyelim (Sadece bu skile özel)
            dmgPack.total += ignoredAmount;
            dmgPack.phys += ignoredAmount;
            
            animateCustomAttack(dmgPack, null, this.data.name); 
        }
    },

    // --- TIER 3 (PASİFLER) ---

    sharpen: {
        data: {
            name: "Bileme",
            menuDescription: "30 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: +%25 Saldırı Gücü</span>.",
            rageCost: 30,
            levelReq: 5, 
            cooldown: 5,
            icon: 'skills/common/icon_sharpen.webp',
            type: 'buff',
            category: 'common',
            tier: 3,
			pointCost: 2
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
            levelReq: 5,
            cooldown: 9,
            icon: 'skills/common/icon_curseskill.webp',
            type: 'debuff',
            category: 'common',
            tier: 3,
			pointCost: 2
        },
        onCast: function(attacker, defender) {
            applyStatusEffect(defender, { id: 'curse_damage', name: 'Lanetli', turns: 5, value: 0.20, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'curse', turns: 10, maxTurns: 10, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('monster-display'), "LANETLENDİ!", 'damage'); 
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },
	
    loot_junkie: {
        data: {
            name: "Ganimetçi",
            description: "Çantanda daha çok yer açar.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+2 Çanta Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 5,
            icon: 'skills/common/icon_loot_junkie.webp',
            type: 'passive',
            category: 'common',
            tier: 3,
			pointCost: 2,
            onAcquire: function() {
                hero.inventory.push(null, null);
                writeLog("🎒 Çanta kapasitesi arttı! (+2 Slot)");
            }
        }
    },

	// --- TIER 4 ---
	hoarder: {
        data: {
            name: "İstifçi",
            description: "Daha fazla takı takabilirsin.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+1 Broş Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 8,
            icon: 'skills/common/icon_hoarder.webp',
            type: 'passive',
            category: 'common',
            tier: 4,
			pointCost: 3,
            onAcquire: function() {
                hero.brooches.push(null);
                writeLog("📿 Broş kapasitesi arttı! (+1 Slot)");
            }
        }
    },

    fired_up: {
        data: {
            name: "Ateşli",
            description: "Savaşta daha fazla yetenek kullan.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+1 Yetenek Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 8,
            icon: 'skills/common/icon_fired_up.webp',
            type: 'passive',
            category: 'common',
            tier: 4,
			pointCost: 3,
            onAcquire: function() {
                hero.equippedSkills.push(null);
                writeLog("⚔️ Savaş kapasitesi arttı! (+1 Skill Slotu)");
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
                if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
            }
        }
    },

    // --- TIER 5 ---
    willful_strike: {
        data: {
            name: "İradeli Vuruş",
            menuDescription: "Mevcut <b>TÜM ÖFKEYİ</b> harcar.<br>Hasar: Paket x (1 + Harcanan Öfke%).",
            rageCost: 0, 
            levelReq: 8, 
            icon: 'skills/common/icon_willful_strike.webp',
            type: 'attack',
            category: 'common',
            tier: 5,
			pointCost: 4,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const spentRage = hero.rage;
            const multiplier = 1 + (spentRage / 100);
            
            // Önce ham paketi hesapla
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            
            // Tüm paketi öfke çarpanıyla güncelle
            dmgPack.total = Math.floor(dmgPack.total * multiplier);
            dmgPack.phys = Math.floor(dmgPack.phys * multiplier);
            dmgPack.elem = Math.floor(dmgPack.elem * multiplier);

            hero.rage = 0; 
            updateStats();
            
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'willful_strike', turns: 5, maxTurns: 5, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, null, this.data.name); 
        }
    },	

};




