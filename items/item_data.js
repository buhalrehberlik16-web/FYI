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
        str: { nameKey: "item_ring_str", icon: "ring_str.png" },
        dex: { nameKey: "item_ring_dex", icon: "ring_dex.png" },
        int: { nameKey: "item_ring_int", icon: "ring_int.png" },
        vit: { nameKey: "item_ring_vit", icon: "ring_vit.png" },
        mp_pow: { nameKey: "item_ring_mp", icon: "ring_mp.png" }
    },
    necklace: {
        str: { nameKey: "item_neck_str", icon: "neck_str.png" },
        dex: { nameKey: "item_neck_dex", icon: "neck_dex.png" },
        int: { nameKey: "item_neck_int", icon: "neck_int.png" },
        vit: { nameKey: "item_neck_vit", icon: "neck_vit.png" },
        mp_pow: { nameKey: "item_neck_mp", icon: "neck_mp.png" }
    },
    earring: {
        str: { nameKey: "item_ear_str", icon: "ear_str.png" },
        dex: { nameKey: "item_ear_dex", icon: "ear_dex.png" },
        int: { nameKey: "item_ear_int", icon: "ear_int.png" },
        vit: { nameKey: "item_ear_vit", icon: "ear_vit.png" },
        mp_pow: { nameKey: "item_ear_mp", icon: "ear_mp.png" }
    },
    belt: {
        str: { nameKey: "item_belt_str", icon: "belt_str.png" },
        dex: { nameKey: "item_belt_dex", icon: "belt_dex.png" },
        int: { nameKey: "item_belt_int", icon: "belt_int.png" },
        vit: { nameKey: "item_belt_vit", icon: "belt_vit.png" },
        mp_pow: { nameKey: "item_belt_mp", icon: "belt_mp.png" }
    }
};