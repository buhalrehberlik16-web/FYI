// combat_manager.js

const HERO_IDLE_SRC = 'images/barbarian.png'; 
const HERO_ATTACK_FRAMES = ['images/barbarian_attack1.png', 'images/barbarian_attack2.png', 'images/barbarian_attack3.png'];
const HERO_DEAD_SRC = 'images/barbarian_dead.png'; 

let heroDefenseBonus = 0; let isHeroDefending = false;
let monsterDefenseBonus = 0; let isMonsterDefending = false; let monsterNextAction = 'attack'; 

// --- YENİ: HASAR MODİFİKASYON FONKSİYONU (SKILLER İÇİN) ---
// Bu fonksiyon herhangi bir kaynaktan gelen hasarı (Skill veya Düz vuruş)
// karakterin üzerindeki buff/debufflara göre günceller.
function applyDamageModifiers(baseDamage) {
    let finalDamage = baseDamage;

    // 1. Insta-Kill Kontrolü
    const instaKill = hero.statusEffects.find(e => e.id === 'insta_kill' && !e.waitForCombat);
    if (instaKill) return 9999;

    // 2. Flat (Sabit) Artış/Azalışlar
    const atkBuff = hero.statusEffects.find(e => e.id === 'atk_up' && !e.waitForCombat);
    if (atkBuff) finalDamage += atkBuff.value;

    const atkDebuff = hero.statusEffects.find(e => e.id === 'atk_down' && !e.waitForCombat);
    if (atkDebuff) finalDamage -= atkDebuff.value;

    // 3. Yüzdelik Harita Etkileri (Map Debuffs)
    const mapAtkWeak = hero.mapEffects.find(e => e.id === 'map_atk_weak');
    if (mapAtkWeak) finalDamage = Math.floor(finalDamage * mapAtkWeak.value); // Örn: 0.6 ile çarp

    // 4. Yüzdelik Savaş Etkileri (Combat Debuffs)
    const atkHalf = hero.statusEffects.find(e => e.id === 'atk_half' && !e.waitForCombat);
    if (atkHalf) finalDamage = Math.floor(finalDamage * 0.5);

    return Math.max(1, finalDamage); // En az 1 vursun
}

// --- YARDIMCI: EFEKTİF STAT HESAPLAMA (UI İÇİN) ---
function getHeroEffectiveStats() {
    let currentAtk = hero.attack;
    let currentDef = hero.defense;

    currentAtk += Math.floor((hero.str || 0) * 0.5);

    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'atk_up') currentAtk += e.value;
            if (e.id === 'atk_down') currentAtk -= e.value;
            if (e.id === 'def_up') currentDef += e.value;
            if (e.id === 'atk_half') currentAtk = Math.floor(currentAtk * 0.5);
        }
    });

    hero.mapEffects.forEach(e => {
        if (e.id === 'map_atk_weak') currentAtk = Math.floor(currentAtk * e.value);
    });

    return { atk: Math.max(0, currentAtk), def: Math.max(0, currentDef) };
}

// --- KİLİT KONTROLÜ ---
function checkIfSkillBlocked(skillKey) {
    const skill = SKILL_DATABASE[skillKey];
    if (!skill) return false;

    return hero.statusEffects.some(e => {
        if (e.waitForCombat) return false;
        if (e.id === 'block_skill' && e.blockedSkill === skillKey) return true;
        if (e.id === 'block_type' && e.blockedType === skill.data.type) return true;
        return false;
    });
}

// === SKILL BAR OLUŞTURMA ===
function initializeSkillButtons() {
    if (!skillButtonsContainer) return;
    skillButtonsContainer.innerHTML = ''; 
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div'); slot.classList.add('skill-slot'); slot.dataset.slotIndex = i; 
        slot.addEventListener('dragover', (e) => { e.preventDefault(); slot.classList.add('drag-over'); });
        slot.addEventListener('dragleave', () => { slot.classList.remove('drag-over'); });
        slot.addEventListener('drop', (e) => {
            e.preventDefault(); slot.classList.remove('drag-over');
            const skillKey = e.dataTransfer.getData('text/plain');
            if (skillKey && SKILL_DATABASE[skillKey]) { hero.equippedSkills[i] = skillKey; initializeSkillButtons(); }
        });
        const keyHint = document.createElement('span'); keyHint.classList.add('key-hint'); keyHint.textContent = i + 1; slot.appendChild(keyHint);
        const skillKey = hero.equippedSkills[i];
        if (skillKey && SKILL_DATABASE[skillKey]) {
            const skill = SKILL_DATABASE[skillKey];
            const iconImg = document.createElement('img'); iconImg.src = `images/${skill.data.icon}`; slot.appendChild(iconImg);
            const overlay = document.createElement('div'); overlay.className = 'cooldown-overlay';
            const cdText = document.createElement('span'); cdText.className = 'cooldown-text';
            overlay.appendChild(cdText); slot.appendChild(overlay);
            slot.dataset.skillKey = skillKey; slot.dataset.rageCost = skill.data.rageCost;
            slot.addEventListener('click', () => { if (!slot.classList.contains('disabled')) handleSkillUse(skillKey); });
            const tooltip = document.createElement('div'); tooltip.classList.add('skill-tooltip');
            tooltip.innerHTML = `<span class="tooltip-title">${skill.data.name}</span><span class="tooltip-cost">Maliyet: ${skill.data.rageCost} Öfke</span><span class="tooltip-desc">${skill.data.description}</span>`;
            slot.appendChild(tooltip);
        } else { slot.classList.add('empty-slot'); }
        skillButtonsContainer.appendChild(slot);
    }
    toggleSkillButtons(false); 
}

function toggleSkillButtons(forceDisable) {
    if (!skillButtonsContainer) return;
    const slots = skillButtonsContainer.querySelectorAll('.skill-slot');
    slots.forEach(slot => {
        if (!slot.dataset.skillKey) return; 
        const skillKey = slot.dataset.skillKey;
        const rageCost = parseInt(slot.dataset.rageCost);
        const overlay = slot.querySelector('.cooldown-overlay');
        const cdText = overlay ? overlay.querySelector('.cooldown-text') : null;
        const isBlocked = checkIfSkillBlocked(skillKey);
        const cooldownEffect = hero.statusEffects.find(e => e.id === 'block_skill' && e.blockedSkill === skillKey && !e.waitForCombat);

        if (isBlocked) {
            slot.classList.add('disabled'); slot.style.borderColor = "#ff4d4d"; 
            if (overlay && cdText && cooldownEffect) {
                const max = cooldownEffect.maxTurns || 3;
                const percent = (cooldownEffect.turns / max) * 100;
                overlay.style.height = `${percent}%`; cdText.textContent = cooldownEffect.turns;
            } else if (overlay) { overlay.style.height = '100%'; if(cdText) cdText.textContent = "⛔"; }
        } else {
            if (overlay) { overlay.style.height = '0%'; if(cdText) cdText.textContent = ''; }
            if (forceDisable || hero.rage < rageCost) { slot.classList.add('disabled'); slot.style.borderColor = ""; } 
            else { slot.classList.remove('disabled'); slot.style.borderColor = ""; }
        }
    });
}

function handleSkillUse(skillKey) {
    if (!isHeroTurn) return;
    if (checkIfSkillBlocked(skillKey)) { writeLog(`❌ Bu yetenek şu an kullanılamaz!`); return; }
    const skillObj = SKILL_DATABASE[skillKey];
    if (!skillObj) return;
    if (hero.rage < skillObj.data.rageCost) { writeLog(`❌ Yetersiz Öfke!`); return; }
    hero.rage -= skillObj.data.rageCost; updateStats(); 
    attackButton.disabled = true; defendButton.disabled = true; toggleSkillButtons(true);
    skillObj.onCast(hero, monster);
}

// --- DÜZ VURUŞ HASAR HESAPLAMA ---
function calculateDamage(attacker, defender) {
    let rawDamage = attacker.attack;
    
    if (attacker === hero) {
        // Düz vuruş için temel hasar
        rawDamage += Math.floor((hero.str || 0) * 0.5);
        // Modifikatörleri uygula (Buff/Debuff)
        rawDamage = applyDamageModifiers(rawDamage);
    }

    let effectiveDefense = defender.defense;
    if (defender === hero) {
        const stats = getHeroEffectiveStats();
        effectiveDefense = stats.def;
        if (isHeroDefending) effectiveDefense += heroDefenseBonus;
    } 
    else if (defender === monster && isMonsterDefending) {
        effectiveDefense += monsterDefenseBonus;
    }

    return Math.max(1, Math.floor(rawDamage - effectiveDefense)); 
}

function determineMonsterAction() {
    if (Math.random() < 0.70) monsterNextAction = 'attack';
    else {
        monsterNextAction = 'defend';
        monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2);
    }
}

function handleAttackSequence(attacker, defender) {
    const attackerIsHero = (attacker === hero);
    const attackerImgElement = attackerIsHero ? heroDisplayImg : monsterDisplayImg;
    const defenderIsHero = (defender === hero);
    const targetContainer = defenderIsHero ? document.getElementById('hero-display') : document.getElementById('monster-display');

    let attackFrames = attackerIsHero ? HERO_ATTACK_FRAMES : ENEMY_STATS[attacker.name].attackFrames.map(f => `images/${f}`);
    const idleSrc = attackerIsHero ? HERO_IDLE_SRC : `images/${ENEMY_STATS[attacker.name].idle}`;
    
    attackButton.disabled = true; defendButton.disabled = true; toggleSkillButtons(true);

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            attackerImgElement.src = attackFrames[frameIndex]; 
            if (frameIndex === 1) { 
                const damage = calculateDamage(attacker, defender);
                defender.hp = Math.max(0, defender.hp - damage);
                animateDamage(defenderIsHero); 
                showFloatingText(targetContainer, damage, 'damage');
                writeLog(`${attacker.name} -> ${defender.name}: ${damage}`);
                if (attackerIsHero) hero.rage = Math.min(hero.maxRage, hero.rage + 15);
                updateStats();
                if (attackerIsHero && isMonsterDefending) { isMonsterDefending = false; monsterDefenseBonus = 0; }
            }
            frameIndex++;
            setTimeout(showNextFrame, 150); 
        } else {
            attackerImgElement.src = idleSrc; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    showNextFrame();
}

function animateCustomAttack(rawDamage, skillFrames, skillName) {
    const attackerImgElement = heroDisplayImg;
    const targetContainer = document.getElementById('monster-display');
    const customAttacker = { attack: rawDamage, defense: 0 };
    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < skillFrames.length) {
            attackerImgElement.src = skillFrames[frameIndex]; 
            if (frameIndex === 1) { 
                // DİKKAT: Burada calculateDamage çağırmıyoruz çünkü skill hasarı zaten hesaplanmış geliyor.
                // Sadece defans düşüyoruz.
                let finalDamage = rawDamage;
                
                // Canavarın defansını hesapla
                let monsterDef = monster.defense;
                if(isMonsterDefending) monsterDef += monsterDefenseBonus;
                
                finalDamage = Math.max(1, finalDamage - monsterDef);
                
                monster.hp = Math.max(0, monster.hp - finalDamage);
                animateDamage(false); 
                showFloatingText(targetContainer, finalDamage, 'damage');
                writeLog(`${skillName}: ${finalDamage}`);
                updateStats();
                if (isMonsterDefending) { isMonsterDefending = false; monsterDefenseBonus = 0; }
            }
            frameIndex++;
            setTimeout(showNextFrame, 150); 
        } else {
            attackerImgElement.src = HERO_IDLE_SRC; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    showNextFrame();
}

function handleHellBlade(skill) { }
function handleMinorHealing(skill) { }
function handleRestoreHealing(skill) { }

function startBattle(enemyType) {
    switchScreen(battleScreen);
    const stats = ENEMY_STATS[enemyType];
    monster = { name: enemyType, maxHp: stats.maxHp, hp: stats.maxHp, attack: stats.attack, defense: stats.defense, xp: stats.xp, idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames };
    monsterDisplayImg.src = `images/${monster.idle}`; monsterDisplayImg.style.filter = 'none'; heroDisplayImg.src = HERO_IDLE_SRC;
    isMonsterDefending = false; monsterDefenseBonus = 0; isHeroDefending = false; heroDefenseBonus = 0;
    
    let activatedCount = 0;
    hero.statusEffects.forEach(e => {
        if (e.waitForCombat) {
            e.waitForCombat = false; 
            activatedCount++;
        }
    });
    if (activatedCount > 0) writeLog(`⚔️ Savaşla birlikte ${activatedCount} etki aktifleşti!`);

    updateStats(); initializeSkillButtons(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
    
    isHeroTurn = false; 
    nextTurn();
}

function nextTurn() {
    isHeroTurn = !isHeroTurn;
    if (checkGameOver()) return;
    
    if (isHeroTurn) {
        if (isHeroDefending) { isHeroDefending = false; heroDefenseBonus = 0; }
        let stunApplied = false;
        const regens = hero.statusEffects.filter(e => e.id === 'regen' && !e.waitForCombat);
        regens.forEach(r => {
            const healAmt = Math.floor(Math.random() * (r.max - r.min + 1)) + r.min;
            const oldHp = hero.hp; hero.hp = Math.min(hero.maxHp, hero.hp + healAmt);
            const actualHeal = hero.hp - oldHp;
            if(actualHeal > 0) { showFloatingText(document.getElementById('hero-display'), actualHeal, 'heal'); writeLog(`💚 ${r.name}: +${actualHeal} HP`); }
        });
        const stunEffect = hero.statusEffects.find(e => e.id === 'stun' && !e.waitForCombat);
        if (stunEffect) {
            stunApplied = true; writeLog(`😵 **DAZZY!** Başın döndüğü için bu turu pas geçiyorsun.`);
            showFloatingText(document.getElementById('hero-display'), "DAZZY!", 'damage');
        }
        if (hero.statusEffects.length > 0) {
            hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
            const expired = hero.statusEffects.filter(e => e.turns <= 0);
            if (expired.length > 0) {
                expired.forEach(e => { if(e.id !== 'block_skill') writeLog(`Etki Bitti: ${e.name}`); });
                hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
            }
        }
        updateStats(); toggleSkillButtons(false);
        if (stunApplied) { setTimeout(() => { nextTurn(); }, 1500); return; }
        hero.rage = Math.min(hero.maxRage, hero.rage + 10); 
        updateStats(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
        attackButton.disabled = false; defendButton.disabled = false; toggleSkillButtons(false); 
        writeLog("... Senin Sıran ...");
    } else {
        attackButton.disabled = true; defendButton.disabled = true; toggleSkillButtons(true); 
        const action = monsterNextAction;
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');
        setTimeout(() => {
            if (!checkGameOver()) {
                if (action === 'attack') handleAttackSequence(monster, hero); 
                else if (action === 'defend') { isMonsterDefending = true; writeLog(`${monster.name} savunmaya geçti.`); nextTurn(); }
            }
        }, 1000); 
    }
}

function checkGameOver() {
    if (hero.hp <= 0) {
        hero.hp = 0; updateStats(); heroDisplayImg.src = HERO_DEAD_SRC; 
        triggerDeathEffect();
        setTimeout(() => { switchScreen(gameOverScreen); resetDeathEffect(); }, 3000);
        return true;
    } else if (monster && monster.hp <= 0) {
        monster.hp = 0; updateStats(); monsterDisplayImg.src = `images/${monster.dead}`; monsterDisplayImg.style.filter = 'grayscale(100%) brightness(0.5)';
        gainXP(monster.xp); 
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');
        setTimeout(() => { monster = null; switchScreen(mapScreen); updateMapScreen(); }, 1000); 
        return true;
    }
    return false;
}