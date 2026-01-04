// js/ui/synthesis_manager.js

let craftTier = 1;
let selectedFragments = null;
let selectedStatScroll = null;
let selectedTypeScroll = null;

window.openSynthesisUI = function() {
    document.getElementById('synthesis-screen').classList.remove('hidden');
    
    // YENİ: Girişte sonucu zorla temizle
    const resSlot = document.getElementById('synthesis-result-slot');
    if (resSlot) {
        resSlot.innerHTML = '';
        resSlot.onmouseenter = null;
        resSlot.onmouseleave = null;
    }
    
    resetSynthesis();
    renderSynthesisUI();
};

function resetSynthesis() {
    craftTier = 1;
    selectedFragments = null;
    selectedStatScroll = null;
    selectedTypeScroll = null;
}

window.closeSynthesisUI = function() {
    // Eşyaları çantaya iade et
    if (selectedFragments) addItemToInventory(selectedFragments, selectedFragments.count);
    if (selectedStatScroll) addItemToInventory(selectedStatScroll, 1);
    if (selectedTypeScroll) addItemToInventory(selectedTypeScroll, 1);
    
    document.getElementById('synthesis-screen').classList.add('hidden');
    renderInventory();
};

window.changeCraftTier = function(val) {
    craftTier = Math.max(1, Math.min(5, craftTier + val));
    renderSynthesisUI();
};

function renderSynthesisUI() {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    const fragSlot = document.getElementById('c-slot-fragments');
    const statSlot = document.getElementById('c-slot-stat');
    const typeSlot = document.getElementById('c-slot-type');
    const tierDisplay = document.getElementById('craft-target-tier');
    const fragStatus = document.getElementById('fragments-status');

    tierDisplay.textContent = craftTier;
    const req = window.CRAFTING_CONFIG.requiredFragments[craftTier];
    
    // Parça Durumu Kontrolü
    const currentFrags = selectedFragments ? selectedFragments.count : 0;
    fragStatus.innerHTML = `${lang.items.needed_fragments}: <span style="color:${currentFrags >= req ? '#43FF64' : '#ff4d4d'}">${currentFrags} / ${req}</span>`;

    // Slotları Çiz
    drawCraftSlot(fragSlot, selectedFragments, 'fragments');
    drawCraftSlot(statSlot, selectedStatScroll, 'stat');
    drawCraftSlot(typeSlot, selectedTypeScroll, 'type');

    renderSynthesisInventory();
}

function drawCraftSlot(el, item, slotType) {
    el.innerHTML = '';
    el.onclick = null;

    if (item) {
        const img = document.createElement('img');
        img.src = `items/images/${item.icon}`;
        el.appendChild(img);

        // --- GÜNCEL BADGE MANTIĞI ---
        const isMaterial = ['material', 'stat_scroll', 'type_scroll'].includes(item.type);
        const badge = document.createElement('span');
        
        if (isMaterial) {
            badge.className = 'item-tier-badge badge-craft';
            badge.textContent = 'C';
        } else {
            badge.className = `item-tier-badge badge-${item.tier}`;
            badge.textContent = `T${item.tier}`;
        }
        el.appendChild(badge);
        // ---------------------------

        if (item.count && item.count > 1) {
            const cBadge = document.createElement('span');
            cBadge.className = 'item-count-badge';
            cBadge.textContent = item.count;
            el.appendChild(cBadge);
        }

        el.onclick = (e) => {
            e.stopPropagation();
            window.hideItemTooltip();
            addItemToInventory(item, item.count || 1);
            if (slotType === 'fragments') selectedFragments = null;
            if (slotType === 'stat') selectedStatScroll = null;
            if (slotType === 'type') selectedTypeScroll = null;
            renderSynthesisUI();
            renderInventory();
        };
        
        el.onmouseenter = (e) => window.showItemTooltip(item, e);
        el.onmouseleave = () => window.hideItemTooltip();
    }
}


function renderSynthesisInventory() {
    const grid = document.getElementById('synthesis-bag-grid');
    if(!grid) return;
    grid.innerHTML = '';
    
    hero.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'item-slot bag-slot';
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);

            // --- GÜNCEL BADGE MANTIĞI ---
            const isMaterial = ['material', 'stat_scroll', 'type_scroll'].includes(item.type);
            const b = document.createElement('span');
            
            if (isMaterial) {
                b.className = 'item-tier-badge badge-craft';
                b.textContent = 'C';
            } else {
                b.className = `item-tier-badge badge-${item.tier}`;
                b.textContent = `T${item.tier}`;
            }
            slot.appendChild(b);
            // ---------------------------

            if (item.isStack && item.count > 1) {
                const c = document.createElement('span');
                c.className = 'item-count-badge';
                c.textContent = item.count;
                slot.appendChild(c);
            }
            
            const valid = ['material', 'stat_scroll', 'type_scroll'].includes(item.type);
            if(valid) {
                slot.onclick = () => {
                    if (item.type === 'material' && !selectedFragments) {
                        selectedFragments = {...item};
                        hero.inventory[index] = null;
                    } else if (item.type === 'stat_scroll' && !selectedStatScroll) {
                        selectedStatScroll = {...item};
                        hero.inventory[index] = null;
                    } else if (item.type === 'type_scroll' && !selectedTypeScroll) {
                        selectedTypeScroll = {...item};
                        hero.inventory[index] = null;
                    }
                    renderSynthesisUI();
                };
            } else {
                slot.style.opacity = "0.3";
                slot.style.filter = "grayscale(100%)";
            }
            
            slot.onmouseenter = (e) => window.showItemTooltip(item, e);
            slot.onmouseleave = () => window.hideItemTooltip();
        }
        grid.appendChild(slot);
    });
}

// T5 Stat Bugını Çözen Üretim Fonksiyonu
window.processSynthesis = function() {
    const req = window.CRAFTING_CONFIG.requiredFragments[craftTier];
    if (!selectedFragments || selectedFragments.count < req) {
        alert("Yetersiz materyal!");
        return;
    }

    // 1. Materyalleri Tüket
    selectedFragments.count -= req;
    const currentFragmentsStored = selectedFragments.count > 0 ? {...selectedFragments} : null;
    const finalStat = selectedStatScroll ? selectedStatScroll.target : null;
    const finalType = selectedTypeScroll ? selectedTypeScroll.target : null;

    // 2. İtem Üret
    const newItem = generateRandomItem(craftTier);
    if (finalType) newItem.type = finalType;
    
    // STAT HESAPLAMA DÜZELTMESİ (KRİTİK)
    if (finalStat) {
        newItem.propertyKeys = [finalStat];
        newItem.stats = {};
        
        const isResist = window.ITEM_CONFIG.resistsPool.includes(finalStat);
        const multiplier = isResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
        
        // Tier kaç ise o kadar tam puan ver (Örn: T5 x 1 = +5 Stat)
        newItem.stats[finalStat] = craftTier * multiplier;
        
        // İsim ve ikon güncelle
        const template = window.BASE_ITEMS[newItem.type][finalStat] || window.BASE_ITEMS[newItem.type][Object.keys(window.BASE_ITEMS[newItem.type])[0]];
        newItem.nameKey = template.nameKey;
        newItem.icon = template.icon;
    }

    // 3. Sonuç ve Temizlik
    // Scrollar tek kullanımlıktır, onları null yapıyoruz. Parçaların kalanı durur.
    selectedFragments = currentFragmentsStored;
    selectedStatScroll = null;
    selectedTypeScroll = null;
    
    addItemToInventory(newItem, 1);
    
    const resSlot = document.getElementById('synthesis-result-slot');
    resSlot.innerHTML = `<img src="items/images/${newItem.icon}">`;
    const resBadge = document.createElement('span');
    resBadge.className = `item-tier-badge badge-${newItem.tier}`;
    resBadge.textContent = `T${newItem.tier}`;
    resSlot.appendChild(resBadge);

    writeLog(`🛠️ Sentez Başarılı: ${getTranslatedItemName(newItem)} (T${newItem.tier})`);
	setTimeout(() => {
    const resSlot = document.getElementById('synthesis-result-slot');
    if (resSlot) {
        resSlot.innerHTML = '';
        resSlot.onmouseenter = null;
        resSlot.onmouseleave = null;
    }
	}, 3000);
    
    renderSynthesisUI();
    renderInventory();
    if(window.saveGame) window.saveGame();
};