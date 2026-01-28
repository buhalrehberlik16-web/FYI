// js/loot_manager.js

window.LootManager = {
    generateLoot: function(monster) {
        let rewards = [];
        
        // 1. TIER SAYISALLAŞTIRMA (B1 -> 4, B2 -> 8 gibi)
        let monsterTier = monster.tier;
        if (typeof monsterTier === 'string' && monsterTier.startsWith('B')) {
            let actNum = parseInt(monsterTier.replace('B', ''));
            monsterTier = actNum * 4; 
        }

        // 2. LOOT TIER HESAPLAMA (Tier / 2 ve Zar Atma)
        // Örn: T3 / 2 = 1.5 -> %50 T1, %50 T2
        // Örn: T6 / 2 = 3.0 -> %100 T3
        let calcTierBase = monsterTier / 2;
        let finalLootTier = 1;

        if (calcTierBase % 1 === 0) {
            // Tam sayı ise (3.0, 4.0 gibi)
            finalLootTier = calcTierBase;
        } else {
            // Küsüratlı ise zar at (0.5 ihtimalle üste, 0.5 alta)
            finalLootTier = Math.random() < 0.5 ? Math.floor(calcTierBase) : Math.ceil(calcTierBase);
        }
        finalLootTier = Math.max(1, finalLootTier); // En az T1 item düşsün

        // 3. BÜTÇE BELİRLEME
        let lpBudget = (monster.isHard || monster.isBoss) 
            ? (Math.random() * 2.5) + 1.75 
            : (Math.random() * 2.5) + 0.75;

        writeLog(`💰 **Ganimet**: ${monster.name} (T${monsterTier}) -> Hedef Loot: T${finalLootTier}`);
        writeLog(`📊 Bütçe: **${lpBudget.toFixed(2)} LP**`);

        // 4. HARCAMA DÖNGÜSÜ
        while (lpBudget >= 1.0) {
            let possibleChoices = [];
            
            // Seçenek A: Hesaplanan Loot Tier (Maliyet 1.0)
            possibleChoices.push({ tier: finalLootTier, cost: 1.0, type: 'jewelry' });
            
            // Seçenek B: Broş (Maliyet 2.0)
            if (lpBudget >= 2.0) {
                possibleChoices.push({ tier: finalLootTier, cost: 2.0, type: 'brooch' });
            }

            // Seçenek C: Üst Seviye Şansı (Sadece Hard/Boss ise)
            if ((monster.isHard || monster.isBoss) && lpBudget >= 1.5) {
                // Hesaplanan Tier'ın bir üstünü düşürebilir
                possibleChoices.push({ tier: finalLootTier + 1, cost: 1.5, type: 'jewelry' });
            }

            let affordable = possibleChoices.filter(c => lpBudget >= c.cost);
            if (affordable.length === 0) break;

            let chosen = affordable[Math.floor(Math.random() * affordable.length)];
            lpBudget -= chosen.cost;

            let item = (chosen.type === 'brooch') 
                ? generateRandomBrooch(chosen.tier) 
                : generateRandomItem(chosen.tier);

            rewards.push({ type: 'item', value: item });
            writeLog(`🎁 Düşen: ${getTranslatedItemName(item)} (T${chosen.tier})`);
        }

        // 5. KALAN PUANI (REMAINDER) FRAGMENT'A ÇEVİR
        if (lpBudget > 0) {
            // Küsürat * Canavarın Gerçek Tier'ı (Daha zor canavar daha çok fragment verir)
            let rawFragCount = lpBudget * monsterTier;
            let finalFragCount = Math.round(rawFragCount); 

            if (finalFragCount > 0) {
                const fragmentItem = { ...window.BASE_MATERIALS["jewelry_fragment"] };
                rewards.push({ type: 'item', value: fragmentItem, amount: finalFragCount });
                writeLog(`💎 Kalan bütçeyle **${finalFragCount}** parça kazanıldı.`);
            }
        }

        // 6. ALTIN ÖDÜLÜ (SABİT: 5 - 16)
        const goldVal = Math.floor(Math.random() * 12) + 5;
        rewards.push({ type: 'gold', value: goldVal });
        writeLog(`🪙 **${goldVal}** Altın keseye eklendi.`);

        return rewards;
    }
};