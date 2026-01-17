// js/ai_manager.js

window.AIManager = {
    determineAction: function(monster, hero, turn) {
        const stats = ENEMY_STATS[monster.name];
        const hpPercent = monster.hp / monster.maxHp;
        
        // --- 1. HAVUZ SEÇİMİ (Atak, Defans, Skill) ---
        let weights = { attack: 50, defend: 30, skill: 20 };

        // Özel Durum: Turn 1 kuralları (Mantar örneği gibi)
        if (turn === 1 && stats.firstTurnAction) {
            return stats.firstTurnAction; // Doğrudan skill döndür
        }

        // Dinamik Hesaplama:
        if (hpPercent <= 0.3) {
            // Kritik Durum: Skill %80'e fırlar
            weights = { attack: 10, defend: 10, skill: 80 };
        } else {
            // %100 - %30 Arası Doğrusal Artış:
            // Her %10 kayıpta (0.1) skill şansını yaklaşık %10 artır
            const loss = 1.0 - hpPercent;
            const boost = Math.floor(loss * 100); 
            weights.skill += boost;
            weights.attack -= (boost / 2);
            weights.defend -= (boost / 2);
        }

        // Zarı at
        const chosenPool = this.weightedRandom(weights);

        // --- 2. SKILL SEÇİMİ (Eğer Pool 'skill' çıktıysa) ---
        if (chosenPool === 'skill') {
            return this.determineWhichSkill(stats.skills, hpPercent);
        }

        return chosenPool;
    },

    determineWhichSkill: function(skills, hpPercent) {
    // GÜVENLİK KONTROLÜ: Eğer canavarın hiç skilli tanımlanmamışsa
    if (!skills || !Array.isArray(skills) || skills.length === 0) {
        console.warn("UYARI: Bu canavarın skilleri tanımlanmamış!");
        return 'attack'; 
    }

    // Skilleri Utility ve Survival olarak ayırıyoruz
    const utilitySkills = skills.filter(s => s.category === 'utility');
    const survivalSkills = skills.filter(s => s.category === 'survival');

    let skillWeights = { utility: 70, survival: 30 };

    if (hpPercent <= 0.4) {
        skillWeights = { utility: 20, survival: 80 };
    }

    const chosenCategory = this.weightedRandom(skillWeights);
    let finalPool = chosenCategory === 'survival' ? survivalSkills : utilitySkills;

    // Eğer seçilen kategoride (örn: survival) hiç skill yoksa, diğer havuzu kullan
    if (finalPool.length === 0) {
        finalPool = (chosenCategory === 'survival') ? utilitySkills : survivalSkills;
    }

    // Eğer her iki havuz da boşsa (canavarda hiç skill yoksa) düz atak dön
    if (finalPool.length === 0) return 'attack';

    // Rastgele bir skill seç
    const selected = finalPool[Math.floor(Math.random() * finalPool.length)];
    return selected.id;
},

    weightedRandom: function(weights) {
        let total = 0;
        for (let key in weights) total += Math.max(0, weights[key]); // Negatif olmasın
        let rand = Math.random() * total;
        let sum = 0;
        for (let key in weights) {
            sum += weights[key];
            if (rand < sum) return key;
        }
        return 'attack';
    }
};