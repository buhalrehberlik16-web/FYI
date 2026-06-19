// js/blacksmith/reforge_manager.js

let rSelectedJewelry = null;   // Reforge edilecek takı
let rSelectedModifier = null;  // Hedef belirleyici (Scroll veya Resist Stone)
let rPropertyToRemove = null; // Silinmek üzere seçilen özellik

window.openReforgeUI = function() {
    document.getElementById('reforge-screen').classList.remove('hidden');
    rSelectedJewelry = null;
    rSelectedModifier = null;
    rPropertyToRemove = null;
    renderReforgeUI();
};

window.closeReforgeUI = function() {
    // Slotlarda eşya kaldıysa çantaya iade et
    if (rSelectedJewelry) addItemToInventory(rSelectedJewelry, 1);
    if (rSelectedModifier) addItemToInventory(rSelectedModifier, 1);
    
    rSelectedJewelry = null;
    rSelectedModifier = null;
    rPropertyToRemove = null;
    
    document.getElementById('reforge-screen').classList.add('hidden');
    renderInventory();
};

function renderReforgeUI() {
    const itemSlot = document.getElementById('r-slot-item');
    const modSlot = document.getElementById('r-slot-modifier');
    const propList = document.getElementById('reforge-property-list');
    const costDiv = document.getElementById('reforge-cost-display');
    const btnDo = document.getElementById('btn-do-reforge');

    // Slotları Çiz
    drawReforgeSlot(itemSlot, rSelectedJewelry, 'item');
    drawReforgeSlot(modSlot, rSelectedModifier, 'modifier');

    // Dil dosyasını ve anahtarları al (Hata korumalı)
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const itemsLang = lang.items || {};

    // 1. ÖZELLİK LİSTESİ ALANI
    if (rSelectedJewelry && rSelectedJewelry.stats) {
        propList.innerHTML = ''; // Temizle
        Object.entries(rSelectedJewelry.stats).forEach(([key, val]) => {
            const card = document.createElement('div');
            card.className = `reforge-prop-card ${rPropertyToRemove === key ? 'selected' : ''}`;
            
            // Stat ismini al (Fonksiyon bozulsa bile key'i yazdırır)
            const statName = (typeof window.getStatDisplayName === 'function') 
                ? window.getStatDisplayName(key) 
                : key;
            
            card.innerHTML = `
                <span class="prop-name">${statName}</span>
                <span class="prop-val">+${val}</span>
            `;
            
            card.onclick = () => {
                rPropertyToRemove = key;
                renderReforgeUI(); // Seçim yapılınca ekranı tazele
            };
            propList.appendChild(card);
        });
    } else {
        // EŞYA YOKSA: Undefined yazmasını engelleyen güvenli metin
        // Dil dosyasında 'reforge_material_name' yoksa fallback olarak tırnak içindekini yazar
        const hintText = itemsLang.reforge_material_name || (currentLang === 'tr' ? "Yeniden dövülecek bir takı yerleştirin." : "Place a piece of jewelry to reforge.");
        propList.innerHTML = `<p style="color:#666; font-size:0.85em; padding:15px; font-style:italic;">${hintText}</p>`;
    }

    // 2. MALİYET VE BUTON ALANI
    if (rSelectedJewelry) {
        const tier = rSelectedJewelry.tier || 1;
        const goldReq = (window.REFORGE_CONFIG && window.REFORGE_CONFIG.goldCosts) ? window.REFORGE_CONFIG.goldCosts[tier] : 0;
        const fragReq = (window.CRAFTING_CONFIG && window.CRAFTING_CONFIG.requiredFragments) ? window.CRAFTING_CONFIG.requiredFragments[tier] : 0;
        
        const hasGold = hero.gold >= goldReq;
        const fragItem = hero.inventory.find(i => i && i.subtype === 'material');
        const hasFrags = fragItem && fragItem.count >= fragReq;

        // Dil anahtarları (Fallback korumalı)
        const goldTxt = lang.gold_label || (currentLang === 'tr' ? "Altın" : "Gold");
        const fragTxt = lang.fragments_label || (currentLang === 'tr' ? "Parça" : "Fragments");

        costDiv.innerHTML = `
    <div id="cost-gold">
        <i class="fas fa-coins" style="color:gold;"></i> 
        <span>${goldTxt}: <span style="color:${hasGold ? '#43FF64':'#ff4d4d'}">${goldReq}</span></span>
    </div>
    <div id="cost-fragments">
        <img src="items/images/drop_items/salvage_jewelry.webp" class="inline-icon"> 
        <span>${fragTxt}: <span style="color:${hasFrags ? '#43FF64':'#ff4d4d'}">${fragReq}</span></span>
    </div>
`;
        
        // Butonu sadece her şey tamamsa aç
        btnDo.disabled = !rPropertyToRemove || !hasGold || !hasFrags;
    } else {
        costDiv.innerHTML = '';
        btnDo.disabled = true;
    }

    renderReforgeInventory();
}


function drawReforgeSlot(el, item, slotType) {
    el.innerHTML = '';
    if (item) {
        const img = document.createElement('img');
        img.src = `items/images/${item.icon}`;
        el.appendChild(img);
        el.innerHTML += window.getItemBadgeHTML(item);

        el.onclick = (e) => {
            const isMobile = window.innerWidth <= 768;

            if (isMobile) {
                if (lastTappedSlot === el) {
                    // İKİNCİ TIK: Çantaya iade
                    window.hideItemTooltip();
                    addItemToInventory(item, 1);
                    if (slotType === 'item') { rSelectedJewelry = null; rPropertyToRemove = null; }
                    else rSelectedModifier = null;
                    lastTappedSlot = null;
                    renderReforgeUI();
                } else {
                    // İLK TIK: Bilgi
                    lastTappedSlot = el;
                    window.showItemTooltip(item, e);
                }
            } else {
                // PC: Doğrudan iade
                window.hideItemTooltip();
                addItemToInventory(item, 1);
                if (slotType === 'item') { rSelectedJewelry = null; rPropertyToRemove = null; }
                else rSelectedModifier = null;
                renderReforgeUI();
            }
        };
        
        // PC Hover Desteği
        el.onmouseenter = (e) => { if (window.innerWidth > 768) window.showItemTooltip(item, e); };
        el.onmouseleave = () => window.hideItemTooltip();
    } else {
        el.onclick = null;
        el.onmouseenter = null;
    }
}

function renderReforgeInventory() {
    const grid = document.getElementById('reforge-bag-grid');
    if (!grid) return;
    grid.innerHTML = '';

    hero.inventory.forEach((item, index) => {
        const slot = document.createElement('div');
        slot.className = 'item-slot bag-slot';
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);
            slot.innerHTML += window.getItemBadgeHTML(item);
            
            if (item.count > 1) {
                slot.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
            }

            // DÜZELTME: Sadece Reforge kuralı true olanlar (Takılar, Scrollar, Taşlar)
            const canReforgeUI = window.isItemAllowedInUI(item, 'reforge');
            
            if (canReforgeUI) {
                slot.onclick = () => {
                    window.hideItemTooltip();
                    // Takı ise sol kutuya, diğerleri (modifier) ise sağ kutuya
                    if (item.subtype === 'jewelry') {
                        if (rSelectedJewelry) addItemToInventory(rSelectedJewelry, 1);
                        rSelectedJewelry = item;
                        hero.inventory[index] = null;
                    } else {
                        if (rSelectedModifier) addItemToInventory(rSelectedModifier, 1);
                        rSelectedModifier = item;
                        hero.inventory[index] = null;
                    }
                    rPropertyToRemove = null; // Takı değişince seçim sıfırlansın
                    renderReforgeUI();
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

window.processReforge = function() {
    if (!rSelectedJewelry || !rPropertyToRemove) return;

    const tier = rSelectedJewelry.tier;
    const goldReq = window.REFORGE_CONFIG.goldCosts[tier];
    const fragReq = window.CRAFTING_CONFIG.requiredFragments[tier];
    const fragItem = hero.inventory.find(i => i && i.subtype === 'material');

    // --- MATEMATİKSEL DÖNÜŞÜM (Point Pool) ---
    
    // 1. Silinen özelliğin "Ham Puan"ını bul (Value / Multiplier)
    const isOldResist = window.ITEM_CONFIG.resistsPool.includes(rPropertyToRemove);
    const oldMult = isOldResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
    const rawPoints = rSelectedJewelry.stats[rPropertyToRemove] / oldMult;

    // 2. Yeni Hedef Özelliği Belirle
    let targetStat = null;
    if (rSelectedModifier && rSelectedModifier.target) {
        targetStat = rSelectedModifier.target;
    } else {
        // Rastgele seçim (Mevcut statlardan farklı olmasını tercih edebiliriz ama zorunlu değil)
        const pool = [...window.ITEM_CONFIG.statsPool, ...window.ITEM_CONFIG.resistsPool];
        const currentStats = Object.keys(rSelectedJewelry.stats);
        const filteredPool = pool.filter(s => s !== rPropertyToRemove);
        targetStat = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    }

    // 3. Eşyayı Güncelle
    delete rSelectedJewelry.stats[rPropertyToRemove]; // Eskiyi sil
    
    const isNewResist = window.ITEM_CONFIG.resistsPool.includes(targetStat);
    const newMult = isNewResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
    const newValue = rawPoints * newMult;

    // Eğer zaten o stat varsa üzerine ekle, yoksa yeni aç
    rSelectedJewelry.stats[targetStat] = (rSelectedJewelry.stats[targetStat] || 0) + newValue;
    rSelectedJewelry.propertyKeys = Object.keys(rSelectedJewelry.stats);

    // İsim ve İkon Güncelleme (Ana stat değişmiş olabilir)
    const mainStat = rSelectedJewelry.propertyKeys[0];
    const template = window.BASE_ITEMS[rSelectedJewelry.type][mainStat] || window.BASE_ITEMS[rSelectedJewelry.type][Object.keys(window.BASE_ITEMS[rSelectedJewelry.type])[0]];
    rSelectedJewelry.nameKey = template.nameKey;
    rSelectedJewelry.icon = template.icon;

    // 4. Ödemeleri Al
    hero.gold -= goldReq;
    fragItem.count -= fragReq;
    if (fragItem.count <= 0) {
        const fIdx = hero.inventory.indexOf(fragItem);
        hero.inventory[fIdx] = null;
    }

    // Modifier tek kullanımlıktır, yok et
    rSelectedModifier = null;

    // 5. Kayıt ve Temizlik
    writeLog(`🔨 Reforge: ${window.getStatDisplayName(rPropertyToRemove)} silindi, +${newValue} ${window.getStatDisplayName(targetStat)} eklendi.`);
    window.CalendarManager.passDay(false);
	
    rPropertyToRemove = null;
    updateGoldUI();
    renderReforgeUI();
    renderInventory();
    if(window.saveGame) window.saveGame();
};