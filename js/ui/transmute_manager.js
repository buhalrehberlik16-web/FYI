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
    // 1. Elementleri Bul
    const btn = document.getElementById('btn-do-transmute');
    const resultSlot = document.getElementById('transmute-result-slot');
    const container = document.getElementById('transmute-main-box');

    if (!resultSlot || !container) return;

    if (transmuteIngredients.includes(null)) {
        const currentLang = window.gameSettings.lang || 'tr';
        writeLog(window.LANGUAGES[currentLang].log_transmute_fail);
        return;
    }

    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    btn.disabled = true;
    btn.style.opacity = "0.5";

    // 2. ELEKTRİK ANİMASYONU (MATEMATİKSEL KESİN YÖNTEM)
    const containerRect = container.getBoundingClientRect();
    const resRect = resultSlot.getBoundingClientRect();

    // Çizgileri sıfırla
    document.querySelectorAll('.elec-path').forEach(p => {
        p.classList.remove('active');
        p.setAttribute("d", ""); 
    });

    // Hedef (Sonuç Kutusu) merkez koordinatı (Konteynere göre hesapla)
    const x2 = (resRect.left + resRect.width / 2) - containerRect.left;
    const y2 = (resRect.top + resRect.height / 2) - containerRect.top;

    for (let i = 0; i < 3; i++) {
        const inputSlot = document.getElementById(`t-slot-${i}`);
        const path = document.getElementById(`path-${i}`);

        if (inputSlot && path) {
            const inRect = inputSlot.getBoundingClientRect();

            // Başlangıç (Giriş Kutusu) merkez koordinatı (Konteynere göre hesapla)
            const x1 = (inRect.left + inRect.width / 2) - containerRect.left;
            const y1 = (inRect.top + inRect.height / 2) - containerRect.top;

            // Kavisli çizgi çizimi
            path.setAttribute("d", `M ${x1} ${y1} Q ${(x1 + x2) / 2} ${(y1 + y2) / 2 - 40} ${x2} ${y2}`);
            path.classList.add('active');
        }
        await new Promise(r => setTimeout(r, 250));
    }

    await new Promise(r => setTimeout(r, 400));

    // --- 3. HESAPLAMALAR VE ÜRETİM (Aşağısı aynı kalıyor) ---
    let sumTiers = transmuteIngredients.reduce((sum, item) => sum + item.tier, 0);
    let avg = sumTiers / 3;
    let targetTier = (avg - Math.floor(avg) >= 0.5) ? Math.ceil(avg) : Math.floor(avg);
    
    if (transmuteIngredients[0].tier === transmuteIngredients[1].tier && 
        transmuteIngredients[1].tier === transmuteIngredients[2].tier) {
        targetTier = transmuteIngredients[0].tier + 1;
    }

    let isCritical = false;
    if (Math.random() < 0.01) { targetTier++; isCritical = true; }
    targetTier = Math.min(5, targetTier);

    const typeCounts = {};
    transmuteIngredients.forEach(item => typeCounts[item.type] = (typeCounts[item.type] || 0) + 1);
    const majorityType = Object.keys(typeCounts).find(key => typeCounts[key] >= 2);
    let resultType = majorityType || transmuteIngredients[Math.floor(Math.random()*3)].type;

    const statSums = {};
    transmuteIngredients.forEach(item => {
        for (const [sKey, val] of Object.entries(item.stats)) {
            if (window.ITEM_CONFIG.statsPool.includes(sKey)) statSums[sKey] = (statSums[sKey] || 0) + val;
        }
    });

    let bestStat = null; let maxVal = -1;
    for (const [sKey, val] of Object.entries(statSums)) {
        if (val > maxVal) { maxVal = val; bestStat = sKey; }
    }

    const newItem = generateRandomItem(targetTier);
    if (bestStat && window.BASE_ITEMS[resultType] && window.BASE_ITEMS[resultType][bestStat]) {
        newItem.type = resultType;
        newItem.nameKey = window.BASE_ITEMS[resultType][bestStat].nameKey;
        newItem.icon = window.BASE_ITEMS[resultType][bestStat].icon;
        
        const oldVal = newItem.stats[newItem.propertyKeys[0]] || 1;
        newItem.stats = {}; 
        newItem.propertyKeys = [bestStat];
        newItem.stats[bestStat] = oldVal;
    }

    // 4. GÖRSEL SONUÇ
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
    }

    resultSlot.onmouseenter = (e) => window.showItemTooltip(newItem, e);
    resultSlot.onmouseleave = () => window.hideItemTooltip();

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
    
    // Eğer 3 eşya da yoksa "Bekleniyor" yazısını göster
    if (ingredients.length < 3) {
        probDiv.innerHTML = `<div style="text-align:center; color:#666;">${langItems.waiting_ingredients}</div>`;
        return;
    }

    let html = "";

    // 1. TIER HESAPLAMA
    let sumTiers = ingredients.reduce((sum, item) => sum + item.tier, 0);
    let avg = sumTiers / 3;
    let targetTier = 1;
    if (ingredients[0].tier === ingredients[1].tier && ingredients[1].tier === ingredients[2].tier) {
        targetTier = ingredients[0].tier + 1;
    } else {
        targetTier = (avg - Math.floor(avg) >= 0.5) ? Math.ceil(avg) : Math.floor(avg);
    }
    targetTier = Math.min(5, targetTier);
    
    html += `<div class="prob-row">
                <span class="prob-label">${langItems.expected_tier}:</span>
                <span class="prob-value">T${targetTier}</span>
             </div>`;

    // 2. TÜR OLASILIKLARI
    const typeCounts = {};
    ingredients.forEach(item => typeCounts[item.type] = (typeCounts[item.type] || 0) + 1);
    
    const types = ['ring', 'necklace', 'earring', 'belt'];
    const majorityType = Object.keys(typeCounts).find(key => typeCounts[key] >= 2);

    types.forEach(tKey => {
        let percent = 0;
        if (typeCounts[tKey] === 3) percent = 100;
        else if (majorityType) {
            if (tKey === majorityType) percent = 70;
            else percent = 10;
        } else {
            if (typeCounts[tKey] === 1) percent = 30;
            else percent = 10;
        }

        if (percent > 0) {
            // Tür ismini dilden al (type_ring, type_necklace vb.)
            const localizedTypeName = langItems['type_' + tKey] || tKey;
            html += `<div class="prob-row">
                        <span class="prob-label">${localizedTypeName}:</span>
                        <span class="prob-value">%${percent}</span>
                     </div>`;
        }
    });

    // 3. KRİTİK ŞANS
    html += `<div class="prob-row">
                <span class="prob-label">${langItems.crit_chance_label}:</span>
                <span class="prob-value prob-critical">%1</span>
             </div>`;

    probDiv.innerHTML = html;
};