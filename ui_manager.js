// ui_manager.js - TAM VE HATASIZ SÜRÜM

// --- EKRAN YÖNETİMİ ---
function switchScreen(targetScreen) {
    const screens = [startScreen, cutsceneScreen, mapScreen, battleScreen, gameOverScreen, campfireScreen, eventScreen, rewardScreen, townScreen, basicSkillSelectionScreen];
    
    const topBar = document.getElementById('top-info-bar');
    const mainArea = document.getElementById('main-screen-area');

    if (targetScreen === startScreen || targetScreen === cutsceneScreen || targetScreen === gameOverScreen) {
        if(topBar) topBar.classList.add('hidden');
        if(mainArea) { mainArea.style.top = "0"; mainArea.style.height = "100%"; }
    } else {
        if(topBar) topBar.classList.remove('hidden');
        if(mainArea) { mainArea.style.top = "40px"; mainArea.style.height = "calc(100% - 40px)"; }
        updateGoldUI();
    }

    screens.forEach(screen => {
        if (screen) { 
            if (screen === targetScreen) { 
                screen.classList.remove('hidden'); 
                screen.classList.add('active'); 
            } else { 
                screen.classList.remove('active'); 
                screen.classList.add('hidden'); 
            }
        }
    });

    if (skillBookScreen && !skillBookScreen.classList.contains('hidden')) skillBookScreen.classList.add('hidden');
    if (statScreen && !statScreen.classList.contains('hidden')) statScreen.classList.add('hidden');
    if (inventoryScreen && !inventoryScreen.classList.contains('hidden')) inventoryScreen.classList.add('hidden');

    // Harita ekranı açılınca çizgileri çiz
    if (targetScreen === mapScreen) {
        setTimeout(() => {
            if (typeof drawAllConnections === 'function') drawAllConnections();
            if (typeof GAME_MAP !== 'undefined' && GAME_MAP.currentNodeId !== null) {
                 movePlayerMarkerToNode(GAME_MAP.currentNodeId, true);
            }
        }, 100);
    }
}

function writeLog(message) { console.log("[Oyun]: " + message.replace(/<[^>]*>?/gm, '')); }

// --- UI GÜNCELLEMELERİ ---
function updateGoldUI() {
    const invGoldText = document.getElementById('inv-gold-text');
    if(invGoldText) invGoldText.textContent = hero.gold;
    const topName = document.getElementById('top-hero-name');
    const topLevel = document.getElementById('top-hero-level');
    if(topName) topName.textContent = hero.playerName;
    if(topLevel) topLevel.textContent = `(Lv.${hero.level})`;
}

function updateStatusIcons() {
    if (!heroStatusContainer) return;
    heroStatusContainer.innerHTML = ''; 
    hero.statusEffects.forEach(effect => {
        const icon = document.createElement('div'); icon.className = 'status-icon';
        if (effect.id === 'atk_up') { icon.innerHTML = '⚔️'; icon.classList.add('status-buff'); }
        else if (effect.id === 'block_skill') { icon.innerHTML = '🚫'; icon.classList.add('status-debuff'); }
        else if (effect.id === 'block_type') { icon.innerHTML = '⛔'; icon.classList.add('status-debuff'); }
        else if (effect.id === 'insta_kill') { icon.innerHTML = '☠️'; icon.classList.add('status-buff'); }
        else if (effect.id === 'def_up') { icon.innerHTML = '🛡️'; icon.classList.add('status-buff'); }
        else if (effect.id === 'atk_half') { icon.innerHTML = '👎'; icon.classList.add('status-debuff'); }
        else if (effect.id === 'regen') { icon.innerHTML = '💖'; icon.classList.add('status-buff'); }
        else if (effect.id === 'stun') { icon.innerHTML = '💫'; icon.classList.add('status-debuff'); icon.style.borderColor='yellow'; icon.style.color='yellow';}
        else if (effect.id === 'str_up') { icon.innerHTML = '💪'; icon.classList.add('status-buff'); }
		else if (effect.id === 'atk_up_percent') { icon.innerHTML = '🗡️'; icon.classList.add('status-buff'); }
        else if (effect.id === 'curse_damage') { icon.innerHTML = '💀'; icon.classList.add('status-debuff'); } // Debuff rengi
        else if (effect.id === 'ignore_def') { icon.innerHTML = '🔨'; icon.classList.add('status-buff'); }
        else if (effect.id === 'guard_active') { icon.innerHTML = '🛡️'; icon.classList.add('status-buff'); }
        else if (effect.id.startsWith('debuff_')) { icon.innerHTML = '🔻'; icon.classList.add('status-debuff'); }
		
        
        if (effect.waitForCombat) { 
            icon.style.filter = "grayscale(100%) opacity(0.7)"; 
            icon.title = `${effect.name} (Savaşta Başlayacak)`; 
        } else { 
            icon.title = `${effect.name} (${effect.turns} Tur)`; 
        }
        heroStatusContainer.appendChild(icon);
    });

    hero.mapEffects.forEach(effect => {
        const icon = document.createElement('div'); icon.className = 'status-icon';
        icon.style.borderColor = '#00ccff'; icon.style.color = '#00ccff'; 
        if (effect.id === 'map_atk_weak') { icon.innerHTML = '😓'; }
        else if (effect.id === 'map_hp_boost') { icon.innerHTML = '💉'; }
        icon.title = `${effect.name} (${effect.nodesLeft + 1} Oda Kaldı)`;
        heroStatusContainer.appendChild(icon);
    });
}

function updateStats() {
    const heroHpPercent = (hero.hp / hero.maxHp) * 100;
    heroHpBar.style.width = heroHpPercent + '%'; heroHpText.textContent = `${hero.hp} / ${hero.maxHp}`;
    const heroRagePercent = (hero.rage / hero.maxRage) * 100;
    heroRageBar.style.width = heroRagePercent + '%'; heroRageText.textContent = `${hero.rage} / ${hero.maxRage}`;
    heroNameDisplay.innerHTML = `${hero.name} <span style="color:#f0e68c; font-size:0.8em; margin-left:5px;">| ${hero.level}</span>`;
    
    if (monster) {
        const monsterHpPercent = (monster.hp / monster.maxHp) * 100;
        monsterHpBar.style.width = monsterHpPercent + '%'; 
        monsterHpText.textContent = `${monster.hp} / ${monster.maxHp}`;
        monsterNameDisplay.textContent = `${monster.name}`;
    }
    
    // Blok Göstergesi
    const blockDisplay = document.getElementById('hero-block-indicator');
    const blockText = document.getElementById('hero-block-text');
    const currentBlock = (typeof heroBlock !== 'undefined') ? heroBlock : 0;

    if (blockDisplay && blockText) {
        if (currentBlock > 0) {
            blockDisplay.classList.remove('hidden');
            blockText.textContent = currentBlock;
        } else {
            blockDisplay.classList.add('hidden');
        }
    }

    updateStatusIcons(); updateGoldUI();
    if (!statScreen.classList.contains('hidden')) updateStatScreen();
}

// --- EFEKTLER ---
function showFloatingText(targetContainer, amount, type) {
    const textEl = document.createElement('div');
    const content = (typeof amount === 'number' && amount > 0 && type === 'heal') ? `+${amount}` : amount;
    textEl.textContent = content;
    
    textEl.classList.add('floating-text');
    if (type === 'damage') textEl.classList.add('damage-text'); else textEl.classList.add('heal-text');
    targetContainer.appendChild(textEl);
    setTimeout(() => { if (targetContainer.contains(textEl)) targetContainer.removeChild(textEl); }, 1500);
}

function animateHealingParticles() {
    const container = heroDisplayContainer; 
    for (let i = 0; i < 15; i++) { 
        const particle = document.createElement('div'); particle.classList.add('healing-particle');
        const startX = Math.random() * 60 + 20; const startY = Math.random() * 60 + 20;
        const moveX = (Math.random() * 160 - 80) + 'px';
        particle.style.setProperty('--move-x', moveX);
        const zIndex = Math.random() > 0.5 ? 20 : 0; 
        const duration = (Math.random() * 1 + 1) + 's'; const delay = (Math.random() * 0.3) + 's'; const size = (Math.random() * 20 + 5) + 'px';
        particle.style.left = startX + '%'; particle.style.top = startY + '%'; particle.style.zIndex = zIndex;
        particle.style.width = size; particle.style.height = size; particle.style.animationDuration = duration; particle.style.animationDelay = delay;
        container.appendChild(particle);
        setTimeout(() => { if (container.contains(particle)) container.removeChild(particle); }, 2500);
    }
}

function animateDamage(isHero) {
    const display = isHero ? heroDisplayImg : monsterDisplayImg;
    display.style.transition = 'transform 0.1s ease-out, filter 0.1s ease-out'; 
    display.style.transform = 'translateX(-50%) translateY(-10px) scale(1.05)';
    display.style.filter = 'brightness(1.5) drop-shadow(0 0 10px red)';
    setTimeout(() => {
        display.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        display.style.filter = 'none';
        setTimeout(() => { display.style.transition = 'none'; }, 0); 
    }, 150); 
}

function showMonsterIntention(action) {
    if (!monsterIntentionOverlay) return;
    monsterIntentionOverlay.classList.remove('attack', 'defend');
    if (action === 'attack') { monsterIntentionOverlay.innerHTML = '<i class="fas fa-dagger"></i>'; monsterIntentionOverlay.classList.add('attack', 'active'); } 
    else if (action === 'defend') { monsterIntentionOverlay.innerHTML = '<i class="fas fa-shield-alt"></i>'; monsterIntentionOverlay.classList.add('defend', 'active'); }
}

function triggerDeathEffect() { if (fadeOverlay) fadeOverlay.classList.add('active-fade'); }
function resetDeathEffect() { if (fadeOverlay) fadeOverlay.classList.remove('active-fade'); }

// --- ÖDÜL EKRANI ---
function openRewardScreen(rewards) {
    switchScreen(rewardScreen);
    const list = document.getElementById('reward-list');
    const btnContinue = document.getElementById('btn-reward-continue');
    list.innerHTML = '';
    btnContinue.classList.remove('active'); 
    let itemsLeft = rewards.length;
    rewards.forEach(reward => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'reward-item';
        let iconHtml = ''; let text = '';
        if (reward.type === 'gold') { iconHtml = '<i class="fas fa-coins"></i>'; text = `${reward.value} Altın`; }
        itemDiv.innerHTML = `${iconHtml}<span>${text}</span>`;
        itemDiv.onclick = () => {
            if (reward.type === 'gold') { hero.gold += reward.value; updateGoldUI(); }
            itemDiv.style.opacity = '0';
            setTimeout(() => itemDiv.remove(), 200);
            itemsLeft--;
        };
        list.appendChild(itemDiv);
    });
    btnContinue.classList.add('active');
    btnContinue.onclick = () => { switchScreen(mapScreen); };
}

// --- SKILL BOOK ---
let currentTab = 'common'; 

function toggleSkillBook() {
    if (skillBookScreen.classList.contains('hidden')) {
        skillBookScreen.classList.remove('hidden');
        renderSkillBookList(); 
        renderEquippedSlotsInBook();
        const spDisplay = document.getElementById('skill-points-display');
        if(spDisplay) spDisplay.textContent = hero.skillPoints;
    } else {
        skillBookScreen.classList.add('hidden');
    }
}

function setSkillTab(tab) {
    currentTab = tab;
    const btnCommon = document.getElementById('tab-common');
    const btnBrutal = document.getElementById('tab-brutal');
    const btnChaos = document.getElementById('tab-chaos');
    const btnFervor = document.getElementById('tab-fervor');

    if(btnCommon) btnCommon.classList.remove('active');
    if(btnBrutal) btnBrutal.classList.remove('active');
    if(btnChaos) btnChaos.classList.remove('active');
    if(btnFervor) btnFervor.classList.remove('active');

    if (tab === 'common' && btnCommon) btnCommon.classList.add('active');
    if (tab === 'brutal' && btnBrutal) btnBrutal.classList.add('active');
    if (tab === 'chaos' && btnChaos) btnChaos.classList.add('active');
    if (tab === 'fervor' && btnFervor) btnFervor.classList.add('active');
    
    renderSkillBookList();
}

function renderSkillBookList() {
    if (!skillBookList) return;
    skillBookList.innerHTML = '';
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');

    const sortedSkills = Object.entries(SKILL_DATABASE)
        .filter(([key, skill]) => skill.data.category === currentTab) 
        .sort((a, b) => a[1].data.tier - b[1].data.tier);

    for (const [key, skill] of sortedSkills) {
        
        const isLearned = hero.unlockedSkills.includes(key);
        
        if (skill.data.category === 'common' && skill.data.tier === 1 && !isLearned) {
            continue; 
        }

        const canAfford = hero.skillPoints >= (skill.data.tier || 1);
        const levelMet = hero.level >= (skill.data.levelReq || 1);
        
        const treeMet = (typeof checkSkillTreeRequirement === 'function') 
                        ? checkSkillTreeRequirement(skill.data.category, skill.data.tier) 
                        : true; 

        let actionHtml = '';
        const item = document.createElement('div');
        item.classList.add('skill-book-item');
        
        // Pasif Yetenek Kontrolü
        if (skill.data.type === 'passive') {
            item.style.borderStyle = isLearned ? "solid" : "dashed";
        }

        if (isLearned) {
            // Pasifler sürüklenemez
            const isPassive = (skill.data.type === 'passive');
            item.setAttribute('draggable', !isPassive);
            if (!isPassive) {
                item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', key); });
            }
            item.style.borderColor = "#43FF64"; 
        } else {
            item.classList.add('locked');
            item.setAttribute('draggable', false);
            
            if (!treeMet) actionHtml = `<small style="color:#aaa;">Önce Tier ${skill.data.tier - 1} Aç</small>`;
            else if (!levelMet) actionHtml = `<small style="color:#ff4d4d;">Gereken: Lv.${skill.data.levelReq}</small>`;
            else if (!canAfford) actionHtml = `<small style="color:#aaa;">Puan Yetmiyor (${skill.data.tier})</small>`;
            else {
                if (!isInBattle) actionHtml = `<button class="btn-learn-skill" onclick="learnSkill('${key}')">+</button> <small style="color:#43FF64;">${skill.data.tier} Puan</small>`;
                else actionHtml = `<small style="color:orange;">Savaşta Öğrenilemez</small>`;
            }
        }

        item.innerHTML = `
            <div style="position:relative;">
                <img src="images/${skill.data.icon}" class="skill-book-icon">
                <span class="tier-badge">T${skill.data.tier || 1}</span>
            </div>
            <div class="skill-info" style="flex-grow:1;">
                <div style="display:flex; justify-content:space-between;">
                    <h4>${skill.data.name}</h4>
                    ${!isLearned && canAfford && levelMet && !isInBattle && treeMet ? actionHtml : (!isLearned ? actionHtml : '')}
                </div>
                <p>${skill.data.menuDescription}</p>
                ${isLearned ? '<small style="color:#43FF64;">Öğrenildi</small>' : ''}
            </div>`;
        
        const btn = item.querySelector('.btn-learn-skill');
        if(btn) { btn.addEventListener('click', (e) => { e.stopPropagation(); }); }
        
        skillBookList.appendChild(item);
    }
}

// --- KUŞANILAN SLOTLAR (DİNAMİK) ---
function renderEquippedSlotsInBook() {
    if (!skillBookEquippedBar) return;
    skillBookEquippedBar.innerHTML = '';
    
    // YENİ: Toplam slot sayısı dinamik (2 Basic + X Normal)
    const totalSlots = 2 + hero.equippedSkills.length;
    
    for (let i = 0; i < totalSlots; i++) {
        const slot = document.createElement('div'); 
        slot.classList.add('menu-slot');
        
        if (i < 2) slot.classList.add('basic-menu-slot');

        const keyHint = document.createElement('span'); 
        keyHint.classList.add('key-hint'); 
        if (i === 0) keyHint.textContent = 'A';
        else if (i === 1) keyHint.textContent = 'D';
        else keyHint.textContent = (i - 1); 
        slot.appendChild(keyHint);

        // Drag & Drop
        slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => { slot.classList.remove('drag-over'); });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault(); 
            slot.classList.remove('drag-over');
            
            const rawData = e.dataTransfer.getData('text/plain');
            
            try {
                // A) SWAP
                const data = JSON.parse(rawData);
                if (data.type === 'move_skill') {
                    const fromIndex = data.index;
                    if (fromIndex === i) return;

                    const temp = hero.equippedSkills[i];
                    hero.equippedSkills[i] = hero.equippedSkills[fromIndex];
                    hero.equippedSkills[fromIndex] = temp;

                    renderEquippedSlotsInBook();
                    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
                    return;
                }
            } catch(e) {} 

            // B) KİTAPTAN EKLE
            const skillKey = rawData;
            const isValidSkill = SKILL_DATABASE[skillKey] || (BASIC_SKILL_DATABASE[hero.class] && BASIC_SKILL_DATABASE[hero.class][skillKey]);
            const isUnlocked = hero.unlockedSkills.includes(skillKey) || (BASIC_SKILL_DATABASE[hero.class] && BASIC_SKILL_DATABASE[hero.class][skillKey]);

            if (skillKey && isValidSkill && isUnlocked) { 
                hero.equippedSkills[i] = skillKey; 
                renderEquippedSlotsInBook(); 
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); 
            }
        });

        // Slot İçeriği
        const currentSkillKey = hero.equippedSkills[i];
        let skill = null;
        
        if (currentSkillKey) {
             if (SKILL_DATABASE[currentSkillKey]) {
                skill = SKILL_DATABASE[currentSkillKey];
            } else if (BASIC_SKILL_DATABASE[hero.class] && BASIC_SKILL_DATABASE[hero.class][currentSkillKey]) {
                skill = BASIC_SKILL_DATABASE[hero.class][currentSkillKey];
            }
        }

        if (skill) { 
            const img = document.createElement('img'); 
            img.src = `images/${skill.data ? skill.data.icon : skill.icon}`; 
            slot.appendChild(img);
            
            slot.setAttribute('draggable', true);
            slot.addEventListener('dragstart', (e) => {
                const dragData = { type: 'move_skill', index: i, skillKey: currentSkillKey };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            });

            slot.oncontextmenu = (e) => { 
                e.preventDefault(); 
                hero.equippedSkills[i] = null; 
                renderEquippedSlotsInBook(); 
                if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); 
            };
            slot.title = skill.data ? skill.data.name : skill.name;
        } else {
             slot.setAttribute('draggable', false);
        }
        
        skillBookEquippedBar.appendChild(slot);
    }
}

// --- STAT EKRANI ---
function toggleStatScreen() {
    if (statScreen.classList.contains('hidden')) { updateStatScreen(); statScreen.classList.remove('hidden'); } else { statScreen.classList.add('hidden'); }
}

function updateStatScreen() {
    if (!statName) return;
    
    // 1. Şu anki güncel (Bufflı/Debufflı) değerleri al
    let effective = { atk: hero.attack, def: hero.defense };
    if (typeof getHeroEffectiveStats === 'function') effective = getHeroEffectiveStats();

    statName.textContent = hero.playerName; 
    statClass.textContent = `(${hero.name})`; 
    statLevel.textContent = `Lv. ${hero.level}`;
    statXp.textContent = `${hero.xp} / ${hero.xpToNextLevel}`; 
    statHp.textContent = `${hero.hp} / ${hero.maxHp}`;
    
    // --- RENK MANTIĞI DÜZELTMESİ ---
    
    // "Doğal" Atak Gücünü Hesapla (Base + STR Bonusu)
    // Bufflar (Sharpen vb.) hariç, karakterin kendi gücü.
    // game_data.js'deki CLASS_CONFIG'i kullanıyoruz.
    let naturalAtk = hero.attack; // Base (20)
    
    // Eğer class config varsa STR bonusunu doğal atağa ekle
    if (typeof CLASS_CONFIG !== 'undefined' && CLASS_CONFIG[hero.class]) {
        const rules = CLASS_CONFIG[hero.class];
        let statVal = 0;
        if(rules.primaryStat === 'str') statVal = hero.str;
        else if(rules.primaryStat === 'dex') statVal = hero.dex;
        else if(rules.primaryStat === 'int') statVal = hero.int;
        
        // Atak = Base + (Stat * Çarpan)
        naturalAtk += Math.floor(statVal * rules.atkPerStat);
    }
    
    // Karşılaştırma: Efektif vs Doğal
    if (effective.atk > naturalAtk) statAtk.innerHTML = `<span style="color:#43FF64">${effective.atk}</span>`; // Buff (Yeşil)
    else if (effective.atk < naturalAtk) statAtk.innerHTML = `<span style="color:#ff4d4d">${effective.atk}</span>`; // Debuff (Kırmızı)
    else statAtk.textContent = effective.atk; // Normal (Beyaz)

    // Defans için de benzer mantık (Basitçe base defans)
    if (effective.def > hero.defense) statDef.innerHTML = `<span style="color:#43FF64">${effective.def}</span>`;
    else statDef.textContent = effective.def;
    
    // Diğer statları yazdır
    statStr.textContent = hero.str; 
    statDex.textContent = hero.dex; 
    statInt.textContent = hero.int; 
    statMp.textContent = hero.mp_pow;
    const statVit = document.getElementById('stat-vit'); 
    if(statVit) statVit.textContent = hero.vit;

    // Puan kutusu kontrolü
    const pointsBox = document.getElementById('points-container');
    const pointsDisplay = document.getElementById('stat-points-display');
    const plusButtons = document.querySelectorAll('.btn-stat-plus');
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');

    if (hero.statPoints > 0 && !isInBattle) {
        if(pointsBox) pointsBox.classList.remove('hidden');
        if(pointsDisplay) pointsDisplay.textContent = hero.statPoints;
        plusButtons.forEach(btn => btn.classList.remove('hidden'));
    } else {
        if(pointsBox) pointsBox.classList.add('hidden');
        plusButtons.forEach(btn => btn.classList.add('hidden'));
    }
}

// --- ENVANTER ---
function toggleInventory() {
    if (inventoryScreen.classList.contains('hidden')) {
        inventoryScreen.classList.remove('hidden');
        renderInventory(); 
    } else {
        inventoryScreen.classList.add('hidden');
    }
}

function renderInventory() {
    document.getElementById('inv-gold-text').textContent = hero.gold;
    
    // --- Broş Render (DİNAMİK) ---
    const broochContainer = document.querySelector('.brooch-overlay');
    if (broochContainer) {
        broochContainer.innerHTML = ''; 
        
        hero.brooches.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'item-slot brooch-slot';
            slot.dataset.broochIndex = index;
            
            if (item) {
                const img = document.createElement('img');
                img.src = `images/${item.icon}`;
                slot.appendChild(img);
                slot.title = item.name;
            } else {
                slot.title = "Boş Broş Yuvası";
            }
            broochContainer.appendChild(slot);
        });
    }

    // --- Ekipman Render ---
    for (const [slotName, item] of Object.entries(hero.equipment)) {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotName}"]`);
        if (slotEl) {
            slotEl.innerHTML = ''; 
            if (item) {
                const img = document.createElement('img');
                img.src = `images/${item.icon}`;
                slotEl.appendChild(img);
                slotEl.title = item.name; 
            } 
        }
    }

    // --- Çanta Render (DİNAMİK) ---
    const bagGrid = document.querySelector('.bag-grid');
    if (bagGrid) {
        bagGrid.innerHTML = '';
        hero.inventory.forEach((item, index) => {
            const slot = document.createElement('div');
            slot.className = 'item-slot bag-slot';
            slot.dataset.index = index;
            
            if (item) {
                const img = document.createElement('img');
                img.src = `images/${item.icon}`;
                slot.appendChild(img);
                slot.title = item.name;
                slot.onclick = () => { equipItem(index); };
            }
            bagGrid.appendChild(slot);
        });
    }
}

function equipItem(inventoryIndex) {
    const item = hero.inventory[inventoryIndex];
    if (!item) return;

    let targetSlot = null;
    if (item.type === 'earring') {
        if (!hero.equipment.earring1) targetSlot = 'earring1';
        else if (!hero.equipment.earring2) targetSlot = 'earring2';
        else targetSlot = 'earring1'; 
    } else if (item.type === 'ring') {
        if (!hero.equipment.ring1) targetSlot = 'ring1';
        else if (!hero.equipment.ring2) targetSlot = 'ring2';
        else targetSlot = 'ring1';
    } else {
        targetSlot = item.type; 
    }

    if (targetSlot) {
        const oldItem = hero.equipment[targetSlot];
        hero.equipment[targetSlot] = item;
        hero.inventory[inventoryIndex] = oldItem; 
        renderInventory();
        updateStats(); 
        writeLog(`🎒 ${item.name} kuşandın.`);
    }
}

// --- BASIC SKILL SEÇİM EKRANI ---
let selectedAttackKey = null;
let selectedDefenseKey = null;

function openBasicSkillSelection() {
    switchScreen(basicSkillSelectionScreen);
    selectedAttackKey = null;
    selectedDefenseKey = null;
    renderBasicSkillSelection();
    updateSelectionUI();
}

function renderBasicSkillSelection() {
    const attackContainer = document.getElementById('selection-list-attack');
    const defenseContainer = document.getElementById('selection-list-defense');
    
    attackContainer.innerHTML = '';
    defenseContainer.innerHTML = '';

    // Sadece Common ve Tier 1 olanları filtrele
    for (const [key, skill] of Object.entries(SKILL_DATABASE)) {
        if (skill.data.category === 'common' && skill.data.tier === 1) {
            const card = document.createElement('div');
            card.className = 'selection-card';
            card.dataset.key = key; 
            
            card.innerHTML = `
                <img src="images/${skill.data.icon}">
                <div>
                    <h4 style="margin:0; color:#f0e68c;">${skill.data.name}</h4>
                    <small style="color:#aaa;">${skill.data.menuDescription}</small>
                </div>
            `;
            
            card.onclick = () => handleSkillClick(key, skill.data.type, card);

            if (skill.data.type === 'attack') {
                attackContainer.appendChild(card);
            } else {
                defenseContainer.appendChild(card);
            }
        }
    }
}

function handleSkillClick(key, type, cardElement) {
    if (type === 'attack') {
        selectedAttackKey = key;
        const allAttacks = document.querySelectorAll('#selection-list-attack .selection-card');
        allAttacks.forEach(c => c.classList.remove('selected'));
    } else {
        selectedDefenseKey = key;
        const allDefenses = document.querySelectorAll('#selection-list-defense .selection-card');
        allDefenses.forEach(c => c.classList.remove('selected'));
    }

    cardElement.classList.add('selected');
    updateSelectionUI();
}

function updateSelectionUI() {
    const confirmBtn = document.getElementById('btn-confirm-basic-skills');
    
    if (selectedAttackKey && selectedDefenseKey) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.textContent = "MACERAYA BAŞLA";
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.cursor = "not-allowed";
        
        if (!selectedAttackKey && !selectedDefenseKey) confirmBtn.textContent = "Yetenekleri Seç";
        else if (!selectedAttackKey) confirmBtn.textContent = "Saldırı Seç";
        else if (!selectedDefenseKey) confirmBtn.textContent = "Savunma Seç";
    }
}

function confirmBasicSkills() {
    // 1. Seçilenleri Aç (Unlock)
    hero.unlockedSkills.push(selectedAttackKey);
    hero.unlockedSkills.push(selectedDefenseKey);

    // 2. Slotlara Yerleştir
    hero.equippedSkills[0] = selectedAttackKey;
    hero.equippedSkills[1] = selectedDefenseKey;
    
    // 3. UI Güncelle
    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
    
    switchScreen(mapScreen);
    document.getElementById('map-display').scrollLeft = 0;
    writeLog(`Savaş tarzı belirlendi: ${SKILL_DATABASE[selectedAttackKey].data.name} ve ${SKILL_DATABASE[selectedDefenseKey].data.name}`);
}

// EVENTS
document.addEventListener('DOMContentLoaded', () => {
    if(btnConfirmBasicSkills) btnConfirmBasicSkills.addEventListener('click', confirmBasicSkills);
    if(btnCloseSkillBook) btnCloseSkillBook.addEventListener('click', toggleSkillBook);
    
    const btnCommon = document.getElementById('tab-common');
    const btnBrutal = document.getElementById('tab-brutal');
    const btnChaos = document.getElementById('tab-chaos');
    const btnFervor = document.getElementById('tab-fervor');
    const btnOpenInv = document.getElementById('btn-open-inventory');

    if(btnCommon) btnCommon.addEventListener('click', () => setSkillTab('common'));
    if(btnBrutal) btnBrutal.addEventListener('click', () => setSkillTab('brutal'));
    if(btnChaos) btnChaos.addEventListener('click', () => setSkillTab('chaos'));
    if(btnFervor) btnFervor.addEventListener('click', () => setSkillTab('fervor'));
    
    if(btnCloseStat) btnCloseStat.addEventListener('click', toggleStatScreen);
    if(btnOpenSkills) btnOpenSkills.addEventListener('click', toggleSkillBook);
    if(btnOpenStats) btnOpenStats.addEventListener('click', toggleStatScreen);
    if(btnOpenInv) btnOpenInv.addEventListener('click', toggleInventory);
});
// 1. Binayı Açma Fonksiyonu (Global Erişim İçin window. yapıyoruz)
window.openBuilding = function(type) {
    const modalId = `modal-${type}`;
    const modal = document.getElementById(modalId);
    
    if (modal) {
        modal.classList.remove('hidden');
        writeLog(`${type.toUpperCase()} binasına girdin.`);
    } else {
        console.error(`HATA: "${modalId}" ID'li pencere HTML'de bulunamadı!`);
        writeLog("Bu bina şu an kapalı (Kod hatası: HTML eksik).");
    }
};

// 2. Han Fonksiyonları (Örnek)
window.restAtInn = function() {
    const cost = 10;
    const dialogue = document.getElementById('inn-dialogue');
    
    if (hero.gold >= cost) {
        hero.gold -= cost;
        hero.hp = hero.maxHp; // Canı fulle
        hero.rage = hero.maxRage; // Rage fulle
        
        updateGoldUI();
        updateStats(); // Can barını güncelle
        
        if(dialogue) {
            dialogue.textContent = "Mışıl mışıl uyudun. Turp gibisin!";
            dialogue.style.color = "#43FF64"; // Yeşil
        }
    } else {
        if(dialogue) {
            dialogue.textContent = "Yeterli altının yok evlat...";
            dialogue.style.color = "#ff4d4d"; // Kırmızı
        }
    }
};

window.buyDrink = function() {
     const cost = 5;
     const dialogue = document.getElementById('inn-dialogue');
     
     if (hero.gold >= cost) {
         hero.gold -= cost;
         hero.rage = Math.min(hero.maxRage, hero.rage + 10);
         
         updateGoldUI();
         updateStats();
         
         if(dialogue) {
             dialogue.textContent = "Soğuk bir bira içtin. (+10 Rage)";
             dialogue.style.color = "#3498db"; // Mavi
         }
     } else {
         if(dialogue) {
             dialogue.textContent = "Paran yoksa içki de yok!";
             dialogue.style.color = "#ff4d4d";
         }
     }
}

// 3. Pencereleri Kapatma Mantığı (Event Listener)
// Sayfa yüklendiğinde bu dinleyiciyi ekle
document.addEventListener('click', (e) => {
    // Eğer tıklanan eleman 'close-npc' sınıfına sahipse (Çıkış butonu)
    if (e.target.classList.contains('close-npc')) {
        const modal = e.target.closest('.npc-modal');
        if (modal) modal.classList.add('hidden');
    }
    
    // Eğer siyah arka plana tıklandıysa da kapat
    if (e.target.classList.contains('npc-modal')) {
        e.target.classList.add('hidden');
    }
});