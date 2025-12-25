// combat_manager.js - TÜM LOGLAR VE MEKANİKLER DAHİL TAM SÜRÜM

const HERO_IDLE_SRC = 'images/barbarian.png'; 
const HERO_ATTACK_FRAMES = ['images/barbarian_attack1.png', 'images/barbarian_attack2.png', 'images/barbarian_attack3.png'];
const HERO_DEAD_SRC = 'images/barbarian_dead.png'; 

// Savaş Değişkenleri
window.heroDefenseBonus = 0; 
window.isHeroDefending = false;
window.monsterDefenseBonus = 0; 
window.isMonsterDefending = false; 
window.monsterNextAction = 'attack'; 
window.combatTurnCount = 1;
window.heroBlock = 0; 
window.isHeroTurn = false; 

// --- YARDIMCI: Blok Ekleme ---
window.addHeroBlock = function(amount) {
    window.heroBlock += amount;
    const display = document.getElementById('hero-display');
    if(display) showFloatingText(display, `+${amount} Blok`, 'heal');
    updateStats(); 
};

// --- EFEKTİF STAT HESAPLAMA ---
window.getHeroEffectiveStats = function() {
    // 1. TEMEL DEĞERLERİ HAZIRLA
    let s = { 
        str: hero.str, 
        dex: hero.dex, 
        int: hero.int, 
        vit: hero.vit, 
        mp: hero.mp_pow 
    };
    
    let flatAtkBonus = 0;  // Sabit artışlar (+15 Atak gibi)
    let flatDefBonus = 0;  // Sabit defanslar (+10 Def gibi)
    let totalAtkMult = 1.0; // Yüzdesel çarpanlar (1.0 = %100)

    // 2. STATUS EFFECT'LERİ TARA (Buff/Debuff)
    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'str_up') s.str += e.value;
            if (e.id === 'dex_up') s.dex += e.value;
            if (e.id === 'int_up') s.int += e.value;
            
            // SABİT BONUSLARI TOPLA
            if (e.id === 'atk_up') flatAtkBonus += e.value;
            if (e.id === 'def_up') flatDefBonus += e.value;
            
            // YÜZDESEL ÇARPANLARI TOPLA
            if (e.id === 'atk_up_percent') totalAtkMult += e.value;
            if (e.id === 'atk_half') totalAtkMult *= 0.5;
        }
    });

    // 3. SINIF KURALLARINI UYGULA (Barbar Kuralları)
    const rules = CLASS_CONFIG[hero.class];
    
    // Ham Atak = (Karakterin Baz Atağı + Sabit Bufflar + Statlardan Gelen Bonus)
    let rawAtk = (hero.baseAttack || 10) + flatAtkBonus + Math.floor(s.str * (rules.atkStats.str || 0.5));
    
    // Final Atak = Ham Atak * Toplam Çarpan
    let finalAtk = Math.floor(rawAtk * totalAtkMult);

    // Defans = (Karakterin Baz Defansı + Sabit Bufflar + Statlardan Gelen Bonus)
    let finalDef = (hero.baseDefense || 1) + flatDefBonus + Math.floor(s.dex * (rules.defStats.dex || 0.34));

    // 4. ÖZEL DURUMLAR
    // Pervasız Vuruş (Defansı 0 yapar)
    if (hero.statusEffects.some(e => e.id === 'defense_zero' && !e.waitForCombat)) {
        finalDef = 0;
    }

    // Blok Gücü
    let finalBlock = Math.floor(s.dex * (rules.blockStats.dex || 0.8));

    // 5. SONUCU DÖNDÜR
    return { 
        atk: Math.max(0, finalAtk), 
        def: Math.max(0, finalDef), 
        blockPower: Math.max(0, finalBlock),
        str: s.str, 
        dex: s.dex, 
        int: s.int, 
        vit: s.vit, 
        mp: s.mp,
        atkMultiplier: totalAtkMult 
    };
};

// --- HASAR MOTORU ---
window.calculateSkillRawDamage = function(attacker, skillData) {
    const stats = getHeroEffectiveStats();
    const scaling = skillData.scaling || {};
    let atkP = (stats.atk || 0) * (scaling.atkMult || 0);
    let statP = 0;
    if (scaling.stats) {
        for (const [stat, mult] of Object.entries(scaling.stats)) {
            statP += (stats[stat] || hero[stat] || 0) * mult;
        }
    }
    let elementPart = 0;
    if (scaling.elements && hero.elementalDamage) {
        for (const [elementName, multiplier] of Object.entries(scaling.elements)) {
            elementPart += (hero.elementalDamage[elementName] || 0) * multiplier;
        }
    }
    return Math.floor(atkP + statP + elementPart);
};

// --- KİLİT KONTROLÜ ---
window.checkIfSkillBlocked = function(skillKey) {
    if (SKILL_DATABASE[skillKey]) {
        const s = SKILL_DATABASE[skillKey];
        const data = s.data || s;
        
        const isBlocked = hero.statusEffects.some(e => {
            if (e.waitForCombat) return false;
            return (e.id === 'block_skill' && e.blockedSkill === skillKey) || (e.id === 'block_type' && e.blockedType === data.type);
        });

        if (isBlocked) {
            writeLog(`❌ **Kilitli**: ${data.name} şu an kullanılamaz!`);
        }
        return isBlocked;
    }
    return false;
};

// --- SKILL BAR OLUŞTURMA (DRAG & DROP) ---
window.initializeSkillButtons = function() {
    if (skillButtonsContainer) skillButtonsContainer.innerHTML = '';
    const slotA = document.getElementById('btn-basic-attack');
    const slotD = document.getElementById('btn-basic-defend');
    const totalSlots = hero.equippedSkills.length; 

    for (let i = 0; i < totalSlots; i++) {
        let slot = (i === 0) ? slotA : (i === 1) ? slotD : document.createElement('div');
        if (i >= 2) skillButtonsContainer.appendChild(slot);
        if (!slot) continue;

        slot.innerHTML = ''; slot.className = 'skill-slot'; 
        if (i < 2) slot.classList.add('basic-slot'); 
        slot.dataset.slotIndex = i; slot.setAttribute('draggable', true);
        
        slot.ondragover = e => e.preventDefault();
        slot.ondrop = e => {
            e.preventDefault(); const raw = e.dataTransfer.getData('text/plain');
            try {
                const d = JSON.parse(raw);
                if (d.type === 'move_skill') {
                    const temp = hero.equippedSkills[i];
                    hero.equippedSkills[i] = hero.equippedSkills[d.index];
                    hero.equippedSkills[d.index] = temp;
                    initializeSkillButtons();
                }
            } catch (err) {
                if (SKILL_DATABASE[raw]) { 
                    hero.equippedSkills[i] = raw; 
                    initializeSkillButtons(); 
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            }
        };

        const key = hero.equippedSkills[i];
        slot.innerHTML = `<span class="key-hint">${(i === 0) ? 'A' : (i === 1) ? 'D' : (i - 1)}</span>`;

        if (key && SKILL_DATABASE[key]) {
            const data = SKILL_DATABASE[key].data || SKILL_DATABASE[key];
            slot.innerHTML += `<img src="images/${data.icon}">`;
            const overlay = document.createElement('div'); overlay.className = 'cooldown-overlay';
            const cdText = document.createElement('span'); cdText.className = 'cooldown-text';
            overlay.appendChild(cdText); slot.appendChild(overlay);
            slot.dataset.skillKey = key; 
            slot.dataset.rageCost = data.rageCost || 0;
            slot.onclick = () => { if (!slot.classList.contains('disabled')) handleSkillUse(key); };
        } else {
            slot.classList.add('empty-slot');
        }
    }
    toggleSkillButtons(false);
};

window.toggleSkillButtons = function(forceDisable) {
    const slots = document.querySelectorAll('.skill-slot');
    slots.forEach(slot => {
        if (!slot.dataset.skillKey) return; 
        const key = slot.dataset.skillKey;
        const cost = parseInt(slot.dataset.rageCost) || 0;
        const overlay = slot.querySelector('.cooldown-overlay');
        const cdText = overlay ? overlay.querySelector('.cooldown-text') : null;
        
        const blocked = checkIfSkillBlocked(key);
        const cdEffect = hero.statusEffects.find(e => e.id === 'block_skill' && e.blockedSkill === key && !e.waitForCombat);
        const stunned = hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat);

        if (blocked || stunned) {
            slot.classList.add('disabled'); 
            if (overlay && cdText && cdEffect) {
                overlay.style.height = `${(cdEffect.turns / cdEffect.maxTurns) * 100}%`; 
                cdText.textContent = cdEffect.turns > 1 ? cdEffect.turns - 1 : "⌛";
            } else if (overlay) { 
                overlay.style.height = '100%'; 
                if(cdText) cdText.textContent = stunned ? "💫" : "⛔";
            }
        } else {
            if (overlay) overlay.style.height = '0%';
            if (cdText) cdText.textContent = ''; 
            if (forceDisable || hero.rage < cost || !window.isHeroTurn) slot.classList.add('disabled'); 
            else slot.classList.remove('disabled'); 
        }
    });
};

// --- SKILL KULLANIMI ---
window.handleSkillUse = function(skillKey) {
    if (window.isHeroTurn !== true) return; 

    const skillObj = SKILL_DATABASE[skillKey];
    if (!skillObj) return;
    const data = skillObj.data || skillObj;

    // Engel Kontrolü (Log fonksiyonun içinde basılıyor)
    if (checkIfSkillBlocked(skillKey)) return;

    if (hero.rage < (data.rageCost || 0)) { 
        writeLog(`❌ **Öfke Yetersiz**: ${data.name} için ${data.rageCost} Öfke gerekiyor.`);
        return; 
    }

    window.isHeroTurn = false; 
    toggleSkillButtons(true); 

    if(data.rageCost > 0) hero.rage -= data.rageCost;
    updateStats(); 
    if (skillObj.onCast) skillObj.onCast(hero, monster);
};

// --- ANİMASYONLAR VE HASAR ---
window.animateCustomAttack = function(rawDamage, skillFrames, skillName) {
    const attackerImgElement = heroDisplayImg;
    const targetContainer = document.getElementById('monster-display');
    
    const windUpIdx = hero.statusEffects.findIndex(e => e.id === 'wind_up' && !e.waitForCombat);
    if (windUpIdx !== -1) { 
        rawDamage += hero.statusEffects[windUpIdx].value; 
        hero.statusEffects.splice(windUpIdx, 1); 
        writeLog("✨ **Kurulma**: Biriktirilen güç saldırıya eklendi!");
    }

    let def = monster.defense + (window.isMonsterDefending ? window.monsterDefenseBonus : 0);
    if(hero.statusEffects.some(e => e.id === 'ignore_def' && !e.waitForCombat)) {
        def = 0;
        writeLog("🔨 **Zırh Delme**: Düşman savunması yok sayıldı!");
    }

    const weakDef = hero.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
    if (weakDef) def = Math.floor(def * (1 - weakDef.value));

    let finalDmg = Math.max(1, Math.floor(rawDamage - def));
    const curse = hero.statusEffects.find(e => e.id === 'curse_damage' && !e.waitForCombat);
    if (curse) finalDmg = Math.floor(finalDmg * (1 + curse.value));

    let fIdx = 0;
    function frame() {
        if (fIdx < skillFrames.length) {
            heroDisplayImg.src = skillFrames[fIdx]; 
            if (fIdx === 1 || skillFrames.length === 1) { 
                monster.hp = Math.max(0, monster.hp - finalDmg);
                const fury = hero.statusEffects.find(e => e.id === 'fury_active' && !e.waitForCombat);
                if (fury) { 
                    const gain = Math.floor(finalDmg * fury.value);
                    hero.rage = Math.min(hero.maxRage, hero.rage + gain); 
                    writeLog(`🔥 **Hiddet**: Hasardan ${gain} Öfke kazandın.`);
                }
                animateDamage(false); 
                showFloatingText(document.getElementById('monster-display'), finalDmg, 'damage');
                writeLog(`⚔️ **${skillName}**: ${monster.name} adlı düşmana **${finalDmg}** hasar verdin.`);
                if (window.isMonsterDefending) { 
                    window.isMonsterDefending = false; 
                    window.monsterDefenseBonus = 0; 
                    writeLog(`🛡️ ${monster.name} savunması kırıldı!`);
                }
                updateStats();
            }
            fIdx++; setTimeout(frame, 150); 
        } else {
            heroDisplayImg.src = HERO_IDLE_SRC; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    frame();
};

window.handleMonsterAttack = function(attacker, defender) {
    const stats = ENEMY_STATS[attacker.name];
    let attackFrames = stats.attackFrames.map(f => `images/${f}`);
    
    let rawDamage = attacker.attack;
    const weakAtk = hero.statusEffects.find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
    if (weakAtk) rawDamage = Math.floor(rawDamage * (1 - weakAtk.value));

    const heroStats = getHeroEffectiveStats();
    let effectiveDef = heroStats.def + (window.isHeroDefending ? window.heroDefenseBonus : 0);

    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));
    const guard = hero.statusEffects.find(e => e.id === 'guard_active');
    if (guard) finalDamage = Math.floor(finalDamage * (1 - guard.value));

    let fIdx = 0;
    function frame() {
        if (fIdx < attackFrames.length) {
            monsterDisplayImg.src = attackFrames[fIdx]; 
            if (fIdx === 1) { 
                if (window.heroBlock > 0) {
                    if (window.heroBlock >= finalDamage) { 
                        writeLog(`🧱 **Blok**: ${finalDamage} hasarı tamamen engelledin!`);
                        window.heroBlock -= finalDamage; 
                        finalDamage = 0; 
                        showFloatingText(heroDisplayContainer, "BLOK!", 'heal'); 
                    } else { 
                        writeLog(`🧱 **Blok**: ${window.heroBlock} hasar emildi, kalan hasar: ${finalDamage - window.heroBlock}`);
                        finalDamage -= window.heroBlock; 
                        window.heroBlock = 0; 
                    }
                }
                if (finalDamage > 0) { 
                    defender.hp = Math.max(0, defender.hp - finalDamage); 
                    animateDamage(true); 
                    showFloatingText(heroDisplayContainer, finalDamage, 'damage'); 
                    writeLog(`⚠️ **${attacker.name}**: Sana **${finalDamage}** hasar vurdu.`);
                    hero.rage = Math.min(hero.maxRage, hero.rage + 5); 
                }
                updateStats(); if (window.isHeroDefending) { window.isHeroDefending = false; window.heroDefenseBonus = 0; }
            }
            fIdx++; setTimeout(frame, 150); 
        } else {
            monsterDisplayImg.src = `images/${stats.idle}`; 
            window.isHeroTurn = true; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    frame();
};

window.determineMonsterAction = function() {
    window.monsterNextAction = Math.random() < 0.7 ? 'attack' : 'defend';
};

window.startBattle = function(enemyType) {
    const stats = ENEMY_STATS[enemyType]; if (!stats) return;
    switchScreen(battleScreen);
    monster = { name: enemyType, maxHp: stats.maxHp, hp: stats.maxHp, attack: stats.attack, defense: stats.defense, xp: stats.xp, tier: stats.tier, idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames };
    
    monsterDisplayImg.style.filter = 'none'; 
    monsterDisplayImg.style.opacity = '1';
    monsterDisplayImg.src = `images/${monster.idle}`;
    heroDisplayImg.src = HERO_IDLE_SRC;

    window.isMonsterDefending = false; window.monsterDefenseBonus = 0; 
    window.isHeroDefending = false; window.heroDefenseBonus = 0;
    window.heroBlock = 0; window.combatTurnCount = 1; 
    window.isHeroTurn = false; 

    hero.statusEffects.forEach(e => { if (e.waitForCombat) e.waitForCombat = false; });
    updateStats(); initializeSkillButtons();
    
    setTimeout(() => { 
        determineMonsterAction(); 
        showMonsterIntention(window.monsterNextAction); 
        window.isHeroTurn = true; 
        toggleSkillButtons(false); 
        writeLog(`⚔️ **Dövüş Başladı**: ${monster.name} ile karşı karşıyasın!`);
    }, 100);
};

window.nextTurn = function() {
    if (checkGameOver()) return;
    
    if (window.isHeroTurn) {
        window.combatTurnCount++;
        writeLog(`--- Tur ${window.combatTurnCount} (Senin Sıran) ---`);
        if(turnCountDisplay) turnCountDisplay.textContent = window.combatTurnCount;
        if (window.heroBlock > 0) {
            window.heroBlock = Math.floor(window.heroBlock * 0.5);
            if(window.heroBlock === 0) writeLog("🧱 Kalkanın süresi doldu.");
        }
        
        hero.statusEffects.filter(e => e.id === 'regen' && !e.waitForCombat).forEach(() => { 
            hero.hp = Math.min(hero.maxHp, hero.hp + 10); 
            showFloatingText(heroDisplayContainer, 10, 'heal'); 
            writeLog(`💖 **Yenilenme**: 10 HP yenilendi.`);
        });

        hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
        hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
        updateStats(); 

        if (hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat)) { 
            writeLog("💫 **Sersemleme**: Bu turu pas geçiyorsun!");
            showFloatingText(heroDisplayContainer, "SERSEMLEDİ!", 'damage'); 
            window.isHeroTurn = false; 
            setTimeout(nextTurn, 1500); 
        } else { 
            determineMonsterAction(); 
            showMonsterIntention(window.monsterNextAction); 
            toggleSkillButtons(false); 
        }
    } else {
        toggleSkillButtons(true); showMonsterIntention(null); 
        if (hero.statusEffects.find(e => e.id === 'monster_stunned' && !e.waitForCombat)) { 
            writeLog(`💫 **${monster.name}** sersemlediği için hamle yapamadı!`);
            showFloatingText(document.getElementById('monster-display'), "SERSEMLEDİ!", 'damage'); 
            window.isHeroTurn = true; 
            setTimeout(nextTurn, 1000); return; 
        }
        setTimeout(() => {
            if (!checkGameOver()) {
                if (window.monsterNextAction === 'attack') handleMonsterAttack(monster, hero); 
                else { 
                    window.isMonsterDefending = true; 
                    window.monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2); 
                    showFloatingText(document.getElementById('monster-display'), "SAVUNMA!", 'heal'); 
                    writeLog(`🛡️ **${monster.name}**: Savunma pozisyonu aldı (+${window.monsterDefenseBonus} Defans).`);
                    window.isHeroTurn = true; 
                    setTimeout(nextTurn, 1000); 
                }
            }
        }, 600);
    }
};

window.checkGameOver = function() {
    if (hero.hp <= 0) { 
        writeLog("💀 **Yenilgi**: Canın tükendi...");
        hero.hp = 0; updateStats(); heroDisplayImg.src = HERO_DEAD_SRC; 
        triggerDeathEffect(); 
        setTimeout(() => { switchScreen(gameOverScreen); resetDeathEffect(); }, 1800); 
        return true; 
    }
    if (monster && monster.hp <= 0) {
        writeLog(`🏆 **Zafer**: ${monster.name} alt edildi!`);
        monster.hp = 0; updateStats(); 
        monsterDisplayImg.src = `images/${monster.dead}`; 
        monsterDisplayImg.style.filter = 'grayscale(100%) brightness(0.5)'; 
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');
        let heroTier = hero.level < 4 ? 1 : (hero.level < 6 ? 2 : (hero.level < 11 ? 3 : 4));
        gainXP(monster.tier > heroTier ? 4 : (monster.tier === heroTier ? 3 : 1));
        hero.statusEffects = hero.statusEffects.filter(e => !e.resetOnCombatEnd); 
        window.heroBlock = 0; updateStats();
        setTimeout(() => { openRewardScreen([{ type: 'gold', value: Math.floor(Math.random() * 11) + 5 }]); monster = null; }, 1000); 
        return true;
    }
    return false;
};

window.getHeroResistances = function() {
    let r = { ...hero.baseResistances };
    hero.statusEffects.forEach(e => { if (!e.waitForCombat && e.id === 'resist_fire') r.fire += e.value; });
    return r;
};