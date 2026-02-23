// combat_manager.js - TÜM LOGLAR VE MEKANİKLER DAHİL TAM SÜRÜM

// Savaş Değişkenleri
window.heroDefenseBonus = 0; 
window.isHeroDefending = false;
window.monsterDefenseBonus = 0; 
window.isMonsterDefending = false; 
window.monsterNextAction = 'attack'; 
window.combatTurnCount = 1;
window.heroBlock = 0; 
window.isHeroTurn = false; 

window.applyStatusEffect = function(target, newEffect) {
    const isTargetHero = (target === hero);
	const lang = window.LANGUAGES[window.gameSettings.lang || 'tr']; // Dili al
    
    // --- KRİTİK FİX: İsim eksikse dil dosyasından tamamla ---
    if (!newEffect.name) {
        newEffect.name = lang.status[newEffect.id] || newEffect.id;
    }
    // -------------------------------------------------------
	
	// --- YENİ: FERVOR DEBUFF ENGELLEME (IMMUNITY) KONTROLÜ ---
    if (isTargetHero) {
        const hasImmunity = hero.statusEffects.some(e => e.id === 'immunity_active');
        // Eğer kahraman 'immunity' (bağışıklık) etkisindeyse ve gelen şey bir debuff ise engelle
        // (Buffları ve DoT hasar artışlarını engellememesi için id kontrolü yapılır)
        const debuffIds = ['stun', 'atk_half', 'debuff_webbed', 'poison', 'defense_zero', 'curse_damage'];
        if (hasImmunity && debuffIds.includes(newEffect.id)) {
            writeLog(`🛡️ **Bağışıklık**: ${newEffect.name} etkisi savuşturuldu!`);
            return; // Etkiyi uygulamadan çık
        }
    }
	
    const existingIndex = target.statusEffects.findIndex(e => e.id === newEffect.id && e.id !== 'block_skill');

    if (existingIndex !== -1) {
        const existing = target.statusEffects[existingIndex];
        
        if (newEffect.id === 'poison') {
            existing.value += newEffect.value;
            existing.turns += newEffect.turns;
            writeLog(`☣️ **${isTargetHero ? 'Zehir' : 'Düşman Zehiri'}** etkisi şiddetlendi! (Hasar: ${existing.value})`);
        } else {
            existing.turns = Math.max(existing.turns, newEffect.turns);
            if (newEffect.value !== undefined) {
                existing.value = Math.max(existing.value, newEffect.value);
            }
            writeLog(`✨ **${isTargetHero ? '' : target.name + ': '}** **${existing.name}** etkisi yenilendi.`);
        }
    } else {
        target.statusEffects.push(newEffect);
        // Yeni eklenen etkiler için log (isteğe bağlı, zaten genel log yetenekten geliyor)
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
	let currentElemDmg = { ...hero.elementalDamage };
    let flatAtkBonus = 0;  
    let flatDefBonus = 0;  
    let totalAtkMult = 1.0; 
    let totalDefMult = 1.0; // YENİ: Defans çarpanı eklendi
	

    // 2. EKİPMANLARI VE CHARMLARI TARA
     const allItems = [
        ...Object.values(hero.equipment), 
        ...hero.inventory.filter(i => i && i.type === "passive_charm"),
        ...hero.brooches.filter(i => i !== null) // KRİTİK: Tılsımlar buraya eklendi
    ];
    
    allItems.forEach(item => {
        if (item && item.stats) {
            for (const statKey in item.stats) {
                // Tılsımdan gelen direkt ATK ve DEF'i yakala
                if (statKey === 'atk') flatAtkBonus += item.stats[statKey];
                else if (statKey === 'def') flatDefBonus += item.stats[statKey];
                // Diğer statları topla (str, dex, int vb.)
                else if (s.hasOwnProperty(statKey)) s[statKey] += item.stats[statKey];
                // Dirençleri topla
                else if (currentResists.hasOwnProperty(statKey)) currentResists[statKey] += item.stats[statKey];
            }
        }
		// --- KRİTİK: TILSIMLARDAN GELEN ELEMENTAL HASAR BONUSUNU TOPLA ---
        if (item && item.type === "charm1" && item.bonuses) {
            item.bonuses.forEach(b => {
                if (b.type === 'elemDmg') currentElemDmg[b.element] += b.value;
            });
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

    // 4. HESAPLAMALARI YAP (DATA-DRIVEN)
    const rules = CLASS_CONFIG[hero.class];
    const sc = rules.scaling; // Scaling kurallarını al

    // HP ve RESOURCE (Mana/Rage) Hesapları
    const finalMaxHp = rules.baseHp + Math.floor(s[sc.hp.stat] * sc.hp.mult);
    const finalMaxRage = rules.baseResource + Math.floor(s[sc.resource.stat] * sc.resource.mult);
    
    // REGEN Hesabı
    const finalRageRegen = Math.floor(s[sc.regen.stat] * sc.regen.mult);

    // ATAK Hesabı
    let rawAtk = (hero.baseAttack || 10) + flatAtkBonus;
    rawAtk += Math.floor(s[sc.atk.stat] * sc.atk.mult); // Sınıfın atak statına göre (STR veya INT)
    let finalAtk = Math.floor(rawAtk * totalAtkMult);

    // DEFANS Hesabı
    let baseDefCalc = (hero.baseDefense || 0) + flatDefBonus;
    baseDefCalc += Math.floor(s[sc.def.stat] * sc.def.mult); // Sınıfın defans statına göre
    let finalDef = Math.floor(baseDefCalc * totalDefMult);

    // BLOK Hesabı
    const finalBlockPower = Math.floor(s[sc.block.stat] * sc.block.mult);

    // Pervasız Vuruş (Defansı 0 yapar)
    if (hero.statusEffects.some(e => e.id === 'defense_zero' && !e.waitForCombat)) {
        finalDef = 0;
    }
	
	hero.maxHp = finalMaxHp; 
    hero.maxRage = finalMaxRage;

    // 5. SONUCU DÖNDÜR
    return { 
        atk: Math.max(0, finalAtk), 
        def: Math.max(0, finalDef), 
        blockPower: Math.max(0, finalBlockPower),
        str: s.str, dex: s.dex, int: s.int, vit: s.vit, mp_pow: s.mp_pow,
        maxHp: finalMaxHp,
        maxRage: finalMaxRage,
        rageRegen: finalRageRegen,
        resists: currentResists,
        elementalDamage: currentElemDmg,
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
            const isCurrentlyFighting = document.getElementById('battle-screen').classList.contains('active');
			slot.setAttribute('draggable', !isCurrentlyFighting);
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
    if (!skillObj || checkIfSkillBlocked(skillKey)) return;

    // 1. Maliyet kontrolü
    if (hero.rage < (skillObj.data.rageCost || 0)) { 
        writeLog(`❌ Yetersiz Öfke!`); return; 
    }

    window.isHeroTurn = false; 
    toggleSkillButtons(true); 

    // 2. Maliyeti düş
    if(skillObj.data.rageCost > 0) hero.rage -= skillObj.data.rageCost;
    updateStats(); 

    // --- ARADIĞIN KODU TAM BURAYA YAZIYORUZ ---
    // Sadece Barbar ise ve yeteneğin bir scaling verisi (hasar potansiyeli) varsa buffer aç
    if (hero.class === 'Barbar' && skillObj.data.scaling) {
        window.rageBuffer = 0;
        window.isBufferingRage = true;
    } else {
        window.isBufferingRage = false; // Diğer durumlarda veya diğer sınıflarda kapalı tut
    }
    // ------------------------------------------

    let dmgPack = null;
    if (skillObj.data.scaling) {
        dmgPack = SkillEngine.calculate(hero, skillObj.data, monster);
    }

    // 3. Yeteneği çalıştır (Buffer açık olduğu için buradaki floating textler yutulacak)
    if (skillObj.onCast) skillObj.onCast(hero, monster, dmgPack);
};

// --- ANİMASYONLAR VE HASAR ---
window.animateCustomAttack = function(dmgPack, skillFrames, skillName) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    const globalLang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
	const classRules = CLASS_CONFIG[hero.class];

    // --- GÜVENLİK: Eğer dışarıdan liste gelmezse (null ise) sınıfın karelerini kullan ---
    const frames = (skillFrames && skillFrames.length > 0) ? skillFrames : classRules.visuals.attackFrames;
    // ---------------------------------------------------------------------------------
	
	
    let finalDmg = dmgPack.total;

    // 1. Wind Up (Kurulma) Kontrolü
    const windUpIdx = hero.statusEffects.findIndex(e => e.id === 'wind_up' && !e.waitForCombat);
    if (windUpIdx !== -1) { 
        finalDmg += hero.statusEffects[windUpIdx].value; 
        hero.statusEffects.splice(windUpIdx, 1); 
    }

    let fIdx = 0;
    function frame() {
        if (fIdx < frames.length) {
            heroDisplayImg.src = frames[fIdx]; 
            if (fIdx === 1 || frames.length === 1) { 
                // Hasarı uygula ve istatistikleri işle
                monster.hp = Math.max(0, monster.hp - finalDmg);
                StatsManager.trackDamageDealt(finalDmg);
				
				// --- YENİ: ZIRH DELME LOGU ---
				if (hero.statusEffects.some(e => e.id === 'ignore_def' && !e.waitForCombat)) {
				writeLog(`🔨 **Zırh Delme**: Düşmanın savunması yok sayıldı!`);
				}

                // --- ÖFKE BİRLEŞTİRME VE HESAPLAMA (MERKEZİ) ---
                const stats = getHeroEffectiveStats();
                const classRules = CLASS_CONFIG[hero.class];
                let totalRageToGain = 0;

                // A. Yetenek Dosyasından Gelen (Buffer'da bekleyen: örn +10 Rage)
                totalRageToGain += window.rageBuffer;

                // B. Sınıf Pasifi (Barbar vurduğu hasarın %25'ini alır)
                if (classRules && classRules.hitRageGain) {
                    const passiveGain = Math.ceil(finalDmg * classRules.hitRageGain);
                    totalRageToGain += passiveGain;
                }

                // C. Fury Active (Hiddet Yeteneği) Ekstrası
                const fury = hero.statusEffects.find(e => e.id === 'fury_active' && !e.waitForCombat);
                if (fury) { 
                    const furyGain = Math.floor(finalDmg * fury.value);
                    totalRageToGain += furyGain;
                    writeLog(lang.log_fury_gain); 
                }
                
                // !!! KRİTİK DÜZELTME BURASI !!!
                // Yazıyı ekrana basmadan hemen ÖNCE tamponu kapatıyoruz.
                // Böylece showFloatingText bu son yazıyı yutmayacak, ekrana basacak.
                window.isBufferingRage = false; 

                // Nihai Öfke Kazanımını Uygula ve Tek Floating Text Bas
                if (totalRageToGain > 0) {
                    hero.rage = Math.min(stats.maxRage, hero.rage + totalRageToGain);
                    showFloatingText(heroDisplayContainer, `+${totalRageToGain} Rage`, 'heal');
                    writeLog(`🔥 +${totalRageToGain} ${lang.log_rage_gain}`);
                }

                // Buffer'ı temizle
                window.rageBuffer = 0;
                // ----------------------------------------------

                // Görsel Efektler ve Loglama
                animateDamage(false); 
                showFloatingText(document.getElementById('monster-display'), finalDmg, 'damage');
                writeLog(`⚔️ **${skillName}**: ${monster.name} ${lang.log_hit_monster} **${finalDmg}** (Fiz: ${dmgPack.phys} | Ele: ${dmgPack.elem})`);
                
                // Düşman Kalkan Kırma
                if (window.isMonsterDefending) { 
                    window.isMonsterDefending = false; 
                    window.monsterDefenseBonus = 0; 
                }
                updateStats();
            }
            fIdx++; setTimeout(frame, 150); 
        } else {
            heroDisplayImg.src = classRules.visuals.idle; 
            window.isBufferingRage = false; // Güvenlik kilidi (animasyon biterken)
            if (!checkGameOver()) nextTurn(); 
        }
    }
    frame();
};


window.handleMonsterAttack = function(attacker, defender) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    // Temel saldırıyı SkillEngine'e "Sadece Fiziksel" olarak gönderiyoruz
    const basicAttackData = { damageSplit: { physical: 1.0 } };
    const dmgPack = SkillEngine.calculate(attacker, basicAttackData, defender);
    
    processMonsterDamage(attacker, dmgPack, stats.attackFrames.map(f => `images/${f}`));
};

// Canavar hasarını uygulayan merkezi fonksiyon (Bunu nextTurn içinde kullanacaksın)
function processMonsterDamage(attacker, dmgPack, attackFrames) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    let finalDamage = dmgPack.total;

    let fIdx = 0;
    function frame() {
        if (fIdx < attackFrames.length) {
            monsterDisplayImg.src = attackFrames[fIdx]; 
            if (fIdx === 1) { 
                // BLOK SİSTEMİ
                if (window.heroBlock > 0) {
                    if (window.heroBlock >= finalDamage) { 
                        window.heroBlock -= finalDamage; finalDamage = 0; 
                        showFloatingText(heroDisplayContainer, lang.f_block, 'heal'); 
                    } else { 
                        finalDamage -= window.heroBlock; window.heroBlock = 0; 
                    }
                }
                
                if (finalDamage > 0) { 
                hero.hp = Math.max(0, hero.hp - finalDamage); 
                StatsManager.trackDamageTaken(finalDamage);
                animateDamage(true); 
                showFloatingText(heroDisplayContainer, finalDamage, 'damage'); 
                writeLog(`⚠️ **${attacker.name}**: ${finalDamage} vurdu. (Fiz: ${dmgPack.phys} | Ele: ${dmgPack.elem})`);

                // --- GÜNCELLEME: SADECE SINIF KURALI VARSA KAYNAK EKLE ---
                const stats = getHeroEffectiveStats();
                const classRules = CLASS_CONFIG[hero.class];
                const gainOnHit = classRules.onHitRageGain || 0; // Kuralı oku (Barbar: 5, Magus: 0)

                if (gainOnHit > 0) {
                    hero.rage = Math.min(stats.maxRage, hero.rage + gainOnHit);
                    // İstersen darbe aldığında kazandığı öfkeyi de ekrana basabiliriz:
                    const currentLang = window.gameSettings.lang || 'tr';
                    const resLabel = window.LANGUAGES[currentLang][`resource_${classRules.resourceName}`];
                    showFloatingText(heroDisplayContainer, `+${gainOnHit} ${resLabel}`, 'heal');
                }
                // --------------------------------------------------------
				}
                updateStats(); 
                if (window.isHeroDefending) { window.isHeroDefending = false; window.heroDefenseBonus = 0; }
            }
            fIdx++; setTimeout(frame, 150); 
        } else {
            monsterDisplayImg.src = `images/${ENEMY_STATS[attacker.name].idle}`; 
            window.isHeroTurn = true; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    frame();
}

window.determineMonsterAction = function() {
    // AIManager'ı çağırıp sonucu alıyoruz
    window.monsterNextAction = AIManager.determineAction(monster, hero, window.combatTurnCount);
    
    // UI İkonunu ayarla (Opsiyonel: Skill gelirse farklı ikon göster)
    showMonsterIntention(window.monsterNextAction);
};

window.startBattle = function(enemyType, isHardFromMap = false, isHalfTierFromMap = false) {
    const stats = ENEMY_STATS[enemyType]; if (!stats) return;
	
	 // --- YENİ ELEMENTAL DİRENÇ HESAPLAMA SİSTEMİ ---
    const tribeData = window.TRIBE_BASES[stats.tribe] || { fire:0, cold:0, lightning:0, poison:0, curse:0 };
    const specificData = stats.specificResists || {};
    const elements = ['fire', 'cold', 'lightning', 'poison', 'curse'];
    
    // Rastgelelik çarpanı (Tier * 0.5)
    const randomScale = (stats.tier || 1) * 0.5;
    
    let finalMonsterResists = {};

    elements.forEach(ele => {
        // 1. Klanın temel değeri
        let base = tribeData[ele] || 0;
        
        // 2. Canavarın spesifik bonusu
        let spec = specificData[ele] || 0;
        
        // 3. Rastgele Zar (0 ile 10 arası, -5 ofset ile -5 ile +5 arası gibi de yapılabilir)
        // 0-10 arası ama weakness için - değer de alabilsin:
        // Mantık: (Rastgele -5 ile +5 arası) * Scale
        let randRoll = (Math.floor(Math.random() * 21) - 10); // -10 ile +10 arası zar
        let scaledRandom = Math.round(randRoll * randomScale);

        // Nihai Toplam
        finalMonsterResists[ele] = base + spec + scaledRandom;
    });
	
	  // Tier verisini sayıya çevir (B1 -> 4, B2 -> 8 gibi)
    let numericTier = stats.tier;
    if (typeof numericTier === 'string' && numericTier.startsWith('B')) {
        numericTier = parseInt(numericTier.replace('B', '')) * 4;
    }
	
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
	
	// --- DATA-DRIVEN TIER & HARD SCALE AYARI ---
    const HALF_TIER_SCALE = 1.5; // Yarım Tier (Elite) çarpanı
    const HARD_SCALE = 1.25;      // isHard (Strong) çarpanı
    
    let multiplier = 1.0;
    if (isHalfTierFromMap) multiplier *= HALF_TIER_SCALE; // x1.50
    if (isHardFromMap) multiplier *= HARD_SCALE;         // x1.25 (Yeni Eklendi!)

    // Yardımcı yuvarlama fonksiyonu (Statları tam sayıya çevirir)
    const scale = (val) => Math.ceil(val * multiplier * scaling);
	
    switchScreen(battleScreen);
    monster = { 
	name: enemyType, 
	tribe: stats.tribe,
    resists: finalMonsterResists,
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
    firstTurnAction: stats.firstTurnAction,
	statusEffects: [], // CANAVARIN KENDİ EFEKT DİZİSİ
	};
	
	console.log(`${monster.name} Dirençleri:`, monster.resists); // Debug için
    
	// --- LOGLAMA ---
	if (isHalfTierFromMap) {
        writeLog(`⚠️ **Takviyeli Düşman**: Statlar %50 arttırıldı!`);
    }
    if (isHardFromMap && !isHalfTierFromMap) {
        writeLog(`⚔️ **Güçlü Düşman**: ${monster.name} %25 daha dayanıklı ve sert vuruyor!`);
    }
	
	// Savaş başlangıcı bonusu (Örn: Stormreach ayında +10 öfke)
    const bonus = window.EventManager.getCombatBonus();
    hero.rage = Math.min(hero.maxRage, hero.rage + bonus.rage);

    if (scaling > 1) writeLog(`⚠️ Boss Karanlık Zamanın Etkisiyle Güçlendi! (x${scaling.toFixed(2)})`);
	
	const classRules = CLASS_CONFIG[hero.class];
    monsterDisplayImg.style.filter = 'none'; 
    monsterDisplayImg.style.opacity = '1';
    monsterDisplayImg.src = `images/${monster.idle}`;
    heroDisplayImg.src = classRules.visuals.idle;

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
		
		// DİL DESTEĞİNİ DOĞRU ÇEKELİM (Hata buradaydı)
		const currentLangCode = window.gameSettings.lang || 'tr';
		const globalLang = window.LANGUAGES[currentLangCode]; // Ana dil objesi (resource_mana burada)
		const combatLang = globalLang.combat; // Savaş metinleri burada

        // Blok Azalması
        if (window.heroBlock > 0) {
            window.heroBlock = Math.floor(window.heroBlock * 0.5);
            if(window.heroBlock === 0) writeLog(lang.log_shield_expired);
        }
        
		// --- YENİ: MANA KRİSTALİ PATLAMA MANTIĞI ---
		const crystalEffect = hero.statusEffects.find(e => e.id === 'mana_crystal' && !e.waitForCombat);
		if (crystalEffect && crystalEffect.turns === 1) {
			const stats = getHeroEffectiveStats();
			const classRules = CLASS_CONFIG[hero.class];
    
			// Doğru dil etiketini 'globalLang' üzerinden alıyoruz
			const resLabel = globalLang[`resource_${classRules.resourceName}`]; 

			hero.rage = Math.min(stats.maxRage, hero.rage + crystalEffect.value);
    
			// Görselleştirme
			showFloatingText(heroDisplayContainer, `+${crystalEffect.value} ${resLabel}`, 'heal');
			writeLog(`💎 **${crystalEffect.name}**: ${crystalEffect.value} ${resLabel} açığa çıktı!`);
    
			updateStats();
		}
		// -------------------------------------------
		
        // Regen İşleme
        hero.statusEffects.filter(e => (e.id === 'regen' || e.id === 'percent_regen') && !e.waitForCombat).forEach((effect) => { 
            let healAmount = effect.id === 'regen' ? 10 : Math.floor(hero.hp * effect.value);
            if (healAmount < 1) healAmount = 1;
            const oldHp = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + healAmount); 
            showFloatingText(heroDisplayContainer, (hero.hp - oldHp), 'heal'); 
            writeLog(`✨ **${effect.name}**: ${hero.hp - oldHp} HP`);
        });

        // --- BURAYA YAZIYORUZ: ZAMANLA HASAR (DoT) İŞLEME SİSTEMİ ---
        // Not: Eski 'poison' bloğunu silip yerine bunu koyuyoruz
        const dotTypes = ['poison', 'fire', 'cold', 'lightning', 'curse'];
        
        hero.statusEffects.filter(e => dotTypes.includes(e.id) && !e.waitForCombat).forEach((effect) => {
            // 1. Hasarı Uygula
            hero.hp = Math.max(0, hero.hp - effect.value);
            
            // 2. Görsel Efekt (Her zaman kırmızı 'damage' tipi fırlatırız ama logda ismini yazarız)
            showFloatingText(heroDisplayContainer, effect.value, 'damage');
            
            // 3. Loglama (Örn: Yanma: -5 HP)
            writeLog(`${effect.name}: -${effect.value} HP`);
            
            // 4. Sarsılma Efekti
            animateDamage(true); 
        });
        // ----------------------------------------------------------

		
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
		
		// --- KRİTİK EKLEME: CANAVAR EFEKT SÜRELERİNİ AZALT ---
        if (monster.statusEffects && monster.statusEffects.length > 0) {
            monster.statusEffects.forEach(e => {
                if (!e.waitForCombat) e.turns--;
            });
            // Süresi biten (0 olan) etkileri sil
            monster.statusEffects = monster.statusEffects.filter(e => e.turns > 0);
            updateStats(); // İkonları ve süreleri tazele
        }
        // ---------------------------------------------------

        
        const monsterStun = hero.statusEffects.find(e => e.id === 'monster_stunned' && !e.waitForCombat);
        if (monsterStun) { 
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            writeLog(lang.combat.log_stun_skip);
            showFloatingText(document.getElementById('monster-display'), lang.combat.f_stunned, 'damage'); 
            window.isHeroTurn = true; 
            setTimeout(nextTurn, 1000); 
            return;
        }

        setTimeout(() => {
            if (!checkGameOver()) {
                const action = window.monsterNextAction;
                const stats = ENEMY_STATS[monster.name];
                const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

                // A. DEFANS (Hala özel bir durum olduğu için ayrı tutuyoruz)
                if (action === 'defend') {
                    handleMonsterDefend(monster);
                } 
                // B. TÜM ATAKLAR VE SKİLLER (Artık hepsi paket üzerinden dönüyor)
                else {
                    const packet = EnemySkillEngine.resolve(monster, action);
                    
                    if (packet) {
                        const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
                        const classRules = CLASS_CONFIG[hero.class];
                        const resourceLabel = lang[`resource_${classRules.resourceName}`];

                        // --- GÜNCELLEME: SADECE TANIMLIYSA İSMİ GÖSTER ---
                        // Eğer attack1/attack2 için enemy_skills içinde bir 'name' yoksa undefined döner
                        const skillName = lang.enemy_skills[packet.id]?.name;
                        
                        // Eğer skillName varsa (yani özel bir isimse) mor yazıyı bas
                        if (skillName) {
                            writeLog(`⚠️ **${monster.name}**: ${skillName}!`);
                            showFloatingText(document.getElementById('monster-display'), skillName, 'skill');
                        }
                        // ------------------------------------------------

                        // Etki Yazısını Hazırla (basic_hit boş olduğu için burada takılmayacak)
                        let effectLabel = lang.enemy_effects[packet.text] || "";
                        
                        // Kelime Değişimi: Rage/Öfke -> Mana/Öfke 
                        effectLabel = effectLabel.replace(/Rage|Öfke/gi, resourceLabel);

                        // Sayı Değişimi: $1 -> 30
                        if (effectLabel.includes("$1") && packet.value) {
                            effectLabel = effectLabel.replace("$1", packet.value);
                        }

                        // --- GÜNCELLEME: Etki metni (effectLabel) boş değilse bas ---
                        if (effectLabel && effectLabel.trim() !== "") {
                            const floatingTarget = (packet.category === 'buff') ? document.getElementById('monster-display') : document.getElementById('hero-display');
                            const floatingType = (packet.category === 'buff') ? 'heal' : 'damage';
                            setTimeout(() => { 
                                showFloatingText(floatingTarget, effectLabel, floatingType); 
                            }, 500);
                        }
                        // -----------------------------------------------------------

                        // Öfke Azaltma ve İyileşme (Mevcut paket mantığın)
                        if (packet.rageReduction) { hero.rage = Math.max(0, hero.rage - packet.rageReduction); updateStats(); }
                        if (packet.healing > 0) {
                            monster.hp = Math.min(monster.maxHp, monster.hp + packet.healing);
                            showFloatingText(document.getElementById('monster-display'), packet.healing, 'heal');
                        }

                        // Statü Etkileri Uygulama (Mevcut paket mantığın)
                        if (packet.statusEffects) {
                            packet.statusEffects.forEach(eff => {
                                const targetChar = (packet.category === 'buff') ? monster : hero;
                                applyStatusEffect(targetChar, { id: eff.id, name: eff.name, value: eff.value, turns: eff.turns, resetOnCombatEnd: true });
                            });
                        }

                        // GÖRSEL VE HASAR UYGULAMA
                        if (packet.damage && packet.damage.total > 0) {
                            // Canavarın attackFrames'lerini kullanarak hasarı vur
                            processMonsterDamage(monster, packet.damage, stats.attackFrames.map(f => `images/${f}`));
                        } else {							
                            // Hasarsız yetenekse sadece parlat
                            animateMonsterSkill();
                            updateStats();
                            window.isHeroTurn = true;
                            setTimeout(nextTurn, 1000);
                        }
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
		const classRules = CLASS_CONFIG[hero.class];
        writeLog("💀 **Yenilgi**: Canın tükendi...");
        hero.hp = 0; updateStats(); heroDisplayImg.src = classRules.visuals.dead; 
		
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

        // Bosslar ve Hard (Turuncu çerçeveli) odalar 5 XP, normal odalar 4 XP verir
        const xpGainAmount = (monster.isHard || monster.isBoss) ? 5 : 4;
        gainXP(xpGainAmount);
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
	 // --- GÜVENLİK KONTROLÜ: Sadece Broşları İşle ---
    // Tılsımlar (charm1) pasif olduğu için burada bir 'effects' listesi barındırmazlar.
    if (!brooch || brooch.type !== "brooch" || !brooch.effects) return;
    // ----------------------------------------------
    // 1. GEREKLİ VERİLERİ VE DİL PAKETİNİ HAZIRLA
    const stats = getHeroEffectiveStats();
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    const display = document.getElementById('hero-display');
    const monsterDisplay = document.getElementById('monster-display');
    
    // 2. UZMANLIK VE TRİBE KONTROLLERİ
    const tribeName = lang.enemy_names[brooch.specialtyTribe] || brooch.specialtyTribe;
    const isSpecialist = (monster && monster.tribe === brooch.specialtyTribe);
    const damageMult = isSpecialist ? 2 : 1;

    brooch.effects.forEach(eff => {
        switch(eff.id) {
            case "fixed_dmg":
                let finalFixed = eff.value * damageMult; 
                monster.hp = Math.max(0, monster.hp - finalFixed);
                
                if (isSpecialist) {
                    // Sadece fixed_dmg için: [Hasar] + [UZMAN! (translations'tan)]
                    const specialistTag = lang.combat.f_specialist;
                    showFloatingText(monsterDisplay, `${finalFixed} ${specialistTag}`, 'skill');
                } else {
                    showFloatingText(monsterDisplay, finalFixed, 'damage');
                }
                
                const tribeName = lang.enemy_names[brooch.specialtyTribe] || brooch.specialtyTribe;
                writeLog(`📿 **Broş**: ${lang.items.eff_fixed_dmg} (${tribeName}) -> ${finalFixed} vurdu.`);
                break;
                
            case "stat_scaling":
                // Stat hasarı (Str, Int, Mp) uzmanlıktan etkilenmez.
                let scaleDmg = Math.floor(stats[eff.targetStat] * eff.value);
                if (scaleDmg < 1) scaleDmg = 1;
                monster.hp = Math.max(0, monster.hp - scaleDmg);
                showFloatingText(monsterDisplay, scaleDmg, 'damage');
                
                const statLabel = lang.items['brostat_' + eff.targetStat] || eff.targetStat.toUpperCase();
                writeLog(`📿 **Broş**: ${statLabel} bonusuyla ${scaleDmg} vurdun.`);
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
                
                // KRİTİK: Barbar buffer'ına girmemesi için isBufferingRage'i geçici kapatıp basıyoruz
                const wasBuffering = window.isBufferingRage;
                window.isBufferingRage = false;
                showFloatingText(display, `+${eff.value} Rage`, 'heal');
                window.isBufferingRage = wasBuffering;
                
                writeLog(`📿 **Broş**: +${eff.value} Öfke kazanıldı.`);
                break;
        }
    });
    updateStats();
};

