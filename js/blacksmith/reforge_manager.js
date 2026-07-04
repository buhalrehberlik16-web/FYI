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

    // 1. Silinen özelliğin "Ham Puan"ını bul (Savunma bu döngüye giremez)
    const isOldResist = window.ITEM_CONFIG.resistsPool.includes(rPropertyToRemove);
    const oldMult = isOldResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
    const rawPoints = rSelectedJewelry.stats[rPropertyToRemove] / oldMult;

    // Eskiyi sil
    delete rSelectedJewelry.stats[rPropertyToRemove];

    // 2. Yeni Hedef Özelliği Belirle
    let targetStat = null;
    if (rSelectedModifier && rSelectedModifier.target) {
        targetStat = rSelectedModifier.target;
    } else {
        // Rastgele seçim (Savunma buraya dahil değil)
        const pool = [...window.ITEM_CONFIG.statsPool, ...window.ITEM_CONFIG.resistsPool];
        const currentStats = Object.keys(rSelectedJewelry.stats);
        const filteredPool = pool.filter(s => s !== rPropertyToRemove && !currentStats.includes(s));
        targetStat = filteredPool[Math.floor(Math.random() * filteredPool.length)];
    }

    // 3. Eşyayı Güncelle ve Puanı Aktar
    const isNewResist = window.ITEM_CONFIG.resistsPool.includes(targetStat);
    const newMult = isNewResist ? window.ITEM_CONFIG.multipliers.resists : window.ITEM_CONFIG.multipliers.stats;
    const newValue = Math.floor(rawPoints * newMult);

    rSelectedJewelry.stats[targetStat] = (rSelectedJewelry.stats[targetStat] || 0) + newValue;
    rSelectedJewelry.propertyKeys = Object.keys(rSelectedJewelry.stats);

    // --- KRİTİK: SET RENGİ VE İKON GÜNCELLEME ---
    const mainStatsPool = ['str', 'dex', 'int', 'vit', 'mp_pow'];
    
    // Eğer yeni stat bir ana stat ise (STR, INT vb.) rengi ve ikonu ona göre güncelle
    if (mainStatsPool.includes(targetStat)) {
        rSelectedJewelry.color = targetStat; // Set bonusunu yeni stat'a bağla
        const template = window.BASE_ITEMS[rSelectedJewelry.type][targetStat];
        rSelectedJewelry.nameKey = template.nameKey;
        rSelectedJewelry.icon = template.icon;
    } else {
        // Eğer yeni stat bir element ise (Ateş vb.)
        // İsimlendirme için takıda kalan ilk ana statı bulmaya çalış
        let fallbackStat = rSelectedJewelry.propertyKeys.find(k => mainStatsPool.includes(k));
        
        if (fallbackStat) {
            // Eğer takıda hala bir ana stat varsa (örn: STR), ismi ve rengi o korur
            rSelectedJewelry.color = fallbackStat;
            const template = window.BASE_ITEMS[rSelectedJewelry.type][fallbackStat];
            rSelectedJewelry.nameKey = template.nameKey;
            rSelectedJewelry.icon = template.icon;
        } else {
            // Eğer hiç ana stat kalmadıysa (sadece elementler varsa), Blank görseli kullan
            let imgPrefix = rSelectedJewelry.type === 'necklace' ? 'neck' : (rSelectedJewelry.type === 'earring' ? 'ear' : rSelectedJewelry.type);
            rSelectedJewelry.icon = `accesories/${imgPrefix}_blank.webp`;
            rSelectedJewelry.nameKey = `item_${imgPrefix}_${targetStat}`;
            rSelectedJewelry.color = targetStat; 
        }
    }

    // 4. Ödemeleri Al
    hero.gold -= goldReq;
    if (fragItem) {
        fragItem.count -= fragReq;
        if (fragItem.count <= 0) {
            hero.inventory[hero.inventory.indexOf(fragItem)] = null;
        }
    }

    // Modifier tüket
    rSelectedModifier = null;

    // 5. Kayıt ve Temizlik
    writeLog(`🔨 Reforge: ${window.getStatDisplayName(rPropertyToRemove)} silindi, +${newValue} ${window.getStatDisplayName(targetStat)} eklendi.`);
    window.CalendarManager.passDay(false); // Craft işlemi atın süresini düşürmez
	
    rPropertyToRemove = null;
    updateGoldUI();
    renderReforgeUI();
    renderInventory();
    if(window.saveGame) window.saveGame();
};