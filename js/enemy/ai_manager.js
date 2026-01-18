// js/enemy/ai_manager.js

window.AIManager = {
    determineAction: function(monster, hero, turn) {
        const stats = ENEMY_STATS[monster.name];
        const hpPercent = monster.hp / monster.maxHp;
        const isAlreadyDefending = window.isMonsterDefending; // Mevcut savunma durumu

        // --- 1. TEMEL HAVUZ AĞIRLIKLARI ---
        let weights = { attack: 50, defend: 30, skill: 20 };

        if (turn === 1 && stats.firstTurnAction) return stats.firstTurnAction;

        // --- 2. DİNAMİK HP AYARI ---
        if (hpPercent <= 0.3) {
            weights = { attack: 20, defend: 10, skill: 70 };
        } else {
            const loss = 1.0 - hpPercent;
            weights.skill += Math.floor(loss * 50);
            weights.attack -= Math.floor(loss * 25);
            weights.defend -= Math.floor(loss * 25);
        }

        // --- 3. AKILLI FİLTRE: Zaten savunmadaysa defans yapma ---
        if (isAlreadyDefending) {
            weights.attack += weights.defend; // Defans şansını atağa ekle
            weights.defend = 0;               // Defans ihtimalini sıfırla
        }

        const chosenPool = this.weightedRandom(weights);

        if (chosenPool === 'skill') {
            return this.determineWhichSkill(monster, stats.skills, hpPercent, isAlreadyDefending);
        }

        return chosenPool;
    },

    determineWhichSkill: function(monster, skills, hpPercent, isAlreadyDefending) {
        if (!skills || skills.length === 0) return 'attack';

        const utilitySkills = skills.filter(s => s.category === 'utility');
        const survivalSkills = skills.filter(s => s.category === 'survival');

        let skillWeights = { utility: 70, survival: 30 };

        // Can azsa survival ağırlığı artsın
        if (hpPercent <= 0.4) skillWeights = { utility: 30, survival: 70 };

        // AKILLI FİLTRE: Eğer canavar zaten savunma bonusuna sahipse survival basma ihtimalini düşür
        if (isAlreadyDefending && survivalSkills.length > 0) {
            skillWeights.utility = 90;
            skillWeights.survival = 10;
        }

        const chosenCategory = this.weightedRandom(skillWeights);
        let finalPool = chosenCategory === 'survival' ? survivalSkills : utilitySkills;

        if (finalPool.length === 0) finalPool = (chosenCategory === 'survival') ? utilitySkills : survivalSkills;
        if (finalPool.length === 0) return 'attack';

        return finalPool[Math.floor(Math.random() * finalPool.length)].id;
    },

    weightedRandom: function(weights) {
        let total = 0;
        for (let key in weights) total += Math.max(0, weights[key]);
        let rand = Math.random() * total;
        let sum = 0;
        for (let key in weights) {
            sum += weights[key];
            if (rand < sum) return key;
        }
        return 'attack';
    }
};