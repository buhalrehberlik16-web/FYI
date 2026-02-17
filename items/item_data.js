// item_data.js

window.ITEM_RULES = {
    "jewelry": { badgeType: "tier", canSalvage: true, canTransmute: true, canSynthesize: false, canReforge: true, canEquip: true, lootValue: 1.0, nextTierValue: 1.5  },
    "material": { badgeType: "craft", canSalvage: false, canTransmute: false, canSynthesize: true, canReforge: false, canEquip: false, lootValue: 0.75 },
    "scroll": { badgeType: "craft", canSalvage: false, canTransmute: false, canSynthesize: true, canReforge: true, canEquip: false }, // Scrollar reforge'da kullanılabilir
    "resist_stone": { badgeType: "craft", canSalvage: false, canTransmute: false, canSynthesize: true, canReforge: true, canEquip: false }, // Taşlar reforge'da kullanılabilir
    "charm": { badgeType: "tier", canSalvage: true, canTransmute: false, canSynthesize: false, canReforge: false, canEquip: false },
	"brooch": { badgeType: "tier", canSalvage: true, canTransmute: false, canSynthesize: false, canReforge: false, canEquip: true, lootValue: 2.0, nextTierValue: 2.5 },
	"charm1": { badgeType: "tier", canSalvage: true, canTransmute: false, canSynthesize: false, canReforge: false, canEquip: true, lootValue: 1.5, nextTierValue: 2.0 }
};

window.CHARM_CONFIG = {
    pointsByTier: { 1: 1, 2: 3, 3: 5, 4: 7, 5: 9 },
    
    // TRIBE (KLAN) TABANLI ÖZELLİKLER
    tribes: {
        pool: ["B&M", "Plants", "Undead", "Humans", "Magical Creatures", "Greenskins", "Dragonkind"],
        costs: {
            1: { skillDmg: 3, defense: 1 },
            2: { skillDmg: 6, defense: 2 },
            3: { skillDmg: 9, defense: 3 }
        }
    },

    // ELEMENTAL TABANLI ÖZELLİKLER
    elementals: {
        pool: ["fire", "cold", "lightning", "poison", "curse"],
        costs: {
            1: { elemDmg: 2, resist: 2 },
            2: { elemDmg: 4, resist: 4 },
            3: { elemDmg: 6, resist: 6 }
        }
    },

    // SAF ATAK (Sadece T2 ve T4)
    attack: {
        2: { cost: 3, atk: 2, def: 1 },
        4: { cost: 7, atk: 4, def: 2 }
    }
};

// Broş Puanlama Sistemi
window.BROOCH_CONFIG = {
    pointsByTier: { 1: 4, 2: 6, 3: 8, 4: 10, 5: 12 },
    frequencies: [
        { turns: 1, cost: 3, icon: "brooch_all.webp" },
        { turns: 2, cost: 2, icon: "random" },
        { turns: 3, cost: 1, icon: "random" }
    ],
    // Puan başı kazanımlar: [1 Puan, 2 Puan, 3 Puan]
    effectsPool: [
        { id: "fixed_dmg", values: [2, 3, 4] },
        { id: "stat_scaling", values: [0.25, 0.5, 0.75], stats: ["str", "int", "mp_pow"] },
        { id: "heal", values: [4, 6, 8] },
        { id: "resource_regen", values: [4, 8, 12] },
    ]
};

window.BROOCH_TRIBES = ["Greenskins", "Humans", "B&M", "Plants", "Undead", "Dragonkind", "Magical Creatures"];

window.ITEM_CONFIG = {
    // 1 Puanın kaç stat/resist edeceği (Dengeleme merkezi)
    multipliers: {
        stats: 1,      // 1 Puan = 1 STR/DEX vb.
        resists: 3,     // 1 Puan = 3 Fire/Ice Resist vb.
		//vitToHp: 2  // <--- YENİ: Eşyadan gelen 1 Vit artık 2 HP verecek
    },
    // Havuzlar
    statsPool: ['str', 'dex', 'int', 'vit', 'mp_pow'],
    resistsPool: ['fire', 'cold', 'lightning', 'poison', 'curse']
};

window.BASE_ITEMS = {
    ring: {
        str: { nameKey: "item_ring_str", icon: "accesories/ring_str.webp" },
        dex: { nameKey: "item_ring_dex", icon: "accesories/ring_dex.webp" },
        int: { nameKey: "item_ring_int", icon: "accesories/ring_int.webp" },
        vit: { nameKey: "item_ring_vit", icon: "accesories/ring_vit.webp" },
        mp_pow: { nameKey: "item_ring_mp", icon: "accesories/ring_mp.webp" }
    },
    necklace: {
        str: { nameKey: "item_neck_str", icon: "accesories/neck_str.webp" },
        dex: { nameKey: "item_neck_dex", icon: "accesories/neck_dex.webp" },
        int: { nameKey: "item_neck_int", icon: "accesories/neck_int.webp" },
        vit: { nameKey: "item_neck_vit", icon: "accesories/neck_vit.webp" },
        mp_pow: { nameKey: "item_neck_mp", icon: "accesories/neck_mp.webp" }
    },
    earring: {
        str: { nameKey: "item_ear_str", icon: "accesories/ear_str.webp" },
        dex: { nameKey: "item_ear_dex", icon: "accesories/ear_dex.webp" },
        int: { nameKey: "item_ear_int", icon: "accesories/ear_int.webp" },
        vit: { nameKey: "item_ear_vit", icon: "accesories/ear_vit.webp" },
        mp_pow: { nameKey: "item_ear_mp", icon: "accesories/ear_mp.webp" }
    },
    belt: {
        str: { nameKey: "item_belt_str", icon: "accesories/belt_str.webp" },
        dex: { nameKey: "item_belt_dex", icon: "accesories/belt_dex.webp" },
        int: { nameKey: "item_belt_int", icon: "accesories/belt_int.webp" },
        vit: { nameKey: "item_belt_vit", icon: "accesories/belt_vit.webp" },
        mp_pow: { nameKey: "item_belt_mp", icon: "accesories/belt_mp.webp" }
    }
};

window.BASE_MATERIALS = {
    "jewelry_fragment": {
        nameKey: "salvage_material_name", // Çeviri anahtarı (Takı Parçaları)
        icon: "drop_items/salvage_jewelry.webp",
        type: "material",
        subtype: "material", // Yeni sistem: "C" badge basılmasını sağlar
        isStack: true,
        tier: 1,
        stats: {}
    }
};

window.MERCHANT_CONFIG = {
    // TIER: SATIŞ FİYATI (Oyuncunun sattığı fiyat)
    sellPrices: {
        1: 3,
        2: 4,
        3: 5,
        4: 10,
        5: 15
    },
    // Alış fiyatı çarpanı (Satış fiyatının X katına geri satar)
    buyMultiplier: 4, 
    stockCount: 8 // Dükkanda kaç eşya sergilenecek
};

window.CRAFTING_CONFIG = {
    // Tier başına gereken Jewelry Fragment sayısı
    requiredFragments: {
        1: 5,
        2: 12,
        3: 20,
        4: 28,
        5: 35
    }
};

window.REFORGE_CONFIG = {
    goldCosts: { 1: 10, 2: 20, 3: 30, 4: 40, 5: 50 }
};


// Dükkana özel (takı olmayan) eşya grubu
window.SPECIAL_MERCH_ITEMS = [
    // --- PASİF CHARMLAR (LIZARDS) ---
    { id: "lizard_cold", nameKey: "merch_lizard_cold", icon: "merch_items/lizard_cold.webp", type: "passive_charm", resistType: "cold", tier: 1, stats: {}, subtype: "charm", },
    { id: "lizard_fire", nameKey: "merch_lizard_fire", icon: "merch_items/lizard_fire.webp", type: "passive_charm", resistType: "fire", tier: 1, stats: {}, subtype: "charm", },
    { id: "lizard_lightning", nameKey: "merch_lizard_lightning", icon: "merch_items/lizard_lightning.webp", type: "passive_charm", resistType: "lightning", tier: 1, stats: {}, subtype: "charm", },
    { id: "lizard_curse", nameKey: "merch_lizard_curse", icon: "merch_items/lizard_curse.webp", type: "passive_charm", resistType: "curse", tier: 1, stats: {}, subtype: "charm", },
    { id: "lizard_poison", nameKey: "merch_lizard_poison", icon: "merch_items/lizard_poison.webp", type: "passive_charm", resistType: "poison", tier: 1, stats: {}, subtype: "charm", },

    // --- TYPE SCROLLS (YÜZÜK, KOLYE VB. BELİRLEYİCİLER) ---
    { id: "scroll_ring", nameKey: "item_scroll_ring", icon: "merch_items/ring_scroll.webp", type: "type_scroll", target: "ring", price: 50, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_neck", nameKey: "item_scroll_neck", icon: "merch_items/necklace_scroll.webp", type: "type_scroll", target: "necklace", price: 50, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_ear", nameKey: "item_scroll_ear", icon: "merch_items/earring_scroll.webp", type: "type_scroll", target: "earring", price: 50, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_belt", nameKey: "item_scroll_belt", icon: "merch_items/belt_scroll.webp", type: "type_scroll", target: "belt", price: 50, tier: 1, stats: {}, subtype: "scroll", },

    // --- STAT SCROLLS (STR, DEX VB. BELİRLEYİCİLER) ---
    { id: "scroll_str", nameKey: "item_scroll_str", icon: "merch_items/scroll_str.webp", type: "stat_scroll", target: "str", price: 30, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_dex", nameKey: "item_scroll_dex", icon: "merch_items/scroll_dex.webp", type: "stat_scroll", target: "dex", price: 30, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_int", nameKey: "item_scroll_int", icon: "merch_items/scroll_int.webp", type: "stat_scroll", target: "int", price: 30, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_vit", nameKey: "item_scroll_vit", icon: "merch_items/scroll_vit.webp", type: "stat_scroll", target: "vit", price: 30, tier: 1, stats: {}, subtype: "scroll", },
    { id: "scroll_mp", nameKey: "item_scroll_mp", icon: "merch_items/scroll_mp.webp", type: "stat_scroll", target: "mp_pow", price: 30, tier: 1, stats: {}, subtype: "scroll", },
	
	 // --- RESIST STONES (DİRENÇ TAŞLARI) ---
    { id: "stone_fire", nameKey: "item_stone_fire", icon: "merch_items/fire_resist_stone.webp", type: "resist_stone", target: "fire", price: 40, tier: 1, stats: {}, subtype: "resist_stone", isStack: true, },
    { id: "stone_cold", nameKey: "item_stone_cold", icon: "merch_items/cold_resist_stone.webp", type: "resist_stone", target: "cold", price: 40, tier: 1, stats: {}, subtype: "resist_stone", isStack: true, },
    { id: "stone_lightning", nameKey: "item_stone_lightning", icon: "merch_items/lightning_resist_stone.webp", type: "resist_stone", target: "lightning", price: 40, tier: 1, stats: {}, subtype: "resist_stone", isStack: true, },
    { id: "stone_poison", nameKey: "item_stone_poison", icon: "merch_items/poison_resist_stone.webp", type: "resist_stone", target: "poison", price: 40, tier: 1, stats: {}, subtype: "resist_stone", isStack: true, },
    { id: "stone_curse", nameKey: "item_stone_curse", icon: "merch_items/curse_resist_stone.webp", type: "resist_stone", target: "curse", price: 40, tier: 1, stats: {}, subtype: "resist_stone", isStack: true, }

];
