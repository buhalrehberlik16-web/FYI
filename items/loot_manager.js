// js/loot_manager.js

window.LootManager = {
    generateLoot: function(monster) {
        let rewards = [];
        
        // 1. ELITE KONTROLÜ: Üst seviye (T+1) takı düşürme izni
        // Bosslar ve isHard (Turuncu çerçeveli) düşmanlar 'Elite' kabul edilir.
        const isElite = (monster.isHard || monster.isWeak || monster.isBoss);
        
        // 2. TIER SAYISALLAŞTIRMA (B1 -> 4, B2 -> 8 gibi)
        let monsterTier = monster.tier;
        if (typeof monsterTier === 'string' && monsterTier.startsWith('B')) {
            let actNum = parseInt(monsterTier.replace('B', ''));
            monsterTier = actNum * 4; 
        }

        // 3. LOOT TIER HESAPLAMA (Tier / 2 ve Zar Atma)
        let calcTierBase = monsterTier / 2;
        let finalLootTier = 1;

        if (calcTierBase % 1 === 0) {
            finalLootTier = calcTierBase;
        } else {
            finalLootTier = Math.random() < 0.5 ? Math.floor(calcTierBase) : Math.ceil(calcTierBase);
        }
        finalLootTier = Math.max(1, finalLootTier); 

        // --- 4. DİNAMİK BÜTÇE HESAPLAMA (TAM İSTEDİĞİN FORMÜL) ---
        let minBudget = 0.8;
        let maxBudget = 2.7;

        // Bonusu hem alta hem üste ekle (isHard ve isBoss ayrık kontrol edilir)
        if (monster.isHard || monster.isWeak) {
            minBudget += 0.2; // 0.8 -> 1.0
            maxBudget += 0.2; // 2.7 -> 2.9
        } else if (monster.isBoss) {
            minBudget += 1.4; // 0.8 -> 2.2
            maxBudget += 1.4; // 2.7 -> 4.1
        }

        // Rastgele bütçe üretimi
        let lpBudget = (Math.random() * (maxBudget - minBudget)) + minBudget;
		
		// --- GÜNCELLEME: HORDE LOGU EKLEME ---
        if (monster.isHordeBonus) {
            const oldBudget = lpBudget.toFixed(2); // Karşılaştırma için eskiyi tut
            lpBudget *= 2; // Bütçeyi ikiye katla
            
            // Logu dile duyarlı yapabiliriz veya şimdilik kontrol için şu şekilde yazabiliriz:
            writeLog(`**Horde Bonus**: Sürü temizlendiği için ganimet bütçesi ikiye katlandı! (${oldBudget} LP -> ${lpBudget.toFixed(2)} LP)`);
        }
        // -------------------------------------

        // Başlangıç Logu
        writeLog(`💰 **GANİMET SİSTEMİ**: ${monster.name} (T${monsterTier})`);
        writeLog(`📊 Toplam Bütçe: **${lpBudget.toFixed(2)} LP** (Aralık: ${minBudget.toFixed(1)}-${maxBudget.toFixed(1)})`);
        // -------------------------------------------------------

        // 5. HARCAMA DÖNGÜSÜ
        while (lpBudget >= 0.75) {
            let possibleChoices = [];
            const lootableTypes = ['jewelry', 'charm1', 'brooch'];

            lootableTypes.forEach(type => {
                const rules = window.ITEM_RULES[type];
                if (!rules) return;

                // A. STANDART VERSİYON (lootValue) - Her zaman açık
                if (lpBudget >= rules.lootValue) {
                    possibleChoices.push({ 
                        tier: finalLootTier, 
                        cost: rules.lootValue, 
                        type: type 
                    });
                }

                // B. ÜST SEVİYE VERSİYON (nextTierValue) - Sadece Elite ise açık
                if (isElite && lpBudget >= rules.nextTierValue) {
                    possibleChoices.push({ 
                        tier: finalLootTier + 1, 
                        cost: rules.nextTierValue, 
                        type: type 
                    });
                }
            });

            let affordable = possibleChoices.filter(c => lpBudget >= c.cost);
            if (affordable.length === 0) break;

            let chosen = affordable[Math.floor(Math.random() * affordable.length)];
            
            // Harcamayı yap
            lpBudget -= chosen.cost;

            let item;
            if (chosen.type === 'brooch') {
                item = generateRandomBrooch(chosen.tier);
            } else if (chosen.type === 'charm1') {
                item = generateRandomCharm(chosen.tier);
            } else {
                item = generateRandomItem(chosen.tier);
            }

            rewards.push({ type: 'item', value: item });
            
            // Harcama Logu
            writeLog(`🎁 ${getTranslatedItemName(item)} (T${chosen.tier}) düşürüldü. [-${chosen.cost.toFixed(2)} LP | Kalan: ${lpBudget.toFixed(2)} LP]`);
        }

        // 6. KALAN PUANI FRAGMENT'A ÇEVİR
        const matRules = window.ITEM_RULES["material"];
        if (lpBudget > 0) {
            let rawFragCount = lpBudget * (monsterTier / (matRules.lootValue || 0.75));
            let finalFragCount = Math.round(rawFragCount); 

            if (finalFragCount > 0) {
                const fragmentItem = { ...window.BASE_MATERIALS["jewelry_fragment"] };
                rewards.push({ type: 'item', value: fragmentItem, amount: finalFragCount });
                writeLog(`💎 Kalan **${lpBudget.toFixed(2)} LP** ile **${finalFragCount}** parça kazanıldı.`);
            }
        }

		// --- 7. ALTIN ÖDÜLÜ ---
    const currentNode = GAME_MAP.nodes.find(n => n.id === GAME_MAP.currentNodeId);
    const currentStage = currentNode ? currentNode.stage : 0;
    const passedTownsCount = MAP_CONFIG.townStages.filter(t => t < currentStage).length;

    const goldVal = Math.floor(Math.random() * 12) + 5 + passedTownsCount + (monster.isOrange ? 3 : 0);

    const lang = window.getCombatLang();
    const combatL = lang.combat || {}; // Güvenli erişim için alt obje

    // A. BÖLGE BONUSU LOGU
    if (passedTownsCount > 0 && combatL.log_town_gold_bonus) {
        writeLog(combatL.log_town_gold_bonus.replace("$1", passedTownsCount).replace("$2", passedTownsCount));
    }

    // B. TURUNCU ODA LOGU
    if (monster.isOrange && combatL.log_orange_gold) {
        writeLog(combatL.log_orange_gold);
    }

    rewards.push({ type: 'gold', value: goldVal });
        // ---------------------------------------------
        
        return rewards;
    } // generateLoot fonksiyonunun sonu
}; // LootManager objesinin sonu