// combat_manager.js - AKILLI KİLİT SİSTEMİ (SMART TOGGLE)

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

// --- AKILLI BUTON KONTROLÜ (GÜNCELLENDİ) ---
function toggleBasicActions(forceDisable) {
    let disableAttack = forceDisable;
    let disableDefend = forceDisable;

    // Eğer zorla kapatılmıyorsa (Yani Oyuncu Sırasıysa), Status Effectleri kontrol et
    if (!forceDisable) {
        // 1. STUN KONTROLÜ: Sersemlemişse hepsi kapalı
        const isStunned = hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat);
        if (isStunned) {
            disableAttack = true;
            disableDefend = true;
        } else {
            // 2. BLOK KONTROLÜ (Eventlerden gelen kısıtlamalar)
            
            // Saldırı Kilitli mi? (block_type: 'attack')
            const blockAttack = hero.statusEffects.some(e => e.id === 'block_type' && e.blockedType === 'attack' && !e.waitForCombat);
            if (blockAttack) disableAttack = true;

            // Savunma Kilitli mi? (block_type: 'defense')
            const blockDefense = hero.statusEffects.some(e => e.id === 'block_type' && e.blockedType === 'defense' && !e.waitForCombat);
            if (blockDefense) disableDefend = true;
        }
    }

    // --- SALDIRI BUTONU GÜNCELLEME ---
    if (btnBasicAttack) {
        if (disableAttack) {
            btnBasicAttack.classList.add('disabled');
            btnBasicAttack.style.pointerEvents = 'none';
            btnBasicAttack.style.filter = 'grayscale(100%) opacity(0.6)';
        } else {
            btnBasicAttack.classList.remove('disabled');
            btnBasicAttack.style.pointerEvents = 'auto';
            btnBasicAttack.style.filter = 'none';
        }
    }

    // --- SAVUNMA BUTONU GÜNCELLEME ---
    if (btnBasicDefend) {
        if (disableDefend) {
            btnBasicDefend.classList.add('disabled');
            btnBasicDefend.style.pointerEvents = 'none';
            btnBasicDefend.style.filter = 'grayscale(100%) opacity(0.6)';
        } else {
            btnBasicDefend.classList.remove('disabled');
            btnBasicDefend.style.pointerEvents = 'auto';
            btnBasicDefend.style.filter = 'none';
        }
    }
}

// --- EFEKTİF STAT HESAPLAMA ---
function getHeroEffectiveStats() {
    let currentStr = hero.str;
    let currentDef = hero.defense;
    let currentAtk = hero.attack;

    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'str_up') currentStr += e.value;
            if (e.id === 'atk_up') currentAtk += e.value;
            if (e.id === 'atk_down') currentAtk -= e.value;
            if (e.id === 'def_up') currentDef += e.value;
            if (e.id === 'atk_half') currentAtk = Math.floor(currentAtk * 0.5);
        }
    });

    hero.mapEffects.forEach(e => {
        if (e.id === 'map_atk_weak') currentAtk = Math.floor(currentAtk * e.value);
    });

    return { atk: Math.max(0, currentAtk), def: Math.max(0, currentDef), str: currentStr };
}

// --- KİLİT KONTROLÜ (Skiller İçin) ---
function checkIfSkillBlocked(skillKey) {
    const skill = SKILL_DATABASE[skillKey];
    if (!skill) return false;

    return hero.statusEffects.some(e => {
        if (e.waitForCombat) return false;
        
        // Skill direkt yasaklı mı?
        if (e.id === 'block_skill' && e.blockedSkill === skillKey) return true;
        
        // Skill Tipi yasaklı mı? (Örn: 'defense' tipi yasaksa Heal basamazsın)
        if (e.id === 'block_type' && e.blockedType === skill.data.type) return true;
        
        return false;
    });
}

// --- SKILL BAR OLUŞTURMA ---
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

// --- BUTON DURUMLARI (Sadece Skiller İçin) ---
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
            
            // Eğer Hero sırasıysa ve Rage yetmiyorsa disable et
            if (!forceDisable && hero.rage < rageCost) { 
                slot.classList.add('disabled'); 
                slot.style.borderColor = ""; 
            } else if (forceDisable) {
                // Düşman sırasıysa hepsini disable et
                slot.classList.add('disabled');
            } else { 
                slot.classList.remove('disabled'); 
                slot.style.borderColor = ""; 
            }
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
    
    toggleBasicActions(true); 
    toggleSkillButtons(true);
    
    skillObj.onCast(hero, monster);
}

// --- HASAR VE SAVAŞ MANTIĞI ---
function calculateDamage(attacker, defender) {
    let rawDamage = attacker.attack;
    
    if (attacker === hero) {
        const stats = getHeroEffectiveStats();
        // Normal saldırı: Base ATK (8) + STR*0.5
        rawDamage = 8 + Math.floor(stats.str * 0.5);

        const instaKill = hero.statusEffects.find(e => e.id === 'insta_kill' && !e.waitForCombat);
        if (instaKill) return 9999;
    }

    let effectiveDefense = defender.defense;
    if (defender === hero) {
        const stats = getHeroEffectiveStats();
        effectiveDefense = stats.def;
        if (isHeroDefending) effectiveDefense += heroDefenseBonus;
    } 
    else if (defender === monster) {
        if (isMonsterDefending) effectiveDefense += monsterDefenseBonus;
        const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
        if (ignoreDef) effectiveDefense = 0;
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
    
    toggleBasicActions(true);
    toggleSkillButtons(true);

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
                
                if (attackerIsHero) hero.rage = Math.min(hero.maxRage, hero.rage + 20);
                
                updateStats();
                if (attackerIsHero && isMonsterDefending) { 
                    isMonsterDefending = false; 
                    monsterDefenseBonus = 0; 
                    writeLog(`${monster.name}'ın savunması kırıldı.`);
                }
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
    
    let effectiveDef = monster.defense;
    const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
    if(ignoreDef) effectiveDef = 0;
    if(isMonsterDefending) effectiveDef += monsterDefenseBonus;

    const finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));

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

function startBattle(enemyType) {
    // 1. Düşman verisini veritabanından çek
    const stats = ENEMY_STATS[enemyType];

    // Güvenlik: Eğer düşman adı yanlışsa veya veritabanında yoksa oyunu çökertme
    if (!stats) {
        console.error(`HATA: "${enemyType}" adlı düşman enemy_data.js içinde bulunamadı!`);
        // Acil durum düşmanı (Çökmemesi için)
        startBattle("Goblin Devriyesi"); 
        return;
    }

    switchScreen(battleScreen);
    
    // 2. KRİTİK NOKTA: YENİ BİR CANAVAR OBJESİ OLUŞTUR (KOPYALA)
    // stats objesini direkt kullanmıyoruz. Değerleri tek tek alıp yeni bir kutuya koyuyoruz.
    // Böylece savaşta can azaldığında ana veritabanı (ENEMY_STATS) bozulmuyor.
    monster = { 
        name: enemyType, 
        maxHp: stats.maxHp, 
        hp: stats.maxHp, // Canı her zaman maxHp'den başlat (Fulleyerek)
        attack: stats.attack, 
        defense: stats.defense, 
        xp: stats.xp, 
        idle: stats.idle, 
        dead: stats.dead, 
        attackFrames: stats.attackFrames 
    };
    
    // Görsel Ayarları (Sıfırlama)
    monsterDisplayImg.onerror = function() {
        this.src = 'images/goblin_devriyesi.png'; // Resim yoksa yedek resim
    };
    monsterDisplayImg.src = `images/${monster.idle}`;
    monsterDisplayImg.style.filter = 'none'; // Ölü filtresini kaldır
    
    heroDisplayImg.src = HERO_IDLE_SRC;
    
    // Savaş Değişkenlerini Sıfırla
    isMonsterDefending = false; 
    monsterDefenseBonus = 0; 
    isHeroDefending = false; 
    heroDefenseBonus = 0;
    
    // Bekleyen Etkileri (Map Effects hariç) Aktif Et
    let activatedCount = 0;
    hero.statusEffects.forEach(e => {
        if (e.waitForCombat) { 
            e.waitForCombat = false; 
            activatedCount++;
        }
    });
    
    // Tur Sayacını Sıfırla
    combatTurnCount = 1;
    const turnDisplay = document.getElementById('turn-count-display');
    if(turnDisplay) turnDisplay.textContent = combatTurnCount;

    updateStats(); 
    initializeSkillButtons(); 
    determineMonsterAction(); 
    showMonsterIntention(monsterNextAction);
    
    // Başlangıç Ayarları
    isHeroTurn = true; 
    writeLog(`Savaş Başladı! (${enemyType})`);
    
    // Butonları ayarla
    toggleBasicActions(false);
    toggleSkillButtons(false);
}

function nextTurn() {
    isHeroTurn = !isHeroTurn;
    if (checkGameOver()) return;
    
    if (isHeroTurn) {
        combatTurnCount++;
        document.getElementById('turn-count-display').textContent = combatTurnCount;
        writeLog(`--- TUR ${combatTurnCount} ---`);

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
            stunApplied = true;
            writeLog(`😵 **DAZZY!** Başın döndüğü için bu turu pas geçiyorsun.`);
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

        updateStats(); 
        
        // Önce hepsini kapat (Stun kontrolü için)
        toggleBasicActions(true);
        toggleSkillButtons(true);

        if (stunApplied) { setTimeout(() => { nextTurn(); }, 1500); return; }

        updateStats(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
        
        // Oyuncu sırası: Butonları akıllıca aç
        toggleBasicActions(false); // false = zorla kapatma, durumu kontrol et
        toggleSkillButtons(false); 
        writeLog("... Senin Sıran ...");

    } else {
        // Canavar sırası: Hepsini zorla kapat (true)
        toggleBasicActions(true);
        toggleSkillButtons(true); 
        
        const action = monsterNextAction;
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');
        
        setTimeout(() => {
            if (!checkGameOver()) {
                if (action === 'attack') {
                    handleAttackSequence(monster, hero); 
                } else if (action === 'defend') { 
                    isMonsterDefending = true; 
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
        
        updateStats(); 
        toggleBasicActions(true);
        toggleSkillButtons(true);

        setTimeout(() => { 
            const goldReward = Math.floor(Math.random() * 11) + 1;
            openRewardScreen([{ type: 'gold', value: goldReward }]);
            monster = null; 
        }, 1000); 
        return true;
    }
    return false;
}