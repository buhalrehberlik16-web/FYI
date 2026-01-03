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
        str: { nameKey: "item_ring_str", icon: "ring_str.webp" },
        dex: { nameKey: "item_ring_dex", icon: "ring_dex.webp" },
        int: { nameKey: "item_ring_int", icon: "ring_int.webp" },
        vit: { nameKey: "item_ring_vit", icon: "ring_vit.webp" },
        mp_pow: { nameKey: "item_ring_mp", icon: "ring_mp.webp" }
    },
    necklace: {
        str: { nameKey: "item_neck_str", icon: "neck_str.webp" },
        dex: { nameKey: "item_neck_dex", icon: "neck_dex.webp" },
        int: { nameKey: "item_neck_int", icon: "neck_int.webp" },
        vit: { nameKey: "item_neck_vit", icon: "neck_vit.webp" },
        mp_pow: { nameKey: "item_neck_mp", icon: "neck_mp.webp" }
    },
    earring: {
        str: { nameKey: "item_ear_str", icon: "ear_str.webp" },
        dex: { nameKey: "item_ear_dex", icon: "ear_dex.webp" },
        int: { nameKey: "item_ear_int", icon: "ear_int.webp" },
        vit: { nameKey: "item_ear_vit", icon: "ear_vit.webp" },
        mp_pow: { nameKey: "item_ear_mp", icon: "ear_mp.webp" }
    },
    belt: {
        str: { nameKey: "item_belt_str", icon: "belt_str.webp" },
        dex: { nameKey: "item_belt_dex", icon: "belt_dex.webp" },
        int: { nameKey: "item_belt_int", icon: "belt_int.webp" },
        vit: { nameKey: "item_belt_vit", icon: "belt_vit.webp" },
        mp_pow: { nameKey: "item_belt_mp", icon: "belt_mp.webp" }
    }
};