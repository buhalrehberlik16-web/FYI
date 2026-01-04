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
    
    // 1. Ham (Kendi verdiğimiz) statları ve Toplam (Eşyalı/Bufflı) statları alalım
    let effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : {};
    const baseStats = {
        str: hero.str,
        dex: hero.dex,
        int: hero.int,
        vit: hero.vit,
        mp_pow: hero.mp_pow
    };

    // 2. Üst Bilgiler (İsim, Level, XP)
    statName.textContent = hero.playerName; 
    statClass.textContent = `(${hero.class})`; 
    statLevel.textContent = `Lv. ${hero.level}`;
    
    let xpPercent = hero.xpToNextLevel > 0 ? Math.min(100, (hero.xp / hero.xpToNextLevel) * 100) : 0;
    const xpBarFill = document.getElementById('stat-xp-bar');
    if (xpBarFill) xpBarFill.style.width = `${xpPercent}%`;
    if (statXp) statXp.textContent = `%${Math.floor(xpPercent)}`;

    statHp.textContent = `${hero.hp} / ${effective.maxHp}`;
    if (statRage) statRage.textContent = `${hero.rage} / ${hero.maxRage}`;

    // 3. Savaş Statları (Saldırı ve Defans)
    // Bunlar zaten hesaplanmış toplam değerlerdir
    statAtk.textContent = effective.atk;
    statDef.textContent = effective.def;

    // 4. TEMEL STATLAR (ASIL DEĞİŞİKLİK BURADA)
    // Yardımcı bir fonksiyon: Statı ve yanındaki bonusu yazar
    const renderStatWithBonus = (elementId, baseVal, effectiveVal) => {
        const el = document.getElementById(elementId);
        if (!el) return;

        const bonus = effectiveVal - baseVal;
        
        if (bonus > 0) {
            // Eğer bonus varsa: "15 (+5)" şeklinde yaz ve bonusu yeşil yap
            el.innerHTML = `${baseVal} <span style="color:#43FF64; font-size:0.9em; font-weight:bold;">(+${bonus})</span>`;
        } else if (bonus < 0) {
            // Eğer debuff varsa (nadir durum): "15 (-3)" şeklinde yaz ve kırmızı yap
            el.innerHTML = `${baseVal} <span style="color:#ff4d4d; font-size:0.9em; font-weight:bold;">(${bonus})</span>`;
        } else {
            // Bonus yoksa sadece ham değeri yaz
            el.textContent = baseVal;
        }
    };

    // Her stat için bu işlemi yapalım
    renderStatWithBonus('stat-str', baseStats.str, effective.str);
    renderStatWithBonus('stat-dex', baseStats.dex, effective.dex);
    renderStatWithBonus('stat-int', baseStats.int, effective.int);
    renderStatWithBonus('stat-vit', baseStats.vit, effective.vit);
    renderStatWithBonus('stat-mp', baseStats.mp_pow, effective.mp_pow);

    // 5. Puan Dağıtma Butonları ve Uyarılar
    const pointsBox = document.getElementById('points-container');
    const pointsDisplay = document.getElementById('stat-points-display');
    const plusButtons = document.querySelectorAll('.btn-stat-plus');
    const isInBattle = battleScreen.classList.contains('active');
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    document.getElementById('stat-battle-warning')?.remove();

    if (isInBattle) {
        if (pointsBox) pointsBox.classList.add('hidden');
        plusButtons.forEach(btn => btn.classList.add('hidden'));
        const warning = document.createElement('div');
        warning.id = 'stat-battle-warning';
        warning.style.cssText = "color:orange; text-align:center; margin-top:15px; font-weight:bold;";
        warning.textContent = lang.stat_battle_warning;
        document.querySelector('.stat-content').appendChild(warning);
    } else if (hero.statPoints > 0) {
        if (pointsBox) {
            pointsBox.classList.remove('hidden');
            pointsDisplay.textContent = hero.statPoints;
        }
        plusButtons.forEach(btn => btn.classList.remove('hidden'));
    } else {
        if (pointsBox) pointsBox.classList.add('hidden');
        plusButtons.forEach(btn => btn.classList.add('hidden'));
    }

    // 6. Dirençler (Resistances)
    // Eşyalardan gelen dirençleri de burada göstermek isteyebilirsin
    const resTypes = ['physical', 'fire', 'cold', 'lightning', 'poison', 'curse'];
    resTypes.forEach(type => {
        const el = document.getElementById(`res-${type}`);
        if (el) {
            // Ham direnç (baseResistances) + Eşya direnci (getHeroEffectiveStats içinde hesaplanıyor)
            // effective.resists objesini combat_manager'da return ettiğimizden emin olmalıyız
            const baseRes = hero.baseResistances[type] || 0;
            const totalRes = effective.resists ? (effective.resists[type] || 0) : baseRes;
            const resBonus = totalRes - baseRes;

            if (resBonus > 0) {
                el.innerHTML = `${baseRes} <span style="color:#43FF64; font-size:0.8em;">(+${resBonus})</span>`;
            } else {
                el.textContent = baseRes;
            }
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

    const nameEl = document.getElementById('tooltip-name');
    const tierEl = document.getElementById('tooltip-tier');
    const statsEl = document.getElementById('tooltip-stats');
    
    const currentLang = window.gameSettings.lang || 'tr';
    const langItems = window.LANGUAGES[currentLang].items;

    nameEl.textContent = getTranslatedItemName(item);
	nameEl.className = `tooltip-name tier-${item.tier}`; // İsim renkli

    tierEl.textContent = `${langItems.tier_label} ${item.tier}`;
	tierEl.className = `tooltip-tier tier-${item.tier}`; // "Seviye X" yazısı renkli
    
    statsEl.innerHTML = '';
    for (const [statKey, value] of Object.entries(item.stats)) {
        const row = document.createElement('div');
        row.className = 'tooltip-stat-row';
        row.innerHTML = `<span>${getStatDisplayName(statKey)}</span> <span class="tooltip-val">+${value}</span>`;
        statsEl.appendChild(row);
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

    let targetSlot = null;
    // Otomatik slot belirleme mantığı
    if (item.type === 'earring') {
        targetSlot = !hero.equipment.earring1 ? 'earring1' : 'earring2';
    } else if (item.type === 'ring') {
        targetSlot = !hero.equipment.ring1 ? 'ring1' : 'ring2';
    } else {
        targetSlot = item.type; // necklace veya belt
    }

    // Seçilen slotta zaten bir şey varsa onu çantaya geri al (Swap)
    const oldItem = hero.equipment[targetSlot];
    hero.equipment[targetSlot] = item;
    hero.inventory[inventoryIndex] = oldItem; 

    renderInventory();
    updateStats();
    writeLog(`🎒 ${getTranslatedItemName(item)} ${window.gameSettings.lang === 'tr' ? 'kuşanıldı.' : 'equipped.'}`);
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

    // Slot Kurulum Yardımcısı
    const setupSlot = (slotEl, item, type, identifier) => {
		slotEl.onclick = (e) => {
    // Eğer cihaz mobilse (dokunmatikse)
    if ('ontouchstart' in window) {
        // İlk tıklamada tooltip göster, ikinci tıklamada işlem yap mantığı
        if (document.getElementById('item-tooltip').classList.contains('hidden')) {
            showItemTooltip(item, e);
            // Tooltip mobilde 3 saniye sonra kapansın
            setTimeout(hideItemTooltip, 3000);
            return; // İşlemi (takma/satma) durdur, sadece bilgiyi göster
        }
    }
    
    // PC'de veya ikinci tıklamada normal işlem devam eder
    if (type === 'bag') {
        hideItemTooltip();
        equipItem(identifier);
    }
};
		
		
		
        slotEl.innerHTML = '';
        slotEl.draggable = item ? true : false;
        
        if (item) {
            const img = document.createElement('img');
            img.src = `items/images/${item.icon}`;
            slotEl.appendChild(img);
		const tierBadge = document.createElement('span');
		tierBadge.className = `item-tier-badge badge-${item.tier}`; // Renkli arka plan
		tierBadge.textContent = `T${item.tier}`;
		slotEl.appendChild(tierBadge);
		
		// YENİ: ADET (COUNT) BADGE
    if (item.isStack && item.count > 1) {
        const countBadge = document.createElement('span');
        countBadge.className = 'item-count-badge';
        countBadge.textContent = item.count;
        slotEl.appendChild(countBadge);
    }

		// Slotun çerçevesini de yüksek seviyelerde değiştirelim
		if (item.tier >= 4) slotEl.classList.add(`border-tier-${item.tier}`);
            
            // Tooltip
            slotEl.onmouseenter = (e) => showItemTooltip(item, e);
            slotEl.onmousemove = (e) => moveTooltip(e);
            slotEl.onmouseleave = () => hideItemTooltip();
            
            // Sürükleme Başlat
            slotEl.ondragstart = (e) => handleDragStart(e, type, identifier);

            // Sağ Tıkla Çıkar/Tak
            slotEl.oncontextmenu = (e) => {
                e.preventDefault();
                if (type === 'equip') unequipItem(identifier);
                else equipItem(identifier);
            };

            // Sol Tıkla Tak (Sadece Çanta İçin)
            if (type === 'bag') {
                slotEl.onclick = () => equipItem(identifier);
            }
        } else {
            slotEl.onmouseenter = null;
            slotEl.oncontextmenu = (e) => e.preventDefault();
        }

        // Üzerine Bırakma (Drop) Hedefi Yap
        slotEl.ondragover = (e) => e.preventDefault();
        slotEl.ondrop = (e) => handleDrop(e, type, identifier);
    };

    // 1. Broşlar (Şimdilik statik ama altyapı hazır)
    document.querySelectorAll('.brooch-slot').forEach((slot, i) => {
        setupSlot(slot, hero.brooches[i], 'brooch', i);
    });

    // 2. Ekipmanlar
    for (const slotKey in hero.equipment) {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotKey}"]`);
        if (slotEl) setupSlot(slotEl, hero.equipment[slotKey], 'equip', slotKey);
    }

    // 3. Çanta (Bag)
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
window.confirmBasicSkills = function() { if (!selectedAttackKey || !selectedDefenseKey) return; hero.unlockedSkills.push(selectedAttackKey, selectedDefenseKey); hero.equippedSkills[0] = selectedAttackKey; hero.equippedSkills[1] = selectedDefenseKey; if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); switchScreen(mapScreen); writeLog("Savaş tarzı belirlendi."); };