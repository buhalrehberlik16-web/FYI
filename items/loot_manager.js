// js/loot_manager.js

window.LootManager = {
    generateLoot: function(monster) {
        let rewards = [];
        const monsterTier = monster.tier || 1;

        // 1. BÜTÇE BELİRLEME
        let lpBudget = (monster.isHard || monster.isBoss) 
            ? (Math.random() * 2.5) + 1.75 
            : (Math.random() * 2.5) + 0.75;

        // --- DEBUG LOG: Başlangıç ---
        writeLog(`💰 **Ganimet Başladı**: ${monster.name} (T${monsterTier})`);
        writeLog(`📊 Başlangıç Bütçesi: **${lpBudget.toFixed(2)} LP**`);

        // 2. ÜST TIER İZNİ
        let canGetNextTier = (monster.isHard || monster.isBoss);

         // 3. HARCAMA DÖNGÜSÜ
        while (lpBudget >= 1.0) {
            let possibleChoices = [];
            
            // Seçenek 1: Normal Takı (Maliyet 1.0)
            possibleChoices.push({ type: 'jewelry', tier: monsterTier, cost: 1.0 });

            // Seçenek 2: Broş (Maliyet 2.0)
            if (lpBudget >= 2.0) {
                possibleChoices.push({ type: 'brooch', tier: monsterTier, cost: 2.0 });
            }

            // Seçenek 3: Üst Tier Takı (Maliyet 1.5)
            if (canGetNextTier && monsterTier < 5 && lpBudget >= 1.5) {
                possibleChoices.push({ type: 'jewelry', tier: monsterTier + 1, cost: 1.5 });
            }
            
            // Seçenek 4: Üst Tier Broş (Maliyet 2.5)
            if (canGetNextTier && monsterTier < 5 && lpBudget >= 2.5) {
                possibleChoices.push({ type: 'brooch', tier: monsterTier + 1, cost: 2.5 });
            }

            let affordable = possibleChoices.filter(c => lpBudget >= c.cost);
            if (affordable.length === 0) break;

            let chosen = affordable[Math.floor(Math.random() * affordable.length)];
            lpBudget -= chosen.cost;

            let item;
            if (chosen.type === 'brooch') {
                item = generateRandomBrooch(chosen.tier); // chosen içindeki tier'ı kullan
            } else {
                item = generateRandomItem(chosen.tier); // chosen içindeki tier'ı kullan
            }
            
            rewards.push({ type: 'item', value: item });
            writeLog(`🎁 Eşya Düştü: ${chosen.type.toUpperCase()} T${chosen.tier} (${chosen.cost} LP harcandı)`);
        }

        // 4. KALAN PUANI (REMAINDER) FRAGMENT'A ÇEVİR
        writeLog(`📉 Kalan Bütçe: **${lpBudget.toFixed(2)} LP**`);
        
        if (lpBudget > 0) {
            let rawFragCount = lpBudget * monsterTier;
            let finalFragCount = Math.round(rawFragCount); 

            writeLog(`💎 Fragment Hesabı: ${lpBudget.toFixed(2)} * ${monsterTier} = ${rawFragCount.toFixed(2)}`);
            writeLog(`🎯 Yuvarlanan Fragment Sayısı: **${finalFragCount}**`);

            if (finalFragCount > 0) {
                const fragmentItem = { ...window.BASE_MATERIALS["jewelry_fragment"] };
                rewards.push({ type: 'item', value: fragmentItem, amount: finalFragCount });
                writeLog(`✅ ${finalFragCount}x Takı Parçası eklendi.`);
            } else {
                writeLog(`❌ Fragment sayısı 0.5 barajının altında kaldığı için verilmedi.`);
            }
        }

        // 5. ALTIN
        const goldVal = Math.floor(Math.random() * 12) + 5;
        rewards.push({ type: 'gold', value: goldVal });
        writeLog(`🪙 ${goldVal} Altın eklendi.`);

        return rewards;
    }
};