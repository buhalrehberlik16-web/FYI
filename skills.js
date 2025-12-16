// skills.js - BİRLEŞTİRİLMİŞ YETENEK HAVUZU

const SKILL_DATABASE = {
    
    // ======================================================
    // TAB: COMMON (GENEL) - Tier 1 (Seçilebilir Başlangıçlar)
    // ======================================================
    
    // CUT (Kes): Temel Saldırı
    cut: {
        data: {
            name: "Kes",
            description: "Dengeli saldırı.",
            menuDescription: "Temel Hasar + 0.5x STR. +10 Rage üretir.",
            rageCost: 0, // Temel yetenekler bedava olabilir veya rage üretebilir
            levelReq: 1,
            icon: 'icon_attack.png',
            type: 'attack',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const dmg = 8 + Math.floor(stats.str * 0.5);
            hero.rage = Math.min(hero.maxRage, hero.rage + 10);
            
            // Animasyon (Basic Attack animasyonu kullanır)
            // Not: animateCustomAttack fonksiyonunu kullanabiliriz
            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            // Rage kazanımını göstermek için
            showFloatingText(document.getElementById('hero-display'), "+10 Rage", 'heal');
            
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
            // Guard Effect
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

    // STRIKE (Vuruş)
    strike: { // Kod adı 'strike' yaptım
        data: {
            name: "Vuruş",
            description: "Güçlü hasar.",
            menuDescription: "Temel hasar + 0.7x STR. Rastgele +0-9 Rage.",
            rageCost: 0,
            levelReq: 1,
            icon: 'icon_strike.png',
            type: 'attack',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const dmg = 8 + Math.floor(stats.str * 0.7);
            const genRage = Math.floor(Math.random() * 10); 
            
            hero.rage = Math.min(hero.maxRage, hero.rage + genRage);
            if(genRage > 0) showFloatingText(document.getElementById('hero-display'), `+${genRage} Rage`, 'heal');

            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png']; // Veya özel animasyon
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(dmg, fullPathFrames, this.data.name);
        }
    },

    // BLOCK (Blok)
    block: { // Kod adı 'block' yaptım
        data: {
            name: "Blok",
            description: "Hasar emer.",
            menuDescription: "INT kadar hasar emer. Blok tur sonunda %50 azalır. -10 Rage.",
            rageCost: 10,
            levelReq: 1,
            icon: 'icon_block.png',
            type: 'utility',
            category: 'common',
            tier: 1
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            const blockVal = 5 + Math.floor(hero.int * 1.5);
            
            // Block global değişkenini combat_manager'da tanımlamıştık (heroBlock)
            // Ancak bu dosyadan erişmek için window.heroBlock veya combat_manager fonksiyonu lazım.
            // En temiz yol: combat_manager içinde addBlock diye bir fonksiyon olması.
            // Şimdilik global değişkene erişiyoruz (Main.js'de tanımlı varsayıyoruz veya combat_manager scope'unda)
            
            // NOT: heroBlock combat_manager'da let ile tanımlı, dışarıdan erişilemeyebilir.
            // Bu yüzden logic'i buraya koymak yerine combat_manager'da özel efekt tanımlamak daha iyi.
            // GEÇİCİ ÇÖZÜM: Hero objesine block ekleyelim.
            
            if(typeof addHeroBlock === 'function') {
                addHeroBlock(blockVal);
            } else {
                writeLog("Hata: Blok fonksiyonu bulunamadı.");
            }

            writeLog(`🧱 **${this.data.name}**: ${blockVal} Blok kazandın.`);
            setTimeout(() => { nextTurn(); }, 1000);
        }
    },

	////////////////////////////
    // ---COMMON SKILLER --- //
	//////////////////////////
    
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

	// TACTICAL STRIKE: Defans Delici Vuruş
    tactical_strike: {
        data: {
            name: "Taktiksel Vuruş",
            description: "Düşmanın zayıf noktasına vurur.",
            // Menü açıklaması güncellendi
            menuDescription: "Zırhı deler. 15 Öfke harcar.<br>Hasar: <b style='color:orange'>Temel Hasar + 1.0 x STR</b>.<br><span style='color:cyan'>10 Defansı Yok Sayar.</span>",
            rageCost: 15,
            levelReq: 2, 
            icon: 'icon_tactical_strike.png',
            type: 'attack',
            category: 'common', 
            tier: 2
        },
        onCast: function(attacker, defender) {
            const stats = getHeroEffectiveStats();
            
            // 1. Temel Saldırı (Cut) Hasarını Hesapla: 8 + (STR * 0.5)
            const basicAttackDmg = 8 + Math.floor(stats.str * 0.5);

            // 2. Skill Bonusu: + (STR * 1.0)
            const skillBonusDmg = Math.floor(stats.str * 1.0);

            // Toplam Ham Hasar
            const totalRawDamage = basicAttackDmg + skillBonusDmg;

            // 3. Defans Delme Mantığı (Ignore 10 Defence)
            // Canavarın o anki toplam defansını buluyoruz
            let currentMonsterDef = monster.defense;
            if (typeof isMonsterDefending !== 'undefined' && isMonsterDefending) {
                currentMonsterDef += monsterDefenseBonus;
            }

            // Ne kadar defans yok sayılacak? (En fazla 10, ama defansı 10'dan azsa defansı kadar)
            const ignoredAmount = Math.min(currentMonsterDef, 10);
            
            // Animasyon fonksiyonuna gönderilecek hasar.
            // Sistem otomatik olarak defansı düşeceği için, biz yok saydığımız miktarı
            // hasarın üzerine ekleyerek "fake" bir delme işlemi yapıyoruz.
            const damageToSend = totalRawDamage + ignoredAmount;

            // Animasyon
            const animFrames = ['barbarian_attack1.png', 'barbarian_attack2.png'];
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damageToSend, fullPathFrames, this.data.name);
        }
    },
	
	// DISTRACT: Dikkat Dağıt (Quick Action)
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
            // Cooldown (Kullanıldıktan sonra 2 tur beklesin)
            hero.statusEffects.push({ 
                id: 'block_skill', 
                blockedSkill: 'distract', 
                turns: 2, 
                maxTurns: 2, 
                resetOnCombatEnd: true 
            });

            // 1. DÜŞMAN ATAK KIRMA (SÜRE DÜZELTMESİ: 2 TUR)
            // 2 Tur veriyoruz ki senin turunun bitişindeki azaltmadan sağ çıksın
            // ve düşmanın vuruş anında hala üzerinde olsun.
            hero.statusEffects.push({ 
                id: 'debuff_enemy_atk', 
                name: 'Düşman Güçsüz', 
                value: 0.25, // %25 Azaltma
                turns: 2,    // ÖNEMLİ: 1 yerine 2 yapıldı.
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });
            
            // 2. DÜŞMAN DEFANS KIRMA (GÜÇLENDİRİLDİ: %50)
            // Düşük defanslı düşmanlarda hissedilmesi için oran artırıldı.
            hero.statusEffects.push({ 
                id: 'debuff_enemy_def', 
                name: 'Düşman Savunmasız', 
                value: 0.25, // ÖNEMLİ: %25 yerine %50 yapıldı.
                turns: 3,    // 2 Tur sürmesi için buraya 3 yazıyoruz (Bu tur + Sonraki tur)
                waitForCombat: false, 
                resetOnCombatEnd: true 
            });

            updateStats();
            showFloatingText(document.getElementById('monster-display'), "ZAYIFLADI!", 'damage');
            writeLog(`✨ **${this.data.name}**: Düşman zayıflatıldı!`);

            // Quick Action: Butonları tekrar aç
            setTimeout(() => {
                toggleBasicActions(false); 
                toggleSkillButtons(false); 
            }, 300); 
        }
    },
	
	////////////////////////////
	//---Passive Yetenekler---//
	////////////////////////////
	// HOARDER: +2 Broş Slotu
    hoarder: {
        data: {
            name: "İstifçi",
            description: "Daha fazla takı takabilirsin.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+2 Broş Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 3,
            icon: 'icon_hoarder.png', // İkon eklemeyi unutma
            type: 'passive',
            category: 'common',
            tier: 3,
            // YENİ: Öğrenilince çalışacak kod
            onAcquire: function() {
                // Broş dizisine 2 tane boş slot ekle
                hero.brooches.push(null, null);
                writeLog("📿 Broş kapasitesi arttı! (+2 Slot)");
            }
        }
    },

    // LOOT JUNKIE: +1 Envanter Slotu
    loot_junkie: {
        data: {
            name: "Ganimetçi",
            description: "Çantanda daha çok yer açar.",
            menuDescription: "Pasif Yetenek.<br><span style='color:gold'>+1 Çanta Slotu</span> kazandırır.",
            rageCost: 0,
            levelReq: 3,
            icon: 'icon_loot_junkie.png',
            type: 'passive',
            category: 'common',
            tier: 3,
            onAcquire: function() {
                // Envantere 1 boş slot ekle
                hero.inventory.push(null);
                writeLog("🎒 Çanta kapasitesi arttı! (+1 Slot)");
            }
        }
    },

    // FIRED UP: +1 Skill Bar Slotu
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
                // Skill barına 1 boş slot ekle
                hero.equippedSkills.push(null);
                writeLog("⚔️ Savaş kapasitesi arttı! (+1 Skill Slotu)");
                
                // UI'ları hemen güncelle
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
                if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
            }
        }
    },
	
	/////////////////////////
    // --- BRUTAL TAB --- //
    ////////////////////////
    slash: {
        data: {
            name: "Kesik",
            description: "Hızlı bir kılıç darbesi.",
            menuDescription: "Temel saldırı. 25 Öfke harcar.<br>Hasar: <b style='color:orange'>1.2 x STR</b> + 10.",
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
	
	armor_break: {
        data: {
            name: "Zırh Kıran",
            description: "Savunmayı yok sayar.",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br>Hasar: <b style='color:orange'>0.8 x STR</b>.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.<br><span style='color:yellow'>Bekleme: 3 Tur</span>",
            rageCost: 30,
            levelReq: 2,
            icon: 'icon_armor_break.png',
            type: 'attack',
            category: 'brutal', // Brutal'da
            tier: 2
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', name: 'Soğuma', blockedSkill: 'armor_break', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'ignore_def', name: 'Zırh Kırıldı', turns: 2, waitForCombat: false, resetOnCombatEnd: true });

            const stats = getHeroEffectiveStats();
            const strBonus = Math.floor(stats.str * 0.8);
            const damage = 5 + strBonus;

            const animFrames = ['barbarian_attack3.png']; 
            const fullPathFrames = animFrames.map(f => `images/${f}`);
            
            animateCustomAttack(damage, fullPathFrames, this.data.name);
            writeLog(`🔨 **${this.data.name}**: Zırh parçalandı!`);
        }
    },
	// --- CHAOS TAB ---
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
	// --- FERVOR TAB ---
    battle_cry: {
        data: {
            name: "Savaş Çığlığı",
            description: "Gücünü topla!",
            menuDescription: "Motive ol. 20 Öfke harcar.<br><span style='color:#43FF64'>3 Tur: %40 STR Artışı</span>.<br><span style='color:yellow'>Bekleme: 4 Tur</span>",
            rageCost: 20,
            levelReq: 2,
            icon: 'icon_battle_cry.png',
            type: 'buff',
            category: 'fervor', // Fervor'da
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