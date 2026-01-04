// js/ui/item_translation.js

// Türkçe Eşyalar
const TR_ITEMS = {
    // Takı Türleri
    item_ring_str: "Güç Yüzüğü",
    item_ring_dex: "Çeviklik Yüzüğü",
    item_ring_int: "Zeka Yüzüğü",
    item_ring_vit: "Canlılık Yüzüğü",
    item_ring_mp: "Mistik Yüzük",

    item_neck_str: "Güç Kolyesi",
    item_neck_dex: "Hız Kolyesi",
    item_neck_int: "Bilge Kolyesi",
    item_neck_vit: "Yaşam Kolyesi",
    item_neck_mp: "Mana Muskası",

    item_ear_str: "Kudret Küpesi",
    item_ear_dex: "Rüzgar Küpesi",
    item_ear_int: "Büyülü Küpe",
    item_ear_vit: "Dayanıklı Küpe",
    item_ear_mp: "Ruh Küpesi",

    item_belt_str: "Dev Kemeri",
    item_belt_dex: "Hafif Kemer",
    item_belt_int: "Kahin Kemeri",
    item_belt_vit: "Zırhlı Kemer",
    item_belt_mp: "Efsunlu Kemer",
	
	merch_lizard_cold: "Donmuş Kertenkele Gözü",
	merch_lizard_fire: "Alevli Kertenkele Gözü",
	merch_lizard_lightning: "Elektrikli Kertenkele Gözü",
	merch_lizard_physical: "Zırhlı Kertenkele Gözü",
	merch_lizard_curse: "Lanetli Kertenkele Gözü",
	merch_lizard_poison: "Zehirli Kertenkele Gözü",

    // Stat Görüntü İsimleri (Tooltip için)
    stat_str: "Güç (STR)",
    stat_dex: "Çeviklik (DEX)",
    stat_int: "Zeka (INT)",
    stat_vit: "Canlılık (VIT)",
    stat_mp_pow: "Büyü Gücü (MP)",
    res_physical: "Fiziksel Direnç",
    res_fire: "Ateş Direnci",
    res_cold: "Buz Direnci",
    res_lightning: "Yıldırım Direnci",
    res_poison: "Zehir Direnci",
    res_curse: "Lanet Direnci",
    
    tier_label: "Seviye",
	likely_stat: "Baskın Özellik",
	expected_tier: "Beklenen Seviye",
	tier_odds: "Seviye Olasılığı",
        result_type_odds: "Tür Olasılığı",
        crit_chance_label: "Kritik Şans",
        waiting_ingredients: "3 Eşya Yerleştirin...",
		waiting_salvage_ingredients: "Takı Yerleştirin..",
        type_ring: "Yüzük",
        type_necklace: "Kolye",
        type_earring: "Küpe",
        type_belt: "Kemer",
		salvage_material_name: "Takı Parçaları",
		salvage_yield: "Olası Kazanç",
};

// İngilizce Eşyalar
const EN_ITEMS = {
    item_ring_str: "Ring of Strength",
    item_ring_dex: "Ring of Dexterity",
    item_ring_int: "Ring of Intelligence",
    item_ring_vit: "Ring of Vitality",
    item_ring_mp: "Mystic Ring",

    item_neck_str: "Necklace of Might",
    item_neck_dex: "Necklace of Agility",
    item_neck_int: "Necklace of Wisdom",
    item_neck_vit: "Necklace of Life",
    item_neck_mp: "Mana Amulet",

    item_ear_str: "Earring of Power",
    item_ear_dex: "Earring of Wind",
    item_ear_int: "Magical Earring",
    item_ear_vit: "Sturdy Earring",
    item_ear_mp: "Spirit Earring",

    item_belt_str: "Giant's Belt",
    item_belt_dex: "Light Belt",
    item_belt_int: "Seer's Belt",
    item_belt_vit: "Plated Belt",
    item_belt_mp: "Enchanted Belt",
	
	merch_lizard_cold: "Frozen Lizard Eye",
	merch_lizard_fire: "Fiery Lizard Eye",
	merch_lizard_lightning: "Electric Lizard Eye",
	merch_lizard_physical: "Armored Lizard Eye",
	merch_lizard_curse: "Cursed Lizard Eye",
	merch_lizard_poison: "Poisonous Lizard Eye",

    stat_str: "Strength (STR)",
    stat_dex: "Dexterity (DEX)",
    stat_int: "Intelligence (INT)",
    stat_vit: "Vitality (VIT)",
    stat_mp_pow: "Magic Power (MP)",
    res_physical: "Physical Resist",
    res_fire: "Fire Resist",
    res_cold: "Cold Resist",
    res_lightning: "Lightning Resist",
    res_poison: "Poison Resist",
    res_curse: "Curse Resist",
    
    tier_label: "TIER",
	likely_stat: "Likely Attribute",
	expected_tier: "Expected Tier",
	tier_odds: "Tier Odds",
        result_type_odds: "Type Odds",
        crit_chance_label: "Crit Chance",
        waiting_ingredients: "Place 3 Items...",
		waiting_salvage_ingredients: "Place Jewelry...",
        type_ring: "Ring",
        type_necklace: "Necklace",
        type_earring: "Earring",
        type_belt: "Belt",
		salvage_material_name: "Jewelry Fragments",
		salvage_yield: "Possible Yield",
};

// Mevcut dile bu listeleri enjekte et
// Bu yöntemle ana translations.js dosyasını bozmadan genişletiriz
Object.assign(window.LANGUAGES.tr, { items: TR_ITEMS });
Object.assign(window.LANGUAGES.en, { items: EN_ITEMS });