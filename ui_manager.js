// ui_manager.js

// --- EKRAN YÖNETİMİ ---
function switchScreen(targetScreen) {
    const screens = [startScreen, cutsceneScreen, mapScreen, battleScreen, gameOverScreen, campfireScreen, eventScreen, rewardScreen, townScreen, basicSkillSelectionScreen];

    const topBar = document.getElementById('top-info-bar');
    const mainArea = document.getElementById('main-screen-area');

    // Üst Bar ve Ana Alan Ayarları
    if (targetScreen === startScreen || targetScreen === cutsceneScreen || targetScreen === gameOverScreen) {
        if(topBar) topBar.classList.add('hidden');
        if(mainArea) { mainArea.style.top = "0"; mainArea.style.height = "100%"; }
    } else {
        if(topBar) topBar.classList.remove('hidden');
        if(mainArea) { mainArea.style.top = "40px"; mainArea.style.height = "calc(100% - 40px)"; }
        updateGoldUI();
    }

    // Ekranları Gizle/Göster
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

    // Menüleri kapat
    if (skillBookScreen && !skillBookScreen.classList.contains('hidden')) skillBookScreen.classList.add('hidden');
    if (statScreen && !statScreen.classList.contains('hidden')) statScreen.classList.add('hidden');

    // --- DÜZELTME BURADA BAŞLIYOR ---
    // Eğer Harita ekranına geçtiysek, çizgileri yeniden çizmemiz lazım.
    // Çünkü 'display: none' iken koordinatlar 0 hesaplanıyor.
    if (targetScreen === mapScreen) {
        // Küçük bir gecikme verelim ki CSS render işlemi bitsin
        setTimeout(() => {
            if (typeof drawAllConnections === 'function') {
                drawAllConnections();
            }
            // Eğer daha önce gidilen yollar varsa onları da tekrar kalıcı çiz
            if (typeof GAME_MAP !== 'undefined' && GAME_MAP.connections) {
                // Gidilen yolları bulmak için completedNodes dizisine bakabiliriz
                // Ama basitçe 'hint'leri çizmek şu an için yeterli, 
                // handleNodeClick zaten kalıcı çizgiyi ekliyor.
                
                // Kaydırma çubuğunu oyuncuya odakla
                if(typeof GAME_MAP.currentNodeId !== 'undefined' && GAME_MAP.currentNodeId !== null) {
                     movePlayerMarkerToNode(GAME_MAP.currentNodeId, true);
                }
            }
        }, 100);
    }
    // --- DÜZELTME BİTİŞİ ---
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
        
        // Tooltip metni
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
        
        // Oda sayısı bilgisi
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
        monsterHpBar.style.width = monsterHpPercent + '%'; monsterHpText.textContent = `${monster.hp} / ${monster.maxHp}`;
        monsterNameDisplay.textContent = `${monster.name}`;
    }
	// --- YENİ EKLENEN: BLOK GÖSTERGESİ GÜNCELLEME ---
    const blockDisplay = document.getElementById('hero-block-indicator');
    const blockText = document.getElementById('hero-block-text');

    // heroBlock değişkeni combat_manager.js'de tanımlı.
    // Eğer undefined ise 0 kabul et.
    const currentBlock = (typeof heroBlock !== 'undefined') ? heroBlock : 0;

    if (blockDisplay && blockText) {
        if (currentBlock > 0) {
            blockDisplay.classList.remove('hidden'); // Göster
            blockText.textContent = currentBlock;    // Değeri yaz
        } else {
            blockDisplay.classList.add('hidden');    // Gizle
        }
    }
    // ------------------------------------------------
    updateStatusIcons(); updateGoldUI();
    if (!statScreen.classList.contains('hidden')) updateStatScreen();
}

// --- EFEKTLER ---
function showFloatingText(targetContainer, amount, type) {
    const textEl = document.createElement('div');
    const sign = type === 'damage' ? '-' : type === 'heal' ? '+' : '';
    textEl.textContent = `${sign}${amount}`;
    textEl.classList.add('floating-text');
    if (type === 'damage') textEl.classList.add('damage-text'); else textEl.classList.add('heal-text');
    targetContainer.appendChild(textEl);
    setTimeout(() => { if (targetContainer.contains(textEl)) targetContainer.removeChild(textEl); }, 1500);
}
function animateHealingParticles() {
    const numberOfParticles = 150; const container = heroDisplayContainer; 
    for (let i = 0; i < numberOfParticles; i++) {
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

// --- ÖDÜL VE SKILL BOOK ---
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

let currentTab = 'common'; 
function toggleSkillBook() {
    if (skillBookScreen.classList.contains('hidden')) {
        skillBookScreen.classList.remove('hidden');
        renderSkillBookList(); renderEquippedSlotsInBook();
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
    for (const [key, skill] of Object.entries(SKILL_DATABASE)) {
        if (skill.data.category === currentTab) {
            const item = document.createElement('div');
            item.classList.add('skill-book-item');
            const isLearned = hero.unlockedSkills.includes(key);
            const canAfford = hero.skillPoints >= (skill.data.tier || 1);
            const levelMet = hero.level >= (skill.data.levelReq || 1);
            let actionHtml = '';
            
            if (isLearned) {
                item.setAttribute('draggable', true);
                item.addEventListener('dragstart', (e) => { e.dataTransfer.setData('text/plain', key); });
                item.style.borderColor = "#43FF64"; 
            } else {
                item.classList.add('locked');
                item.setAttribute('draggable', false);
                if (!levelMet) actionHtml = `<small style="color:#ff4d4d;">Gereken: Lv.${skill.data.levelReq}</small>`;
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
                        ${!isLearned && canAfford && levelMet && !isInBattle ? actionHtml : ''}
                    </div>
                    <p>${skill.data.menuDescription}</p>
                    ${isLearned ? '<small style="color:#43FF64;">Öğrenildi</small>' : (!canAfford || !levelMet || isInBattle ? actionHtml : '')}
                </div>`;
            
            const btn = item.querySelector('.btn-learn-skill');
            if(btn) { btn.addEventListener('click', (e) => { e.stopPropagation(); }); }
            skillBookList.appendChild(item);
        }
    }
}
function renderEquippedSlotsInBook() {
    if (!skillBookEquippedBar) return;
    skillBookEquippedBar.innerHTML = '';
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div'); slot.classList.add('menu-slot');
        const keyHint = document.createElement('span'); keyHint.classList.add('key-hint'); keyHint.textContent = i + 1; slot.appendChild(keyHint);
        slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => { slot.classList.remove('drag-over'); });
        slot.addEventListener('drop', (e) => {
            e.preventDefault(); slot.classList.remove('drag-over');
            const skillKey = e.dataTransfer.getData('text/plain');
            if (skillKey && SKILL_DATABASE[skillKey] && hero.unlockedSkills.includes(skillKey)) { 
                hero.equippedSkills[i] = skillKey; renderEquippedSlotsInBook(); if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); 
            }
        });
        const currentSkillKey = hero.equippedSkills[i];
        if (currentSkillKey && SKILL_DATABASE[currentSkillKey]) { 
            const img = document.createElement('img'); img.src = `images/${SKILL_DATABASE[currentSkillKey].data.icon}`; slot.appendChild(img); 
            slot.oncontextmenu = (e) => { e.preventDefault(); hero.equippedSkills[i] = null; renderEquippedSlotsInBook(); if (typeof initializeSkillButtons === 'function') initializeSkillButtons(); };
            slot.title = "Sağ tık: Çıkar";
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
    let effective = { atk: hero.attack, def: hero.defense };
    if (typeof getHeroEffectiveStats === 'function') effective = getHeroEffectiveStats();

    statName.textContent = hero.playerName; statClass.textContent = `(${hero.name})`; statLevel.textContent = `Lv. ${hero.level}`;
    statXp.textContent = `${hero.xp} / ${hero.xpToNextLevel}`; statHp.textContent = `${hero.hp} / ${hero.maxHp}`;
    
    // ATK/DEF (Renkli Gösterim)
    const baseAtk = hero.attack;
    if (effective.atk > baseAtk) statAtk.innerHTML = `<span style="color:#43FF64">${effective.atk}</span>`;
    else if (effective.atk < baseAtk) statAtk.innerHTML = `<span style="color:#ff4d4d">${effective.atk}</span>`;
    else statAtk.textContent = effective.atk;

    if (effective.def > hero.defense) statDef.innerHTML = `<span style="color:#43FF64">${effective.def}</span>`;
    else statDef.textContent = effective.def;
    
    statStr.textContent = hero.str; statDex.textContent = hero.dex; statInt.textContent = hero.int; statMp.textContent = hero.mp_pow;
    const statVit = document.getElementById('stat-vit'); if(statVit) statVit.textContent = hero.vit;

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
// Envanteri Aç/Kapa
function toggleInventory() {
    if (inventoryScreen.classList.contains('hidden')) {
        inventoryScreen.classList.remove('hidden');
        renderInventory(); // Açılırken içeriği güncelle
    } else {
        inventoryScreen.classList.add('hidden');
    }
}

// Envanter İçeriğini Çiz
function renderInventory() {
    // 1. Altın ve Karakter
    document.getElementById('inv-gold-text').textContent = hero.gold;
    // Karakter resmi zaten statik veya hero durumuna göre değişebilir

    // 2. Ekipmanlar (Sağ Taraf)
    for (const [slotName, item] of Object.entries(hero.equipment)) {
        const slotEl = document.querySelector(`.equip-slot[data-slot="${slotName}"]`);
        if (slotEl) {
            slotEl.innerHTML = ''; // Temizle
            if (item) {
                // Item varsa resmini koy
                const img = document.createElement('img');
                img.src = `images/${item.icon}`; // item.icon olmalı
                slotEl.appendChild(img);
                // Tooltip eklenebilir
                slotEl.title = item.name; 
            } else {
                slotEl.title = "Boş";
            }
        }
    }

    // 3. Çanta (Alt Taraf)
    const bagSlots = document.querySelectorAll('.bag-slot');
    bagSlots.forEach((slot, index) => {
        slot.innerHTML = ''; // Temizle
        const item = hero.inventory[index];
        
        if (item) {
            const img = document.createElement('img');
            img.src = `images/${item.icon}`;
            slot.appendChild(img);
            slot.title = item.name;
            
            // Tıklama ile giyme (Equip) mantığı eklenebilir
            slot.onclick = () => {
                equipItem(index);
            };
        } else {
            slot.onclick = null;
            slot.title = "";
        }
    });
	const broochSlots = document.querySelectorAll('.brooch-slot');
    broochSlots.forEach((slot, index) => {
        slot.innerHTML = ''; // Temizle
        const item = hero.brooches[index];
        
        if (item) {
            const img = document.createElement('img');
            img.src = `images/${item.icon}`;
            slot.appendChild(img);
            slot.title = item.name;
            
            // Broş çıkarma veya değiştirme mantığı buraya eklenebilir
            // slot.onclick = () => unequipBrooch(index);
        } else {
            slot.title = "Boş Broş Yuvası";
            slot.onclick = null;
        }
    });
}

// Basit Giyme Fonksiyonu (Logic dosyasına taşınabilir ama şimdilik burada dursun)
function equipItem(inventoryIndex) {
    const item = hero.inventory[inventoryIndex];
    if (!item) return;

    // Hangi slota gidecek? (Örn: item.type = 'ring')
    let targetSlot = null;

    if (item.type === 'earring') {
        if (!hero.equipment.earring1) targetSlot = 'earring1';
        else if (!hero.equipment.earring2) targetSlot = 'earring2';
        else targetSlot = 'earring1'; // İkisi de doluysa ilkiyle değiştir
    } else if (item.type === 'ring') {
        if (!hero.equipment.ring1) targetSlot = 'ring1';
        else if (!hero.equipment.ring2) targetSlot = 'ring2';
        else targetSlot = 'ring1';
    } else {
        // Necklace, Belt gibi tekil slotlar
        targetSlot = item.type; 
    }

    if (targetSlot) {
        // Değiş tokuş
        const oldItem = hero.equipment[targetSlot];
        hero.equipment[targetSlot] = item;
        hero.inventory[inventoryIndex] = oldItem; // Eskiyi çantaya koy (veya null)
        
        // Statları güncelle (Basitçe)
        // Burada stat hesaplama fonksiyonunu çağırmak gerekir
        renderInventory();
        updateStats(); // UI güncelle
        writeLog(`🎒 ${item.name} kuşandın.`);
    }
}

// YENİ SEÇİM MANTIĞI

// Geçici seçim değişkenleri
let selectedAttackKey = null;
let selectedDefenseKey = null;

function openBasicSkillSelection() {
    switchScreen(basicSkillSelectionScreen);
    
    // Varsayılan seçimleri sıfırla (veya hero'dakileri al)
    selectedAttackKey = null;
    selectedDefenseKey = null;
    
    renderBasicSkillSelection();
    updateSelectionUI(); // Buton durumunu kontrol et
}

function renderBasicSkillSelection() {
    const attackContainer = document.getElementById('selection-list-attack');
    const defenseContainer = document.getElementById('selection-list-defense');
    
    attackContainer.innerHTML = '';
    defenseContainer.innerHTML = '';

    const classSkills = BASIC_SKILL_DATABASE[hero.class];
    
    for (const [key, skill] of Object.entries(classSkills)) {
        const card = document.createElement('div');
        card.className = 'selection-card';
        // Hangi gruba ait olduğunu data attribute ile tutalım
        card.dataset.key = key; 
        
        card.innerHTML = `
            <img src="images/${skill.icon}">
            <div>
                <h4 style="margin:0; color:#f0e68c;">${skill.name}</h4>
                <small style="color:#aaa;">${skill.desc}</small>
            </div>
        `;
        
        // Tıklama olayını bağla
        card.onclick = () => handleSkillClick(key, skill.type, card);

        // Doğru kutuya yerleştir
        if (skill.type === 'attack') {
            attackContainer.appendChild(card);
        } else {
            defenseContainer.appendChild(card);
        }
    }
}

function handleSkillClick(key, type, cardElement) {
    // 1. Tıklanan grubun (Attack veya Defense) seçimini güncelle
    if (type === 'attack') {
        selectedAttackKey = key;
        // O sütundaki diğerlerinin 'selected' sınıfını kaldır
        const allAttacks = document.querySelectorAll('#selection-list-attack .selection-card');
        allAttacks.forEach(c => c.classList.remove('selected'));
    } else {
        selectedDefenseKey = key;
        // O sütundaki diğerlerinin 'selected' sınıfını kaldır
        const allDefenses = document.querySelectorAll('#selection-list-defense .selection-card');
        allDefenses.forEach(c => c.classList.remove('selected'));
    }

    // 2. Tıklanan karta 'selected' ekle
    cardElement.classList.add('selected');

    // 3. Butonu güncelle
    updateSelectionUI();
}

function updateSelectionUI() {
    const confirmBtn = document.getElementById('btn-confirm-basic-skills');
    
    // İkisi de seçildiyse butonu aç
    if (selectedAttackKey && selectedDefenseKey) {
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = "1";
        confirmBtn.style.cursor = "pointer";
        confirmBtn.textContent = "MACERAYA BAŞLA";
    } else {
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = "0.5";
        confirmBtn.style.cursor = "not-allowed";
        
        // Kullanıcıya neyin eksik olduğunu söyle
        if (!selectedAttackKey && !selectedDefenseKey) confirmBtn.textContent = "Yetenekleri Seç";
        else if (!selectedAttackKey) confirmBtn.textContent = "Saldırı Seç";
        else if (!selectedDefenseKey) confirmBtn.textContent = "Savunma Seç";
    }
}

// Seçim onaylanınca çalışacak
function confirmBasicSkills() {
    // Seçilenleri diziye at (Sıra önemli: [0]=Attack, [1]=Defense)
    hero.equippedBasic = [selectedAttackKey, selectedDefenseKey];
    
    // UI'daki slotları güncelle
    updateBasicSkillSlots();
    
    // Haritaya geç
    switchScreen(mapScreen);
    document.getElementById('map-display').scrollLeft = 0;
    writeLog(`Savaş tarzı belirlendi: ${BASIC_SKILL_DATABASE[hero.class][selectedAttackKey].name} ve ${BASIC_SKILL_DATABASE[hero.class][selectedDefenseKey].name}`);
}

// Savaş Ekranındaki Slotları Güncelleme (Aynı kalıyor)
function updateBasicSkillSlots() {
    const slot1 = document.getElementById('btn-basic-attack');
    const slot2 = document.getElementById('btn-basic-defend');
    const slots = [slot1, slot2];
    
    hero.equippedBasic.forEach((key, index) => {
        const skill = BASIC_SKILL_DATABASE[hero.class][key];
        const slot = slots[index];
        
        if(slot && skill) {
            const img = slot.querySelector('img');
            if(img) img.src = `images/${skill.icon}`;
            slot.title = `${skill.name}: ${skill.desc}`;
        }
    });
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