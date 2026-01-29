window.generateRandomItem = function(tier) {
    const types = Object.keys(window.BASE_ITEMS);
    const type = types[Math.floor(Math.random() * types.length)];
    const mainStats = Object.keys(window.BASE_ITEMS[type]);
    const mainStat = mainStats[Math.floor(Math.random() * mainStats.length)];
    
    const baseTemplate = window.BASE_ITEMS[type][mainStat];
    
    let newItem = {
        id: "item_" + Date.now() + "_" + Math.floor(Math.random() * 1000),
        subtype: "jewelry", // <--- KRİTİK EKLEME: Artık kurallar buradan okunacak
        nameKey: baseTemplate.nameKey, 
        type: type,
        tier: tier,
        icon: baseTemplate.icon,
        stats: {}, 
        propertyKeys: [mainStat] 
    };

    // Stat puanı dağıtımı (Mevcut mantığın aynı kalıyor)
    newItem.stats[mainStat] = window.ITEM_CONFIG.multipliers.stats;

    let remainingPoints = Math.max (1, Math.floor (tier*2)-1.5)-1;

    while (remainingPoints > 0) {
        const shouldAddNew = Math.random() < 0.4 && newItem.propertyKeys.length < 3;

        if (shouldAddNew) {
            const allPossible = [...window.ITEM_CONFIG.statsPool, ...window.ITEM_CONFIG.resistsPool];
            const filtered = allPossible.filter(p => !newItem.propertyKeys.includes(p));
            const newKey = filtered[Math.floor(Math.random() * filtered.length)];
            
            newItem.propertyKeys.push(newKey);
            
            const isResist = window.ITEM_CONFIG.resistsPool.includes(newKey);
            const mult = isResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
            
            newItem.stats[newKey] = mult;
        } else {
            const randomKey = newItem.propertyKeys[Math.floor(Math.random() * newItem.propertyKeys.length)];
            
            const isResist = window.ITEM_CONFIG.resistsPool.includes(randomKey);
            const mult = isResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
            
            newItem.stats[randomKey] = (newItem.stats[randomKey] || 0) + mult;
        }
        remainingPoints--;
    }

    // ARTIK BURADA 'rules' tanımlamaya gerek yok, sistem subtype'dan bulacak.
    return newItem;

};
