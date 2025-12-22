// combat_manager.js - GÜNCEL TAM SÜRÜM (DEFANS FIX)

const HERO_IDLE_SRC = 'images/barbarian.png'; 
const HERO_ATTACK_FRAMES = ['images/barbarian_attack1.png', 'images/barbarian_attack2.png', 'images/barbarian_attack3.png'];
const HERO_DEAD_SRC = 'images/barbarian_dead.png'; 

// Savaş Değişkenleri
let heroDefenseBonus = 0; 
let isHeroDefending = false;
let monsterDefenseBonus = 0; 
let isMonsterDefending = false; 
let monsterNextAction = 'attack'; 
let combatTurnCount = 1;
let heroBlock = 0; 

// --- YARDIMCI: Blok Ekleme ---
window.addHeroBlock = function(amount) {
    heroBlock += amount;
    const display = document.getElementById('hero-display');
    if(display) showFloatingText(display, `+${amount} Blok`, 'heal');
    updateStats(); 
};

// --- EFEKTİF STAT HESAPLAMA ---
function getHeroEffectiveStats() {
    let currentStr = hero.str;
    let currentDex = hero.dex;
    let currentInt = hero.int;
    let currentVit = hero.vit;
    let currentMp = hero.mp_pow;
    
    let atkMultiplier = 1.0;

    // 1. STAT BUFFLARI
    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'str_up') currentStr += e.value;
            if (e.id === 'dex_up') currentDex += e.value;
            if (e.id === 'int_up') currentInt += e.value;
        }
    });

    // Varsayılanlar
    let calculatedAtk = hero.baseAttack || 10;
    let calculatedDef = hero.baseDefense || 1;
    let calculatedBlock = 0;

    // 2. SINIF KURALLARINA GÖRE HESAPLA
    if (typeof CLASS_CONFIG !== 'undefined' && CLASS_CONFIG[hero.class]) {
        const rules = CLASS_CONFIG[hero.class];
        if (rules.atkStats) {
            for (const [stat, multiplier] of Object.entries(rules.atkStats)) {
                let val = (stat === 'str') ? currentStr : (stat === 'dex') ? currentDex : (stat === 'int') ? currentInt : (stat === 'mp_pow') ? currentMp : currentVit;
                calculatedAtk += Math.floor(val * multiplier);
            }
        }
        if (rules.defStats) {
            for (const [stat, multiplier] of Object.entries(rules.defStats)) {
                let val = (stat === 'str') ? currentStr : (stat === 'dex') ? currentDex : currentInt;
                calculatedDef += Math.floor(val * multiplier);
            }
        }
        if (rules.blockStats) {
            for (const [stat, multiplier] of Object.entries(rules.blockStats)) {
                let val = (stat === 'str') ? currentStr : (stat === 'dex') ? currentDex : (stat === 'int') ? currentInt : currentVit;
                calculatedBlock += Math.floor(val * multiplier);
            }
        }
    }

    // 3. DOĞRUDAN BUFFLAR VE ÇARPANLAR
    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'atk_up') calculatedAtk += e.value;
            if (e.id === 'def_up') calculatedDef += e.value;
            if (e.id === 'atk_up_percent') atkMultiplier += e.value;
            if (e.id === 'atk_half') atkMultiplier *= 0.5;
        }
    });

    hero.mapEffects.forEach(e => {
        if (e.id === 'map_atk_weak') calculatedAtk = Math.floor(calculatedAtk * e.value);
    });

    calculatedAtk = Math.floor(calculatedAtk * atkMultiplier);
    const zeroDefEffect = hero.statusEffects.find(e => e.id === 'defense_zero' && !e.waitForCombat);
    if (zeroDefEffect) calculatedDef = 0;

    return { 
        atk: Math.max(0, calculatedAtk), 
        def: Math.max(0, calculatedDef), 
        blockPower: Math.max(0, calculatedBlock),
        str: currentStr, dex: currentDex, int: currentInt, vit: currentVit, mp: currentMp,
        atkMultiplier: atkMultiplier 
    };
}

// --- HASAR MOTORU ---
function calculateSkillRawDamage(attacker, skillData) {
    const stats = getHeroEffectiveStats();
    const scaling = skillData.scaling || {};
    let atkPart = (stats.atk || 0) * (scaling.atkMult || 0);
    let statPart = 0;
    if (scaling.stats) {
        for (const [statName, multiplier] of Object.entries(scaling.stats)) {
            const statValue = stats[statName] || hero[statName] || 0;
            statPart += statValue * multiplier;
        }
    }
    let elementPart = 0;
    if (scaling.elements && hero.elementalDamage) {
        for (const [elementName, multiplier] of Object.entries(scaling.elements)) {
            elementPart += (hero.elementalDamage[elementName] || 0) * multiplier;
        }
    }
    return Math.floor(atkPart + statPart + elementPart);
}

// --- KİLİT KONTROLÜ ---
function checkIfSkillBlocked(skillKey) {
    if (SKILL_DATABASE[skillKey]) {
        const skill = SKILL_DATABASE[skillKey];
        const skillData = skill.data || skill;
        return hero.statusEffects.some(e => {
            if (e.waitForCombat) return false;
            if (e.id === 'block_skill' && e.blockedSkill === skillKey) return true;
            if (e.id === 'block_type' && e.blockedType === skillData.type) return true;
            return false;
        });
    }
    return false;
}

// --- SKILL BAR OLUŞTURMA ---
function initializeSkillButtons() {
    if (skillButtonsContainer) skillButtonsContainer.innerHTML = '';
    const slotA = document.getElementById('btn-basic-attack');
    const slotD = document.getElementById('btn-basic-defend');
    const totalSlots = hero.equippedSkills.length; 

    for (let i = 0; i < totalSlots; i++) {
        let slot = (i === 0) ? slotA : (i === 1) ? slotD : document.createElement('div');
        if (i >= 2) skillButtonsContainer.appendChild(slot);
        if (!slot) continue;

        slot.innerHTML = '';
        slot.className = 'skill-slot'; 
        if (i < 2) slot.classList.add('basic-slot'); 
        slot.dataset.slotIndex = i;
        slot.setAttribute('draggable', true);
        
        slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('drag-over'); };
        slot.ondragleave = () => { slot.classList.remove('drag-over'); };
        slot.ondrop = (e) => {
            e.preventDefault(); 
            slot.classList.remove('drag-over');
            const rawData = e.dataTransfer.getData('text/plain');
            try {
                const data = JSON.parse(rawData);
                if (data.type === 'move_skill') {
                    const fromIndex = data.index;
                    if (fromIndex === i) return;
                    const temp = hero.equippedSkills[i];
                    hero.equippedSkills[i] = hero.equippedSkills[fromIndex];
                    hero.equippedSkills[fromIndex] = temp;
                    initializeSkillButtons();
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            } catch (err) {
                const skillKey = rawData;
                if (SKILL_DATABASE[skillKey]) { 
                    hero.equippedSkills[i] = skillKey; 
                    initializeSkillButtons(); 
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            }
        };

        const skillKey = hero.equippedSkills[i];
        const keyHint = document.createElement('span'); 
        keyHint.classList.add('key-hint'); 
        keyHint.textContent = (i === 0) ? 'A' : (i === 1) ? 'D' : (i - 1); 
        slot.appendChild(keyHint);

        if (skillKey && SKILL_DATABASE[skillKey]) {
            const skillData = SKILL_DATABASE[skillKey].data || SKILL_DATABASE[skillKey];
            const iconImg = document.createElement('img'); 
            iconImg.src = `images/${skillData.icon}`; 
            slot.appendChild(iconImg);
            
            slot.ondragstart = (e) => {
                const dragData = { type: 'move_skill', index: i, skillKey: skillKey };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            };

            const overlay = document.createElement('div'); overlay.className = 'cooldown-overlay';
            const cdText = document.createElement('span'); cdText.className = 'cooldown-text';
            overlay.appendChild(cdText); slot.appendChild(overlay);

            slot.dataset.skillKey = skillKey; 
            slot.dataset.rageCost = (skillData.rageCost !== undefined) ? skillData.rageCost : 0;
            slot.onclick = () => { if (!slot.classList.contains('disabled')) handleSkillUse(skillKey); };
            const desc = skillData.desc || (skillData.menuDescription ? skillData.menuDescription.replace(/<[^>]*>?/gm, '') : '');
            slot.title = `${skillData.name}: ${desc}`;
        } else {
            slot.classList.add('empty-slot');
            slot.setAttribute('draggable', false);
        }
    }
    toggleSkillButtons(false);
}

function toggleSkillButtons(forceDisable) {
    const slots = document.querySelectorAll('.skill-slot');
    slots.forEach(slot => {
        if (!slot.dataset.skillKey) return; 
        const skillKey = slot.dataset.skillKey;
        const rageCost = parseInt(slot.dataset.rageCost) || 0;
        const overlay = slot.querySelector('.cooldown-overlay');
        const cdText = overlay ? overlay.querySelector('.cooldown-text') : null;
        const isBlocked = checkIfSkillBlocked(skillKey);
        const cooldownEffect = hero.statusEffects.find(e => e.id === 'block_skill' && e.blockedSkill === skillKey && !e.waitForCombat);
        const isStunned = hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat);

        if (isBlocked || isStunned) {
            slot.classList.add('disabled'); 
            if (overlay && cdText && cooldownEffect) {
                const percent = (cooldownEffect.turns / cooldownEffect.maxTurns) * 100;
                overlay.style.height = `${percent}%`; 
                cdText.textContent = cooldownEffect.turns > 1 ? cooldownEffect.turns - 1 : "⌛";
            } else if (overlay) { 
                overlay.style.height = '100%'; 
                if(cdText) cdText.textContent = isStunned ? "💫" : "⛔";
            }
        } else {
            if (overlay) { overlay.style.height = '0%'; if(cdText) cdText.textContent = ''; }
            if (forceDisable || hero.rage < rageCost) slot.classList.add('disabled'); 
            else slot.classList.remove('disabled'); 
        }
    });
}

// --- SKILL KULLANIMI ---
function handleSkillUse(skillKey) {
    if (!isHeroTurn) return;
    if (checkIfSkillBlocked(skillKey)) { writeLog(`❌ Bu yetenek şu an kullanılamaz!`); return; }

    const skillObj = SKILL_DATABASE[skillKey];
    if (!skillObj) return;

    const skillData = skillObj.data || skillObj;
    const cost = skillData.rageCost || 0;
    if (hero.rage < cost) { writeLog(`❌ Yetersiz Öfke!`); return; }
    
    if(cost > 0) hero.rage -= cost;
    updateStats(); 
    toggleSkillButtons(true);
    
    if (skillObj.onCast) {
        skillObj.onCast(hero, monster);
    }
}

function animateCustomAttack(rawDamage, skillFrames, skillName) {
    const attackerImgElement = heroDisplayImg;
    const targetContainer = document.getElementById('monster-display');
    
    // Wind Up Kontrolü
    const windUpIndex = hero.statusEffects.findIndex(e => e.id === 'wind_up' && !e.waitForCombat);
    if (windUpIndex !== -1) {
        rawDamage += hero.statusEffects[windUpIndex].value;
        hero.statusEffects.splice(windUpIndex, 1);
        writeLog("✨ Kurulma etkisi kullanıldı!");
    }

    let effectiveDef = monster.defense;
    if(isMonsterDefending) effectiveDef += monsterDefenseBonus;
    if(hero.statusEffects.some(e => e.id === 'ignore_def' && !e.waitForCombat)) effectiveDef = 0;

    const weakDefEffect = hero.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
    if (weakDefEffect) effectiveDef = Math.floor(effectiveDef * (1 - weakDefEffect.value));

    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));
    const curseEffect = hero.statusEffects.find(e => e.id === 'curse_damage' && !e.waitForCombat);
    if (curseEffect) finalDamage = Math.floor(finalDamage * (1 + curseEffect.value));

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < skillFrames.length) {
            attackerImgElement.src = skillFrames[frameIndex]; 
            if (frameIndex === 1 || skillFrames.length === 1) { 
                monster.hp = Math.max(0, monster.hp - finalDamage);
                
                const furyEffect = hero.statusEffects.find(e => e.id === 'fury_active' && !e.waitForCombat);
                if (furyEffect) {
                    const rageGain = Math.floor(finalDamage * furyEffect.value);
                    if (rageGain > 0) {
                        hero.rage = Math.min(hero.maxRage, hero.rage + rageGain);
                        showFloatingText(document.getElementById('hero-display'), `+${rageGain} Rage`, 'heal');
                    }
                }

                animateDamage(false); 
                showFloatingText(targetContainer, finalDamage, 'damage');
                writeLog(`${skillName}: ${finalDamage} hasar.`);
                updateStats();
                // Oyuncu vurduktan sonra canavarın defans bonusunu SIFIRLA
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

// --- MONSTER SALDIRI ---
function handleMonsterAttack(attacker, defender) {
    const attackerImgElement = monsterDisplayImg;
    const targetContainer = document.getElementById('hero-display');
    const stats = ENEMY_STATS[attacker.name];
    let attackFrames = stats.attackFrames.map(f => `images/${f}`);
    
    let rawDamage = attacker.attack;
    const weakAtkEffect = hero.statusEffects.find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
    if (weakAtkEffect) rawDamage = Math.floor(rawDamage * (1 - weakAtkEffect.value));

    const heroStats = getHeroEffectiveStats();
    let effectiveDef = heroStats.def;
    if (isHeroDefending) effectiveDef += heroDefenseBonus;

    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));
    const guardEffect = hero.statusEffects.find(e => e.id === 'guard_active');
    if (guardEffect) finalDamage = Math.floor(finalDamage * (1 - guardEffect.value));

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            attackerImgElement.src = attackFrames[frameIndex]; 
            if (frameIndex === 1 || attackFrames.length === 1) { 
                if (heroBlock > 0) {
                    if (heroBlock >= finalDamage) {
                        heroBlock -= finalDamage; finalDamage = 0;
                        showFloatingText(targetContainer, "BLOK!", 'heal');
                    } else {
                        finalDamage -= heroBlock; heroBlock = 0;
                        writeLog("Blok kırıldı!");
                    }
                }

                if (finalDamage > 0) {
                    defender.hp = Math.max(0, defender.hp - finalDamage);
                    animateDamage(true); 
                    showFloatingText(targetContainer, finalDamage, 'damage');
                    hero.rage = Math.min(hero.maxRage, hero.rage + 5);
                }
                updateStats();
                if (isHeroDefending) { isHeroDefending = false; heroDefenseBonus = 0; }
            }
            frameIndex++;
            setTimeout(showNextFrame, 150); 
        } else {
            attackerImgElement.src = `images/${stats.idle}`; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    showNextFrame();
}

// --- DÖNGÜ VE BAŞLATMA ---
function determineMonsterAction() {
    if (Math.random() < 0.70) monsterNextAction = 'attack';
    else monsterNextAction = 'defend';
}

function startBattle(enemyType) {
    const stats = ENEMY_STATS[enemyType];
    if (!stats) return;

    switchScreen(battleScreen);

    monster = { 
        name: enemyType, maxHp: stats.maxHp, hp: stats.maxHp, 
        attack: stats.attack, defense: stats.defense, xp: stats.xp, 
        tier: stats.tier, idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames 
    };

    // Gri Perde Fixi
    monsterDisplayImg.style.filter = 'none';
    monsterDisplayImg.style.opacity = '1';
    monsterDisplayImg.src = `images/${monster.idle}`;
    heroDisplayImg.src = HERO_IDLE_SRC;

    isMonsterDefending = false; monsterDefenseBonus = 0;
    isHeroDefending = false; heroDefenseBonus = 0;
    heroBlock = 0; combatTurnCount = 1; isHeroTurn = true;

    hero.statusEffects.forEach(e => { if (e.waitForCombat) e.waitForCombat = false; });

    updateStats();
    initializeSkillButtons();

    setTimeout(() => {
        determineMonsterAction(); 
        showMonsterIntention(monsterNextAction);
        writeLog(`⚔️ Savaş Başladı: ${enemyType}`);
        toggleSkillButtons(false);
    }, 50);
}

function nextTurn() {
    isHeroTurn = !isHeroTurn;
    if (checkGameOver()) return;
    
    if (isHeroTurn) {
        combatTurnCount++;
        document.getElementById('turn-count-display').textContent = combatTurnCount;
        if (heroBlock > 0) heroBlock = Math.floor(heroBlock * 0.5);

        let stunApplied = hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat);
        hero.statusEffects.filter(e => e.id === 'regen' && !e.waitForCombat).forEach(() => {
            hero.hp = Math.min(hero.maxHp, hero.hp + 10);
            showFloatingText(document.getElementById('hero-display'), 10, 'heal');
        });

        hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
        hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);

        updateStats(); 
        if (stunApplied) { 
            showFloatingText(document.getElementById('hero-display'), "SERSEMLEDİ!", 'damage');
            setTimeout(nextTurn, 1500); 
        } else {
            determineMonsterAction(); 
            showMonsterIntention(monsterNextAction);
            toggleSkillButtons(false); 
        }
    } else {
        toggleSkillButtons(true); 
        showMonsterIntention(null); 
        const monsterStunned = hero.statusEffects.find(e => e.id === 'monster_stunned' && !e.waitForCombat);
        if (monsterStunned) {
            showFloatingText(document.getElementById('monster-display'), "SERSEMLEDİ!", 'damage');
            setTimeout(nextTurn, 1000);
            return;
        }
        setTimeout(() => {
            if (!checkGameOver()) {
                if (monsterNextAction === 'attack') handleMonsterAttack(monster, hero); 
                else {
                    // --- KRİTİK DEFANS FIX BURADA ---
                    isMonsterDefending = true;
                    // Max canının %10'u ile Atağının yarısı arasında bir bonus defans belirle
                    monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2);
                    
                    showFloatingText(document.getElementById('monster-display'), "SAVUNMA!", 'heal');
                    writeLog(`${monster.name} savunma pozisyonu aldı (+${monsterDefenseBonus} Def).`);
                    setTimeout(nextTurn, 1000);
                }
            }
        }, 600);
    }
}

function checkGameOver() {
    if (hero.hp <= 0) {
        hero.hp = 0; updateStats(); heroDisplayImg.src = HERO_DEAD_SRC; 
        triggerDeathEffect();
        setTimeout(() => { switchScreen(gameOverScreen); resetDeathEffect(); }, 3000);
        return true;
    } else if (monster && monster.hp <= 0) {
        monster.hp = 0; 
        updateStats(); 
        monsterDisplayImg.src = `images/${monster.dead}`; 
        monsterDisplayImg.style.filter = 'grayscale(100%) brightness(0.5)';
        
        if (monsterIntentionOverlay) {
            monsterIntentionOverlay.classList.remove('active', 'attack', 'defend');
        }

        let heroTier = hero.level < 4 ? 1 : hero.level < 6 ? 2 : hero.level < 11 ? 3 : 4;
        let earnedXP = monster.tier > heroTier ? 4 : monster.tier === heroTier ? 3 : 1;
        
        gainXP(earnedXP);
        hero.statusEffects = hero.statusEffects.filter(e => !e.resetOnCombatEnd);
        heroBlock = 0; 
        updateStats();

        setTimeout(() => { 
            openRewardScreen([{ type: 'gold', value: Math.floor(Math.random() * 11) + 5 }]); 
            monster = null; 
        }, 1000); 
        return true;
    }
    return false;
}

function getHeroResistances() {
    let currentRes = { ...hero.baseResistances };
    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'resist_all') { for (let key in currentRes) currentRes[key] += e.value; }
            if (e.id === 'resist_fire') currentRes.fire += e.value;
        }
    });
    return currentRes;
}