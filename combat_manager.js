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
	const currentLang = window.gameSettings.lang || 'tr';
	const lang = window.getCombatLang();

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
            writeLog(lang.combat.log_immunity.replace("$1", newEffect.name));
            return; // Etkiyi uygulamadan çık
        }
    }
	
    const existingIndex = target.statusEffects.findIndex(e => 
    e.id === newEffect.id && 
    e.element === newEffect.element && // Element kontrolü eklendi!
    e.id !== 'block_skill'
	);

	const targetName = isTargetHero ? window.getHeroClassNameTrans() : window.getEnemyNameTrans(target.name);
	
    if (existingIndex !== -1) {
        const existing = target.statusEffects[existingIndex];
		const translatedStatusName = lang.status[newEffect.id] || existing.name;
        
        // --- ZEHİR: BİRİKMEYE DEVAM EDER (Log ve Mantık Korundu) ---
        // --- Üst üste binmesi gereken efektlerin listesi ---
		const stackableDots = ['poison', 'fire', 'cold', 'lightning', 'curse', 'bleed'];

		if (stackableDots.includes(newEffect.id)) {
			existing.value += newEffect.value;
			existing.turns += newEffect.turns;
    
			// Log kısmındaki isimlendirmeyi de dinamik yapalım ki 
			// Ateş vurduğunda logda "Zehir" yazmasın:
			const effectLabel = lang.status[newEffect.id] || newEffect.id;
			writeLog(lang.combat.log_poison_intense.replace("$1", effectLabel.toUpperCase()).replace("$2", existing.value));
		}
        // --- SİPER: SADECE TAZELEME YAPAR (YENİ MANTIK) ---
        else if (newEffect.id === 'guard_active') {
            // SİLME GEREKÇESİ: existing.value += newEffect.value; satırı silindi.
            // SEBEP: Siper her basışta defansı sonsuza kadar artırmamalı, formüldeki güncel değeri almalı.
            
            existing.value = newEffect.value; // Üzerine ekleme yapma, güncel formül değerini yaz
            existing.turns = newEffect.turns; // Süreyi de en baştan başlat (Tazele)
            
            writeLog(lang.combat.log_status_refresh.replace("$1", targetName).replace("$2", translatedStatusName));
        }
        // --- DİĞER ETKİLER: MEVCUT MANTIĞI KORU ---
        else {
            existing.turns = Math.max(existing.turns, newEffect.turns);
            if (newEffect.value !== undefined) {
                existing.value = Math.max(existing.value, newEffect.value);
            }
            const tName = isTargetHero ? "" : (window.getEnemyNameTrans(target.name) + ": ");
			writeLog(lang.combat.log_status_refresh.replace("$1", targetName).replace("$2", translatedStatusName));
        }
    } else {
        target.statusEffects.push(newEffect);
        if (target !== hero) {
            const lang = window.getCombatLang(); // Merkezi fonksiyonu kullan
            const statusName = window.LANGUAGES[currentLang].status[newEffect.id] || newEffect.id;
			const langRoot = window.LANGUAGES[currentLang]; // Kök objeyi al
            const targetName = (langRoot.enemy_names || {})[target.name] || target.name;
			const logGain = (langRoot.combat.log_status_gain || "")
			.replace("$1", targetName)
			.replace("$2", statusName);
			writeLog(logGain);
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

window.getHeroClassNameTrans = () => {
    const lang = window.getCombatLang();
    // hero.class "Barbar" ise en.js'deki 'class_barbarian_name' anahtarına bak
    if (hero.class === "Barbar") return lang.class_barbarian_name || "Barbarian";
    if (hero.class === "Magus") return lang.class_magus_name || "Magus";
    return hero.class; // Bilinmeyen bir sınıfsa olduğu gibi yaz
};

window.getExhaustionCost = function(skillData, usage) {
    let base = skillData.exhaustion || 0;
	
	// YENİ: Yenileyici Rüzgar Etkisi
    if (window.monster && window.monster.roomEvent === "wind" && base > 0) {
        base = Math.max(1, base - 1); // 4 ise 3 yapar, 1'in altına düşürmez
    }
    
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
        if (base > 0) finalValue = Math.ceil(finalValue * 1.5);
        else finalValue = Math.floor(finalValue * 0.5);
    }

    return finalValue;
};

window.lastExhaustionThreshold = 0; // Oyuncunun en son hangi seviyede uyarıldığını tutar
window.updateExhaustionUI = function() {
	if (hero.exhaustion < 0) hero.exhaustion = 0;
	
	const val = Math.floor(hero.exhaustion);
    const lang = window.getCombatLang();

    // --- YORGUNLUK BİLDİRİM SİSTEMİ ---
    // Her 10 puanlık artışta bir kez kontrol et
    let currentLevel = Math.floor(val / 10) * 10; 

    if (currentLevel > window.lastExhaustionThreshold) {
        // Eğer oyuncu iyileşmediyse (dinlenmediyse) ve yeni bir eşiğe çıktıysa
        if (currentLevel === 50) writeLog(lang.combat.log_exhaust_50);
        else if (currentLevel === 60) writeLog(lang.combat.log_exhaust_60);
        else if (currentLevel === 70) writeLog(lang.combat.log_exhaust_70);
        else if (currentLevel === 80) writeLog(lang.combat.log_exhaust_80);
        else if (currentLevel === 90) writeLog(lang.combat.log_exhaust_90);
        else if (currentLevel === 100) writeLog(lang.combat.log_exhaust_100);
        else if (currentLevel > 100 && currentLevel % 20 === 0) {
            // 120, 140, 160 gibi kritik seviyelerde genel uyarı bas
            writeLog(lang.combat.log_exhaust_crit);
        }
        
        window.lastExhaustionThreshold = currentLevel; // Eşiği güncelle ki tekrar yazmasın
    }
    
    // Eğer oyuncu dinlenirse eşiği aşağı çekelim ki tekrar yorulduğunda uyarı alsın
    if (val < window.lastExhaustionThreshold - 10) {
        window.lastExhaustionThreshold = currentLevel;
    }
    // ----------------------------------
	
    // 1. Savaş Ekranı (Dikey)
    const sariDikey = document.getElementById('exhaustion-fill-sari');
    const morDikey = document.getElementById('exhaustion-fill-mor');
    const valText = document.getElementById('exhaustion-value');
    
    // 2. Stat Ekranı (Yatay)
    const sariYatay = document.getElementById('stat-exhaustion-bar-sari');
    const morYatay = document.getElementById('stat-exhaustion-bar-mor');
    const statText = document.getElementById('stat-exhaustion-text');

	if (hero.exhaustion > 200) hero.exhaustion = 200;
    //const val = hero.exhaustion || 0;

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

// 1. Mevcut dili ve sözlüğü getiren kısaltma
window.getCombatLang = () => window.LANGUAGES[window.gameSettings.lang || 'tr'];
// 2. Yetenek ismini veya log şablonunu güvenli çeviren yardımcı
window.getSkillTrans = (skillKey) => {
    const lang = window.getCombatLang();
    return (lang.skills && lang.skills[skillKey]) ? lang.skills[skillKey] : { name: skillKey, log: "" };
};
// --- EKLE: Bu fonksiyon eksik olduğu için hata alıyordun ---
window.getEnemyNameTrans = (rawName) => {
    const lang = window.getCombatLang();
    const enemyL = lang.enemy_names || {};
    return enemyL[rawName] || rawName;
};
window.getDotIcon = (effectId) => {
    const icons = { poison: '☣️', fire: '🔥', bleed: '🩸', curse: '💀', cold: '❄️', lightning: '⚡' };
    return icons[effectId] || '✨';
};

window.logSkillEffect = function(skillKey, val1 = "", val2 = "") {
    const lang = window.getCombatLang();
    const skillData = window.getSkillTrans(skillKey);
    
    // Eğer dil dosyasında bu yeteneğe özel bir 'log' şablonu varsa onu kullan
    if (skillData.log) {
        const msg = skillData.log.replace("$1", val1).replace("$2", val2);
        writeLog(`✨ **${skillData.name}**: ${msg}`);
    } else {
        // Yoksa genel şablonu bas
        writeLog(lang.combat.log_skill_generic.replace("$1", skillData.name).replace("$2", val1));
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
	let flatRageRegenBonus = 0;	
    let totalAtkMult = 1.0; 
    let totalDefMult = 1.0; // YENİ: Defans çarpanı eklendi
	const colorCounts = {}; 
	
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
			else if (currentResists.hasOwnProperty(statKey)) {
            // DURUM B: Elemental Set (Fire, Poison vb.)
            // 3 parça olunca +3, 6 parça olunca +6 o elementin direncini artırır
            currentResists[statKey] += bonusAmount;
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
			// --- YENİ EKLEME: MANA YENİLENME BUFFINI TANI ---
            if (e.id === 'rage_regen_buff') flatRageRegenBonus += e.value;
            // ------------------------------------------------
            
            if (e.id === 'atk_up_percent') totalAtkMult += e.value;
            if (e.id === 'atk_half') totalAtkMult *= 0.5;
            
			// --- YENİ EKLEME: GEÇİCİ ELEMENTAL HASAR BONUSU ---
            if (e.id === 'elem_dmg_up') {
                currentElemDmg[e.element] += e.value;
            }
            // --------------------------------------------------
			
            // ÖRÜMCEK AĞI DEBUFFI (Burada artık hata vermez)
            if (e.id === 'debuff_webbed') {
                totalAtkMult *= (1 - e.value); // Atak %30 azalır
                totalDefMult *= (1 - e.value); // Defans %30 azalır
            }
            //if (e.id === 'resist_fire') currentResists.fire += e.value;
			// DİNAMİK DİRENÇ KONTROLÜ (resist_fire, resist_cold vb. hepsini yakalar)
			if (e.id.startsWith('resist_')) {
				const eleType = e.id.split('_')[1]; // 'fire', 'cold' vb. kısmını alır
				if (currentResists.hasOwnProperty(eleType)) {
					currentResists[eleType] += e.value;
				}
			}
			// --- YENİ GRUP EFEKT KONTROLLERİ BURADAN BAŞLIYOR ---
            // 1. Enhancement Direnç Paketi (Tek ikon, 3 direnç artırır)
            if (e.id === 'enhancement_resists') {
                currentResists.fire += e.value;
                currentResists.cold += e.value;
                currentResists.lightning += e.value;
            }

            // 2. Enhancement Hasar Paketi (Tek ikon, 3 hasar türü artırır)
            if (e.id === 'enhancement_dmg') {
                currentElemDmg.fire += e.value;
                currentElemDmg.cold += e.value;
                currentElemDmg.lightning += e.value;
            }
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
    const baseRageRegen = Math.floor((s[sc.regen.stat] * sc.regen.mult) * totalRegenMult);
    const bonusRageRegen = flatRageRegenBonus;

    // 1. Önce Yorgunluk Hariç Her Şeyi (Ekipman + Skill Buffları) hesapla
    let preExhaustAtk = Math.floor(((hero.baseAttack || 10) + flatAtkBonus + Math.floor(s[sc.atk.stat] * sc.atk.mult)) * totalAtkMult);
    let preExhaustDef = Math.floor(((hero.baseDefense || 0) + flatDefBonus + Math.floor(s[sc.def.stat] * sc.def.mult)) * totalDefMult);

    let finalAtk = preExhaustAtk;
    let finalDef = preExhaustDef;
    const ex = hero.exhaustion;

    // 2. YORGUNLUK CEZASI SEÇİCİ (DEFANS - 50+)
    if (ex >= 50) {
        // Yüzdesel Kayıp: 50'de %10, 70'te %20, 100'de %30
        let pct = (ex >= 100) ? 0.30 : (ex >= 70 ? 0.20 : 0.10);
        let lossPercent = Math.floor(preExhaustDef * pct);
        
        // Statik Kayıp: 50'de 3, sonra her 10'da +1
        let lossStatic = 3 + Math.floor((ex - 50) / 10);

        // HANGİSİ DAHA ÇOK GÖTÜRÜYORSA ONU ÇIKAR
        finalDef = preExhaustDef - Math.max(lossPercent, lossStatic);
    }

    // 3. YORGUNLUK CEZASI SEÇİCİ (ATAK - 100+)
    if (ex >= 100) {
        // Atakta yüzdesel ceza hep %30 kalsın
        let lossPercent = Math.floor(preExhaustAtk * 0.30);
        
        // Statik Kayıp: 100'de 1, sonra her 10'da +1
        let lossStatic = 1 + Math.floor((ex - 100) / 10);

        // HANGİSİ DAHA ÇOK GÖTÜRÜYORSA ONU ÇIKAR
        finalAtk = preExhaustAtk - Math.max(lossPercent, lossStatic);
    }
    // ---------------------------


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
        rageRegen: baseRageRegen + bonusRageRegen, 
        baseRageRegen: baseRageRegen,
        bonusRageRegen: bonusRageRegen,
        resists: currentResists,
        elementalDamage: currentElemDmg,
        atkMultiplier: totalAtkMult 
    };
};

window.applySkillDoT = function(attacker, target, skillData) {
    // --- KRİTİK KONTROL ---
    // Eğer skillData içinde dotEffect objesi yoksa fonksiyondan sessizce çık.
    if (!skillData || !skillData.dotEffect) return;

    const dotConfig = skillData.dotEffect;
    
    // Motoru çağırıp tick hasarını hesapla
    const tickValue = SkillEngine.calculateDoT(attacker, skillData, target);
    
    // Eğer hesaplanan hasar 0'dan büyükse statü etkisini uygula
    if (tickValue > 0) {
        applyStatusEffect(target, {
            id: dotConfig.type, 
            value: tickValue,
            turns: dotConfig.duration,
            resetOnCombatEnd: true
        });

        // --- GÜNCELLEME: Hasar rakamı yerine durum ismi göster ---
        const lang = window.getCombatLang();
        const statusName = lang.status[dotConfig.type] || dotConfig.type;
        
        // Örn: "3" yerine "YANMA" yazısı fırlayacak (Mor/Mistik renk)
        showFloatingText(
            document.getElementById(target === hero ? 'hero-display' : 'monster-display'), 
            statusName.toUpperCase(), 
            dotConfig.type // Rengi belirleyen tip (fire, curse vb.)
        );
    }
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
			
			// --- YENİ: RAGE/MANA MALİYET ROZETİ ---
			// SADECE maliyet 0'dan büyükse gösterelim
			if (data.rageCost > 0) {
				const rageBadge = document.createElement('div');
				rageBadge.className = 'skill-rage-badge';
            
				// Rozet rengini sınıfın kaynak rengine göre ayarla (Rage=Kırmızı, Mana=Mavi)
				const classRules = CLASS_CONFIG[hero.class];
				rageBadge.style.color = classRules.resourceColor;
				rageBadge.style.borderColor = classRules.resourceColor; // Çerçeveyi de renklendirebiliriz
            
				rageBadge.textContent = data.rageCost;
				slot.appendChild(rageBadge);
			}
			// --------------------------------------

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
    const lang = window.getCombatLang(); // Eksik tanım eklendi
    if (hero.rage < (skillObj.data.rageCost || 0)) { 
        const resName = lang[`resource_${CLASS_CONFIG[hero.class].resourceName}`];
        writeLog(lang.combat.log_insufficient_resource.replace("$1", resName)); 
        return; 
    }

    window.isHeroTurn = false; 
    toggleSkillButtons(true); 

    // 2. Maliyeti düş
    if(skillObj.data.rageCost > 0) hero.rage -= skillObj.data.rageCost;
    updateStats(); 

    // --- BUFFER KONTROLÜ ---
    if (skillObj.data.scaling) {
        window.rageBuffer = 0;
        window.isBufferingRage = true;
    } else {
        window.isBufferingRage = false; 
    }

    // --- A. HASAR PAKETİNİ ÖNCE HESAPLA ---
    // Önemli: Sayaç henüz artmadığı için 'Preview' (Öngörü) ile aynı değeri bulur.
    let dmgPack = null;
    if (skillObj.data.scaling) {
        dmgPack = SkillEngine.calculate(hero, skillObj.data, monster);
    }
	
	// --- B. YORGUNLUK VE SAYAÇ ŞİMDİ ARTSIN ---
    const sID = skillObj.data.id || skillKey;
    
    if (skillObj.data.type !== 'passive') {
        if (!hero.skillUsage) hero.skillUsage = {};
        if (hero.skillUsage[sID] === undefined) hero.skillUsage[sID] = 0;

        // Kullanımdan önceki maliyeti hesapla
        const exGain = window.getExhaustionCost(skillObj.data, hero.skillUsage[sID]);
        hero.exhaustion = Math.max(0, hero.exhaustion + exGain); 

        // KRİTİK: Sayaç hasar hesaplandıktan sonra artıyor!
        hero.skillUsage[sID]++; 
        
        window.updateExhaustionUI(); 
        if (window.refreshSkillExhaustionBadges) window.refreshSkillExhaustionBadges();
    }

    // 3. YETENEĞİ ÇALIŞTIR (Hesaplanmış dmgPack'i içeri gönder)
    if (skillObj.onCast) {
        skillObj.onCast(hero, monster, dmgPack);
    }
};

// Global değişkenler
let idleFrame = 0;
let idleInterval = null;
let idleDirection = 1; // Sadece Magus veya Yoyo isteyen sınıflar için

window.startHeroIdleAnimation = function() {
    if (hero.class !== "Barbar" && hero.class !== "Magus") return;
    
    const idleViewer = document.getElementById('hero-idle-viewer');
    const staticImg = document.getElementById('hero-static-img');
    if (!idleViewer || !staticImg) return;

    const idlePath = (hero.class === "Barbar") 
        ? 'images/heroes/barbarian/barbar_idle_sprite.webp' 
        : 'images/heroes/magus/magus_idle_sprite.webp';

    idleViewer.style.backgroundImage = `url('${idlePath}')`;
    staticImg.style.opacity = "0";
    idleViewer.style.display = "block";

    if (idleInterval) clearInterval(idleInterval);

    // HIZLAR: Barbar 45ms, Magus 50ms (Daha sakin)
    const speed = (hero.class === "Magus") ? 55 : 45;

    idleInterval = setInterval(() => {
        const attackViewer = document.getElementById('hero-sprite-viewer');
        if (attackViewer && attackViewer.classList.contains('sprite-active')) {
            idleViewer.style.opacity = "0"; 
            return;
        } else {
            idleViewer.style.opacity = "1";
        }

        // --- GÖRSELİ ÇİZ (Ortak) ---
        let col = idleFrame % 5;
        let row = Math.floor(idleFrame / 5);
        idleViewer.style.backgroundPosition = `-${col * 563}px -${row * 317}px`;

        // --- MANTIK AYRIMI ---

        if (hero.class === "Barbar") {
            // 1. BARBAR: Düz ve seri döngü (Senin mükemmel dediğin ayar)
            idleFrame++;
            if (idleFrame >= 40) idleFrame = 0;
        } 
        else if (hero.class === "Magus") {
            // Magus'u da düz döngüye sokuyoruz (Takılma Yoyo'dan kaynaklıysa bu çözecek)
            idleFrame++;
            if (idleFrame >= 38) idleFrame = 0;
        }
        
    }, speed); 
};

let monsterIdleFrame = 0;
let monsterIdleInterval = null;

window.applyMonsterIdle = function() {
    if (!window.monster) return;
    
    const spriteViewer = document.getElementById('monster-sprite-viewer');
    const staticImg = document.getElementById('monster-static-img');

    // --- YENİ: BOYUT ÖLÇEĞİNİ BELİRLE ---
    // Eğer canavarda visualScale tanımı yoksa varsayılan olarak 1.0 (tam boy) kullan
    const scale = monster.visualScale || 1.0;
    
    // Tarayıcıya "Bu canavarın ölçeği şudur" diye bir not bırakıyoruz (--m-scale)
    if (spriteViewer) {
        spriteViewer.style.setProperty('--m-scale', scale);
        spriteViewer.style.transform = `translateX(-50%) scale(${scale})`;
    }
    if (staticImg) {
        staticImg.style.setProperty('--m-scale', scale);
        staticImg.style.transform = `translateX(-50%) scale(${scale})`;
    }
    // -------------------------------------------------------

    if (monsterIdleInterval) clearInterval(monsterIdleInterval);

    if (monster.hasIdleSprite) {
        if (spriteViewer) {
            spriteViewer.style.display = "block";
            const path = `images/${monster.spritesheet}`;
            spriteViewer.style.backgroundImage = `url('${path}')`;
        }

        monsterIdleInterval = setInterval(() => {
            // Grid hesaplamaların (563x317) aynı kalıyor, scale bunları bozmaz
            let col = monsterIdleFrame % 5;
            let row = Math.floor(monsterIdleFrame / 5);
            if (spriteViewer) {
                spriteViewer.style.backgroundPosition = `-${col * 563}px -${row * 317}px`;
            }
            monsterIdleFrame++;
            if (monsterIdleFrame >= 40) monsterIdleFrame = 0;
        }, 50); 
        
        if (staticImg) staticImg.style.display = "none";
    } else {
        if (spriteViewer) spriteViewer.style.display = "none";
        if (staticImg) staticImg.style.display = "block";
    }
};

// --- ANİMASYONLAR VE HASAR ---
window.animateCustomAttack = function(dmgPack, skillFrames, skillName) {
    const lang = window.getCombatLang().combat;
	const globalLang = window.getCombatLang();
    const classRules = CLASS_CONFIG[hero.class];
    const spriteViewer = document.getElementById('hero-sprite-viewer');
	const idleViewer = document.getElementById('hero-idle-viewer'); // Idle kutusunu aldık
    
	// 1. KISS: Sınıfa Özel Ayarları Baştan Belirle
    const isBarbar = (hero.class === "Barbar");
    const isMagus = (hero.class === "Magus");
    const hasSprite = isBarbar || isMagus;

    // Sınıf bazlı değişkenler
    const totalSpriteFrames = isBarbar ? 23 : (isMagus ? 40 : 40);
    const hitFrame = isBarbar ? 10 : 17; // Magus için 17
    const animationSpeed = 35; 
    const spritePath = isBarbar 
        ? 'images/heroes/barbarian/barbar_attack_sprite.webp' 
        : 'images/heroes/magus/magus_attack_sprite.webp';

    const frameWidth = 563; 
    const frameHeight = 317;
    const columns = 5;

    // Kare dizisini hazırla
    const frames = (hasSprite) ? new Array(totalSpriteFrames).fill(0) : ((skillFrames && skillFrames.length > 0) ? skillFrames : classRules.visuals.attackFrames);
    let finalDmg = dmgPack.total;

	let fIdx = 0;
    function frameLoop() {
        if (fIdx < frames.length) {
            if (hasSprite && spriteViewer) {
                heroDisplayImg.classList.add('hero-hidden');
                spriteViewer.classList.add('sprite-active');
                
                // Dinamik resim yükleme (Barbar veya Magus)
                spriteViewer.style.backgroundImage = `url('${spritePath}')`;
                
                let col = fIdx % columns;
                let row = Math.floor(fIdx / columns);
                spriteViewer.style.backgroundPosition = `-${col * frameWidth}px -${row * frameHeight}px`;
            } else {
                heroDisplayImg.src = frames[fIdx];
            }

            // HASAR UYGULAMA (Dinamik hitFrame)
            if (fIdx === (hasSprite ? hitFrame : 1)) {   
                // Hasarı uygula ve istatistikleri işle
                monster.hp = Math.max(0, monster.hp - finalDmg);
                StatsManager.trackDamageDealt(finalDmg);
				
				// --- YENİ: ZIRH DELME LOGU ---
				if (hero.statusEffects.some(e => e.id === 'ignore_def' && !e.waitForCombat)) {
				writeLog(lang.combat.log_armor_pierce);
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
                        writeLog(lang.combat.log_blood_mark_drain.replace("$1", stolen).replace("$2", hero.sessionLifeStolen));
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
                const currentLang = window.gameSettings.lang || 'tr';
				const langRoot = window.LANGUAGES[currentLang]; // Kök objeyi al
				const combatL = langRoot.combat || {}; // Savaş sözlüğünü al
				const enemyL = globalLang.enemy_names || {};
				const monsterNameTranslated = enemyL[monster.name] || monster.name;

				const skillKey = dmgPack.skillKey || ""; 
				const skillNameTrans = (langRoot.skills && langRoot.skills[skillKey]) ? langRoot.skills[skillKey].name : skillName;
				
				// --- KESİN ÇÖZÜM: SKILL ID ÜZERİNDEN ÇEVİRİ ---
				// Eğer fonksiyona bir ID gelirse (strike, slash vb.) onu dilden çek, yoksa gelen ismi kullan
				let finalSkillName = skillName;
				if (langRoot.skills && SKILL_DATABASE) {
					// Bu darbenin hangi skillden geldiğini anlamak için dmgPack.skillKey'e bakıyoruz
					const key = dmgPack.skillKey; 
					if (langRoot.skills[key]) {
						finalSkillName = langRoot.skills[key].name; // "Vuruş" yerine "Strike" olur
					}
				}
				// ----------------------------------------------

				const logMsg = (combatL.log_player_hit || "")
				.replace("$1", skillNameTrans)
				.replace("$2", monsterNameTranslated)
				.replace("$3", finalDmg)
				.replace("$4", dmgPack.phys)
				.replace("$5", dmgPack.elem);

				writeLog(logMsg);
                
                // Düşman Kalkan Kırma
                if (window.isMonsterDefending) {
				if (finalDmg > 0) {
				window.isMonsterDefending = false; 
				window.monsterDefenseBonus = 0; 
				window.monsterDefenseTurns = 0;
				writeLog(`🛡️ **${monsterNameTranslated}** ${langRoot.combat.log_shield_break}`);
			} else if (finalDmg > 0) {
				writeLog(`🛡️ **${monsterNameTranslated}** ${langRoot.combat.log_shield_absorb}`);
			}
}
                updateStats();
            }
            fIdx++; 
            setTimeout(frameLoop, hasSprite ? animationSpeed : 150); 

        } else {
            // --- BİTİŞ ---
            if (hasSprite && spriteViewer) {
                window.idleFrame = 0; 
                if (idleViewer) {
                    idleViewer.style.opacity = "1";
                    setTimeout(() => { spriteViewer.classList.remove('sprite-active'); }, 10); 
                }
            } else {
                heroDisplayImg.classList.remove('hero-hidden');
                heroDisplayImg.src = classRules.visuals.idle;
            }
            window.isBufferingRage = false; 
            if (!checkGameOver()) nextTurn(); 
        }
    }
    frameLoop();
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
    const lang = window.getCombatLang();
    let finalDamage = dmgPack.total;

    // 1. Animasyonu Başlat: Her iki kutuya da sınıfı ekle
    // Hangi kutu görünürse (display:block) o sarsılacaktır
    const staticImg = document.getElementById('monster-static-img');
    const spriteViewer = document.getElementById('monster-sprite-viewer');
    
    // Animasyonu ikisine de ekle (Hangisi görünürse o hareket edecektir)
    if (staticImg) {
        staticImg.classList.remove('monster-attack-anim');
        void staticImg.offsetWidth; // Resetle (Reflow)
        staticImg.classList.add('monster-attack-anim');
    }
    if (spriteViewer) {
        spriteViewer.classList.remove('monster-attack-anim');
        void spriteViewer.offsetWidth; // Resetle (Reflow)
        spriteViewer.classList.add('monster-attack-anim');
    }

    setTimeout(() => {
        // 2. Blok ve Savunma Hesaplama
        if (window.heroBlock > 0) {
            if (window.heroBlock >= finalDamage) { 
                window.heroBlock -= finalDamage; finalDamage = 0; 
                showFloatingText(heroDisplayContainer, lang.combat.f_block, 'heal'); 
            } else { 
                finalDamage -= window.heroBlock; window.heroBlock = 0; 
            }
        }
		
		// 3. Astral Bariyer Kontrolü
        const astralIdx = hero.statusEffects.findIndex(e => e.id === 'astral_shield');
        if (astralIdx !== -1) {
            const astralEffect = hero.statusEffects[astralIdx];
            const stats = getHeroEffectiveStats();
            finalDamage = 0; 
            hero.hp = Math.min(stats.maxHp, hero.hp + astralEffect.value);
            showFloatingText(heroDisplayContainer, astralEffect.value, 'heal');
            writeLog(lang.combat.log_astral_trigger.replace("$1", astralEffect.value));
            hero.statusEffects.splice(astralIdx, 1);
            animateDamage(false); 
        }
		// --- MANA WARD KONTROLÜ ---
		const manaWardIdx = hero.statusEffects.findIndex(e => e.id === 'mana_ward_active');
		if (manaWardIdx !== -1 && finalDamage > 0) {
			
    
			// 1. Mananın ne kadarını emebileceğini hesapla
			let absorbedByMana = Math.min(finalDamage, hero.rage);
			hero.rage -= absorbedByMana; // Manadan düş
    
			let remainingDamage = finalDamage - absorbedByMana;
    
			if (remainingDamage > 0) {
			// 2. Mana yetmediyse: Kalan hasarı 1.5 ile çarp ve tam sayıya yuvarla
			finalDamage = Math.floor(remainingDamage * 1.5);
        
			// Görsel uyarı: Kalkanın kırıldığını belirt
			showFloatingText(heroDisplayContainer, "BREAK!", 'damage');
			writeLog(lang.combat.log_mana_ward_break?.replace("$1", absorbedByMana) || `🌀 **Mana Ward**: Kalkan yetersiz! ${absorbedByMana} emildi, artan hasar %50 arttı.`);
			} else {
			// 3. Mana tam yettiyse: Hasarı sıfırla
			finalDamage = 0;
			showFloatingText(heroDisplayContainer, "ABSORBED", 'heal');
			writeLog(lang.combat.log_mana_ward_full?.replace("$1", absorbedByMana) || `🌀 **Mana Ward**: Tüm hasar (${absorbedByMana}) manadan karşılandı.`);
			}
    
			// Kalkan kullanıldığı için sil
			hero.statusEffects.splice(manaWardIdx, 1);
			updateStats();
			}
		// --------------------------

        // --- KRİTİK BÖLGE: HASAR İŞLEME VE LOG ---
        const attackerName = window.getEnemyNameTrans(attacker.name);

        if (finalDamage > 0) { 
            // HASAR VARSA: Normal işleyiş
            hero.hp = Math.max(0, hero.hp - finalDamage); 
            hero.damageTakenThisRound = (hero.damageTakenThisRound || 0) + finalDamage;
            StatsManager.trackDamageTaken(finalDamage);
            animateDamage(true); 
            showFloatingText(heroDisplayContainer, finalDamage, 'damage'); 
            
            const logMsg = lang.combat.log_monster_hit
                .replace("$1", attackerName).replace("$2", finalDamage)
                .replace("$3", dmgPack.phys).replace("$4", dmgPack.elem);
            writeLog(logMsg);

            // Kaynak Kazanımı (Barbar/Magus)
            const stats = getHeroEffectiveStats();
            const classRules = CLASS_CONFIG[hero.class];
            let gainOnHit = classRules.onHitRageGain || 0;
            if (hero.statusEffects.some(e => e.id === 'spirit_shield_active')) gainOnHit += 10;
            if (gainOnHit > 0 && hero.hp > 0) {
                hero.rage = Math.min(stats.maxRage, hero.rage + gainOnHit);
            }
        } else {
            // HASAR 0 İSE: Geri bildirim ver (Mor parlamayı engelleyen kısım)
            showFloatingText(heroDisplayContainer, "0", 'damage');
            writeLog(lang.combat.log_monster_hit_zero.replace("$1", attackerName));
        }

        updateStats(); 
        if (window.isHeroDefending) { window.isHeroDefending = false; window.heroDefenseBonus = 0; }
		
		if (window.monsterDefenseTurns > 0) {
			window.monsterDefenseTurns--;
			if (window.monsterDefenseTurns === 0) {
				window.isMonsterDefending = false;
				window.monsterDefenseBonus = 0;
				writeLog(lang.combat.log_shield_end.replace("$1", attackerName));
			}
		}
        
    }, 250); 

    setTimeout(() => {
        window.isHeroTurn = true; 
		    // Animasyon bitince sınıfları temizle
        if (staticImg) staticImg.classList.remove('monster-attack-anim');
        if (spriteViewer) spriteViewer.classList.remove('monster-attack-anim');

        if (!checkGameOver()) nextTurn(); 
    }, 550); 
}

window.determineMonsterAction = function() {
	// --- KRİTİK GÜVENLİK: Canavar yoksa veya ölüyse dur ---
    if (!window.monster || monster.hp <= 0) return;
    // ---------------------------------------------------
    // AIManager'ı çağırıp sonucu alıyoruz
    window.monsterNextAction = AIManager.determineAction(monster, hero, window.combatTurnCount);
    
    // UI İkonunu ayarla (Opsiyonel: Skill gelirse farklı ikon göster)
    showMonsterIntention(window.monsterNextAction);
};

window.startBattle = function(enemyType, isHardFromMap = false, isHalfTierFromMap = false, isWeakFromMap = false, biome, bgNum, roomEventFromMap = "none", isOrangeFromMap = false) {
    const stats = ENEMY_STATS[enemyType]; if (!stats) return;
	//StatsManager.trackEnemy(enemyType);
	const lang = window.getCombatLang(); 
	window.lastExhaustionThreshold = Math.floor(hero.exhaustion / 10) * 10;
	
	// --- GÜNCELLEME: ARKA PLAN DEĞİŞTİRME ---
    const battleScreenEl = document.getElementById('battle-screen');
    
    if (battleScreenEl && biome && bgNum) {
        // Biyom ismini küçük harfe çeviriyoruz ki 'Cave1.webp' yerine 'cave1.webp' arasın
        const safeBiomeName = biome.toLowerCase(); 
        const bgPath = `images/utils/battlebg/${safeBiomeName}${bgNum}.webp`;
        
        battleScreenEl.style.backgroundImage = `url('${bgPath}')`;
        console.log("🖼️ Savaş Arka Planı Atandı:", bgPath);
    } else {
        battleScreenEl.style.backgroundImage = `url('images/utils/colony_zone_bg.webp')`;
    }
    // ---------------------------------------
	
	// --- KRİTİK: DONDURULMUŞ DİRENÇLERİ OKU ---
    let finalMonsterResists;
    const currentNode = GAME_MAP.nodes.find(n => n.id === GAME_MAP.currentNodeId);

    if (currentNode && currentNode.monsterResists) {
        finalMonsterResists = currentNode.monsterResists;
    } else {
        // Failsafe (Debug çağrıları için)
        const tribeData = window.TRIBE_BASES[stats.tribe] || { fire:0, cold:0, lightning:0, poison:0, curse:0 };
        const specificData = stats.specificResists || {};
        const elements = ['fire', 'cold', 'lightning', 'poison', 'curse'];
        const randomScale = (stats.tier || 1) * 0.5;
        finalMonsterResists = {};
        elements.forEach(ele => {
            let randRoll = (Math.floor(Math.random() * 21) - 10);
            finalMonsterResists[ele] = (tribeData[ele] || 0) + (specificData[ele] || 0) + Math.round(randRoll * randomScale);
        });
    }
	
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
        writeLog(lang.combat.log_boss_buff.replace("$1", percent));
    } else if (scaling < 1) {
        const percent = Math.round((1 - scaling) * 100);
        writeLog(lang.combat.log_boss_weak.replace("$1", percent));
    }
    }
	
	if (stats.isBoss) {
    window.currentBossScaling = window.EventManager.getModifier('boss_scaling');
	} else {
    window.currentBossScaling = 1.0;
	}
	
	// --- DATA-DRIVEN TIER & HARD SCALE AYARI ---
    const HALF_TIER_SCALE = 1.5; // Yarım Tier (Elite) çarpanı
    const HARD_SCALE = 1.20;      // isHard (Strong) çarpanı
    
    let hpAtkMultiplier = 1.0 * scaling;
	let otherMultiplier = 1.0 * scaling;
	
    // --- KRİTİK DÜZELTME: BOSS FİLTRESİ ---
    // Eğer canavar Boss DEĞİLSE harita zorluklarını uygula
    if (!stats.isBoss) {
        const HALF_TIER_SCALE = 1.5;
        const HARD_SCALE = 1.20; 

        if (isHalfTierFromMap) {
            hpAtkMultiplier *= HALF_TIER_SCALE; 
            otherMultiplier *= HALF_TIER_SCALE;
        } 
        if (isHardFromMap) {
            hpAtkMultiplier *= HARD_SCALE;
            // Not: Hard odalarda defans artmıyor (senin kuralın)
        } 
        if (isWeakFromMap) {
            hpAtkMultiplier *= 0.8; 
            otherMultiplier *= 0.8; // Zayıf odada defans da düşer
        }
    }
    // NOT: Eğer Boss ise, sadece yukarıdaki 'scaling' (zaman bazlı) değerini kullanır.
    // Haritadaki isHard (Kırmızı oda) bilgisi Boss'un canını/atağını bir daha artırmaz.
    // --------------------------------------

    // Defans ve Diğerleri için Çarpan (isHard hariç tutulur)
    //if (isHalfTierFromMap) otherMultiplier *= HALF_TIER_SCALE;

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
		// --- KRİTİK EKLENEN SATIR ---
		hasIdleSprite: stats.hasIdleSprite || false, 
		spritesheet: stats.spritesheet || null, // Hareketli olan (ancient_mushroom_idle.webp)
		visualScale: stats.visualScale || 1.0,
		// ----------------------------
        resists: finalMonsterResists,
        // --- KRİTİK DEĞİŞİKLİK: SADECE HP VE ATK HARD MULTIPLIER ALIR ---
        maxHp: scaleHPAtk(stats.maxHp), 
        hp: scaleHPAtk(stats.maxHp), 
        attack: scaleHPAtk(stats.attack), 
        defense: scaleOther(stats.defense), // Defans isHard'dan etkilenmez
        // --------------------------------------------------------------
		isWeak: isWeakFromMap,
        isHard: isHardFromMap, 
        isBoss: stats.isBoss, 
        isHalfTier: isHalfTierFromMap,
		isOrange: isOrangeFromMap,
        xp: stats.xp, 
        tier: stats.tier, 
        idle: stats.idle, dead: stats.dead, attackFrames: stats.attackFrames,
        skills: stats.skills,
        firstTurnAction: stats.firstTurnAction,
        statusEffects: [], 
		
	};
	
	// --- GÜNCELLEME: Canavarı tüm statlarıyla Compendium'a gönder ---
    StatsManager.trackEnemy(monster); 
    // ---------------------------------------------------------------
	
	monster.roomEvent = roomEventFromMap; // Haritadan gelen eventi canavara çivile
	
	// --- BİYOM - ELEMENT EŞLEŞTİRME SİSTEMİ ---
    const biomeEls = { forest:'poison', plains:'fire', cave:'curse', iceland:'cold', mountain:'lightning', urban:'fire' };
    let roomElement = biomeEls[biome?.toLowerCase()] || 'fire';
    // Urban ise rastgele bir element seç
    if (biome?.toLowerCase() === 'urban') roomElement = ['fire','cold','lightning','poison','curse'][Math.floor(Math.random()*5)];
    monster.roomElement = roomElement; // Canavarın üzerine hangi elementin odasında olduğunu yazdık

     // 1. Magical Reinforcement: +1-5 Atak VEYA Element Hasarı
    if (monster.roomEvent === "reinforcement") {
        const bonusVal = Math.floor(Math.random() * 5) + 1;
        const isElemental = Math.random() > 0.5;
        let bonusText = ""; // Gösterge için metin hazırlıyoruz

        if (!isElemental) {
            // FİZİKSEL ATAK BONUSU
            monster.attack += bonusVal;
            applyStatusEffect(hero, { id: 'atk_up', value: bonusVal, turns: 99, resetOnCombatEnd: true });
            
            // Etiketi hazırla: (+3 Atak)
            bonusText = `+${bonusVal} ${lang.label_atk}`;
        } else {
            // YENİ: Geçici elemental bonus veriyoruz
            applyStatusEffect(hero, { 
                id: 'elem_dmg_up', 
                name: 'Mistik Güç', 
                value: bonusVal, 
                element: roomElement, // Hangi element olduğunu içine yazdık
                turns: 99, 
                resetOnCombatEnd: true // <--- KRİTİK: Oda bitince silinir
            });
            monster.attack += bonusVal;
            
            // Etiketi hazırla: (+2 Zehir)
            const elementName = lang.status[roomElement] || roomElement;
            bonusText = `+${bonusVal} ${elementName}`;
        }
        
        // --- KRİTİK: Bilgiyi canavara kaydet ---
        monster.reinforcementLabel = bonusText;
        // ---------------------------------------
        
        writeLog(lang.combat.log_room_event.replace("$1", `${lang.room_events.event_reinforcement} (${bonusText})`));
    }

    // 2. Biome Storm: Kırmızı Enemyler için +3 Resist ve +3 Element Hasarı
    if (monster.roomEvent === "storm" && (monster.isHard || monster.isWeak)) {
        monster.attack += 3; // Elemental hasar gücünü artırır
        for (let res in monster.resists) {
        monster.resists[res] += 3; // Kendi elementine daha dirençli olur
		}
        writeLog(lang.combat.log_room_event_storm);
    }
	
	// 3. King's Path: Girişte artan günü geri al (-1)
    if (monster.roomEvent === "kings_path") {
        hero.calendar.daysPassed = Math.max(0, hero.calendar.daysPassed - 1);
        writeLog(lang.combat.log_kings_path);
    }
	
	window.showRoomEventBanner(roomEventFromMap);
	
	monsterDisplayImg.src = `images/${monster.idle}`;
    monsterDisplayImg.style.filter = 'none'; 
    monsterDisplayImg.style.opacity = '1';
	
	// --- LOGLAMA VE GÖRSEL HAZIRLIKLAR ---
	 if (!monster.isBoss) {
        if (isHalfTierFromMap) {
            writeLog(lang.combat.log_half_tier_buff);
        }
        if (isHardFromMap) {
            writeLog(lang.combat.log_hard_buff.replace("$1", window.getEnemyNameTrans(monster.name)));
        }
        if (isWeakFromMap) {
            writeLog(lang.combat.log_weak_buff);
        }
    }
	
	// Savaş başlangıcı bonusu (Örn: Stormreach ayında +10 öfke)
    const bonus = window.EventManager.getCombatBonus();
    hero.rage = Math.min(hero.maxRage, hero.rage + bonus.rage);

    if (scaling > 1) writeLog(lang.combat.log_boss_scaling.replace("$1", scaling.toFixed(2)));
	
	const classRules = CLASS_CONFIG[hero.class];
    const staticImg = document.getElementById('monster-static-img');
    if (staticImg) {
        staticImg.src = `images/${monster.idle}`; // enemies/ancient_mushroom_idle.webp
        staticImg.style.filter = 'none'; 
        staticImg.style.opacity = '1';
        staticImg.className = ""; // Animasyonları temizle
    }

    // Motoru çağır
    window.applyMonsterIdle();
	
    if (hero.class === "Barbar" || hero.class === "Magus") {
    // Spritesheet kullanıldığı için img etiketine şeffaf bir boşluk atıyoruz (Tarayıcı dosya aramaz)
    heroDisplayImg.src = "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7";
	} else {
		// Spritesheet kullanmayan başka bir sınıf varsa normal resmini yüklesin
		heroDisplayImg.src = classRules.visuals.idle;
	}

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
	const lang = window.getCombatLang(); // Güvenli tanım
        determineMonsterAction(); 
        showMonsterIntention(window.monsterNextAction); 
        window.isHeroTurn = true; 
        toggleSkillButtons(false); 
        writeLog(lang.combat.log_battle_start.replace("$1", window.getEnemyNameTrans(monster.name)));
    }, 100);
	if (hero.class === "Barbar" || hero.class === "Magus") {
    window.startHeroIdleAnimation();
	}
};

window.nextTurn = function() {
    if (checkGameOver()) return;

    // --- GLOBAL DİL VE KURALLAR TANIMLAMASI ---
    const currentLangCode = window.gameSettings.lang || 'tr';
    const globalLang = window.LANGUAGES[currentLangCode]; 
    const combatLang = globalLang.combat; 
    const classRules = CLASS_CONFIG[hero.class];
	const lang = window.getCombatLang();
    
    if (window.isHeroTurn) {
		hero.lastTurnDamageTaken = hero.damageTakenThisRound || 0;
        hero.damageTakenThisRound = 0;
		const stats = getHeroEffectiveStats(); // Güncel çarpanları al
    
		// RAGE REGEN UYGULA
		if (stats.rageRegen > 0) {
            const oldRage = hero.rage;
            hero.rage = Math.min(stats.maxRage, hero.rage + stats.rageRegen);
            updateStats(); 

            if (hero.rage > oldRage) {
                const resLabel = lang[`resource_${classRules.resourceName}`];
                const heroName = window.getHeroClassNameTrans();

                // A. Baz Yenilenme Logu (Örn: +40)
                if (stats.baseRageRegen > 0) {
                    const logMsg = lang.combat.log_mp_regen
                        .replace("$1", stats.baseRageRegen)
                        .replace("$2", resLabel);
                    writeLog(`✨ **${heroName}**: ${logMsg}`);
                }

                // B. Yetenek Bonusu Logu (Örn: +4)
                if (stats.bonusRageRegen > 0) {
                    const regenBuff = hero.statusEffects.find(e => e.id === 'rage_regen_buff');
                    const buffName = regenBuff ? regenBuff.name : "Bonus";
                    const logBonusMsg = lang.combat.log_mp_regen_skill
                        .replace("$1", buffName)
                        .replace("$2", stats.bonusRageRegen)
                        .replace("$3", resLabel);
                    writeLog(logBonusMsg);
                }
            }
        }

        // --- 1. TUR BAŞLANGICI VE BLOK/REGEN/ZEHİR İŞLEME ---
        window.combatTurnCount++;
        writeLog(`--- Tur ${window.combatTurnCount} ---`);
        if(turnCountDisplay) turnCountDisplay.textContent = window.combatTurnCount;
		
		const dotTypes = ['poison', 'fire', 'cold', 'lightning', 'curse', 'bleed'];
        const activeDots = hero.statusEffects.filter(e => dotTypes.includes(e.id) && !e.waitForCombat);
		
		// --- BLOOD MARK SÖNÜMLEME MANTIĞI (KORUNDU) ---
        const bm = hero.statusEffects.find(e => e.id === 'blood_mark_active');
        if (bm && window.combatTurnCount > 6) {
            bm.value = Math.max(0, bm.value - 0.05); 
            if (bm.value > 0) {
                writeLog(lang.combat.log_blood_mark_decay.replace("$1", Math.round(bm.value * 100)));
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
            setTimeout(() => { 
				showFloatingText(arenaCenter, globalLang.exhaustion_out_of_breath, 'damage');
				}, 1500);
            
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
			writeLog(lang.combat.log_crystal_burst.replace("$1", crystalEffect.name).replace("$2", crystalEffect.value).replace("$3", resLabel));
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
                writeLog(lang.combat.log_regen_tick.replace("$1", effect.name).replace("$2", hero.hp - oldHp));
            }
        });

		// --- 2. BROŞLARI SIRALI TETİKLE ---
         window.broochBuffer = { 
            heal: 0, resource: 0, damage: 0, isSpecialist: false,
            data: { fixedDmg: {}, statScaling: {}, totalHeal: 0, totalResource: 0 }
        };
		
		let currentBroochDelay = 300;
		hero.brooches.forEach((brooch) => {
            if (!brooch) return;
            if (!hero.broochCooldowns) hero.broochCooldowns = {};
            const bIndex = hero.brooches.indexOf(brooch);

            if ((hero.broochCooldowns[bIndex] || 0) <= 0) {
                window.executeBroochEffects(brooch);
                hero.broochCooldowns[bIndex] = brooch.frequency;
            }
            hero.broochCooldowns[bIndex]--;
        });

        // --- YENİ: ÖZET LOG JENERATÖRÜ ---
        const bd = window.broochBuffer.data;

        // 1. Özet Kaynak Logu
        if (bd.totalResource > 0) {
            const classRules = CLASS_CONFIG[hero.class];
            const rLabel = lang[`resource_${classRules.resourceName}`];
            writeLog(lang.combat.log_brooch_resource.replace("$1", bd.totalResource).replace("$2", rLabel));
        }

        // 2. Özet Şifa Logu
        if (bd.totalHeal > 0) {
            writeLog(lang.combat.log_brooch_heal.replace("$1", bd.totalHeal));
        }

        // 3. Özet Sabit Hasar Logları (Kabileye göre gruplanmış)
        for (const [tribe, val] of Object.entries(bd.fixedDmg)) {
            const tribeName = lang.enemy_names[tribe] || tribe;
            writeLog(lang.combat.log_brooch_fixed.replace("$1", lang.items.eff_fixed_dmg).replace("$2", tribeName).replace("$3", val));
        }

        // 4. Özet Stat Hasar Logları (Stat'a göre gruplanmış)
        for (const [stat, val] of Object.entries(bd.statScaling)) {
            const statLabel = lang.items['brostat_' + stat] || stat.toUpperCase();
            writeLog(lang.combat.log_brooch_stat.replace("$1", statLabel).replace("$2", val));
        }

        // --- TOPLAM FLOATING TEXT (Görsel Rakamlar) ---
		if (window.broochBuffer.heal > 0) {
			setTimeout(() => {
            showFloatingText(heroDisplayContainer, window.broochBuffer.heal, 'heal');
        }, 400);
		}

        if (window.broochBuffer.resource > 0) {
            setTimeout(() => {
                showFloatingText(heroDisplayContainer, `+${window.broochBuffer.resource} Rage`, 'heal');
            }, 700); // 0.5 saniye sonra
        }

        if (window.broochBuffer.damage > 0) {
            setTimeout(() => {
                const mDisp = document.getElementById('monster-display');
                const style = window.broochBuffer.isSpecialist ? 'skill' : 'damage';
                const suffix = window.broochBuffer.isSpecialist ? ` ${lang.combat.f_specialist}` : '';
                showFloatingText(mDisp, `${window.broochBuffer.damage}${suffix}`, style);
            }, 300); // 1 saniye sonra
        }

        updateStats(); // Tek seferde bar güncelleme

        // --- 3. DoT İŞLEME (Tüm broşlar bittikten sonra başlar) ---
        const dotStartTime = currentBroochDelay + 200; 
        setTimeout(() => {
            const dotTypes = ['poison', 'fire', 'cold', 'lightning', 'curse', 'bleed'];
            hero.statusEffects.filter(e => dotTypes.includes(e.id) && !e.waitForCombat).forEach((effect, idx) => {
                setTimeout(() => {
                    hero.hp = Math.max(0, hero.hp - effect.value);
                    showFloatingText(heroDisplayContainer, effect.value, 'damage');
                    // --- GÜNCELLEME ---
					//const lang = window.getCombatLang();
					const icon = window.getDotIcon(effect.id);
					const logMsg = lang.combat.log_dot_hit
						.replace("$1", icon)
						.replace("$2", window.getHeroClassNameTrans()) // Barbar, Magus vb.
						.replace("$3", effect.name)
						.replace("$4", effect.value);
					writeLog(logMsg);
					// ------------------
                    animateDamage(true); 
                    updateStats();
                }, idx * 300);
            });
        }, dotStartTime);
		
        // --- 3.5 BİYOM FIRTINASI HASARI (DİRENÇ GARANTİLİ) ---
        if (monster && monster.roomEvent === "storm") {
            // --- YENİ MATEMATİKSEL KURGU ---
            let stormBasePower = (hero.currentAct - 1) * 4; // Act 2: 4, Act 3: 8...
            const isRed = (monster.isHard || monster.isWeak);

            if (hero.currentAct === 1) {
                // Act 1 kuralı: Sadece kırmızılarda 3 vurur
                if (isRed) stormBasePower = 3;
            } else {
                // Act 2+ kuralı: Kırmızı ise Act hasarına +3 ekle
                if (isRed) stormBasePower += 3;
            }

            // Hile kodu varsa hepsini ezer
            if (window.stormDmgCheat !== undefined) stormBasePower = window.stormDmgCheat;
            // ---------------------------------
            
            if (stormBasePower > 0) {
                const lang = window.getCombatLang();
                const curElement = monster.roomElement;
                const elementName = lang.status[curElement] || curElement;

                // --- KRİTİK HESAPLAMA DÜZELTMESİ ---
                // SkillEngine yerine doğrudan direnç kontrolü yapıyoruz (Daha güvenli)
                const calculateStormNet = (target) => {
                    const stats = (target === hero) ? getHeroEffectiveStats() : { resists: target.resists };
                    const resist = stats.resists[curElement] || 0;
                    // Formül: Ham Güç - Direnç (Minimum 0)
                    return Math.max(0, stormBasePower - resist);
                };

                const heroNetDmg = calculateStormNet(hero);
                const monsterNetDmg = calculateStormNet(monster);
				const stormDelay = dotStartTime + (activeDots.length * 300) + 300;
                
                setTimeout(() => {
                    if (window.monster) { // Failsafe
                        const heroName = window.getHeroClassNameTrans();
                        const mName = window.getEnemyNameTrans(monster.name);
                        const elementName = lang.status[curElement] || curElement;

                        if (heroNetDmg > 0) {
                            hero.hp = Math.max(0, hero.hp - heroNetDmg);
                            showFloatingText(heroDisplayContainer, heroNetDmg, 'damage');
                            writeLog(lang.combat.log_storm_tick.replace("$1", heroName).replace("$2", heroNetDmg).replace("$3", elementName));
                        }
                        if (monsterNetDmg > 0) {
                            monster.hp = Math.max(0, monster.hp - monsterNetDmg);
                            showFloatingText(document.getElementById('monster-display'), monsterNetDmg, 'damage');
                            writeLog(lang.combat.log_storm_tick.replace("$1", mName).replace("$2", monsterNetDmg).replace("$3", elementName));
                        } else {
                            writeLog(lang.combat.log_storm_monster_resist.replace("$1", mName).replace("$2", elementName));
                        }
                        updateStats();
                        if (monster.hp <= 0) checkGameOver();
                    }
                }, stormDelay);
            }
        }
		// ----------------------------------------------------      
        // Temel bekleme: DoT'ların bitiş süresi
        let finalWaitTime = dotStartTime + (activeDots.length * 300) + 300;

        // EĞER fırtına varsa, bekleme süresine 600ms daha ekle (Yazılar okunsun)
        if (monster && monster.roomEvent === "storm") {
            finalWaitTime += 600;
        }

        // --- 5. SIRAYI DEVRET VE DURUM KONTROLLERİ ---
        setTimeout(() => {
            if (checkGameOver()) return; 

            // 1. ÖNCE STUN (SERSEMLEME) KONTROLÜ YAP
            const stunEffect = hero.statusEffects.find(e => e.id === 'stun' && !e.waitForCombat);
            const lang = window.getCombatLang(); // Dili tazele

            if (stunEffect) {
                // OYUNCU SERSEMLEMİŞSE:
                writeLog(lang.combat.log_stun_skip);
                showFloatingText(heroDisplayContainer, lang.status.stun, 'damage'); 
                
                // Durum sürelerini azalt (Sersemken de süreler akar)
                hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
                hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
                
                window.isHeroTurn = false; // Sırayı canavara ver
                determineMonsterAction(); 
                showMonsterIntention(window.monsterNextAction); 
                
                updateStats();
                // 1 saniye sonra canavarın hamlesi başlasın
                setTimeout(nextTurn, 1000); 
                return; // Fonksiyondan çık (Butonları açma!)
            }

            // 2. EĞER SERSEMLEME YOKSA (NORMAL AKIŞ):
            hero.statusEffects.forEach(e => { if (!e.waitForCombat) e.turns--; });
            hero.statusEffects = hero.statusEffects.filter(e => e.turns > 0);
            
            determineMonsterAction(); 
            showMonsterIntention(window.monsterNextAction); 
            
            // --- HIZLI TEPKİ ---
            // Oyuncunun butonlarını tekrar aktif et
            window.isHeroTurn = true; 
            toggleSkillButtons(false); 
            
            updateStats();
        }, finalWaitTime);

    } else {
		const enemyL = globalLang.enemy_names || {};
		const monsterNameTranslated = enemyL[monster.name] || monster.name;
        // --- CANAVAR SIRASI ---
        if (window.monster && monster.hp > 0) {
            toggleSkillButtons(true); 
            showMonsterIntention(null); 
		
		/// KRİTİK: DoT işlemlerini ve hamleyi setTimeout içine alıyoruz
        setTimeout(() => {
            if (!checkGameOver()) {
                
                // --- 1. ÖNCE CANAVAR ÜZERİNDEKİ DoT (KANAMA/ZEHİR) İŞLE ---
                const monsterDoTTypes = ['bleed', 'poison', 'fire', 'cold', 'lightning', 'curse'];
                monster.statusEffects.filter(e => monsterDoTTypes.includes(e.id) && !e.waitForCombat).forEach((effect, index) => {
                    setTimeout(() => {
                        monster.hp = Math.max(0, monster.hp - effect.value);
                        showFloatingText(document.getElementById('monster-display'), effect.value, 'damage');
                        // --- GÜNCELLEME ---
						const lang = window.getCombatLang();
						const icon = window.getDotIcon(effect.id);
						const monsterName = window.getEnemyNameTrans(monster.name);
						const logMsg = lang.combat.log_dot_hit
							.replace("$1", icon)
							.replace("$2", monsterName)
							.replace("$3", effect.name)
							.replace("$4", effect.value);
						writeLog(logMsg);
						// ------------------
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
							const enemyNames = globalLang.enemy_names || {}; // Eğer liste yoksa boş obje kabul et
							const monsterName = enemyNames[monster.name] || monster.name; // Çeviri varsa al, yoksa orijinal kalsın
                            if (packet) {
                                const resourceLabel = globalLang[`resource_${classRules.resourceName}`];

                                // Yetenek İsmi Gösterimi
                                const skillName = globalLang.enemy_skills[packet.id]?.name;
                                if (skillName) {
                                    writeLog(`⚠️ **${monsterNameTranslated}**: ${skillName}!`);
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
                                    setTimeout(() => { showFloatingText(floatingTarget, effectLabel, floatingType); }, 600);
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

                                if (packet.damage) {
                                    processMonsterDamage(monster, packet.damage);
                                } else {							
                                    animateMonsterSkill();
                                    updateStats();
										if (window.monsterDefenseTurns > 0) {
										window.monsterDefenseTurns--;
										if (window.monsterDefenseTurns === 0) {
										window.isMonsterDefending = false;
										window.monsterDefenseBonus = 0;
										// --- HATA FİX: Dili burada tekrar tanımla ---
										const langInner = window.getCombatLang(); 
										const mName = window.getEnemyNameTrans(monster.name);
										writeLog(langInner.combat.log_shield_end.replace("$1", mName));
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
	}
};


// YARDIMCI FONKSİYONLAR:
function handleMonsterDefend(attacker) {
	const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    const combatLang = window.LANGUAGES[window.gameSettings.lang || 'tr'].combat;
    
    // --- YENİ SİSTEM: SÜRE VE TAZELEME MANTIĞI ---
    // Eğer canavar zaten savunmadaysa, defans değerini artırma (stackleme), sadece süreyi tazele.
    if (!window.isMonsterDefending) {
        window.monsterDefenseBonus = Math.floor(attacker.attack / 2) + 5;
    }

    window.isMonsterDefending = true;
    window.monsterDefenseTurns = 2; // 2 yapıyoruz ki canavarın turu bittiğinde 1 kalsın.
    
    showFloatingText(document.getElementById('monster-display'), combatLang.monster_defend_text, 'heal');
    const enemyL = window.LANGUAGES[window.gameSettings.lang || 'tr'].enemy_names || {};
	const monsterName = enemyL[attacker.name] || attacker.name;

	const logDef = lang.combat.log_monster_defend
    .replace("$1", monsterName)
    .replace("$2", lang.combat.monster_log_defend)
    .replace("$3", window.monsterDefenseBonus)
    .replace("$4", "2 " + lang.turn_suffix); // "2 Tur" veya "2 Turns"
	writeLog(logDef);
    
    updateStats();
    
    setTimeout(() => {
        window.isHeroTurn = true;
        nextTurn();
    }, 100); 
}

window.showRoomEventBanner = function(eventKey) {
    const safeKey = eventKey || "none"; 
    const banner = document.getElementById('room-event-banner');
    const indicator = document.getElementById('active-room-event-indicator'); // Küçük gösterge
    const lang = window.getCombatLang();
    
    let eventName = (lang.room_events && lang.room_events[`event_${safeKey}`]) 
                    ? lang.room_events[`event_${safeKey}`] 
                    : safeKey;
					
	 // --- YENİ: FIRTINA TÜRÜNÜ EKLE ---
    if (safeKey === "storm" && window.monster && monster.roomElement) {
        const elementTrans = lang.status[monster.roomElement] || monster.roomElement;
        // Örn: "Biyom Fırtınası (Zehir)"
        eventName += ` (${elementTrans})`;
    }
    // ---------------------------------
	
	// --- YENİ: TAKVİYE BONUSUNU EKLE ---
    if (safeKey === "reinforcement" && window.monster && monster.reinforcementLabel) {
        // Örn: "Büyüsel Takviye (+4 Ateş)"
        eventName += ` (${monster.reinforcementLabel})`;
    }
    // -----------------------------------

    // 1. BÜYÜK BANNER (Geçici)
    if (banner) {
        banner.textContent = String(eventName).toUpperCase();
        banner.classList.remove('hidden', 'banner-animate');
        void banner.offsetWidth; 
        banner.classList.add('banner-animate');
        setTimeout(() => { banner.classList.add('hidden'); }, 2600);
    }

    // 2. KÜÇÜK GÖSTERGE (Kalıcı)
    if (indicator) {
        indicator.textContent = eventName;
        // 'none' değilse parlasın
        indicator.classList.toggle('active-event', safeKey !== 'none');
    }
};

window.updateSkillDamagePreviews = function() {
    // Savaşta değilsek tüm kutuları temizle
    if (!window.monster || monster.hp <= 0 || !battleScreen.classList.contains('active')) {
        document.querySelectorAll('.skill-damage-preview, .skill-def-preview, .skill-heal-preview, .skill-recoil-preview').forEach(el => el.remove());
        return;
    }

    const slots = document.querySelectorAll('.skill-slot');
    const stats = getHeroEffectiveStats();

    slots.forEach(slot => {
        const skillKey = slot.dataset.skillKey;
        if (!skillKey || !SKILL_DATABASE[skillKey]) return;

        const skillObj = SKILL_DATABASE[skillKey];
        
        // --- A. HASAR ÖNGÖRÜSÜ (Orta) ---
        let currentDmgTotal = 0;
        if (skillObj.data.scaling) {
            currentDmgTotal = SkillEngine.calculate(hero, skillObj.data, monster).total;
        }
        if (skillKey === 'blood_terror') currentDmgTotal = hero.hp - 1;
        if (skillKey === 'scales_of_fate') {
             const heroPct = (hero.hp / stats.maxHp);
             const monPct = (monster.hp / monster.maxHp);
             if (monPct > heroPct) currentDmgTotal += Math.floor(monster.maxHp * (monPct - heroPct) * 0.5);
        }
            if (skillKey === 'blade_of_retribution' && hero.lastTurnDamageTaken > 0) {
                currentDmgTotal = Math.floor(currentDmgTotal * 1.5);
            }
        if (skillKey === 'execute') {
                // Eğer canavarın canı %30 veya altındaysa göstergeyi 2 ile çarp
                if (monster.hp / monster.maxHp <= 0.3) {
                    currentDmgTotal *= 2;
                }
            }

        let pEl = slot.querySelector('.skill-damage-preview');
        if (currentDmgTotal > 0 || skillObj.data.scaling) {
            if (!pEl) {
                pEl = document.createElement('div');
                pEl.className = 'skill-damage-preview';
                slot.appendChild(pEl);
            }
            pEl.textContent = currentDmgTotal;
            pEl.classList.toggle('no-damage', currentDmgTotal <= 0);
        } else if (pEl) pEl.remove();

        // --- B. SAVUNMA / BLOK ÖNGÖRÜSÜ (Sağ) ---
        let defVal = 0;
        switch(skillKey) {
            case 'guard': defVal = Math.floor(stats.int * 0.34); break;
            case 'block': defVal = stats.blockPower; break;
            case 'Ice_Shield': defVal = Math.floor(stats.mp_pow * 2); break;
            case 'blood_shield': defVal = Math.floor(Math.ceil(hero.hp * 0.20) * 1.5); break;
            case 'scales_of_fate': 
                if ((hero.hp / stats.maxHp) > (monster.hp / monster.maxHp)) {
                    defVal = Math.floor(stats.maxHp * ((hero.hp / stats.maxHp) - (monster.hp / monster.maxHp)) * 0.5);
                }
                break;
        }

        let dEl = slot.querySelector('.skill-def-preview');
        if (defVal > 0) {
            if (!dEl) {
                dEl = document.createElement('div');
                dEl.className = 'skill-def-preview';
                slot.appendChild(dEl);
            }
            dEl.textContent = defVal;
        } else if (dEl) dEl.remove();

        // --- C. İYİLEŞME ÖNGÖRÜSÜ (Sol) ---
        let healVal = 0;
        switch(skillKey) {
            case 'minor_healing': healVal = 10 + Math.floor(stats.int * 0.5); break;
            case 'Cauterize': healVal = 25; break;
            case 'Healing_Light': healVal = Math.floor(stats.maxHp * 0.20); break;
            case 'blood_lust': healVal = Math.floor(currentDmgTotal * 0.50); break;
            case 'Rejuvanate': healVal = stats.int; break;
        }

        let hEl = slot.querySelector('.skill-heal-preview');
        if (healVal > 0) {
            if (!hEl) {
                hEl = document.createElement('div');
                hEl.className = 'skill-heal-preview';
                slot.appendChild(hEl);
            }
            // Eğer Rejuvanate gibi tur bazlıysa yanına bir döngü simgesi koyabiliriz (isteğe bağlı)
            if (skillKey === 'Rejuvanate') {
                hEl.textContent = "↻" + healVal; 
            } else {
                hEl.textContent = healVal;
            }
        } else if (hEl) hEl.remove();

        // --- D. ÖZ-HASAR / BEDEL ÖNGÖRÜSÜ (Alt - YENİ YERİ) ---
        let recoilVal = 0;
        switch(skillKey) {
            case 'reckless_strike': recoilVal = Math.floor(currentDmgTotal * 0.25); break;
            case 'double_blade': recoilVal = Math.floor(currentDmgTotal * 0.25); break;
            case 'blood_price': recoilVal = Math.floor(stats.maxHp * 0.15); break;
            case 'blood_shield': recoilVal = Math.ceil(hero.hp * 0.20); break;
            case 'blood_terror': recoilVal = hero.hp - 1; break;
        }

        let recEl = slot.querySelector('.skill-recoil-preview');
        if (recoilVal > 0) {
            if (!recEl) {
                recEl = document.createElement('div');
                recEl.className = 'skill-recoil-preview';
                slot.appendChild(recEl);
            }
            // Alt tarafa taşındığı için Ünlem işareti koyup koymamak sana kalmış, ben ekliyorum:
            recEl.textContent = "❗" + recoilVal;
        } else if (recEl) recEl.remove();
		
        // --- E. DOT / BEDEL ÖNGÖRÜSÜ (Alt - YENİ YERİ) ---
		let dotVal = 0;
		let dotType = "";
		if (skillObj.data.dotEffect) {
			dotVal = SkillEngine.calculateDoT(hero, skillObj.data, monster);
			dotType = skillObj.data.dotEffect.type;
		}

		let dotEl = slot.querySelector('.skill-dot-preview');
		if (dotVal > 0) {
			if (!dotEl) {
				dotEl = document.createElement('div');
				dotEl.className = 'skill-dot-preview';
				slot.appendChild(dotEl);
			}
			// Değeri yaz ve elementin rengini uygula
			dotEl.textContent = "↻" + dotVal; // Tekrar simgesi (↻) DoT olduğunu belli eder
			dotEl.className = `skill-dot-preview dot-${dotType}`;
		} else if (dotEl) dotEl.remove();
    });
};


window.animateMonsterSkill = function() {
    // Yeşilden Mora geçiş için hue-rotate ve parlatma
    monsterDisplayImg.style.transition = "filter 0.3s ease";
    
    // hue-rotate(280deg) canavarı mor/pembe tonlarına sokar
    monsterDisplayImg.style.filter = 'brightness(2.5) saturate(1.5) hue-rotate(280deg) drop-shadow(0 0 15px #800080)';
    
    setTimeout(() => { 
        monsterDisplayImg.style.filter = 'none'; 
    }, 600);
};

window.playHeroDeathAnimation = function(onComplete) {
    const deathViewer = document.getElementById('hero-death-viewer');
    const idleViewer = document.getElementById('hero-idle-viewer');
    const spriteViewer = document.getElementById('hero-sprite-viewer');

    if (!deathViewer) return;

    // --- SINIF BAZLI ÖZEL AYARLAR ---
    const isMagus = (hero.class === "Magus");
    
    // Magus ise 60ms (daha yavaş), Barbar ise 50ms hızında ölür
    const animationSpeed = isMagus ? 75 : 50; 
    
    // Magus ise 30. karede (asayı tutarken), Barbar ise 20. karede (düşerken) ekran kararır
    const fadeStartFrame = isMagus ? 30 : 20; 

    // Doğru spritesheet dosyasını yükle
    const deathPath = isMagus 
        ? 'images/heroes/magus/magus_death_sprite.webp' 
        : 'images/heroes/barbarian/barbar_death_sprite.webp';
    // --------------------------------

    // Hazırlık
    if (idleViewer) idleViewer.style.display = "none";
    if (spriteViewer) spriteViewer.classList.remove('sprite-active');
    
    deathViewer.style.backgroundImage = `url('${deathPath}')`;
    deathViewer.style.display = "block";

    let dFrame = 0;
    const totalFrames = 40;

    let deathInterval = setInterval(() => {
        let col = dFrame % 5;
        let row = Math.floor(dFrame / 5);
        
        // 563x317 ölçülerine göre kaydır
        deathViewer.style.backgroundPosition = `-${col * 563}px -${row * 317}px`;

        // Dinamik kararma zamanlaması
        if (dFrame === fadeStartFrame) {
            triggerDeathEffect(); 
        }

        if (dFrame >= totalFrames - 1) {
            clearInterval(deathInterval);
            if (onComplete) onComplete(); 
        }
        dFrame++;
    }, animationSpeed); // Dinamik hız
};

window.checkGameOver = function() {
	const lang = window.getCombatLang(); // <-- BU SATIRI EKLE
    if (hero.hp <= 0) { 
        const classRules = CLASS_CONFIG[hero.class];
        writeLog(lang.combat.log_defeat);
        hero.hp = 0; 
        updateStats(); 
        
        // --- 1. KAYDI SİL VE LOGLARI AYARLA (Sınıf bağımsız, her zaman çalışır) ---
        if (window.deleteSave) window.deleteSave(); 

        window.isLogMinimized = false; 
        window.applySettings(); 
        
        setTimeout(() => {
            const logArea = document.getElementById('combat-log-area');
            if(logArea) logArea.scrollTop = logArea.scrollHeight;
        }, 100); 

        // --- 2. SİNEMATİK ÖLÜM AKIŞI ---
        if (hero.class === "Barbar" || hero.class === "Magus") {
            // A. BARBAR İÇİN: Spritesheet animasyonunu başlat
            window.playHeroDeathAnimation(() => {
                // Bu kısım animasyon TAMAMLANDIĞINDA çalışır
                switchScreen(gameOverScreen); 
                resetDeathEffect(); 
                const continueBtn = document.getElementById('btn-continue');
                if (continueBtn) continueBtn.classList.add('hidden');
                // Barbar yerde serili kalsın diye viewer'ı temizlemiyoruz, ekran zaten değişti
            });
        } else {
            // B. DİĞER SINIFLAR İÇİN: Senin orijinal kodun (Statik Resim + 1.8sn Gecikme)
            heroDisplayImg.src = classRules.visuals.dead; 
            triggerDeathEffect(); 
            
            setTimeout(() => { 
                switchScreen(gameOverScreen); 
                resetDeathEffect(); 
                const continueBtn = document.getElementById('btn-continue');
                if (continueBtn) continueBtn.classList.add('hidden');
            }, 1800); 
        }
        return true; 
    }
    if (monster && monster.hp <= 0) {
		// YENİ: Horde Dirilme Mantığı
        if (monster.roomEvent === "horde" && !monster.hasRevived) {
            monster.hp = Math.floor(monster.maxHp * 0.5);
            monster.hasRevived = true;
            monster.isHordeBonus = true; // Ganimet için işaret
            writeLog(lang.combat.log_horde_revive);
            updateStats();
            return false; // Savaşı bitirme, devam et
        }
        writeLog(lang.combat.log_victory.replace("$1", window.getEnemyNameTrans(monster.name)));
        monster.hp = 0; updateStats(); 
        const staticImg = document.getElementById('monster-static-img');
        const spriteViewer = document.getElementById('monster-sprite-viewer');

        // 1. Spritesheet'i durdur ve temizle
        if (window.monsterIdleInterval) {
            clearInterval(window.monsterIdleInterval);
            window.monsterIdleInterval = null;
        }

        // 2. Sprite kutusunu kapat, Statik kutuyu aç
        if (spriteViewer) spriteViewer.style.display = "none";
        
        if (staticImg) {
            // Ölü resmini yükle
            staticImg.src = `images/${monster.dead}`; 
            
            // Görsel efektleri uygula
            staticImg.style.display = "block";
            staticImg.style.opacity = "1";
            staticImg.style.filter = 'grayscale(100%) brightness(0.5)';
            
            // NOT: Koordinat atamalarını JS'den sildik çünkü yukarıda CSS ile sabitledik.
            // Bu sayede "yukarı kayma" sorunu tamamen ortadan kalkar.
        }
		
		// EN YÜKSEK TIER GÜNCELLEME
    if (monster.tier > hero.highestTierDefeated) {
        hero.highestTierDefeated = monster.tier;
        writeLog(lang.combat.log_new_tier.replace("$1", hero.highestTierDefeated));
    }
        
        const rewards = window.LootManager.generateLoot(monster);
		
		// --- YENİ: EVENT BONUS ALTIN KONTROLÜ ---
        if (hero.eventBonusGold) {
            rewards.push({ type: 'gold', value: hero.eventBonusGold });
            writeLog(lang.combat.log_event_gold.replace("$1", hero.eventBonusGold));
            hero.eventBonusGold = 0; // Bonusu sıfırla
        }
		
        // ----------------------------
		
		// --- KRİTİK: BLOOD MARK ZAFER BONUSU ---
        if (hero.sessionLifeStolen > 0) {
            // Toplam çalınan kanın %40'ı kalıcı can olur
            const hpReward = Math.floor(hero.sessionLifeStolen * 0.40); 
            
            if (hpReward > 0) {
                hero.permanentHpBonus = (hero.permanentHpBonus || 0) + hpReward;
                writeLog(lang.combat.log_permanent_hp.replace("$1", hpReward));
                
                // Karakterin mevcut canını da artan Max HP kadar iyileştirebiliriz (Opsiyonel)
                hero.hp += hpReward;
            }
            // Havuzu bir sonraki oda için sıfırla
            hero.sessionLifeStolen = 0; 
        }
        // ----------------------------------------

        // --- GÜNCELLEME: XP HESAPLAMA MANTIĞI ---      
        let xpGainAmount = 4; // Varsayılan 4 XP
        
        // EĞER Boss, Hard oda VEYA Horde (Sürü) odasındaysak kesinlikle 5 XP ver
        if (monster.isHard || monster.isBoss || monster.isHordeBonus) {
            xpGainAmount = 5;
        }
        // ----------------------------------------
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

window.broochBuffer = { heal: 0, resource: 0, damage: 0, isSpecialist: false };

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
        // --- A. MATEMATİKSEL İŞLEM (ANINDA) ---
        // Puanları anında topluyoruz ki nextTurn içinde hemen gösterebilelim.
        switch(eff.id) {
            case "fixed_dmg":
                let fVal = eff.value * damageMult;
                monster.hp = Math.max(0, monster.hp - fVal);
                window.broochBuffer.damage += fVal;
                if (isSpecialist) window.broochBuffer.isSpecialist = true;
                
                // Kabileye göre hasarı topla
                let tribe = brooch.specialtyTribe;
                window.broochBuffer.data.fixedDmg[tribe] = (window.broochBuffer.data.fixedDmg[tribe] || 0) + fVal;
                break;
                
            case "stat_scaling":
                let sVal = Math.max(1, Math.floor(stats[eff.targetStat] * eff.value));
                monster.hp = Math.max(0, monster.hp - sVal);
                window.broochBuffer.damage += sVal;
                
                // Stat türüne göre hasarı topla
                let stat = eff.targetStat;
                window.broochBuffer.data.statScaling[stat] = (window.broochBuffer.data.statScaling[stat] || 0) + sVal;
                break;

            case "heal":
                const oldHp = hero.hp;
                hero.hp = Math.min(stats.maxHp, hero.hp + eff.value);
                window.broochBuffer.heal += (hero.hp - oldHp);
                window.broochBuffer.data.totalHeal += (hero.hp - oldHp);
                break;

            case "resource_regen":
                const oldRage = hero.rage;
                hero.rage = Math.min(stats.maxRage, hero.rage + eff.value);
                let gain = (hero.rage - oldRage);
                window.broochBuffer.resource += gain;
                window.broochBuffer.data.totalResource += gain;
                break;
        }
    });
};

