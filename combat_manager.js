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
        
        // --- ZEHİR: BİRİKMEYE DEVAM EDER (Log ve Mantık Korundu) ---
        if (newEffect.id === 'poison') {
            existing.value += newEffect.value;
            existing.turns += newEffect.turns;
            writeLog(`☣️ **${isTargetHero ? 'Zehir' : 'Düşman Zehiri'}** etkisi şiddetlendi! (Yeni Hasar: ${existing.value})`);
        } 
        // --- SİPER: SADECE TAZELEME YAPAR (YENİ MANTIK) ---
        else if (newEffect.id === 'guard_active') {
            // SİLME GEREKÇESİ: existing.value += newEffect.value; satırı silindi.
            // SEBEP: Siper her basışta defansı sonsuza kadar artırmamalı, formüldeki güncel değeri almalı.
            
            existing.value = newEffect.value; // Üzerine ekleme yapma, güncel formül değerini yaz
            existing.turns = newEffect.turns; // Süreyi de en baştan başlat (Tazele)
            
            writeLog(`🛡️ **${existing.name}** etkisi yenilendi. (+${existing.value} Savunma)`);
        }
        // --- DİĞER ETKİLER: MEVCUT MANTIĞI KORU ---
        else {
            existing.turns = Math.max(existing.turns, newEffect.turns);
            if (newEffect.value !== undefined) {
                existing.value = Math.max(existing.value, newEffect.value);
            }
            writeLog(`✨ **${isTargetHero ? '' : target.name + ': '}** **${existing.name}** etkisi yenilendi.`);
        }
    } else {
        target.statusEffects.push(newEffect);
        if (target !== hero) {
            const currentLang = window.gameSettings.lang || 'tr';
            const statusName = window.LANGUAGES[currentLang].status[newEffect.id] || newEffect.id;
            writeLog(`✨ **${target.name}**: ${statusName} etkisi kazandı!`);
        }
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

window.getExhaustionCost = function(skillData, usage) {
    let base = skillData.exhaustion || 0;
    
    // --- 1. DİNLEN (REST) ÖZEL KURALI: -5, -4, -3, -2, -1, 0 ---
    if (skillData.name === 'Dinlen') {
        // usage 0 ise -5, usage 1 ise -4...
        let val = base + usage; 
        return Math.min(0, val); 
    }

    // --- 2. DİĞER TÜM SKİLLER ---
    if (usage === 0 || usage === 1) return base;

    if (skillData.category === 'common' && skillData.tier === 1) {
        return base + usage;
    }

    let finalValue = base;
    // Diğer skiller için her kullanımda bir önceki değerin %50'si (Aşağı yuvarlayarak)
    for (let i = 1; i < usage; i++) {
        if (base > 0) finalValue = Math.floor(finalValue * 1.5);
        else finalValue = Math.floor(finalValue * 0.5);
    }

    return finalValue;
};

window.updateExhaustionUI = function() {
	if (hero.exhaustion < 0) hero.exhaustion = 0;
    // 1. Savaş Ekranı (Dikey)
    const sariDikey = document.getElementById('exhaustion-fill-sari');
    const morDikey = document.getElementById('exhaustion-fill-mor');
    const valText = document.getElementById('exhaustion-value');
    
    // 2. Stat Ekranı (Yatay)
    const sariYatay = document.getElementById('stat-exhaustion-bar-sari');
    const morYatay = document.getElementById('stat-exhaustion-bar-mor');
    const statText = document.getElementById('stat-exhaustion-text');

	if (hero.exhaustion > 200) hero.exhaustion = 200;
    const val = hero.exhaustion || 0;

    // --- A. SAYISAL GÜNCELLEME VE RENK DEĞİŞİMİ ---
    if (valText) {
        valText.textContent = Math.floor(val);
        // Savaş ekranındaki küçük rakamın rengini değiştir
        valText.style.color = val > 100 ? "#9b59b6" : "#f0e68c";
    }

    if (statText) {
        statText.textContent = `${Math.floor(val)} / 200`;
        // --- KRİTİK DÜZELTME: 100'den sonra XP MORU (#9b59b6), önce SARI (#ffd700) ---
        if (val > 100) {
            statText.style.color = "#9b59b6"; // XP Barı Moru
            statText.style.textShadow = "0 0 5px rgba(155, 89, 182, 0.5)"; // Hafif mor parlama
        } else {
            statText.style.color = "#ffd700"; // Altın Sarısı
            statText.style.textShadow = "none";
        }
    }

    // --- BARLARI DOLDURAN ASIL MOTOR ---
    const applyBarFill = (sari, mor, isHorizontal) => {
        if (!sari || !mor) return;

        if (val <= 100) {
            // 100 Altı
            if (isHorizontal) {
                sari.style.width = val + "%"; 
                sari.style.height = "100%"; // Yatayda yüksekliği fulle
                mor.style.width = "0%";
            } else {
                sari.style.height = val + "%";
                sari.style.width = "100%"; // Dikeyde genişliği fulle
                mor.style.height = "0%";
            }
        } else {
            // 100 Üstü
            const morVal = Math.min(100, val - 100);
            if (isHorizontal) {
                sari.style.width = "100%";
                mor.style.width = morVal + "%";
                mor.style.height = "100%";
            } else {
                sari.style.height = "100%";
                mor.style.height = morVal + "%";
                mor.style.width = "100%";
            }
        }
    };

    applyBarFill(sariDikey, morDikey, false);
    applyBarFill(sariYatay, morYatay, true);

    // --- C. "EXTINCT" (ÖLÜM) KONTROLÜ (DÖNGÜDEN ARINDIRILDI) ---
    if (val >= 200 && hero.hp > 0) { // Sadece yaşıyorsa tetikle
        const currentLang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
        hero.hp = 0;
        writeLog(`💀 **${currentLang.exhaustion_extinct}**: ${currentLang.dead_title}`);
        
        // DİKKAT: updateStats() burada ÇAĞRILMAZ, yoksa sonsuz döngüye girer!
        // Sadece can barını görsel olarak 0 yapıp oyunu bitiriyoruz.
        const hpBar = document.getElementById('hero-hp-bar');
        if(hpBar) hpBar.style.width = "0%";
        
        checkGameOver();
    }
	window.refreshSkillExhaustionBadges(); // <--- RENKLERİN DEĞİŞMESİ İÇİN BURADA DA OLMALI
};

window.refreshSkillExhaustionBadges = function() {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    const label = lang.exhaustion_short;

    document.querySelectorAll('.skill-slot').forEach(slot => {
        const key = slot.dataset.skillKey;
        if (!key) return;
        const skillObj = SKILL_DATABASE[key];
        if (skillObj.data.type === 'passive') return;

        // --- GÜNCELLEME: Doğru kullanımı gönderiyoruz ---
        const usage = (hero.skillUsage && hero.skillUsage[skillObj.data.id || key]) ? hero.skillUsage[skillObj.data.id || key] : 0;
        const nextCost = window.getExhaustionCost(skillObj.data, usage);

        let badge = slot.querySelector('.skill-exhaust-badge');
        if (!badge) {
            badge = document.createElement('div');
            badge.className = 'skill-exhaust-badge';
            slot.appendChild(badge);
        }
        badge.textContent = `${label}${nextCost > 0 ? "+" : ""}${nextCost}`;
    });

    const skillBook = document.getElementById('skill-book-screen');
    if (skillBook && !skillBook.classList.contains('hidden')) {
        renderSkillBookList();
    }
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
	const colorCounts = {}; 
	
	 // --- YENİ: YORGUNLUK DEBUFF HESAPLAYICI ---
    let exhaustionPenaltyMult = 1.0;
    let flatExhaustDefPenalty = 0; // 50+ sonrası statik defans kaybı
    let flatExhaustAtkPenalty = 0; // 100+ sonrası statik atak kaybı

    if (hero.exhaustion >= 50) {
        exhaustionPenaltyMult = 0.9;
        // 50'den sonra her 10 yorgunlukta defans kaybı artar: 50 -> -3, 60 -> -4, 70 -> -5...
        flatExhaustDefPenalty = 3 + Math.floor((hero.exhaustion - 50) / 10);
    }
    
    if (hero.exhaustion >= 70) {
        exhaustionPenaltyMult = 0.8;
    }
    
    if (hero.exhaustion >= 100) {
        exhaustionPenaltyMult = 0.7;
        // 100'den sonra her 10 yorgunlukta atak kaybı: 100 -> -1, 110 -> -2, 120 -> -3...
        flatExhaustAtkPenalty = 1 + Math.floor((hero.exhaustion - 100) / 10);
    }

    totalAtkMult *= exhaustionPenaltyMult;
    totalDefMult *= exhaustionPenaltyMult;
    // ------------------------------------------
	
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
		// --- YENİ: ZIRH VE SET TAKİBİ (ADIM 3B) ---
        if (item && item.subtype === "jewelry") {
            // 1. Sabit Zırhı (implicitDef) ekle
            if (item.implicitDef) flatDefBonus += item.implicitDef;
            
            // 2. Set Rengini (mainStat türünü) say
            if (item.color) {
                colorCounts[item.color] = (colorCounts[item.color] || 0) + 1;
            }
        }
        // -----------------------------------------
    });
	
	// --- YENİ: SET BONUSU UYGULAMA (ADIM 3C - STAT BAZLI) ---
    let totalRegenMult = 1.0; // Sınıf bonusu için çarpan

    for (const statKey in colorCounts) {
        const count = colorCounts[statKey];
        
        // 3 veya 6 parça bonusu (Doğrudan stat artışı)
        if (count >= 3) {
            let bonusAmount = (count >= 6) ? 6 : 3;
            // s.str, s.int vb. değerlere direkt ekle
            if (s.hasOwnProperty(statKey)) {
                s[statKey] += bonusAmount;
            }
        }

        // 6 parça tamamlandıysa Sınıf Bonusu (Regen)
        if (count >= 6) {
            if (hero.class === 'Barbar') totalRegenMult += 0.20;
            if (hero.class === 'Magus') totalRegenMult += 0.50;
        }
    }
    // -------------------------------------------

    // 3. STATUS EFFECT'LERİ TARA (Buff/Debuff)
    hero.statusEffects.forEach(e => {
        if (!e.waitForCombat) {
            if (e.id === 'str_up') s.str += e.value;
            if (e.id === 'dex_up') s.dex += e.value;
            if (e.id === 'int_up') s.int += e.value;
            if (e.id === 'atk_up') flatAtkBonus += e.value;
            if (e.id === 'def_up') flatDefBonus += e.value;
			if (e.id === 'guard_active') flatDefBonus += e.value; 
            
            if (e.id === 'atk_up_percent') totalAtkMult += e.value;
            if (e.id === 'atk_half') totalAtkMult *= 0.5;
            
            // ÖRÜMCEK AĞI DEBUFFI (Burada artık hata vermez)
            if (e.id === 'debuff_webbed') {
                totalAtkMult *= (1 - e.value); // Atak %30 azalır
                totalDefMult *= (1 - e.value); // Defans %30 azalır
            }
            if (e.id === 'resist_fire') currentResists.fire += e.value;
			// --- YENİ: BLOOD LUST GİDEREK ARTAN ZAYIFLIK ---
            if (e.id === 'blood_lust_debuff') {
                // turns 3 iken (1. Tur): %20 kayıp (0.8)
                // turns 2 iken (2. Tur): %40 kayıp (0.6)
                let severity = (e.turns === 3) ? 0.20 : 0.40;
                totalAtkMult *= (1 - severity);
                totalDefMult *= (1 - severity);
            }
        }
    });
	
	// --- YENİ: BLOOD MARK DİRENÇ SIFIRLAMA ---
    const isBloodMarkActive = hero.statusEffects.some(e => e.id === 'blood_mark_active');
    if (isBloodMarkActive) {
        // Tüm dirençleri oda sonuna kadar 0 kabul et
        currentResists = { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 };
    }
	
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
    const finalMaxHp = rules.baseHp + (hero.permanentHpBonus || 0) + Math.floor(s[sc.hp.stat] * sc.hp.mult);
    const finalMaxRage = rules.baseResource + Math.floor(s[sc.resource.stat] * sc.resource.mult);
    
    // REGEN Hesabı
    const finalRageRegen = Math.floor((s[sc.regen.stat] * sc.regen.mult) * totalRegenMult);

    // ATAK: Önce çarpanı uygula, sonra Exhaustion statik cezasını çıkar
    let rawAtk = (hero.baseAttack || 10) + flatAtkBonus + Math.floor(s[sc.atk.stat] * sc.atk.mult);
    let finalAtk = Math.floor(rawAtk * totalAtkMult) - flatExhaustAtkPenalty;

    // DEFANS: Önce çarpanı uygula, sonra Exhaustion statik cezasını çıkar
    let baseDefCalc = (hero.baseDefense || 0) + flatDefBonus + Math.floor(s[sc.def.stat] * sc.def.mult);
    let finalDef = Math.floor(baseDefCalc * totalDefMult) - flatExhaustDefPenalty;


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
        def: finalDef, 
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
	window.refreshSkillExhaustionBadges(); // <--- SAVAŞ BAŞINDA ÇİZ
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
                // --- GÜNCELLEME: RAKAM GİZLEME KONTROLÜ ---
                // Eğer hideNumber true ise boş metin bas, değilse rakamı yaz
                if (cdEffect.hideNumber) {
                    cdText.textContent = ""; 
                } else {
                    cdText.textContent = cdEffect.turns > 1 ? cdEffect.turns - 1 : "⌛";
                }
                // -----------------------------------------
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

    // --- KRİTİK DÜZELTME: TÜM SINIFLAR İÇİN BUFFER'I AÇ ---
    // Yeteneğin bir hasar çarpanı varsa, gelen kaynak yazılarını biriktir
    if (skillObj.data.scaling) {
        window.rageBuffer = 0;
        window.isBufferingRage = true;
    } else {
        window.isBufferingRage = false; 
    }
    // ----------------------------------------------------

    let dmgPack = null;
    if (skillObj.data.scaling) {
        dmgPack = SkillEngine.calculate(hero, skillObj.data, monster);
    }
	
	// --- YORGUNLUK ARTIŞI ---
    const sID = skillObj.data.id || skillKey;
    
    if (skillObj.data.type !== 'passive') {
        if (!hero.skillUsage) hero.skillUsage = {};
        if (hero.skillUsage[sID] === undefined) hero.skillUsage[sID] = 0;

        // --- YENİ MANTIK: Kullanmadan önce maliyeti hesapla ---
        const exGain = window.getExhaustionCost(skillObj.data, hero.skillUsage[sID]);
        
        hero.exhaustion = Math.max(0, hero.exhaustion + exGain); 
        hero.skillUsage[sID]++; // Artık her kullanımda kesinlikle artar
        
        window.updateExhaustionUI(); 
        if (window.refreshSkillExhaustionBadges) window.refreshSkillExhaustionBadges();
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
				
				// !!! YENİ KONTROL: İşlem başlamadan önceki mevcut miktarı sakla !!!
                const rageAtStart = hero.rage;

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
				
				// D. YENİ: BLOOD MARK CAN ÇALMA (LIFE STEAL) ---
                const bloodMark = hero.statusEffects.find(e => e.id === 'blood_mark_active');
                if (bloodMark && finalDmg > 0) {
                    // Mevcut can çalma oranını (value) al
                    const stolen = Math.floor(finalDmg * bloodMark.value);
                    
                    if (stolen > 0) {
                        const oldHp = hero.hp;
                        // O anki güncel maxHp'yi al (Statlardan)
                        const statsForHeal = getHeroEffectiveStats();
                        
                        hero.hp = Math.min(statsForHeal.maxHp, hero.hp + stolen);
                        
                        // Kazanılan canı sezonluk toplama ekle (NaN korumasıyla)
                        hero.sessionLifeStolen = (hero.sessionLifeStolen || 0) + stolen;
                        
                        showFloatingText(heroDisplayContainer, stolen, 'heal');
                        writeLog(`🩸 **Blood Mark**: ${stolen} can sömürdün! (Toplam: ${hero.sessionLifeStolen})`);
                    }
                }
                
                // !!! KRİTİK DÜZELTME BURASI !!!
                // Yazıyı ekrana basmadan hemen ÖNCE tamponu kapatıyoruz.
                // Böylece showFloatingText bu son yazıyı yutmayacak, ekrana basacak.
                window.isBufferingRage = false; 

                // Nihai Öfke Kazanımını Uygula ve Tek Floating Text Bas
                if (totalRageToGain > 0) {
                    hero.rage = Math.min(stats.maxRage, hero.rage + totalRageToGain);
                    
                    // --- GÖRSEL İYİLEŞTİRME: Sadece bar vuruş öncesi dolu değilse yazı bas ---
                    if (rageAtStart < stats.maxRage) {
                        showFloatingText(heroDisplayContainer, `+${totalRageToGain} Rage`, 'heal');
                        writeLog(`🔥 +${totalRageToGain} ${lang.log_rage_gain}`);
                    }
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
				if (finalDmg > 0) {
				window.isMonsterDefending = false; 
				window.monsterDefenseBonus = 0; 
				window.monsterDefenseTurns = 0;
				writeLog(`🛡️ **${monster.name}** ${lang.log_shield_break}`);
			} else if (finalDmg > 0) {
				writeLog(`🛡️ **${monster.name}** savunması darbeyi emdi! (Kalkan Kırılmadı)`);
			}
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
	// --- KRİTİK FİX: stats değişkeni burada tanımlanmalı ---
    const stats = ENEMY_STATS[attacker.name]; 
    if (!stats) return;
    // -------------------------------------------------------

    // Temel saldırıyı SkillEngine'e "Sadece Fiziksel" olarak gönderiyoruz
    const basicAttackData = { damageSplit: { physical: 1.0 } };
    const dmgPack = SkillEngine.calculate(attacker, basicAttackData, defender);
    
    processMonsterDamage(attacker, dmgPack, null); 
};

// Canavar hasarını uygulayan merkezi fonksiyon (Bunu nextTurn içinde kullanacaksın)
function processMonsterDamage(attacker, dmgPack) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    let finalDamage = dmgPack.total;

     // 1. Animasyonu Başlat
    monsterDisplayImg.classList.remove('monster-attack-anim');
    void monsterDisplayImg.offsetWidth; // Sihirli satır: DOM'u zorla yeniler (Reset)
    monsterDisplayImg.classList.add('monster-attack-anim');

    // Darbe anını animasyonun en eğik olduğu ana (220ms) denk getiriyoruz
    setTimeout(() => {
        // Blok ve Hasar Hesaplama
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
            writeLog(`⚠️ **${attacker.name}**: ${finalDamage} vurdu.`);

            // Kaynak Kazanımı (Barbar/Magus)
            const stats = getHeroEffectiveStats();
            const classRules = CLASS_CONFIG[hero.class];
            let gainOnHit = classRules.onHitRageGain || 0;
            if (hero.statusEffects.some(e => e.id === 'spirit_shield_active')) gainOnHit += 10;

            if (gainOnHit > 0 && hero.hp > 0) {
                hero.rage = Math.min(stats.maxRage, hero.rage + gainOnHit);
                updateStats();
            }
        }
        updateStats(); 
        if (window.isHeroDefending) { window.isHeroDefending = false; window.heroDefenseBonus = 0; }
		
		if (window.monsterDefenseTurns > 0) {
			window.monsterDefenseTurns--;
			if (window.monsterDefenseTurns === 0) {
				window.isMonsterDefending = false;
				window.monsterDefenseBonus = 0;
				writeLog(`🛡️ **${monster.name}** savunma duruşunu bozdu.`);
			}
		}
        
    }, 250); 

    // Sıra devri (Animasyon bittikten biraz sonra)
    setTimeout(() => {
        window.isHeroTurn = true; 
        if (!checkGameOver()) nextTurn(); 
    }, 550); 
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
    
    let hpAtkMultiplier = 1.0 * scaling;
    if (isHalfTierFromMap) hpAtkMultiplier *= HALF_TIER_SCALE; // x1.50
    if (isHardFromMap) hpAtkMultiplier *= HARD_SCALE;         // x1.25 (Yeni Eklendi!)

    // Defans ve Diğerleri için Çarpan (isHard hariç tutulur)
    let otherMultiplier = 1.0 * scaling;
    if (isHalfTierFromMap) otherMultiplier *= HALF_TIER_SCALE;

    // Yardımcı yuvarlama fonksiyonları
    const scaleHPAtk = (val) => Math.ceil(val * hpAtkMultiplier);
    const scaleOther = (val) => Math.ceil(val * otherMultiplier);
	
    switchScreen(battleScreen);
	hero.skillUsage = {}; // Skillerin fight içi artışlarını sıfırla
    hero.autoRestCount = 0; // Auto-rest ceza sayacını sıfırla
    window.updateExhaustionUI(); // Barı başlangıç değerine getir
	
	if (monsterDisplayImg) {
        monsterDisplayImg.classList.remove('monster-attack-anim');
        // Resmin yamuk kalmaması için transformu da sıfırlayalım
        monsterDisplayImg.style.transform = "translateX(-50%) rotate(0deg)";
    }
    // ----------------------------------
	
    monster = { 
        name: enemyType, 
        tribe: stats.tribe,
        resists: finalMonsterResists,
        // --- KRİTİK DEĞİŞİKLİK: SADECE HP VE ATK HARD MULTIPLIER ALIR ---
        maxHp: scaleHPAtk(stats.maxHp), 
        hp: scaleHPAtk(stats.maxHp), 
        attack: scaleHPAtk(stats.attack), 
        defense: scaleOther(stats.defense), // Defans isHard'dan etkilenmez
        // --------------------------------------------------------------
        isHard: isHardFromMap, 
        isBoss: stats.isBoss, 
        isHalfTier: isHalfTierFromMap,
        xp: stats.xp, 
        tier: stats.tier, 
        idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames,
        skills: stats.skills,
        firstTurnAction: stats.firstTurnAction,
        statusEffects: [], 
		
	};
	
	monsterDisplayImg.src = `images/${monster.idle}`;
    monsterDisplayImg.style.filter = 'none'; 
    monsterDisplayImg.style.opacity = '1';
	
	// --- LOGLAMA VE GÖRSEL HAZIRLIKLAR ---
	if (isHalfTierFromMap) {
        writeLog(`⚠️ **Takviyeli Düşman**: Statlar %50 arttırıldı!`);
    }
    if (isHardFromMap && !isHalfTierFromMap) {
        writeLog(`⚔️ **Güçlü Düşman**: ${monster.name} hasarı ve canı %25 arttı!`);
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

    // --- GLOBAL DİL VE KURALLAR TANIMLAMASI ---
    const currentLangCode = window.gameSettings.lang || 'tr';
    const globalLang = window.LANGUAGES[currentLangCode]; 
    const combatLang = globalLang.combat; 
    const classRules = CLASS_CONFIG[hero.class];
    
    if (window.isHeroTurn) {
		const stats = getHeroEffectiveStats(); // Güncel çarpanları al
    
		// RAGE REGEN UYGULA
		if (stats.rageRegen > 0) {
			const oldRage = hero.rage;
			hero.rage = Math.min(stats.maxRage, hero.rage + stats.rageRegen);
			if (hero.rage > oldRage) {
				writeLog(`✨ **MP Odaklanması**: +${stats.rageRegen} ${globalLang[`resource_${classRules.resourceName}`]} kazanıldı.`);
			}
		}

        // --- 1. TUR BAŞLANGICI VE BLOK/REGEN/ZEHİR İŞLEME ---
        window.combatTurnCount++;
        writeLog(`--- Tur ${window.combatTurnCount} ---`);
        if(turnCountDisplay) turnCountDisplay.textContent = window.combatTurnCount;
		
		// --- BLOOD MARK SÖNÜMLEME MANTIĞI (KORUNDU) ---
        const bm = hero.statusEffects.find(e => e.id === 'blood_mark_active');
        if (bm && window.combatTurnCount > 6) {
            bm.value = Math.max(0, bm.value - 0.05); 
            if (bm.value > 0) {
                writeLog(`📉 **Blood Mark**: Kan damgası zayıflıyor... (Yeni Oran: %${Math.round(bm.value * 100)})`);
            }
        }
		
		const currentLang = window.LANGUAGES[window.gameSettings.lang || 'tr'];

        // --- 1. YORGUNLUK HASARI (TICK) ---
        if (hero.exhaustion > 100) {
            let exDmg = 0;
            if (hero.exhaustion <= 150) {
                // 100-150 arası: Her 2 dolumda 1 damage
                exDmg = Math.floor((hero.exhaustion - 100) / 2);
            } else {
                // 150-200 arası: 25 baz + her 1 dolumda 2 damage
                exDmg = 25 + Math.floor((hero.exhaustion - 150) * 2);
            }

            if (exDmg > 0) {
                hero.hp = Math.max(0, hero.hp - exDmg);
                showFloatingText(heroDisplayContainer, exDmg, 'damage');
                writeLog(currentLang.log_exhaustion_damage.replace("$1", exDmg));
            }
        }

        // --- 2. AUTO-REST KONTROLÜ (FAILSAFE) ---
        const activeSkills = hero.equippedSkills.filter(s => s !== null && s !== 'rest');
        
        const canUseAnyAttack = activeSkills.some(key => {
            const s = SKILL_DATABASE[key];
            const isBlocked = hero.statusEffects.some(e => e.id === 'block_skill' && e.blockedSkill === key && !e.waitForCombat);
            return hero.rage >= s.data.rageCost && !isBlocked;
        });

        if (!canUseAnyAttack && activeSkills.length > 0) {
            hero.autoRestCount++;
            let exChange = 0;
            
            if (hero.autoRestCount === 1) exChange = -2;
            else if (hero.autoRestCount === 2) exChange = -1;
            else if (hero.autoRestCount === 3) exChange = 0;
            else exChange = Math.pow(2, hero.autoRestCount - 4);

            hero.exhaustion = Math.max(0, hero.exhaustion + exChange);
            const minCostNeeded = Math.min(...activeSkills.map(s => SKILL_DATABASE[s].data.rageCost));
            hero.rage = Math.max(hero.rage, minCostNeeded); 


            const arenaCenter = document.getElementById('arena-center-notif');
            writeLog(globalLang.log_forced_rest.replace("$1", (exChange >= 0 ? "+" + exChange : exChange)));
            setTimeout(showFloatingText(arenaCenter, globalLang.exhaustion_out_of_breath, 'damage'), 1500);
            
            updateStats();
            window.updateExhaustionUI();
        }
			
        // Blok Azalması
        if (window.heroBlock > 0) {
            window.heroBlock = Math.floor(window.heroBlock * 0.5);
            if(window.heroBlock === 0) writeLog(combatLang.log_shield_expired);
        }
        
		// --- YENİ: MANA KRİSTALİ PATLAMA MANTIĞI (KORUNDU) ---
		const crystalEffect = hero.statusEffects.find(e => e.id === 'mana_crystal' && !e.waitForCombat);
		if (crystalEffect && crystalEffect.turns === 1) {
			const resLabel = globalLang[`resource_${classRules.resourceName}`]; 
			hero.rage = Math.min(stats.maxRage, hero.rage + crystalEffect.value);
			showFloatingText(heroDisplayContainer, `+${crystalEffect.value} ${resLabel}`, 'heal');
			writeLog(`💎 **${crystalEffect.name}**: ${crystalEffect.value} ${resLabel} açığa çıktı!`);
			updateStats();
		}
		
        // --- DÜZELTİLDİ: DİNAMİK REGEN (İYİLEŞME) İŞLEME ---
        hero.statusEffects.filter(e => (e.id === 'regen' || e.id === 'percent_regen') && !e.waitForCombat).forEach((effect) => { 
            let healAmount = (effect.id === 'regen') ? (effect.value || 10) : Math.floor(hero.hp * effect.value);
            if (healAmount < 1) healAmount = 1;
            const oldHp = hero.hp;
            hero.hp = Math.min(stats.maxHp, hero.hp + healAmount); 
            if (hero.hp > oldHp) {
                showFloatingText(heroDisplayContainer, (hero.hp - oldHp), 'heal'); 
                writeLog(`✨ **${effect.name}**: ${hero.hp - oldHp} HP yenilendi.`);
            }
        });

		// --- 2. BROŞLARI SIRALI TETİKLE (Kümülatif Gecikme) ---
        let currentBroochDelay = 500; 
        hero.brooches.forEach((brooch) => {
            if (!brooch) return;
            if (!hero.broochCooldowns) hero.broochCooldowns = {};
            const bIndex = hero.brooches.indexOf(brooch);
            if (hero.broochCooldowns[bIndex] === undefined) hero.broochCooldowns[bIndex] = 0;

            if (hero.broochCooldowns[bIndex] <= 0) {
                window.executeBroochEffects(brooch, currentBroochDelay);
                currentBroochDelay += 800; 
                hero.broochCooldowns[bIndex] = brooch.frequency;
            }
            hero.broochCooldowns[bIndex]--;
        });

        // --- 3. DoT İŞLEME (Tüm broşlar bittikten sonra başlar) ---
        const dotStartTime = currentBroochDelay + 400; 
        setTimeout(() => {
            const dotTypes = ['poison', 'fire', 'cold', 'lightning', 'curse', 'bleed'];
            hero.statusEffects.filter(e => dotTypes.includes(e.id) && !e.waitForCombat).forEach((effect, idx) => {
                setTimeout(() => {
                    hero.hp = Math.max(0, hero.hp - effect.value);
                    showFloatingText(heroDisplayContainer, effect.value, 'damage');
                    writeLog(`${effect.name}: -${effect.value} HP`);
                    animateDamage(true); 
                    updateStats();
                }, idx * 400);
            });
        }, dotStartTime);

        // --- 4. TUR SONU VE KONTROLLER (Gecikmeli) ---
        const dotCount = hero.statusEffects.filter(e => ['poison', 'fire', 'cold', 'lightning', 'curse', 'bleed'].includes(e.id)).length;
        const totalWaitTime = dotStartTime + (dotCount * 450) + 200;

        setTimeout(() => {
            if (checkGameOver()) return; 

            // --- STUN KONTROLÜ (GÜNCELLEME: Intention buraya eklendi) ---
            const stunEffect = hero.statusEffects.find(e => e.id === 'stun' && !e.waitForCombat);
            if (stunEffect) {
                writeLog(combatLang.log_stun_skip);
                showFloatingText(heroDisplayContainer, stunEffect.name, 'damage'); 
                
                hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
                hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
                
                window.isHeroTurn = false; 
                determineMonsterAction(); // Düşman ne yapacağını seçer
                showMonsterIntention(window.monsterNextAction); // Niyeti gösterir (Kılıç/Yetenek vb.)
                
                updateStats();
                setTimeout(nextTurn, 1000); // Sırayı canavara devreder
                return;
            }

            // Normal durum süre azaltması
            hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
            hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
            
            determineMonsterAction(); 
            showMonsterIntention(window.monsterNextAction); 
            toggleSkillButtons(false); 
            updateStats();
        }, Math.max(2000, totalWaitTime));

    } else {
        // --- CANAVAR SIRASI ---
        toggleSkillButtons(true); 
        showMonsterIntention(null); 
		
		/// KRİTİK: DoT işlemlerini ve hamleyi setTimeout içine alıyoruz
        setTimeout(() => {
            if (!checkGameOver()) {
                
                // --- 1. ÖNCE CANAVAR ÜZERİNDEKİ DoT (KANAMA/ZEHİR) İŞLE ---
                const monsterDoTTypes = ['bleed', 'poison', 'fire', 'curse'];
                monster.statusEffects.filter(e => monsterDoTTypes.includes(e.id) && !e.waitForCombat).forEach((effect, index) => {
                    setTimeout(() => {
                        monster.hp = Math.max(0, monster.hp - effect.value);
                        showFloatingText(document.getElementById('monster-display'), effect.value, 'damage');
                        writeLog(`🩸 **${monster.name}**: ${effect.name} (-${effect.value} HP)`);
                        updateStats();
                    }, index * 300); 
                });

                if (checkGameOver()) return;
		
                // --- 2. CANAVAR EFEKT SÜRELERİNİ AZALT ---
                if (monster.statusEffects && monster.statusEffects.length > 0) {
                    monster.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
                    monster.statusEffects = monster.statusEffects.filter(e => e.turns > 0);
                    updateStats(); 
                }

                // --- 3. CANAVAR SERSEMLEME KONTROLÜ ---
                const monsterStun = hero.statusEffects.find(e => e.id === 'monster_stunned' && !e.waitForCombat);
                if (monsterStun) { 
                    writeLog(combatLang.log_stun_skip);
                    showFloatingText(document.getElementById('monster-display'), combatLang.f_stunned, 'damage'); 
                    window.isHeroTurn = true; 
                    setTimeout(nextTurn, 1000); 
                    return;
                }

                // --- 4. CANAVAR ASIL HAMLESİNİ YAPIYOR ---
                setTimeout(() => {
                    if (!checkGameOver()) {
                        const action = window.monsterNextAction;
                        const stats = ENEMY_STATS[monster.name];

                        if (action === 'defend') {
                            handleMonsterDefend(monster);
                        } 
                        else {
                            const packet = EnemySkillEngine.resolve(monster, action);
                            if (packet) {
                                const resourceLabel = globalLang[`resource_${classRules.resourceName}`];

                                // Yetenek İsmi Gösterimi
                                const skillName = globalLang.enemy_skills[packet.id]?.name;
                                if (skillName) {
                                    writeLog(`⚠️ **${monster.name}**: ${skillName}!`);
                                    showFloatingText(document.getElementById('monster-display'), skillName, 'skill');
                                }

                                // Etki Yazısı Hazırlama
                                let effectLabel = globalLang.enemy_effects[packet.text] || "";
                                effectLabel = effectLabel.replace(/Rage|Öfke/gi, resourceLabel);
                                if (effectLabel.includes("$1") && packet.value) {
                                    effectLabel = effectLabel.replace("$1", packet.value);
                                }

                                if (effectLabel && effectLabel.trim() !== "") {
                                    const floatingTarget = (packet.category === 'buff') ? document.getElementById('monster-display') : document.getElementById('hero-display');
                                    const floatingType = (packet.category === 'buff') ? 'heal' : 'damage';
                                    setTimeout(() => { showFloatingText(floatingTarget, effectLabel, floatingType); }, 500);
                                }

                                if (packet.rageReduction) { hero.rage = Math.max(0, hero.rage - packet.rageReduction); updateStats(); }
                                if (packet.healing > 0) {
                                    monster.hp = Math.min(monster.maxHp, monster.hp + packet.healing);
                                    showFloatingText(document.getElementById('monster-display'), packet.healing, 'heal');
                                }

                                if (packet.statusEffects) {
                                    packet.statusEffects.forEach(eff => {
                                        const targetChar = (packet.category === 'buff') ? monster : hero;
                                        applyStatusEffect(targetChar, { id: eff.id, name: eff.name, value: eff.value, turns: eff.turns, resetOnCombatEnd: true });
                                    });
                                }

                                if (packet.damage && packet.damage.total > 0) {
                                    processMonsterDamage(monster, packet.damage);
                                } else {							
                                    animateMonsterSkill();
                                    updateStats();
										if (window.monsterDefenseTurns > 0) {
										window.monsterDefenseTurns--;
										if (window.monsterDefenseTurns === 0) {
										window.isMonsterDefending = false;
										window.monsterDefenseBonus = 0;
										writeLog(`🛡️ **${monster.name}** savunma duruşunu bozdu.`);
											}
											}
                                    window.isHeroTurn = true;
                                    setTimeout(nextTurn, 500);
                                }
                            }
                        }
                    }
                }, 500); 
            }
        }, 600); 
    }
};


// YARDIMCI FONKSİYONLAR:
function handleMonsterDefend(attacker) {
    const combatLang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    
    // --- YENİ SİSTEM: SÜRE VE TAZELEME MANTIĞI ---
    // Eğer canavar zaten savunmadaysa, defans değerini artırma (stackleme), sadece süreyi tazele.
    if (!window.isMonsterDefending) {
        window.monsterDefenseBonus = Math.floor(attacker.attack / 2) + 5;
    }

    window.isMonsterDefending = true;
    window.monsterDefenseTurns = 2; // 2 yapıyoruz ki canavarın turu bittiğinde 1 kalsın.
    
    showFloatingText(document.getElementById('monster-display'), combatLang.monster_defend_text, 'heal');
    writeLog(`🛡️ **${attacker.name}**: ${combatLang.monster_log_defend} (+${window.monsterDefenseBonus} Defans, 2 Tur).`);
    
    updateStats();
    
    setTimeout(() => {
        window.isHeroTurn = true;
        nextTurn();
    }, 100); 
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
		
		// --- YENİ: EVENT BONUS ALTIN KONTROLÜ ---
        if (hero.eventBonusGold) {
            rewards.push({ type: 'gold', value: hero.eventBonusGold });
            writeLog(`👦 Çocuk sana teşekkür ederek ${hero.eventBonusGold} altın verdi!`);
            hero.eventBonusGold = 0; // Bonusu sıfırla
        }
		
        // ----------------------------
		
		// --- KRİTİK: BLOOD MARK ZAFER BONUSU ---
        if (hero.sessionLifeStolen > 0) {
            // Toplam çalınan kanın %40'ı kalıcı can olur
            const hpReward = Math.floor(hero.sessionLifeStolen * 0.40); 
            
            if (hpReward > 0) {
                hero.permanentHpBonus = (hero.permanentHpBonus || 0) + hpReward;
                writeLog(`💎 **Ruh Hasadı**: Çaldığın kanın bir kısmı özüne karıştı! Kalıcı **+${hpReward} Max HP** kazandın.`);
                
                // Karakterin mevcut canını da artan Max HP kadar iyileştirebiliriz (Opsiyonel)
                hero.hp += hpReward;
            }
            // Havuzu bir sonraki oda için sıfırla
            hero.sessionLifeStolen = 0; 
        }
        // ----------------------------------------

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

window.executeBroochEffects = function(brooch, startDelay) {
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
	
    // Her broşun kendi içindeki efektlerini, dışarıdan gelen gecikmenin üzerine ekleyerek sıralıyoruz
    brooch.effects.forEach((eff, index) => {
        setTimeout(() => {
            switch(eff.id) {
                case "fixed_dmg":
                    let finalFixed = eff.value * damageMult; 
                    monster.hp = Math.max(0, monster.hp - finalFixed);
                    if (isSpecialist) {
                        showFloatingText(monsterDisplay, `${finalFixed} ${lang.combat.f_specialist}`, 'skill');
                    } else {
                        showFloatingText(monsterDisplay, finalFixed, 'damage');
                    }
                    const tribeName = lang.enemy_names[brooch.specialtyTribe] || brooch.specialtyTribe;
                    writeLog(`📿 **Broş**: ${lang.items.eff_fixed_dmg} (${tribeName}) -> ${finalFixed} vurdu.`);
                    break;
                    
                case "stat_scaling":
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
                    const classRules = CLASS_CONFIG[hero.class];
                    hero.rage = Math.min(stats.maxRage, hero.rage + eff.value);
                    const wasBuffering = window.isBufferingRage;
                    window.isBufferingRage = false;
                    // Dil hiyerarşisi düzeltildi (lang üzerinden root'a erişim)
                    const globalLang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
                    showFloatingText(display, `+${eff.value} ${globalLang[`resource_${classRules.resourceName}`]}`, 'heal');
                    window.isBufferingRage = wasBuffering;
                    writeLog(`📿 **Broş**: +${eff.value} Öfke kazanıldı.`);
                    break;
            }
            updateStats();
        }, startDelay + (index * 400)); // Dış gecikme + iç sıra
    });
};

