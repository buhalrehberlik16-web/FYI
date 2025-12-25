// js/ui/menu_manager.js
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
    if (!statName || !statClass || !statAtk || !statDef) return;
    
    // 1. Mevcut (Bufflı) Statları Al
    let effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : { atk: 0, def: 0 };
    const rules = CLASS_CONFIG[hero.class];

    // 2. Doğal (Buffsız) Statları Hesapla
    // Atak: Base + (STR / 2) | Defans: Base + (DEX / 3)
    const naturalAtk = (hero.baseAttack || 10) + Math.floor(hero.str / rules.strDivisor);
    const naturalDef = (hero.baseDefense || 1) + Math.floor(hero.dex / rules.dexDivisor);

    // 3. Başlık Düzeni
    statName.textContent = hero.playerName; 
    statClass.textContent = `(${hero.class})`; 
    statLevel.textContent = `Lv. ${hero.level}`;
    
    // 4. XP Barı
    let xpPercent = hero.xpToNextLevel > 0 ? Math.min(100, (hero.xp / hero.xpToNextLevel) * 100) : 0;
    if (statXp) statXp.textContent = `%${Math.floor(xpPercent)}`; 
    const xpBarFill = document.getElementById('stat-xp-bar');
    if (xpBarFill) xpBarFill.style.width = `${xpPercent}%`;

    // 5. HP ve Rage
    statHp.textContent = `${hero.hp} / ${hero.maxHp}`;
    statRage.textContent = `${hero.rage} / ${hero.maxRage}`;
    
    // --- 6. RENKLENDİRME MANTIĞI (SALDIRI VE DEFANS) ---
    // Saldırı (Atak) Renklendirme
    if (effective.atk > naturalAtk) {
        statAtk.innerHTML = `<span style="color:#43FF64">${effective.atk}</span>`; // Yeşil (Buff)
    } else if (effective.atk < naturalAtk) {
        statAtk.innerHTML = `<span style="color:#ff4d4d">${effective.atk}</span>`; // Kırmızı (Debuff)
    } else {
        statAtk.textContent = effective.atk; // Normal
    }

    // Defans Renklendirme
    if (effective.def > naturalDef) {
        statDef.innerHTML = `<span style="color:#43FF64">${effective.def}</span>`;
    } else if (effective.def < naturalDef) {
        statDef.innerHTML = `<span style="color:#ff4d4d">${effective.def}</span>`;
    } else {
        statDef.textContent = effective.def;
    }
    // ------------------------------------------------

    // 7. Ana Statlar
    statStr.textContent = hero.str; 
    statDex.textContent = hero.dex; 
    statInt.textContent = hero.int; 
    statVit.textContent = hero.vit;
    statMp.textContent = hero.mp_pow;
	
    // 8. Dirençler
    const resTypes = ['physical', 'fire', 'cold', 'lightning', 'poison', 'curse'];
    resTypes.forEach(type => {
        const el = document.getElementById(`res-${type}`);
        if (el) el.textContent = hero.baseResistances[type] || 0;
    });

    // 9. Puan Dağıtma ve Savaş Kontrolü
    const pointsBox = document.getElementById('points-container');
    const pointsDisplay = document.getElementById('stat-points-display');
    const plusButtons = document.querySelectorAll('.btn-stat-plus');
    const isInBattle = battleScreen.classList.contains('active');

    document.getElementById('stat-battle-warning')?.remove();

    if (isInBattle) {
        if (pointsBox) pointsBox.classList.add('hidden');
        plusButtons.forEach(btn => btn.classList.add('hidden'));
        const warning = document.createElement('div');
        warning.id = 'stat-battle-warning';
        warning.style.cssText = "color:orange; text-align:center; margin-top:15px; font-weight:bold;";
        warning.textContent = "⚠️ SAVAŞ ESNASINDA STAT VERİLEMEZ";
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
};

// --- ENVANTER ---
window.toggleInventory = function() {
    if (!isCharacterUIAllowed()) return;
    inventoryScreen.classList.toggle('hidden');
    if (!inventoryScreen.classList.contains('hidden')) renderInventory();
};

window.renderInventory = function() {
    document.getElementById('inv-gold-text').textContent = hero.gold;
    const broochContainer = document.querySelector('.brooch-overlay');
    if (broochContainer) {
        broochContainer.innerHTML = ''; 
        hero.brooches.forEach(item => {
            const slot = document.createElement('div'); slot.className = 'item-slot brooch-slot';
            if (item) slot.innerHTML = `<img src="images/${item.icon}" title="${item.name}">`; broochContainer.appendChild(slot);
        });
    }
    for (const [slotName, item] of Object.entries(hero.equipment)) {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotName}"]`);
        if (slotEl) slotEl.innerHTML = item ? `<img src="images/${item.icon}" title="${item.name}">` : '';
    }
    const bagGrid = document.querySelector('.bag-grid');
    if (bagGrid) {
        bagGrid.innerHTML = '';
        hero.inventory.forEach((item, index) => {
            const slot = document.createElement('div'); slot.className = 'item-slot bag-slot';
            if (item) { slot.innerHTML = `<img src="images/${item.icon}" title="${item.name}">`; slot.onclick = () => equipItem(index); }
            bagGrid.appendChild(slot);
        });
    }
};

window.equipItem = function(inventoryIndex) {
    const item = hero.inventory[inventoryIndex]; if (!item) return;
    let targetSlot = null;
    if (item.type === 'earring') targetSlot = !hero.equipment.earring1 ? 'earring1' : (!hero.equipment.earring2 ? 'earring2' : 'earring1');
    else if (item.type === 'ring') targetSlot = !hero.equipment.ring1 ? 'ring1' : (!hero.equipment.ring2 ? 'ring2' : 'ring1');
    else targetSlot = item.type;
    if (targetSlot) { const old = hero.equipment[targetSlot]; hero.equipment[targetSlot] = item; hero.inventory[inventoryIndex] = old; renderInventory(); updateStats(); writeLog(`🎒 ${item.name} kuşandın.`); }
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

    const skills = Object.entries(SKILL_DATABASE)
        .filter(([_, s]) => s.data.category === currentTab)
        .sort((a, b) => a[1].data.tier - b[1].data.tier);

    skills.forEach(([key, skill]) => {
        const isLearned = hero.unlockedSkills.includes(key);
        if (skill.data.category === 'common' && skill.data.tier === 1 && !isLearned) return;

        const canAfford = hero.skillPoints >= skill.data.tier;
        const treeMet = checkSkillTreeRequirement(skill.data.category, skill.data.tier);
        const item = document.createElement('div');
        item.className = `skill-book-item ${isLearned ? '' : 'locked'}`;
		
		// --- COOLDOWN YAZISI (YENİ) ---
        let cdHtml = skill.data.cooldown > 0 ? `<br><span style="color:#ffd700; font-size:0.85em;">⌛ Bekleme: ${skill.data.cooldown} Tur</span>` : '';
		let cdHtml1 = skill.data.cooldown < 1 ? `<br><span style="color:#ffd700; font-size:0.85em;">Aynı tur tekrar kullanılamaz.</span>` : '';
        
        let action = isLearned ? '<small style="color:#43FF64; font-weight:bold;">✓ ÖĞRENİLDİ</small>' : 
                     (isInBattle ? '<small style="color:orange; font-weight:bold;">⚠️ SAVAŞTA ÖĞRENİLEMEZ</small>' : 
                     (canAfford && treeMet ? `<button class="btn-learn-skill" onclick="learnSkill('${key}')">+</button>` : `<small style="color:#777;">Puan/Tier Eksik</small>`));

        item.innerHTML = `
            <div style="position:relative;">
                <img src="images/${skill.data.icon}" class="skill-book-icon">
                <span class="tier-badge">T${skill.data.tier}</span>
            </div>
            <div class="skill-info" style="flex-grow:1;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h4 style="color:#f0e68c !important;">${skill.data.name}</h4>${action}
                </div>
                <p>${skill.data.menuDescription}${cdHtml}${cdHtml1}</p>
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
    for (let i = 0; i < hero.equippedSkills.length; i++) {
        const slot = document.createElement('div'); slot.className = 'menu-slot' + (i < 2 ? ' basic-menu-slot' : '');
        slot.innerHTML = `<span class="key-hint">${(i === 0) ? 'A' : (i === 1) ? 'D' : (i - 1)}</span>`;
        slot.addEventListener('dragover', e => e.preventDefault());
        slot.addEventListener('drop', e => {
            e.preventDefault(); const raw = e.dataTransfer.getData('text/plain');
            try { 
                const data = JSON.parse(raw); 
                if (data.type === 'move_skill') { 
                    const temp = hero.equippedSkills[i]; hero.equippedSkills[i] = hero.equippedSkills[data.index]; hero.equippedSkills[data.index] = temp; 
                } 
            }
            catch(err) { if (SKILL_DATABASE[raw] && hero.unlockedSkills.includes(raw)) hero.equippedSkills[i] = raw; }
            renderEquippedSlotsInBook(); if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
        });
        const key = hero.equippedSkills[i];
        if (key && SKILL_DATABASE[key]) { 
            slot.innerHTML += `<img src="images/${SKILL_DATABASE[key].data.icon}" title="${SKILL_DATABASE[key].data.name}">`;
            slot.setAttribute('draggable', true); slot.addEventListener('dragstart', e => e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'move_skill', index: i })));
            slot.oncontextmenu = e => { e.preventDefault(); hero.equippedSkills[i] = null; renderEquippedSlotsInBook(); if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); };
        }
        skillBookEquippedBar.appendChild(slot);
    }
};

// --- SEÇİM EKRANLARI ---
window.openBasicSkillSelection = function() { switchScreen(basicSkillSelectionScreen); selectedAttackKey = null; selectedDefenseKey = null; renderBasicSkillSelection(); updateSelectionUI(); };
window.renderBasicSkillSelection = function() {
    const atkC = document.getElementById('selection-list-attack'); const defC = document.getElementById('selection-list-defense'); atkC.innerHTML = ''; defC.innerHTML = '';
    for (const [key, skill] of Object.entries(SKILL_DATABASE)) {
        if (skill.data.category === 'common' && skill.data.tier === 1) {
            const card = document.createElement('div'); card.className = 'selection-card'; card.innerHTML = `<img src="images/${skill.data.icon}"><div><h4>${skill.data.name}</h4><small>${skill.data.menuDescription}</small></div>`;
            card.onclick = () => {
                if (skill.data.type === 'attack') { selectedAttackKey = key; document.querySelectorAll('#selection-list-attack .selection-card').forEach(c => c.classList.remove('selected')); }
                else { selectedDefenseKey = key; document.querySelectorAll('#selection-list-defense .selection-card').forEach(c => c.classList.remove('selected')); }
                card.classList.add('selected'); updateSelectionUI();
            };
            (skill.data.type === 'attack' ? atkC : defC).appendChild(card);
        }
    }
};
window.updateSelectionUI = function() { btnConfirmBasicSkills.disabled = !(selectedAttackKey && selectedDefenseKey); btnConfirmBasicSkills.textContent = btnConfirmBasicSkills.disabled ? "Yetenekleri Seç" : "MACERAYA BAŞLA"; };
window.confirmBasicSkills = function() { if (!selectedAttackKey || !selectedDefenseKey) return; hero.unlockedSkills.push(selectedAttackKey, selectedDefenseKey); hero.equippedSkills[0] = selectedAttackKey; hero.equippedSkills[1] = selectedDefenseKey; if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); switchScreen(mapScreen); writeLog("Savaş tarzı belirlendi."); };