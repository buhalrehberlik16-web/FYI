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
    slots.forEach((slot, i) => {
        const item = transmuteIngredients[i];
        slot.innerHTML = '';
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);
            
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

            // Drag-Drop desteği
            slot.ondragstart = (e) => {
                const dragData = { source: 'bag', id: index };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            };

            // Tooltip
            slot.onmouseenter = (e) => window.showItemTooltip(item, e);
            slot.onmouseleave = () => window.hideItemTooltip();

            // Tıklayınca boş olan ilk transmute slotuna gönder
            slot.onclick = () => {
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

window.processTransmutation = function() {
    if (transmuteIngredients.includes(null)) {
        const currentLang = window.gameSettings.lang || 'tr';
        writeLog(window.LANGUAGES[currentLang].log_transmute_fail);
        return;
    }

    // 1. TIER HESAPLAMA
    let sumTiers = transmuteIngredients.reduce((sum, item) => sum + item.tier, 0);
    let avg = sumTiers / 3;
    let targetTier = 1;

    if (transmuteIngredients[0].tier === transmuteIngredients[1].tier && transmuteIngredients[1].tier === transmuteIngredients[2].tier) {
        targetTier = transmuteIngredients[0].tier + 1;
    } else {
        targetTier = (avg - Math.floor(avg) >= 0.5) ? Math.ceil(avg) : Math.floor(avg);
    }

    if (Math.random() < 0.01) targetTier++;
    targetTier = Math.min(5, targetTier);

    // 2. TÜR (TYPE) BELİRLEME
    const typeCounts = {};
    transmuteIngredients.forEach(item => typeCounts[item.type] = (typeCounts[item.type] || 0) + 1);
    
    let resultType = null;
    const majorityType = Object.keys(typeCounts).find(key => typeCounts[key] >= 2);
    
    if (typeCounts[transmuteIngredients[0].type] === 3) {
        resultType = transmuteIngredients[0].type;
    } else if (majorityType) {
        resultType = Math.random() < 0.7 ? majorityType : Object.keys(window.BASE_ITEMS)[Math.floor(Math.random() * 4)];
    } else {
        const typesFromIngredients = transmuteIngredients.map(i => i.type);
        resultType = typesFromIngredients[Math.floor(Math.random() * 3)];
    }

    // 3. STAT BASKINLIĞI (STAT BIAS)
    const statSums = {};
    transmuteIngredients.forEach(item => {
        for (const [sKey, val] of Object.entries(item.stats)) {
            if (window.ITEM_CONFIG.statsPool.includes(sKey)) {
                statSums[sKey] = (statSums[sKey] || 0) + val;
            }
        }
    });

    let bestStat = null;
    let maxVal = -1;
    for (const [sKey, val] of Object.entries(statSums)) {
        if (val > maxVal) { maxVal = val; bestStat = sKey; }
    }

    // 4. ÜRETİM
    const newItem = generateRandomItem(targetTier);
    newItem.type = resultType;
    
    if (bestStat) {
        const oldMain = newItem.propertyKeys[0];
        const oldVal = newItem.stats[oldMain];
        delete newItem.stats[oldMain];
        newItem.propertyKeys[0] = bestStat;
        newItem.stats[bestStat] = oldVal;
        newItem.nameKey = window.BASE_ITEMS[resultType][bestStat].nameKey;
        newItem.icon = window.BASE_ITEMS[resultType][bestStat].icon;
    }

    // 5. SONUÇ VE TEMİZLİK
    transmuteIngredients = [null, null, null];
    const resultSlot = document.getElementById('transmute-result-slot');
    resultSlot.innerHTML = `<img src="items/images/${newItem.icon}">`;
    
    // Sonuç slotuna tooltip ekle
    resultSlot.onmouseenter = (e) => window.showItemTooltip(newItem, e);
    resultSlot.onmouseleave = () => window.hideItemTooltip();

    const bagSlot = hero.inventory.indexOf(null);
    if (bagSlot !== -1) {
        hero.inventory[bagSlot] = newItem;
    } else {
        // Çanta doluysa (çok düşük ihtimal ama) yere düşer mantığıyla en azından uyaralım
        alert("Envanter dolu, eşya kaybolabilir!");
    }

    const currentLang = window.gameSettings.lang || 'tr';
    writeLog(`${window.LANGUAGES[currentLang].log_transmute_success} ${getTranslatedItemName(newItem)} (T${newItem.tier})`);
    
    renderTransmuteUIAll();
    if(window.saveGame) window.saveGame();
};