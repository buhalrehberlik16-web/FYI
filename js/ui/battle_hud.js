// js/ui/battle_hud.js
window.monster = null; // Canavar değişkenini en başta 'boş' olarak tanımla
window.updateStatusIcons = function(char, container) {
    if (!container) return;
    container.innerHTML = ''; 
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
	
    char.statusEffects.forEach(effect => {
        const icon = document.createElement('div'); 
        icon.className = 'status-icon';
        const buffIds = ['atk_up', 'def_up', 'regen', 'str_up', 'atk_up_percent', 'ignore_def', 'guard_active', 'fury_active', 'insta_kill', 'wind_up'];
        const debuffIds = ['block_skill', 'block_type', 'atk_half', 'stun', 'curse_damage', 'monster_stunned', 'defense_zero', 'debuff_webbed', 'debuff_enemy_atk', 'debuff_enemy_def'];

        // İkon Belirleme (Mevcut ikon mantığın korunuyor)
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
        else icon.innerHTML = '✨';

        if (buffIds.includes(effect.id)) icon.classList.add('status-buff');
        else if (debuffIds.includes(effect.id)) icon.classList.add('status-debuff');
		
        const statusName = lang.status[effect.id] || effect.name;
        const turnText = lang.turn_suffix;

        if (effect.waitForCombat) { 
            icon.classList.add('status-waiting');
            icon.title = `${statusName} (${lang.preparing})`; 
        } else { 
            icon.title = `${statusName} (${effect.turns} ${turnText})`; 
        }
        container.appendChild(icon);
    });
};

window.updateStats = function() {
    // 1. Karakter statlarını al
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : { maxHp: 40, maxRage: 110 };
    const currentMaxHp = effective.maxHp;
    const currentMaxRage = effective.maxRage;

    if (hero.hp > currentMaxHp) { hero.hp = currentMaxHp; }
    if (hero.rage > effective.maxRage) hero.rage = effective.maxRage;

    // HP ve Rage Barlarını Güncelle
    if(heroHpBar) heroHpBar.style.width = (hero.hp / currentMaxHp) * 100 + '%';
    if(heroHpText) heroHpText.textContent = `${hero.hp} / ${currentMaxHp}`;
    if(heroRageBar) heroRageBar.style.width = (hero.rage / currentMaxRage) * 100 + '%';
    if(heroRageText) heroRageText.textContent = `${hero.rage} / ${currentMaxRage}`;
	
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
};

// Biriktirme için global değişkenler
window.rageBuffer = 0;
window.isBufferingRage = false;

window.showFloatingText = function(targetContainer, amount, type) {
    // --- BARBAR ÖZEL: GÖRSEL BİRLEŞTİRME KONTROLÜ ---
    if (window.isBufferingRage && hero.class === 'Barbar') {
        const textStr = String(amount);
        if (textStr.toLowerCase().includes('rage')) {
            // Metnin içindeki rakamı ayıkla (+10 Rage -> 10)
            const num = parseInt(textStr.replace(/[^0-9]/g, '')) || 0;
            window.rageBuffer += num;
            return; // Ekrana basmadan çık (Susturma)
        }
    }
    // -----------------------------------------------

    const textEl = document.createElement('div');
    textEl.textContent = (typeof amount === 'number' && amount > 0 && type === 'heal') ? `+${amount}` : amount;
    textEl.className = `floating-text ${type}-text`;
    
    // Skill text stili kontrolü (Düşman skilleri için mor parlama)
    if (type === 'skill') textEl.classList.add('skill-text');
    
    targetContainer.appendChild(textEl);
    setTimeout(() => textEl.remove(), 1500);
};


//window.showFloatingText = function(targetContainer, amount, type) {
//    const textEl = document.createElement('div');
//    textEl.textContent = (typeof amount === 'number' && amount > 0 && type === 'heal') ? `+${amount}` : amount;
//    textEl.className = `floating-text ${type}-text`;
//    targetContainer.appendChild(textEl);
//    setTimeout(() => textEl.remove(), 1500);
//};

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