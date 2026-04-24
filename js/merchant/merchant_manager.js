// js/ui/merchant_manager.js

window.merchantStock = [];
window.currentTradeMode = 'buy';
window.currentMerchantDiscount = 1.0; // Varsayılan: İndirim yok

// 1. STOK YENİLEME
window.refreshMerchantStock = function(count = 8) { // Varsayılan değer 8 yapıldı
    console.log(`🛒 Tüccar stokları yenileniyor (${count} eşya)...`);
    window.merchantStock = [];
    const progress = (window.hero && window.hero.highestTierDefeated) ? window.hero.highestTierDefeated : 1;

    // Eşya üretme döngüsü - count parametresine göre döner
    for (let i = 0; i < count; i++) {
        // Eğer gezgin tüccarsa (count 4 ise) sadece takı üret
        if (count === 4) {
            window.merchantStock.push(generateRandomItem(progress));
        } 
        // Normal tüccarsa (count 8 ise) senin orijinal 4 takı + 2 parşömen + 2 rastgele mantığını çalıştır
        else {
            if (i < 4) {
                window.merchantStock.push(generateRandomItem(progress));
            } else if (i < 6) {
                const scrollPool = window.SPECIAL_MERCH_ITEMS.filter(item => item.subtype === "scroll");
                window.merchantStock.push({ ...scrollPool[Math.floor(Math.random() * scrollPool.length)] });
            } else {
                // Rastgele 2 slot
                if (Math.random() < 0.2) {
                    window.merchantStock.push(generateRandomItem(progress));
                } else {
                    const baseItem = window.SPECIAL_MERCH_ITEMS[Math.floor(Math.random() * window.SPECIAL_MERCH_ITEMS.length)];
                    window.merchantStock.push({ ...baseItem });
                }
            }
        }
    }
    console.log("✅ Stok hazır.");
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
	
	// --- YENİ: EKRANDAKİ ALTINI GÜNCELLE ---
    const goldDisplay = document.getElementById('trade-screen-gold');
    if (goldDisplay) goldDisplay.textContent = hero.gold;
    // ---------------------------------------

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
	
	// --- YENİ: İNDİRİM UYGULAMA ---
    // Eğer oyuncu satın alıyorsa (isBuying), global indirim oranını çarp
    if (isBuying) {
        finalPrice = Math.floor(finalPrice * window.currentMerchantDiscount);
    }
    // ------------------------------

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
    }, 'buy');
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
    }, 'sell');
};

let currentSellAmount = 1;

window.showTradeConfirm = function(msg, item, onConfirm, mode = 'sell') { // mode varsayılan 'sell'
    const modal = document.getElementById('trade-confirm-modal');
    const textEl = document.getElementById('trade-confirm-text');
    const nameEl = document.getElementById('confirm-item-name');
    const statsEl = document.getElementById('confirm-item-stats');
    
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;

    // 1. Başlangıç Miktarı
    currentSellAmount = (item.count && item.count > 1) ? item.count : 1;

    // 2. Arayüz ve Fiyat Güncelleme (Canlı)
    const updateModalDisplay = () => {
        const unitPrice = (item.subtype === 'material') ? 1 : (window.MERCHANT_CONFIG?.sellPrices[item.tier] || 1);
        const totalPrice = unitPrice * currentSellAmount;
        
        // --- KRİTİK AYRIM: Sadece satışta fiyatı ve miktarı göster ---
        if (mode === 'sell') {
            textEl.innerHTML = `${msg} <br> <span style="color:gold; font-size:1.3rem; font-weight:bold;">${totalPrice} <i class="fas fa-coins"></i></span>`;
            
            // Miktar Yazısını güncelle
            const qtyText = document.getElementById('modal-qty-value');
            if (qtyText) qtyText.textContent = `x${currentSellAmount}`;
        } else {
            // Satın alırken sadece ana mesajı ("Satın almak istiyor musun?") göster
            textEl.innerHTML = msg; 
        }
    };

    // 3. İsim ve Miktar Alanını İnşa Et
    const levelLabel = window.getItemLevelLabel(item);
    const isStackable = item.count && item.count > 1;

    nameEl.innerHTML = `
        <div class="confirm-name-text">${getTranslatedItemName(item)}</div>
        <div class="confirm-tier-text ${rules.badgeType === "tier" ? 'tier-' + item.tier : ''}">${levelLabel}</div>
        
        ${(isStackable && mode === 'sell') ? ` 
            <div class="quantity-selector-container">
                <button id="qty-minus" class="qty-btn">-</button>
                <div id="modal-qty-value" class="qty-display">x${currentSellAmount}</div>
                <button id="qty-plus" class="qty-btn">+</button>
            </div>
        ` : ""}
    `;

    // 4. Buton Olaylarını Bağla (Sadece satışta ve yığınlanabilirse)
    if (isStackable && mode === 'sell') {
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

    // 5. Statlar (Aynı kalıyor)
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
