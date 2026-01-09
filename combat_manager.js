// combat_manager.js - TÜM LOGLAR VE MEKANİKLER DAHİL TAM SÜRÜM

const HERO_IDLE_SRC = 'images/heroes/barbarian/barbarian.webp'; 
const HERO_ATTACK_FRAMES = ['images/heroes/barbarian/barbarian_attack1.webp', 'images/heroes/barbarian/barbarian_attack2.webp', 'images/heroes/barbarian/barbarian_attack3.webp'];
const HERO_DEAD_SRC = 'images/heroes/barbarian/barbarian_dead.webp'; 

// Savaş Değişkenleri
window.heroDefenseBonus = 0; 
window.isHeroDefending = false;
window.monsterDefenseBonus = 0; 
window.isMonsterDefending = false; 
window.monsterNextAction = 'attack'; 
window.combatTurnCount = 1;
window.heroBlock = 0; 
window.isHeroTurn = false; 

window.applyStatusEffect = function(newEffect) {
    // 1. Aynı ID'ye sahip mevcut bir etki var mı bak (Örn: debuff_enemy_atk)
    // Not: block_skill (cooldown) etkilerini birleştirmemeli, onları hariç tutuyoruz.
    const existingIndex = hero.statusEffects.findIndex(e => e.id === newEffect.id && e.id !== 'block_skill');

    if (existingIndex !== -1) {
        // 2. Eğer varsa, değerleri güncelle
        const existing = hero.statusEffects[existingIndex];
        
        // SÜRE MANTIĞI: Süreleri toplayalım mı yoksa en uzun olanı mı alalım?
        // Genelde profesyonel oyunlarda en uzun olan alınır (Refresh):
        existing.turns = Math.max(existing.turns, newEffect.turns);
        
        // DEĞER MANTIĞI: Eğer biri %25, diğeri %50 azaltıyorsa, güçlü olanı alalım:
        if (newEffect.value !== undefined) {
            existing.value = Math.max(existing.value, newEffect.value);
        }
        
        writeLog(`✨ **${existing.name}** etkisi yenilendi.`);
    } else {
        // 3. Eğer yoksa, yeni bir etki olarak ekle
        hero.statusEffects.push(newEffect);
    }
    
    updateStats();
};

// --- YARDIMCI: Blok Ekleme ---
window.addHeroBlock = function(amount) {
    window.heroBlock += amount;
    const display = document.getElementById('hero-display');
    if(display) showFloatingText(display, `+${amount} Blok`, 'heal');
    updateStats(); 
};

// --- EFEKTİF STAT HESAPLAMA (GÜNCEL SÜRÜM) ---
window.getHeroEffectiveStats = function() {
    // 1. TEMEL DEĞERLERİ HAZIRLA
    let s = { 
        str: hero.str, 
        dex: hero.dex, 
        int: hero.int, 
        vit: hero.vit, 
        mp_pow: hero.mp_pow 
    };
    
    // Dirençleri başlangıç değerleriyle (base) hazırla
    let currentResists = { ...hero.baseResistances };
    
    let flatAtkBonus = 0;  // Sabit artışlar (+15 Atak gibi)
    let flatDefBonus = 0;  // Sabit defanslar (+10 Def gibi)
    let totalAtkMult = 1.0; // Yüzdesel çarpanlar (1.0 = %100)

    // 2. EKİPMANLARI TARA (Eşyalardan gelen bonusları ekle)
    for (const slotKey in hero.equipment) {
        const item = hero.equipment[slotKey];
        if (item && item.stats) {
            for (const statKey in item.stats) {
                // Eğer bu bir ana stat ise (str, dex vb.)
                if (s.hasOwnProperty(statKey)) {
                    s[statKey] += item.stats[statKey];
                }
                // Eğer bu bir direnç ise (fire, cold vb.)
                else if (currentResists.hasOwnProperty(statKey)) {
                    currentResists[statKey] += item.stats[statKey];
                }
            }
        }
    }
	
			// 2.1 ÇANTADAKİ PASİF EŞYALARI (CHARMS) TARA
			hero.inventory.forEach(item => {
			if (item && item.type === "passive_charm" && item.stats) {
				for (const statKey in item.stats) {
					// Dirençleri ekle
					if (currentResists.hasOwnProperty(statKey)) {
						currentResists[statKey] += item.stats[statKey];
					}
					// Statları ekle (İleride kertenkeleler stat da verirse diye)
					else if (s.hasOwnProperty(statKey)) {
						s[statKey] += item.stats[statKey];
					}
				}
			}
		});

    // 3. STATUS EFFECT'LERİ TARA (Buff/Debuff)
    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'str_up') s.str += e.value;
            if (e.id === 'dex_up') s.dex += e.value;
            if (e.id === 'int_up') s.int += e.value;
            
            if (e.id === 'atk_up') flatAtkBonus += e.value;
            if (e.id === 'def_up') flatDefBonus += e.value;
            
            if (e.id === 'atk_up_percent') totalAtkMult += e.value;
            if (e.id === 'atk_half') totalAtkMult *= 0.5;
            
            // Eğer bufflardan gelen direnç varsa (örn: resist_fire)
            if (e.id === 'resist_fire') currentResists.fire += e.value;
        }
    });

    // 4. SINIF KURALLARINI UYGULA (Barbar Kuralları)
    const rules = CLASS_CONFIG[hero.class];
    
    // Ham Atak = (Karakterin Baz Atağı + Sabit Bufflar + Statlardan Gelen Bonus)
    let rawAtk = (hero.baseAttack || 10) + flatAtkBonus + Math.floor(s.str * (rules.atkStats.str || 0.5));
    let finalAtk = Math.floor(rawAtk * totalAtkMult);

    // Defans = (Karakterin Baz Defansı + Sabit Bufflar + Statlardan Gelen Bonus)
    let finalDef = (hero.baseDefense || 1) + flatDefBonus + Math.floor(s.dex * (rules.defStats.dex || 0.34));

    // Pervasız Vuruş (Defansı 0 yapar)
    if (hero.statusEffects.some(e => e.id === 'defense_zero' && !e.waitForCombat)) {
        finalDef = 0;
    }

    // Blok Gücü
    let finalBlock = Math.floor(s.dex * (rules.blockStats.dex || 0.8));
	
	/// 1. Eşyalardan gelen EXTRA Vitality'yi bul (Toplam Vit - Karakterin Kendi Viti)
    const bonusVitFromItems = s.vit - hero.vit; 

    // 2. Eşya Çarpanını al (item_data içindeki vitToHp: 2)
    const itemVitMultiplier = window.ITEM_CONFIG.multipliers.vitToHp || 2;

    // 3. Final Max HP = Karakterin Kendi Max HP'si + (Eşya Viti * Eşya Çarpanı)
    const finalMaxHp = hero.maxHp + (bonusVitFromItems * itemVitMultiplier);


    // 5. SONUCU DÖNDÜR
    return { 
        atk: Math.max(0, finalAtk), 
        def: Math.max(0, finalDef), 
        blockPower: Math.max(0, finalBlock),
        str: s.str, 
        dex: s.dex, 
        int: s.int, 
        vit: s.vit, 
        mp_pow: s.mp_pow,
		maxHp: finalMaxHp,
        resists: currentResists, // UI'ın beklediği toplam direnç objesi
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
        
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];

        const isBlocked = hero.statusEffects.some(e => {
            if (e.waitForCombat) return false;
            return (e.id === 'block_skill' && e.blockedSkill === skillKey) || (e.id === 'block_type' && e.blockedType === data.type);
        });

        if (isBlocked) {
            // Skill ismini çeviriden al
            const skillName = lang.skills[skillKey]?.name || data.name;
            // "❌ Kilitli: Kes şu an kullanılamaz!"
            writeLog(`❌ **${lang.status.locked_skill_msg}**: ${skillName} ${lang.status.currently_unavailable}`);
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
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    for (let i = 0; i < totalSlots; i++) {
        let slot = (i === 0) ? slotA : (i === 1) ? slotD : document.createElement('div');
        if (i >= 2) skillButtonsContainer.appendChild(slot);
        if (!slot) continue;

        slot.innerHTML = ''; slot.className = 'skill-slot'; 
        if (i < 2) slot.classList.add('basic-slot'); 
        slot.dataset.slotIndex = i; 
        
        const key = hero.equippedSkills[i];
        slot.innerHTML = `<span class="key-hint">${(i === 0) ? 'A' : (i === 1) ? 'D' : (i - 1)}</span>`;

        // --- DROP MANTIĞI ---
        slot.ondragover = e => e.preventDefault();
        slot.ondrop = e => {
            e.preventDefault(); 
            const raw = e.dataTransfer.getData('text/plain');
            try {
                const d = JSON.parse(raw);
                if (d.type === 'move_skill') {
                    const temp = hero.equippedSkills[i];
                    hero.equippedSkills[i] = hero.equippedSkills[d.index];
                    hero.equippedSkills[d.index] = temp;
                    initializeSkillButtons();
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            } catch (err) {
                if (SKILL_DATABASE[raw]) { 
                    hero.equippedSkills[i] = raw; 
                    initializeSkillButtons(); 
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                }
            }
        };

        if (key && SKILL_DATABASE[key]) {
            const data = SKILL_DATABASE[key].data || SKILL_DATABASE[key];
            const img = document.createElement('img');
            img.src = `images/${data.icon}`;
            slot.appendChild(img);

            const overlay = document.createElement('div'); overlay.className = 'cooldown-overlay';
            const cdText = document.createElement('span'); cdText.className = 'cooldown-text';
            overlay.appendChild(cdText); slot.appendChild(overlay);
            
            slot.dataset.skillKey = key; 
            slot.dataset.rageCost = data.rageCost || 0;
            slot.onclick = () => { if (!slot.classList.contains('disabled')) handleSkillUse(key); };
            
            // --- DRAG & DROP ÖZELLİKLERİ ---
            slot.setAttribute('draggable', true);
            slot.ondragstart = e => {
                e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'move_skill', index: i }));
            };

            slot.ondragend = e => {
                if (e.dataTransfer.dropEffect === "none") {
                    hero.equippedSkills[i] = null;
                    initializeSkillButtons();
                    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
                    writeLog(`📤 ${lang.log_skill_unequipped}`);
                }
            };
        } else {
            slot.classList.add('empty-slot');
            slot.setAttribute('draggable', false);
            slot.onclick = null;
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
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat; // Savaş çevirilerini al

    const windUpIdx = hero.statusEffects.findIndex(e => e.id === 'wind_up' && !e.waitForCombat);
    if (windUpIdx !== -1) { 
        rawDamage += hero.statusEffects[windUpIdx].value; 
        hero.statusEffects.splice(windUpIdx, 1); 
        writeLog(lang.log_windup); // Çeviri kullanıldı
    }

    let def = monster.defense + (window.isMonsterDefending ? window.monsterDefenseBonus : 0);
    if(hero.statusEffects.some(e => e.id === 'ignore_def' && !e.waitForCombat)) {
        def = 0;
        writeLog(lang.log_ignore_def); // Çeviri kullanıldı
    }

    const weakDef = hero.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
    if (weakDef) def = Math.floor(def * (1 - weakDef.value));

    let finalDmg = Math.max(1, Math.floor(rawDamage - def));

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
                    writeLog(lang.log_fury_gain); // Çeviri kullanıldı
                }

                animateDamage(false); 
                showFloatingText(document.getElementById('monster-display'), finalDmg, 'damage');
                
                // Dinamik Log: "⚔️ Slash: 15 damage dealt to Goblin"
                writeLog(`⚔️ **${skillName}**: ${monster.name} ${lang.log_hit_monster} **${finalDmg}**.`);

                if (window.isMonsterDefending) { 
                    window.isMonsterDefending = false; 
                    window.monsterDefenseBonus = 0; 
                    writeLog(`🛡️ ${monster.name} ${lang.log_shield_break}`); // Çeviri kullanıldı
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
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    const stats = ENEMY_STATS[attacker.name];
    let attackFrames = stats.attackFrames.map(f => `images/${f}`);
    
    let rawDamage = attacker.attack;
    const heroStats = getHeroEffectiveStats();
    let effectiveDef = heroStats.def + (window.isHeroDefending ? window.heroDefenseBonus : 0);
    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));

    let fIdx = 0;
    function frame() {
        if (fIdx < attackFrames.length) {
            monsterDisplayImg.src = attackFrames[fIdx]; 
            if (fIdx === 1) { 
                if (window.heroBlock > 0) {
                    if (window.heroBlock >= finalDamage) { 
                        writeLog(lang.log_block_full); 
                        window.heroBlock -= finalDamage; 
                        finalDamage = 0; 
                        showFloatingText(heroDisplayContainer, lang.f_block, 'heal'); 
                    } else { 
                        writeLog(`${lang.log_block_partial} ${finalDamage - window.heroBlock}`);
                        finalDamage -= window.heroBlock; 
                        window.heroBlock = 0; 
                    }
                }
                if (finalDamage > 0) { 
                    defender.hp = Math.max(0, defender.hp - finalDamage); 
                    animateDamage(true); 
                    showFloatingText(heroDisplayContainer, finalDamage, 'damage'); 
                    writeLog(`⚠️ **${attacker.name}**: ${lang.log_monster_hit} (**${finalDamage}**)`);
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
	
	let scaling = 1.0;
    // Data-driven kontrol
    if (stats.isBoss) {
        scaling = window.EventManager.getModifier('boss_scaling');
    }
	
    switchScreen(battleScreen);
    monster = { name: enemyType, maxHp: stats.maxHp, hp: stats.maxHp, attack: stats.attack, defense: stats.defense, isBoss: stats.isBoss, xp: stats.xp, tier: stats.tier, idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames };
    
	// Savaş başlangıcı bonusu (Örn: Stormreach ayında +10 öfke)
    const bonus = window.EventManager.getCombatBonus();
    hero.rage = Math.min(hero.maxRage, hero.rage + bonus.rage);

    if (scaling > 1) writeLog(`⚠️ Boss Karanlık Zamanın Etkisiyle Güçlendi! (x${scaling.toFixed(2)})`);
	
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
	const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    
    if (window.isHeroTurn) {
        window.combatTurnCount++;
        writeLog(`--- Tur ${window.combatTurnCount} ---`);
        if(turnCountDisplay) turnCountDisplay.textContent = window.combatTurnCount;
        if (window.heroBlock > 0) {
            window.heroBlock = Math.floor(window.heroBlock * 0.5);
            if(window.heroBlock === 0) writeLog("🧱 Kalkanın süresi doldu.");
        }
        
        hero.statusEffects.filter(e => e.id === 'regen' && !e.waitForCombat).forEach(() => { 
            hero.hp = Math.min(hero.maxHp, hero.hp + 10); 
            showFloatingText(heroDisplayContainer, 10, 'heal'); 
            writeLog(lang.log_regen);
        });
		hero.statusEffects.filter(e => e.id === 'percent_regen' && !e.waitForCombat).forEach((effect) => { 
			let healAmount = Math.floor(hero.hp * effect.value); 
			if (healAmount < 1) healAmount = 1; // En az 1 HP iyileştirsin

			const oldHp = hero.hp;
			hero.hp = Math.min(hero.maxHp, hero.hp + healAmount); 
    
			showFloatingText(heroDisplayContainer, (hero.hp - oldHp), 'heal'); 
			writeLog(`✨ **${effect.name}**: ${hero.hp - oldHp} HP (${lang.log_regen})`);
		});

        hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
        hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
        updateStats(); 

        if (hero.statusEffects.some(e => e.id === 'stun' && !e.waitForCombat)) { 
            writeLog(lang.log_stun_skip);
            showFloatingText(heroDisplayContainer, lang.f_stunned, 'damage'); 
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
            writeLog(lang.log_stun_skip);
            showFloatingText(document.getElementById('monster-display'), lang.f_stunned, 'damage'); 
            window.isHeroTurn = true; 
            setTimeout(nextTurn, 1000); return; 
        }
        setTimeout(() => {
            if (!checkGameOver()) {
                if (window.monsterNextAction === 'attack') {
                    handleMonsterAttack(monster, hero); 
                } else { 
                    // DİL AYARLARINI ALALIM
                    const currentLang = window.gameSettings.lang || 'tr';
                    const combatLang = window.LANGUAGES[currentLang].combat; // .combat ekledik!

                    window.isMonsterDefending = true; 
                    
                    // Defans bonusu hesaplama
                    window.monsterDefenseBonus = Math.floor(Math.random() * (Math.floor(monster.maxHp * 0.1) - Math.floor(monster.attack / 2) + 1)) + Math.floor(monster.attack / 2); 
                    
                    // FLOATING TEXT (Artık 'combatLang' üzerinden çekiyor)
                    showFloatingText(document.getElementById('monster-display'), combatLang.monster_defend_text, 'heal'); 
                    
                    // LOG MESAJI (Artık 'combatLang' üzerinden çekiyor)
                    writeLog(`🛡️ **${monster.name}**: ${combatLang.monster_log_defend} (+${window.monsterDefenseBonus} Defans).`);
                    
                    window.isHeroTurn = true; 
                    updateStats(); // Kalkan görselini tetikler
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
		
		// --- PERMADEATH: KAYDI SİL ---
        if (window.deleteSave) {
            window.deleteSave(); 
        }
        // ----------------------------
		
        triggerDeathEffect(); 
        setTimeout(() => { switchScreen(gameOverScreen); resetDeathEffect(); 
		// "Devam Et" butonunu ana menüde gizlemek için kontrolü tetikle
            const continueBtn = document.getElementById('btn-continue');
            if (continueBtn) continueBtn.classList.add('hidden');
			}, 1800); 
        return true; 
    }
    if (monster && monster.hp <= 0) {
        writeLog(`🏆 **Zafer**: ${monster.name} alt edildi!`);
        monster.hp = 0; updateStats(); 
        monsterDisplayImg.src = `images/${monster.dead}`; 
        monsterDisplayImg.style.filter = 'grayscale(100%) brightness(0.5)'; 
		
		// EN YÜKSEK TIER GÜNCELLEME
    if (monster.tier > hero.highestTierDefeated) {
        hero.highestTierDefeated = monster.tier;
        writeLog(`🌟 **Yeni Tehdit Seviyesi**: Dükkanlar artık Tier ${hero.highestTierDefeated} ürünler getirebilir!`);
    }
        
        // --- YENİ GANİMET MANTIĞI ---
        let rewards = [];
        
        // 1. Altın Ödülü (Zaten vardı)
        rewards.push({ type: 'gold', value: Math.floor(Math.random() * 11) + 5 });

        // 2. Eşya Düşürme Şansı (%40 şansla eşya düşsün)
        if (Math.random() < 1.0) {
            // Canavar Tier'ına göre İtem Tier'ı belirle
            // Tier 2 canavar %50 ihtimalle Tier 1, %50 ihtimalle Tier 2 item atar
            let itemTier = monster.tier;
            if (monster.tier > 1 && Math.random() < 0.5) {
                itemTier = monster.tier - 1;
            }
		// 3. Jewelry Fragment Drop (%50 Şans)
			if (Math.random() < 0.5) {
		const fragCount = Math.floor(Math.random() * 4) + 1; 		
        ///(const fragCount = Math.floor(Math.random() * monster.tier) + 1;)
        const fragmentItem = { ...window.BASE_MATERIALS["jewelry_fragment"] };
		rewards.push({ type: 'item', value: fragmentItem, amount: fragCount });
		}

		// 4. Stat Scroll Drop (%10 Şans)
			if (Math.random() < 0.1) {
        // Havuzdan sadece stat_scroll tipindekileri filtrele
        const statScrollPool = window.SPECIAL_MERCH_ITEMS.filter(i => i.type === "stat_scroll");
        const selected = statScrollPool[Math.floor(Math.random() * statScrollPool.length)];
        
        // Ödül listesine ekle
        rewards.push({ type: 'item', value: { ...selected } });
    }
            
            // Item Generator'ı çağır ve ödüllere ekle
            const droppedItem = generateRandomItem(itemTier);
            rewards.push({ type: 'item', value: droppedItem });
        }
        // ----------------------------

        gainXP(3); // XP kazanımı (basitleştirildi)
        hero.statusEffects = hero.statusEffects.filter(e => !e.resetOnCombatEnd); 
        window.heroBlock = 0; 
        updateStats();

        setTimeout(() => { 
            openRewardScreen(rewards); // Hazırladığımız ödül listesini gönderiyoruz
            monster = null; 
        }, 1000); 
        
        window.saveGame();
        return true;
    }
    return false;
};

window.getHeroResistances = function() {
    let r = { ...hero.baseResistances };
    hero.statusEffects.forEach(e => { if (!e.waitForCombat && e.id === 'resist_fire') r.fire += e.value; });
    return r;
};