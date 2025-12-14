// combat_manager.js - TAM VE EKSİKSİZ VERSİYON (Block & Guard Mekanikleri Dahil)

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
let heroBlock = 0; // YENİ: Blok Değeri (Geçici Can/Kalkan)

// --- BASIC SLOT KİLİT FONKSİYONU ---
function toggleBasicActions(disable) {
    // Basic Attack Butonu Kontrolü
    if (btnBasicAttack) {
        if (disable) {
            btnBasicAttack.classList.add('disabled');
            btnBasicAttack.style.pointerEvents = 'none';
            btnBasicAttack.style.filter = 'grayscale(100%) opacity(0.6)';
        } else {
            btnBasicAttack.classList.remove('disabled');
            btnBasicAttack.style.pointerEvents = 'auto';
            btnBasicAttack.style.filter = 'none';
        }
    }
    // Basic Defend Butonu Kontrolü
    if (btnBasicDefend) {
        if (disable) {
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

// --- BASIC SKILL KULLANIMI ---
function handleBasicSkillUse(slotIndex) {
    if (!isHeroTurn) return;

    const skillKey = hero.equippedBasic[slotIndex];
    if (!skillKey) return;
    
    // Güvenlik kontrolü: Class verisi var mı?
    if (!BASIC_SKILL_DATABASE[hero.class]) return;

    const skillData = BASIC_SKILL_DATABASE[hero.class][skillKey];
    if (!skillData) return;

    // YENİ: Rage Maliyeti Kontrolü (Guard vb. için)
    if (skillData.rageCost && hero.rage < skillData.rageCost) {
        writeLog(`❌ Yetersiz Öfke! (${skillData.rageCost} gerekli)`);
        return; 
    }

    // Rage Harcaması
    if (skillData.rageCost) {
        hero.rage -= skillData.rageCost;
    }

    // 1. Fonksiyonu Çalıştır (Stat etkileri burada işlenir)
    const result = skillData.execute(hero, monster);
    updateStats(); 

    // 2. Sonuca Göre İşlem
    if (result.action === 'attack') {
        // Saldırı Animasyonu
        performBasicAttackAnimation(result.damage, skillData.name);

    } else if (result.action === 'guard') {
        // YENİ: Guard (%25 Hasar Azaltma)
        // 1 Turluk status effect ekliyoruz
        hero.statusEffects.push({
            id: 'guard_active',
            name: 'Koruma',
            value: 0.25, // %25
            turns: 1,
            waitForCombat: false,
            resetOnCombatEnd: true
        });
        
        isHeroDefending = true; // Görsel duruş için
        writeLog(`🛡️ **${skillData.name}**: Savunma pozisyonu (%25 Hasar Azaltma).`);
        nextTurn();

    } else if (result.action === 'block') {
        // YENİ: Blok (Geçici Kalkan)
        heroBlock += result.value;
        showFloatingText(document.getElementById('hero-display'), `+${result.value} Blok`, 'heal'); // Mavi yazı olsa iyi olurdu
        writeLog(`🧱 **${skillData.name}**: ${result.value} Blok kazandın. (Toplam: ${heroBlock})`);
        nextTurn();

    } else if (result.action === 'defend') {
        // Eski usul savunma (Eğer hala kullanılıyorsa)
        isHeroDefending = true;
        heroDefenseBonus = result.value;
        writeLog(`🛡️ **${skillData.name}**: Savunma alındı (+${heroDefenseBonus} Def, +${result.rage} Rage).`);
        nextTurn();
    }
}

// --- BASIC SALDIRI ANİMASYONU ---
function performBasicAttackAnimation(rawDamage, skillName) {
    const attackerImgElement = heroDisplayImg;
    const targetContainer = document.getElementById('monster-display');
    const attackFrames = HERO_ATTACK_FRAMES;
    
    toggleBasicActions(true);
    toggleSkillButtons(true);

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            attackerImgElement.src = attackFrames[frameIndex];
            if (frameIndex === 1) {
                let effectiveDef = monster.defense;
                
                // Canavar Savunuyorsa Bonus Ekle
                if(isMonsterDefending) effectiveDef += monsterDefenseBonus;
                
                // Zırh Kırma Kontrolü
                const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
                if (ignoreDef) effectiveDef = 0;

                // Nihai Hasar
                const finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));
                monster.hp = Math.max(0, monster.hp - finalDamage);
                
                animateDamage(false); 
                showFloatingText(targetContainer, finalDamage, 'damage');
                writeLog(`${skillName}: ${finalDamage} hasar.`);
                updateStats();
                
                // Canavarın savunmasını kır
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

// --- CANAVAR SALDIRI ANİMASYONU ---
function handleMonsterAttack(attacker, defender) {
    const attackerImgElement = monsterDisplayImg;
    const targetContainer = document.getElementById('hero-display');

    let attackFrames = ENEMY_STATS[attacker.name].attackFrames.map(f => `images/${f}`);
    const idleSrc = `images/${ENEMY_STATS[attacker.name].idle}`;
    
    toggleBasicActions(true);
    toggleSkillButtons(true);

    let frameIndex = 0;
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            attackerImgElement.src = attackFrames[frameIndex]; 
            if (frameIndex === 1) { 
                // 1. Ham Hasarı Hesapla (Guard azaltması buraya dahildir)
                let damage = calculateDamage(attacker, defender);
                
                // 2. YENİ: Blok (Shield) Kontrolü
                // Eğer oyuncunun bloğu varsa, hasarı önce oradan düş
                if (heroBlock > 0) {
                    if (heroBlock >= damage) {
                        // Blok tüm hasarı emer
                        heroBlock -= damage;
                        damage = 0;
                        showFloatingText(targetContainer, "BLOK!", 'heal');
                        writeLog(`${attacker.name} saldırdı ama BLOKLANDI! (Kalan Blok: ${heroBlock})`);
                    } else {
                        // Blok yetmez, kalanı cana gider
                        damage -= heroBlock;
                        writeLog(`${attacker.name} saldırdı! Blok ${heroBlock} hasarı emdi.`);
                        heroBlock = 0;
                    }
                }

                // 3. Kalan hasarı cana uygula
                if (damage > 0) {
                    defender.hp = Math.max(0, defender.hp - damage);
                    animateDamage(true); 
                    showFloatingText(targetContainer, damage, 'damage');
                    writeLog(`${attacker.name} -> ${defender.name}: ${damage} hasar.`);
                    
                    // Rage Kazancı (Hasar yiyince)
                    if (defender === hero) {
                        hero.rage = Math.min(hero.maxRage, hero.rage + 5);
                    }
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
    
    // Canavarın atağı (Hero atağı zaten Basic Skill execute içinde hesaplanıyor)
    if (attacker !== hero) {
        rawDamage = attacker.attack;
    }

    // --- DEFANS HESAPLARI ---
    let effectiveDefense = defender.defense;
    let damageMultiplier = 1.0; // Varsayılan çarpan

    if (defender === hero) {
        const stats = getHeroEffectiveStats();
        effectiveDefense = stats.def;
        
        if (isHeroDefending) effectiveDefense += heroDefenseBonus;

        // YENİ: Guard (%25 Azaltma) Kontrolü
        const guardEffect = hero.statusEffects.find(e => e.id === 'guard_active');
        if (guardEffect) {
            damageMultiplier = 1.0 - guardEffect.value; // 1 - 0.25 = 0.75
        }
    } 
    else if (defender === monster) {
        if (isMonsterDefending) effectiveDefense += monsterDefenseBonus;
        const ignoreDef = hero.statusEffects.find(e => e.id === 'ignore_def' && !e.waitForCombat);
        if (ignoreDef) effectiveDefense = 0;
    }

    // Formül: (Atak - Defans) * Çarpan
    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDefense));
    
    // Çarpanı uygula
    finalDamage = Math.floor(finalDamage * damageMultiplier);

    return Math.max(1, finalDamage); 
}

function determineMonsterAction() {
    if (Math.random() < 0.70) monsterNextAction = 'attack';
    else {
        monsterNextAction = 'defend';
        monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2);
    }
}

// --- STAT HESAPLAMA ---
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
        if (e.id === 'block_skill' && e.blockedSkill === skillKey) return true;
        if (e.id === 'block_type' && e.blockedType === skill.data.type) return true;
        return false;
    });
}

// --- SKILL BAR OLUŞTURMA ---
function initializeSkillButtons() {
    if (!skillButtonsContainer) return;
    skillButtonsContainer.innerHTML = ''; 
    
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div'); 
        slot.classList.add('skill-slot'); 
        slot.dataset.slotIndex = i; 
        
        // --- DRAG & DROP OLAYLARI ---

        // 1. Üzerine gelindiğinde (İzin ver)
        slot.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            slot.classList.add('drag-over'); 
        });

        // 2. Üzerinden çıkıldığında
        slot.addEventListener('dragleave', () => { 
            slot.classList.remove('drag-over'); 
        });

        // 3. Bırakıldığında (DROP)
        slot.addEventListener('drop', (e) => {
            e.preventDefault(); 
            slot.classList.remove('drag-over');
            
            const rawData = e.dataTransfer.getData('text/plain');
            
            try {
                // A) SLOTLAR ARASI TAŞIMA (SWAP)
                // Veriyi JSON olarak okumaya çalış
                const data = JSON.parse(rawData);
                
                if (data.type === 'move_skill') {
                    const fromIndex = data.index;
                    const toIndex = i;

                    // Aynı yere bırakırsa işlem yapma
                    if (fromIndex === toIndex) return;

                    // Yer Değiştirme (Swap)
                    const temp = hero.equippedSkills[toIndex];
                    hero.equippedSkills[toIndex] = hero.equippedSkills[fromIndex];
                    hero.equippedSkills[fromIndex] = temp;

                    // Arayüzü Güncelle
                    initializeSkillButtons();
                    
                    // Eğer Skill Kitabı açıksa oradaki "Kuşanılanlar" barını da güncelle
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                    
                    writeLog("Yeteneklerin yeri değiştirildi.");
                }

            } catch (err) {
                // B) KİTAPTAN YENİ YETENEK EKLEME
                // JSON parse hatası verirse, demek ki düz metin (Skill Key) geliyor.
                const skillKey = rawData;
                
                if (skillKey && SKILL_DATABASE[skillKey]) { 
                    hero.equippedSkills[i] = skillKey; 
                    
                    initializeSkillButtons(); 
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                    writeLog("Yetenek kuşandın.");
                }
            }
        });

        const keyHint = document.createElement('span'); 
        keyHint.classList.add('key-hint'); 
        keyHint.textContent = i + 1; 
        slot.appendChild(keyHint);

        const skillKey = hero.equippedSkills[i];
        
        // Eğer slot doluysa
        if (skillKey && SKILL_DATABASE[skillKey]) {
            const skill = SKILL_DATABASE[skillKey];
            const iconImg = document.createElement('img'); 
            iconImg.src = `images/${skill.data.icon}`; 
            slot.appendChild(iconImg);
            
            // --- SÜRÜKLEME BAŞLATMA (DRAG START) ---
            // Sadece dolu slotlar sürüklenebilir
            slot.setAttribute('draggable', true);
            
            slot.addEventListener('dragstart', (e) => {
                // Taşıdığımız veriyi JSON formatında paketle
                const dragData = {
                    type: 'move_skill',
                    index: i,
                    skillKey: skillKey
                };
                e.dataTransfer.setData('text/plain', JSON.stringify(dragData));
            });
            // ---------------------------------------
            
            const overlay = document.createElement('div'); 
            overlay.className = 'cooldown-overlay';
            const cdText = document.createElement('span'); 
            cdText.className = 'cooldown-text';
            overlay.appendChild(cdText); 
            slot.appendChild(overlay);

            slot.dataset.skillKey = skillKey; 
            slot.dataset.rageCost = skill.data.rageCost;
            
            slot.addEventListener('click', () => { 
                if (!slot.classList.contains('disabled')) handleSkillUse(skillKey); 
            });

            const tooltip = document.createElement('div'); 
            tooltip.classList.add('skill-tooltip');
            tooltip.innerHTML = `<span class="tooltip-title">${skill.data.name}</span><span class="tooltip-cost">Maliyet: ${skill.data.rageCost} Öfke</span><span class="tooltip-desc">${skill.data.description}</span>`;
            slot.appendChild(tooltip);
        } else { 
            slot.classList.add('empty-slot'); 
            // Boş slotlar sürüklenemez
            slot.setAttribute('draggable', false);
        }
        
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
            
            if (forceDisable || hero.rage < rageCost) { 
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

// --- SAVAŞ DÖNGÜSÜ ---
function startBattle(enemyType) {
    const stats = ENEMY_STATS[enemyType];
    if (!stats) {
        console.error(`Düşman Bulunamadı: ${enemyType}`);
        startBattle("Goblin Devriyesi"); 
        return;
    }

    switchScreen(battleScreen);
    
    monster = { 
        name: enemyType, 
        maxHp: stats.maxHp, 
        hp: stats.maxHp, // Can fulle
        attack: stats.attack, 
        defense: stats.defense, 
        xp: stats.xp, 
        idle: stats.idle, 
        dead: stats.dead, 
        attackFrames: stats.attackFrames 
    };
    
    monsterDisplayImg.onerror = function() { this.src = 'images/goblin_devriyesi.png'; };
    monsterDisplayImg.src = `images/${monster.idle}`;
    monsterDisplayImg.style.filter = 'none'; 
    heroDisplayImg.src = HERO_IDLE_SRC;
    
    isMonsterDefending = false; monsterDefenseBonus = 0; isHeroDefending = false; heroDefenseBonus = 0;
    heroBlock = 0; // Blok sıfırla
    
    hero.statusEffects.forEach(e => { if (e.waitForCombat) e.waitForCombat = false; });
    combatTurnCount = 1;
    document.getElementById('turn-count-display').textContent = combatTurnCount;

    updateStats(); initializeSkillButtons(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
    
    isHeroTurn = true; 
    writeLog(`Savaş Başladı! (${enemyType})`);
    
    toggleBasicActions(false); toggleSkillButtons(false);
}

function nextTurn() {
    isHeroTurn = !isHeroTurn;
    if (checkGameOver()) return;
    
    if (isHeroTurn) {
        // --- OYUNCU SIRASI ---
        combatTurnCount++;
        document.getElementById('turn-count-display').textContent = combatTurnCount;
        writeLog(`--- TUR ${combatTurnCount} ---`);

        // YENİ: Blok Erimesi (%50)
        if (heroBlock > 0) {
            heroBlock = Math.floor(heroBlock * 0.5);
            if(heroBlock > 0) writeLog(`🧱 Kalan Blok: ${heroBlock}`);
            else writeLog(`🧱 Blok süresi doldu.`);
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
        
        toggleBasicActions(true); toggleSkillButtons(true);

        if (stunApplied) { setTimeout(() => { nextTurn(); }, 1500); return; }

        updateStats(); determineMonsterAction(); showMonsterIntention(monsterNextAction);
        
        toggleBasicActions(false); toggleSkillButtons(false); 
        writeLog("... Senin Sıran ...");

    } else {
        // --- CANAVAR SIRASI ---
        toggleBasicActions(true); toggleSkillButtons(true); 
        
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
        heroBlock = 0; // Savaş bitince blok silinir

        updateStats(); toggleBasicActions(true); toggleSkillButtons(true);

        setTimeout(() => { 
            const goldReward = Math.floor(Math.random() * 11) + 1;
            openRewardScreen([{ type: 'gold', value: goldReward }]);
            monster = null; 
        }, 1000); 
        return true;
    }
    return false;
}