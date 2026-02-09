// js/brooch_generator.js

window.generateRandomBrooch = function(tier) {
    let budget = window.BROOCH_CONFIG.pointsByTier[tier] || 4;
    let brooch = {
        id: "brooch_" + Date.now(),
        type: "brooch",
        subtype: "brooch",
        tier: tier,
        frequency: 3,
        effects: [],
        nameKey: "item_brooch_custom",
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

        // Hedef Stat (Elemental kısımları sildiğimiz için sadece targetStat kaldı)
        const targetStat = (effectBase.stats && effectBase.stats.length > 0) 
            ? effectBase.stats[Math.floor(Math.random() * effectBase.stats.length)] 
            : undefined;

        // --- MERGE LOGIC (BİRLEŞTİRME) ---
        // Artık targetElement kontrolüne gerek yok (sildiğimiz için)
        let existing = brooch.effects.find(e => 
            e.id === effectBase.id && 
            e.targetStat === targetStat
        );

        if (existing) {
            const newTotalPoints = Math.min(3, existing.pointsSpent + spend);
            existing.pointsSpent = newTotalPoints;
            existing.value = effectBase.values[newTotalPoints - 1];
        } else {
            brooch.effects.push({
                id: effectBase.id,
                value: effectBase.values[spend - 1],
                pointsSpent: spend,
                targetStat: targetStat
            });
        }

        budget -= spend;
    }
	
	// --- UZMANLIK ALANI ATAMA (FAILSAFE EKLENDİ) ---
    // Eğer window.BROOCH_TRIBES bulunamazsa oyunun çökmemesi için boş dizi kontrolü yapıyoruz
    const tribes = window.BROOCH_TRIBES || ["Greenskins"]; 
    brooch.specialtyTribe = tribes[Math.floor(Math.random() * tribes.length)];
	
    return brooch;
};