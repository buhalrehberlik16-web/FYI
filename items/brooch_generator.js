// js/brooch_generator.js

window.generateRandomBrooch = function(tier) {
    let budget = window.BROOCH_CONFIG.pointsByTier[tier] || 4;
    let brooch = {
        id: "brooch_" + Date.now(),
        type: "brooch",
        subtype: "brooch", // Kurallar takılarla aynı
        tier: tier,
        frequency: 3,
        effects: [],
        nameKey: "item_brooch_custom", // Çeviriye eklenecek
        icon: ""
    };

    // 1. Frekans Seçimi
    const possibleFreqs = window.BROOCH_CONFIG.frequencies.filter(f => f.cost <= budget);
    const chosenFreq = possibleFreqs[Math.floor(Math.random() * possibleFreqs.length)];
    brooch.frequency = chosenFreq.turns;
    budget -= chosenFreq.cost;

    // İkon Belirleme
    if (chosenFreq.icon !== "random") {
        brooch.icon = `brooch/${chosenFreq.icon}`;
    } else {
        const icons = ["brooch_str.webp", "brooch_dex.webp", "brooch_int.webp", "brooch_vit.webp", "brooch_mp.webp"];
        brooch.icon = `brooch/${icons[Math.floor(Math.random() * icons.length)]}`;
    }

    // 2. Efekt Dağıtımı
     while (budget > 0) {
        const effectBase = window.BROOCH_CONFIG.effectsPool[Math.floor(Math.random() * window.BROOCH_CONFIG.effectsPool.length)];
        
        // Kaç puan harcayalım?
        const spend = Math.min(budget, Math.floor(Math.random() * 3) + 1);

        // Hedefleri belirle (Stat veya Element)
        const targetStat = effectBase.stats ? effectBase.stats[Math.floor(Math.random() * effectBase.stats.length)] : undefined;
        const targetElement = effectBase.elements ? effectBase.elements[Math.floor(Math.random() * effectBase.elements.length)] : undefined;

        // --- MERGE LOGIC (BİRLEŞTİRME) ---
        // Eğer aynı ID ve aynı hedefe (örn: STR veya FIRE) sahip efekt varsa üzerine ekle
        let existing = brooch.effects.find(e => 
            e.id === effectBase.id && 
            e.targetStat === targetStat && 
            e.targetElement === targetElement
        );

        if (existing) {
            // Puanları topla (Max 3 puan kuralına göre sınırla)
            const newTotalPoints = Math.min(3, existing.pointsSpent + spend);
            existing.pointsSpent = newTotalPoints;
            // Değeri konfigürasyondaki tabloya göre güncelle (1 p: 4, 2 p: 8, 3 p: 12 gibi)
            existing.value = effectBase.values[newTotalPoints - 1];
        } else {
            // Eğer yoksa yeni bir node olarak ekle
            brooch.effects.push({
                id: effectBase.id,
                value: effectBase.values[spend - 1],
                pointsSpent: spend,
                targetStat: targetStat,
                targetElement: targetElement
            });
        }

        budget -= spend;
    }

    return brooch;
};