// js/ui/salvage_manager.js

let salvageItem = null;

window.openSalvageUI = function() {
    document.getElementById('salvage-screen').classList.remove('hidden');
    salvageItem = null;
    renderSalvageUIAll();
};

window.closeSalvageUI = function() {
    if (salvageItem) {
        const emptySlot = hero.inventory.indexOf(null);
        if (emptySlot !== -1) hero.inventory[emptySlot] = salvageItem;
    }
    salvageItem = null;
    document.getElementById('salvage-screen').classList.add('hidden');
    renderInventory();
};

function renderSalvageUIAll() {
    const inputSlot = document.getElementById('salvage-input-slot');
    const yieldDiv = document.getElementById('salvage-output-display');
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
	const qtyText = lang.qty_suffix || "Adet"; // Dilden çek

    inputSlot.innerHTML = '';
    yieldDiv.innerHTML = `<span style="color:#666">${lang.items.waiting_salvage_ingredients}</span>`;

    if (salvageItem) {
        const img = document.createElement('img');
        img.src = `items/images/${salvageItem.icon}`;
        inputSlot.appendChild(img);

        // YENİ: Tek satırda merkezi badge kontrolü
        inputSlot.innerHTML += window.getItemBadgeHTML(salvageItem);

        // Tooltip ve Tıklama (Geri verme) aynı kalıyor...
        inputSlot.onmouseenter = (e) => window.showItemTooltip(salvageItem, e);
        inputSlot.onmouseleave = () => window.hideItemTooltip();
        inputSlot.onclick = () => {
            window.hideItemTooltip();
            const emptyBag = hero.inventory.indexOf(null);
            if (emptyBag !== -1) {
                hero.inventory[emptyBag] = salvageItem;
                salvageItem = null;
                renderSalvageUIAll();
                renderInventory();
            }
        };

        const range = getSalvageRange(salvageItem.tier);
        yieldDiv.innerHTML = `
            <div style="margin-bottom:5px; border-bottom:1px solid #444">${lang.items.salvage_yield}:</div>
            <div class="prob-row"><span>${range.min} ${qtyText}:</span> <span style="color:#43FF64">%60</span></div>
            <div class="prob-row"><span>${range.mid} ${qtyText}:</span> <span style="color:#f0e68c">%30</span></div>
            <div class="prob-row"><span>${range.max} ${qtyText}:</span> <span style="color:#ff9800">%10</span></div>
        `;
    }
    renderSalvageInventory();
}

function getSalvageRange(tier) {
    // T1 ise: (1-1)*3 + 1 = 1 | T1 max: 1*3 = 3 -> [1, 2, 3]
    // T2 ise: (2-1)*3 + 1 = 4 | T2 max: 2*3 = 6 -> [4, 5, 6]
    // T3 ise: (3-1)*3 + 1 = 7 | T3 max: 3*3 = 9 -> [7, 8, 9]
    // Formül: min = (Tier-1) * 3 + 1, max = Tier * 3
    
    const min = (tier - 1) * 3 + 1;
    const max = tier * 3;
    const mid = min + 1; // Tam ortadaki rakam (Örn: 1, 2, 3 içindeki 2)
    
    return { min, mid, max };
}

function renderSalvageInventory() {
    const grid = document.getElementById('salvage-bag-grid');
    if (!grid) return;
    grid.innerHTML = '';

    hero.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'item-slot bag-slot';

        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);
            
            // YENİ: Merkezi badge sistemi
            slot.innerHTML += window.getItemBadgeHTML(item);

            if (item.isStack && item.count > 1) {
                slot.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
            }

            // YENİ: ARTIK LISTE TUTMAYA GEREK YOK! 
            // Direkt kuralı soruyoruz: "Bu item demircide çalışır mı?"
            const isSalvageable = window.isItemAllowedInUI(item, 'blacksmith');

            if (isSalvageable) {
                slot.onclick = () => {
                    if (!salvageItem) {
                        window.hideItemTooltip();
                        salvageItem = item;
                        hero.inventory[index] = null;
                        renderSalvageUIAll();
                    }
                };
            } else {
                slot.style.opacity = "0.4";
                slot.style.filter = "grayscale(100%)";
                slot.style.cursor = "not-allowed";
            }

            slot.onmouseenter = (e) => window.showItemTooltip(item, e);
            slot.onmouseleave = () => window.hideItemTooltip();
        }
        grid.appendChild(slot);
    });
}

window.processSalvage = function() {
    if (!salvageItem) return;

    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const range = getSalvageRange(salvageItem.tier);
    
    // ORAN HESAPLAMA (60/30/10)
    let roll = Math.random();
    let finalCount = range.min;
    if (roll < 0.10) finalCount = range.max;
    else if (roll < 0.40) finalCount = range.mid;
    else finalCount = range.min;

    // MATERYAL OBJESİ
    const materialItem = { ...window.BASE_MATERIALS["jewelry_fragment"] };

    // Merkezi fonksiyonu çağır
    const success = addItemToInventory(materialItem, finalCount);

    if (success) {
        writeLog(`🔨 ${lang.log_salvage_success} ${finalCount}x ${lang.salvage_material_name}`);
        salvageItem = null;
        renderSalvageUIAll();
        renderInventory(); // Ana çantayı da güncelle
        if(window.saveGame) window.saveGame();
    } else {
        alert(currentLang === 'tr' ? "Envanter dolu!" : "Inventory full!");
    }
	window.CalendarManager.passDay();
};