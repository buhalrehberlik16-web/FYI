// --- START OF FILE magus_skills.js ---

const MAGUS_SKILLS = {
    /* fireball, ice_shard vb. */
	// TAB: Arcane 
	
	Magic_Arrow: {
		data: {
			name: "Magic Arrow",
            menuDescription: "Hasar: <b style='color:orange'>0.5xATK + 0.8xMP</b>.<br><span style='color:cyan'>-15 Mana.</span>",
            rageCost: 15,
            levelReq: 1,
			exhaustion: 1,
			cooldown: 0,
            icon: 'skills/magus/arcane/magic_arrow.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.5, stat: "mp_pow", statMult: 0.8 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
			dmgPack.skillKey = 'Magic_Arrow';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },
	Arcane_Echo: {
		data: {
			id: "Arcane_Echo",
			name: "Arcane Echo",
			rageCost: 15,
			levelReq: 1,
			exhaustion: 2,
			icon: 'skills/magus/arcane/arcane_echo.webp',
			type: 'attack',
			category: 'arcane',
			tier: 1,
			scaling: { 
				physical: { atkMult: 0, stat: "mp_pow", statMult: 0.6 }, // Sadece MP'den beslenen düşük hasar
				elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
			}
		},
		onCast: function(attacker, defender, dmgPack) {
        dmgPack.skillKey = 'Arcane_Echo';
        
        // 1. Önce normal hasarı vur (Bu hasar şu an 0 gözükecek, doğru)
        animateCustomAttack(dmgPack, null, this.data.name);

        // 2. KRİTİK DÜZELTME: Etkiyi vuruş bittikten sonra ekle
        // 800ms veya 1000ms animasyonun bitişi için ideal süredir
        setTimeout(() => {
            if (attacker.hp > 0) { // Karakter ölmediyse etkiyi ver

                const stats = getHeroEffectiveStats(); 
                
                const bonusVal = Math.floor(stats.mp_pow * 0.2) + Math.floor(stats.atk * 0.5); 
                applyStatusEffect(attacker, { 
                    id: 'wind_up',                    
                    value: bonusVal, 
                    turns: 2, 
                    resetOnCombatEnd: true 
                });
                 
            }
        }, 850); 
    }
	},
	
	Mana_Blast: {
		data: {
			name: "Mana Blast",
            menuDescription: "Hasar: <b style='color:orange'>1.4xMP (Fiziksel)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			exhaustion: 4,
			cooldown: 0,
            icon: 'skills/magus/arcane/arcane_mana_blast.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 1.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
			const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
			applyStatusEffect(defender, { 
                id: 'debuff_enemy_def', 
                name: lang.status.debuff_enemy_def, 
                value: 0.20, 
                turns: 3, 
                resetOnCombatEnd: true 
            });
			dmgPack.skillKey = 'Mana_Blast';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },
	Mana_Ward: {
		data: {
			id: "Mana_Ward",
			name: "Mana Ward",
			menuDescription: "Mistik bir bariyer kur.<br><span style='color:cyan'>Alacağın ilk darbe HP yerine Manadan (Rage) düşer.</span><br><span style='color:#ff4d4d'>Mana yetmezse, kalan hasar %50 artarak Canına vurur.</span>",
			rageCost: 20,
			levelReq: 5,
			exhaustion: 4,
			cooldown: 5,
			icon: 'skills/magus/arcane/mana_ward.webp',
			type: 'defense',
			category: 'arcane',
			tier: 2
		},
		onCast: function() {
			applyStatusEffect(hero, { 
				id: 'mana_ward_active',  
				turns: 99, // Darbe alana kadar bekler
				resetOnCombatEnd: true 
			});
			
			// Cooldown ekle
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Mana_Ward', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
			
			updateStats();
			window.logSkillEffect('Mana_Ward');
			setTimeout(nextTurn, 1000);
		}
	},
	Chain_Blast: {
		data: {
			id: "Chain_Blast", // ID, sayaç için kritik!
			name: "Chain Blast",
			menuDescription: "Hasar: <b style='color:orange'>1.4xMP</b>.<br><span style='color:#43FF64'>Her kullanımda kalıcı olarak +0.3xMP hasar kazanır (Fight boyu).</span>",
			rageCost: 25,
			levelReq: 5,
			exhaustion: 4,
			icon: 'skills/magus/arcane/chain_blast.webp',
			type: 'attack',
			category: 'arcane',
			tier: 2,
			statMultPerUse: 0.3, // İşte sihirli çarpan burada
			scaling: { 
				physical: { atkMult: 0, stat: "mp_pow", statMult: 1.4 },
				elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
			}
		},
		onCast: function(attacker, defender, dmgPack) {
			// SkillEngine artık statMultPerUse'u tanıdığı için otomatik hesaplar
			dmgPack.skillKey = 'Chain_Blast';
			animateCustomAttack(dmgPack, null, this.data.name);
			
			const lang = window.getCombatLang();
			const skillKey = this.data.id; // "Chain_Blast"
			
			const logTemplate = lang.skills[skillKey]?.log || `✨ **${lang.skills[skillKey]?.name}**`;
			
			const usage = (hero.skillUsage["Chain_Blast"] || 1) - 1; // Logda artmış halini değil, vurulan halini göster
			const currentMult = (1.4 + (usage * 0.3)).toFixed(1);
			
			
			writeLog(`${lang.skills.Chain_Blast.log} (${currentMult}x)`);
		}
	},

	Drain: {
		data: {
			name: "Drain",
            menuDescription: "Hasar: <b style='color:orange'>1.0xMP</b>.<br><span style='color:cyan'>Düşman zırhını yok sayar. Hasar kadar Mana kazanılır. -35 Mana.</span>",
            rageCost: 35,
            levelReq: 8,
			exhaustion: 8,
			cooldown: 3,
            icon: 'skills/magus/arcane/drain.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 3,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 1.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender) {
            // "Defansı aşarak" kuralı için geçici ignore_def ekleyip hesaplıyoruz
            hero.statusEffects.push({ id: 'ignore_def', turns: 1, waitForCombat: false });
            const dmgPack = SkillEngine.calculate(hero, this.data, defender);
            
            // Kazanılan hasar kadar Mana (Rage) ekle
            const stats = getHeroEffectiveStats();
            hero.rage = Math.min(stats.maxRage, hero.rage + dmgPack.total);
            showFloatingText(document.getElementById('hero-display'), `+${dmgPack.total} Mana`, 'heal');
            
			dmgPack.skillKey = 'Drain';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Arcane_Acuity: {
		data: {
		// bu skill x tur boyunca her tur exhaust düşürecek (belki 3-4?) şekilde değiştirilebilir. 
			name: "Arcane Acuity",
            menuDescription: "<b>(Hızlı Aksiyon)</b><br><span style='color:#43FF64'>4 Tur: Her tur +INT kadar Mana.</span><br><span style='color:cyan'>-20 Mana. Tur harcamaz.</span>",
            rageCost: 20,
            levelReq: 8,
			exhaustion: 10,
			cooldown: 5,
            icon: 'skills/magus/arcane/arcane_acuity.webp',
            type: 'utility',
            category: 'arcane', 
            tier: 3
		},
        // Quick Action: Tur harcamaz
        onCast: function() {
            const stats = getHeroEffectiveStats();
            applyStatusEffect(hero, { 
                id: 'rage_regen_buff', 
                value: stats.int, 
                turns: 5, 
                resetOnCombatEnd: true 
            });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Arcane_Acuity', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "ODAKLANDI!", 'heal');
			window.logSkillEffect('Arcane_Acuity');
            // Hızlı aksiyon olduğu için turu bitirme, kontrolü oyuncuya ver
            setTimeout(() => { window.isHeroTurn = true; toggleSkillButtons(false); }, 300);
        }
    },

	Arcane_Explosion: {
		data: {
			name: "Arcane Explosion",
            menuDescription: "Hasar: <b style='color:orange'>ATK + 2.0xMP (Fiziksel)</b>.<br><span style='color:cyan'>-75 Mana.</span>",
            rageCost: 75,
            levelReq: 15,
			exhaustion: 12,
			cooldown: 0,
            icon: 'skills/magus/arcane/arcane_explosion.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 2.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
			dmgPack.skillKey = 'Arcane_Explosion';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },
	
	// TAB: Elemental
	Fireball: {
        data: {
            id: "Fireball", // ID ekledik
            name: "Ateş Topu",
            type: 'attack',
            category: 'elemental', // Tabın görünmesini sağlayan anahtar
            tier: 3,
            rageCost: 25,
			exhaustion: 4,
			cooldown: 2,
            icon: 'skills/magus/elemental/fireball.webp', // İkon yolu
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.2 },
                elemental: { fire: { stat: "mp_pow", statMult: 0.6 } }
            },
            dotEffect: {
                type: 'fire',
                duration: 3,
                scaling: {
                    elemental: { 
                        fire: { stat: "mp_pow", statMult: 0.8 },
                    }
                }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, null, this.data.name);

            // GECİKMELİ DoT UYGULAMASI
            setTimeout(() => {
                if (window.monster && monster.hp > 0) {
                    // DİKKAT: this.data gönderiyoruz
                    window.applySkillDoT(attacker, defender, this.data);
                }
            }, 600);
        }
    },
	
	Fire_Bolt: {
		data: {
			name: "Fire Bolt",
            menuDescription: "Hasar: <b style='color:orange'>0.5Atk+0.5xSTR (Fiz) + 0.5xMP (Ateş)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 1,
			exhaustion: 2,
			cooldown: 0,
            icon: 'skills/magus/elemental/fire_bolt.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.5, stat: "str", statMult: 0.7 },
                elemental: { 
                    fire: { stat: "mp_pow", statMult: 0.4 }, 
                    cold: 0, lightning: 0, poison: 0, curse: 0 
                }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
			dmgPack.skillKey = 'Fire_Bolt';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Zap: {
		data: {
			name: "Zap",
            menuDescription: "Hasar: <b style='color:orange'>1.1xINT (Yıldırım)</b>.<br><span style='color:#b19cd9'>3 Tur: Düşman ATK %20 azalır.</span><br><span style='color:cyan'>-25 Mana.</span>",
            rageCost: 25,
            levelReq: 1,
			exhaustion: 3,
			cooldown: 1,
            icon: 'skills/magus/elemental/zap.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.0, stat: "int", statMult: 0.0 },
                elemental: { 
                    fire: 0, cold: 0, 
                    lightning: { stat: "int", statMult: 1.1 }, 
                    poison: 0, curse: 0 
                }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            applyStatusEffect(defender, { 
                id: 'debuff_enemy_atk', 
                name: lang.status.debuff_enemy_atk, 
                value: 0.20, 
                turns: 3, 
                resetOnCombatEnd: true 
            });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Zap', turns: 2, maxTurns: 2, resetOnCombatEnd: true });
			dmgPack.skillKey = 'Zap';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },
	
	Iceball: {
        data: {
            id: "Iceball", // ID ekledik
            name: "Buz Topu",
            type: 'attack',
            category: 'elemental', // Tabın görünmesini sağlayan anahtar
            tier: 1,
			exhaustion: 3,
			cooldown: 2,
            rageCost: 15,
            icon: 'skills/magus/elemental/iceball.webp', // İkon yolu
            scaling: { 
                physical: { atkMult: 0.5, stat: "str", statMult: 0.5 },
                elemental: { cold: { stat: "mp_pow", statMult: 0.4 } }
            },
            dotEffect: {
                type: 'cold',
                duration: 3,
                scaling: {
                    elemental: { 
                        cold: { stat: "mp_pow", statMult: 0.4 },
                    }
                }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, null, this.data.name);

            // GECİKMELİ DoT UYGULAMASI
            setTimeout(() => {
                if (window.monster && monster.hp > 0) {
                    // DİKKAT: this.data gönderiyoruz
                    window.applySkillDoT(attacker, defender, this.data);
                }
            }, 600);
        }
    },

	Ignite: {
        data: {
            id: "Ignite", // ID ekledik
            name: "Ignite",
            type: 'attack',
            category: 'elemental', // Tabın görünmesini sağlayan anahtar
            tier: 2,
            rageCost: 20,
			exhaustion: 4,
			cooldown:3,
            icon: 'skills/magus/elemental/ignite.webp', // İkon yolu
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 0.0 },
                elemental: { fire: { stat: "mp_pow", statMult: 0.0 } }
            },
            dotEffect: {
                type: 'fire',
                duration: 3,
                scaling: {
                    elemental: { 
                        fire: { stat: "mp_pow", statMult: 1.0 },
                        curse: { stat: "int", statMult: 0.0 } 
                    }
                }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, null, this.data.name);

            // GECİKMELİ DoT UYGULAMASI
            setTimeout(() => {
                if (window.monster && monster.hp > 0) {
                    // DİKKAT: this.data gönderiyoruz
                    window.applySkillDoT(attacker, defender, this.data);
                }
            }, 600);
        }
    },
	Enhancement: {
		data: {
			id: "Enhancement",
			name: "Enhancement",
			menuDescription: "Elementlerini güçlendir.<br><span style='color:#43FF64'>5 Tur: STR/2 kadar Ateş, Buz, Yıldırım direnci</span> ve <span style='color:orange'>STR/5 kadar Elemental Hasar</span> kazandırır.",
			rageCost: 25,
			levelReq: 5,
			exhaustion: 2,
			cooldown: 6,
			icon: 'skills/magus/elemental/enhancement.webp',
			type: 'utility',
			category: 'elemental',
			tier: 2
		},
		onCast: function(attacker, defender) {
			const stats = getHeroEffectiveStats();
			const resVal = Math.floor(stats.str / 2);
			const dmgVal = Math.floor(stats.str / 5);

			// 1. DİRENÇ PAKETİ (Tek İkon)
			applyStatusEffect(hero, { 
				id: 'enhancement_resists', 
				value: resVal, 
				turns: 6, 
				resetOnCombatEnd: true 
			});

			// 2. HASAR PAKETİ (Tek İkon)
			applyStatusEffect(hero, { 
				id: 'enhancement_dmg',  
				value: dmgVal, 
				turns: 6, 
				resetOnCombatEnd: true 
			});
			const lang = window.getCombatLang();

			// Cooldown ve UI işlemleri aynı kalıyor
			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Enhancement', turns: 7, maxTurns: 7, resetOnCombatEnd: true });
			updateStats();
			showFloatingText(heroDisplayContainer, lang.status.enhancement_text.toUpperCase(), 'heal');
			
			setTimeout(nextTurn, 1000);
		}
	},

	Water_Whip: {
		data: {
			name: "Water Whip",
            menuDescription: "Hasar: <b style='color:orange'>1.0xSTR (Fiz) + 1.0xMP (Buz)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			exhaustion: 5,
			cooldown: 0,
            icon: 'skills/magus/elemental/water_whip.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.2 },
                elemental: { 
                    fire: 0, 
                    cold: { stat: "mp_pow", statMult: 0.8 }, 
                    lightning: 0, poison: 0, curse: 0 
                }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
			dmgPack.skillKey = 'Water_Whip';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Ice_Shield: {
		data: {
			name: "Ice Shield",
            menuDescription: "Buzdan kalkan.<br><span style='color:#3498db'>Kazanılan Blok: 2.0xMP</span>.<br><span style='color:cyan'>-40 Mana.</span>",
            rageCost: 40,
            levelReq: 5,
			exhaustion: 5,
			cooldown: 2,
            icon: 'skills/magus/elemental/ice_shield.webp',
            type: 'defense',
            category: 'elemental', 
            tier: 2
		},
        onCast: function() {
            const stats = getHeroEffectiveStats();
            const blockAmount = Math.floor(stats.mp_pow * 2);
            if(typeof addHeroBlock === 'function') addHeroBlock(blockAmount);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Ice_Shield', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
			window.logSkillEffect('Ice_Shield', blockAmount);
            updateStats();
            setTimeout(nextTurn, 1000);
        }
    },

	Crystalised_Mana: {
		data: {
			name: "Crystalised Mana",
            menuDescription: "Manayı yoğunlaştırır.<br><span style='color:#43FF64'>2 Tur sonra +50 Mana kazanılır.</span><br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			exhaustion: 8,
			cooldown: 2,
            icon: 'skills/magus/elemental/crystal_mana.webp',
            type: 'utility',
            category: 'elemental', 
            tier: 2
		},
        //"After 2 turns, change this skill to Consume Crystal." demişiz. Mana generator olarak işaretli, 20 mana cost ve 2 tur cd gözüküyor.
        onCast: function() {
            // Şimdilik 2 tur sonra yüksek mana verecek bir buff ekleyelim
            applyStatusEffect(hero, { id: 'mana_crystal', turns: 3, value: 50, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Crystalised_Mana', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            updateStats();
            writeLog("💎 **Mana Kristali**: 2 tur sonra büyük miktarda mana açığa çıkacak.");
			window.logSkillEffect('Crystalised_Mana');
            setTimeout(nextTurn, 1000);
        }
    },

	Water_Snare: {
		data: {
			name: "Water Snare",
            menuDescription: "Hasar: <b style='color:orange'>1.0xSTR</b>.<br><span style='color:#b19cd9'>4 Tur: Düşman ATK %50 azalır.</span><br><span style='color:cyan'>-25 Mana.</span>",
            rageCost: 25,
            levelReq: 8,
			exhaustion: 6,
			cooldown: 5,
            icon: 'skills/magus/elemental/water_snare.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 3,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            // Düşman atağını %50 kır
            applyStatusEffect(monster, { id: 'debuff_enemy_atk', value: 0.50, turns: 4, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Water_Snare', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
			dmgPack.skillKey = 'Water_Snare';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Chaos_Rain: {
		data: {
			name: "Chaos Rain",
            menuDescription: "Hasar: <b style='color:orange'>2.5xMP (Rastgele Element)</b>.<br><span style='color:cyan'>Düşmanın en düşük direncini hedefler. -75 Mana.</span>",
            rageCost: 75,
            levelReq: 15,
			exhaustion: 12,
			cooldown: 6,
            icon: 'skills/magus/elemental/chaos_rain.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 0.0 },
                elemental: { fire: 1.0, cold: 1.0, lightning: 1.0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender) {
            // "En düşük resist" kuralı için SkillEngine'den önce dirençleri kontrol et
            const res = defender.resists;
            let targetType = "fire";
            if (res.cold < res[targetType]) targetType = "cold";
            if (res.lightning < res[targetType]) targetType = "lightning";
            
            // Dinamik bir scaling objesi oluşturuyoruz
            const dynamicScaling = {
                physical: { atkMult: 0, stat: "str", statMult: 0 },
                elemental: {}
            };
            dynamicScaling.elemental[targetType] = { stat: "mp_pow", statMult: 2.5 };
            
            const dmgPack = SkillEngine.calculate(hero, { scaling: dynamicScaling }, defender);
			dmgPack.skillKey = 'Chaos_Rain';
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Chaos_Rain', turns: 7, maxTurns: 7, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	// TAB: Nature
	
	Meditate: {
		data: {
			name: "Meditate",
            menuDescription: "<b>(Hızlı Meditasyon)</b><br><span style='color:#43FF64'>Kazanılan Mana: INT + %50 Kayıp HP.</span><br><span style='color:cyan'>0 Mana.</span>",
            rageCost: 0,
            levelReq: 1,
			exhaustion: -6,
			cooldown: 3,
            icon: 'skills/magus/nature/meditate.webp',
            type: 'utility',
            category: 'nature', 
            tier: 1
		},
		// Mana gain. Belki kayıp HP kısmı veya INT kısmı kaldırılabilir. 
        onCast: function() {
            const stats = getHeroEffectiveStats();
            const lostHp = hero.maxHp - hero.hp;
            const manaGain = Math.floor(stats.int + (lostHp * 0.5));
            
            hero.rage = Math.min(stats.maxRage, hero.rage + manaGain);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Meditate', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), `+${manaGain} Mana`, 'heal');
            writeLog(`🧘 **Meditasyon**: ${manaGain} Mana kazanıldı.`);
			window.logSkillEffect('Meditate', manaGain);
            setTimeout(nextTurn, 1000);
        }
    },
	
	Thorn_Whip: {
		data: {
			name: "Thorn Whip",
			//Tier 1'e düşürürken çarpanları tekrar 0.7'ye çek
            menuDescription: "Hasar: <b style='color:orange'>0.7xINT (Fiz) + 0.7xINT (Zehir)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			exhaustion: 2,
			cooldown: 0,
            icon: 'skills/magus/nature/thorn_whip.webp',
            type: 'attack',
            category: 'nature', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.0, stat: "int", statMult: 0.7 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: {stat: "int", statMult: 0.7}, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
			dmgPack.skillKey = 'Thorn_Whip';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Strangle: {
        data: {
            id: "Strangle", // ID ekledik
            name: "Strangle",
            type: 'attack',
            category: 'nature', // Tabın görünmesini sağlayan anahtar
            tier: 2,
			exhaustion: 4,
            rageCost: 20,
            icon: 'skills/magus/nature/strangle.webp', // İkon yolu
            scaling: { 
                physical: { atkMult: 0.5, stat: "int", statMult: 0.5 }
            },
            dotEffect: {
                type: 'poison',
                duration: 3,
                scaling: {
                    elemental: { 
                        poison: { stat: "int", statMult: 0.8 }
                    }
                }
            }
        },
        onCast: function(attacker, defender) {
            const dmgPack = SkillEngine.calculate(attacker, this.data, defender);
            animateCustomAttack(dmgPack, null, this.data.name);

            // GECİKMELİ DoT UYGULAMASI
            setTimeout(() => {
                if (window.monster && monster.hp > 0) {
                    // DİKKAT: this.data gönderiyoruz
                    window.applySkillDoT(attacker, defender, this.data);
                }
            }, 600);
        }
    },
	
	Spore_Cloud: {
		data: {
			id: "Spore_Cloud",
			name: "Spore Cloud",
			menuDescription: "<b>(Hızlı Aksiyon)</b><br>Düşmanı sporlarla kör et.<br><span style='color:#b19cd9'>2 Tur: Düşman atağı %40 azalır.</span><br><span style='color:cyan'>-30 Mana. Tur harcamaz.</span>",
			rageCost: 30,
			levelReq: 5,
			exhaustion: 4,
			cooldown: 6,
			icon: 'skills/magus/nature/spore_cloud.webp',
			type: 'utility',
			category: 'nature',
			tier: 2
		},
		onCast: function(attacker, defender) {
			applyStatusEffect(monster, { 
				id: 'debuff_enemy_atk', 
				value: 0.40, 
				turns: 3, 
				resetOnCombatEnd: true 
			});
			const lang = window.getCombatLang();

			hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Spore_Cloud', turns: 7, maxTurns: 7, resetOnCombatEnd: true });
			
			updateStats();
			showFloatingText(document.getElementById('monster-display'), lang.status.spore_cloud_text.toUpperCase(), 'damage');
			setTimeout(() => { window.isHeroTurn = true; toggleSkillButtons(false); }, 300);
		}
	},

	Rejuvanate: {
		data: {
			name: "Rejuvanate",
            menuDescription: "<span style='color:#43FF64'>4 Tur: Her tur +INT HP ve +1.5xINT Mana.</span><br><span style='color:cyan'>-75 Mana.</span>",
            rageCost: 75,
            levelReq: 8,
			exhaustion: 0,
			cooldown: 0,
            icon: 'skills/magus/nature/rejuvanate.webp',
            type: 'defense',
            category: 'nature', 
			tier: 3
		},
        onCast: function() {
        const stats = getHeroEffectiveStats();
        
        // HP Yenileme (Açıklamaya göre +INT HP)
        applyStatusEffect(hero, { id: 'regen', value: stats.int, turns: 4, resetOnCombatEnd: true });
        
        const manaRegenValue = Math.floor(stats.int);
        applyStatusEffect(hero, { id: 'rage_regen_buff', value: manaRegenValue, turns: 4, resetOnCombatEnd: true });
        // --------------------------------------------------------------

        window.logSkillEffect('Rejuvanate');
        updateStats();
        setTimeout(nextTurn, 1000);
		}
    },

	Natures_Wrath: {
		data: {
			name: "Nature's Wrath",
            menuDescription: "Hasar: <b style='color:orange'>1.0xMP (Fiziksel)</b>.<br><span style='color:#b19cd9'>4 Tur: Düşman ATK/DEF %50 azalır.</span><br><span style='color:cyan'>-120 Mana.</span>",
            rageCost: 120,
            levelReq: 15,
			exhaustion: 20,
			cooldown: 7,
            icon: 'skills/magus/nature/natures_wrath.webp',
            type: 'attack',
            category: 'nature', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 0.0, stat: "int", statMult: 1.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            // Düşmanı felç et
            applyStatusEffect(defender, { id: 'debuff_enemy_atk', value: 0.5, turns: 4, resetOnCombatEnd: true });
            applyStatusEffect(defender, { id: 'debuff_enemy_def', value: 0.5, turns: 4, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Natures_Wrath', turns: 8, maxTurns: 8, resetOnCombatEnd: true });
			dmgPack.skillKey = 'Natures_Wrath';
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    }

};
