// item_data.js

window.ITEM_CONFIG = {
    // 1 Puanın kaç stat/resist edeceği (Dengeleme merkezi)
    multipliers: {
        stats: 1,      // 1 Puan = 1 STR/DEX vb.
        resists: 3,     // 1 Puan = 3 Fire/Ice Resist vb.
		vitToHp: 2  // <--- YENİ: Eşyadan gelen 1 Vit artık 2 HP verecek
    },
    // Havuzlar
    statsPool: ['str', 'dex', 'int', 'vit', 'mp_pow'],
    resistsPool: ['physical', 'fire', 'cold', 'lightning', 'poison', 'curse']
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
        2: 15,
        3: 30,
        4: 60,
        5: 120
    }
};


// Dükkana özel (takı olmayan) eşya grubu
window.SPECIAL_MERCH_ITEMS = [
    // --- PASİF CHARMLAR (LIZARDS) ---
    { id: "lizard_cold", nameKey: "merch_lizard_cold", icon: "merch_items/lizard_cold.webp", type: "passive_charm", resistType: "cold", tier: 1, stats: {} },
    { id: "lizard_fire", nameKey: "merch_lizard_fire", icon: "merch_items/lizard_fire.webp", type: "passive_charm", resistType: "fire", tier: 1, stats: {} },
    { id: "lizard_lightning", nameKey: "merch_lizard_lightning", icon: "merch_items/lizard_lightning.webp", type: "passive_charm", resistType: "lightning", tier: 1, stats: {} },
    { id: "lizard_physical", nameKey: "merch_lizard_physical", icon: "merch_items/lizard_physical.webp", type: "passive_charm", resistType: "physical", tier: 1, stats: {} },
    { id: "lizard_curse", nameKey: "merch_lizard_curse", icon: "merch_items/lizard_curse.webp", type: "passive_charm", resistType: "curse", tier: 1, stats: {} },
    { id: "lizard_poison", nameKey: "merch_lizard_poison", icon: "merch_items/lizard_poison.webp", type: "passive_charm", resistType: "poison", tier: 1, stats: {} },

    // --- TYPE SCROLLS (YÜZÜK, KOLYE VB. BELİRLEYİCİLER) ---
    { id: "scroll_ring", nameKey: "item_scroll_ring", icon: "merch_items/ring_scroll.webp", type: "type_scroll", target: "ring", price: 50, tier: 1, stats: {} },
    { id: "scroll_neck", nameKey: "item_scroll_neck", icon: "merch_items/necklace_scroll.webp", type: "type_scroll", target: "necklace", price: 50, tier: 1, stats: {} },
    { id: "scroll_ear", nameKey: "item_scroll_ear", icon: "merch_items/earring_scroll.webp", type: "type_scroll", target: "earring", price: 50, tier: 1, stats: {} },
    { id: "scroll_belt", nameKey: "item_scroll_belt", icon: "merch_items/belt_scroll.webp", type: "type_scroll", target: "belt", price: 50, tier: 1, stats: {} },

    // --- STAT SCROLLS (STR, DEX VB. BELİRLEYİCİLER) ---
    { id: "scroll_str", nameKey: "item_scroll_str", icon: "merch_items/scroll_str.webp", type: "stat_scroll", target: "str", price: 30, tier: 1, stats: {} },
    { id: "scroll_dex", nameKey: "item_scroll_dex", icon: "merch_items/scroll_dex.webp", type: "stat_scroll", target: "dex", price: 30, tier: 1, stats: {} },
    { id: "scroll_int", nameKey: "item_scroll_int", icon: "merch_items/scroll_int.webp", type: "stat_scroll", target: "int", price: 30, tier: 1, stats: {} },
    { id: "scroll_vit", nameKey: "item_scroll_vit", icon: "merch_items/scroll_vit.webp", type: "stat_scroll", target: "vit", price: 30, tier: 1, stats: {} },
    { id: "scroll_mp", nameKey: "item_scroll_mp", icon: "merch_items/scroll_mp.webp", type: "stat_scroll", target: "mp_pow", price: 30, tier: 1, stats: {} }
];