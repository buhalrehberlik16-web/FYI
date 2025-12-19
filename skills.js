// skills.js - TEK VERİTABANI VE GÜNCELLENMİŞ HASAR FORMÜLLERİ

const SKILL_DATABASE = {
    
    // ======================================================
    // TAB: COMMON (GENEL) - TIER 1 (Başlangıç Seçenekleri)
    // ======================================================
    
    // CUT (Kes): Temel Saldırı
    cut: {
        data: {
            name: "Kes",
            description: "Dengeli saldırı.",
            menuDescription: "Atağın kadar hasar. +10 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
            icon: 'icon_attack.png',
            type: 'attack',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            
            // YENİ FORMÜL: Global Atak Gücünün %50'i
            // (stats.atk zaten STR, Sharpen vb. içerir)
            const dmg = Math.floor(stats.atk * 1.0);
            
            hero.rage = Math.min(hero.maxRage, hero.rage + 10);
            showFloatingText(document.getElementById('hero-display'), "+10 Rage", 'heal');

            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(dmg, fullPathFrames, this.data.name);
        }
    },

    // GUARD (Siper): Temel Savunma
    guard: {
        data: {
            name: "Siper",
            description: "Gelen hasarı azaltır.",
            menuDescription: "Gelen hasarı %25 azaltır. -15 Rage.",
            rageCost: 15,
            levelReq: 1,
            icon: 'icon_defend.png',
            type: 'defense',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({
                id: 'guard_active',
                name: 'Koruma',
                value: 0.25,
                turns: 1,
                waitForCombat: false,
                resetOnCombatEnd: true
            });
            
            isHeroDefending = true;
            updateStats();
            writeLog(`🛡️ **${this.data.name}**: Savunma pozisyonu (%25 Hasar Azaltma).`);
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

    // STRIKE (Vuruş): Ağır Saldırı
    strike: { 
        data: {
            name: "Vuruş",
            description: "Güçlü hasar.",
            menuDescription: "Atağın %115'i kadar hasar. +0-9 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
            icon: 'icon_strike.png',
            type: 'attack',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            
            // YENİ FORMÜL: Global Atak Gücünün %70'i
            const dmg = Math.floor(stats.atk * 1.15);
            
            const genRage = Math.floor(Math.random() * 10); // 0-9
            hero.rage = Math.min(hero.maxRage, hero.rage + genRage);
            if(genRage > 0) showFloatingText(document.getElementById('hero-display'), `+${genRage} Rage`, 'heal');

            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png']; 
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(dmg, fullPathFrames, this.data.name);
        }
    },

    // BLOCK (Blok): Hasar Emme
     block: { 
        data: {
            name: "Blok",
            description: "Hasar emer.",
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
            
            
            // stats.blockPower -> combat_manager'da config'e göre hesaplandı
            const blockVal = stats.blockPower;
            
            if(typeof addHeroBlock === 'function') {
                addHeroBlock(blockVal);
            }

            writeLog(`🧱 **${this.data.name}**: ${blockVal} Blok kazandın.`);
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

    // ======================================================
    // TAB: COMMON (GENEL) - TIER 2 & 4
    // ======================================================
    
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

    distract: {
        data: {
            name: "Dikkat Dağıt",
            description: "Düşmanı şaşırtır.",
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
            writeLog(`✨ **${this.data.name}**: Düşman zayıflatıldı!`);

            setTimeout(() => {
                toggleBasicActions(false); 
                toggleSkillButtons(false); 
            }, 300); 
        }
    },
	
	tactical_strike: {
        data: {
            name: "Taktiksel Vuruş",
            description: "Düşmanın zayıf noktasına vurur.",
            menuDescription: "Saldırı gücünün %130'u kadar hasar. 15 Öfke harcar.<br><span style='color:cyan'>10 Defansı Yok Sayar.</span>",
            rageCost: 15,
            levelReq: 2, 
            icon: 'icon_tactical_strike.png',
            type: 'attack',
            category: 'common', 
            tier: 2
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            // YENİ FORMÜL: ATK * 1.3
            const damageToSend = Math.floor(stats.atk * 1.3);

            // Defans Delme Mantığı (Combat Manager'da düşüldüğü için buraya ekliyoruz)
            let currentMonsterDef = monster.defense;
            if (typeof isMonsterDefending !== 'undefined' && isMonsterDefending) currentMonsterDef += monsterDefenseBonus;
            const ignoredAmount = Math.min(currentMonsterDef, 10);
            
            const finalDmg = damageToSend + ignoredAmount;

            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            animateCustomAttack(finalDmg, fullPathFrames, this.data.name);
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
            description: "Silahını keskinleştir.",
            menuDescription: "Saldırı gücünü artırır. 30 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: +%25 Saldırı Gücü</span>.<br><span style='color:yellow'>Bekleme: 6 Tur</span>.",
            rageCost: 30,
            levelReq: 10, 
            icon: 'icon_sharpen.png',
            type: 'buff',
            category: 'common',
            tier: 4
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'atk_up_percent', name: 'Keskinlik', turns: 4, value: 0.25, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', blockedSkill: 'sharpen', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "KESKİNLEŞTİ!", 'heal');
            writeLog(`✨ **${this.data.name}**: Saldırı gücün %25 arttı!`);
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

    curse: {
        data: {
            name: "Lanet",
            description: "Düşmanı lanetler.",
            menuDescription: "Karanlık fısıltılar. 20 Öfke harcar.<br><span style='color:#b19cd9'>5 Tur: Düşman %20 Fazla Hasar Alır.</span><br><span style='color:yellow'>Bekleme: 10 Tur</span>.",
            rageCost: 20,
            levelReq: 10,
            icon: 'icon_curseskill.png',
            type: 'debuff',
            category: 'common',
            tier: 4
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'curse_damage', name: 'Lanetli', turns: 5, value: 0.20, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', blockedSkill: 'curse', turns: 10, maxTurns: 10, resetOnCombatEnd: true });

            updateStats();
            showFloatingText(document.getElementById('monster-display'), "LANETLENDİ!", 'damage'); 
            writeLog(`💀 **${this.data.name}**: Düşman %20 fazla hasar alacak.`);
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

	/////-----Tier 5-----//////
	willful_strike: {
        data: {
            name: "İradeli Vuruş",
            description: "Tüm öfkeni güce dönüştür.",
            menuDescription: "Mevcut <b>TÜM ÖFKEYİ</b> harcar.<br>Hasar: ATK x (1 + Harcanan Öfke%).<br><span style='color:yellow'>Bekleme: 5 Tur</span>",
            rageCost: 0, 
            levelReq: 1, 
            icon: 'icon_willful_strike.png',
            type: 'attack',
            category: 'common',
            tier: 5
        },
        onCast: function(attacker, defender) {
            const spentRage = hero.rage;
            hero.rage = 0; 
            
            if(typeof updateStats === 'function') updateStats();

            const stats = getHeroEffectiveStats();
            
            // Çarpan: 1 + (Rage / 100)
            const multiplier = 1 + (spentRage / 100);
            // YENİ FORMÜL: ATK * Multiplier
            const totalDamage = Math.floor(stats.atk * multiplier);

            hero.statusEffects.push({ 
                id: 'block_skill', 
                name: 'Soğuma', 
                blockedSkill: 'willful_strike', 
                turns: 5, 
                maxTurns: 5, 
                resetOnCombatEnd: true 
            });

            writeLog(`💥 **${this.data.name}**: ${spentRage} Öfke harcandı! (x${multiplier.toFixed(1)} Güç)`);

            const animFrames = ['barbarian_attack2.png','barbarian_attack3.png']; 
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(totalDamage, fullPathFrames, this.data.name);
        }
    },	




    // ======================================================
    // TAB: BRUTAL (VAHŞET)
    // ======================================================

    slash: {
        data: {
            name: "Kesik",
            description: "Hızlı bir kılıç darbesi.",
            menuDescription: "Saldırı gücünün %150'si kadar hasar. 25 Öfke harcar.<br><span style='color:yellow'>Bekleme: 1 Tur</span>.",
            rageCost: 25,
            levelReq: 1,
            icon: 'brutal_slash.png',
            type: 'attack',
            category: 'brutal', 
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            // YENİ FORMÜL: ATK * 1.5
            const damage = Math.floor(stats.atk * 1.5);
			
			 hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', blockedSkill: 'slash', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            
            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            animateCustomAttack(damage, fullPathFrames, this.data.name);
        }
    },
    
	// RECKLESS STRIKE: Riskli Vuruş
    reckless_strike: {
        data: {
            name: "Pervasız Vuruş",
            description: "Savunmayı boşverip saldır.",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 2 x STR</b>.<br><span style='color:#ff4d4d'>2 Tur: Defansın 0 olur.</span><br><span style='color:yellow'>Bekleme: 2 Tur</span>.",
            rageCost: 20,
            levelReq: 1,
            icon: 'brutal_reckless_strike.png',
            type: 'attack',
            category: 'brutal',
            tier: 1
        },
        onCast: function(attacker, defender) {
            // Debuff: Defansı 0 yap
            hero.statusEffects.push({ id: 'defense_zero', name: 'Savunmasız', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            
            // Cooldown: 2 Tur (Yani 3 yazıyoruz)
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'reckless_strike', turns: 3, maxTurns: 3, resetOnCombatEnd: true });

            const stats = getHeroEffectiveStats();
            // Formül: ATK + 2*STR
            const damage = stats.atk + Math.floor(stats.str * 2.0);
            
            // 2 Kare Animasyon
            const animFrames = ['barbarian_attack2.png', 'barbarian_attack3.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
            writeLog(`💢 **${this.data.name}**: Tüm gücünle saldırdın ama savunmasız kaldın!`);
        }
    },

    // WIND UP: Kurulma
    wind_up: {
        data: {
            name: "Kurulma",
            description: "Bir sonraki saldırıya hazırlan.",
            menuDescription: "Sonraki saldırın <b style='color:orange'>+1 x STR</b> fazla vurur.<br><span style='color:yellow'>Bekleme: 3 Tur</span>.",
            rageCost: 15,
            levelReq: 1,
            icon: 'brutal_wind_up.png',
            type: 'buff',
            category: 'brutal',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const bonusDmg = Math.floor(stats.str * 1.0);

            // Buff Ekle (Kullanılana kadar kalsın, max 5 tur diyelim güvenlik için)
            hero.statusEffects.push({ 
                id: 'wind_up', 
                name: 'Güç Toplandı', 
                value: bonusDmg, 
                turns: 5, 
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            // Cooldown: 3 Tur (Yani 4 yazıyoruz)
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'wind_up', turns: 4, maxTurns: 4, resetOnCombatEnd: true });

            updateStats();
            showFloatingText(document.getElementById('hero-display'), "GÜÇ TOPLANIYOR!", 'heal');
            writeLog(`💨 **${this.data.name}**: Sonraki saldırın +${bonusDmg} hasar verecek.`);
            
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

    // ---------------- TIER 2 ----------------

    // BASH: Sersemletici Vuruş
    bash: {
        data: {
            name: "Balyoz",
            description: "Düşmanı sersemletebilir.",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 1.3 x STR</b>.<br><span style='color:cyan'>%30 Şansla Sersemletir (1 Tur).</span><br><span style='color:yellow'>Bekleme: 3 Tur</span>.",
            rageCost: 30,
            levelReq: 3,
            icon: 'brutal_bash.png',
            type: 'attack',
            category: 'brutal',
            tier: 2
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            // Formül: ATK + 1.3*STR
            const damage = stats.atk + Math.floor(stats.str * 1.3);

            // Stun Şansı
            if (Math.random() < 0.30) {
                // Stun Etkisi Ekle (Canavar sırasına gelince kontrol edilecek)
                // Süre: 2 (Bu turun kalanı + Canavarın turu)
                hero.statusEffects.push({ id: 'monster_stunned', name: 'Düşman Sersem', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
                writeLog("💫 **BALYOZ**: Düşman sersemledi!");
            }

            // Cooldown: 3 Tur (Yani 4)
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'bash', turns: 4, maxTurns: 4, resetOnCombatEnd: true });

            const animFrames = ['barbarian_attack1.png', 'barbarian_attack3.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
        }
    },

    // PIERCE THROUGH: Delici Vuruş
    pierce_through: {
        data: {
            name: "Delip Geç",
            description: "Zırhı deler.",
            menuDescription: "Hasar: <b style='color:orange'>1.5 x ATK + 1 x STR</b>.<br><span style='color:cyan'>Düşman Defansının %50'sini yok sayar.</span><br><span style='color:yellow'>Bekleme: 2 Tur</span>.",
            rageCost: 30,
            levelReq: 3,
            icon: 'brutal_pierce_through.png',
            type: 'attack',
            category: 'brutal',
            tier: 2
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            // Formül: 1.5*ATK + 1*STR
            const damageVal = Math.floor(stats.atk * 1.5) + stats.str;

            // Cooldown: 2 Tur (Yani 3)
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'pierce_through', turns: 3, maxTurns: 3, resetOnCombatEnd: true });

            // ÖZEL HASAR UYGULAMA (Defans %50)
            // animateCustomAttack fonksiyonu defansı otomatik düşüyor. 
            // Biz burada "yok sayılan defansı" hasara ekleyerek hile yapacağız.
            
            let monsterDef = monster.defense;
            if(typeof isMonsterDefending !== 'undefined' && isMonsterDefending) monsterDef += monsterDefenseBonus;
            
            const ignoredDef = Math.floor(monsterDef * 0.50); // %50 Ignore
            const totalDamageToSend = damageVal + ignoredDef;

            const animFrames = ['barbarian_attack2.png', 'barbarian_attack3.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(totalDamageToSend, fullPathFrames, this.data.name);
        }
    },

    // DAZE: Sersemlet (Atak Kırma)
    daze: {
        data: {
            name: "Afallat",
            description: "Düşmanın saldırısını düşürür.",
            menuDescription: "Hasar: <b style='color:orange'>2 x ATK</b>.<br><span style='color:#b19cd9'>2 Tur: Düşman ATK %25 azalır.</span><br><span style='color:yellow'>Bekleme: 2 Tur</span>.",
            rageCost: 25,
            levelReq: 3,
            icon: 'brutal_daze.png',
            type: 'attack',
            category: 'brutal',
            tier: 2
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const damage = Math.floor(stats.atk * 2.0);

            // Debuff: Enemy ATK %25 Down (2 Tur) -> Süreye 3 yazıyoruz
            hero.statusEffects.push({ id: 'debuff_enemy_atk', name: 'Düşman Güçsüz', value: 0.25, turns: 3, waitForCombat: false, resetOnCombatEnd: true });

            // Cooldown: 2 Tur (Yani 3)
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'daze', turns: 3, maxTurns: 3, resetOnCombatEnd: true });

            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
            writeLog(`🌀 **${this.data.name}**: Düşmanın başı döndü! (Atak Düştü)`);
        }
    },

	// ---------------- TIER 3 ----------------
    armor_break: {
        data: {
            name: "Zırh Kıran",
            description: "Savunmayı yok sayar.",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br>Saldırı gücünün %100'ü kadar hasar.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.<br><span style='color:yellow'>Bekleme: 3 Tur</span>",
            rageCost: 30,
            levelReq: 3,
            icon: 'brutal_armor_break.png',
            type: 'attack',
            category: 'brutal', 
            tier: 3
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', blockedSkill: 'armor_break', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'ignore_def', name: 'Zırh Kırıldı', turns: 2, waitForCombat: false, resetOnCombatEnd: true });

            const stats = getHeroEffectiveStats();
            // YENİ FORMÜL: ATK * 1.0
            const damage = Math.floor(stats.atk * 1.0);

            const animFrames = ['barbarian_attack2.png', 'barbarian_attack3.png']; 
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            animateCustomAttack(damage, fullPathFrames, this.data.name);
            writeLog(`🔨 **${this.data.name}**: Zırh parçalandı!`);
        }
    },

	// ---------------- TIER 4 ----------------

fury: {
        data: {
            name: "Hiddet",
            description: "Vurdukça öfkelen.",
            menuDescription: "Kanın kaynıyor. 50 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: Hasarın %25'i kadar Rage kazan.</span><br><span style='color:yellow'>Bekleme: 6 Tur</span>.",
            rageCost: 50,
            levelReq: 1,
            icon: 'brutal_fury.png',
            type: 'buff',
            category: 'brutal',
            tier: 2
        },
        onCast: function(attacker, defender) {
            // Buff Ekle
            hero.statusEffects.push({ 
                id: 'fury_active', // Combat Manager bunu kontrol edecek
                name: 'Hiddetli', 
                turns: 4, 
                value: 0.25, // %25 Dönüşüm
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            // Cooldown (6 Tur bekler -> 7 yazıyoruz ki 6 tur kapalı kalsın)
            hero.statusEffects.push({ 
                id: 'block_skill', 
                name: 'Soğuma', 
                blockedSkill: 'fury', 
                turns: 7, 
                maxTurns: 7, 
                resetOnCombatEnd: true 
            });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "HİDDET!", 'heal');
            writeLog(`🔥 **${this.data.name}**: Vuruşların sana Öfke kazandıracak!`);
            
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

    // ======================================================
    // TAB: CHAOS (KAOS)
    // ======================================================

    hell_blade: {
        data: {
            name: "Cehennem Kılıcı",
            description: "Canını feda edip vur.",
            // Açıklama: "Atak Gücü + %50 MP"
            menuDescription: "Kanlı saldırı. 25 Öfke.<br>Hasar: <b style='color:orange'>ATK + 0.5 x INT</b>.<br><span style='color:#ff4d4d'>Bedel: %10 Can</span>.",
            rageCost: 25,
            levelReq: 1,
            icon: 'icon_hell_blade.png',
            type: 'attack',
            category: 'chaos', 
            tier: 1
        },
        onCast: function(attacker, defender) {
            // HP Bedeli
            const hpCost = Math.floor(hero.hp * 0.10);
            hero.hp = Math.max(1, hero.hp - hpCost);
            showFloatingText(document.getElementById('hero-display'), `-${hpCost}`, 'damage');

            // --- MODÜLER HASAR HESABI ---
            const stats = getHeroEffectiveStats();
            
            // 1. Ana Stat (Barbar için STR'li ATK, Mage için INT'li ATK)
            const baseDmg = stats.atk; 
            
            // 2. Skill Özel Bonusu (Int)
            const statBonus = Math.floor(stats.int * 0.5);
            
            // Toplam Hasar
            let damage = baseDmg + statBonus;

            // Animasyon
            const animFrames = ['barbarian_hellblade_strike1.png', 'barbarian_hellblade_strike2.png', 'barbarian_hellblade_strike3.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
        }
    },

    // ======================================================
    // TAB: FERVOR (COŞKU)
    // ======================================================

    battle_cry: {
        data: {
            name: "Savaş Çığlığı",
            description: "Gücünü topla!",
            menuDescription: "Motive ol. 20 Öfke harcar.<br><span style='color:#43FF64'>3 Tur: %40 STR Artışı</span>.<br><span style='color:yellow'>Bekleme: 4 Tur</span>",
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
            hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', blockedSkill: 'battle_cry', turns: 4, maxTurns: 4, resetOnCombatEnd: true });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), `+${bonusStr} STR`, 'heal');
            writeLog(`📢 **${this.data.name}**: STR ${bonusStr} arttı!`);
            setTimeout(() => { nextTurn(); }, 1000); 
        }
    },

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