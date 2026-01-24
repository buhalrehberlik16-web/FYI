// js/ui/battle_hud.js
window.updateStatusIcons = function() {
    if (!heroStatusContainer) return;
    heroStatusContainer.innerHTML = ''; 
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
	
    hero.statusEffects.forEach(effect => {
        const icon = document.createElement('div'); 
        icon.className = 'status-icon';
        const buffIds = ['atk_up', 'def_up', 'regen', 'str_up', 'atk_up_percent', 'ignore_def', 'guard_active', 'fury_active', 'insta_kill', 'wind_up'];
        const debuffIds = ['block_skill', 'block_type', 'atk_half', 'stun', 'curse_damage', 'monster_stunned', 'defense_zero'];

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
        else icon.innerHTML = '✨';

        if (buffIds.includes(effect.id)) icon.classList.add('status-buff');
        else if (debuffIds.includes(effect.id) || effect.id.startsWith('debuff_')) icon.classList.add('status-debuff');
		
		const statusName = lang.status[effect.id] || effect.name; // Dilden ismi al
        const turnText = lang.turn_suffix; // "Tur" veya "Turns"

        if (effect.waitForCombat) { 
            icon.classList.add('status-waiting');
            icon.title = `${statusName} (${lang.preparing})`; 
        } else { 
            icon.title = `${statusName} (${effect.turns} ${turnText})`; 
        }
        heroStatusContainer.appendChild(icon);
    });

    hero.mapEffects.forEach(effect => {
        const icon = document.createElement('div'); icon.className = 'status-icon';
        icon.style.borderColor = '#00ccff'; icon.style.color = '#00ccff'; 
        icon.innerHTML = (effect.id === 'map_hp_boost') ? '💉' : '😓';
        heroStatusContainer.appendChild(icon);
    });
};

window.updateStats = function() {
	 // 1. O anki tüm efektli/eşyalı statları al
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : { maxHp: hero.maxHp, maxRage: hero.maxRage };
    const currentMaxHp = effective.maxHp;
    const currentMaxRage = effective.maxRage;
	// --- GÜVENLİK: Can güncel Max HP'den fazlaysa aşağı çek (İtem çıkarınca canın taşmaması için) ---
    if (hero.hp > currentMaxHp) {
        hero.hp = currentMaxHp; }

    // HP Bar ve Text güncelleme (currentMaxHp kullanıyoruz)
    // HP Bar ve Text
    if(heroHpBar) heroHpBar.style.width = (hero.hp / currentMaxHp) * 100 + '%';
    if(heroHpText) heroHpText.textContent = `${hero.hp} / ${currentMaxHp}`;

    // RAGE Bar ve Text (Burada artık currentMaxRage kullanıyoruz)
    if(heroRageBar) heroRageBar.style.width = (hero.rage / currentMaxRage) * 100 + '%';
    if(heroRageText) heroRageText.textContent = `${hero.rage} / ${currentMaxRage}`;
	
    if(heroNameDisplay) heroNameDisplay.innerHTML = `${hero.playerName} <span style="color:#ffffff; font-size:0.8em; opacity:0.8;">(${hero.class})</span>`;
    
    if (monster) {
        if(monsterHpBar) monsterHpBar.style.width = (monster.hp / monster.maxHp) * 100 + '%';
        if(monsterHpText) monsterHpText.textContent = `${monster.hp} / ${monster.maxHp}`;
        if (monsterNameDisplay) {
		const currentLang = window.gameSettings.lang;
		const translatedName = window.LANGUAGES[currentLang].enemy_names[monster.name] || monster.name;
		monsterNameDisplay.textContent = translatedName;
}
    }

    const monBlockInd = document.getElementById('monster-block-indicator');
    if (monBlockInd) {
        monBlockInd.classList.toggle('hidden', !isMonsterDefending);
        monBlockInd.classList.toggle('active-shield', isMonsterDefending);
    }
    
    const blockDisplay = document.getElementById('hero-block-indicator');
    const blockText = document.getElementById('hero-block-text');
    if (blockDisplay && blockText) {
        blockDisplay.classList.toggle('hidden', !(heroBlock > 0));
        if (heroBlock > 0) blockText.textContent = heroBlock;
    }

    updateStatusIcons(); updateGoldUI();
    if (statScreen && !statScreen.classList.contains('hidden')) updateStatScreen();
	
    if (statNotif) statNotif.classList.toggle('hidden', !(hero.statPoints > 0));
    if (skillNotif) skillNotif.classList.toggle('hidden', !(hero.skillPoints > 0));
	if(typeof updateNPCStatsDisplay === 'function') updateNPCStatsDisplay();
	const spDisplay = document.getElementById('skill-points-display');
	if (spDisplay) {
    spDisplay.textContent = hero.skillPoints;
	}
};

window.showFloatingText = function(targetContainer, amount, type) {
    const textEl = document.createElement('div');
    textEl.textContent = (typeof amount === 'number' && amount > 0 && type === 'heal') ? `+${amount}` : amount;
    textEl.className = `floating-text ${type}-text`;
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

    // Canavar öldüyse veya aksiyon bittiyse kapat
    if (!action || !monster || monster.hp <= 0) {
        monsterIntentionOverlay.classList.remove('active');
        return;
    }

    const iconPath = "images/enemies/";
    let finalIcon = "";

    // 1. İkonu belirle
    if (action === 'attack') {
        finalIcon = `${iconPath}enemy_attack_intention.webp`;
    } else if (action === 'defend') {
        finalIcon = `${iconPath}enemy_defend_intention.webp`;
    } else {
        finalIcon = `${iconPath}enemy_skill_intention.webp`;
    }

    // 2. İçeriği temizle ve yeni resmi bas
    monsterIntentionOverlay.innerHTML = `<img src="${finalIcon}" alt="intent">`;
    
    // 3. Klasları sıfırla ve 'active' ekle
    monsterIntentionOverlay.classList.remove('active');
    void monsterIntentionOverlay.offsetWidth; // Reflow hilesi: Animasyonun baştan başlamasını sağlar
    monsterIntentionOverlay.classList.add('active');
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

window.triggerDeathEffect = function() { if (fadeOverlay) fadeOverlay.classList.add('active-fade'); };
window.resetDeathEffect = function() { if (fadeOverlay) fadeOverlay.classList.remove('active-fade'); };