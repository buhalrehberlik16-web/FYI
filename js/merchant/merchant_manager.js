// js/ui/merchant_manager.js

window.merchantStock = [];
window.currentTradeMode = 'buy';

// 1. STOK YENİLEME
window.refreshMerchantStock = function() {
    window.merchantStock = [];
    const progress = hero.highestTierDefeated || 1;
    let targetTier = 1;

    for (let i = 0; i < window.MERCHANT_CONFIG.stockCount; i++) {
        // Tier belirleme mantığı aynı kalıyor...
        if (progress === 1) targetTier = 1;
        else if (progress === 2) targetTier = Math.random() < 0.5 ? 1 : 2;
        else if (progress === 3) targetTier = 2;
        else if (progress === 4) targetTier = Math.random() < 0.5 ? 2 : 3;
        else targetTier = Math.floor(progress * 0.7) || 1;

        if (Math.random() < 0.5) { 
            // %50 Normal Takı
            window.merchantStock.push(generateRandomItem(targetTier));
        } else {
            // %50 Özel Eşya (Lizard veya Scroll)
            const randomBase = window.SPECIAL_MERCH_ITEMS[Math.floor(Math.random() * window.SPECIAL_MERCH_ITEMS.length)];
            
            // Kopyasını oluştur
            const newItem = { ...randomBase };

            // Eğer bu bir pasif charm (Lizard) ise, Tier'a göre stat ver
            if (newItem.type === "passive_charm") {
                newItem.tier = targetTier;
                newItem.stats = {};
                const resistValue = targetTier * (window.ITEM_CONFIG.multipliers.resists || 3);
                newItem.stats[newItem.resistType] = resistValue;
            }

            window.merchantStock.push(newItem);
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
    slot.className = 'item-slot'; 
    slot.style.position = 'relative';
    
    const img = document.createElement('img');
    img.src = item.icon.startsWith('items/') ? item.icon : `items/images/${item.icon}`;
    slot.appendChild(img);

    // Rozet (T1, T2 vb.)
    slot.innerHTML += window.getItemBadgeHTML(item);

    // Fiyat Etiketi
    const price = calculateItemPrice(item, isBuying);
    const priceTag = document.createElement('span');
    priceTag.className = 'price-tag';
    priceTag.innerHTML = `${price}<i class="fas fa-coins"></i>`;
    slot.appendChild(priceTag);

    // Tıklama ve Tooltip
    slot.onclick = (e) => {
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            if (lastTappedSlot === slot) {
                window.hideItemTooltip();
                action(); // Satın al veya Sat
                lastTappedSlot = null;
            } else {
                lastTappedSlot = slot;
                window.showItemTooltip(item, e);
            }
        } else {
            window.hideItemTooltip();
            action();
        }
    };
    
    // BURASI ÖNEMLİ: Broş bilgilerini hoverda görmek için
    slot.onmouseenter = (e) => window.showItemTooltip(item, e);
    slot.onmouseleave = () => window.hideItemTooltip();
    slot.onmousemove = (e) => {
        const tooltip = document.getElementById('item-tooltip');
        if(tooltip) {
            tooltip.style.left = (e.clientX + 15) + 'px';
            tooltip.style.top = (e.clientY + 15) + 'px';
        }
    };
    
    return slot;
}

window.calculateItemPrice = function(item, isBuying) {
    if (!item) return 0;

    // 1. BİRİM FİYAT BELİRLEME
    let unitPrice = window.MERCHANT_CONFIG?.sellPrices[item.tier] || 1;

    // ÖZEL DURUM: Takı parçaları (materyaller) her zaman 1 Gold olsun (Senin isteğin)
    if (item.subtype === 'material') {
        unitPrice = 1; 
    }

    // 2. ALIŞ/SATIŞ ÇARPANI
    // Dükkan satarken (isBuying: true) daha pahalıya satar
    let finalPrice = isBuying ? unitPrice * (window.MERCHANT_CONFIG?.buyMultiplier || 4) : unitPrice;

    // 3. MİKTAR ÇARPANI (KRİTİK DÜZELTME)
    // Eğer eşya bir yığın (stack) ise, birim fiyatı adetle çarp
    const count = item.count || 1;
    finalPrice = Math.floor(finalPrice * count);

    return finalPrice;
};

// 5. SATIN ALMA VE SATMA (Onaylı)
window.buyItemFromMerchant = function(index) {
    const item = window.merchantStock[index];
    const price = calculateItemPrice(item, true);
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

    if (hero.gold < price) {
        window.showAlert(lang.not_enough_msg);
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
            window.showAlert(lang.bag_full_msg);
        }
    });
};

window.sellItemToMerchant = function(index) {
    const item = hero.inventory[index];
    if (!item) return;

    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

    // showTradeConfirm'e miktar seçiminden sonra ne yapacağını söylüyoruz
    window.showTradeConfirm(lang.confirm_sell, item, (chosenQty) => {
        const unitPrice = (item.subtype === 'material') ? 1 : (window.MERCHANT_CONFIG?.sellPrices[item.tier] || 1);
        const totalGoldEarned = unitPrice * chosenQty;

        hero.gold += totalGoldEarned;

        // Eşya miktarını düş veya tamamen sil
        if (item.count && item.count > chosenQty) {
            item.count -= chosenQty; // Sadece satılan kadar eksilt
        } else {
            hero.inventory[index] = null; // Hepsi satıldıysa slotu boşalt
        }

        updateGoldUI();
        renderMerchantUI();
        writeLog(`💰 ${chosenQty}x ${getTranslatedItemName(item)} ${totalGoldEarned} altına satıldı.`);
        if(window.saveGame) window.saveGame();
    });
};

let currentSellAmount = 1;

window.showTradeConfirm = function(msg, item, onConfirm) {
    const modal = document.getElementById('trade-confirm-modal');
    const textEl = document.getElementById('trade-confirm-text');
    const nameEl = document.getElementById('confirm-item-name');
    const statsEl = document.getElementById('confirm-item-stats');
    
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;

    // 1. Başlangıç Miktarı
    currentSellAmount = (item.count && item.count > 1) ? item.count : 1;

    // 2. Fiyat Güncelleme (Canlı)
    const updateModalDisplay = () => {
        const unitPrice = (item.subtype === 'material') ? 1 : (window.MERCHANT_CONFIG?.sellPrices[item.tier] || 1);
        const totalPrice = unitPrice * currentSellAmount;
        
        // Üst mesaj ve Toplam Fiyat
        textEl.innerHTML = `${msg} <br> <span style="color:gold; font-size:1.3rem; font-weight:bold;">${totalPrice} <i class="fas fa-coins"></i></span>`;
        
        // Miktar Yazısı
        const qtyText = document.getElementById('modal-qty-value');
        if (qtyText) qtyText.textContent = `x${currentSellAmount}`;
    };

    // 3. Arayüzü İnşa Et
    const levelLabel = window.getItemLevelLabel(item);
    const isStackable = item.count && item.count > 1;

    nameEl.innerHTML = `
        <div class="confirm-name-text">${getTranslatedItemName(item)}</div>
        <div class="confirm-tier-text ${rules.badgeType === "tier" ? 'tier-' + item.tier : ''}">${levelLabel}</div>
        
        ${isStackable ? `
            <div class="quantity-selector-container">
                <button id="qty-minus" class="qty-btn">-</button>
                <div id="modal-qty-value" class="qty-display">x${currentSellAmount}</div>
                <button id="qty-plus" class="qty-btn">+</button>
            </div>
        ` : ""}
    `;

    // 4. Buton Olaylarını Bağla (Sadece yığınlanabilirse)
    if (isStackable) {
        document.getElementById('qty-minus').onclick = () => {
            if (currentSellAmount > 1) {
                currentSellAmount--;
                updateModalDisplay();
            }
        };
        document.getElementById('qty-plus').onclick = () => {
            if (currentSellAmount < item.count) {
                currentSellAmount++;
                updateModalDisplay();
            }
        };
    }

    updateModalDisplay();

    // 5. Statlar (Materyal değilse göster)
    statsEl.innerHTML = '';
    if (item.stats && item.subtype !== 'material') {
        for (const [statKey, value] of Object.entries(item.stats)) {
            const statName = window.getStatDisplayName(statKey);
            statsEl.innerHTML += `<div>${statName}: <span class="tooltip-val">+${value}</span></div>`;
        }
    }

    modal.classList.remove('hidden');
    
    // EVET / HAYIR
    document.getElementById('trade-confirm-yes').onclick = () => {
        onConfirm(currentSellAmount);
        modal.classList.add('hidden');
    };
    document.getElementById('trade-confirm-no').onclick = () => {
        modal.classList.add('hidden');
    };

};
