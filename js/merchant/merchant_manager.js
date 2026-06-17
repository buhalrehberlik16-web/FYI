// js/ui/merchant_manager.js

window.merchantStock = [];
window.currentTradeMode = 'buy';
window.currentMerchantDiscount = 1.0; // Varsayılan: İndirim yok

// 1. STOK YENİLEME
window.refreshMerchantStock = function(count = 8) {
    console.log(`🛒 Tüccar stokları yenileniyor (${count} eşya)...`);
    window.merchantStock = [];
    
    // 1. İLERLEME HESAPLAMA (Senin formülün)
    const progress = (window.hero && window.hero.highestTierDefeated) ? window.hero.highestTierDefeated : 1;
    
    // Tier hesaplama fonksiyonu: highestTier / 2
    const getBalancedTier = () => {
        const base = progress / 2;
        let targetTier = 1;

        if (base % 1 === 0) {
            // Tam sayı ise (Örn: T2 kestiyse 2/2 = 1) direkt o tier
            targetTier = base;
        } else {
            // Buçuklu ise (Örn: T3 kestiyse 3/2 = 1.5) %50 alt, %50 üst tier
            targetTier = (Math.random() < 0.5) ? Math.floor(base) : Math.ceil(base);
        }
        
        // Failsafe: Tier en az 1 olmalı (T0 diye bir eşya yok)
        return Math.max(1, targetTier);
    };
    // -----------------------------------

    for (let i = 0; i < count; i++) {
        // Her döngüde yeni hesaplanmış dengeli tier'ı çağır
        const currentTier = getBalancedTier();

        if (count === 4) {
            // Gezgin Tüccar
            window.merchantStock.push(generateRandomItem(currentTier, false));
        } 
        else if (count === 12) {
            // Şehir Tüccarı
            if (i < 4) {
                window.merchantStock.push(generateRandomItem(currentTier, false));
            } else if (i < 6) {
                const scrollPool = window.SPECIAL_MERCH_ITEMS.filter(item => item.subtype === "scroll");
                window.merchantStock.push({ ...scrollPool[Math.floor(Math.random() * scrollPool.length)] });
            } else if (i === 6) {
                // Şehirdeki garantili broş da bu dengeli tier'dan gelir
                window.merchantStock.push(generateRandomBrooch(currentTier));
            } else {
                if (Math.random() < 0.3) {
                    window.merchantStock.push(generateRandomItem(currentTier, false));
                } else {
                    const baseItem = window.SPECIAL_MERCH_ITEMS[Math.floor(Math.random() * window.SPECIAL_MERCH_ITEMS.length)];
                    window.merchantStock.push({ ...baseItem });
                }
            }
        }
        else {
            // Normal Kasaba Tüccarı
            if (i < 4) {
                window.merchantStock.push(generateRandomItem(currentTier, false));
            } else if (i < 6) {
                const scrollPool = window.SPECIAL_MERCH_ITEMS.filter(item => item.subtype === "scroll");
                window.merchantStock.push({ ...scrollPool[Math.floor(Math.random() * scrollPool.length)] });
            } else {
                if (Math.random() < 0.2) {
                    window.merchantStock.push(generateRandomItem(currentTier, false));
                } else {
                    const baseItem = window.SPECIAL_MERCH_ITEMS[Math.floor(Math.random() * window.SPECIAL_MERCH_ITEMS.length)];
                    window.merchantStock.push({ ...baseItem });
                }
            }
        }
    }
    console.log("✅ Dengeli stok hazır.");
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
	
	// --- YENİ: ZULA BUTONU GÖRÜNÜRLÜĞÜ ---
    const stashContainer = document.getElementById('secret-stash-container');
    if (stashContainer) {
        // Eğer bu odada zula varsa VE henüz açılmadıysa VE satın alma (buy) modundaysak göster
        const shouldShow = window.isStashAvailableInRoom && window.currentTradeMode === 'buy';
        stashContainer.classList.toggle('hidden', !shouldShow);
    }
    // -------------------------------------
	
	// --- YENİ: TAKILI EKİPMANLARI ÇİZ ---
    const equipRow = document.getElementById('trade-equip-row');
	const previewLabel = document.querySelector('.preview-label'); // Başlık etiketi
    if (equipRow) {
        equipRow.innerHTML = '';
        // Gösterilecek slotlar
        // --- YENİ DİNAMİK ÖNİZLEME MANTIĞI ---
        if (window.isBroochTrade) {
            // DURUM A: Broş Satıcısındayız -> Broş Slotlarını Göster
            if(previewLabel) previewLabel.textContent = lang.items.brooches_label || "TAKILI BROŞLAR";
            
            // Kahramanın tüm broş slotlarını (6 slot) tara
            hero.brooches.forEach(item => {
                createPreviewSlot(item, equipRow);
            });
        } 
        else {
            // DURUM B: Normal Tüccardayız -> Takı Slotlarını Göster
            if(previewLabel) previewLabel.textContent = lang.current_equipment;
            
            const slotsToShow = ['earring1', 'earring2', 'necklace', 'ring1', 'ring2', 'belt'];
            slotsToShow.forEach(slotKey => {
                createPreviewSlot(hero.equipment[slotKey], equipRow);
            });
        }
    }
    // -----------------------------------

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

function createPreviewSlot(item, parent) {
    const slotDiv = document.createElement('div');
    slotDiv.className = 'item-slot trade-preview-slot';
    
    if (item) {
        const img = document.createElement('img');
        img.src = `items/images/${item.icon}`;
        slotDiv.appendChild(img);
        slotDiv.innerHTML += window.getItemBadgeHTML(item);
        
        slotDiv.onmouseenter = (e) => window.showItemTooltip(item, e);
        slotDiv.onmouseleave = () => window.hideItemTooltip();
        slotDiv.onmousemove = (e) => window.moveTooltip(e);
    } else {
        slotDiv.style.opacity = "0.2";
    }
    parent.appendChild(slotDiv);
}

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
			// --- YENİ: EVENT ALIŞVERİŞİNİ KAYDET ---
			// Eğer bir event içindeysek (Gezgin Tüccar veya Broşçu)
			if (window.isBroochTrade || window.currentMerchantDiscount < 1.0) {
            const eventId = window.isBroochTrade ? "brooch_peddler" : "traveling_merchant";
            
            // Tarihçi'deki son kayıtları bul ve bu itemı oraya 'sonuç' olarak işle
            const lastEvent = StatsManager.currentRun.seenEvents.reverse().find(e => e.id === eventId);
            if (lastEvent) {
                lastEvent.result = { type: 'item', value: item };
            }
            StatsManager.currentRun.seenEvents.reverse(); // Listeyi eski haline çevir
			}
			// --------------------------------------
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

    // 5. STATLAR VE ÖZELLİKLER (DETAYLI GÖSTERİM)
    statsEl.innerHTML = '';
    if (item.subtype !== 'material') {
        
        // A. Sabit Defans (Zırh) Kontrolü
        if (item.implicitDef && item.implicitDef > 0) {
            const defLabel = window.getStatDisplayName('def');
            statsEl.innerHTML += `<div style="color:#3498db;">${defLabel}: <span class="tooltip-val">+${item.implicitDef}</span></div>`;
        }

        // B. Standart Statlar (STR, INT vb.)
        if (item.stats) {
            for (const [statKey, value] of Object.entries(item.stats)) {
                if (value > 0) {
                    const statName = window.getStatDisplayName(statKey);
                    statsEl.innerHTML += `<div>${statName}: <span class="tooltip-val">+${value}</span></div>`;
                }
            }
        }

        // C. Broş Etkileri (Eğer bir Broş ise)
        if (item.effects) {
            item.effects.forEach(eff => {
                let effectName = lang.items['eff_' + eff.id] || eff.id;
                // Uzmanlık kabilesini de ekleyelim
                if (eff.id === "fixed_dmg" && item.specialtyTribe) {
                    const tribeName = (lang.enemy_names || {})[item.specialtyTribe] || item.specialtyTribe;
                    effectName += ` (${tribeName})`;
                }
                
                let displayVal = (eff.value < 1 && eff.value > 0) 
                    ? `%${Math.round(eff.value * 100)}` 
                    : `+${eff.value}`;
                
                statsEl.innerHTML += `<div style="color:#df9cff;">${effectName}: <span class="tooltip-val">${displayVal}</span></div>`;
            });
        }

        // D. Tılsım Bonusları (Eğer bir Tılsım ise)
        if (item.bonuses) {
            item.bonuses.forEach(b => {
                if (b.type === 'elemDmg') {
                    statsEl.innerHTML += `<div style="color:#f0e68c;">${lang.items.eff_elemDmg}: <span class="tooltip-val">+${b.value}</span></div>`;
                } else if (b.type === 'tribe_mod') {
                    statsEl.innerHTML += `<div style="color:#ff4d4d;">${lang.items.eff_skill_dmg}: <span class="tooltip-val">+${b.skillDmg}</span></div>`;
                    statsEl.innerHTML += `<div style="color:#3498db;">${lang.items.eff_tribe_def}: <span class="tooltip-val">+${b.defense}</span></div>`;
                }
            });
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
