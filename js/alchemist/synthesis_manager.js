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

        // YENİ: Merkezi badge sistemi (C veya T otomatik basılır)
        el.innerHTML += window.getItemBadgeHTML(item);

        if (item.count && item.count > 1) {
            el.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
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

            // YENİ: Merkezi badge sistemi
            slot.innerHTML += window.getItemBadgeHTML(item);

            if (item.isStack && item.count > 1) {
                slot.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
            }
            
            // YENİ: Kural kontrolü - "Bu item sentezde kullanılabilir mi?"
            const isValidForSynthesis = window.isItemAllowedInUI(item, 'alchemist_synthesis');

            if(isValidForSynthesis) {
                slot.onclick = () => {
                    // Tipine göre ilgili kutuya gönder
                    if (item.subtype === 'material' && !selectedFragments) {
                        selectedFragments = {...item};
                        hero.inventory[index] = null;
                    } else if (item.subtype === 'scroll' && item.type === 'stat_scroll' && !selectedStatScroll) {
                        selectedStatScroll = {...item};
                        hero.inventory[index] = null;
                    } else if (item.subtype === 'scroll' && item.type === 'type_scroll' && !selectedTypeScroll) {
                        selectedTypeScroll = {...item};
                        hero.inventory[index] = null;
                    }
                    renderSynthesisUI();
                };
            } else {
                // Sentezlenemez (takılar vb.) soluk görünür
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
    // 1. GÜVENLİK KONTROLÜ (Çift tıklamayı engellemek için butonu hemen kilitleyelim)
    const btn = document.getElementById('btn-do-synthesis');
    if (btn.disabled) return; 

    const req = window.CRAFTING_CONFIG.requiredFragments[craftTier];
    if (!selectedFragments || selectedFragments.count < req) {
        alert(window.gameSettings.lang === 'tr' ? "Yetersiz materyal!" : "Not enough materials!");
        return;
    }

    // Butonu geçici olarak kilitle (Logic bitene kadar)
    btn.disabled = true;

    // 2. MATERYAL TÜKETİMİ
    // Parçaları eksilt
    selectedFragments.count -= req;
    
    // Eğer parça kaldıysa değişkende tut, bittiyse null yap
    const leftoverFragments = selectedFragments.count > 0 ? { ...selectedFragments } : null;
    
    // Scrollardan hedefleri al ve scrolları "tüket" (null yap)
    const finalStat = selectedStatScroll ? selectedStatScroll.target : null;
    const finalType = selectedTypeScroll ? selectedTypeScroll.target : null;

    // 3. EŞYA ÜRETİMİ (Sadece 1 adet newItem oluşturulur)
    const newItem = generateRandomItem(craftTier);
    newItem.subtype = "jewelry"; // Merkezi kural sistemine uyum

    // Eğer Type Scroll (Yüzük, Kolye vb.) konulduysa türü değiştir
    if (finalType) {
        newItem.type = finalType;
    }
    
    // Eğer Stat Scroll (STR, DEX vb.) konulduysa statları sıfırla ve scrollunkini yaz
    if (finalStat) {
        newItem.propertyKeys = [finalStat];
        newItem.stats = {};
        
        const isResist = window.ITEM_CONFIG.resistsPool.includes(finalStat);
        const multiplier = isResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
        
        // Tier kadar tam puan ver
        newItem.stats[finalStat] = craftTier * multiplier;
        
        // İsim ve İkonu şablondan güncelle (BASE_ITEMS'tan çek)
        const template = window.BASE_ITEMS[newItem.type][finalStat] || 
                         window.BASE_ITEMS[newItem.type][Object.keys(window.BASE_ITEMS[newItem.type])[0]];
        
        newItem.nameKey = template.nameKey;
        newItem.icon = template.icon;
    }

    // 4. ENVANTERE EKLEME
    // Üretilen takıyı ekle
    addItemToInventory(newItem, 1);
    
    // Varsa artan parçaları (leftover) çantaya geri koy
    if (leftoverFragments) {
        addItemToInventory(leftoverFragments, leftoverFragments.count);
    }

    // 5. TEMİZLİK VE GÖRSEL SONUÇ
    selectedFragments = null; // Kutudaki parça referansını temizle
    selectedStatScroll = null;
    selectedTypeScroll = null;
    
    // Sonuç slotunda göster
    const resSlot = document.getElementById('synthesis-result-slot');
    if (resSlot) {
        resSlot.innerHTML = `<img src="items/images/${newItem.icon}">`;
        resSlot.innerHTML += window.getItemBadgeHTML(newItem);
        
        // 3 saniye sonra görseli temizle
        setTimeout(() => { resSlot.innerHTML = ''; }, 3000);
    }

    writeLog(`🛠️ ${window.gameSettings.lang === 'tr' ? 'Sentez Başarılı:' : 'Synthesis Success:'} ${getTranslatedItemName(newItem)} (T${newItem.tier})`);
    
    // UI ve Ana Envanteri tazele
    renderSynthesisUI();
    renderInventory();
    
    if(window.saveGame) window.saveGame();

    // İşlem bitti, butonu geri aç (renderSynthesisUI zaten kontrol edecektir ama garanti olsun)
    setTimeout(() => { btn.disabled = false; }, 500);
};