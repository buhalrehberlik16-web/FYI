// js/enemy/ai_manager.js

window.AIManager = {
    lastAction: null,

    determineAction: function(monster, hero, turn) {
        const stats = ENEMY_STATS[monster.name];
        if (turn === 1 && stats.firstTurnAction) return this.saveAndReturn(stats.firstTurnAction);

        let finalActionId = "";
        let safetyCounter = 0;

        while (safetyCounter < 10) {
            // 1. Ana Kategori Ağırlıkları
            let weights = { attack: 50, defend: 20, skill: 30 };
            if (monster.hp / monster.maxHp < 0.4) weights = { attack: 20, defend: 30, skill: 50 };

            const mainChoice = this.weightedRandom(weights);
            let categoryLabel = "";

            // 2. Alt Kategori Seçimi
            if (mainChoice === 'attack') {
                const skillAttacks = stats.skills.filter(s => s.category === 'attack');
                let pool = ['attack1', 'attack2'];
                if (skillAttacks.length > 0) pool.push('skill_attack');
                categoryLabel = pool[Math.floor(Math.random() * pool.length)];
            } 
            else if (mainChoice === 'defend') {
                categoryLabel = 'defend';
            } 
            else {
                const buffs = stats.skills.filter(s => s.category === 'buff');
                const debuffs = stats.skills.filter(s => s.category === 'debuff');
                let pool = [];
                if (buffs.length > 0) pool.push('skill_buff');
                if (debuffs.length > 0) pool.push('skill_debuff');
                
                if (pool.length === 0) { safetyCounter++; continue; }
                categoryLabel = pool[Math.floor(Math.random() * pool.length)];
            }

            // --- KRİTİK DÜZELTME BURASI ---
            // Önce ID'yi netleştiriyoruz
            let tempId = "";
            if (categoryLabel === 'skill_attack') tempId = this.getRandomSkill(stats, 'attack');
            else if (categoryLabel === 'skill_buff') tempId = this.getRandomSkill(stats, 'buff');
            else if (categoryLabel === 'skill_debuff') tempId = this.getRandomSkill(stats, 'debuff');
            else tempId = categoryLabel; // attack1, attack2 veya defend

            // Şimdi kontrol et: Seçtiğimiz ID bir öncekiyle aynı mı?
            // Eğer canavarın toplamda SADECE 1 yeteneği varsa mecburen aynısını yapacak (safetyCounter sayesinde)
            if (tempId !== this.lastAction || safetyCounter > 5) {
                finalActionId = tempId;
                break; 
            }
            safetyCounter++;
        }

        return this.saveAndReturn(finalActionId);
    },

    getRandomSkill: function(stats, category) {
        const list = stats.skills.filter(s => s.category === category);
        // İşte burası senin sorunun cevabı: 
        // Liste içinden (örn: 2 tane debuff varsa) rastgele birini seçer.
        return list[Math.floor(Math.random() * list.length)].id;
    },

    saveAndReturn: function(action) {
        this.lastAction = action;
        return action;
    },

    weightedRandom: function(weights) {
        let total = 0; for (let key in weights) total += weights[key];
        let rand = Math.random() * total;
        let sum = 0;
        for (let key in weights) {
            sum += weights[key];
            if (rand < sum) return key;
        }
        return 'attack1';
    }
};