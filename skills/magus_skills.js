const MAGUS_SKILLS = {
    /* fireball, ice_shard vb. */
	// TAB: Arcane 
	
	Magic_Arrow: {
		data: {
			name: "Magic Arrow",
            menuDescription: "Atak değerinin %50'si + MP değerinin %80'i kadar hasar veren, büyüden yaratılmış bir ok fırlatır.",
            rageCost: 15,
            levelReq: 1,
			cooldown: 0,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.5, stat: "mp_pow", statMult: 0.8},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
		}
	Drain: {
		data: {
			name: "Drain",
            menuDescription: "Düşmanın defansını aşarak MP kadar hasar verir ve o kadar Mana kazandırır.",
            rageCost: 35,
            levelReq: 8,
			cooldown: 3,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 3,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 1.0},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
		}
	Arcane_Acuity: {
		data: {
			name: "Arcane Acuity",
            menuDescription: "Karakterin büyüsel yeteneğini odaklar. 4 tur boyunca her tur Int değeri kadar mana verir.",
            rageCost: 20,
            levelReq: 8,
			cooldown: 5,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'utility',
            category: 'arcane', 
            tier: 3,
          // Quick Action
		}
	Arcane_Explosion: {
		data: {
			name: "Arcane Explosion",
            menuDescription: "Düşmana odaklanan bir büyüsel patlama yaratarak Atk+2xMP hasar verir.",
            rageCost: 75,
            levelReq: 15,
			cooldown: 0,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 1.0, stat: "mp_pow", statMult: 2.0},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
		}
	}
	
	// TAB: Elemental
	
	Fire_Bolt: {
		data: {
			name: "Fire Bolt",
            menuDescription: "Ateşten bir ok yaratarak düşmana fırlatır. Str değeri kadar fiziksel, MP değerinin yarısı kadar ateş hasarı verir.",
            rageCost: 20,
            levelReq: 1,
			cooldown: 0,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0},
                elemental: { fire: {stat: "mp_pow", statMult: 0.5}, cold: 0, lightning: 0, poison: 0, curse: 0 }
		}
	Zap: {
		data: {
			name: "Zap",
            menuDescription: "Düşmanın çevresinde bir elektrik alanı oluşturarak Int değerinin %80'i kadar hasar verir ve düşmanın Atk değerini %20 düşürür.",
            rageCost: 25,
            levelReq: 1,
			cooldown: 2,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 1,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 0.0},
                elemental: { fire: 0, cold: 0, lightning: {stat: "mp_pow", statMult: 0.8}, poison: 0, curse: 0 }
		}
	Water_Whip: {
		data: {
			name: "Water Whip",
            menuDescription: "Sudan bir kırbaç oluşturarak düşmana saldırır, Str+MP değeri kadar fiziksel hasar verir.",
            rageCost: 20,
            levelReq: 5,
			cooldown: 0,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 2,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0},
                elemental: { fire: 0, cold: {stat: "mp_pow", statMult: 1.0}, lightning: 0, poison: 0, curse: 0 }
		}
	Ice_Shield: {
		data: {
			name: "Ice Shield",
            menuDescription: "Karakterin çevresinde buzdan bir kalkan oluşturur 2xMP blok.",
            rageCost: 40,
            levelReq: 5,
			cooldown: 2,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 1.0},
            tier: 2,
			// 2xMP blok
		}
	Crystalised_Mana: {
		data: {
			name: "Crystalised Mana",
            menuDescription: "Bir miktar Manayı kristalleştirir. Bu kristal mana daha sonra kullanılabilir.",
            rageCost: 20,
            levelReq: 5,
			cooldown: 2,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 2,
			//"After 2 turns, change this skill to Consume Crystal." demişiz. Mana generator olarak işaretli, 20 mana cost ve 2 tur cd gözüküyor.
		}
	Water_Snare: {
		data: {
			name: "Water Snare",
            menuDescription: "Düşmanı sudan oluşturulmuş bir tuzak içerisine alarak her tur Str değeri kadar hasar verir ve düşman Atk değerini %50 düşürür.",
            rageCost: 25,
            levelReq: 8,
			cooldown: 5,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 3,
            scaling: { 
                physical: { atkMult: 0.0, stat: "str", statMult: 1.0},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
		}
	Chaos_Rain: {
		data: {
			name: "Chaos Rain",
            menuDescription: "Elemental güçlerin düşmana saldırdığı yerel bir fırtına oluşturur. Düşmanın en düşük fire, cold, Lightning resistini etkiler.",
            rageCost: 75,
            levelReq: 15,
			cooldown: 6,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 0.0, stat: "mp_pow", statMult: 0.0},
                elemental: { fire: 0, cold: {atkMult: 2.0}, lightning: {stat: "mp_pow", statMult: 2.0}, poison: 0, curse: 0 }
		}
	// TAB: Nature
	
	Meditate: {
		data: {
			name: "Meditate",
            menuDescription: "Kısa bir meditasyon ile Int değeri + Kayıp HP'nin %50'si kadar Mana kazanır.",
            rageCost: 0,
            levelReq: 1,
			cooldown: 2,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
            tier: 1,
			// Mana gain
		}
	Rejuvanate: {
		data: {
			name: "Rejuvanate",
            menuDescription: "3 tur boyunca her tur boyunca INT değeri kadar HP ve Int değerinin 1,5 katı kadar Mana kazanır.",
            rageCost: 75,
            levelReq: 8,
			cooldown: 0,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'arcane', 
			tier: 3,
        //     
		}
	Natures_Wrath: {
		data: {
			name: "Nature's Wrath",
            menuDescription: "Doğanın güçlerini düşmanın üzerine salar. 3 tur boyunca her tur Atk değeri kadar hasar verir ve düşmanın Atk ve Def değerlerini %50 düşürür.",
            rageCost: 120,
            levelReq: 15,
			cooldown: 7,
            icon: 'skills/common/icon_minor_healing.webp',
            type: 'attack',
            category: 'nature', 
            tier: 5,
            scaling: { 
                physical: { atkMult: 1.0, stat: "mp_pow", statMult: 0.0},
                elemental: { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 }
		}
};