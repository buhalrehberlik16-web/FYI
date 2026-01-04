// js/ui/merchant_manager.js

window.merchantStock = [];
window.currentTradeMode = 'buy';

// 1. STOK YENİLEME
window.refreshMerchantStock = function() {
    console.log("🛠️ Dükkan stoku yenileniyor...");
    window.merchantStock = [];
    const progress = (window.hero && window.hero.highestTierDefeated) ? window.hero.highestTierDefeated : 1;
    let targetTier = 1;

    for (let i = 0; i < (window.MERCHANT_CONFIG?.stockCount || 6); i++) {
        // Tier Belirleme Mantığı
        if (progress === 1) targetTier = 1;
        else if (progress === 2) targetTier = Math.random() < 0.5 ? 1 : 2;
        else if (progress === 3) targetTier = 2;
        else if (progress === 4) targetTier = Math.random() < 0.5 ? 2 : 3;
        else targetTier = Math.max(1, Math.floor(progress * 0.7));

        if (Math.random() < 0.5) { 
            window.merchantStock.push(generateRandomItem(targetTier));
        } else { 
            const base = window.SPECIAL_MERCH_ITEMS[Math.floor(Math.random() * window.SPECIAL_MERCH_ITEMS.length)];
            const charmItem = {
                ...base,
                tier: targetTier,
                type: "passive_charm",
                stats: {}
            };
            const resistValue = targetTier * (window.ITEM_CONFIG?.multipliers?.resists || 3);
            charmItem.stats[base.resistType] = resistValue;
            window.merchantStock.push(charmItem);
        }
    }
};

// 2. TİCARET EKRANINI AÇ
window.openMerchantTrade = function(mode) {
    console.log("🛒 openMerchantTrade tetiklendi. Mod:", mode);
    window.currentTradeMode = mode;
    
    if (window.merchantStock.length === 0) {
        window.refreshMerchantStock();
    }

    const screen = document.getElementById('merchant-trade-screen');
    
    if (screen) {
        // Ekranı görünür yap
        screen.classList.remove('hidden');
        screen.style.display = 'flex'; // Zorla görünür yap
        console.log("✅ Trade ekranı açıldı.");
        renderMerchantUI();
    } else {
        console.error("❌ HATA: 'merchant-trade-screen' bulunamadı! HTML'i kontrol et.");
    }
};

window.closeMerchantTrade = function() {
    const screen = document.getElementById('merchant-trade-screen');
    if(screen) {
        screen.classList.add('hidden');
        screen.style.display = 'none';
    }
};

// 3. UI RENDER
window.renderMerchantUI = function() {
    console.log("🎨 Dükkan arayüzü çiziliyor...");
    const grid = document.getElementById('trade-grid');
    const title = document.getElementById('trade-title');
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    if (!grid || !title) {
        console.error("❌ HATA: 'trade-grid' veya 'trade-title' bulunamadı!");
        return;
    }
    
    grid.innerHTML = '';

    if (window.currentTradeMode === 'buy') {
        title.textContent = lang.buy_btn || "BUY";
        window.merchantStock.forEach((item, index) => {
            const slot = createTradeSlot(item, () => buyItemFromMerchant(index), true);
            grid.appendChild(slot);
        });
    } else {
        title.textContent = lang.sell_btn || "SELL";
        window.hero.inventory.forEach((item, index) => {
            if (item) {
                const slot = createTradeSlot(item, () => sellItemToMerchant(index), false);
                grid.appendChild(slot);
            } else {
                const empty = document.createElement('div');
                empty.className = 'item-slot';
                grid.appendChild(empty);
            }
        });
    }
};

// 4. SLOT OLUŞTURMA
function createTradeSlot(item, action, isBuying) {
    const slot = document.createElement('div');
    slot.className = `item-slot badge-${item.tier || 1}`;
    slot.style.position = 'relative'; // Fiyat etiketi için şart
    
    const img = document.createElement('img');
    // İkon yolunu garantiye alalım
    let iconPath = item.icon;
    if (!iconPath.startsWith('items/images/')) {
        iconPath = `items/images/${item.icon}`;
    }
    img.src = iconPath;
    slot.appendChild(img);

    const price = calculateItemPrice(item, isBuying);
    const priceTag = document.createElement('span');
    priceTag.className = 'price-tag';
    priceTag.innerHTML = `${price}<i class="fas fa-coins" style="color:gold; margin-left:3px;"></i>`;
    slot.appendChild(priceTag);

    const badge = document.createElement('span');
    badge.className = `item-tier-badge badge-${item.tier || 1}`;
    badge.textContent = `T${item.tier || 1}`;
    slot.appendChild(badge);

    slot.onclick = () => {
        window.hideItemTooltip();
        action();
    };
    
    slot.onmouseenter = (e) => window.showItemTooltip(item, e);
    slot.onmouseleave = () => window.hideItemTooltip();
    
    return slot;
}

window.calculateItemPrice = function(item, isBuying) {
    if (!item) return 0;
    const basePrice = window.MERCHANT_CONFIG?.sellPrices[item.tier] || 3;
    return isBuying ? basePrice * (window.MERCHANT_CONFIG?.buyMultiplier || 4) : basePrice;
};

// 5. SATIN ALMA VE SATMA (Onaylı)
window.buyItemFromMerchant = function(index) {
    const item = window.merchantStock[index];
    const price = calculateItemPrice(item, true);
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

    if (hero.gold < price) {
        alert(window.gameSettings.lang === 'tr' ? "Yetersiz altın!" : "Not enough gold!");
        return;
    }

    // showTradeConfirm fonksiyonu interaction_ui.js içinde olmalı veya aşağıya eklenmeli
    showTradeConfirm(lang.confirm_buy, item, () => {
        const emptySlot = hero.inventory.indexOf(null);
        if (emptySlot !== -1) {
            hero.gold -= price;
            hero.inventory[emptySlot] = item;
            window.merchantStock.splice(index, 1);
            updateGoldUI();
            renderMerchantUI();
            writeLog(`💰 ${getTranslatedItemName(item)} satın alındı.`);
            if(window.saveGame) window.saveGame();
        } else {
            alert("Envanter dolu!");
        }
    });
};

window.sellItemToMerchant = function(index) {
    const item = hero.inventory[index];
    if (!item) return;

    const price = calculateItemPrice(item, false);
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

    showTradeConfirm(lang.confirm_sell, item, () => {
        hero.gold += price;
        hero.inventory[index] = null;
        updateGoldUI();
        renderMerchantUI();
        writeLog(`💰 ${getTranslatedItemName(item)} ${price} altına satıldı.`);
        if(window.saveGame) window.saveGame();
    });
};

window.showTradeConfirm = function(msg, item, onConfirm) {
    const modal = document.getElementById('trade-confirm-modal');
    const textEl = document.getElementById('trade-confirm-text');
    const nameEl = document.getElementById('confirm-item-name');
    const statsEl = document.getElementById('confirm-item-stats');

    // 1. Ana mesajı yaz (Satın alıyor musun? / Satıyor musun?)
    textEl.textContent = msg;

    // 2. Eşya ismini ve rengini ayarla
    nameEl.textContent = getTranslatedItemName(item) + ` (T${item.tier})`;
    nameEl.className = `tier-${item.tier}`; // Daha önce yaptığımız renk sınıflarını kullanır

    // 3. Eşya statlarını listele
    statsEl.innerHTML = '';
    for (const [statKey, value] of Object.entries(item.stats)) {
        const statName = window.getStatDisplayName(statKey);
        statsEl.innerHTML += `<div>${statName}: <span style="color:#43FF64">+${value}</span></div>`;
    }

    modal.classList.remove('hidden');
    
    document.getElementById('trade-confirm-yes').onclick = () => {
        onConfirm();
        modal.classList.add('hidden');
    };
    document.getElementById('trade-confirm-no').onclick = () => {
        modal.classList.add('hidden');
    };
};