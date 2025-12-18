// combat_manager.js - FİNAL HİBRİT SÜRÜM (Gri Slot ve Drag Fix)

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
    let currentDef = hero.defense;
    let currentAtk = hero.attack;
    
    // Config yoksa varsayılan
    const baseAtk = (hero.baseAttack !== undefined) ? hero.baseAttack : 10;
    const baseDef = (hero.baseDefense !== undefined) ? hero.baseDefense : 1;

    // Class Config ile Stat Etkisi
    if (typeof CLASS_CONFIG !== 'undefined' && CLASS_CONFIG[hero.class]) {
        const rules = CLASS_CONFIG[hero.class];
        currentAtk = baseAtk + Math.floor(currentStr / rules.strDivisor);
        currentDef = baseDef + Math.floor(hero.dex / rules.dexDivisor);
    } else {
        currentAtk = baseAtk;
        currentDef = baseDef;
    }

    let atkMultiplier = 1.0;

    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'str_up') currentStr += e.value;
            if (e.id === 'atk_up') currentAtk += e.value;
            if (e.id === 'atk_down') currentAtk -= e.value;
            if (e.id === 'def_up') currentDef += e.value;
            if (e.id === 'atk_half') currentAtk = Math.floor(currentAtk * 0.5);
            if (e.id === 'atk_up_percent') atkMultiplier += e.value;
        }
    });

    hero.mapEffects.forEach(e => {
        if (e.id === 'map_atk_weak') currentAtk = Math.floor(currentAtk * e.value);
    });

    currentAtk = Math.floor(currentAtk * atkMultiplier);

    return { 
        atk: Math.max(0, currentAtk), 
        def: Math.max(0, currentDef), 
        str: currentStr,
        atkMultiplier: atkMultiplier 
    };
}

// --- KİLİT KONTROLÜ ---
function checkIfSkillBlocked(skillKey) {
    if (SKILL_DATABASE[skillKey]) {
        const skill = SKILL_DATABASE[skillKey];
        const skillData = skill.data || skill; // Veri yapısı güvenliği
        
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
    
    // Toplam Slot: 6
    const totalSlots = 6; 

    for (let i = 0; i < totalSlots; i++) {
        let slot;
        
        if (i === 0) slot = slotA;
        else if (i === 1) slot = slotD;
        else {
            slot = document.createElement('div');
            skillButtonsContainer.appendChild(slot);
        }

        if (!slot) continue;

        // Temizlik ve Sınıflandırma
        slot.innerHTML = '';
        slot.className = 'skill-slot'; 
        if (i < 2) slot.classList.add('basic-slot'); 
        slot.dataset.slotIndex = i;
        
        // --- DRAG & DROP OLAYLARI ---
        slot.setAttribute('draggable', true);
        
        // Olayları temizleyip yeniden eklemek yerine, üzerine yazıyoruz (Modern tarayıcılar yönetir)
        slot.ondragover = (e) => { e.preventDefault(); slot.classList.add('drag-over'); };
        slot.ondragleave = () => { slot.classList.remove('drag-over'); };
        
        slot.ondrop = (e) => {
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

                    initializeSkillButtons();
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            } catch (err) {
                // B) KİTAPTAN EKLE
                const skillKey = rawData;
                // Skill var mı kontrolü (Universal)
                const isSkill = SKILL_DATABASE[skillKey] || (typeof BASIC_SKILL_DATABASE !== 'undefined' && BASIC_SKILL_DATABASE[hero.class][skillKey]);
                
                if (isSkill) { 
                    hero.equippedSkills[i] = skillKey; 
                    initializeSkillButtons(); 
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            }
        };

        const skillKey = hero.equippedSkills[i];
        
        // Klavye İpucu
        const keyHint = document.createElement('span'); 
        keyHint.classList.add('key-hint'); 
        if (i === 0) keyHint.textContent = 'A';
        else if (i === 1) keyHint.textContent = 'D';
        else keyHint.textContent = (i - 1); 
        slot.appendChild(keyHint);

        // --- SKILL VERİSİNİ BULMA (HİBRİT) ---
        let skillData = null;
        if (skillKey) {
            if (SKILL_DATABASE[skillKey]) {
                skillData = SKILL_DATABASE[skillKey].data || SKILL_DATABASE[skillKey];
            } else if (typeof BASIC_SKILL_DATABASE !== 'undefined' && BASIC_SKILL_DATABASE[hero.class] && BASIC_SKILL_DATABASE[hero.class][skillKey]) {
                skillData = BASIC_SKILL_DATABASE[hero.class][skillKey];
            }
        }

        if (skillData) {
            const iconImg = document.createElement('img'); 
            iconImg.src = `images/${skillData.icon}`; 
            slot.appendChild(iconImg);
            
            // Drag Start
            slot.ondragstart = (e) => {
                const dragData = { type: 'move_skill', index: i, skillKey: skillKey };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            };

            const overlay = document.createElement('div'); overlay.className = 'cooldown-overlay';
            const cdText = document.createElement('span'); cdText.className = 'cooldown-text';
            overlay.appendChild(cdText); slot.appendChild(overlay);

            slot.dataset.skillKey = skillKey; 
            // Rage Cost Güvenliği: Tanımlı değilse 0 kabul et
            slot.dataset.rageCost = (skillData.rageCost !== undefined) ? skillData.rageCost : 0;
            
            // Tıklama
            slot.onclick = () => {
                if (!slot.classList.contains('disabled')) handleSkillUse(skillKey);
            };

            // Tooltip
            const desc = skillData.desc || (skillData.menuDescription ? skillData.menuDescription.replace(/<[^>]*>?/gm, '') : '');
            slot.title = `${skillData.name}: ${desc}`;
        } else {
            slot.classList.add('empty-slot');
            slot.setAttribute('draggable', false);
        }
    }
    toggleSkillButtons(false);
}

// --- BUTON DURUMLARI (GÜNCELLENDİ) ---
function toggleSkillButtons(forceDisable) {
    const slots = document.querySelectorAll('.skill-slot');
    
    slots.forEach(slot => {
        if (!slot.dataset.skillKey) return; 
        const skillKey = slot.dataset.skillKey;
        // Rage Cost Güvenliği: NaN ise 0 yap
        const rageCost = parseInt(slot.dataset.rageCost) || 0;
        
        const overlay = slot.querySelector('.cooldown-overlay');
        const cdText = overlay ? overlay.querySelector('.cooldown-text') : null;

        const isBlocked = checkIfSkillBlocked(skillKey);
        const cooldownEffect = hero.statusEffects.find(e => e.id === 'block_skill' && e.blockedSkill === skillKey && !e.waitForCombat);
        const isStunned = hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat);

        if (isBlocked || isStunned) {
            slot.classList.add('disabled'); 
            slot.style.borderColor = "#ff4d4d"; 
            
            if (overlay && cdText && cooldownEffect) {
                const max = cooldownEffect.maxTurns || 3;
                const percent = (cooldownEffect.turns / max) * 100;
                overlay.style.height = `${percent}%`; 
                cdText.textContent = cooldownEffect.turns;
            } else if (overlay) { 
                overlay.style.height = '100%'; 
                if(cdText && isStunned) cdText.textContent = "💫";
                else if(cdText) cdText.textContent = "⛔";
            }
        } else {
            if (overlay) { overlay.style.height = '0%'; if(cdText) cdText.textContent = ''; }
            
            // Rage Kontrolü (forceDisable yoksa)
            if (!forceDisable && hero.rage < rageCost) { 
                slot.classList.add('disabled'); 
                slot.style.borderColor = ""; 
            } else if (forceDisable) {
                slot.classList.add('disabled');
            } else { 
                slot.classList.remove('disabled'); 
                slot.style.borderColor = ""; 
            }
        }
    });
}

// --- SKILL KULLANIMI ---
function handleSkillUse(skillKey) {
    if (!isHeroTurn) return;
    if (checkIfSkillBlocked(skillKey)) { writeLog(`❌ Bu yetenek şu an kullanılamaz!`); return; }

    // Skill Verisini Bul
    let skillObj = null;
    let skillData = null;

    if (SKILL_DATABASE[skillKey]) {
        skillObj = SKILL_DATABASE[skillKey];
        skillData = skillObj.data || skillObj;
    } else if (typeof BASIC_SKILL_DATABASE !== 'undefined' && BASIC_SKILL_DATABASE[hero.class] && BASIC_SKILL_DATABASE[hero.class][skillKey]) {
        skillObj = BASIC_SKILL_DATABASE[hero.class][skillKey];
        skillData = skillObj;
    }

    if (!skillObj) return;

    // Rage Kontrolü
    const cost = skillData.rageCost || 0;
    if (hero.rage < cost) { 
        writeLog(`❌ Yetersiz Öfke!`); return; 
    }
    
    if(cost > 0) hero.rage -= cost;
    
    updateStats(); 
    
    // Quick Action (Tur yemeyen) Kontrolü
    // Distract gibi skillerde nextTurn manuel çağrılmaz, sadece butonlar kilitlenip açılır.
    // Ancak genel yapı bozulmasın diye burada hepsini kilitliyoruz.
    // Skillin kendisi (onCast/execute) animasyonu veya nextTurn'ü yönetir.
    toggleSkillButtons(true);
    
    if (skillObj.onCast) {
        skillObj.onCast(hero, monster);
    } else if (skillObj.execute) {
        // Basic Skill Mantığı
        const result = skillObj.execute(hero, monster);
        updateStats();

        if (result.action === 'attack') {
            performBasicAttackAnimation(result.damage, skillData.name);
        } else if (result.action === 'guard') {
            hero.statusEffects.push({ id: 'guard_active', name: 'Koruma', value: 0.25, turns: 1, waitForCombat: false, resetOnCombatEnd: true });
            isHeroDefending = true;
            writeLog(`🛡️ **${skillData.name}**: Savunma pozisyonu (%25 Hasar Azaltma).`);
            nextTurn();
        } else if (result.action === 'block') {
            window.addHeroBlock(result.value);
            writeLog(`🧱 **${skillData.name}**: ${result.value} Blok kazandın.`);
            nextTurn();
        } else if (result.action === 'defend') { 
            isHeroDefending = true; 
            heroDefenseBonus = result.value; 
            writeLog(`🛡️ **${skillData.name}**: Savunma (+${result.value} Def).`); 
            nextTurn();
        } else if (result.action === 'focus') {
            showFloatingText(document.getElementById('hero-display'), `+${result.rage} Rage`, 'heal');
            writeLog(`🧘 **${skillData.name}**: Odaklandın (+${result.rage} Rage).`);
            nextTurn();
        }
    }
}

// --- ANİMASYON (BASIC ATTACK) ---
function performBasicAttackAnimation(rawDamage, skillName) {
    const attackerImgElement = heroDisplayImg;
    const targetContainer = document.getElementById('monster-display');
    const attackFrames = HERO_ATTACK_FRAMES;
    
    toggleSkillButtons(true);

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            attackerImgElement.src = attackFrames[frameIndex];
            if (frameIndex === 1) {
                let effectiveDef = monster.defense;
                if(isMonsterDefending) effectiveDef += monsterDefenseBonus;
                const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
                if (ignoreDef) effectiveDef = 0;
                
                const weakDefEffect = hero.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
                if (weakDefEffect) {
                    effectiveDef = Math.floor(effectiveDef * (1 - weakDefEffect.value));
                }

                let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));
                
                const curseEffect = hero.statusEffects.find(e => e.id === 'curse_damage' && !e.waitForCombat);
                if (curseEffect) {
                    finalDamage = Math.floor(finalDamage * (1 + curseEffect.value));
                }

                monster.hp = Math.max(0, monster.hp - finalDamage);
                
                animateDamage(false); 
                showFloatingText(targetContainer, finalDamage, 'damage');
                writeLog(`${skillName}: ${finalDamage} hasar.`);
                updateStats();
                
                if (isMonsterDefending) { 
                    isMonsterDefending = false; 
                    monsterDefenseBonus = 0; 
                    writeLog(`${monster.name}'ın savunması kırıldı.`); 
                }
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

// --- ANİMASYON (SPECIAL SKILL) ---
function animateCustomAttack(rawDamage, skillFrames, skillName) {
    const attackerImgElement = heroDisplayImg;
    const targetContainer = document.getElementById('monster-display');
    
    let effectiveDef = monster.defense;
    if(isMonsterDefending) effectiveDef += monsterDefenseBonus;
    const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
    if(ignoreDef) effectiveDef = 0;

    const weakDefEffect = hero.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
    if (weakDefEffect) effectiveDef = Math.floor(effectiveDef * (1 - weakDefEffect.value));

    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));
    
    const curseEffect = hero.statusEffects.find(e => e.id === 'curse_damage' && !e.waitForCombat);
    if (curseEffect) finalDamage = Math.floor(finalDamage * (1 + curseEffect.value));

    toggleSkillButtons(true);

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < skillFrames.length) {
            attackerImgElement.src = skillFrames[frameIndex]; 
            if (frameIndex === 1) { 
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

// --- MONSTER SALDIRI ANİMASYONU ---
function handleMonsterAttack(attacker, defender) {
    const attackerImgElement = monsterDisplayImg;
    const targetContainer = document.getElementById('hero-display');

    let attackFrames = ENEMY_STATS[attacker.name].attackFrames.map(f => `images/${f}`);
    const idleSrc = `images/${ENEMY_STATS[attacker.name].idle}`;
    
    toggleSkillButtons(true);

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            attackerImgElement.src = attackFrames[frameIndex]; 
            if (frameIndex === 1) { 
                let damage = calculateDamage(attacker, defender);
                
                const guardEffect = hero.statusEffects.find(e => e.id === 'guard_active');
                if (guardEffect) {
                    damage = Math.floor(damage * (1 - guardEffect.value));
                    writeLog("Guard ile hasar azaltıldı.");
                }

                if (heroBlock > 0) {
                    if (heroBlock >= damage) {
                        heroBlock -= damage;
                        damage = 0;
                        showFloatingText(targetContainer, "BLOK!", 'heal');
                        writeLog(`Bloklandı! (Kalan Blok: ${heroBlock})`);
                    } else {
                        damage -= heroBlock;
                        writeLog(`Blok kırıldı! (${heroBlock} emildi)`);
                        heroBlock = 0;
                    }
                }

                if (damage > 0) {
                    defender.hp = Math.max(0, defender.hp - damage);
                    animateDamage(true); 
                    showFloatingText(targetContainer, damage, 'damage');
                    writeLog(`${attacker.name} -> ${defender.name}: ${damage}`);
                    if (defender === hero) hero.rage = Math.min(hero.maxRage, hero.rage + 5);
                }
                updateStats();
                if (isHeroDefending) { isHeroDefending = false; heroDefenseBonus = 0; }
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

// --- HASAR HESAPLAMA ---
function calculateDamage(attacker, defender) {
    let rawDamage = attacker.attack;
    
    if (attacker === hero) {
        const stats = getHeroEffectiveStats();
        rawDamage = stats.atk;
        const instaKill = hero.statusEffects.find(e => e.id === 'insta_kill' && !e.waitForCombat);
        if (instaKill) return 9999;
    } else {
        // Canavar Saldırısı
        rawDamage = attacker.attack;
        const weakAtkEffect = hero.statusEffects.find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
        if (weakAtkEffect) {
            rawDamage = Math.floor(rawDamage * (1 - weakAtkEffect.value));
        }
    }

    let effectiveDefense = defender.defense;
    let damageMultiplier = 1.0; 

    if (defender === hero) {
        const stats = getHeroEffectiveStats();
        effectiveDefense = stats.def;
        if (isHeroDefending) effectiveDefense += heroDefenseBonus;

        const guardEffect = hero.statusEffects.find(e => e.id === 'guard_active');
        if (guardEffect) damageMultiplier = 1.0 - guardEffect.value; 
    } 
    else if (defender === monster) {
        if (isMonsterDefending) effectiveDefense += monsterDefenseBonus;
        const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
        if (ignoreDef) effectiveDefense = 0;
        const weakDefEffect = hero.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
        if (weakDefEffect) {
            effectiveDefense = Math.floor(effectiveDefense * (1 - weakDefEffect.value));
        }
    }

    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDefense));
    finalDamage = Math.floor(finalDamage * damageMultiplier);

    if (attacker === hero) {
        const curseEffect = hero.statusEffects.find(e => e.id === 'curse_damage' && !e.waitForCombat);
        if (curseEffect) {
            finalDamage = Math.floor(finalDamage * (1 + curseEffect.value));
        }
    }

    return Math.max(1, finalDamage); 
}

// --- OYUN DÖNGÜSÜ ---
function determineMonsterAction() {
    if (Math.random() < 0.70) monsterNextAction = 'attack';
    else {
        monsterNextAction = 'defend';
        monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2);
    }
}

function startBattle(enemyType) {
    const stats = ENEMY_STATS[enemyType];
    if (!stats) {
        console.error(`Düşman Bulunamadı: ${enemyType}`);
        startBattle("Goblin Devriyesi"); 
        return;
    }
    switchScreen(battleScreen);
    monster = { name: enemyType, maxHp: stats.maxHp, hp: stats.maxHp, attack: stats.attack, defense: stats.defense, xp: stats.xp, idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames };
    
    monsterDisplayImg.onerror = function() { this.src = 'images/goblin_devriyesi.png'; };
    monsterDisplayImg.src = `images/${monster.idle}`;
    monsterDisplayImg.style.filter = 'none'; 
    heroDisplayImg.src = HERO_IDLE_SRC;
    
    isMonsterDefending = false; monsterDefenseBonus = 0; 
    isHeroDefending = false; heroDefenseBonus = 0;
    heroBlock = 0; 
    
    hero.statusEffects.forEach(e => { if (e.waitForCombat) e.waitForCombat = false; });
    combatTurnCount = 1;
    document.getElementById('turn-count-display').textContent = combatTurnCount;

    updateStats(); initializeSkillButtons(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
    
    isHeroTurn = true; 
    writeLog(`Savaş Başladı! (${enemyType})`);
    
    toggleSkillButtons(false);
}

function nextTurn() {
    isHeroTurn = !isHeroTurn;
    if (checkGameOver()) return;
    
    if (isHeroTurn) {
        combatTurnCount++;
        const tDisplay = document.getElementById('turn-count-display');
        if(tDisplay) tDisplay.textContent = combatTurnCount;
        writeLog(`--- TUR ${combatTurnCount} ---`);

        if (heroBlock > 0) {
            heroBlock = Math.floor(heroBlock * 0.5);
            if(heroBlock === 0) writeLog("Blok süresi doldu.");
            else writeLog(`Kalan Blok: ${heroBlock}`);
        }

        if (isHeroDefending) { isHeroDefending = false; heroDefenseBonus = 0; }
        
        let stunApplied = false;
        const regens = hero.statusEffects.filter(e => e.id === 'regen' && !e.waitForCombat);
        regens.forEach(r => {
            const healAmt = 10; 
            hero.hp = Math.min(hero.maxHp, hero.hp + healAmt);
            showFloatingText(document.getElementById('hero-display'), healAmt, 'heal');
        });

        const stunEffect = hero.statusEffects.find(e => e.id === 'stun' && !e.waitForCombat);
        if (stunEffect) { stunApplied = true; showFloatingText(document.getElementById('hero-display'), "DAZZY!", 'damage'); }

        if (hero.statusEffects.length > 0) {
            hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
            hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
        }

        updateStats(); 
        
        toggleSkillButtons(true);
        if (stunApplied) { setTimeout(() => { nextTurn(); }, 1500); return; }

        updateStats(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
        
        toggleSkillButtons(false); 
        writeLog("... Senin Sıran ...");

    } else {
        toggleSkillButtons(true); 
        const action = monsterNextAction;
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');
        
        setTimeout(() => {
            if (!checkGameOver()) {
                if (action === 'attack') {
                    handleMonsterAttack(monster, hero); 
                } else if (action === 'defend') { 
                    isMonsterDefending = true; 
                    monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2);
                    showFloatingText(document.getElementById('monster-display'), "SAVUNMA!", 'heal'); 
                    writeLog(`${monster.name} savunma pozisyonu aldı (+${monsterDefenseBonus} Def).`); 
                    nextTurn(); 
                }
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
        
        hero.statusEffects = hero.statusEffects.filter(e => !e.resetOnCombatEnd);
        heroBlock = 0; 
        updateStats(); toggleSkillButtons(true);

        setTimeout(() => { 
            const goldReward = Math.floor(Math.random() * 11) + 1;
            openRewardScreen([{ type: 'gold', value: goldReward }]);
            monster = null; 
        }, 1000); 
        return true;
    }
    return false;
}