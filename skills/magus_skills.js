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
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },
	
	Mana_Blast: {
		data: {
			name: "Mana Blast",
            menuDescription: "Hasar: <b style='color:orange'>1.4xMP (Fiziksel)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			cooldown: 0,
            icon: 'skills/magus/arcane/mana_blast.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 1.4 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Drain: {
		data: {
			name: "Drain",
            menuDescription: "Hasar: <b style='color:orange'>1.0xMP</b>.<br><span style='color:cyan'>Düşman zırhını yok sayar. Hasar kadar Mana kazanılır. -35 Mana.</span>",
            rageCost: 35,
            levelReq: 8,
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
            
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Arcane_Acuity: {
		data: {
			name: "Arcane Acuity",
            menuDescription: "<b>(Hızlı Aksiyon)</b><br><span style='color:#43FF64'>4 Tur: Her tur +INT kadar Mana.</span><br><span style='color:cyan'>-20 Mana. Tur harcamaz.</span>",
            rageCost: 20,
            levelReq: 8,
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
                name: "Odaklanma", 
                value: stats.int, 
                turns: 5, 
                resetOnCombatEnd: true 
            });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Arcane_Acuity', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            updateStats();
            showFloatingText(document.getElementById('hero-display'), "ODAKLANDI!", 'heal');
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
			cooldown: 0,
            icon: 'skills/magus/arcane/arcane_explosion.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 1.0, stat: "mp_pow", statMult: 2.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },
	
	// TAB: Elemental
	
	Fire_Bolt: {
		data: {
			name: "Fire Bolt",
            menuDescription: "Hasar: <b style='color:orange'>1.0xSTR (Fiz) + 0.5xMP (Ateş)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 1,
			cooldown: 0,
            icon: 'skills/magus/elemental/fire_bolt.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0 },
                elemental: { 
                    fire: { stat: "mp_pow", statMult: 0.5 }, 
                    cold: 0, lightning: 0, poison: 0, curse: 0 
                }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Zap: {
		data: {
			name: "Zap",
            menuDescription: "Hasar: <b style='color:orange'>0.8xINT (Yıldırım)</b>.<br><span style='color:#b19cd9'>3 Tur: Düşman ATK %20 azalır.</span><br><span style='color:cyan'>-25 Mana.</span>",
            rageCost: 25,
            levelReq: 1,
			cooldown: 2,
            icon: 'skills/magus/elemental/zap.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.0, stat: "int", statMult: 0.0 },
                elemental: { 
                    fire: 0, cold: 0, 
                    lightning: { stat: "int", statMult: 0.8 }, 
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
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Zap', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Water_Whip: {
		data: {
			name: "Water Whip",
            menuDescription: "Hasar: <b style='color:orange'>1.0xSTR (Fiz) + 1.0xMP (Buz)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			cooldown: 0,
            icon: 'skills/magus/elemental/water_whip.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0 },
                elemental: { 
                    fire: 0, 
                    cold: { stat: "mp_pow", statMult: 1.0 }, 
                    lightning: 0, poison: 0, curse: 0 
                }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Ice_Shield: {
		data: {
			name: "Ice Shield",
            menuDescription: "Buzdan kalkan.<br><span style='color:#3498db'>Kazanılan Blok: 2.0xMP</span>.<br><span style='color:cyan'>-40 Mana.</span>",
            rageCost: 40,
            levelReq: 5,
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
			cooldown: 2,
            icon: 'skills/magus/elemental/crystal_mana.webp',
            type: 'utility',
            category: 'elemental', 
            tier: 2
		},
        //"After 2 turns, change this skill to Consume Crystal." demişiz. Mana generator olarak işaretli, 20 mana cost ve 2 tur cd gözüküyor.
        onCast: function() {
            // Şimdilik 2 tur sonra yüksek mana verecek bir buff ekleyelim
            applyStatusEffect(hero, { id: 'mana_crystal', name: 'Mana Kristali', turns: 3, value: 50, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Crystalised_Mana', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            updateStats();
            writeLog("💎 **Mana Kristali**: 2 tur sonra büyük miktarda mana açığa çıkacak.");
            setTimeout(nextTurn, 1000);
        }
    },

	Water_Snare: {
		data: {
			name: "Water Snare",
            menuDescription: "Hasar: <b style='color:orange'>1.0xSTR</b>.<br><span style='color:#b19cd9'>4 Tur: Düşman ATK %50 azalır.</span><br><span style='color:cyan'>-25 Mana.</span>",
            rageCost: 25,
            levelReq: 8,
			cooldown: 5,
            icon: 'skills/magus/elemental/water_snare.webp',
            type: 'attack',
            category: 'elemental', 
            tier: 3,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            // Düşman atağını %50 kır
            applyStatusEffect(monster, { id: 'debuff_enemy_atk', name: "Sıkışmış", value: 0.50, turns: 4, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Water_Snare', turns: 6, maxTurns: 6, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Chaos_Rain: {
		data: {
			name: "Chaos Rain",
            menuDescription: "Hasar: <b style='color:orange'>2.5xMP (Rastgele Element)</b>.<br><span style='color:cyan'>Düşmanın en düşük direncini hedefler. -75 Mana.</span>",
            rageCost: 75,
            levelReq: 15,
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
			cooldown: 2,
            icon: 'skills/magus/nature/meditate.webp',
            type: 'utility',
            category: 'nature', 
            tier: 1
		},
		// Mana gain
        onCast: function() {
            const stats = getHeroEffectiveStats();
            const lostHp = hero.maxHp - hero.hp;
            const manaGain = Math.floor(stats.int + (lostHp * 0.5));
            
            hero.rage = Math.min(stats.maxRage, hero.rage + manaGain);
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Meditate', turns: 3, maxTurns: 3, resetOnCombatEnd: true });
            
            updateStats();
            showFloatingText(document.getElementById('hero-display'), `+${manaGain} Mana`, 'heal');
            writeLog(`🧘 **Meditasyon**: ${manaGain} Mana kazanıldı.`);
            setTimeout(nextTurn, 1000);
        }
    },
	
	Thorn_Whip: {
		data: {
			name: "Thorn Whip",
            menuDescription: "Hasar: <b style='color:orange'>0.7xINT (Fiz) + 0.7xINT (Zehir)</b>.<br><span style='color:cyan'>-20 Mana.</span>",
            rageCost: 20,
            levelReq: 5,
			cooldown: 0,
            icon: 'skills/magus/arcane/thorn_whip.webp',
            type: 'attack',
            category: 'nature', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 0.0, stat: "int", statMult: 0.7 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: {stat: "int", statMult: 0.7}, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    },

	Rejuvanate: {
		data: {
			name: "Rejuvanate",
            menuDescription: "<span style='color:#43FF64'>4 Tur: Her tur +INT HP ve +1.5xINT Mana.</span><br><span style='color:cyan'>-75 Mana.</span>",
            rageCost: 75,
            levelReq: 8,
			cooldown: 0,
            icon: 'skills/magus/nature/rejuvanate.webp',
            type: 'defense',
            category: 'nature', 
			tier: 3
		},
        onCast: function() {
            const stats = getHeroEffectiveStats();
            // HP Regen (Stat id: regen) ve Mana Regen (Stat id: rage_regen_buff) uygula
            applyStatusEffect(hero, { id: 'regen', name: "Gençleşme", value: stats.int, turns: 4, resetOnCombatEnd: true });
            applyStatusEffect(hero, { id: 'rage_regen_buff', name: "Doğa Gücü", value: Math.floor(stats.int * 1.5), turns: 4, resetOnCombatEnd: true });
            
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
			cooldown: 7,
            icon: 'skills/magus/nature/natures_wrath.webp',
            type: 'attack',
            category: 'nature', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 1.0, stat: "mp_pow", statMult: 0.0 },
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
            }
		},
        onCast: function(attacker, defender, dmgPack) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            // Düşmanı felç et
            applyStatusEffect(defender, { id: 'debuff_enemy_atk', value: 0.5, turns: 4, resetOnCombatEnd: true });
            applyStatusEffect(defender, { id: 'debuff_enemy_def', value: 0.5, turns: 4, resetOnCombatEnd: true });
            hero.statusEffects.push({ id: 'block_skill', blockedSkill: 'Natures_Wrath', turns: 8, maxTurns: 8, resetOnCombatEnd: true });
            animateCustomAttack(dmgPack, null, this.data.name);
        }
    }

};