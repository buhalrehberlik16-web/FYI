// js/ui/menu_manager.js
window.lastTappedSlot = null; 
let selectedSkillToEquip = null; // O an seçili olan yeteneği tutar

window.getTranslatedItemName = function(item) {
    if (!item || !item.nameKey) return "Unknown Item";
    const currentLang = window.gameSettings.lang || 'tr';
    
    // item_translation.js içinde Object.assign ile 'items' altına eklemiştik
    return window.LANGUAGES[currentLang].items[item.nameKey] || item.nameKey;
};

// Stat anahtarını (str, fire vb.) okunabilir dile çevirir
window.getStatDisplayName = function(statKey) {
    const currentLang = window.gameSettings.lang || 'tr';
    // item_translation.js içindeki stat_str, res_fire gibi anahtarlara bakar
    // Eğer statKey 'str' ise 'stat_str' olarak arar
    const lookupKey = (statKey.length <= 3 || statKey === 'mp_pow' || statKey === 'vit') ? 'stat_' + statKey : 'res_' + statKey;
    
    return window.LANGUAGES[currentLang].items[lookupKey] || statKey;
};

let currentTab = 'common'; 
let selectedAttackKey = null;
let selectedDefenseKey = null;

// --- STAT EKRANI ---
window.toggleStatScreen = function() {
    if (!isCharacterUIAllowed()) return;
    statScreen.classList.toggle('hidden');
    if (!statScreen.classList.contains('hidden')) updateStatScreen();
};

window.updateStatScreen = function() {
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    if (!statName || !statClass) return;
    
    // 1. Verileri Hazırla
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : {};

    // --- SADECE İTEM VE ANA STATLARDAN GELEN (SKILL-SIZ) DEĞERLERİ HESAPLA ---
    const rules = CLASS_CONFIG[hero.class];
    const sc = rules.scaling; // Yeni scaling kurallarını al

    // Hangi statın atak, hangisinin defans verdiğini sınıftan öğreniyoruz
    const atkStatKey = sc.atk.stat; // Barbar için "str", Magus için "int"
    const defStatKey = sc.def.stat; // "dex" vb.

    let itemOnlyAtkStat = hero[atkStatKey];
    let itemOnlyDefStat = hero[defStatKey];
    let itemAtkBonus = 0;
    let itemDefBonus = 0;

    // Ekipmanları tara
    for (const slotKey in hero.equipment) {
        const item = hero.equipment[slotKey];
        if (item && item.stats) {
            // Sınıfın ana atak statı (STR/INT) itemda var mı?
            if (item.stats[atkStatKey]) itemOnlyAtkStat += item.stats[atkStatKey];
            // Sınıfın ana defans statı (DEX vb.) itemda var mı?
            if (item.stats[defStatKey]) itemOnlyDefStat += item.stats[defStatKey];
            // Direkt Atak/Defans bonusları var mı? (Tılsımlardan gelebilir)
            if (item.stats.atk) itemAtkBonus += item.stats.atk;
            if (item.stats.def) itemDefBonus += item.stats.def;
        }
    }

    // "Stabil" değer (İtemler var ama Skill Buffları yok)
    // Artık rules.scaling üzerinden dinamik çarpanlarla hesaplıyoruz
    const stableAtk = (hero.baseAttack || 10) + itemAtkBonus + Math.floor(itemOnlyAtkStat * sc.atk.mult);
    const stableDef = (hero.baseDefense || 0) + itemDefBonus + Math.floor(itemOnlyDefStat * sc.def.mult);

    // 2. Üst Bilgiler
    statName.textContent = hero.playerName; 
    statClass.textContent = `(${hero.class})`; 
    statLevel.textContent = `Lv. ${hero.level}`;
    
    let xpPercent = hero.xpToNextLevel > 0 ? Math.min(100, (hero.xp / hero.xpToNextLevel) * 100) : 0;
    const xpBarFill = document.getElementById('stat-xp-bar');
    if (xpBarFill) xpBarFill.style.width = `${xpPercent}%`;
    if (statXp) statXp.textContent = `%${Math.floor(xpPercent)}`;

    statHp.textContent = `${hero.hp} / ${effective.maxHp}`;

    // --- YENİ: KAYNAK (RAGE/MANA) ETİKETİ, RENGİ VE DEĞERİ ---
    const classRules = CLASS_CONFIG[hero.class];
    const resKey = classRules.resourceName;
    const resourceLabel = lang[`resource_${resKey}`];

    // A. "Öfke (Rage):" yazan sol etiketi bul ve değiştir
    const resourceLabelEl = document.querySelector('[data-i18n="label_rage"]');
    if (resourceLabelEl) {
        resourceLabelEl.textContent = resourceLabel + ":";
    }

    // B. Sağdaki değeri (örn: 100/100 Mana) yazdır ve RENGİNİ ayarla
    if (statRage) {
        statRage.textContent = `${hero.rage} / ${effective.maxRage}`;
        statRage.style.color = classRules.resourceColor; // Sınıfın rengini bas
    }

    // 3. SAVAŞ STATLARI (ATAK VE DEFANS) - Sadece Skill/Choice etkisine duyarlı
    const applyEffectColor = (el, current, stable) => {
    el.textContent = current;
    
    // BROŞ VEYA NORMAL BUFF VAR MI KONTROL ET
    const hasActiveBuff = hero.statusEffects.some(e => e.id === 'def_up' || e.id === 'atk_up');
    const hasDefPenalty = hero.statusEffects.some(e => e.id === 'defense_zero');

    // Eğer o anki değer (current) baz değerden (stable) büyükse VEYA aktif bir buff varsa YEŞİL yap
    if (current > stable || (hasActiveBuff && current >= stable)) {
        el.style.color = "#43FF64"; // YEŞİL
    } else if (current < stable || (hasDefPenalty && el === statDef)) {
        el.style.color = "#ff4d4d"; // KIRMIZI
    } else {
        el.style.color = "#ffd700"; // NORMAL (ALTIN)
    }
};


    applyEffectColor(statAtk, effective.atk, stableAtk);
    applyEffectColor(statDef, effective.def, stableDef);

    // 4. TEMEL STATLAR (STR, DEX vb.)
    // Burada hem item hem skill bonusları parantez içinde (+X) olarak gözükür
    const renderStatWithBonus = (elementId, baseVal, effectiveVal) => {
        const el = document.getElementById(elementId);
        if (!el) return;
        const bonus = effectiveVal - baseVal;
        
        if (bonus > 0) {
            el.innerHTML = `${baseVal} <span style="color:#43FF64; font-size:0.9em; font-weight:bold;">(+${bonus})</span>`;
        } else if (bonus < 0) {
            el.innerHTML = `${baseVal} <span style="color:#ff4d4d; font-size:0.9em; font-weight:bold;">(${bonus})</span>`;
        } else {
            el.textContent = baseVal;
        }
    };

    renderStatWithBonus('stat-str', hero.str, effective.str);
    renderStatWithBonus('stat-dex', hero.dex, effective.dex);
    renderStatWithBonus('stat-int', hero.int, effective.int);
    renderStatWithBonus('stat-vit', hero.vit, effective.vit);
    renderStatWithBonus('stat-mp', hero.mp_pow, effective.mp_pow);

    // 5. Puan Dağıtma / Savaş Uyarısı (Aynı kalıyor)
    const isInBattle = battleScreen.classList.contains('active');
    const pointsBox = document.getElementById('points-container');
    const plusButtons = document.querySelectorAll('.btn-stat-plus');

    document.getElementById('stat-battle-warning')?.remove();

    if (isInBattle) {
        if (pointsBox) pointsBox.classList.add('hidden');
        plusButtons.forEach(btn => btn.classList.add('hidden'));
        const warning = document.createElement('div');
        warning.id = 'stat-battle-warning';
        warning.style.cssText = "color:#ff9800; text-align:center; margin-top:15px; font-weight:bold; font-size:0.8em; font-family:'Cinzel',serif;";
        warning.textContent = lang.stat_battle_warning;
        document.querySelector('.stat-content').appendChild(warning);
    } else if (hero.statPoints > 0) {
        if (pointsBox) {
            pointsBox.classList.remove('hidden');
            document.getElementById('stat-points-display').textContent = hero.statPoints;
        }
        plusButtons.forEach(btn => btn.classList.remove('hidden'));
    } else {
        if (pointsBox) pointsBox.classList.add('hidden');
        plusButtons.forEach(btn => btn.classList.add('hidden'));
    }

    // 6. Dirençler (Aynı kalıyor)
    const resTypes = ['fire', 'cold', 'lightning', 'poison', 'curse'];
    resTypes.forEach(type => {
        const el = document.getElementById(`res-${type}`);
        if (el) {
            // 1. O elementin toplam DİRENCİNİ al (Mavi renk olacak)
            const totalRes = effective.resists ? (effective.resists[type] || 0) : 0;
            
            // 2. O elementin toplam HASARINI al (Altın/Kırmızı renk olacak)
            const totalDmg = effective.elementalDamage ? (effective.elementalDamage[type] || 0) : 0;

            // 3. Ekrana bas: Hasar (Altın) | Direnç (Mavi)
            // Renkleri U ekranındaki Atak (#ffd700) ve Defans (#3498db) ile eşitledik
            el.innerHTML = `<span style="color:#ffd700">${totalDmg}</span> <span style="color:#666">|</span> <span style="color:#3498db">${totalRes}</span>`;
        }
    });
};

// --- ENVANTER ---
window.toggleInventory = function() {
    if (!isCharacterUIAllowed()) return;
    inventoryScreen.classList.toggle('hidden');
    if (!inventoryScreen.classList.contains('hidden')) renderInventory();
};

// --- TOOLTIP FONKSİYONLARI ---
window.showItemTooltip = function(item, event) {
    const tooltip = document.getElementById('item-tooltip');
    if (!tooltip || !item) return;

    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const langItems = lang.items || {};

    const nameEl = document.getElementById('tooltip-name');
    const tierEl = document.getElementById('tooltip-tier');
    const statsEl = document.getElementById('tooltip-stats');
	//  İÇERİK LİSTELEME
	statsEl.innerHTML = '';
    
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;

    nameEl.textContent = getTranslatedItemName(item);
	
	// --- YENİ: SET BONUSU GÖSTERİMİ (ADIM 4 - DİNAMİK STATLI) ---
    if (item.subtype === "jewelry" && item.color) {
        const equippedSetCount = Object.values(hero.equipment).filter(i => i && i.color === item.color).length;
        const setRow = document.createElement('div');
        setRow.className = 'set-info-box';
        
        const setName = langItems[`set_${item.color}`] || item.color;
        const statDisplayName = window.getStatDisplayName(item.color).split(' ')[0]; // Sadece "Güç" veya "Zeka" kısmını al

        // Metinleri Hazırla
        const bonus3Text = langItems.set_bonus_3.replace("$1", statDisplayName);
        const bonus6Text = langItems.set_bonus_6.replace("$1", statDisplayName);
        const classBonusDesc = langItems[`class_bonus_${hero.class}`] || "";

        setRow.innerHTML = `
            <div class="set-header">
                <span class="set-name">${setName}</span>
                <span class="set-count">${equippedSetCount}/6</span>
            </div>
            <div class="set-progression">
                <div class="set-dot ${equippedSetCount >= 3 ? 'active' : ''}"></div>
                <div class="set-dot ${equippedSetCount >= 6 ? 'active' : ''}"></div>
            </div>
            <div class="set-bonus-text ${equippedSetCount >= 3 ? 'active' : ''}">${bonus3Text}</div>
            <div class="set-bonus-text ${equippedSetCount >= 6 ? 'active' : ''}">${bonus6Text}</div>
            <div class="set-bonus-text ${equippedSetCount >= 6 ? 'active' : ''}" style="border-top:1px solid rgba(255,255,255,0.1); margin-top:5px; padding-top:2px;">
                ${classBonusDesc}
            </div>
        `;
        statsEl.appendChild(setRow);
    }
    // ---------------------------------

    // 3. GÖRSEL SINIFLARI AYARLA
    if (rules.badgeType === "craft") {
        nameEl.className = 'tooltip-name'; 
        tierEl.className = 'tooltip-tier';
    } else {
        nameEl.className = `tooltip-name tier-${item.tier}`;
        tierEl.className = `tooltip-tier tier-${item.tier}`;
    }
    
    // 4. SEVİYE YAZISINI AYARLA (ui_elements içindeki fonksiyonu kullanır)
    tierEl.textContent = window.getItemLevelLabel(item);

    // --- KRİTİK SIRALAMA: ÖNCE ÖZEL TİPLERİ KONTROL ET ---

    // A - Broş Efektleri (Eğer eşya Broş ise burası çalışır)
    if (item.type === 'brooch' && item.effects) {
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
        const tribeName = lang.enemy_names[item.specialtyTribe] || item.specialtyTribe;

        // Sadece 'fixed_dmg' varsa ipucunu göster
        const hasFixedDmg = item.effects.some(e => e.id === 'fixed_dmg');
        if (hasFixedDmg) {
            const hintDiv = document.createElement('div');
            hintDiv.className = 'brooch-specialty-text'; // Daha spesifik bir sınıf ismi
            hintDiv.textContent = lang.items.brooch_specialty_hint;
            statsEl.appendChild(hintDiv);
        }

        // Alt Başlık (Mistik Aksesuar)
        const subLabel = document.createElement('div');
        subLabel.className = 'brooch-sub-label'; // CSS kontrolü için sınıf ekledim
        subLabel.textContent = lang.items.brooch_label;
        statsEl.appendChild(subLabel);

        // Efektleri Listeleme (Daha önceki yaptığımız uzmanlık parantezi dahil)
        item.effects.forEach(eff => {
            const row = document.createElement('div');
            row.className = 'tooltip-stat-row';
            
            let effectName = lang.items['eff_' + eff.id] || eff.id;
            if (eff.id === "fixed_dmg") {
                effectName += ` (${tribeName})`;
            }

            let displayVal = (eff.value < 1 && eff.value > 0) 
                ? `%${Math.round(eff.value * 100)}` 
                : `+${eff.value}`;

            let detail = eff.targetStat ? ` (${lang.items['brostat_' + eff.targetStat] || eff.targetStat.toUpperCase()})` : "";

            row.innerHTML = `<span>${effectName}${detail}</span> <span class="tooltip-val">${displayVal}</span>`;
            statsEl.appendChild(row);
        });

        // Frekans Bilgisi
        const freqText = (langItems.brooch_freq || "Every $1 Turns").replace("$1", item.frequency);
        const freqDiv = document.createElement('div');
        freqDiv.style.color = "#3498db";
        freqDiv.style.fontSize = "0.8rem";
        freqDiv.style.marginTop = "10px";
        freqDiv.innerHTML = `⌛ ${freqText}`;
        statsEl.appendChild(freqDiv);
    } 
    // B - TILSIM (CHARM1) TİPİ (İstediğin yer değiştirme burada yapıldı)
    else if (item.type === 'charm1') {
        const langItems = window.LANGUAGES[window.gameSettings.lang].items;

        // 1. ÖNCE HASAR BONUSLARINI GÖSTER (Üstte olması için)
        if (item.bonuses) {
            item.bonuses.forEach(b => {
                if (b.type === 'elemDmg') {
                    // ELEMENTAL HASAR ÜSTTE
                    const row = document.createElement('div');
                    row.className = 'tooltip-stat-row';
                    row.innerHTML = `<span>${langItems.eff_elemDmg}</span> <span class="tooltip-val">+${b.value}</span>`;
                    statsEl.appendChild(row);
                } else if (b.type === 'tribe_mod') {
                    // KLAN HASARI ÜSTTE
                    const dmgRow = document.createElement('div');
                    dmgRow.className = 'tooltip-stat-row';
                    dmgRow.innerHTML = `<span>${langItems.eff_skill_dmg}</span> <span class="tooltip-val">+${b.skillDmg}</span>`;
                    statsEl.appendChild(dmgRow);
                }
            });
        }

        // 2. SONRA SAVUNMA/RESIST STATLARINI GÖSTER (Altta olması için)
        if (item.stats) {
            for (const [key, val] of Object.entries(item.stats)) {
                if (val > 0) {
                    const row = document.createElement('div');
                    row.className = 'tooltip-stat-row';
                    row.innerHTML = `<span>${window.getStatDisplayName(key)}</span> <span class="tooltip-val">+${val}</span>`;
                    statsEl.appendChild(row);
                }
            }
        }

        // 3. EĞER VARSA KLAN DEFANSINI EN ALTA EKLE
        if (item.bonuses) {
            item.bonuses.forEach(b => {
                if (b.type === 'tribe_mod') {
                    const defRow = document.createElement('div');
                    defRow.className = 'tooltip-stat-row';
                    defRow.innerHTML = `<span>${langItems.eff_tribe_def}</span> <span class="tooltip-val">+${b.defense}</span>`;
                    statsEl.appendChild(defRow);
                }
            });
        }
    }
    // C - Standart Statlar (Takılar için)
    else if (item.stats && Object.keys(item.stats).length > 0) {
		// --- YENİ: DEFANS GÖSTERİMİ (ADIM 4 - GÜNCELLENDİ) ---
        if (item.implicitDef > 0) {
            const defRow = document.createElement('div');
            defRow.className = 'tooltip-stat-row';
            // 'def' anahtarını kullanarak dilden "Defans" veya "Defense" çeker
            const defLabel = window.getStatDisplayName('def'); 
            
            defRow.innerHTML = `<span>${defLabel}</span> <span class="tooltip-val">+${item.implicitDef}</span>`;
            statsEl.appendChild(defRow);
        }
        // ---------------------------------------------------
        for (const [statKey, value] of Object.entries(item.stats)) {
            const row = document.createElement('div');
            row.className = 'tooltip-stat-row';
            const statName = window.getStatDisplayName(statKey);
            row.innerHTML = `<span>${statName}</span> <span class="tooltip-val">+${value}</span>`;
            statsEl.appendChild(row);
        }
    } 
    // D - Gerçekten Materyal ise (Dilden çeker)
    else {
        const materialHint = langItems.crafting_material || (currentLang === 'tr' ? 'Üretim materyali' : 'Crafting material');
        statsEl.innerHTML = `<div style="color:#888; font-size:0.8em; font-style:italic;">${materialHint}</div>`;
    }

    tooltip.classList.remove('hidden');
    moveTooltip(event);
};

window.hideItemTooltip = function() {
    const tooltip = document.getElementById('item-tooltip');
    if (tooltip) tooltip.classList.add('hidden');
};

function moveTooltip(e) {
    const tooltip = document.getElementById('item-tooltip');
    if (tooltip) {
        tooltip.style.left = (e.clientX + 15) + 'px';
        tooltip.style.top = (e.clientY + 15) + 'px';
    }
}// --- EŞYA TAKMA / ÇIKARMA MANTIĞI ---

// Eşyayı Çıkar (Ekipmandan Çantaya)
window.unequipItem = function(slotKey) {
	window.syncHpWithRatio(() => {
    window.hideItemTooltip();
    const item = hero.equipment[slotKey];
    if (!item) return;
	
	// GÜVENLİK: Sadece takılabilir türdeki eşyalar kuşanılabilir
    const equipableTypes = ['ring', 'necklace', 'earring', 'belt'];
    if (!equipableTypes.includes(item.type)) {
        console.log("Bu eşya kuşanılabilir bir takı değil.");
        return; 
    }

    const emptySlotIndex = hero.inventory.indexOf(null);
    if (emptySlotIndex !== -1) {
        hero.inventory[emptySlotIndex] = item;
        hero.equipment[slotKey] = null;
        renderInventory();
        updateStats();
        writeLog(`📤 ${getTranslatedItemName(item)} ${window.gameSettings.lang === 'tr' ? 'çıkarıldı.' : 'unequipped.'}`);
    } else {
        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    window.showAlert(lang.bag_full_msg);
    return;
		}
 });
};
// Eşyayı Tak (Çantadan Ekipmana)
window.equipItem = function(inventoryIndex) {
	window.syncHpWithRatio(() => {
    hideItemTooltip();
    const item = hero.inventory[inventoryIndex];
    if (!item) return;

    if (!window.isItemAllowedInUI(item, 'equip')) return;

    // --- BROŞLAR İÇİN ÖZEL MANTIK ---
     if (item.type === 'brooch' || item.type === 'charm1') {
        // İlk boş broş slotunu bul (0'dan 5'e kadar)
        const emptyBroochSlot = hero.brooches.indexOf(null);
        
        if (emptyBroochSlot !== -1) {
            hero.brooches[emptyBroochSlot] = item;
            hero.inventory[inventoryIndex] = null; // Çantadan çıkar
            writeLog(`🎒 ${getTranslatedItemName(item)} broş slotuna takıldı.`);
        } else {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
			window.showAlert(lang.brooch_full_msg);
			return;
		}
    } 
    // --- STANDART TAKILAR İÇİN MEVCUT MANTIK ---
    else {
        let targetSlot = null;
        if (item.type === 'earring') targetSlot = !hero.equipment.earring1 ? 'earring1' : 'earring2';
        else if (item.type === 'ring') targetSlot = !hero.equipment.ring1 ? 'ring1' : 'ring2';
        else targetSlot = item.type;

        const oldItem = hero.equipment[targetSlot];
        hero.equipment[targetSlot] = item;
        hero.inventory[inventoryIndex] = oldItem; 
        writeLog(`🎒 ${getTranslatedItemName(item)} kuşanıldı.`);
    }

    renderInventory();
    updateStats();
 });
};

window.unequipBrooch = function(index) {
	window.syncHpWithRatio(() => {
    window.hideItemTooltip();
    const item = hero.brooches[index];
    if (!item) return;

    const emptyBagSlot = hero.inventory.indexOf(null);
    if (emptyBagSlot !== -1) {
        hero.inventory[emptyBagSlot] = item;
        hero.brooches[index] = null;
        writeLog(`📤 ${getTranslatedItemName(item)} broş slotundan çıkarıldı.`);
    } else {
        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
		window.showAlert(lang.bag_full_msg);
		return;
    }

    renderInventory();
    updateStats();
});
};

// --- SÜRÜKLE BIRAK (DRAG & DROP) ---
function handleDragStart(e, source, id) {
    hideItemTooltip();
    const dragData = { source: source, id: id };
    e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
}

function handleDrop(e, targetType, targetId) {
    e.preventDefault();
    const data = JSON.parse(e.dataTransfer.getData('text/plain'));
	const currentLang = window.gameSettings.lang || 'tr';
    
    // 1. Çantadan Ekipmana Sürükleme
    if (data.source === 'bag' && targetType === 'equip') {
        const item = hero.inventory[data.id];
        if (item && (item.type === targetId || targetId.startsWith(item.type))) {
            const oldItem = hero.equipment[targetId];
            hero.equipment[targetId] = item;
            hero.inventory[data.id] = oldItem;
			writeLog(`🎒 ${getTranslatedItemName(item)} ${currentLang === 'tr' ? 'kuşanıldı.' : 'equipped.'}`);
        }
    }
	if (data.source === 'bag' && targetType === 'brooch') {
        const item = hero.inventory[data.id];
        if (item && (item.type === 'brooch' || item.type === 'charm1')) {
            const oldBrooch = hero.brooches[targetId];
            hero.brooches[targetId] = item;
            hero.inventory[data.id] = oldBrooch;
        }
    }
	
    // 2. Ekipmandan Çantaya Sürükleme
    else if (data.source === 'equip' && targetType === 'bag') {
        const item = hero.equipment[data.id];
        const oldBagItem = hero.inventory[targetId];
        
        // Sadece boş yere veya başka bir itemın üstüne bırakma (Swap)
        hero.equipment[data.id] = oldBagItem; // Eğer bagItem varsa ve tipi uymuyorsa ileride kontrol eklenebilir
        hero.inventory[targetId] = item;
		writeLog(`📤 ${getTranslatedItemName(item)} ${currentLang === 'tr' ? 'çıkarıldı.' : 'unequipped.'}`);
    }
    // 3. Çanta İçinde Yer Değiştirme
    else if (data.source === 'bag' && targetType === 'bag') {
        const temp = hero.inventory[targetId];
        hero.inventory[targetId] = hero.inventory[data.id];
        hero.inventory[data.id] = temp;
    }

    renderInventory();
    updateStats();
}

// --- ANA RENDER FONKSİYONU ---
window.renderInventory = function() {
    hideItemTooltip();
	
	// --- YENİ: ENVANTER KARAKTER GÖRSELİNİ SINIFDAN ÇEK ---
    const charImgEl = document.getElementById('inv-char-img');
    if (charImgEl) {
        const classRules = CLASS_CONFIG[hero.class];
        charImgEl.src = classRules.visuals.inventory;
    }

    // 1. Savaş Durumu Kontrolü
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    const invOverlay = document.getElementById('inventory-battle-overlay');
    
    if (invOverlay) {
        if (isInBattle) invOverlay.classList.remove('hidden');
        else invOverlay.classList.add('hidden');
    }

    const setupSlot = (slotEl, item, type, identifier) => {
        slotEl.innerHTML = '';
        slotEl.onmouseenter = null;
        slotEl.onmousemove = null;
        slotEl.onmouseleave = null;
        slotEl.onclick = null;
        slotEl.oncontextmenu = null; // Sağ tıkı temizle

        // Savaşta isek slotu görsel olarak işaretle (Sadece takılı olanlar için)
        if (isInBattle && (type === 'equip' || type === 'brooch')) {
            slotEl.classList.add('locked-slot');
        } else {
            slotEl.classList.remove('locked-slot');
        }

        slotEl.draggable = !!item && !isInBattle; // Savaşta sürüklemeyi kapat
        
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slotEl.appendChild(img);
            slotEl.innerHTML += window.getItemBadgeHTML(item);
			if (item.count && item.count > 1) {
			slotEl.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
			}
            
            // Tooltip her zaman çalışsın (Bakmak serbest)
            slotEl.onmouseenter = (e) => { if (window.innerWidth > 768) window.showItemTooltip(item, e); };
            slotEl.onmousemove = (e) => { if (window.innerWidth > 768) moveTooltip(e); };
            slotEl.onmouseleave = () => window.hideItemTooltip();
            
            // SADECE SAVAŞTA DEĞİLSEK AKSİYONLAR ÇALIŞSIN
            if (!isInBattle) {
                slotEl.ondragstart = (e) => handleDragStart(e, type, identifier);
                
                slotEl.onclick = (e) => {
                    const isMobile = window.innerWidth <= 768;
                    if (isMobile) {
                        if (lastTappedSlot === slotEl) { performSlotAction(item, type, identifier); lastTappedSlot = null; window.hideItemTooltip(); }
                        else { lastTappedSlot = slotEl; window.showItemTooltip(item, e); }
                    } else { performSlotAction(item, type, identifier); }
                };

                slotEl.oncontextmenu = (e) => {
                    e.preventDefault();
                    if (type === 'equip') unequipItem(identifier);
                    else if (type === 'brooch') unequipBrooch(identifier);
                };
            } else {
                // Savaşta isek sadece tooltip için tek tıklama (Mobil)
                slotEl.onclick = (e) => {
                    if (window.innerWidth <= 768) window.showItemTooltip(item, e);
                };
            }
        }
        
        // Savaşta isek üzerine bir şey bırakılmasın (Drop engelleme)
        if (!isInBattle) {
            slotEl.ondragover = (e) => e.preventDefault();
            slotEl.ondrop = (e) => handleDrop(e, type, identifier);
        }
    };
	
	const broochOverlay = document.querySelector('.brooch-overlay');
	if (broochOverlay) {
    broochOverlay.innerHTML = ''; // Önce temizle
    hero.brooches.forEach((item, i) => {
        const slot = document.createElement('div');
        slot.className = 'item-slot brooch-slot';
        slot.dataset.broochIndex = i;
        setupSlot(slot, item, 'brooch', i); // Mevcut setupSlot mantığını kullan
        broochOverlay.appendChild(slot);
		});
	}

    document.querySelectorAll('.brooch-slot').forEach((slot, i) => setupSlot(slot, hero.brooches[i], 'brooch', i));
    for (const slotKey in hero.equipment) {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotKey}"]`);
        if (slotEl) setupSlot(slotEl, hero.equipment[slotKey], 'equip', slotKey);
    }
    const bagGrid = document.querySelector('.bag-grid');
    if (bagGrid) {
        bagGrid.innerHTML = '';
        hero.inventory.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'item-slot bag-slot';
            setupSlot(slot, item, 'bag', index);
            bagGrid.appendChild(slot);
        });
    }
    document.getElementById('inv-gold-text').textContent = hero.gold;
};

// Aksiyonları tek merkezde toplayan yardımcı fonksiyon
function performSlotAction(item, type, identifier) {
    window.hideItemTooltip();
    if (type === 'bag') {
        if (window.isItemAllowedInUI(item, 'equip')) equipItem(identifier);
    } else if (type === 'equip') {
        unequipItem(identifier);
    } else if (type === 'brooch') {
        unequipBrooch(identifier);
    }
}

// --- YETENEK KİTABI (K) ---
// 1. YENİ FONKSİYON: Sınıfa göre sekme butonlarını oluşturur
window.renderSkillTabs = function() {
    const container = document.getElementById('skill-book-tabs-container');
    if (!container) return;

    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const classRules = CLASS_CONFIG[hero.class];
    
    container.innerHTML = ''; // Eski sekmeleri temizle

    // Her zaman en başta duracak ortak "GENEL" sekmesi
    const commonBtn = document.createElement('button');
    commonBtn.className = `tab-btn ${currentTab === 'common' ? 'active' : ''}`;
    commonBtn.textContent = lang.tab_common;
    commonBtn.onclick = () => setSkillTab('common');
    container.appendChild(commonBtn);

    // Sınıfa özel sekmeleri ekle (Brutal, Arcane vb.)
    classRules.skillTabs.forEach(tabKey => {
        const btn = document.createElement('button');
        btn.id = `tab-${tabKey}`; // CSS seçiciler için ID
        btn.className = `tab-btn ${currentTab === tabKey ? 'active' : ''}`;
        
        // translations.js içindeki tab_brutal, tab_arcane vb. anahtarları kullanır
        btn.textContent = lang[`tab_${tabKey}`] || tabKey.toUpperCase();
        
        btn.onclick = () => setSkillTab(tabKey);
        container.appendChild(btn);
    });
};

// 2. toggleSkillBook Fonksiyonunu Güncelle (Sekme çizimini tetiklemek için)
window.toggleSkillBook = function() {
    if (!isCharacterUIAllowed()) return;
    
    if (skillBookScreen.classList.contains('hidden')) {
        // Kitap açılırken sekmeleri de çiz
        renderSkillTabs(); 
        renderSkillBookList();
        renderEquippedSlotsInBook();
        skillBookScreen.classList.remove('hidden');
    } else {
        skillBookScreen.classList.add('hidden');
    }
};

// 3. setSkillTab Fonksiyonunu Güncelle (Aktif sekmeyi görsel olarak belli etmek için)
window.setSkillTab = function(tab) {
    currentTab = tab;
    // Sekmeleri yeniden çiz ki 'active' sınıfı yeni seçilene geçsin
    renderSkillTabs();
    renderSkillBookList();
};

window.renderSkillBookList = function() {
    if (!skillBookList) return;
    skillBookList.innerHTML = '';
    const isInBattle = battleScreen.classList.contains('active');
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

    const skills = Object.entries(SKILL_DATABASE)
        .filter(([_, s]) => s.data.category === currentTab)
        .sort((a, b) => a[1].data.tier - b[1].data.tier);

    skills.forEach(([key, skill]) => {
        // 1. Bu skilin öğrenilip öğrenilmediğini kontrol et
        const isLearned = hero.unlockedSkills.includes(key);

        // 2. Mevcut tab'da (currentTab) ve mevcut tier'da (skill.data.tier) 
        // daha önce HERHANGİ bir skill açılmış mı kontrol et
        const isAnySkillUnlockedInThisTier = hero.unlockedSkills.some(unlockedKey => {
            const unlockedSkill = SKILL_DATABASE[unlockedKey];
            return unlockedSkill.data.category === currentTab && 
                   unlockedSkill.data.tier === skill.data.tier;
        });

        // 3. EĞER bu tier'dan bir skill seçilmişse VE o seçilen skill BU DEĞİLSE:
        // Bu skilli hiç çizme (Görünmez yap)
        if (isAnySkillUnlockedInThisTier && !isLearned) {
            return; // Döngünün bu adımını atla (Continue mantığı)
        }
        
        // --- YENİ TIER KISITLAMA MANTIĞI BİTİŞ ---
        if (skill.data.category === 'common' && skill.data.tier === 1 && !isLearned) return;
		const skillTrans = lang.skills[key] || { name: skill.data.name, desc: skill.data.menuDescription };
        // --- YENİ: DİNAMİK AÇIKLAMA FİLTRESİ ---
		const resourceLabel = lang[`resource_${CLASS_CONFIG[hero.class].resourceName}`];
		// Metnin içindeki 'Rage' veya 'Öfke' kelimelerini güncel etiketle değiştir
		let dynamicDesc = skillTrans.desc.replace(/Rage|Öfke/gi, resourceLabel);
		// --------------------------------------
        const actualCost = skill.data.pointCost !== undefined ? skill.data.pointCost : skill.data.tier;
        const canAfford = hero.skillPoints >= actualCost;
        const treeMet = checkSkillTreeRequirement(skill.data.category, skill.data.tier);
        
        const item = document.createElement('div');
        const isSelected = selectedSkillToEquip === key;
        item.className = `skill-book-item ${isLearned ? '' : 'locked'} ${isSelected ? 'selected-skill' : ''}`;
        
        let action = isLearned ? `<small style="color:#43FF64; font-weight:bold;">${lang.learned_status}</small>` : 
         (isInBattle ? `<small style="color:orange; font-weight:bold;">${lang.battle_lock_warning}</small>` : 
         (canAfford && treeMet ? `<button class="btn-learn-skill" onclick="learnSkill('${key}')">${actualCost} SP</button>` : `<small style="color:#777;">${actualCost} ${lang.sp_required}</small>`));

        item.innerHTML = `
			<div style="position:relative;"><img src="images/${skill.data.icon}" class="skill-book-icon"><span class="tier-badge">T${skill.data.tier}</span></div>
			<div class="skill-info" style="flex-grow:1;">
				<div style="display:flex; justify-content:space-between; align-items:center;"><h4>${skillTrans.name}</h4>${action}</div>
				<p>${dynamicDesc}</p> <!-- GÜNCELLENDİ -->
			</div>`;
			
			const sID = skill.data.id || key;
        let exhaustionInfo = "";

        if (skill.data.type !== 'passive') {
            // --- GÜNCELLEME: Anlık kullanım sayısına göre maliyeti hesapla ---
            const usage = hero.skillUsage[sID] || 0;
            const currentEx = window.getExhaustionCost(skill.data, usage);
            
            // translations'dan "Yorgunluk" kelimesini çek (Exhaustion veya Yorgunluk)
            exhaustionInfo = `<div style="color:#ffae00; font-size:0.75rem; margin-top:5px;">${lang.exhaustion_label}: ${currentEx > 0 ? "+" : ""}${currentEx}</div>`;
        }
        // -------------------------------------------------------------

        item.innerHTML = `
            <div style="position:relative;"><img src="images/${skill.data.icon}" class="skill-book-icon"><span class="tier-badge">T${skill.data.tier}</span></div>
            <div class="skill-info" style="flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;"><h4>${skillTrans.name}</h4>${action}</div>
                <p>${dynamicDesc}</p>
                ${exhaustionInfo}
            </div>`;
        
        if (isLearned && skill.data.type !== 'passive') {
            item.setAttribute('draggable', true);
            item.ondragstart = (e) => { selectedSkillToEquip = null; e.dataTransfer.setData('text/plain', key); };
            item.onclick = (e) => {
                if (e.target.tagName !== 'BUTTON') {
                    selectedSkillToEquip = (selectedSkillToEquip === key) ? null : key;
                    renderSkillBookList();
                }
            };
        }
        skillBookList.appendChild(item);
    });
};

window.renderEquippedSlotsInBook = function() {
    if (!skillBookEquippedBar) return;
    skillBookEquippedBar.innerHTML = '';
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    
    // --- SAVAŞ KONTROLÜ ---
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    const overlay = document.getElementById('skill-battle-overlay');
    
    if (overlay) {
        if (isInBattle) overlay.classList.remove('hidden');
        else overlay.classList.add('hidden');
    }
    // ----------------------

    for (let i = 0; i < hero.equippedSkills.length; i++) {
        const slot = document.createElement('div'); 
        slot.className = 'menu-slot' + (i < 2 ? ' basic-menu-slot' : '');
        slot.innerHTML = `<span class="key-hint">${(i === 0) ? 'A' : (i === 1) ? 'D' : (i - 1)}</span>`;
        const key = hero.equippedSkills[i];

        // SADECE SAVAŞTA DEĞİLSEK TIKLAMA ÇALIŞSIN
        if (!isInBattle) {
            slot.onclick = () => {
                if (selectedSkillToEquip) { 
                    hero.equippedSkills[i] = selectedSkillToEquip; 
                    selectedSkillToEquip = null; 
                } 
                else if (hero.equippedSkills[i]) {
                    hero.equippedSkills[i] = null;
                }
                refreshBookUI();
            };

            slot.ondragover = e => e.preventDefault();
            slot.ondrop = e => {
                e.preventDefault(); 
                const raw = e.dataTransfer.getData('text/plain');
                try { 
                    const data = JSON.parse(raw); 
                    if (data.type === 'move_skill') { 
                        const temp = hero.equippedSkills[i]; 
                        hero.equippedSkills[i] = hero.equippedSkills[data.index]; 
                        hero.equippedSkills[data.index] = temp; 
                    } 
                } catch(err) { 
                    if (SKILL_DATABASE[raw] && hero.unlockedSkills.includes(raw)) hero.equippedSkills[i] = raw; 
                }
                refreshBookUI();
            };
        }

        if (key && SKILL_DATABASE[key]) { 
            const img = document.createElement('img');
            img.src = `images/${SKILL_DATABASE[key].data.icon}`;
            slot.appendChild(img);

            // SADECE SAVAŞTA DEĞİLSEK SÜRÜKLENSİN
            if (!isInBattle) {
                slot.setAttribute('draggable', true); 
                slot.ondragstart = e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'move_skill', index: i }));
                slot.ondragend = e => { 
                    if (e.dataTransfer.dropEffect === "none") { 
                        hero.equippedSkills[i] = null; 
                        refreshBookUI(); 
                    } 
                };
            } else {
                slot.setAttribute('draggable', false);
                slot.style.cursor = 'default';
            }
        }
        skillBookEquippedBar.appendChild(slot);
    }
};

function refreshBookUI() {
    renderEquippedSlotsInBook(); 
    renderSkillBookList();
    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
}

// --- SEÇİM EKRANLARI ---
window.openBasicSkillSelection = function() { switchScreen(basicSkillSelectionScreen); selectedAttackKey = null; selectedDefenseKey = null; renderBasicSkillSelection(); updateSelectionUI(); };
window.renderBasicSkillSelection = function() {
    const atkC = document.getElementById('selection-list-attack'); const defC = document.getElementById('selection-list-defense'); atkC.innerHTML = ''; defC.innerHTML = '';
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang]; // lang tanımı
    for (const [key, skill] of Object.entries(SKILL_DATABASE)) {
        if (skill.data.category === 'common' && skill.data.tier === 1) {
			const skillTrans = lang.skills[key] || { name: skill.data.name, desc: skill.data.menuDescription };
            // --- YENİ: DİNAMİK FİLTRE ---
		const resourceLabel = lang[`resource_${CLASS_CONFIG[hero.class].resourceName}`];
		let dynamicDesc = skillTrans.desc.replace(/Rage|Öfke/gi, resourceLabel);
		// ----------------------------

		const card = document.createElement('div'); 
		card.className = 'selection-card'; 
		card.innerHTML = `<img src="images/${skill.data.icon}"><div><h4>${skillTrans.name}</h4><small>${dynamicDesc}</small></div>`; // dynamicDesc kullanıldı
            card.onclick = () => {
                if (skill.data.type === 'attack') { selectedAttackKey = key; document.querySelectorAll('#selection-list-attack .selection-card').forEach(c => c.classList.remove('selected')); }
                else { selectedDefenseKey = key; document.querySelectorAll('#selection-list-defense .selection-card').forEach(c => c.classList.remove('selected')); }
                card.classList.add('selected'); updateSelectionUI();
            };
            (skill.data.type === 'attack' ? atkC : defC).appendChild(card);
        }
    }
};
function updateSelectionUI() {
    const confirmBtn = document.getElementById('btn-confirm-basic-skills');
    
    // O anki aktif dili alalım
    const lang = window.LANGUAGES[window.gameSettings.lang];

    if (selectedAttackKey && selectedDefenseKey) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor = "pointer";
        // "Maceraya Başla" metnini dilden çekiyoruz
        confirmBtn.textContent = lang.start_adventure_btn; 
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.cursor = "not-allowed";
        
        // Buradaki tüm metinleri de dilden çekiyoruz
        if (!selectedAttackKey && !selectedDefenseKey) {
            confirmBtn.textContent = lang.select_skills;
        } else if (!selectedAttackKey) {
            confirmBtn.textContent = lang.select_attack;
        } else if (!selectedDefenseKey) {
            confirmBtn.textContent = lang.select_defense;
        }
    }
}
window.confirmBasicSkills = function() { if (!selectedAttackKey || !selectedDefenseKey) return; hero.unlockedSkills.push(selectedAttackKey, selectedDefenseKey); hero.equippedSkills[0] = selectedAttackKey; hero.equippedSkills[1] = selectedDefenseKey; if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); // DEĞİŞEN KISIM:
    window.starterCityProgress.skillsChosen = true;
    switchScreen(window.starterCityScreen); // Şehre geri dön
    updateStarterCityUI();
};