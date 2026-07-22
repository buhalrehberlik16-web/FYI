// --- START OF FILE enemy_data.js ---

window.TRIBE_BASES = {
	// Ortalamada her triba +6, sadece dragonkind +10 ile daha dayanıklı. Her Elemental Type'ın toplamı 9 olmalı.
    "Greenskins": 			{ fire: 2, cold: 1, lightning: -2, poison: 2, curse: 3 },
    "Humans": 				{ fire: 3, cold: -1, lightning: 3, poison: 1, curse: 0 },
    //"Beasts&Monstrosities"
    "B&M": 					{ fire: 0, cold: 3, lightning: 2, poison: -2, curse: 3 },
    "Plants": 				{ fire: -2, cold: -2, lightning: 2, poison: 6, curse: 2 },
    "Undead": 				{ fire: -2, cold: 2, lightning: -2, poison: 4, curse: 4 },
    "Dragonkind": 			{ fire: 4, cold: 2, lightning: 2, poison: 0, curse: 2 },
    "Magical Creatures": 	{ fire: 4, cold: 4, lightning: 4, poison: -1, curse: -5 }
};

window.ENEMY_STATS = {
    // --- TIER 1 ---
	"Gremlin": { 
        tribe: "Greenskins",
		hasIdleSprite: true,
        spritesheet: 'enemies/gremlin.webp',
		visualScale: 0.65,
		idleFps: 20,           
		idleTotalFrames: 40,
		specificResists: { fire: -1, cold: -1, lightning: -1, poison: -1, curse: -2 },
        maxHp: 25, attack: 5, defense: 4, xp: 0, tier: 1, 
        idle: 'enemies/Idle/gremlin_idle.webp',
        dead: 'enemies/gremlin_dead.webp',
        skills: [
			{
				id: "death_gaze",
				template: "special_attack",
				category: "attack",
				damageSplit: {curse: 0.8},
				textKey: "doomsaying"
        //Doomsaying - Curse- atk*0.8dmg
			},
			{ 
                id: "goblin_yell", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 3, 
                duration: 3, 
                textKey: "yell" 
            }, 
		]
    },

	
	"Serseri": { 
        tribe: "Humans",
		specificResists: { fire: -1, cold: -1, lightning: -1, poison: -1, curse: -2 },
        maxHp: 32, attack: 8, defense: 1, xp: 0, tier: 1, 
        idle: 'enemies/vagabond_idle.webp',
        dead: 'enemies/vagabond_dead.webp',
        skills: [
            { 
                id: "dirty_kick", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "atk_half", 
                duration: 2, 
                textKey: "blinded" 
            },
			{
				id: "vaga_rush",
				template: "special_attack",
				category: "attack",
				damageSplit: {physical: 1.4},
				textKey: "vaga_rush"
			}
			
        ]
    },
	
    "Orman Örümceği": { 
        tribe: "B&M",
		specificResists: { fire: -1, cold: -1, lightning: -1, poison: 3, curse: -2 },
        maxHp: 32, attack: 9, defense: 0, xp: 0, tier: 1, 
        idle: 'enemies/orman_orumcegi.webp',
        dead: 'enemies/orman_orumcegi_dead.webp',
        skills: [
            { 
                id: "web_trap", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "debuff_webbed", 
                value: 0.40, 
                duration: 2, 
                textKey: "webbed" 
            },
            { 
                id: "chitin_harden", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 4, 
                duration: 3, 
                textKey: "harden" 
            },
            { 
                id: "poison_bite", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 0.4, poison: 1.0 }, 
                textKey: "poison_bite" 
            }, 
        ]
    },
	
    "Kan Yarasası": { 
        tribe: "B&M",
		hasIdleSprite: true,
        spritesheet: 'enemies/kan_yarasasi.webp',
		visualScale: 0.85,
		visualY: -40,
		idleFps: 24,           
		idleTotalFrames: 40,
		specificResists: { fire: -1, cold: -1, lightning: -1, poison: -1, curse: 0 },
        maxHp: 24, attack: 8, defense: 0, xp: 0, tier: 1, 
        idle: 'enemies/Idle/kan_yarasasi.webp',
        dead: 'enemies/kan_yarasasi_dead.webp',
        skills: [				
            { 
                id: "vampiric_bite", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 0.4, curse: 0.6 }, 
                healPercent: 1.0, 
                textKey: "life_drain" 
            }, 
			{ 
            id: "attack1", // Normal attack1'i eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 0.4, curse: 0.6 }, 
                healPercent: 1.0, 
                textKey: "life_drain" 
			},
			{ 
            id: "attack2", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 0.4, curse: 0.6 }, 
                healPercent: 1.0, 
                textKey: "life_drain" 
			},
            { 
                id: "bat_shriek", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "rage_burn", 
                value: 30, 
                textKey: "shriek" 
            }
        ]
    },
	
    "Zehirli Mantar": { 
        tribe: "Plants",
		specificResists: { fire: -1, cold: -1, lightning: -1, poison: 10, curse: -2 },
        maxHp: 36, attack: 3, defense: 2, xp: 0, tier: 1, 
        idle: 'enemies/zehirli_mantar.webp',
        dead: 'enemies/zehirli_mantar_dead.webp',
        firstTurnAction: "spore_poison", 
        skills: [
            { 
                id: "spore_poison", 
				template: "stat_debuff", // Artik 'stat_debuff' şablonunu kullanıyor
				category: "debuff",      // AI artık bunu zayıflatma olarak görecek
				subtype: "poison",       // EnemySkillEngine'e bunun bir zehir olduğunu söyler
				damageSplit: { physical: 0, poison: 0.0 }, // Fiziksel hasar 0, elemental güç 0x Atak
				dotType: "poison", 
				duration: 3,
				tickMult: 1,           // Her tur ne kadar vuracağını belirler
				textKey: "poison_hit"  
            },
            { 
                id: "fungal_regrow", 
                template: "self_buff", 
                category: "buff", // AI'nın tanıması için şart!
                subtype: "heal", 
                value: 0.20, 
                textKey: "regrow" 
            }
        ]
    },
	
	"Dikenli Çalı": { 
        tribe: "Plants",
		specificResists: { fire: -1, cold: -1, lightning: -1, poison: 1, curse: -2 },
        maxHp: 28, attack: 6, defense: 2, xp: 0, tier: 1, 
        idle: 'enemies/thorn_idle.webp',
        dead: 'enemies/thorn_dead.webp',
        skills: [
            { 
                id: "thorn_prick", 
                template: "special_attack", 
                category: "attack",
                dotType: "poison",
                damageSplit: { physical: 0.5, poison: 0.5 }, 
                duration: 3,
                tickMult: 0.6,
                textKey: "poison_hit" 
            },
            { 
				id: "thorn_scratch", 
                template: "special_attack", 
                category: "attack",
                dotType: "bleed",
                damageSplit: { physical: 0.5 }, 
                duration: 3,
                tickMult: 0.75,
                textKey: "vicious"
			}
			
        ]
    },
	
    "İskelet": { 
        tribe: "Undead",
		specificResists: { fire: -1, cold: 3, lightning: -1, poison: -1, curse: -2 },
        maxHp: 30, attack: 5, defense: 3, xp: 0, tier: 1, 
        idle: 'enemies/skeleton_idle.webp',
        dead: 'enemies/skeleton_dead.webp',
        skills: [
            { 
                id: "bone_shatter", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "defense_zero", 
                duration: 2, 
                textKey: "broken" 
            }, 
            { 
                id: "undead_fortitude", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 4, 
                duration: 2, 
                textKey: "fortitude" 
            }, 
			{
				id: "death_gaze",
				template: "special_attack",
				category: "attack",
				damageSplit: {curse: 0.8},
				textKey: "gaze"
			}
        ]
    },
	
    "Hırsız Kobold": {
        tribe: "Dragonkind",
		hasIdleSprite: true,
        spritesheet: 'enemies/hirsiz_kobold.webp',
		visualScale: 0.90,
		idleFps: 19,           
		idleTotalFrames: 40,
		specificResists: { fire: 3, cold: 3, lightning: -1, poison: -1, curse: -1 },
        maxHp: 32, attack: 7, defense: 0, xp: 0, tier: 1, 
        idle: 'enemies/Idle/hirsiz_kobold.webp',
        dead: 'enemies/hirsiz_kobold_dead.webp',
        skills: [
			{ 
            id: "attack1", // Normal attack1'i eziyoruz!
            template: "special_attack", 
            category: "attack",
            damageSplit: { physical: 0.8, curse: 0.4 }, // Vuruşu artık lanetli!
            textKey: "cursed_hit" 
			},
            { 
                id: "pocket_sand", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "atk_half", 
                duration: 2, 
                textKey: "blinded" 
            },
            { 
                id: "cowardly_dash", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 6, 
                duration: 2, 
                textKey: "dash" 
            }
        ]
    },

    // --- TIER 2 ---
	"Kemik Yürüyen": { 
        tribe: "Undead",
		hasIdleSprite: true,
        spritesheet: 'enemies/bone_walker.webp',
		visualX: 15,
		specificResists: { poison: 10 },
        maxHp: 52, attack: 12, defense: 4, xp: 0, tier: 2, 
        idle: 'enemies/Idle/bone_walker.webp',
        dead: 'enemies/bone_walker_dead.webp',
        skills: [
		{ 
                id: "bone_shatter", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "defense_zero", 
                duration: 2, 
                textKey: "broken" 
            }, 
            { 
                id: "undead_fortitude", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 4, 
                duration: 2, 
                textKey: "fortitude" 
            }, 
			{
				id: "death_gaze",
				template: "special_attack",
				category: "attack",
				damageSplit: {curse: 1.2},
				textKey: "gaze"
			}
        ]
    },
    "Goblin Devriyesi": { 
        tribe: "Greenskins",
		hasIdleSprite: true,
		spritesheet: 'enemies/goblin_devriyesi.webp',
		visualScale: 0.95,
		idleFps: 24,           
		idleTotalFrames: 40,
		visualX: 20,
        specificResists: { cold: 5 },
        maxHp: 60, attack: 12, defense: 5, xp: 0, tier: 2, 
        idle: 'enemies/Idle/goblin_devriyesi.webp',
        dead: 'enemies/goblin_devriyesi_dead.webp',
        skills: [
            { 
                id: "goblin_yell", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 6, 
                duration: 3, 
                textKey: "yell" 
            }, 
            { 
                id: "shield_wall", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 4, 
                duration: 3, 
                textKey: "shield_wall" 
            }
        ]
    },
	"Goblin Gözcü": { 
        tribe: "Greenskins",
		hasIdleSprite: true,
		spritesheet: 'enemies/goblin_scout.webp',
		visualScale: 0.80,
		idleFps: 24,           
		idleTotalFrames: 40,
        maxHp: 63, attack: 10, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/Idle/goblin_scout.webp',
        dead: 'enemies/goblin_scout_dead.webp',
        skills: [
			{ 
                id: "goblin_yell", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 5, 
                duration: 2, 
                textKey: "yell" 
            }, 
			{ 
                id: "sneaky_stab", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { poison: 0.8}, 
				dotType: "poison", 
				duration: 4,
				tickMult: 0.2,           // Her tur ne kadar vuracağını belirler  
                textKey: "poison_stab" 
			}
        ]
    },
	
	"Haydut Gözcü": { 
        tribe: "Humans",
        maxHp: 52, attack: 12, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/scout_bandit_idle.webp',
        dead: 'enemies/scout_bandit_dead.webp',
        skills: [
            { 
                id: "smoke_bomb", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "atk_half", 
                duration: 2, 
                textKey: "smoke" 
            },
			{ 
                id: "arrow_rain", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { poison: 0.8}, 
				dotType: "poison", 
				duration: 4,
				tickMult: 0.17,           // Her tur ne kadar vuracağını belirler  
                textKey: "poison_bite" 
			}
			
        ]
    },
	
    "Kaçak Haydut": { 
        tribe: "Humans",
		hasIdleSprite: true,
        spritesheet: 'enemies/kacak_haydut.webp',
		idleFps: 14,           
		idleTotalFrames: 40,
        specificResists: { cold: 1 },
        maxHp: 58, attack: 14, defense: 4, xp: 0, tier: 2, 
        idle: 'enemies/Idle/kacak_haydut.webp',
        dead: 'enemies/kacak_haydut_dead.webp',
        skills: [
            { 
                id: "dirty_strike", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 1.4 }, 
                textKey: "dirty" 
            }, 
            { 
                id: "smoke_bomb", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "atk_half", 
                duration: 2, 
                textKey: "smoke" 
            },
			//{ 
            //    id: "fire_bomb", 
            //    template: "special_attack", 
            //    category: "attack",
            //    damageSplit: { fire: 0.8}, 
			//	dotType: "fire", 
			//	duration: 2,
			//	tickMult: 0.5,           // Her tur ne kadar vuracağını belirler  
            //    textKey: "f_bomb" 
			//}
        ]
    },
	
	
	 "Şaman": { 
        tribe: "Humans",
        maxHp: 50, attack: 12, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/shaman_idle.webp',
        dead: 'enemies/shaman_dead.webp',
        skills: [
            { 
                id: "spirit_mend", 
                template: "self_buff", 
                category: "buff",
                subtype: "heal", 
                value: 0.25, 
                textKey: "regrow" 
            },
            { 
                id: "totem_curse", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "curse", 
                value: 10, 
                duration: 3, 
                textKey: "cursed" 
            }
        ]
    },
	
	"Haydut Simyacı": { 
        tribe: "Humans",
		hasIdleSprite: true,
		spritesheet: 'enemies/bandolier_idle.webp',
		idleFps: 24,           
		idleTotalFrames: 40,
        specificResists: { fire: 4 },
        maxHp: 58, attack: 12, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/Idle/bandolier_idle.webp',
        dead: 'enemies/bandolier_dead.webp',
        skills: [
			{ 
                id: "fire_bomb", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { fire: 0.6}, 
				dotType: "fire", 
				duration: 2,
				tickMult: 0.5,           // Her tur ne kadar vuracağını belirler  
                textKey: "f_bomb" 
			},
			{ 
                id: "curse_bomb", 
				template: "special_attack", // Artik 'stat_debuff' şablonunu kullanıyor
				category: "attack",      // AI artık bunu zayıflatma olarak görecek
				damageSplit: { curse: 1.0, poison: 0.0 }, // Fiziksel hasar 0, elemental güç 0x Atak
				dotType: "curse", 
				duration: 4,
				tickMult: 0.1,           // Her tur ne kadar vuracağını belirler
				textKey: "c_bomb"  
            }
        ]
    },
	
	"Genç Ayı": { 
        tribe: "B&M",
        maxHp: 70, attack: 16, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/young_bear_idle.webp',
        dead: 'enemies/young_bear_dead.webp',
        skills: [
            { 
				id: "roar", // roar
                template: "stat_debuff", 
                category: "debuff",
                subtype: "atk_half", 
                duration: 2, 
                textKey: "roar" 
              //  id: "bear_hug", 
              //  template: "stat_debuff", 
              //  category: "debuff",
              //  subtype: "stun", 
              //  duration: 2, 
              //  textKey: "stunned" 
            }
        ]
    },
	
    "Gri Kurt": { 
        tribe: "B&M",
		hasIdleSprite: true,
		spritesheet: 'enemies/kurt_surusu.webp',
		idleFps: 21,           
		idleTotalFrames: 40,
		visualScale: 0.80,
        specificResists: { cold: 10 },
        maxHp: 54, attack: 16, defense: 4, xp: 0, tier: 2, 
        idle: 'enemies/kurt_surusu.webp',
        dead: 'enemies/kurt_surusu_dead.webp',
        skills: [
            { 
                id: "vicious_bite", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "rage_burn", 
                value: 30, 
                textKey: "roar" 
            }, 
            { 
                id: "alpha_howl", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 12, 
                duration: 3, 
                textKey: "howl" 
            },
            { 
                id: "miasma_bite", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { curse: 1.2 }, 
                textKey: "miasma" 
            },  
        ]
    },
	"Kobold Devriye": { 
        tribe: "Dragonkind",
		hasIdleSprite: true,
        spritesheet: 'enemies/kobold_patrol.webp',
		idleFps: 22,           
		idleTotalFrames: 40,
		visualX: 40,
        maxHp: 62, attack: 13, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/Idle/kobold_patrol_idle.webp',
        dead: 'enemies/kobold_patrol_dead.webp',
        skills: [ 
			{ 
                id: "goblin_yell", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 4, 
                duration: 3, 
                textKey: "yell" 
            }, 
			{ 
                id: "lizard_tail", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 1.2 }, 
                textKey: "tail" 
            } 
        ]
    },
	 "Kobold Şaman": { 
        tribe: "Dragonkind",
		hasIdleSprite: true,
		spritesheet: 'enemies/kobold_shaman.webp',
		idleFps: 21,           
		idleTotalFrames: 40,
        maxHp: 55, attack: 12, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/Idle/kobold_shaman.webp',
        dead: 'enemies/kobold_shaman_dead.webp',
        skills: [
		{ 
                id: "spirit_mend", 
                template: "self_buff", 
                category: "buff",
                subtype: "heal", 
                value: 0.10, 
                textKey: "regrow" 
            },
			{ 
            id: "attack1", // Normal attack1'i eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { poison: 1.0 }, 
                textKey: "curse" 
			},
			
			{ 
            id: "attack2", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { fire: 1.0 }, 
                textKey: "gaze" 
			},
        ]
    },
	"Treant Sapling": { 
        tribe: "Plants",
        specificResists: { poison: 10, curse: -5 },
        maxHp: 58, attack: 13, defense: 8, xp: 0, tier: 2, 
        idle: 'enemies/treant_sapling_idle.webp',
        dead: 'enemies/treant_sapling_dead.webp',
        skills: [ 
			{ 
                id: "fungal_regrow", 
                template: "self_buff", 
                category: "buff", // AI'nın tanıması için şart!
                subtype: "heal", 
                value: 0.20, 
                textKey: "regrow" 
            },
			{ 
                id: "thorn_prick", 
                template: "special_attack", 
                category: "attack",
                dotType: "poison",
                damageSplit: { physical: 0.5, poison: 0.8 }, 
                duration: 3,
                tickMult: 0.4,
                textKey: "poison_hit" 
            },
		//Heal, Poison
        ]
	},
	"Lanetli Muhafız": { 
        tribe: "Undead",
		hasIdleSprite: true,
        spritesheet: 'enemies/cursed_sentry.webp',
		idleFps: 24,           
		idleTotalFrames: 40,
        specificResists: { poison: 20 },
        maxHp: 68, attack: 14, defense: 4, xp: 0, tier: 2, 
        idle: 'enemies/Idle/cursed_sentry.webp',
        dead: 'enemies/cursed_sentry_dead.webp',
        skills: [
		{ 
                id: "undead_fortitude", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 5, 
                duration: 3, 
                textKey: "fortitude" 
            }, 
			{
				id: "death_gaze",
				template: "special_attack",
				category: "attack",
				damageSplit: {curse: 1.3},
				textKey: "gaze"
			}
        ]
    },
	"Rünlü Totem": { 
        tribe: "Magical Creatures",
        maxHp: 85, attack: 8, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/rune_stone.webp',
        dead: 'enemies/rune_stone_dead.webp',
        skills: [
			{
			id: "attack1", // Normal attack1'i eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { fire: 0.6, curse: 0.4 },  
                //textKey: "totem" 
			},
			{ 
            id: "attack2", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { cold: 0.6, curse: 0.4 },  
                //textKey: "totem" 
			},
			{ 
                id: "runic_stone", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 5, 
                duration: 3, 
                textKey: "totem" 
            }
		//No Basic, Fire&Cold
        ]
    },

    // --- TIER 3 ---
	"Goblin Şaman": { 
        tribe: "Greenskins",
		hasIdleSprite: true,
        spritesheet: 'enemies/goblin_shaman.webp',
		visualScale: 0.88,
		visualX: 20,
		idleFps: 24,           
		idleTotalFrames: 40,
        maxHp: 70, attack: 30, defense: 10, xp: 0, tier: 3, 
        idle: 'enemies/Idle/goblin_shaman_idle.webp',
        dead: 'enemies/goblin_shaman_dead.webp',
        skills: [ 
			{ 
                id: "spirit_mend", 
                template: "self_buff", 
                category: "buff",
                subtype: "heal", 
                value: 0.10, 
                textKey: "regrow" 
            },
            { 
                id: "totem_curse", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "curse", 
                value: 5, 
                duration: 3, 
                textKey: "cursed" 
            },
			{ 
            id: "attack1", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { curse: 1.0 }, 
                textKey: "curse" 
			},
			
			{ 
            id: "attack2", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { lightning: 1.0 }, 
                textKey: "gaze" 
			},
		//No Basic, Curse&Lightning, iki yaratığa bölünebilir
        ]
    },	
    "Goblin Savaşçısı": { 
        tribe: "Greenskins",
		hasIdleSprite: true,
		spritesheet: 'enemies/goblin_savascisi.webp',
		visualScale: 0.75,
		visualX: 20,
		idleFps: 30,           
		idleTotalFrames: 40,
        specificResists: { cold: 5 },
        maxHp: 90, attack: 30, defense: 15, xp: 0, tier: 3, 
        idle: 'enemies/Idle/goblin_savascisi.webp',
        dead: 'enemies/goblin_savascisi_dead.webp',
        skills: [
            { 
                id: "mace_bash", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "stun", 
                duration: 2, 
                textKey: "stunned" 
            },
            { 
                id: "berserker_rage", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 15, 
                duration: 3, 
                textKey: "berserk" 
            }
        ]
    },
	"Haydut Devriye": { 
        tribe: "Humans",
		hasIdleSprite: true,
        spritesheet: 'enemies/highwayman.webp',
		idleFps: 19,           
		idleTotalFrames: 40,
        maxHp: 80, attack: 20, defense: 15, xp: 0, tier: 3, 
        idle: 'enemies/Idle/highwayman_idle.webp',
        dead: 'enemies/highwayman_dead.webp',
        skills: [
            { 
                id: "dirty_strike", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 1.4 }, 
                textKey: "dirty" 
            }, 
			{ 
                id: "shield_wall", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 3, 
                duration: 3, 
                textKey: "shield_wall" 
            }
			//Def Up
        ]
    },
	"Haydut Okçu": { 
        tribe: "Humans",
		hasIdleSprite: true,
        spritesheet: 'enemies/highwayman_archer.webp',
		idleFps: 19,           
		idleTotalFrames: 40,
        maxHp: 75, attack: 25, defense: 13, xp: 0, tier: 3, 
        idle: 'enemies/Idle/highwayman_archer.webp',
        dead: 'enemies/highwayman_archer_dead.webp',
        skills: [
			{ 
                id: "dirty_strike", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 1.5 }, 
                textKey: "dirty" 
            }, 
            { 
                id: "cowardly_dash", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 8, 
                duration: 2, 
                textKey: "dash" 
            }
		//F Bomb türevi
        ]
	},
	"Boz Ayı": { 
        tribe: "B&M",
		hasIdleSprite: true,
        spritesheet: 'enemies/grizzly.webp',
		visualScale: 0.85,
		idleFps: 19,           
		idleTotalFrames: 40,
        maxHp: 90, attack: 30, defense: 10, xp: 0, tier: 3, 
        idle: 'enemies/Idle/grizzly_idle.webp',
        dead: 'enemies/grizzly_dead.webp',
        skills: [
		{ 
                id: "trample", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "debuff_enemy_def", 
                value: 0.5, 
                duration: 2, 
                textKey: "trampled" 
            }, 
            { 
                id: "thick_hide", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 10, 
                duration: 2, 
                textKey: "hide" 
            }
        ]
    },
	"Lanetli Ayı": { 
        tribe: "B&M",
		hasIdleSprite: true,
        spritesheet: 'enemies/cursed_grizzly.webp',
		visualScale: 0.85,
		visualX: 20,
		idleFps: 24,           
		idleTotalFrames: 40,
        maxHp: 105, attack: 32, defense: 10, xp: 0, tier: 3, 
        idle: 'enemies/Idle/cursed_grizzly.webp',
        dead: 'enemies/cursed_grizzly_dead.webp',
        skills: [
		//Basics deal half Curse Dmg
        ]
    },
	"Beyaz Kurt": { 
        tribe: "B&M",
		hasIdleSprite: true,
		visualScale: 0.85,
		idleFps: 24,           
		idleTotalFrames: 40,
		visualX: 25,
        specificResists: { cold: 12 },
        maxHp: 80, attack: 20, defense: 10, xp: 0, tier: 3, 
		spritesheet: 'enemies/beyaz_kurt.webp',
        idle: 'enemies/Idle/beyaz_kurt.webp',
        dead: 'enemies/beyaz_kurt_dead.webp',
        skills: [
            { 
                id: "vicious_bite", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "rage_burn", 
                value: 30, 
                textKey: "vicious" 
            }, 
            { 
                id: "alpha_howl", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 10, 
                duration: 3, 
                textKey: "howl" 
            },
            { 
                id: "miasma_bite", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { curse: 1.3 }, 
                textKey: "miasma" 
            },  
        ]
    },
    "Yaban Domuzu": { 
        tribe: "B&M",
        specificResists: { cold: 6 },
        maxHp: 105, attack: 25, defense: 12, xp: 0, tier: 3, 
        idle: 'enemies/yaban_domuzu.webp',
        dead: 'enemies/yaban_domuzu_dead.webp',
        skills: [
            { 
                id: "trample", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "debuff_enemy_def", 
                value: 0.5, 
                duration: 2, 
                textKey: "trampled" 
            }, 
            { 
                id: "thick_hide", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 10, 
                duration: 3, 
                textKey: "hide" 
            }
        ]
    },
	"Treant": { 
        tribe: "Plants",
        maxHp: 90, attack: 18, defense: 18, xp: 0, tier: 3, 
        idle: 'enemies/treant_idle.webp',
        dead: 'enemies/treant_dead.webp',
        skills: [
		{ 
                id: "thorn_prick", 
                template: "stat_debuff", 
                category: "debuff",
                dotType: "poison",
                damageSplit: { physical: 0.4, poison: 0.6 }, 
                duration: 3,
                tickMult: 0.62,
                textKey: "poison_hit" 
            }
        ]
    },
    "Canavar Tohum": { 
        tribe: "Plants",
        maxHp: 50, attack: 50, defense: 0, xp: 0, tier: 3, 
        idle: 'enemies/trap_seed.webp',
        dead: 'enemies/trap_seed_dead.webp',
        skills: [
			{ 
                id: "thorn_prick", 
                template: "stat_debuff", 
                category: "debuff",
                dotType: "poison",
                damageSplit: { physical: 0.5, poison: 0.8 }, 
                duration: 3,
                tickMult: 0.5,
                textKey: "poison_hit" 
            },
		//Suicide bomber - bir tur boş (veya debuff verebilir, kör etme benzeri, etrafa spor/toz salma mantığıyla) geçer, ikinci tur patlar, Atk&Self dmg
        ]
    },
    "Kadim Mantar": { 
        tribe: "Plants",
		hasIdleSprite: true, // BU SATIRI EKLE
		idleFps: 24,           
		idleTotalFrames: 40,
        specificResists: { poison: 20 },
        maxHp: 110, attack: 15, defense: 20, xp: 0, tier: 3, 
        idle: 'enemies/Idle/ancient_mushroom.webp',
		spritesheet: 'enemies/ancient_mushroom.webp', // NEFES ALMA (40 karelik sheet)
        dead: 'enemies/ancient_mushroom_dead.webp',
        skills: [
            { 
                id: "spore_poison", 
				template: "stat_debuff", // Artik 'stat_debuff' şablonunu kullanıyor
				category: "debuff",      // AI artık bunu zayıflatma olarak görecek
				subtype: "poison",       // EnemySkillEngine'e bunun bir zehir olduğunu söyler
				damageSplit: { physical: 0, poison: 0.0 }, // Fiziksel hasar 0, elemental güç 0x Atak
				dotType: "poison", 
				duration: 3,
				tickMult: 0.75,           // Her tur ne kadar vuracağını belirler
				textKey: "poison_hit"  
            },
            { 
                id: "fungal_regrow", 
                template: "self_buff", 
                category: "buff", // AI'nın tanıması için şart!
                subtype: "heal", 
                value: 0.20, 
                textKey: "regrow" 
            }
        ]
    },
	"Ağlayan Gölge": { 
        tribe: "Undead",
        maxHp: 90, attack: 22, defense: 12, xp: 0, tier: 3, 
        idle: 'enemies/weeping_shadow.webp',
        dead: 'enemies/weeping_shadow_dead.webp',
        skills: [
        ]
    },
	"Kül Yürüyen": { 
        tribe: "Undead",
		hasIdleSprite: true,
		spritesheet: 'enemies/ash_walker.webp',
		idleFps: 24,           
		idleTotalFrames: 40,
        maxHp: 90, attack: 22, defense: 12, xp: 0, tier: 3, 
        idle: 'enemies/Idle/ash_walker.webp',
        dead: 'enemies/ash_walker_dead.webp',
        skills: [
        ]
    },
	"Ejderkelam": { 
        tribe: "Dragonkind",
		hasIdleSprite: true,
        spritesheet: 'enemies/dragonkin_speaker.webp',
		idleFps: 24,           
		idleTotalFrames: 40,
		visualX: 20,
        maxHp: 90, attack: 20, defense: 18, xp: 0, tier: 3, 
        idle: 'enemies/Idle/dragonkin_speaker.webp',
        dead: 'enemies/dragonkin_speaker_dead.webp',
        skills: [
			{ 
            id: "attack1", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { fire: 1.0 }, 
			},
			{ 
            id: "attack2", // Normal attack2'yi eziyoruz!
                template: "special_attack", 
                category: "attack",
                damageSplit: { fire: 1.0 }, 
			},
		//Fire, Buff, Debuff
        ]
    },
	 "Kil Golem": { 
        tribe: "Magical Creatures",
		hasIdleSprite: true,
        spritesheet: 'enemies/clay_golem.webp',
		visualX: 15,
		idleFps: 21,           
		idleTotalFrames: 40,
        maxHp: 100, attack: 22, defense: 20, xp: 0, tier: 3, 
        idle: 'enemies/Idle/clay_golem.webp',
        dead: 'enemies/clay_golem_dead.webp',
        skills: [
        ]
    },
    "Kaya Golemi": { 
        tribe: "Magical Creatures",
		hasIdleSprite: true,
        spritesheet: 'enemies/kaya_golemi.webp',
		idleFps: 21,           
		idleTotalFrames: 40,
        specificResists: { lightning: 10 },
        maxHp: 110, attack: 18, defense: 23, xp: 0, tier: 3, 
        idle: 'enemies/Idle/kaya_golemi.webp',
        dead: 'enemies/kaya_golemi_dead.webp',
        skills: [
            { 
                id: "ground_slam", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "stun", 
                duration: 2, 
                textKey: "slammed" 
            }, 
            { 
                id: "stone_form", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 15, 
                duration: 2, 
                textKey: "stone" 
            }
        ]
    },
	// --- Tier 4 ---
    "Ork Fedaisi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 150, attack: 35, defense: 21, xp: 0, tier: 4, 
        idle: 'enemies/orc_fedaisi.webp',
        dead: 'enemies/orc_fedaisi_dead.webp',
        skills: [
            { 
                id: "crushing_blow", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 1.5, fire: 0.2 }, 
                textKey: "crushing" 
            }, 
            { 
                id: "iron_will", 
                template: "self_buff", 
                category: "buff",
                subtype: "heal", 
                value: 0.15, 
                textKey: "will" 
            }
        ]
    },
	//"Ejderkelam": { 
    //    tribe: "Dragonkind",
    //    maxHp: 165, attack: 24, defense: 22, xp: 0, tier: 4, 
    //    idle: 'enemies/dragonkin_speaker.webp',
    //    dead: 'enemies/dragonkin_speaker_dead.webp',
    //    skills: [
	//		{ 
    //        id: "attack1", // Normal attack2'yi eziyoruz!
    //            template: "special_attack", 
    //            category: "attack",
    //            damageSplit: { fire: 1.0 }, 
	//		},
	//		{ 
    //        id: "attack2", // Normal attack2'yi eziyoruz!
    //            template: "special_attack", 
    //            category: "attack",
    //            damageSplit: { fire: 1.0 }, 
	//		},
		//Fire, Buff, Debuff
       // ]
    //},
	"Göçebe": { 
        tribe: "Humans",
        maxHp: 180, attack: 35, defense: 22, xp: 0, tier: 4, 
        idle: 'enemies/nomad.webp',
        dead: 'enemies/nomad_dead.webp',
        skills: [
        ]
    },
    "Göçebe Savaşçı": { 
        tribe: "Humans",
        maxHp: 190, attack: 40, defense: 18, xp: 0, tier: 4, 
        idle: 'enemies/nomad_warrior.webp',
        dead: 'enemies/nomad_warrior_dead.webp',
        skills: [
        ]
    },
	"Göçebe Kültist": { 
        tribe: "Humans",
        maxHp: 180, attack: 38, defense: 16, xp: 0, tier: 4, 
        idle: 'enemies/nomad_cultist.webp',
        dead: 'enemies/nomad_cultist_dead.webp',
        skills: [
		//Curse&Debuff
        ]
    },

    // --- BOSS ---
    "Goblin Şefi": { 
        tribe: "Greenskins",
		hasIdleSprite: true,
		spritesheet: 'enemies/goblin_sef.webp',
		idleFps: 24,           
		idleTotalFrames: 40,
        specificResists: { cold: 10 },
        maxHp: 200, attack: 30, defense: 20, isBoss:true, tier: 4, 
        idle: 'enemies/goblin_sef.webp',
        dead: 'enemies/goblin_sef_dead.webp',
        skills: [
            { 
                id: "chief_command", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 18, 
                duration: 5, 
                textKey: "command" 
            },
            { 
                id: "last_stand", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 25, 
                duration: 3, 
                textKey: "last_stand" 
            }
        ]
    }
};

Object.assign(ENEMY_STATS, {
    "İskelet Şövalye": { 
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 230, attack: 30, defense: 25, tier: 4, 
        idle: 'enemies/skeleton_idle.webp', 
        dead: 'enemies/skeleton_dead.webp',
        skills: [
			{ 
				id: "cursed_blade", 
				template: "special_attack", 
				category: "attack", 
				damageSplit: { physical: 0.8, curse: 0.5 }, 
				textKey: "cursed" 
			},
			{
				id: "death_gaze",
				template: "special_attack",
				category: "attack",
				damageSplit: {curse: 1.2},
				textKey: "gaze"
			}
			] 
    },
    "Gulyabani": {
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 350, attack: 20, defense: 5, tier: 4, 
        idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', 
        skills: [{ id: "paralyzing_claws", template: "stat_debuff", category: "debuff", subtype: "stun", duration: 1, textKey: "paralyzed" }]
    },
    "Kemik Golemi": { 
        tribe: "Magical Creatures",
        specificResists: { cold: 10 },
        maxHp: 300, attack: 28, defense: 20, tier: 4, 
        idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', 
        skills: [{ id: "marrow_drain", template: "special_attack", category: "attack", damageSplit: { physical: 0.3, curse: 1.0 }, healPercent: 0.7, textKey: "marrow" }]
    }
});

// Düşman Havuzları
window.TIER_ENEMIES = {
    1: ["Gremlin","Zehirli Mantar", "Orman Örümceği", "Hırsız Kobold", "Kan Yarasası", "İskelet", "Serseri", "Dikenli Çalı"],
    2: ["Kemik Yürüyen","Goblin Devriyesi", "Goblin Gözcü","Kaçak Haydut", "Gri Kurt", "Haydut Gözcü", "Genç Ayı", "Şaman", "Haydut Simyacı", "Kobold Devriye", "Kobold Şaman", "Treant Sapling","Lanetli Muhafız","Rünlü Totem"],
    3: ["Yaban Domuzu", "Goblin Savaşçısı", "Kaya Golemi", "Haydut Devriye", "Haydut Okçu", "Goblin Şaman", "Kadim Mantar", "Kil Golem", "Ağlayan Gölge", "Kül Yürüyen", "Ejderkelam", "Boz Ayı","Lanetli Ayı","Beyaz Kurt","Canavar Tohum", "Treant"],
    "B1": ["Goblin Şefi"], //Boss
    4: ["İskelet Şövalye", "Gulyabani", "Kemik Golemi", "Ork Fedaisi", "Göçebe", "Göçebe Savaşçı","Göçebe Kültist"], 
    5: [], 
    6: [],
    "B2": [],
    7: [],
    8: [],
    9: [],
    "B3": [],
    10: []
};
// tribe sırası: Greenskins, Humans, Beasts&Monstrosities, B&M, Plants, Undead, Dragonkind, Magical Creatures
window.BIOME_WEIGHTS = {
    // Düşman İsmi: { biyom_adi: ihtimal_orani }
	"Gremlin": 			{ forest: 0.2, plains: 0.4, cave: 0.1, iceland: 0.2, mountain: 0.1,  urban: 0.4},
	"Serseri": 		  	{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
    "Orman Örümceği": 	{ forest: 0.5, plains: 0.2, cave: 0.4, iceland: 0.1, mountain: 0.3, urban: 0.0 },
    "Kan Yarasası":   	{ forest: 0.4, plains: 0.1,cave: 0.6, iceland: 0.1, mountain: 0.3, urban: 0.1 },
    "Zehirli Mantar": 	{ forest: 0.5, plains: 0.1, cave: 0.1, iceland: 0, mountain: 0.2, urban: 0.2 },
    "Dikenli Çalı":   	{ forest: 0.5, plains: 0.2, cave: 0.1, iceland: 0, mountain: 0.2, urban: 0.2 },
    "İskelet":        	{ forest: 0.1, plains: 0.1, cave: 0.2, iceland: 0.2, mountain: 0.3, urban: 0.5 },
    "Hırsız Kobold":  	{ forest: 0.2, plains: 0.3, cave: 0.15, iceland: 0.2, mountain: 0.3, urban: 0.2 },
// TIER 2
    "Goblin Devriyesi":	{ forest: 0.2, plains: 0.4, cave: 0.1, iceland: 0.2, mountain: 0.1,  urban: 0.4},
	"Goblin Gözcü":		{ forest: 0.2, plains: 0.4, cave: 0.1, iceland: 0.2, mountain: 0.1,  urban: 0.4},
	"Haydut Gözcü":   	{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
    "Kaçak Haydut":   	{ forest: 0.2, plains: 0.2, cave: 0.1, iceland: 0.2, mountain: 0.2, urban: 0.4 },
    "Şaman": 		  	{ forest: 0.2, plains: 0.2, cave: 0.2, iceland: 0.2, mountain: 0.2, urban: 0.4 },
	"Haydut Simyacı":	{ forest: 0.0, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
    "Genç Ayı": 	  	{ forest: 0.5, plains: 0.2, cave: 0.4, iceland: 0.1, mountain: 0.3, urban: 0.0 },
    "Gri Kurt":       	{ forest: 0.5, plains: 0.2, cave: 0.4, iceland: 0.1, mountain: 0.3, urban: 0.0 },
	"Treant Sapling":  	{ forest: 0.5, plains: 0.2, cave: 0.1, iceland: 0, mountain: 0.2, urban: 0.2 },
	"Kemik Yürüyen":	{ forest: 0.1, plains: 0.1, cave: 0.2, iceland: 0.2, mountain: 0.3, urban: 0.5 },
	"Kobold Devriye": 	{ forest: 0.2, plains: 0.3, cave: 0.15, iceland: 0.2, mountain: 0.3, urban: 0.2 },
	"Kobold Şaman": 	{ forest: 0.2, plains: 0.3, cave: 0.15, iceland: 0.2, mountain: 0.3, urban: 0.2 },
	"Lanetli Muhafız":  { forest: 0.0, plains: 0.1, cave: 0.3, iceland: 0.2,  mountain: 0.4, urban: 0.3 },
	"Rünlü Totem":   	{ forest: 0.0, plains: 0.1, cave: 0.3, iceland: 0.2,  mountain: 0.4, urban: 0.3 },
	//Magical Creature1 "imp?": { forest: 0.0, plains: 0.1, cave: 0.3, iceland: 0.2,  mountain: 0.4, urban: 0.3 }
// TIER 3
	"Goblin Şaman":		{ forest: 0.3, plains: 0.3, cave: 0.2, iceland: 0.1, mountain: 0.2,  urban: 0.4 },
    "Goblin Savaşçısı":	{ forest: 0.2, plains: 0.4, cave: 0.1, iceland: 0.2, mountain: 0.1,  urban: 0.4 },
	"Haydut Devriye":  	{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
	"Haydut Okçu":  	{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
	"Boz Ayı": 	  		{ forest: 0.5, plains: 0.2, cave: 0.4, iceland: 0.1, mountain: 0.3, urban: 0.0 },
	"Lanetli Ayı": 	  	{ forest: 0.5, plains: 0.2, cave: 0.4, iceland: 0.1, mountain: 0.3, urban: 0.0 },
	"Beyaz Kurt":		{ forest: 0.1, plains: 0.2, cave: 0.1, iceland: 0.5, mountain: 0.5, urban: 0.0 },
    "Yaban Domuzu":   	{ forest: 0.5, plains: 0.2, cave: 0.4, iceland: 0.1, mountain: 0.3, urban: 0.0 },
	"Treant":   		{ forest: 0.5, plains: 0.2, cave: 0.1, iceland: 0, mountain: 0.2, urban: 0.2 },
	"Canavar Tohum": 	{ forest: 0.5, plains: 0.2, cave: 0.1, iceland: 0, mountain: 0.2, urban: 0.2 },
	"Kadim Mantar":		{ forest: 0.5, plains: 0.1, cave: 0.1, iceland: 0, mountain: 0.2, urban: 0.2 },
	"Ağlayan Gölge":	{ forest: 0.1, plains: 0.1, cave: 0.2, iceland: 0.2, mountain: 0.3, urban: 0.5 },
	"Kül Yürüyen":	{ forest: 0.1, plains: 0.1, cave: 0.2, iceland: 0.2, mountain: 0.3, urban: 0.5 },
	"Ejderkelam": 		{ forest: 0.2, plains: 0.3, cave: 0.15, iceland: 0.2, mountain: 0.3, urban: 0.2},
	"Kil Golem":    	{ forest: 0.0, plains: 0.1, cave: 0.3, iceland: 0.2,  mountain: 0.4, urban: 0.3 },
    "Kaya Golemi":   	{ forest: 0.0, plains: 0.1, cave: 0.3, iceland: 0.2,  mountain: 0.4, urban: 0.3 },
// TIER 4
    "Ork Fedaisi":    	{ forest: 0.2, plains: 0.4, cave: 0.1, iceland: 0.2, mountain: 0.1,  urban: 0.4 },
    "İskelet Şövalye":	{ forest: 0.1, plains: 0.0, cave: 0.2, iceland: 0.0,  mountain: 0.1, urban: 0.6 },
    "Gulyabani":      	{ forest: 0.1, plains: 0.1, cave: 0.2, iceland: 0.2, mountain: 0.3, urban: 0.5 },
	"Göçebe":			{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
	"Göçebe Savaşçı":	{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
	"Göçebe Kültist":	{ forest: 0.1, plains: 0.4, cave: 0.0, iceland: 0.2, mountain: 0.1, urban: 0.6 },
	//Ejderkelam'ı buraya ve yukarıdaki havuza tekrar koymak gerekli mi?
    "Kemik Golemi":   	{ forest: 0.0, plains: 0.2, cave: 0.2, iceland: 0.2,  mountain: 0.4, urban: 0.3 },
// B1
    "Goblin Şefi":    	{ forest: 0.0, plains: 0.2, cave: 0.0, iceland: 0.0, mountain: 0.1, urban: 0.7 }
};

// Savaş dışı node'lar (Town, Choice) için varsayılan ağırlıklar

window.DEFAULT_BIOME_WEIGHTS = { forest: 0.1, plains: 0.1, cave: 0.1, iceland: 0.1, mountain: 0.1, urban: 0.1 };




