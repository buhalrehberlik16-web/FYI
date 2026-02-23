// --- START OF FILE enemy_data.js ---

window.TRIBE_BASES = {
	// Ortalamada her triba +6, sadece dragonkind +10 ile daha dayanıklı
    "Greenskins": { fire: 2, cold: 2, lightning: -2, poison: 2, curse: 2 },
    "Humans": { fire: 3, cold: 3, lightning: 3, poison: 1, curse: -4 },
    //"Beasts&Monstrosities"
    "B&M": { fire: -1, cold: 5, lightning: 2, poison: 0, curse: 0 },
    "Plants": { fire: -2, cold: 0, lightning: 0, poison: 6, curse: 2 },
    "Undead": { fire: -2, cold: 2, lightning: -2, poison: 8, curse: 0 },
    "Dragonkind": { fire: 3, cold: 3, lightning: 2, poison: 1, curse: 1 },
    "Magical Creatures": { fire: 4, cold: 4, lightning: 4, poison: 0, curse: -6 }
};

window.ENEMY_STATS = {
    // --- TIER 1 ---
    "Zehirli Mantar": { 
        tribe: "Plants",
        specificResists: { poison: 20 },
        maxHp: 36, attack: 4, defense: 2, xp: 0, tier: 1, 
        idle: 'enemies/zehirli_mantar.webp',
        attackFrames: ['enemies/zehirli_mantar_attack1.webp', 'enemies/zehirli_mantar_attack2.webp', 'enemies/zehirli_mantar_attack3.webp'],
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
    "Orman Örümceği": { 
        tribe: "B&M",
        specificResists: { poison: 20 },
        maxHp: 34, attack: 9, defense: 0, xp: 0, tier: 1, 
        idle: 'enemies/orman_orumcegi.webp',
        attackFrames: ['enemies/orman_orumcegi_attack1.webp', 'enemies/orman_orumcegi_attack2.webp', 'enemies/orman_orumcegi_attack3.webp'],
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
                value: 5, 
                duration: 3, 
                textKey: "harden" 
            },
            { 
                id: "poison_bite", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 0.5, poison: 1.2 }, 
                textKey: "poison_bite" 
            }, 
        ]
    },
    "Hırsız Kobold": {
        tribe: "Dragonkind",
        specificResists: { fire: 10, curse: 10 },
        maxHp: 36, attack: 7, defense: 0, xp: 0, tier: 1, 
        idle: 'enemies/hirsiz_kobold.webp',
        attackFrames: ['enemies/hirsiz_kobold_attack1.webp', 'enemies/hirsiz_kobold_attack2.webp'],
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
                duration: 1, 
                textKey: "dash" 
            }
        ]
    },
    "Kan Yarasası": { 
        tribe: "B&M",
        specificResists: { poison: 20 },
        maxHp: 24, attack: 8, defense: 0, xp: 0, tier: 1, 
        idle: 'enemies/kan_yarasasi.webp',
        attackFrames: ['enemies/kan_yarasasi_attack1.webp', 'enemies/kan_yarasasi_attack2.webp'], 
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
                value: 20, 
                textKey: "shriek" 
            }
        ]
    },
    "İskelet": { 
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 30, attack: 6, defense: 3, xp: 0, tier: 1, 
        idle: 'enemies/skeleton_idle.webp',
        attackFrames: ['enemies/skeleton_attack1.webp', 'enemies/skeleton_attack2.webp', 'enemies/skeleton_attack3.webp'], 
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

    // --- TIER 2 ---
    "Goblin Devriyesi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 70, attack: 12, defense: 6, xp: 0, tier: 2, 
        idle: 'enemies/goblin_devriyesi.webp',
        attackFrames: ['enemies/goblin_devriyesi_attack1.webp', 'enemies/goblin_devriyesi_attack2.webp'],
        dead: 'enemies/goblin_devriyesi_dead.webp',
        skills: [
            { 
                id: "goblin_yell", 
                template: "self_buff", 
                category: "buff",
                statusId: "atk_up", 
                value: 7, 
                duration: 3, 
                textKey: "yell" 
            }, 
            { 
                id: "shield_wall", 
                template: "self_buff", 
                category: "buff",
                statusId: "def_up", 
                value: 6, 
                duration: 2, 
                textKey: "shield_wall" 
            }
        ]
    },
    "Kaçak Haydut": { 
        tribe: "Humans",
        specificResists: { cold: 10 },
        maxHp: 62, attack: 15, defense: 4, xp: 0, tier: 2, 
        idle: 'enemies/kacak_haydut.webp',
        attackFrames: ['enemies/kacak_haydut_attack1.webp', 'enemies/kacak_haydut_attack2.webp', 'enemies/kacak_haydut_attack3.webp', 'enemies/kacak_haydut_attack4.webp'],
        dead: 'enemies/kacak_haydut_dead.webp',
        skills: [
            { 
                id: "dirty_strike", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { physical: 1.5 }, 
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
			{ 
                id: "fire_bomb", 
                template: "special_attack", 
                category: "attack",
                damageSplit: { fire: 1.0}, 
				dotType: "fire", 
				duration: 2,
				tickMult: 0.5,           // Her tur ne kadar vuracağını belirler  
                textKey: "f_bomb" 
			}
        ]
    },
    "Gri Kurt": { 
        tribe: "B&M",
        specificResists: { cold: 20 },
        maxHp: 56, attack: 16, defense: 4, xp: 0, tier: 2, 
        idle: 'enemies/kurt_surusu.webp',
        attackFrames: ['enemies/kurt_surusu_attack1.webp', 'enemies/kurt_surusu_attack2.webp', 'enemies/kurt_surusu_attack3.webp'],
        dead: 'enemies/kurt_surusu_dead.webp',
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

    // --- TIER 3 ---
    "Yaban Domuzu": { 
        tribe: "B&M",
        specificResists: { cold: 10 },
        maxHp: 120, attack: 25, defense: 12, xp: 0, tier: 3, 
        idle: 'enemies/yaban_domuzu.webp',
        attackFrames: ['enemies/yaban_domuzu_attack1.webp', 'enemies/yaban_domuzu_attack2.webp', 'enemies/yaban_domuzu_attack3.webp'],
        dead: 'enemies/yaban_domuzu_dead.webp',
        skills: [
            { 
                id: "trample", 
                template: "stat_debuff", 
                category: "debuff",
                subtype: "debuff_enemy_def", 
                value: 0.5, 
                duration: 1, 
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
    "Goblin Savaşçısı": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 100, attack: 30, defense: 15, xp: 0, tier: 3, 
        idle: 'enemies/goblin_savascisi.webp',
        attackFrames: ['enemies/goblin_savascisi_attack1.webp', 'enemies/goblin_savascisi_attack2.webp'],
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
    "Kaya Golemi": { 
        tribe: "Magical Creatures",
        specificResists: { lightning: 10 },
        maxHp: 150, attack: 18, defense: 23, xp: 0, tier: 3, 
        idle: 'enemies/kaya_golemi.webp',
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp', 'enemies/kaya_golemi_attack3.webp', 'enemies/kaya_golemi_attack4.webp'],
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
    "Orc Fedaisi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 200, attack: 40, defense: 21, xp: 0, tier: 4, 
        idle: 'enemies/orc_fedaisi.webp',
        attackFrames: ['enemies/orc_fedaisi_attack1.webp', 'enemies/orc_fedaisi_attack2.webp'],
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

    // --- BOSS ---
    "Goblin Şefi": { 
        tribe: "Greenskins",
        specificResists: { cold: 10 },
        maxHp: 250, attack: 35, defense: 20, isBoss:true, tier: 4, 
        idle: 'enemies/goblin_sef.webp',
        attackFrames: ['enemies/goblin_sef_attack1.webp', 'enemies/goblin_sef_attack2.webp'],
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

// Düşman Havuzları
window.TIER_ENEMIES = {
    1: ["Zehirli Mantar", "Orman Örümceği", "Hırsız Kobold", "Kan Yarasası", "İskelet"],
    2: ["Goblin Devriyesi", "Kaçak Haydut", "Gri Kurt"],
    3: ["Yaban Domuzu", "Goblin Savaşçısı", "Kaya Golemi"],
    "B1": ["Goblin Şefi"], //Boss
    4: ["İskelet Şövalye", "Gulyabani", "Kemik Golemi", "Orc Fedaisi"], 
    5: [], 
    6: [],
    "B2": [],
    7: [],
    8: [],
    9: [],
    "B3": [],
    10: []
};

Object.assign(ENEMY_STATS, {
    "İskelet Şövalye": { 
        tribe: "Undead",
        specificResists: { cold: 10 },
        maxHp: 230, attack: 30, defense: 25, tier: 4, 
        idle: 'enemies/skeleton_idle.webp', 
        attackFrames: ['enemies/skeleton_attack1.webp', 'enemies/skeleton_attack2.webp', 'enemies/skeleton_attack3.webp'], 
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
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'],
        skills: [{ id: "paralyzing_claws", template: "stat_debuff", category: "debuff", subtype: "stun", duration: 1, textKey: "paralyzed" }]
    },
    "Kemik Golemi": { 
        tribe: "Magical Creatures",
        specificResists: { cold: 10 },
        maxHp: 300, attack: 28, defense: 20, tier: 4, 
        idle: 'enemies/kaya_golemi.webp', dead: 'enemies/kaya_golemi_dead.webp', 
        attackFrames: ['enemies/kaya_golemi_attack1.webp', 'enemies/kaya_golemi_attack2.webp'],
        skills: [{ id: "marrow_drain", template: "special_attack", category: "attack", damageSplit: { physical: 0.3, curse: 1.0 }, healPercent: 0.7, textKey: "marrow" }]
    }
});

window.BIOME_WEIGHTS = {
    // Düşman İsmi: { biyom_adi: ihtimal_orani }
    "Zehirli Mantar": { forest: 0.6, plains: 0.1, cave: 0.15, iceland: 0, mountain: 0.15, urban: 0.0 },
    "Orman Örümceği": { forest: 0.5, plains: 0.1, cave: 0.3, iceland: 0, mountain: 0.1, urban: 0.0 },
    "Hırsız Kobold":  { forest: 0.2, plains: 0.5, cave: 0.0, iceland: 0, mountain: 0.1, urban: 0.2 },
    "Kan Yarasası":   { forest: 0.1, plains: 0.05,cave: 0.5, iceland: 0.05, mountain: 0.1, urban: 0.2,  },
    "İskelet":        { forest: 0.1, plains: 0.1, cave: 0.3, iceland: 0.0, mountain: 0.1, urban: 0.4 },
    "Goblin Devriyesi": { forest: 0.4, plains: 0.4, cave: 0.0, iceland: 0.0, mountain: 0.1,  urban: 0.1},
    "Kaçak Haydut":   { forest: 0.1, plains: 0.3, cave: 0.0, iceland: 0.0, mountain: 0.1, urban: 0.5},
    "Gri Kurt":       { forest: 0.3, plains: 0.2, cave: 0.0, iceland: 0.4,  mountain: 0.1,  urban: 0.0 },
    "Yaban Domuzu":   { forest: 0.4, plains: 0.4, cave: 0.0, iceland: 0.1, mountain: 0.1, urban: 0.0 },
    "Goblin Savaşçısı": { forest: 0.2, plains: 0.3, cave: 0.1, iceland: 0.0, mountain: 0.1, urban: 0.3 },
    "Kaya Golemi":    {  forest: 0.0, plains: 0.1, cave: 0.3, iceland: 0.0,  mountain: 0.6, urban: 0.0 },
    "İskelet Şövalye": { forest: 0.1, plains: 0.0, cave: 0.2, iceland: 0.0,  mountain: 0.1, urban: 0.6 },
    "Gulyabani":      { forest: 0.1,  plains: 0.0, cave: 0.4, iceland: 0.0, mountain: 0.1, urban: 0.4 },
    "Orc Fedaisi":    { forest: 0.1, plains: 0.2, cave: 0.0, iceland: 0.0, mountain: 0.4, urban: 0.3 },
    "Kemik Golemi":   { forest: 0.0, plains: 0.0, cave: 0.4, iceland: 0.0, mountain: 0.2, urban: 0.4 },
    "Goblin Şefi":    { forest: 0.0, plains: 0.2, cave: 0.0, iceland: 0.0, mountain: 0.1, urban: 0.7 }
};

// Savaş dışı node'lar (Town, Choice) için varsayılan ağırlıklar

window.DEFAULT_BIOME_WEIGHTS = { forest: 0.2, plains: 0.2, cave: 0.1, iceland: 0.1, mountain: 0.2, urban: 0.2 };




