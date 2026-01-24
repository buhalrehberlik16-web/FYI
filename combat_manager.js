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
        
        // ZEHİR İÇİN ÖZEL STACK MANTIĞI:
        if (newEffect.id === 'poison') {
            existing.value += newEffect.value; // Hasar birikir (3 + 3 = 6)
            existing.turns += newEffect.turns; // Süre eklenir (2 + 2 = 4)
            writeLog(`☣️ **Zehir** etkisi şiddetlendi! (Yeni Hasar: ${existing.value})`);
        } else {
            // Diğer etkiler için yenileme (Refresh) mantığı:
            existing.turns = Math.max(existing.turns, newEffect.turns);
            if (newEffect.value !== undefined) {
                existing.value = Math.max(existing.value, newEffect.value);
            }
            writeLog(`✨ **${existing.name}** etkisi yenilendi.`);
        }
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
    
    // DİL DESTEĞİ EKLE:
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang].combat; // f_block: "BLOK!" veya "BLOCK!"

    if(display) {
        // "!" işaretini metinden temizleyerek "+15 BLOK" şeklinde gösteririz
        const label = lang.f_block.replace('!', ''); 
        showFloatingText(display, `+${amount} ${label}`, 'heal');
    }
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
    
    let currentResists = { ...hero.baseResistances };
    let flatAtkBonus = 0;  
    let flatDefBonus = 0;  
    let totalAtkMult = 1.0; 
    let totalDefMult = 1.0; // YENİ: Defans çarpanı eklendi

    // 2. EKİPMANLARI VE CHARMLARI TARA
    const allItems = [...Object.values(hero.equipment), ...hero.inventory.filter(i => i && i.type === "passive_charm")];
    
    allItems.forEach(item => {
        if (item && item.stats) {
            for (const statKey in item.stats) {
                if (s.hasOwnProperty(statKey)) s[statKey] += item.stats[statKey];
                else if (currentResists.hasOwnProperty(statKey)) currentResists[statKey] += item.stats[statKey];
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
            
            // ÖRÜMCEK AĞI DEBUFFI (Burada artık hata vermez)
            if (e.id === 'debuff_webbed') {
                totalAtkMult *= (1 - e.value); // Atak %30 azalır
                totalDefMult *= (1 - e.value); // Defans %30 azalır
            }

            if (e.id === 'resist_fire') currentResists.fire += e.value;
        }
    });
	
	// 3.1 HARİTA ETKİLERİNİ (MAP EFFECTS) TARA
    hero.mapEffects.forEach(me => {
        // Lanetli Altın / Yorgunluk Etkisi
        if (me.id === 'map_atk_weak') {
            // value: 0.6 olduğu için atağı %60'ına indirir (yani %40 azaltır)
            totalAtkMult *= me.value; 
        }
    });

    // 4. HESAPLAMALARI YAP
    const rules = CLASS_CONFIG[hero.class];
    
    // HP ve RAGE Hesapları
    const finalMaxHp = (rules.baseHp || 20) + (s.vit * (rules.vitMultiplier || 5));
    const finalMaxRage = 100 + (s.int * 5);
    const finalRageRegen = Math.floor(s.mp_pow * 0.5);

    // ATAK Hesabı
    let rawAtk = (hero.baseAttack || 10) + flatAtkBonus + Math.floor(s.str * (rules.atkStats.str || 0.5));
    let finalAtk = Math.floor(rawAtk * totalAtkMult);

    // DEFANS Hesabı (Çarpan artık burada uygulanıyor)
    let baseDefCalc = (hero.baseDefense || 0) + flatDefBonus + Math.floor(s.dex * (rules.defStats.dex || 0.34));
    let finalDef = Math.floor(baseDefCalc * totalDefMult);

    // Pervasız Vuruş (Defansı 0 yapar)
    if (hero.statusEffects.some(e => e.id === 'defense_zero' && !e.waitForCombat)) {
        finalDef = 0;
    }

    // 5. SONUCU DÖNDÜR
    return { 
        atk: Math.max(0, finalAtk), 
        def: Math.max(0, finalDef), 
        blockPower: Math.floor(s.dex * (rules.blockStats.dex || 0.8)),
        str: s.str, dex: s.dex, int: s.int, vit: s.vit, mp_pow: s.mp_pow,
        maxHp: finalMaxHp,
        maxRage: finalMaxRage,
        rageRegen: finalRageRegen,
        resists: currentResists,
        atkMultiplier: totalAtkMult 
    };
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
	StatsManager.trackDamageDealt(finalDmg);

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

    // 1. CANAVARIN ATAĞINI KONTROL ET (Düşman güçsüzleşmiş mi?)
    const weakAtk = hero.statusEffects.find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
    if (weakAtk) rawDamage = Math.floor(rawDamage * (1 - weakAtk.value));

    const heroStats = getHeroEffectiveStats();
    
    // 2. SABİT SAVUNMAYI HESAPLA
    let effectiveDef = heroStats.def + (window.isHeroDefending ? window.heroDefenseBonus : 0);
    let finalDamage = Math.max(1, Math.floor(rawDamage - effectiveDef));

    // 3. SİPER (GUARD) KONTROLÜ - Yüzdesel Azaltma Burada Devreye Girer
    const guardEffect = hero.statusEffects.find(e => e.id === 'guard_active' && !e.waitForCombat);
    if (guardEffect) {
        // Hasarı yetenekteki değer kadar (%25) düşürür
        finalDamage = Math.floor(finalDamage * (1 - guardEffect.value));
    }
	
	StatsManager.trackDamageTaken(finalDamage);

    let fIdx = 0;
    function frame() {
        if (fIdx < attackFrames.length) {
            monsterDisplayImg.src = attackFrames[fIdx]; 
            if (fIdx === 1) { 
                // BLOK KONTROLÜ
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
                updateStats(); 
                // Tur bitince savunma durumunu sıfırla
                if (window.isHeroDefending) { window.isHeroDefending = false; window.heroDefenseBonus = 0; }
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
    // AIManager'ı çağırıp sonucu alıyoruz
    window.monsterNextAction = AIManager.determineAction(monster, hero, window.combatTurnCount);
    
    // UI İkonunu ayarla (Opsiyonel: Skill gelirse farklı ikon göster)
    showMonsterIntention(window.monsterNextAction);
};

window.startBattle = function(enemyType, isHardFromMap = false, isHalfTierFromMap = false) {
    const stats = ENEMY_STATS[enemyType]; if (!stats) return;
	
	let scaling = 1.0;
    // Data-driven kontrol
    if (stats.isBoss) {
        scaling = window.EventManager.getModifier('boss_scaling');
		// Log Mesajı
    if (scaling > 1) {
        const percent = Math.round((scaling - 1) * 100);
        writeLog(`⚠️ Boss Karanlık Zamanın Etkisiyle %${percent} GÜÇLENDİ!`);
    } else if (scaling < 1) {
        const percent = Math.round((1 - scaling) * 100);
        writeLog(`✨ Hazırlıksız Yakalandı! Boss normalden %${percent} daha ZAYIF.`);
    }
    }
	
	// --- DATA-DRIVEN Tier SCALE AYARI ---
    const SCALE_AMOUNT = 1.5; // Değiştirmesi çok kolay: Burayı 1.2 yaparsan %20 artar
    let multiplier = isHalfTierFromMap ? SCALE_AMOUNT : 1.0;

    // Yardımcı yuvarlama fonksiyonu (Statları tam sayıya çevirir)
    const scale = (val) => Math.ceil(val * multiplier);
	
    switchScreen(battleScreen);
    monster = { 
	name: enemyType, 
	maxHp: scale(stats.maxHp), 
	hp: scale(stats.maxHp), 
	attack: scale(stats.attack), 
	defense: scale(stats.defense), 
	isHard: isHardFromMap, 
	isBoss: stats.isBoss, 
	isHalfTier: isHalfTierFromMap,
	xp: stats.xp, 
	tier: stats.tier, 
	idle: stats.idle,  dead: stats.dead,  attackFrames: stats.attackFrames,
	skills: stats.skills,
    firstTurnAction: stats.firstTurnAction
	};
    
	if (isHalfTierFromMap) {
        writeLog(`⚠️ **Takviyeli Düşman**: Statlar %${(SCALE_AMOUNT-1)*100} arttırıldı!`);
    }
	
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
	
	// DÜZELTME: Ekrandaki "TUR" yazısını ANINDA 1 yap
    const turnDisplay = document.getElementById('turn-count-display');
    if (turnDisplay) {
        turnDisplay.textContent = window.combatTurnCount;
    }

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
		const stats = getHeroEffectiveStats(); // Güncel çarpanları al
    
		// RAGE REGEN UYGULA
		if (stats.rageRegen > 0) {
			const oldRage = hero.rage;
			hero.rage = Math.min(stats.maxRage, hero.rage + stats.rageRegen);
			if (hero.rage > oldRage) {
				writeLog(`✨ **MP Odaklanması**: +${stats.rageRegen} Öfke kazanıldı.`);
			}
		}
		
		// ---  BROŞ EFEKTLERİNİ TETİKLE (Sadece Kahraman Sırası Başında) ---
        hero.brooches.forEach((brooch, index) => {
            if (!brooch) return;

            if (!hero.broochCooldowns) hero.broochCooldowns = {};
            if (hero.broochCooldowns[index] === undefined) hero.broochCooldowns[index] = 0;

            // Eğer bekleme süresi bittiyse (veya 0 ise) çalıştır
            if (hero.broochCooldowns[index] <= 0) {
                window.executeBroochEffects(brooch);
                hero.broochCooldowns[index] = brooch.frequency; // Süreyi başa sar (1, 2 veya 3)
            }
            
            // Sayacı düşür
            hero.broochCooldowns[index]--;
        });
		
		
        // --- 1. TUR BAŞLANGICI VE BLOK/REGEN/ZEHİR İŞLEME ---
        window.combatTurnCount++;
        writeLog(`--- Tur ${window.combatTurnCount} ---`);
        if(turnCountDisplay) turnCountDisplay.textContent = window.combatTurnCount;

        // Blok Azalması
        if (window.heroBlock > 0) {
            window.heroBlock = Math.floor(window.heroBlock * 0.5);
            if(window.heroBlock === 0) writeLog(lang.log_shield_expired);
        }
        
        // Regen İşleme
        hero.statusEffects.filter(e => (e.id === 'regen' || e.id === 'percent_regen') && !e.waitForCombat).forEach((effect) => { 
            let healAmount = effect.id === 'regen' ? 10 : Math.floor(hero.hp * effect.value);
            if (healAmount < 1) healAmount = 1;
            const oldHp = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + healAmount); 
            showFloatingText(heroDisplayContainer, (hero.hp - oldHp), 'heal'); 
            writeLog(`✨ **${effect.name}**: ${hero.hp - oldHp} HP`);
        });

        // ZEHİR İŞLEME (Blok ve Defans Geçer)
        hero.statusEffects.filter(e => e.id === 'poison' && !e.waitForCombat).forEach((effect) => {
            hero.hp = Math.max(0, hero.hp - effect.value);
            showFloatingText(heroDisplayContainer, effect.value, 'damage');
            writeLog(`☣️ **Zehir Hasarı**: -${effect.value} HP`);
            animateDamage(true); 
        });
		
		if (checkGameOver()) return; 

        // --- 2. STUN KONTROLÜ (KRİTİK NOKTA) ---
        const stunEffect = hero.statusEffects.find(e => e.id === 'stun' && !e.waitForCombat);
        
        if (stunEffect) {
            writeLog(lang.log_stun_skip);
            showFloatingText(heroDisplayContainer, stunEffect.name, 'damage'); 
            
            // Süreleri azalt (Stun'ı 0 yapıp silecek)
            hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
            hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
            updateStats();

            // KRİTİK DÜZELTME: Sırayı devretmeden önce canavara YENİ hamle seçtiriyoruz!
            // Böylece canavar tekrar web_trap atmak yerine yeni bir zar atar.
            setTimeout(() => {
                window.isHeroTurn = false; 
                determineMonsterAction(); // Canavarın yeni niyetini (intention) belirle
                setTimeout(nextTurn, 1000); 
            }, 1000);
            
            return; // Fonksiyondan çık, butonları açma
        }

        // --- 3. NORMAL DURUM SÜRE AZALMASI ---
        hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
        hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
        updateStats(); 

        // Kahraman hamlesine hazır
        determineMonsterAction(); 
        showMonsterIntention(window.monsterNextAction); 
        toggleSkillButtons(false); 

    } else {
        // --- CANAVAR SIRASI ---
        toggleSkillButtons(true); 
        showMonsterIntention(null); 
        
        const monsterStun = hero.statusEffects.find(e => e.id === 'monster_stunned' && !e.waitForCombat);
        if (monsterStun) { 
            writeLog(lang.log_stun_skip);
            showFloatingText(document.getElementById('monster-display'), lang.f_stunned, 'damage'); 
            window.isHeroTurn = true; 
            setTimeout(nextTurn, 1000); 
            return;
        }

        setTimeout(() => {
            if (!checkGameOver()) {
                const action = window.monsterNextAction;
                if (action === 'attack') {
                    handleMonsterAttack(monster, hero); 
                } else if (action === 'defend') {
                    handleMonsterDefend(monster);
                } else {
                    const skill = ENEMY_SKILLS_DATABASE[action];
                    if (skill) {
                        const sLang = window.LANGUAGES[window.gameSettings.lang || 'tr'].enemy_skills[action];
                        showFloatingText(document.getElementById('monster-display'), sLang.name, 'skill');
                        skill.execute(monster, hero);
                        animateMonsterSkill(); 
                        updateStats();
                        window.isHeroTurn = true; // Yetenek bitince turu kahramana ver (Stun kontrolü yukarıda yapılacak)
                        setTimeout(nextTurn, 1000);
                    } else {
                        handleMonsterAttack(monster, hero);
                    }
                }
            }
        }, 600);
    }
};

// YARDIMCI FONKSİYONLAR:
function handleMonsterDefend(attacker) {
    const combatLang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    window.isMonsterDefending = true;
    window.monsterDefenseBonus = Math.floor(attacker.attack / 2) + 5;
    showFloatingText(document.getElementById('monster-display'), combatLang.monster_defend_text, 'heal');
    writeLog(`🛡️ **${attacker.name}**: ${combatLang.monster_log_defend} (+${window.monsterDefenseBonus} Defans).`);
    window.isHeroTurn = true;
    updateStats();
    setTimeout(nextTurn, 1000);
}

window.animateMonsterSkill = function() {
    // Yeşilden Mora geçiş için hue-rotate ve parlatma
    monsterDisplayImg.style.transition = "filter 0.3s ease";
    
    // hue-rotate(280deg) canavarı mor/pembe tonlarına sokar
    monsterDisplayImg.style.filter = 'brightness(2.5) saturate(1.5) hue-rotate(280deg) drop-shadow(0 0 15px #800080)';
    
    setTimeout(() => { 
        monsterDisplayImg.style.filter = 'none'; 
    }, 600);
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
        
        const rewards = window.LootManager.generateLoot(monster);
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

window.executeBroochEffects = function(brooch) {
    const stats = getHeroEffectiveStats();
    const rules = CLASS_CONFIG[hero.class];
    const display = document.getElementById('hero-display');
    const monsterDisplay = document.getElementById('monster-display');

    brooch.effects.forEach(eff => {
        switch(eff.id) {
            case "fixed_dmg":
                monster.hp = Math.max(0, monster.hp - eff.value);
                showFloatingText(monsterDisplay, eff.value, 'damage');
                writeLog(`📿 **Broş**: ${eff.value} hasar vuruldu.`);
                break;
                
            case "heal":
                const oldHp = hero.hp;
                hero.hp = Math.min(stats.maxHp, hero.hp + eff.value);
                showFloatingText(display, (hero.hp - oldHp), 'heal');
                writeLog(`📿 **Broş**: +${eff.value} HP yenilendi.`);
                break;

            case "resource_regen":
                const oldRage = hero.rage;
                hero.rage = Math.min(stats.maxRage, hero.rage + eff.value);
                writeLog(`📿 **Broş**: +${eff.value} Öfke kazanıldı.`);
                break;

            case "stat_scaling":
                // (Str, Int veya MP) * Çarpan (0.25, 0.5, 0.75)
                let scaleDmg = Math.floor(stats[eff.targetStat] * eff.value);
                if (scaleDmg < 1) scaleDmg = 1;
                monster.hp = Math.max(0, monster.hp - scaleDmg);
                showFloatingText(monsterDisplay, scaleDmg, 'damage');
                writeLog(`📿 **Broş**: ${eff.targetStat.toUpperCase()} bonusuyla ${scaleDmg} vurdun.`);
                break;

            case "curse_dmg":
                // Element Direnci * Çarpan (0.1, 0.2, 0.3)
                let elementRes = stats.resists[eff.targetElement] || 0;
                let curseDmg = Math.floor(elementRes * eff.value);
                if (curseDmg > 0) {
                    monster.hp = Math.max(0, monster.hp - curseDmg);
                    showFloatingText(monsterDisplay, curseDmg, 'damage');
                    writeLog(`📿 **Broş**: ${eff.targetElement.toUpperCase()} direncin ${curseDmg} hasara dönüştü.`);
                }
                break;

            case "curse_def":
                // Mevcut direnci %10-30 arası geçici olarak artırır (1 Tur)
                let resValue = stats.resists[eff.targetElement] || 0;
                let bonusRes = Math.floor(resValue * eff.value) + 5; // En az 5 direnç versin
                applyStatusEffect({ 
                    id: 'resist_' + eff.targetElement, 
                    name: 'Broş Koruması', 
                    value: bonusRes, 
                    turns: 1, 
                    resetOnCombatEnd: true 
                });
                writeLog(`📿 **Broş**: ${eff.targetElement.toUpperCase()} direnci arttı.`);
                break;

            case "static_def":
                // Sınıfın defans statı (Dex) * Çarpan
                // Barbar ve Magus için ana defans statı Dex'tir (defStats.dex)
                let defStatVal = stats.dex; 
                let bonusDef = Math.floor(defStatVal * eff.value);
                if (bonusDef > 0) {
                    applyStatusEffect({ 
                        id: 'def_up', 
                        name: 'Broş Zırhı', 
                        value: bonusDef, 
                        turns: 1, 
                        resetOnCombatEnd: true 
                    });
                }
                break;
        }
    });
    updateStats();
};

