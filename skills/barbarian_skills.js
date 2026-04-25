// barbarian_skills.js - Elemental & Physical Scaling Entegre Edilmiş Güncel Sürüm

const BARBARIAN_SKILLS = {

    // ======================================================
    // TAB: BRUTAL (VAHŞET)
    // ======================================================

	Pommel_Bash: { 
        data: {
            name: "Kabzayla Vur",
            menuDescription: "Str'nin %100'ü kadar hasar. +18 Rage üretir.",
            rageCost: 0,
            levelReq: 1,
			exhaustion: 2,
			cooldown: 0,
            icon: 'skills/barbarian/brutal/brutal_pommel_bash.webp',
            type: 'attack',
            category: 'brutal',
            tier: 1,
            // YENİ SİSTEM: Physical ve Elemental ayrımı
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            // SkillEngine artık {total, phys, elem} paketi döner
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'Pommel_Bash';
            
			const stats = getHeroEffectiveStats(); 
            showFloatingText(document.getElementById('hero-display'), "+12 Rage", 'heal');
            
            // Animasyona artık sayı değil, paket gönderiyoruz
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },
	
    slash: {
        data: {
            name: "Kesik",
            menuDescription: "Saldırı gücü + %25 Str bonusu. 20 Öfke harcar.",
            rageCost: 20,
            levelReq: 1,
			exhaustion: 3,
			cooldown: 0,
            icon: 'skills/barbarian/brutal/brutal_slash.webp',
            type: 'attack',
            category: 'brutal', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.25 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'slash';
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'slash', turns: 1, maxTurns: 1, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },
    

    bash: {
        data: {
            name: "Balyoz",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 0.4 x STR</b>.<br><span style='color:cyan'>%30 Şansla Sersemletir (1 Tur).</span>",
            rageCost: 30,
            levelReq: 3,
			exhaustion: 3,
			cooldown: 2,
            icon: 'skills/barbarian/brutal/brutal_bash.webp',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 0.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'bash';
            if (Math.random() < 0.30) hero.statusEffects.push({ id: 'monster_stunned', name: 'Düşman Sersem', turns: 1, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'bash', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
        }
    },

    pierce_through: {
        data: {
            name: "Delip Geç",
            menuDescription: "Hasar: <b style='color:orange'>1.25 x ATK + 0.4 x STR</b>.<br><span style='color:cyan'>Düşman Defansının %50'sini yok sayar.</span>",
            rageCost: 30,
            levelReq: 3,
			exhaustion: 5,
			cooldown: 1,
            icon: 'skills/barbarian/brutal/brutal_pierce_through.webp',
            type: 'attack',
            category: 'brutal',
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.25, stat: "str", statMult: 0.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            // "Defansın %50'sini Yok Sayar" özel bir durumdur, dmgPack hesaplandıktan sonra müdahale edelim
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'pierce_through';
            
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
            levelReq: 6,
			exhaustion: 5,
			cooldown: 2,
            icon: 'skills/barbarian/brutal/brutal_daze.webp',
            type: 'attack',
            category: 'brutal',
            tier: 3,
            scaling: { 
                physical: { atkMult: 2.0, stat: "str", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
			const currentLang = window.gameSettings.lang || 'tr';
			const lang = window.LANGUAGES[currentLang];
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'daze';
            
            applyStatusEffect(defender,{ id: 'debuff_enemy_atk', name: lang.status.debuff_enemy_atk, value: 0.25, turns: 3, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'daze', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp'], this.data.name);
        }
    },

    armor_break: {
        data: {
            name: "Zırh Kıran",
            menuDescription: "Zırhı parçalar. 30 Öfke harcar.<br><span style='color:cyan'>2 Tur: Düşman Defansı 0</span>.",
            rageCost: 30,
            levelReq: 10,
			exhaustion: 4,
			cooldown: 2,
            icon: 'skills/barbarian/brutal/brutal_armor_break.webp',
            type: 'attack',
            category: 'brutal', 
            tier: 4,
            scaling: { 
                physical: { atkMult: 1.0, stat: "str", statMult: 1.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'armor_break', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            applyStatusEffect(defender,{ id: 'ignore_def', name: 'Zırh Kırıldı', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            
            // ignore_def aktif olduğu için SkillEngine targetDef'i 0 görecektir
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'armor_break';
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack2.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
        }
    },

    fury: {
        data: {
            name: "Hiddet",
            menuDescription: "50 Öfke harcar.<br><span style='color:#43FF64'>4 Tur: Hasarın %25'i kadar Rage kazan.</span>",
            rageCost: 50,
            levelReq: 10,
			exhaustion: 4,
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
	rend: {
        data: {
            name: "Yar",
            menuDescription: "Hasar: <b style='color:orange'>1.5xSTR</b>.<br><span style='color:#ff4d4d'>Vurulan toplam hasarın %50'si kadar 2 tur kanama verir.</span><br><span style='color:cyan'>-40 Öfke.</span>",
            rageCost: 40,
            levelReq: 12, // Tier 5 olduğu için level gereksinimi artırıldı
            cooldown: 3,
			exhaustion: 8,
            icon: 'skills/barbarian/brutal/brutal_rend.webp',
            type: 'attack',
            category: 'brutal',
            tier: 5,
            // 1.5 x STR Fiziksel Hasar
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.5 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender, dmgPack) {
            // 1. Ana darbeyi vur (Animasyon başlar - yaklaşık 450-600ms sürer)
            animateCustomAttack(dmgPack, null, this.data.name);

            // 2. Kanama değerini hesapla
            const bleedAmount = Math.floor(dmgPack.total * 0.5);

            // 3. GECİKMELİ ETKİ: Vuruş bittikten kısa bir süre sonra kanamayı başlat
            setTimeout(() => {
                if (bleedAmount > 0 && defender.hp > 0) { // Düşman ölmediyse uygula
                    
                    // Görsel bir uyarı: Düşmanın üzerinde "YARALANDI!" yazısı fırlasın
                    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
                    showFloatingText(document.getElementById('monster-display'), lang.enemy_effects.vicious, 'damage');
                    
                    // Kanama etkisini uygula
                    applyStatusEffect(defender, { 
                        id: 'bleed', 
                        value: bleedAmount, 
                        turns: 2, 
                        resetOnCombatEnd: true 
                    });

                    // Canavarın sarsılma efektini tekrar tetikle (acı çekme efekti)
                    monsterDisplayImg.style.filter = 'brightness(1.5) saturate(2) drop-shadow(0 0 10px red)';
                    setTimeout(() => { monsterDisplayImg.style.filter = 'none'; }, 300);
                }
            }, 800); // 800ms gecikme: Animasyon biter, karakter duruşuna geçer ve KANAMA başlar.
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
			exhaustion: -4,
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
            menuDescription: "Hasar: <b style='color:orange'>1.5xATK</b>.<br><span style='color:#ff4d4d'>2 Tur: Defansın 0 olur.</span>",
            rageCost: 20,
            levelReq: 1,
			exhaustion: 3,
			cooldown: 1,
            icon: 'skills/barbarian/chaos/chaos_reckless_strike.webp',
            type: 'attack',
            category: 'chaos',
            tier: 1,
            scaling: { 
                physical: { atkMult: 1.5, stat: "str", statMult: 0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            
            // 1. Defansı 0 yapma etkisi (Mevcut)
            applyStatusEffect(hero, { id: 'defense_zero', name: 'Savunmasız', turns: 2, waitForCombat: false, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'reckless_strike', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
            
            // 2. Hasar Paketini hesapla
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'reckless_strike';
            
            // 3. Ana saldırı animasyonunu başlat
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack2.webp', 'images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);

            // --- YENİ: %50 İHTİMALLE KENDİNE HASAR VERME (RECOIL) ---
            if (Math.random() < 0.50) {
                const selfBleedVal = Math.floor(dmgPack.total * 0.50);
                
                // Vuruş bittikten sonra (800ms) etkiyi göster
                setTimeout(() => {
                    if (selfBleedVal > 0 && hero.hp > 0) {
                        // Ekranda "KANAMA!" yazısını fırlat
                        showFloatingText(document.getElementById('hero-display'), lang.enemy_effects.vicious, 'damage');
                        
                        // Kendine Bleed etkisini uygula
                        applyStatusEffect(hero, { 
                            id: 'bleed', 
                            value: selfBleedVal, 
                            turns: 2, 
                            resetOnCombatEnd: true 
                        });
                        writeLog(`🩸 **Pervasızlık**: Hamlen geri tepti! Kendine ${selfBleedVal} kanama hasarı verdin.`);
                    }
                }, 800);
            }
            // -----------------------------------------------------
        }
    },
	
	// --- CHAOS TIER 2 ---
    fiery_blade: {
        data: {
            name: "Alevli Kılıç",
            menuDescription: "3 Tur boyunca tüm saldırıların %50 daha fazla vurur (Ateş Hasarı).",
            rageCost: 30, 
            levelReq: 1, 
			exhaustion: 4,
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
			exhaustion: 5,
			cooldown: 0,
            icon: 'skills/barbarian/chaos/chaos_hell_blade.webp',
            type: 'attack',
            category: 'chaos', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.0, stat: "int", statMult: 0 },
                elemental: { fire: {stat: "int", statMult: 1.3 }, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender) {
            const hpCost = Math.floor(hero.hp * 0.10);
            hero.hp = Math.max(1, hero.hp - hpCost);
            showFloatingText(document.getElementById('hero-display'), `-${hpCost}`, 'damage');
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'hell_blade';
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_hellblade_strike1.webp', 'images/heroes/barbarian/barbarian_hellblade_strike2.webp', 'images/heroes/barbarian/barbarian_hellblade_strike3.webp'], this.data.name);
        }
    },
	
	blood_shield: {
        data: {
            name: "Kan Kalkanı",
            menuDescription: "Mevcut Canın %10'unu feda et. Feda edilen miktarın <b style='color:orange'>1.5 katı</b> kadar Blok kazan. 15 Öfke.",
            rageCost: 0,
            levelReq: 5,
			exhaustion: -2,
            cooldown: 4,
            icon: 'skills/barbarian/chaos/chaos_blood_shield.webp',
            type: 'defense',
            category: 'chaos',
            tier: 2
        },
        onCast: function() {
			// --- YENİ: 1 HP VARKEN BASILAMAZ KONTROLÜ ---
            if (hero.hp <= 1) {
                const currentLang = window.gameSettings.lang || 'tr';
                const msg = currentLang === 'tr' ? "Feda edecek canın kalmadı!" : "No HP left to sacrifice!";
                writeLog(`❌ **${this.data.name}**: ${msg}`);
                
                // Kaynakları ve Turu İade Et (Çünkü combat_manager bunları çoktan harcadı)
                hero.rage += this.data.rageCost;
                window.isHeroTurn = true;
                toggleSkillButtons(false);
                updateStats();
                return; // Fonksiyondan çık, hiçbir etki uygulama
            }
            // --------------------------------------------
			
            // --- Mevcut can (hero.hp) üzerinden hesapla ---
            const currentHp = hero.hp;
            const hpLoss = Math.ceil(currentHp * 0.20);
            
            // Feda edilen canın 1.5 katı blok (Tam sayı)
            const blockAmount = Math.floor(hpLoss * 1.5);

            // Canı düş (Karakteri öldürmemesi için en az 1 HP bırakır)
            hero.hp = Math.max(1, hero.hp - hpLoss);
            
            // Blok ekle
            if (typeof addHeroBlock === 'function') {
                addHeroBlock(blockAmount);
            }

            // Cooldown ve UI
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'blood_shield', turns: 5, maxTurns: 5, resetOnCombatEnd: true });
            
            showFloatingText(document.getElementById('hero-display'), hpLoss, 'damage');
            writeLog(`🩸 **${this.data.name}**: ${hpLoss} Can feda edilerek ${blockAmount} Blok kazanıldı.`);
            updateStats();

            setTimeout(nextTurn, 1000);
        }
    },

	// --- CHAOS TIER 3 ---
    double_blade: {
        data: {
            name: "İki Uçlu Balta",
            menuDescription: "Kendini umursamadan düşmana saldır. Düşmana verdiğin hasarın %25'i kadar HP kaybedersin. 15 Öfke.",
            rageCost: 15, 
            levelReq: 3, 
			exhaustion: 4,
            cooldown: 4, 
            icon: 'skills/barbarian/chaos/chaos_double_blade.webp',
            type: 'attack', 
            category: 'chaos', 
            tier: 3,
            // YENİ: Yüksek hasar çarpanı (2.0x Atak + 0.5x Str)
            scaling: { 
                physical: { atkMult: 2.0, stat: "str", statMult: 0.5 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }			
        },
        onCast: function(attacker, defender, dmgPack) {
            // 1. Düşmana hasarı vur (Animasyonu başlat)
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);

            // 2. Geri Tepme (Recoil) Hesabı: Düşmana giden toplam hasarın %25'i
            const recoilDamage = Math.floor(dmgPack.total * 0.25);

            // 3. Kahramana hasar verme işlemi (Vuruş anına denk gelmesi için kısa bir gecikme ile)
            setTimeout(() => {
                if (recoilDamage > 0) {
                    hero.hp = Math.max(0, hero.hp - recoilDamage);
                    showFloatingText(document.getElementById('hero-display'), recoilDamage, 'damage');
                    writeLog(`🩸 **${this.data.name}**: Kendine ${recoilDamage} hasar verdin!`);
                    updateStats();
                    
                    // Kahraman recoil yüzünden ölürse savaşı bitir
                    if (hero.hp <= 0) {
                        checkGameOver();
                    }
                }
            }, 300); // 300ms vuruş karesine denk gelir
        }
    },
	
	hell_fire: {
        data: {
            name: "Cehennem Ateşi",
            menuDescription: "Hasar: <b style='color:orange'>3.0xINT (Ateş)</b>.<br><span style='color:#ff9800'>Vurulan hasarın %50'si kadar hem sana hem düşmana 2 tur yanma hasarı verir.</span><br><span style='color:cyan'>-30 Öfke.</span>",
            rageCost: 30,
            levelReq: 8,
			exhaustion: 7,
            cooldown: 4,
            icon: 'skills/barbarian/chaos/chaos_hell_fire.webp',
            type: 'attack',
            category: 'chaos',
            tier: 3,
            // 3.0 x INT Ateş Hasarı
            scaling: { 
                physical: { atkMult: 0, stat: "int", statMult: 0 },
                elemental: { fire: { stat: "int", statMult: 3.0 }, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender, dmgPack) {
            // 1. Ana patlamayı vur
            animateCustomAttack(dmgPack, null, this.data.name);

            // 2. Yanma (Fire DoT) değerini hesapla (Vurulan toplam hasarın %50'si)
            const burnAmount = Math.floor(dmgPack.total * 0.5);

            // 3. GECİKMELİ ÇİFT TARAFLI ETKİ
            setTimeout(() => {
                if (burnAmount > 0) {
                    // DÜŞMANA UYGULA
                    applyStatusEffect(defender, { 
                        id: 'fire', 
                        value: burnAmount, 
                        turns: 2, 
                        resetOnCombatEnd: true 
                    });

                    // KENDİNE UYGULA (Chaos bedeli)
                    applyStatusEffect(hero, { 
                        id: 'fire', 
                        value: burnAmount, 
                        turns: 2, 
                        resetOnCombatEnd: true 
                    });

                    showFloatingText(document.getElementById('monster-display'), "ALEVLER!", 'damage');
                    showFloatingText(document.getElementById('hero-display'), "TUTUŞTUN!", 'damage');
                    writeLog(`🔥 **${this.data.name}**: Her yer alevler içinde! Çift taraflı yanma başladı.`);
                }
            }, 600);

            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'hell_fire', turns: 5, maxTurns: 5, resetOnCombatEnd: true });
        }
    },
	
    Cauterize: {
		//Lose 10% HP, gain 5%HP+?xInt per turn
        data: {
            name: "Yenilenme",
            menuDescription: "Güçlü iyileşme. 50 Öfke harcar.<br><span style='color:#43FF64'>30 HP + (10 HP x 3 Tur)</span>.",
            rageCost: 50,
            levelReq: 3,
			exhaustion: 10,
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
	
	//--- CHAOS TIER 4 ---
	
	blood_lust: {
        data: {
            name: "Kan Susuzluğu",
            menuDescription: "Hasar: <b style='color:orange'>3.0 x INT</b>.<br><span style='color:#43FF64'>Vurulan hasarın %50'sini anında, %25'ini 2 tur boyunca iyileşme olarak alırsın.</span><br><span style='color:#ff4d4d'>Bedel: 2 tur boyunca giderek artan ATK/DEF kaybı (%20 -> %40).</span><br><span style='color:cyan'>-30 Öfke.</span>",
            rageCost: 30,
            levelReq: 12,
			exhaustion: 12,
            cooldown: 5,
            icon: 'skills/barbarian/chaos/chaos_blood_lust.webp',
            type: 'attack',
            category: 'chaos',
            tier: 4,
            scaling: { 
                physical: { atkMult: 0, stat: "int", statMult: 3.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }			
        },
        onCast: function(attacker, defender, dmgPack) {
            const stats = getHeroEffectiveStats();

            // 1. Ana darbeyi vur
            animateCustomAttack(dmgPack, null, this.data.name);

            // 2. Anlık İyileşme (%50)
            const instantHeal = Math.floor(dmgPack.total * 0.50);
            setTimeout(() => {
                if (instantHeal > 0) {
                    hero.hp = Math.min(stats.maxHp, hero.hp + instantHeal);
                    showFloatingText(document.getElementById('hero-display'), instantHeal, 'heal');
                    writeLog(`🩸 **${this.data.name}**: ${instantHeal} yaşam enerjisi emildi.`);
                    updateStats();
                }
            }, 600);

            // 3. Periyodik İyileşme (%25 x 2 Tur)
            const tickHeal = Math.floor(dmgPack.total * 0.25);
            applyStatusEffect(hero, { 
                id: 'regen', 
                name: "Kan Emme", 
                value: tickHeal, 
                turns: 2, 
                resetOnCombatEnd: true 
            });

            // 4. GİDEREK ARTAN DEBUFF BEDELİ
            applyStatusEffect(hero, { 
                id: 'blood_lust_debuff', 
                name: "Tükenmişlik", 
                turns: 3, // Bu tur + 2 tur
                resetOnCombatEnd: true 
            });

            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'blood_lust', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
        }
    },
	
	blood_mark: {
        data: {
            name: "Kan Damgası",
            rageCost: 30,
            levelReq: 12,
			exhaustion: 15,
            cooldown: 0, // Oda başı bir kez açılır
            icon: 'skills/barbarian/chaos/chaos_blood_mark.webp',
            type: 'utility',
            category: 'chaos',
            tier: 4
        },
        onCast: function() {
            // Sezonluk çalınan canı sıfırla
            hero.sessionLifeStolen = 0;
            
            // Etkiyi uygula (value: 0.10 = %10 can çalma)
            applyStatusEffect(hero, { 
                id: 'blood_mark_active', 
                name: "Kan Damgası", 
                value: 0.20, 
                turns: 99, // Oda bitene kadar sürer
                resetOnCombatEnd: true 
            });

            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'blood_mark', turns: 99, hideNumber: true, resetOnCombatEnd: true });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "LANETLENDİ!", 'damage');
            writeLog(`🩸 **${this.data.name}**: Tüm dirençlerini feda ederek kan sömürmeye başladın!`);
            
            setTimeout(nextTurn, 1000);
        }
    },
	
	//--- CHAOS TIER 5 --- 
	blood_terror: {
        data: {
            name: "Kan Dehşeti",
            menuDescription: "Tüm yaşam enerjini tek bir darbede topla. Canını <b style='color:#ff4d4d'>1</b>'e indir ve kaybettiğin can kadar hasar vur. 0 Öfke.",
            rageCost: 0,
            levelReq: 15, // Tier 5 gereksinimi
			exhaustion: 50,
            cooldown: 8,  // Çok güçlü olduğu için yüksek cooldown
            icon: 'skills/barbarian/chaos/chaos_blood_terror.webp',
            type: 'attack',
            category: 'chaos',
            tier: 5,
            // Bu skill statlardan değil, o anki can kaybından beslendiği için scaling'i 0 tutuyoruz
            scaling: { 
                physical: { atkMult: 0, stat: "str", statMult: 0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }			
        },
        onCast: function(attacker, defender) {
            // 1. Kaybedilecek canı hesapla
            const currentHp = hero.hp;
            const hpSacrificed = currentHp - 1;

            if (hpSacrificed <= 0) {
                writeLog("❌ **Kan Dehşeti**: Feda edilecek yeterli canın yok!");
                setTimeout(nextTurn, 500);
                return;
            }

            // 2. Kahramanın canını 1'e indir
            hero.hp = 1;
            showFloatingText(document.getElementById('hero-display'), hpSacrificed, 'damage');

            // 3. Özel Hasar Paketi Oluştur (Feda edilen can kadar)
            // Bu hasar zırhtan etkilenmemesi için 'elem' kısmına koyup targetResists'i bypass edebiliriz
            // ya da direkt total hasar olarak paketleyebiliriz.
            const dmgPack = {
                total: hpSacrificed,
                phys: hpSacrificed,
                elem: 0
            };
			dmgPack.skillKey = 'blood_terror';
			
            // 4. Görsel Efekt: Karakteri kıpkırmızı parlat
            heroDisplayImg.style.filter = 'brightness(2) saturate(5) hue-rotate(-50deg) drop-shadow(0 0 20px red)';
            setTimeout(() => { heroDisplayImg.style.filter = 'none'; }, 600);

            // 5. Saldırıyı gerçekleştir
            animateCustomAttack(dmgPack, ['images/heroes/barbarian/barbarian_attack3.webp'], this.data.name);
            
            writeLog(`💀 **${this.data.name}**: ${hpSacrificed} Can feda ederek dehşet saçtın!`);
            updateStats();
            
            // Cooldown ekle
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'blood_terror', turns: 9, maxTurns: 9, resetOnCombatEnd: true });
        }
    },
	
	// Hellfire (Deal ?xInt dmg to both the Enemy and the Player)
	// Ulti 1 (Lose all HP, deal as much Dmg) 
	// Path_of_Pain (Cost: All Rage - Deal ?xInt based damage, gain HP equal to Rage Spent)

    // ======================================================
    // TAB: FERVOR (COŞKU)
    // ======================================================
    
	// Tier 1 
    wind_up: {
    	data: {
        name: "Kurulma",
        menuDescription: "Sonraki saldırın <b style='color:orange'>+1 x STR</b> fazla vurur. +15 Rage kazandırır.",
        rageCost: 0,
        levelReq: 1,
		exhaustion: 2,
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

	spirit_shield: {
        data: {
            name: "Ruh Kalkanı",
            rageCost: 15,
            levelReq: 1,
            cooldown: 2,
			exhaustion: 3,
            icon: 'skills/barbarian/fervor/fervor_spirit_shield.webp',
            type: 'attack',
            category: 'fervor',
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.5, stat: "mp_pow", statMult: 2.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender, dmgPack) {
            // Darbeyi vur
            animateCustomAttack(dmgPack, null, this.data.name);

            // Ruh Kalkanı etkisini uygula (onHitRageGain'i geçici olarak artıran bir buff)
            applyStatusEffect(hero, { 
                id: 'spirit_shield_active', 
                name: "Ruh Kalkanı", 
                value: 10, // Her darbede +10 kaynak
                turns: 3, 
                resetOnCombatEnd: true 
            });

            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'spirit_shield', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
        }
    },
	// Tier 2
    light_blade: {
        data: {
            name: "Işığın Kılıcı",
            menuDescription: "Cesur saldırı. 35 Öfke.<br>Hasar: <b style='color:orange'>ATK + 1.5 x MP</b>.",
            rageCost: 35,
            levelReq: 2,
			exhaustion: 3,
			cooldown: 0,
            icon: 'skills/barbarian/fervor/fervor_light_blade.webp',
            type: 'attack',
            category: 'fervor', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.0, stat: "mp_pow", statMult: 0 },
                elemental: { fire: 0, cold: 0, lightning: {stat: "mp_pow", statMult: 1.0}, poison: 0, curse: 0 }
            }
        },
		onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
			dmgPack.skillKey = 'light_blade';
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
			exhaustion: 3,
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
	
	scales_of_fate: {
        data: {
            name: "Kader Terazisi",
            rageCost: 20,
            levelReq: 4,
			exhaustion: 4,
            cooldown: 4,
            icon: 'skills/barbarian/fervor/fervor_scales.webp',
            type: 'attack',
            category: 'fervor',
            tier: 2,
            scaling: { 
                physical: { atkMult: 1.2, stat: "mp_pow", statMult: 0.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
        },
        onCast: function(attacker, defender, dmgPack) {
            const stats = getHeroEffectiveStats();
            const heroPct = (hero.hp / stats.maxHp);
            const monsterPct = (defender.hp / defender.maxHp);
            
            // Yüzdesel farkı bul (Örn: %20 fark -> 0.20)
            const diff = Math.abs(heroPct - monsterPct);

            if (monsterPct > heroPct) {
                // DURUM 1: Düşman daha sağlıklı -> EKSTRA HASAR
                const bonusDmg = Math.floor(defender.maxHp * diff * 0.5); // Farkın yarısı kadar bonus hasar
                dmgPack.total += bonusDmg;
                dmgPack.phys += bonusDmg;
                writeLog(`⚖️ **${this.data.name}**: Terazi dengeleniyor! +${bonusDmg} ekstra hasar.`);
            } else {
                // DURUM 2: Kahraman daha sağlıklı -> BLOK KAZAN
                const bonusBlock = Math.floor(stats.maxHp * diff * 0.5);
                addHeroBlock(bonusBlock);
                writeLog(`⚖️ **${this.data.name}**: Kader senden yana! +${bonusBlock} Blok kazandın.`);
            }

            animateCustomAttack(dmgPack, null, this.data.name);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'scales_of_fate', turns: 5, maxTurns: 5, resetOnCombatEnd: true });
        }
    },
	
	//Tier 3
	sacred_will: {
        data: {
            name: "Kutsal İrade",
            menuDescription: "Zihnini arındırır. 2 tur boyunca TÜM debuff ve DoT etkilerine bağışıklık kazandırır. 20 Öfke.",
            rageCost: 20,
            levelReq: 4,
			exhaustion: 6,
            cooldown: 5,
            icon: 'skills/barbarian/fervor/fervor_sacred_will.webp',
            type: 'buff',
            category: 'fervor',
            tier: 3
        },
        onCast: function() {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            applyStatusEffect(hero, { 
                id: 'immunity_active', 
                name: lang.status.immunity_active || "Bağışıklık", 
                turns: 3, // Bu tur + 2 tam tur
                resetOnCombatEnd: true 
            });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'sacred_will', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "ARINDI!", 'heal');
            writeLog(`✨ **${this.data.name}**: 2 tur boyunca debuff almayacaksın.`);
            setTimeout(nextTurn, 1000);
        }
    },
	//Light_Up 1.5Atk+1.5MP Dmg (light or fire), Reduce enemy def for 2 turns,
    Healing_Light: {
    data: {
        name: "İyileştiren Işık",
        rageCost: 50,
        levelReq: 3,
		exhaustion: -6,
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
	provoke: {
        data: {
            name: "Kışkırtma",
            rageCost: 20,
            levelReq: 8,
			exhaustion: 6,
            cooldown: 5,
            icon: 'skills/barbarian/fervor/fervor_provoke.webp',
            type: 'utility',
            category: 'fervor',
            tier: 3
        },
        onCast: function() {
            const stats = getHeroEffectiveStats();
            const currentLang = window.gameSettings.lang || 'tr';
            const lang = window.LANGUAGES[currentLang];

            if (window.monster) {
                // 1. DÜŞMANI KIŞKIRT (Niyeti Saldırıya Çevir)
                const forcedAction = Math.random() < 0.5 ? 'attack1' : 'attack2';
                window.monsterNextAction = forcedAction;
                showMonsterIntention(forcedAction);
                
                // 2. NİŞ ÖZELLİK: ÖFKE TRANSFERİ (Düşmana Atak Buffı)
                // Düşmanın mevcut defansının %25'ini atak bonusu olarak ona veriyoruz
                // Not: def_up etkileri varsa getHeroEffectiveStats benzeri bir monster kontrolü gerekebilir 
                // ama şimdilik monster.defense (baz + aktif bufflar) üzerinden gidelim.
                const currentMonsterDef = monster.defense || 0;
                const bonusAtk = Math.floor(currentMonsterDef * 0.25);

                if (bonusAtk > 0) {
                    applyStatusEffect(monster, { 
                        id: 'atk_up', 
                        name: "Kışkırtılmış", 
                        value: bonusAtk, 
                        turns: 2, // Bu tur ve saldıracağı tur
                        resetOnCombatEnd: true 
                    });
                    showFloatingText(document.getElementById('monster-display'), `+${bonusAtk} ATAK`, 'damage');
                }
                
                writeLog(`🗣️ **${this.data.name}**: ${monster.name} zırhına güvenerek öfkelendi! (+${bonusAtk} Atak)`);
            }

            // 3. REGEN (İyileşme): INT değerinin %100'ü kadar 2 tur yenilenme
            const regenVal = Math.floor(stats.int * 1.0);
            applyStatusEffect(hero, { 
                id: 'regen', 
                name: "Kışkırtma Şifası", 
                value: regenVal, 
                turns: 3, 
                resetOnCombatEnd: true 
            });

            // 4. COOLDOWN VE HIZLI AKSİYON
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'provoke', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            
            showFloatingText(document.getElementById('hero-display'), "MEYDAN OKUDU!", 'heal');
            updateStats();

            // Hızlı Aksiyon: Turu bitirmez
            setTimeout(() => { 
                window.isHeroTurn = true; 
                toggleSkillButtons(false); 
            }, 300);
        }
    },

	//Tier 4
	celestial_judgement: {
        data: {
            name: "Göklerin Hükmü",
            menuDescription: "Hasar: <b style='color:orange'>2.0 x MP (Yıldırım)</b>.<br><span style='color:#43FF64'>Savaş alanındaki her aktif Buff ve Debuff başına hasarı %20 artar.</span><br><span style='color:cyan'>-30 Öfke.</span>",
            rageCost: 30,
            levelReq: 10,
			exhaustion: 8,
            cooldown: 5,
            icon: 'skills/barbarian/fervor/fervor_celestial_judgement.webp',
            type: 'attack',
            category: 'fervor',
            tier: 4,
            scaling: { 
                physical: { atkMult: 0, stat: "mp_pow", statMult: 0 },
                elemental: { lightning: { stat: "mp_pow", statMult: 2.0 }, fire: 0, cold: 0, poison: 0, curse: 0 }
            }			
        },
        onCast: function(attacker, defender, dmgPack) {
            // --- NİŞ ÖZELLİK: ETKİ SAYICI (PROFESYONEL FİLTRE) ---
            
            // 1. Kahramanın üzerindeki GERÇEK BUFFLARI say
            // İstisnalar: Bekleme süreleri (block_skill) ve Kilitler (block_type) sayılamaz.
            const heroBuffs = hero.statusEffects.filter(e => 
                !e.id.includes('debuff') && 
                e.id !== 'block_skill' && 
                e.id !== 'block_type' && 
                !e.waitForCombat
            ).length;
            
            // 2. Düşmanın üzerindeki GERÇEK DEBUFFLARI say
            // İstisnalar: Canavarın kendi bekleme süreleri veya teknik kilitleri sayılamaz.
            const monsterDebuffs = defender.statusEffects.filter(e => 
                (e.id.includes('debuff') || e.id === 'poison' || e.id === 'bleed' || e.id === 'fire' || e.id === 'curse' || e.id === 'stun') && 
                e.id !== 'block_skill' && 
                e.id !== 'block_type' && 
                !e.waitForCombat
            ).length;

            const totalEffects = heroBuffs + monsterDebuffs;
            
            // Senin istediğin %20 çarpanı (Her etki için 0.20)
            const multiplier = 1 + (totalEffects * 0.20); 

            // Hasar paketini güncellenen çarpanla çarp
            dmgPack.total = Math.floor(dmgPack.total * multiplier);
            dmgPack.elem = Math.floor(dmgPack.elem * multiplier);

            // 3. Saldırıyı gerçekleştir
            animateCustomAttack(dmgPack, null, this.data.name);
            
            if (totalEffects > 0) {
                writeLog(`⚡ **${this.data.name}**: ${totalEffects} kutsal/lanetli bağ sayesinde hasar %${totalEffects * 20} arttı!`);
                showFloatingText(document.getElementById('monster-display'), "HÜKÜM!", 'skill');
            }

            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'celestial_judgement', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
        }
    },
	
	// --- Tier 5 ---
	spiritual_apocalypse: {
        data: {
            name: "Ruhani Kıyamet",
            rageCost: 40,
            levelReq: 20,
			exhaustion: 20,
            cooldown: 8,
            icon: 'skills/barbarian/fervor/fervor_apocalypse.webp',
            type: 'attack',
            category: 'fervor',
            tier: 5,
            scaling: { 
                physical: { atkMult: 0, stat: "mp_pow", statMult: 0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: { stat: "mp_pow", statMult: 3.5 } }
            }			
        },
        onCast: function(attacker, defender, dmgPack) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            
            // 1. Üzerindeki aktif buffları say (Bekleme süreleri ve kilitler hariç)
            const activeBuffs = hero.statusEffects.filter(e => 
                !e.id.includes('debuff') && 
                !['poison', 'bleed', 'fire', 'curse', 'stun'].includes(e.id) &&
                e.id !== 'block_skill' && e.id !== 'block_type' && !e.waitForCombat
            );

            const buffCount = activeBuffs.length;
            
            // 2. HASAR BONUSU: Her feda edilen buff başına %30 ekstra hasar
            const multiplier = 1 + (buffCount * 0.30);
            dmgPack.total = Math.floor(dmgPack.total * multiplier);
            dmgPack.elem = Math.floor(dmgPack.elem * multiplier);

            // 3. FEDA: Tüm buffları sil
            hero.statusEffects = hero.statusEffects.filter(e => 
                e.id.includes('debuff') || 
                ['poison', 'bleed', 'fire', 'curse', 'stun'].includes(e.id) ||
                e.id === 'block_skill' || e.id === 'block_type' || e.waitForCombat
            );

            // 4. LANET BIRAK: Feda edilen güç düşmana ağır bir DoT olarak döner
            if (buffCount > 0) {
                const curseVal = Math.floor(dmgPack.total * 0.25); // Toplam hasarın %25'i kadar DoT
                applyStatusEffect(defender, { 
                    id: 'curse', 
                    name: "Kıyamet Laneti", 
                    value: curseVal, 
                    turns: 4, 
                    resetOnCombatEnd: true 
                });
                writeLog(`💥 **${this.data.name}**: ${buffCount} Kutsallığı feda ettin! Hasar %${buffCount * 30} arttı.`);
            }

            // 5. Görsel Efekt: Ekranı mor bir parlama sarsın
            animateMonsterSkill(); // Mor parlama efektini burada hero için kullanalım
            animateCustomAttack(dmgPack, null, this.data.name);
            
            updateStats();
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'spiritual_apocalypse', turns: 9, maxTurns: 9, resetOnCombatEnd: true });
        }
    },

};



