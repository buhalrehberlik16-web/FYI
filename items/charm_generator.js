// items/charm_generator.js
window.generateRandomCharm = function(tier) {
    let budget = window.CHARM_CONFIG.pointsByTier[tier] || 1;
    let charm = {
        id: "charm_" + Date.now() + "_" + Math.floor(Math.random()*1000),
        type: "charm1",
        subtype: "charm1",
        tier: tier,
        stats: {}, // BOŞ BAŞLA
        bonuses: [],
        nameKey: "",
        icon: ""
    };

    let category = "tribe";
    const rand = Math.random();
    if ((tier === 2 || tier === 4) && rand < 0.20) category = "attack";
    else if (rand < 0.60) category = "elemental";
    else category = "tribe";

    if (category === "attack") {
        const conf = window.CHARM_CONFIG.attack[tier];
        charm.stats = { atk: conf.atk, def: conf.def }; // Sadece burada atk/def ekle
        charm.nameKey = "charm_attack";
        charm.icon = "charm/charm_attack.webp";
        return charm;
    } 
    else if (category === "elemental") { 
        const el = window.CHARM_CONFIG.elementals.pool[Math.floor(Math.random()*5)];
        charm.nameKey = `charm_${el}`;
        charm.icon = `charm/charm_${el}.webp`;
        
        while (budget > 0) {
            let spend = Math.min(budget, Math.floor(Math.random() * 3) + 1);
            const data = window.CHARM_CONFIG.elementals.costs[spend];
            
            // 1. Stat (Resist) ekle
            charm.stats[el] = (charm.stats[el] || 0) + data.resist;
            
            // 2. Bonus (Hasar) ekle
            let b = charm.bonuses.find(x => x.type === 'elemDmg');
            if(b) b.value += data.elemDmg;
            else charm.bonuses.push({ type: 'elemDmg', element: el, value: data.elemDmg });
            
            budget -= spend;
        }
    } 
    else {
        const tr = window.CHARM_CONFIG.tribes.pool[Math.floor(Math.random()*7)];
        const iconMap = { "B&M": "beast", "Plants": "plants", "Undead": "undead", "Humans": "humans", "Magical Creatures": "magical", "Greenskins": "greenskins", "Dragonkind": "dragonkin" };
        charm.nameKey = `charm_${iconMap[tr]}`;
        charm.icon = `charm/charm_${iconMap[tr]}.webp`;
        charm.targetTribe = tr;
        while (budget > 0) {
            let spend = Math.min(budget, Math.floor(Math.random() * 3) + 1);
            const data = window.CHARM_CONFIG.tribes.costs[spend];
            let b = charm.bonuses.find(x => x.type === 'tribe_mod');
            if(b) { b.skillDmg += data.skillDmg; b.defense += data.defense; }
            else charm.bonuses.push({ type: 'tribe_mod', tribe: tr, skillDmg: data.skillDmg, defense: data.defense });
            budget -= spend;
        }
    }
    return charm;
};

// Hile/Test Fonksiyonu
window.charmver = function(tier = 1) {
    const newItem = generateRandomCharm(tier);
    const emptySlot = hero.inventory.indexOf(null);
    if (emptySlot !== -1) {
        hero.inventory[emptySlot] = newItem;
        renderInventory();
        writeLog(`✨ Hile: T${tier} Tılsım üretildi.`);
    } else {
		const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
        window.showAlert(lang.bag_full_msg);
    }
};