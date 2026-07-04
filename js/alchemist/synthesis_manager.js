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
    fragStatus.innerHTML = `
    <img src="items/images/drop_items/salvage_jewelry.webp" class="inline-icon">
    ${lang.items.needed_fragments}: 
    <span style="color:${currentFrags >= req ? '#43FF64' : '#ff4d4d'}">${currentFrags} / ${req}</span>
`;

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
        el.innerHTML += window.getItemBadgeHTML(item);

        if (item.count && item.count > 1) {
            el.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
        }

        el.onclick = (e) => {
            e.stopPropagation();
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                if (lastTappedSlot === el) {
                    // İKİNCİ TIK: Çantaya iade
                    window.hideItemTooltip();
                    addItemToInventory(item, item.count || 1);
                    if (slotType === 'fragments') selectedFragments = null;
                    if (slotType === 'stat') selectedStatScroll = null;
                    if (slotType === 'type') selectedTypeScroll = null;
                    lastTappedSlot = null;
                    renderSynthesisUI();
                    renderInventory();
                } else {
                    // İLK TIK: Bilgi
                    lastTappedSlot = el;
                    window.showItemTooltip(item, e);
                }
            } else {
                // PC: Doğrudan iade
                window.hideItemTooltip();
                addItemToInventory(item, item.count || 1);
                if (slotType === 'fragments') selectedFragments = null;
                if (slotType === 'stat') selectedStatScroll = null;
                if (slotType === 'type') selectedTypeScroll = null;
                renderSynthesisUI();
                renderInventory();
            }
        };
        
        el.onmouseenter = (e) => { if (window.innerWidth > 768) window.showItemTooltip(item, e); };
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
    const btn = document.getElementById('btn-do-synthesis');
    if (btn.disabled) return; 

    const req = window.CRAFTING_CONFIG.requiredFragments[craftTier];
    if (!selectedFragments || selectedFragments.count < req) {
        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
        window.showAlert(lang.not_enough_syn); 
        return;
    }

    btn.disabled = true;

    // 1. Materyal Tüketimi
    selectedFragments.count -= req;
    const leftoverFragments = selectedFragments.count > 0 ? { ...selectedFragments } : null;
    
    const finalStat = selectedStatScroll ? selectedStatScroll.target : null;
    const finalType = selectedTypeScroll ? selectedTypeScroll.target : null;

    // 2. EŞYA ÜRETİMİ (Başlangıç)
    const newItem = generateRandomItem(craftTier, false); // false: Sentezde defans yasak
    newItem.subtype = "jewelry";
    if (finalType) newItem.type = finalType; // Eğer Type Scroll varsa türü değiştir

    // --- 3. KİMLİK BELİRLEME (Kader Zar) ---
    // Stat dağıtılmadan ÖNCE takının hangi sete ait olacağına karar veriyoruz
    let coreIdentity = null;
    if (finalStat) {
        coreIdentity = finalStat; // Scroll varsa kimlik odur
    } else {
        // Scroll yoksa tüm havuzdan (Statlar + Resistler) rastgele bir kimlik seç
        const allPossible = [...window.ITEM_CONFIG.statsPool, ...window.ITEM_CONFIG.resistsPool];
        coreIdentity = allPossible[Math.floor(Math.random() * allPossible.length)];
    }

    // Takının SET RENGİNİ (Identity) şimdi çiviliyoruz
    newItem.color = coreIdentity;
    newItem.stats = {};
    newItem.propertyKeys = [];

    // --- 4. PUAN DAĞITIMI (Transmute ile Senkronize) ---
    let totalPoints = Math.max(1, Math.floor(craftTier * 2) - 2);

    // KURAL: Karar verilen kimlik (coreIdentity) mutlaka en az 1 puan almalı
    const addPoint = (statKey) => {
        if (!newItem.propertyKeys.includes(statKey)) newItem.propertyKeys.push(statKey);
        const isResist = window.ITEM_CONFIG.resistsPool.includes(statKey);
        const mult = isResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
        newItem.stats[statKey] = (newItem.stats[statKey] || 0) + mult;
    };

    // İlk puanı mecburen kimlik statına veriyoruz
    addPoint(coreIdentity);
    totalPoints--;

    // Kalan puanları tamamen rastgele dağıtıyoruz (Kimlikten bağımsız!)
    // Bu sayede 1 VIT (Kimlik) / 3 STR (Şans) gibi eşyalar oluşabilir.
    while (totalPoints > 0) {
        const pool = [...window.ITEM_CONFIG.statsPool, ...window.ITEM_CONFIG.resistsPool];
        const randomStat = pool[Math.floor(Math.random() * pool.length)];
        
        // Bir eşyada en fazla 3 farklı özellik olabilir kuralını koru
        if (!newItem.propertyKeys.includes(randomStat) && newItem.propertyKeys.length >= 3) {
            // Eğer 3 stat dolduysa mevcutlardan birine ekle
            const existingStat = newItem.propertyKeys[Math.floor(Math.random() * 3)];
            addPoint(existingStat);
        } else {
            addPoint(randomStat);
        }
        totalPoints--;
    }

    // --- 5. İSİMLENDİRME VE GÖRSEL (Kimliğe Göre) ---
    const mainStatsPool = ['str', 'dex', 'int', 'vit', 'mp_pow'];
    let imgPrefix = newItem.type === 'necklace' ? 'neck' : (newItem.type === 'earring' ? 'ear' : newItem.type);

    if (mainStatsPool.includes(coreIdentity)) {
        // Kimlik ana stat ise: İkon ve isim o statın şablonundan gelir
        const template = window.BASE_ITEMS[newItem.type][coreIdentity];
        newItem.nameKey = template.nameKey;
        newItem.icon = template.icon;
    } else {
        // Kimlik Element ise: Siyah (Blank) ikon kullanılır
        newItem.icon = `accesories/${imgPrefix}_blank.webp`;
        
        // İsim için; eğer içinde ana stat varsa onu kullan, yoksa element ismini kullan
        let luckyMainStat = newItem.propertyKeys.find(k => mainStatsPool.includes(k));
        if (luckyMainStat) {
            newItem.nameKey = window.BASE_ITEMS[newItem.type][luckyMainStat].nameKey;
        } else {
            newItem.nameKey = `item_${imgPrefix}_${coreIdentity}`;
        }
    }

    // 6. Envantere Ekleme ve Temizlik
    addItemToInventory(newItem, 1);
    if (leftoverFragments) addItemToInventory(leftoverFragments, leftoverFragments.count);

    selectedFragments = null;
    selectedStatScroll = null;
    selectedTypeScroll = null;
    
    // UI Güncelleme... (Geri kalan kod aynı)
    const resSlot = document.getElementById('synthesis-result-slot');
    if (resSlot) {
        resSlot.innerHTML = `<img src="items/images/${newItem.icon}">${window.getItemBadgeHTML(newItem)}`;
        setTimeout(() => { resSlot.innerHTML = ''; }, 3000);
    }
    renderSynthesisUI();
    renderInventory();
    if(window.saveGame) window.saveGame();
    setTimeout(() => { btn.disabled = false; }, 500);
    window.CalendarManager.passDay(false);
};