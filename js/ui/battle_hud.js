// js/ui/battle_hud.js
window.monster = null; // Canavar değişkenini en başta 'boş' olarak tanımla
window.updateStatusIcons = function(char, container) {
    if (!container) return;
    container.innerHTML = ''; 
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
	
    // --- YENİ: YORGUNLUK İKONLARINI LİSTEYE ENJEKTE ET ---
    // Sadece karakter (hero) ise ve yorgunluk 50 üzerindeyse statü listesine sanal etkiler ekle
    let displayEffects = [...char.statusEffects]; // Orijinal listeyi bozmamak için kopyasını alıyoruz

    if (char === window.hero && char.exhaustion >= 50) {
        // 50+ Zırh Cezası İkonu
        displayEffects.push({
            id: 'exhaust_def_debuff',
            name: lang.status.exhaust_def_debuff || "Yorgunluk (Zırh Kaybı)",
            isPermanent: true // Tur sayacı görünmesin diye
        });

        // 100+ Atak Cezası İkonu
        if (char.exhaustion >= 100) {
            displayEffects.push({
                id: 'exhaust_atk_debuff',
                name: lang.status.exhaust_atk_debuff || "Yorgunluk (Atak Kaybı)",
                isPermanent: true
            });
        }
    }
    // -------------------------------------------------------

    displayEffects.forEach(effect => {
        const icon = document.createElement('div'); 
        icon.className = 'status-icon';
        const buffIds = ['atk_up', 'def_up', 'regen', 'str_up', 'atk_up_percent', 'ignore_def', 'guard_active', 'fury_active', 'insta_kill', 'wind_up'];
        const debuffIds = ['block_skill', 'block_type', 'atk_half', 'stun', 'curse_damage', 'monster_stunned', 'defense_zero', 'debuff_webbed', 'debuff_enemy_atk', 'debuff_enemy_def', 'exhaust_def_debuff', 'exhaust_atk_debuff'];

        // İkon Belirleme (Yorgunluk İkonları Eklendi)
        if (effect.id === 'atk_up' || effect.id === 'atk_up_percent') icon.innerHTML = '⚔️';
        else if (effect.id === 'def_up' || effect.id === 'guard_active') icon.innerHTML = '🛡️';
        else if (effect.id === 'str_up') icon.innerHTML = '💪';
        else if (effect.id === 'regen') icon.innerHTML = '💖';
        else if (effect.id === 'fury_active') icon.innerHTML = '🔥';
        else if (effect.id === 'wind_up') icon.innerHTML = '💨';
        else if (effect.id === 'block_skill' || effect.id === 'block_type') icon.innerHTML = '🚫';
        else if (effect.id === 'stun' || effect.id === 'monster_stunned') icon.innerHTML = '💫';
        else if (effect.id === 'curse_damage') icon.innerHTML = '💀';
        else if (effect.id === 'atk_half') icon.innerHTML = '👎';
        else if (effect.id === 'defense_zero') icon.innerHTML = '💔';
        else if (effect.id === 'debuff_webbed') icon.innerHTML = '🕸️';
        // --- YORGUNLUK ÖZEL SEMBOLLERİ ---
        else if (effect.id === 'exhaust_def_debuff') {
            // RPG Ruhu: Kalkanın içinde eksi (-) işareti
            icon.innerHTML = '<div style="position:relative;">🛡️<span style="position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); font-size:0.6em; color:#ff4d4d; font-weight:900;">-</span></div>';
        }
        else if (effect.id === 'exhaust_atk_debuff') {
            // RPG Ruhu: Kılıç/Atak sembolü ve eksi (-) işareti
            icon.innerHTML = '<div style="position:relative;">⚔️<span style="position:absolute; top:45%; left:50%; transform:translate(-50%,-50%); font-size:0.6em; color:#ff4d4d; font-weight:900;">-</span></div>';
        }
        // ---------------------------------
        else icon.innerHTML = '✨';

        if (buffIds.includes(effect.id)) icon.classList.add('status-buff');
        else if (debuffIds.includes(effect.id)) icon.classList.add('status-debuff');
		
        const statusName = lang.status[effect.id] || effect.name;
        const turnText = lang.turn_suffix;

        if (effect.waitForCombat) { 
            icon.classList.add('status-waiting');
            icon.title = `${statusName} (${lang.preparing})`; 
        } else { 
            // Yorgunluk statiktir, yanına (3 Tur) gibi bir yazı gelmesin
            if (effect.isPermanent || effect.hideNumber) {
                icon.title = `${statusName}`; 
            } else {
                icon.title = `${statusName} (${effect.turns} ${turnText})`;
            }
        }
        container.appendChild(icon);
    });
};

window.updateStats = function() {
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    // 1. Karakter statlarını al
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : { maxHp: 40, maxRage: 110 };
    const currentMaxHp = effective.maxHp;
    const currentMaxRage = effective.maxRage;

    if (hero.hp > currentMaxHp) { hero.hp = currentMaxHp; }
    if (hero.rage > effective.maxRage) hero.rage = effective.maxRage;

    // HP ve Rage Barlarını Güncelle
    if(heroHpBar) heroHpBar.style.width = (hero.hp / currentMaxHp) * 100 + '%';
    if(heroHpText) heroHpText.textContent = `${hero.hp} / ${currentMaxHp}`;
	
    if(heroRageBar) {
    heroRageBar.style.width = (hero.rage / currentMaxRage) * 100 + '%';
    // --- YENİ: SINIF RENGİNİ UYGULA ---
    const classRules = CLASS_CONFIG[hero.class];
    heroRageBar.style.backgroundColor = classRules.resourceColor;
	}
    if(heroRageText) {
    const resKey = CLASS_CONFIG[hero.class].resourceName; // "rage" veya "mana" döner
    const resourceLabel = lang[`resource_${resKey}`]; // "Öfke" veya "Mana" döner
    heroRageText.textContent = `${hero.rage} / ${currentMaxRage} ${resourceLabel}`;
	}
	
    if(heroNameDisplay) heroNameDisplay.innerHTML = `${hero.playerName} <span style="color:#ffffff; font-size:0.8em; opacity:0.8;">(${hero.class})</span>`;
    
    // --- KRİTİK GÜVENLİK: Sadece Canavar Varsa Güncelle ---
    if (window.monster) { 
        if(monsterHpBar) monsterHpBar.style.width = (monster.hp / monster.maxHp) * 100 + '%';
        if(monsterHpText) monsterHpText.textContent = `${monster.hp} / ${monster.maxHp}`;
        if (monsterNameDisplay) {
            const currentLang = window.gameSettings.lang || 'tr';
            const translatedName = window.LANGUAGES[currentLang].enemy_names[monster.name] || monster.name;
            monsterNameDisplay.textContent = translatedName;
			updateStatusIcons(monster, monsterStatusContainer); // Monster ikonları
        }

        // Canavar blok göstergesi
        const monBlockInd = document.getElementById('monster-block-indicator');
        if (monBlockInd) {
            monBlockInd.classList.toggle('hidden', !window.isMonsterDefending);
            monBlockInd.classList.toggle('active-shield', window.isMonsterDefending);
        }
    } else {
        // Canavar yoksa blok göstergesini gizle
        const monBlockInd = document.getElementById('monster-block-indicator');
        if (monBlockInd) monBlockInd.classList.add('hidden');
    }
    // -----------------------------------------------------

    // Karakter (Hero) Blok Göstergesi
    const blockDisplay = document.getElementById('hero-block-indicator');
    const blockText = document.getElementById('hero-block-text');
    if (blockDisplay && blockText) {
        blockDisplay.classList.toggle('hidden', !(heroBlock > 0));
        if (heroBlock > 0) blockText.textContent = heroBlock;
    }

    // --- BİLDİRİM KONTROLÜ (Settings Toggle) ---
    const isAllowedBySettings = window.gameSettings.showNotifs;
    if (statNotif) {
        statNotif.classList.toggle('hidden', !isAllowedBySettings || !(hero.statPoints > 0));
    }
    if (skillNotif) {
        skillNotif.classList.toggle('hidden', !isAllowedBySettings || !(hero.skillPoints > 0));
    }
    // -------------------------------------------

    updateStatusIcons(hero, heroStatusContainer); // Hero ikonları
    updateGoldUI();
    if (statScreen && !statScreen.classList.contains('hidden')) updateStatScreen();
	if (typeof updateNPCStatsDisplay === 'function') updateNPCStatsDisplay();
    
	const spDisplay = document.getElementById('skill-points-display');
	if (spDisplay) spDisplay.textContent = hero.skillPoints;
	
	// --- YORGUNLUK GÖRSEL GÜNCELLEME (STAT EKRANI) ---
    const statExText = document.getElementById('stat-exhaustion-text');
    const statExSari = document.getElementById('stat-exhaustion-bar-sari');
    const statExMor = document.getElementById('stat-exhaustion-bar-mor');

    if (statExText) {
        statExText.textContent = `${Math.floor(hero.exhaustion)} / 200`;
        // Renk değişimi: 100'den sonra mor, önce sarı
        statExText.style.color = hero.exhaustion > 100 ? "#6a0dad" : "#9b59b6";

        if (hero.exhaustion <= 100) {
            statExSari.style.width = hero.exhaustion + "%";
            statExMor.style.width = "0%";
        } else {
            statExSari.style.width = "100%";
            statExMor.style.width = (hero.exhaustion - 100) + "%";
        }
    }
	if (hero.hp > 0 && typeof window.updateExhaustionUI === 'function') {
        window.updateExhaustionUI();
    }
};

// Biriktirme için global değişkenler
window.rageBuffer = 0;
window.isBufferingRage = false;

window.showFloatingText = function(targetContainer, amount, type) {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
	const stats = getHeroEffectiveStats(); // Max limitleri kontrol etmek için
    const classRules = CLASS_CONFIG[hero.class];
    
    // --- YENİ: DİNAMİK KAYNAK İSMİ DEĞİŞTİRME ---
    // Eğer miktar bir yazıysa (örn: "+10 Rage") içindeki 'Rage' kelimesini 
    // sınıfın gerçek kaynak ismiyle (Mana/Öfke) değiştirir.
    let textStr = String(amount);
    const resourceLabel = lang[`resource_${classRules.resourceName}`]; // "Mana" veya "Öfke"
    
    // 'Rage' kelimesini (büyük/küçük harf duyarsız) bul ve güncel etiketle değiştir
    textStr = textStr.replace(/Rage/gi, resourceLabel);
    // --------------------------------------------
	
	// --- YENİ: BAR DOLUYSA KAYNAK YAZISINI GÖSTERME ---
    // Eğer metin kaynak ismi içeriyorsa ve can barı zaten doluysa (veya gelen miktar pozitifse)
    if (textStr.toLowerCase().includes(resourceLabel.toLowerCase())) {
        const isGain = textStr.includes('+') || (typeof amount === 'number' && amount > 0);
        
        if (isGain && hero.rage >= stats.maxRage) {
            // Eğer bar zaten doluysa, buffer'ı da temizle ve metni göstermeden çık
            if (window.isBufferingRage) window.rageBuffer = 0; 
            return; 
        }
    }
    // -------------------------------------------------

    // --- KRİTİK DÜZELTME: hero.class === 'Barbar' ŞARTINI KALDIRDIK ---
    // Artık tüm sınıflar yetenek kullanırken kaynak yazılarını buffer'a atar
    if (window.isBufferingRage) {
        if (textStr.toLowerCase().includes(resourceLabel.toLowerCase())) {
            const num = parseInt(textStr.replace(/[^0-9]/g, '')) || 0;
            window.rageBuffer += num;
            return; // Ekrana basmadan çık (Puanı sakla)
        }
    }
    // -----------------------------------------------

    const textEl = document.createElement('div');
    
    // İçerik sayıysa ve iyileşmeyse başına '+' koy, değilse filtrelenmiş metni bas
    textEl.textContent = (typeof amount === 'number' && amount > 0 && type === 'heal') ? `+${amount}` : textStr;
    
    textEl.className = `floating-text ${type}-text`;
    
    // Skill text stili kontrolü (Düşman skilleri için mor parlama)
    if (type === 'skill') textEl.classList.add('skill-text');
    
    targetContainer.appendChild(textEl);
    setTimeout(() => textEl.remove(), 1500);
};

window.animateDamage = function(isHero) {
    const display = isHero ? heroDisplayImg : monsterDisplayImg;
    display.style.transition = 'transform 0.1s ease-out, filter 0.1s ease-out'; 
    display.style.transform = 'translateX(-50%) translateY(-10px) scale(1.05)';
    display.style.filter = 'brightness(1.5) drop-shadow(0 0 10px red)';
    setTimeout(() => {
        display.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        display.style.filter = 'none';
    }, 150); 
};

window.showMonsterIntention = function(action) {
    if (!monsterIntentionOverlay) return;

    // EĞER aksiyon null ise veya canavar öldüyse GİZLE ve ÇIK
    if (!action || !monster || monster.hp <= 0) {
        monsterIntentionOverlay.classList.remove('active');
        monsterIntentionOverlay.style.opacity = "0";
        return;
    }

    const iconPath = "images/enemies/intentions/";
    let iconName = "";

    // Aksiyon tipine göre doğru dosyayı seç
    if (action === 'attack1' || action === 'attack2') iconName = "intention_attack.webp";
    else if (action === 'defend') iconName = "intention_defend.webp";
    else {
        // Skiller için kategorisine bak
        const stats = ENEMY_STATS[monster.name];
        const skillData = stats.skills.find(s => s.id === action);
        if (skillData) {
            if (skillData.category === 'buff') iconName = "intention_buff.webp";
            else if (skillData.category === 'debuff') iconName = "intention_debuff.webp";
            else iconName = "intention_skill_attack.webp";
        } else {
            iconName = "intention_attack.webp";
        }
    }

    monsterIntentionOverlay.innerHTML = `<img src="${iconPath}${iconName}" alt="intent">`;
    
    // Animasyonu tetikle
    monsterIntentionOverlay.classList.remove('active');
    void monsterIntentionOverlay.offsetWidth; // Reflow
    monsterIntentionOverlay.classList.add('active');
    monsterIntentionOverlay.style.opacity = "1";
};

window.animateHealingParticles = function() {
    for (let i = 0; i < 15; i++) { 
        const particle = document.createElement('div'); particle.className = 'healing-particle';
        const startX = Math.random() * 60 + 20; const moveX = (Math.random() * 160 - 80) + 'px';
        particle.style.setProperty('--move-x', moveX);
        particle.style.left = startX + '%'; particle.style.top = (Math.random() * 60 + 20) + '%';
        heroDisplayContainer.appendChild(particle);
        setTimeout(() => particle.remove(), 2500);
    }
};

window.syncHpWithRatio = function(actionCallback) {
    // 1. İşlemden önceki efektif Max HP'yi ve mevcut oranı bul
    const oldStats = getHeroEffectiveStats();
    const ratio = hero.hp / oldStats.maxHp;

    // 2. Asıl işlemi yap (item takma, stat verme vb.)
    actionCallback();

    // 3. İşlemden sonraki yeni efektif Max HP'yi bul
    const newStats = getHeroEffectiveStats();
    
    // 4. Oranı yeni Max HP'ye uygula ve yuvarla
    hero.hp = Math.round(newStats.maxHp * ratio);
    
    // Güvenlik: Can 1'in altına düşmesin (eğer çok azsa)
    if (hero.hp <= 0 && ratio > 0) hero.hp = 1;

    updateStats(); // UI'ı tazele
};

window.triggerDeathEffect = function() { if (fadeOverlay) fadeOverlay.classList.add('active-fade'); };
window.resetDeathEffect = function() { if (fadeOverlay) fadeOverlay.classList.remove('active-fade'); };