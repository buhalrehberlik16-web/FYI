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
        let calcTierBase = monsterTier / 2;
        let finalLootTier = 1;

        if (calcTierBase % 1 === 0) {
            finalLootTier = calcTierBase;
        } else {
            finalLootTier = Math.random() < 0.5 ? Math.floor(calcTierBase) : Math.ceil(calcTierBase);
        }
        finalLootTier = Math.max(1, finalLootTier); 

        // 3. BÜTÇE BELİRLEME
        let lpBudget = (monster.isHard || monster.isBoss) 
            ? (Math.random() * 2.5) + 1.75 
            : (Math.random() * 2.5) + 0.75;

        writeLog(`💰 **Ganimet**: ${monster.name} (T${monsterTier}) -> Hedef Loot: T${finalLootTier}`);
        writeLog(`📊 Bütçe: **${lpBudget.toFixed(2)} LP**`);

        // 4. HARCAMA DÖNGÜSÜ
        while (lpBudget >= 1.0) {
            let possibleChoices = [];
            
            // Seçenek A: Standart Takı (Maliyet 1.0)
            possibleChoices.push({ tier: finalLootTier, cost: 1.0, type: 'jewelry' });
            
            // Seçenek B: Tılsım (Charm1) (Maliyet 1.5) --- YENİ EKLENDİ ---
            if (lpBudget >= 1.5) {
                possibleChoices.push({ tier: finalLootTier, cost: 1.5, type: 'charm1' });
            }

            // Seçenek C: Broş (Maliyet 2.0)
            if (lpBudget >= 2.0) {
                possibleChoices.push({ tier: finalLootTier, cost: 2.0, type: 'brooch' });
            }

            // Seçenek D: Üst Seviye Şansı (Sadece Hard/Boss ise ve yeterli bütçe varsa)
            if ((monster.isHard || monster.isBoss) && lpBudget >= 1.5) {
                possibleChoices.push({ tier: finalLootTier + 1, cost: 1.5, type: 'jewelry' });
            }

            let affordable = possibleChoices.filter(c => lpBudget >= c.cost);
            if (affordable.length === 0) break;

            let chosen = affordable[Math.floor(Math.random() * affordable.length)];
            lpBudget -= chosen.cost;

            // İlgili jeneratörü çağır
            let item;
            if (chosen.type === 'brooch') {
                item = generateRandomBrooch(chosen.tier);
            } else if (chosen.type === 'charm1') {
                // Yeni Tılsım Jeneratörü
                item = generateRandomCharm(chosen.tier);
            } else {
                item = generateRandomItem(chosen.tier);
            }

            rewards.push({ type: 'item', value: item });
            writeLog(`🎁 Düşen: ${getTranslatedItemName(item)} (T${chosen.tier})`);
        }

        // 5. KALAN PUANI (REMAINDER) FRAGMENT'A ÇEVİR
        if (lpBudget > 0) {
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