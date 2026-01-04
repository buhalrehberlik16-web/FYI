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
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    inputSlot.innerHTML = '';
    yieldDiv.innerHTML = `<span style="color:#666">${lang.items.waiting_salvage_ingredients}</span>`;

    if (salvageItem) {
        // 1. Görseli oluştur
        const img = document.createElement('img');
        img.src = `items/images/${salvageItem.icon}`;
        inputSlot.appendChild(img);

        // 2. Seviye Badge'ini oluştur
        const badge = document.createElement('span');
        badge.className = `item-tier-badge badge-${salvageItem.tier}`;
        badge.textContent = `T${salvageItem.tier}`;
        inputSlot.appendChild(badge);

        // --- YENİ: TOOLTIP DESTEĞİ (PC İÇİN HOVER) ---
        inputSlot.onmouseenter = (e) => window.showItemTooltip(salvageItem, e);
        inputSlot.onmouseleave = () => window.hideItemTooltip();
        inputSlot.onmousemove = (e) => {
            const tooltip = document.getElementById('item-tooltip');
            if(tooltip) {
                tooltip.style.left = (e.clientX + 15) + 'px';
                tooltip.style.top = (e.clientY + 15) + 'px';
            }
        };

        // --- YENİ: MOBİL UYUMLU TIKLAMA MANTIĞI ---
        inputSlot.onclick = (e) => {
            // Eğer cihaz mobilse (dokunmatikse)
            if ('ontouchstart' in window) {
                // Eğer kutu kapalıysa önce Tooltip'i göster
                if (document.getElementById('item-tooltip').classList.contains('hidden')) {
                    window.showItemTooltip(salvageItem, e);
                    // 3 saniye sonra otomatik kapansın
                    setTimeout(window.hideItemTooltip, 3000);
                    return; // Fonksiyondan çık (item'ı henüz geri verme)
                }
            }

            // Normal davranış (PC'de direkt, Mobilde 2. tıklamada): Item'ı çantaya geri ver
            window.hideItemTooltip();
            const emptyBag = hero.inventory.indexOf(null);
            if (emptyBag !== -1) {
                hero.inventory[emptyBag] = salvageItem;
                salvageItem = null;
                renderSalvageUIAll();
                renderInventory(); // Ana çantayı tazele
            }
        };

        // 3. Olasılıkları hesapla ve göster
        const range = getSalvageRange(salvageItem.tier);
        yieldDiv.innerHTML = `
            <div style="margin-bottom:5px; border-bottom:1px solid #444">${lang.items.salvage_yield}:</div>
            <div class="prob-row"><span>${range.min} adet:</span> <span style="color:#43FF64">%60</span></div>
            <div class="prob-row"><span>${range.mid} adet:</span> <span style="color:#f0e68c">%30</span></div>
            <div class="prob-row"><span>${range.max} adet:</span> <span style="color:#ff9800">%10</span></div>
        `;
    } else {
        // Slot boşsa eventleri temizle
        inputSlot.onclick = null;
        inputSlot.onmouseenter = null;
        inputSlot.onmouseleave = null;
        inputSlot.onmousemove = null;
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
            // 1. Görseli Ekle
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slot.appendChild(img);
            
            // 2. Tier Badge Ekle (Renkli)
            const badge = document.createElement('span');
            badge.className = `item-tier-badge badge-${item.tier}`;
            badge.textContent = `T${item.tier}`;
            slot.appendChild(badge);

            // 3. ADET (COUNT) BADGE EKLE (Eksik olan kısım burasıydı)
            if (item.isStack && item.count > 1) {
                const countBadge = document.createElement('span');
                countBadge.className = 'item-count-badge';
                countBadge.textContent = item.count;
                slot.appendChild(countBadge);
            }

            // 4. PARÇALAMA İZNİ KONTROLÜ
            // Sadece bu tipler parçalanabilir:
            const allowedTypes = ['ring', 'necklace', 'earring', 'belt'];
            const isSalvageable = allowedTypes.includes(item.type);

            if (isSalvageable) {
                // Parçalanabilir eşya: Normal görünüm ve tıklanabilirlik
                slot.onclick = () => {
                    if (!salvageItem) {
                        window.hideItemTooltip();
                        salvageItem = item;
                        hero.inventory[index] = null;
                        renderSalvageUIAll();
                    }
                };
            } else {
                // Parçalanamaz eşya (Charm, Materyal vb.): 
                // Listede görünsün ama tıklanamasın ve soluk dursun
                slot.style.opacity = "0.4";
                slot.style.filter = "grayscale(100%)";
                slot.style.cursor = "not-allowed";
                slot.title = "Bu eşya parçalanamaz!";
            }

            // Tooltip her türlü görünsün (Oyuncu neye sahip olduğunu bilsin)
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
    const materialItem = {
        nameKey: "salvage_material_name",
        icon: "drop_items/salvage_jewelry.webp",
        type: "material",
        isStack: true, // <--- KRİTİK AYAR
        tier: 1,
        stats: {}
    };

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
};