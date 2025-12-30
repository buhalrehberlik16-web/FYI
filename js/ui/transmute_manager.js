// js/ui/transmute_manager.js

let transmuteIngredients = [null, null, null];

window.openTransmuteUI = function() {
    document.getElementById('transmute-screen').classList.remove('hidden');
    transmuteIngredients = [null, null, null];
    document.getElementById('transmute-result-slot').innerHTML = ''; // Eski sonucu temizle
    renderTransmuteUIAll();
};

window.closeTransmuteUI = function() {
    // İçeride unutulan itemları çantaya geri koy
    transmuteIngredients.forEach(item => {
        if (item) {
            const emptySlot = hero.inventory.indexOf(null);
            if (emptySlot !== -1) hero.inventory[emptySlot] = item;
        }
    });
    transmuteIngredients = [null, null, null];
    document.getElementById('transmute-screen').classList.add('hidden');
    renderInventory(); // Ana envanteri tazele
};

// Hem slotları hem de altındaki envanteri tazeler
function renderTransmuteUIAll() {
    renderTransmuteSlots();
    renderTransmuteInventory();
}

function renderTransmuteSlots() {
    const slots = document.querySelectorAll('.transmute-input');
    const resultSlot = document.getElementById('transmute-result-slot');

    // --- YENİ: SONUÇ TEMİZLEME MANTIĞI ---
    // Eğer slotlardan en az birinde eşya varsa, bir önceki işlemin sonucunu ekrandan kaldır
    const hasAnyIngredient = transmuteIngredients.some(item => item !== null);
    if (hasAnyIngredient && resultSlot) {
        resultSlot.innerHTML = '';
        resultSlot.classList.remove('critical-glow');
        resultSlot.onmouseenter = null; // Tooltip'i de temizle
        resultSlot.onmouseleave = null;
    }
    // -------------------------------------
    slots.forEach((slot, i) => {
        const item = transmuteIngredients[i];
        slot.innerHTML = '';
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);
			
			const badge = document.createElement('span');
            badge.className = 'item-tier-badge';
            badge.textContent = `T${item.tier}`;
            slot.appendChild(badge);
            
            // Tooltip desteği (menu_manager'daki fonksiyonu kullanıyoruz)
            slot.onmouseenter = (e) => window.showItemTooltip(item, e);
            slot.onmouseleave = () => window.hideItemTooltip();
            slot.onmousemove = (e) => {
                const tooltip = document.getElementById('item-tooltip');
                if(tooltip) {
                    tooltip.style.left = (e.clientX + 15) + 'px';
                    tooltip.style.top = (e.clientY + 15) + 'px';
                }
            };

            // Tıklayınca geri çantaya at
            slot.onclick = () => {
				window.hideItemTooltip(); // TOOLTIP FIX: Tıklayınca kapat
				const emptyBag = hero.inventory.indexOf(null);
				if (emptyBag !== -1) {
					hero.inventory[emptyBag] = item;
					transmuteIngredients[i] = null;
					renderTransmuteUIAll();
				}
			};
        } else {
            slot.onclick = null;
            slot.onmouseenter = null;
        }

        // Drop (Bırakma) hedefi
        slot.ondragover = e => e.preventDefault();
        slot.ondrop = e => {
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.source === 'bag') {
                const bagItem = hero.inventory[data.id];
                if (bagItem) {
                    transmuteIngredients[i] = bagItem;
                    hero.inventory[data.id] = null;
                    renderTransmuteUIAll();
                }
            }
        };
    });
	window.updateTransmuteProbabilities();
}

// Transmute ekranının altındaki envanteri çizer
function renderTransmuteInventory() {
    const grid = document.getElementById('transmute-bag-grid');
    if (!grid) return;
    grid.innerHTML = '';

    hero.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'item-slot bag-slot';
        
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);
            slot.draggable = true;
			const badge = document.createElement('span');
            badge.className = 'item-tier-badge';
            badge.textContent = `T${item.tier}`;
            slot.appendChild(badge);

            // Drag-Drop desteği
            slot.ondragstart = (e) => {
			window.hideItemTooltip(); // Sürükleme başladığı an tooltip'i gizle
			const dragData = { source: 'bag', id: index };
			e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
			};

            // Tooltip
            slot.onmouseenter = (e) => window.showItemTooltip(item, e);
            slot.onmouseleave = () => window.hideItemTooltip();

            // Tıklayınca boş olan ilk transmute slotuna gönder
            slot.onclick = () => {
				window.hideItemTooltip(); // TOOLTIP FIX: Tıklayınca kapat
				const emptyIdx = transmuteIngredients.indexOf(null);
				if (emptyIdx !== -1) {
					transmuteIngredients[emptyIdx] = item;
					hero.inventory[index] = null;
					renderTransmuteUIAll();
				}
			};
        }

        grid.appendChild(slot);
    });
}

window.processTransmutation = async function() {
    // 1. ELEMENTLER VE GÜVENLİK
    const btn = document.getElementById('btn-do-transmute');
    const resultSlot = document.getElementById('transmute-result-slot');
    const container = document.getElementById('transmute-main-box');
    const slotsContainer = document.querySelector('.transmute-slots');

    if (!resultSlot || !container || !slotsContainer) return;

    if (transmuteIngredients.includes(null)) {
        const currentLang = window.gameSettings.lang || 'tr';
        writeLog(window.LANGUAGES[currentLang].log_transmute_fail);
        return;
    }

    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    btn.disabled = true;
    btn.style.opacity = "0.5";

    // 2. ELEKTRİK ANİMASYONU
    const containerRect = container.getBoundingClientRect();
    const resRect = resultSlot.getBoundingClientRect();

    document.querySelectorAll('.elec-path').forEach(p => {
        p.classList.remove('active');
        p.setAttribute("d", ""); 
    });

    const x2 = (resRect.left + resRect.width / 2) - containerRect.left;
    const y2 = (resRect.top + resRect.height / 2) - containerRect.top;

    for (let i = 0; i < 3; i++) {
        const inputSlot = document.getElementById(`t-slot-${i}`);
        const path = document.getElementById(`path-${i}`);
        if (inputSlot && path) {
            const inRect = inputSlot.getBoundingClientRect();
            const x1 = (inRect.left + inRect.width / 2) - containerRect.left;
            const y1 = (inRect.top + inRect.height / 2) - containerRect.top;
            path.setAttribute("d", `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 40} ${x2} ${y2}`);
            path.classList.add('active');
        }
        await new Promise(r => setTimeout(r, 250));
    }
    await new Promise(r => setTimeout(r, 400));

    // --- 3. YENİ TIER HESAPLAMA MANTIĞI (OLASILIKLI) ---
    let sumTiers = transmuteIngredients.reduce((sum, item) => sum + item.tier, 0);
    let avg = sumTiers / 3;
    let targetTier = 1;

    const allSame = transmuteIngredients.every(i => i.tier === transmuteIngredients[0].tier);

    if (allSame) {
        // Hepsi aynıysa direkt +1 (Örn: 3 tane T1 -> Kesin T2)
        targetTier = transmuteIngredients[0].tier + 1;
    } else {
        // Küsürat şansına göre zar atma (Örn: 2.33 -> %33 ihtimalle T3, %67 ihtimalle T2)
        let roll = Math.random(); 
        let chanceNext = avg % 1; // Küsürat kısmını al (0.33)
        
        if (roll < chanceNext) {
            targetTier = Math.ceil(avg); // Üste tamamla
        } else {
            targetTier = Math.floor(avg); // Alta tamamla
        }
    }

    // %1 KRİTİK ŞANS (+1 Seviye Daha)
    let isCritical = false;
    if (Math.random() < 0.01) {
        targetTier++;
        isCritical = true;
    }
    targetTier = Math.max(1, Math.min(5, targetTier)); // T1-T5 arası sınırla

    // --- 4. AĞIRLIKLI OLASILIK TABLOSU OLUŞTURMA ---
    const statWeights = {};
    let totalStatWeight = 0;

    transmuteIngredients.forEach(item => {
        for (const [sKey, val] of Object.entries(item.stats)) {
            const isResist = window.ITEM_CONFIG.resistsPool.includes(sKey);
            const w = isResist ? val / window.ITEM_CONFIG.multipliers.resists : val;
            statWeights[sKey] = (statWeights[sKey] || 0) + w;
            totalStatWeight += w;
        }
    });

    // Rastgele bir stat seçen yardımcı fonksiyon (Ağırlığa göre)
    const pickWeightedStat = () => {
        let roll = Math.random() * totalStatWeight;
        for (const [sKey, w] of Object.entries(statWeights)) {
            if (roll < w) return sKey;
            roll -= w;
        }
        return window.ITEM_CONFIG.statsPool[0]; // Fallback
    };

    // --- 5. ÜRETİM (ADIM ADIM PUAN DAĞITIMI) ---
    // Önce türü belirle (Tür şansını kullanıyoruz)
    const typeCounts = {};
    transmuteIngredients.forEach(item => typeCounts[item.type] = (typeCounts[item.type] || 0) + 1);
    const majorityType = Object.keys(typeCounts).find(key => typeCounts[key] >= 2);
    let resultType = majorityType; 
    if (!majorityType || Math.random() > 0.7) { 
        resultType = transmuteIngredients[Math.floor(Math.random()*3)].type; 
    }

    // Ana Stat'ı ağırlığa göre seç
    const finalMainStat = pickWeightedStat();

    // Yeni item objesini hazırla (Ama stats içini biz dolduracağız)
    const newItem = {
        id: "item_" + Date.now(),
        type: resultType,
        tier: targetTier,
        stats: {},
        propertyKeys: []
    };

    // Puan Dağıtımı (Tier kadar puan dağıtılacak)
    let pointsToDistribute = targetTier;

    while (pointsToDistribute > 0) {
        let selectedStat;
        
        // İlk puan her zaman 'finalMainStat'a gider (Eşya kimliği için)
        if (newItem.propertyKeys.length === 0) {
            selectedStat = finalMainStat;
        } else {
            // Sonraki puanlar için: 
            // %70 ihtimalle ağırlıklı tablodan seç (Inputlar önemli), 
            // %30 ihtimalle tamamen rastgele (Sürpriz faktörü)
            if (Math.random() < 0.7) {
                selectedStat = pickWeightedStat();
            } else {
                const allOptions = [...window.ITEM_CONFIG.statsPool, ...window.ITEM_CONFIG.resistsPool];
                selectedStat = allOptions[Math.floor(Math.random() * allOptions.length)];
            }
        }

        // 3 Slot Sınırı Kontrolü: 
        // Eğer seçilen stat yeni bir stat ise ve zaten 3 stat varsa, 
        // mevcut statlardan birini rastgele seçip ona ver.
        if (!newItem.propertyKeys.includes(selectedStat) && newItem.propertyKeys.length >= 3) {
            selectedStat = newItem.propertyKeys[Math.floor(Math.random() * newItem.propertyKeys.length)];
        }

        if (!newItem.propertyKeys.includes(selectedStat)) {
            newItem.propertyKeys.push(selectedStat);
        }

        // Puanı değere çevir (Resist ise x3, Stat ise x1)
        const isResist = window.ITEM_CONFIG.resistsPool.includes(selectedStat);
        const mult = isResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
        
        newItem.stats[selectedStat] = (newItem.stats[selectedStat] || 0) + mult;
        pointsToDistribute--;
    }

    // İsim ve İkon Ataması (Ana stat neyse ona göre takı ismini belirle)
    // Eğer o kombinasyon (örn: Belt of Fire Resist) BASE_ITEMS'ta yoksa, 
    // en yakın stat eşleşmesini veya varsayılanı kullanır.
    const template = window.BASE_ITEMS[newItem.type][finalMainStat] || window.BASE_ITEMS[newItem.type][Object.keys(window.BASE_ITEMS[newItem.type])[0]];
    newItem.nameKey = template.nameKey;
    newItem.icon = template.icon;

    // --- 6. GÖRSEL SONUÇ VE EFEKTLER ---
    resultSlot.innerHTML = '';
    resultSlot.classList.remove('critical-glow');
    resultSlot.classList.add('result-flash');

    const img = document.createElement('img');
    img.src = `items/images/${newItem.icon}`;
    resultSlot.appendChild(img);

    const badge = document.createElement('span');
    badge.className = 'item-tier-badge';
    badge.textContent = `T${newItem.tier}`;
    resultSlot.appendChild(badge);

    if (isCritical) {
        resultSlot.classList.add('critical-glow');
        showFloatingText(resultSlot, lang.critical_success, 'heal');
        writeLog(`✨ **${lang.critical_success}**`);
    }

    resultSlot.onmouseenter = (e) => window.showItemTooltip(newItem, e);
    resultSlot.onmouseleave = () => window.hideItemTooltip();

    // 7. TEMİZLİK VE KAYIT
    transmuteIngredients = [null, null, null];
    const bagSlot = hero.inventory.indexOf(null);
    if (bagSlot !== -1) hero.inventory[bagSlot] = newItem;

    writeLog(`${lang.log_transmute_success} ${getTranslatedItemName(newItem)} (T${newItem.tier})`);
    
    setTimeout(() => {
        resultSlot.classList.remove('result-flash');
        document.querySelectorAll('.elec-path').forEach(p => p.classList.remove('active'));
        btn.disabled = false;
        btn.style.opacity = "1";
        renderTransmuteUIAll();
        renderInventory();
        if(window.saveGame) window.saveGame();
    }, 800);
};

window.updateTransmuteProbabilities = function() {
    const probDiv = document.getElementById('transmute-probabilities');
    if (!probDiv) return;

    const currentLang = window.gameSettings.lang || 'tr';
    const langItems = window.LANGUAGES[currentLang].items;
    const ingredients = transmuteIngredients.filter(i => i !== null);
    
    if (ingredients.length < 3) {
        probDiv.innerHTML = `<div style="text-align:center; color:#666;">${langItems.waiting_ingredients}</div>`;
        return;
    }

    let html = "";

    // --- 1. TIER OLASILIĞI (Küsüratlı Mantık) ---
    let sumTiers = ingredients.reduce((sum, item) => sum + item.tier, 0);
    let avg = sumTiers / 3;
    let tierOdds = [];
    const allSame = ingredients.every(i => i.tier === ingredients[0].tier);
    
    if (allSame) {
        tierOdds.push({ tier: Math.min(5, ingredients[0].tier + 1), chance: 100 });
    } else {
        let baseTier = Math.floor(avg);
        let nextTier = Math.min(5, baseTier + 1);
        let nextChance = Math.round((avg % 1) * 100);
        let baseChance = 100 - nextChance;
        if (baseChance > 0) tierOdds.push({ tier: baseTier, chance: baseChance });
        if (nextChance > 0 && nextTier !== baseTier) tierOdds.push({ tier: nextTier, chance: nextChance });
    }

    html += `<div class="prob-row" style="border-bottom: 1px solid #444; margin-bottom: 8px; padding-bottom: 5px;">
                <span class="prob-label">${langItems.tier_odds}:</span>
                <span class="prob-value">${tierOdds.map(o => `T${o.tier} (%${o.chance})`).join(" / ")}</span>
             </div>`;

    // --- 2. STAT/RESIST DAĞILIM OLASILIĞI (Ağırlıklı Hesaplama) ---
    const weights = {};
    let totalWeight = 0;

    ingredients.forEach(item => {
        for (const [sKey, val] of Object.entries(item.stats)) {
            // Statların puanlarını ağırlık olarak ekle
            // Resist ise puanı bölerek (3'e) normalize ediyoruz ki statlarla dengeli olsun
            const isResist = window.ITEM_CONFIG.resistsPool.includes(sKey);
            const weightValue = isResist ? val / window.ITEM_CONFIG.multipliers.resists : val;
            
            weights[sKey] = (weights[sKey] || 0) + weightValue;
            totalWeight += weightValue;
        }
    });

    html += `<div style="color:#888; font-size:0.8em; margin-bottom:5px; text-align:left;">${langItems.likely_stat}:</div>`;

    // Ağırlıkları yüzdelere çevir ve sırala (En yüksek şans üstte)
    const sortedStats = Object.entries(weights).sort((a, b) => b[1] - a[1]);
    
    sortedStats.forEach(([sKey, w]) => {
        const chance = Math.round((w / totalWeight) * 100);
        if (chance > 0) {
            const localizedName = window.getStatDisplayName(sKey);
            html += `<div class="prob-row">
                        <span class="prob-label">${localizedName}:</span>
                        <span class="prob-value" style="color:#43FF64;">%${chance}</span>
                     </div>`;
        }
    });

    // --- 3. TÜR OLASILIKLARI ---
    // (Mevcut tür olasılığı kodun buraya gelecek...)
    const typeCounts = {};
    ingredients.forEach(item => typeCounts[item.type] = (typeCounts[item.type] || 0) + 1);
    const types = ['ring', 'necklace', 'earring', 'belt'];
    const majorityType = Object.keys(typeCounts).find(key => typeCounts[key] >= 2);

    html += `<div style="color:#888; font-size:0.8em; margin:10px 0 5px 0; text-align:left;">${langItems.result_type_odds}:</div>`;
    types.forEach(tKey => {
        let percent = 0;
        if (typeCounts[tKey] === 3) percent = 100;
        else if (majorityType) {
            if (tKey === majorityType) percent = 70; else percent = 10;
        } else {
            if (typeCounts[tKey] === 1) percent = 30; else percent = 10;
        }
        if (percent > 0) {
            const localizedTypeName = langItems['type_' + tKey] || tKey;
            html += `<div class="prob-row"><span class="prob-label">${localizedTypeName}:</span><span class="prob-value">%${percent}</span></div>`;
        }
    });

    // --- 4. KRİTİK ŞANS ---
    html += `<div class="prob-row" style="margin-top:5px; border-top:1px solid #444; padding-top:5px;">
                <span class="prob-label">${langItems.crit_chance_label}:</span>
                <span class="prob-value prob-critical">%1</span>
             </div>`;

    probDiv.innerHTML = html;
};