// js/ui/menu_manager.js
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
    if (!statName || !statClass) return;
    
    // 1. Verileri Hazırla
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : {};
    const rules = CLASS_CONFIG[hero.class];

    // --- SADECE İTEM VE ANA STATLARDAN GELEN (SKILL-SIZ) DEĞERLERİ HESAPLA ---
    let itemOnlyStr = hero.str;
    let itemOnlyDex = hero.dex;
    let itemAtkBonus = 0;
    let itemDefBonus = 0;

    // Ekipmanları tara (Sadece item bonuslarını topluyoruz)
    for (const slotKey in hero.equipment) {
        const item = hero.equipment[slotKey];
        if (item && item.stats) {
            if (item.stats.str) itemOnlyStr += item.stats.str;
            if (item.stats.dex) itemOnlyDex += item.stats.dex;
            if (item.stats.atk) itemAtkBonus += item.stats.atk;
            if (item.stats.def) itemDefBonus += item.stats.def;
        }
    }

    // "Stabil" değer (İtemler var ama Skill Buffları yok)
    const stableAtk = (hero.baseAttack || 10) + itemAtkBonus + Math.floor(itemOnlyStr * (rules.atkStats.str || 0.5));
    const stableDef = (hero.baseDefense || 0) + itemDefBonus + Math.floor(itemOnlyDex * (rules.defStats.dex || 0.34));

    // 2. Üst Bilgiler
    statName.textContent = hero.playerName; 
    statClass.textContent = `(${hero.class})`; 
    statLevel.textContent = `Lv. ${hero.level}`;
    
    let xpPercent = hero.xpToNextLevel > 0 ? Math.min(100, (hero.xp / hero.xpToNextLevel) * 100) : 0;
    const xpBarFill = document.getElementById('stat-xp-bar');
    if (xpBarFill) xpBarFill.style.width = `${xpPercent}%`;
    if (statXp) statXp.textContent = `%${Math.floor(xpPercent)}`;

    statHp.textContent = `${hero.hp} / ${effective.maxHp}`;
    if (statRage) statRage.textContent = `${hero.rage} / ${effective.maxRage}`;

    // 3. SAVAŞ STATLARI (ATAK VE DEFANS) - Sadece Skill/Choice etkisine duyarlı
    const applyEffectColor = (el, current, stable) => {
    el.textContent = current;
    // Eğer bir "Savunma Sıfırlama" debuff'ı yoksa ve değer 0'dan büyükse kırmızı yapma
    const hasDefPenalty = hero.statusEffects.some(e => e.id === 'defense_zero');

    if (current > stable) {
        el.style.color = "#43FF64"; // Buff varsa YEŞİL
    } else if (current < stable || (hasDefPenalty && el === statDef)) {
        el.style.color = "#ff4d4d"; // Gerçek bir düşüş varsa KIRMIZI
    } else {
        el.style.color = "#ffd700"; // Normal durum (Altın/Sarı)
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
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
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
    const resTypes = ['physical', 'fire', 'cold', 'lightning', 'poison', 'curse'];
    resTypes.forEach(type => {
        const el = document.getElementById(`res-${type}`);
        if (el) {
            const baseRes = hero.baseResistances[type] || 0;
            const totalRes = effective.resists ? (effective.resists[type] || 0) : baseRes;
            const resBonus = totalRes - baseRes;
            if (resBonus > 0) el.innerHTML = `${baseRes} <span style="color:#43FF64; font-size:0.8em;">(+${resBonus})</span>`;
            else el.textContent = baseRes;
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

    // 1. DEĞİŞKENLERİ TANIMLA (Hata buradaydı)
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const langItems = lang.items || {};

    const nameEl = document.getElementById('tooltip-name');
    const tierEl = document.getElementById('tooltip-tier');
    const statsEl = document.getElementById('tooltip-stats');
    
    // 2. KURAL SETİNİ AL
    const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES.jewelry;

    nameEl.textContent = getTranslatedItemName(item);

    // 3. GÖRSEL SINIFLARI AYARLA (Badge Tipine Göre)
    if (rules.badgeType === "craft") {
        nameEl.className = 'tooltip-name'; 
        tierEl.className = 'tooltip-tier'; // Materyal rengi (gri/beyaz)
    } else {
        nameEl.className = `tooltip-name tier-${item.tier}`;
        tierEl.className = `tooltip-tier tier-${item.tier}`; // Tier rengi (Yeşil, Mavi vb.)
    }
    
    // 4. SEVİYE YAZISINI AYARLA (Tier 1 yerine "Materyal" yazar)
    // Bu fonksiyonun ui_elements.js içinde olduğundan emin ol!
    tierEl.textContent = window.getItemLevelLabel(item);
    
    // 5. STATLARI LİSTELE
    statsEl.innerHTML = '';
    if (item.stats && Object.keys(item.stats).length > 0) {
        for (const [statKey, value] of Object.entries(item.stats)) {
            const row = document.createElement('div');
            row.className = 'tooltip-stat-row';
            
            // getStatDisplayName fonksiyonunu kullanıyoruz
            const statName = (typeof window.getStatDisplayName === 'function') 
                ? window.getStatDisplayName(statKey) 
                : statKey;

            row.innerHTML = `<span>${statName}</span> <span class="tooltip-val">+${value}</span>`;
            statsEl.appendChild(row);
        }
    } else {
        // Hata veren satır düzeltildi: currentLang artık tanımlı.
        const hint = currentLang === 'tr' ? 'Üretim materyali' : 'Crafting material';
        statsEl.innerHTML = `<div style="color:#888; font-size:0.8em; font-style:italic;">${hint}</div>`;
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
    hideItemTooltip();
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
        alert(window.gameSettings.lang === 'tr' ? "Çanta dolu!" : "Bag is full!");
    }
};
// Eşyayı Tak (Çantadan Ekipmana)
window.equipItem = function(inventoryIndex) {
    hideItemTooltip();
    const item = hero.inventory[inventoryIndex];
    if (!item) return;

    // YENİ: Merkezi kural kontrolü
    if (!window.isItemAllowedInUI(item, 'equip')) {
        console.log("Bu eşya kuşanılabilir bir tür değil.");
        return; 
    }

    // Hedef slotu belirleme mantığı aynı kalıyor...
    let targetSlot = null;
    if (item.type === 'earring') targetSlot = !hero.equipment.earring1 ? 'earring1' : 'earring2';
    else if (item.type === 'ring') targetSlot = !hero.equipment.ring1 ? 'ring1' : 'ring2';
    else targetSlot = item.type;

    const oldItem = hero.equipment[targetSlot];
    hero.equipment[targetSlot] = item;
    hero.inventory[inventoryIndex] = oldItem; 

    renderInventory();
    updateStats();
    
    const currentLang = window.gameSettings.lang || 'tr';
    const msg = currentLang === 'tr' ? 'kuşanıldı.' : 'equipped.';
    writeLog(`🎒 ${getTranslatedItemName(item)} ${msg}`);
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
    const goldText = document.getElementById('inv-gold-text');
    if (goldText) goldText.textContent = hero.gold;

    // --- YENİLENMİŞ SLOT KURULUM YARDIMCISI ---
    const setupSlot = (slotEl, item, type, identifier) => {
        slotEl.innerHTML = '';
        slotEl.draggable = !!item;
        
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slotEl.appendChild(img);

            // KRİTİK DEĞİŞİKLİK: Manuel badge kontrolü yerine merkezi fonksiyon
            slotEl.innerHTML += window.getItemBadgeHTML(item);

            // Miktar (Count) Badge'i (Stackable eşyalar için)
            if (item.count && item.count > 1) {
                slotEl.innerHTML += `<span class="item-count-badge">${item.count}</span>`;
            }
            
            // Tooltip ve Drag-Start olayları
            slotEl.onmouseenter = (e) => showItemTooltip(item, e);
            slotEl.onmousemove = (e) => moveTooltip(e);
            slotEl.onmouseleave = () => hideItemTooltip();
            slotEl.ondragstart = (e) => handleDragStart(e, type, identifier);
            
            // Sağ tık (Context Menu) - Çıkarma veya Takma
            slotEl.oncontextmenu = (e) => {
                e.preventDefault();
                if (type === 'equip') unequipItem(identifier);
                else equipItem(identifier);
            };

            // Sol Tık (Sadece Takılabilir Eşyalar İçin)
            if (type === 'bag') {
                // KRİTİK DEĞİŞİKLİK: "Takılabilir mi?" kuralını merkezi sisteme soruyoruz
                const canEquip = window.isItemAllowedInUI(item, 'equip');
                if (canEquip) {
                    slotEl.onclick = () => { hideItemTooltip(); equipItem(identifier); };
                } else {
                    slotEl.onclick = null; // Materyallere sol tık bir şey yapmaz
                }
            }
        } else {
            slotEl.onmouseenter = null;
            slotEl.oncontextmenu = (e) => e.preventDefault();
            slotEl.onclick = null;
        }

        slotEl.ondragover = (e) => e.preventDefault();
        slotEl.ondrop = (e) => handleDrop(e, type, identifier);
    };

    // 1. Broşlar
    document.querySelectorAll('.brooch-slot').forEach((slot, i) => {
        setupSlot(slot, hero.brooches[i], 'brooch', i);
    });

    // 2. Ekipmanlar
    for (const slotKey in hero.equipment) {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotKey}"]`);
        if (slotEl) setupSlot(slotEl, hero.equipment[slotKey], 'equip', slotKey);
    }

    // 3. Çanta (Bag) Gridini Doldur
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
};

// --- YETENEK KİTABI (K) ---
window.toggleSkillBook = function() {
    if (!isCharacterUIAllowed()) return;
    skillBookScreen.classList.toggle('hidden');
    if (!skillBookScreen.classList.contains('hidden')) {
        renderSkillBookList();
        renderEquippedSlotsInBook();
    }
};

window.setSkillTab = function(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`tab-${tab}`)?.classList.add('active');
    renderSkillBookList();
};

window.renderSkillBookList = function() {
    if (!skillBookList) return;
    skillBookList.innerHTML = '';
    const isInBattle = battleScreen.classList.contains('active');
    
    // Skill Puanı Göster
    if (skillPointsDisplay) skillPointsDisplay.textContent = hero.skillPoints;

    // 1. Mevcut dili al (tr veya en)
    const currentLang = window.gameSettings.lang || 'tr';
    
    // 2. KRİTİK EKSİK: lang değişkenini tanımlıyoruz
    const lang = window.LANGUAGES[currentLang];

    const skills = Object.entries(SKILL_DATABASE)
        .filter(([_, s]) => s.data.category === currentTab)
        .sort((a, b) => a[1].data.tier - b[1].data.tier);

    // DÖNGÜ BAŞLANGICI
    skills.forEach(([key, skill]) => {
        const isLearned = hero.unlockedSkills.includes(key);
        
        // Başlangıç skillerini gizle (öğrenilmediyse)
        if (skill.data.category === 'common' && skill.data.tier === 1 && !isLearned) return;

        // --- ÇEVİRİ ---
        const skillTranslation = (lang.skills && lang.skills[key]) 
            ? lang.skills[key] 
            : { name: skill.data.name, desc: skill.data.menuDescription };

        const canAfford = hero.skillPoints >= skill.data.tier;
        const treeMet = checkSkillTreeRequirement(skill.data.category, skill.data.tier);
        const item = document.createElement('div');
        item.className = `skill-book-item ${isLearned ? '' : 'locked'}`;
		
        let cdHtml = skill.data.cooldown > 0 ? `<br><span style="color:#ffd700; font-size:0.85em;">⌛ ${lang.cooldown_label}: ${skill.data.cooldown} ${lang.turn_suffix}</span>` : '';
		let cdHtml1 = skill.data.cooldown < 1 ? `<br><span style="color:#ffd700; font-size:0.85em;">${lang.same_turn_warning}</span>` : '';
        
        // Burada lang değişkeni artık tanımlı olduğu için hata vermeyecek
        let action = isLearned ? `<small style="color:#43FF64; font-weight:bold;">${lang.learned_status}</small>` : 
             (isInBattle ? `<small style="color:orange; font-weight:bold;">${lang.battle_lock_warning}</small>` : 
             (canAfford && treeMet ? `<button class="btn-learn-skill" onclick="learnSkill('${key}')">+</button>` : `<small style="color:#777;">${lang.missing_points}</small>`));

        // Metinleri skillTranslation içinden alıyoruz
        item.innerHTML = `
            <div style="position:relative;">
                <img src="images/${skill.data.icon}" class="skill-book-icon">
                <span class="tier-badge">T${skill.data.tier}</span>
            </div>
            <div class="skill-info" style="flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="color:#f0e68c !important;">${skillTranslation.name}</h4>${action}
                </div>
                <p>${skillTranslation.desc}${cdHtml}${cdHtml1}</p>
            </div>`;
        
        if (isLearned && skill.data.type !== 'passive') {
            item.setAttribute('draggable', true);
            item.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', key));
        }
        skillBookList.appendChild(item);
    });
};

window.renderEquippedSlotsInBook = function() {
    if (!skillBookEquippedBar) return;
    skillBookEquippedBar.innerHTML = '';
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    for (let i = 0; i < hero.equippedSkills.length; i++) {
        const slot = document.createElement('div'); 
        slot.className = 'menu-slot' + (i < 2 ? ' basic-menu-slot' : '');
        slot.innerHTML = `<span class="key-hint">${(i === 0) ? 'A' : (i === 1) ? 'D' : (i - 1)}</span>`;
        
        const key = hero.equippedSkills[i];

        // --- DROP MANTIĞI (Skilli Yerleştirme/Swap) ---
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => {
            e.preventDefault(); 
            const raw = e.dataTransfer.getData('text/plain');
            try { 
                const data = JSON.parse(raw); 
                if (data.type === 'move_skill') { 
                    // İki slotun yerini değiştir (Swap)
                    const temp = hero.equippedSkills[i]; 
                    hero.equippedSkills[i] = hero.equippedSkills[data.index]; 
                    hero.equippedSkills[data.index] = temp; 
                } 
            }
            catch(err) { 
                // Kitaptan bara sürükleme
                if (SKILL_DATABASE[raw] && hero.unlockedSkills.includes(raw)) {
                    hero.equippedSkills[i] = raw; 
                }
            }
            renderEquippedSlotsInBook(); 
            if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
        });

        if (key && SKILL_DATABASE[key]) { 
            const skillData = SKILL_DATABASE[key].data;
            const img = document.createElement('img');
            img.src = `images/${skillData.icon}`;
            img.title = skillData.name;
            slot.appendChild(img);

            // --- DRAG START (Skilli Sürüklemeye Başla) ---
            slot.setAttribute('draggable', true); 
            slot.addEventListener('dragstart', e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'move_skill', index: i }));
            });

            // --- DRAG END (Skilli DIŞARI BIRAKMA MANTIĞI) ---
            slot.addEventListener('dragend', e => {
                // Eğer skill bir slotun üzerine bırakılmadıysa (boşluğa atıldıysa)
                if (e.dataTransfer.dropEffect === "none") {
                    const unequippedSkillName = lang.skills[key]?.name || skillData.name;
                    hero.equippedSkills[i] = null; // Slotu boşalt
                    renderEquippedSlotsInBook();
                    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
                    writeLog(`📤 ${unequippedSkillName} ${lang.log_skill_unequipped}`);
                }
            });

            // Sağ Tıkla Çıkarma (Hala çalışsın)
            slot.oncontextmenu = e => { 
                e.preventDefault(); 
                hero.equippedSkills[i] = null; 
                renderEquippedSlotsInBook(); 
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); 
            };
        }
        skillBookEquippedBar.appendChild(slot);
    }
};

// --- SEÇİM EKRANLARI ---
window.openBasicSkillSelection = function() { switchScreen(basicSkillSelectionScreen); selectedAttackKey = null; selectedDefenseKey = null; renderBasicSkillSelection(); updateSelectionUI(); };
window.renderBasicSkillSelection = function() {
    const atkC = document.getElementById('selection-list-attack'); const defC = document.getElementById('selection-list-defense'); atkC.innerHTML = ''; defC.innerHTML = '';
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang]; // lang tanımı
    for (const [key, skill] of Object.entries(SKILL_DATABASE)) {
        if (skill.data.category === 'common' && skill.data.tier === 1) {
			const skillTrans = lang.skills[key] || { name: skill.data.name, desc: skill.data.menuDescription };
            const card = document.createElement('div'); card.className = 'selection-card'; card.innerHTML = `<img src="images/${skill.data.icon}"><div><h4>${skillTrans.name}</h4><small>${skillTrans.desc}</small></div>`;
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