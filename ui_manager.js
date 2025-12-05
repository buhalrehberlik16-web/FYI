// ui_manager.js

// =========================================================
// EKRAN YÖNETİMİ
// =========================================================

function switchScreen(targetScreen) {
    const screens = [startScreen, cutsceneScreen, mapScreen, battleScreen, gameOverScreen, campfireScreen, eventScreen];
    
    // Not: SkillBook ve StatScreen 'overlay' (üst katman) olduğu için bu listede kapatılmıyorlar.
    screens.forEach(screen => {
        if (screen) { 
            if (screen === targetScreen) {
                screen.classList.remove('hidden');
                screen.classList.add('active');
            } else {
                screen.classList.remove('active');
                screen.classList.add('hidden');
            }
        }
    });
}

function writeLog(message) {
    // Oyun içi log alanı kaldırıldığı için konsola yazıyoruz.
    console.log("[Oyun]: " + message.replace(/<[^>]*>?/gm, ''));
}

// =========================================================
// GÖRSEL EFEKTLER VE BİLDİRİMLER
// =========================================================

function showFloatingText(targetContainer, amount, type) {
    const textEl = document.createElement('div');
    
    // Hasar ise '-', İyileşme ise '+', diğer durumlarda boş
    let sign = '';
    if (type === 'damage') sign = '-';
    else if (type === 'heal') sign = '+';
    
    textEl.textContent = `${sign}${amount}`;
    textEl.classList.add('floating-text');
    
    if (type === 'damage') {
        textEl.classList.add('damage-text');
    } else {
        textEl.classList.add('heal-text');
    }
    
    targetContainer.appendChild(textEl);
    
    // Animasyon bitince temizle (1.5 saniye)
    setTimeout(() => {
        if (targetContainer.contains(textEl)) {
            targetContainer.removeChild(textEl);
        }
    }, 1500);
}

function animateHealingParticles() {
    const numberOfParticles = 150; 
    const container = heroDisplayContainer; 

    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('healing-particle');
        
        // Rastgele Başlangıç Konumu
        const startX = Math.random() * 60 + 20; 
        const startY = Math.random() * 60 + 20;
        
        // Rastgele Hareket Yönü
        const moveX = (Math.random() * 160 - 80) + 'px';
        particle.style.setProperty('--move-x', moveX);

        // Rastgele Derinlik (Ön/Arka)
        const zIndex = Math.random() > 0.5 ? 20 : 0; 
        
        // Animasyon Süresi ve Gecikme
        const duration = (Math.random() * 1 + 1) + 's'; 
        const delay = (Math.random() * 0.3) + 's'; 
        const size = (Math.random() * 20 + 5) + 'px'; 

        particle.style.left = startX + '%';
        particle.style.top = startY + '%';
        particle.style.zIndex = zIndex;
        particle.style.width = size;
        particle.style.height = size;
        particle.style.animationDuration = duration;
        particle.style.animationDelay = delay;

        container.appendChild(particle);

        // Temizlik
        setTimeout(() => {
            if (container.contains(particle)) {
                container.removeChild(particle);
            }
        }, 2500);
    }
}

function animateDamage(isHero) {
    const display = isHero ? heroDisplayImg : monsterDisplayImg;
    
    display.style.transition = 'transform 0.1s ease-out, filter 0.1s ease-out'; 
    display.style.transform = 'translateX(-50%) translateY(-10px) scale(1.05)';
    display.style.filter = 'brightness(1.5) drop-shadow(0 0 10px red)';
    
    setTimeout(() => {
        display.style.transform = 'translateX(-50%) translateY(0) scale(1)';
        display.style.filter = 'none';
        setTimeout(() => { display.style.transition = 'none'; }, 0); 
    }, 150); 
}

function triggerDeathEffect() {
    if (fadeOverlay) {
        fadeOverlay.classList.add('active-fade');
    }
}

function resetDeathEffect() {
    if (fadeOverlay) {
        fadeOverlay.classList.remove('active-fade');
    }
}

// =========================================================
// İSTATİSTİK VE DURUM GÜNCELLEMELERİ
// =========================================================

function updateStatusIcons() {
    if (!heroStatusContainer) return;
    heroStatusContainer.innerHTML = ''; 

    // 1. Savaş İçi Etkiler (Turn-Based)
    hero.statusEffects.forEach(effect => {
        const icon = document.createElement('div');
        icon.className = 'status-icon';
        
        // İkon Türleri
        if (effect.id === 'atk_up') { 
            icon.innerHTML = '⚔️'; icon.classList.add('status-buff'); 
        } else if (effect.id === 'block_skill') { 
            icon.innerHTML = '🚫'; icon.classList.add('status-debuff'); 
        } else if (effect.id === 'block_type') { 
            icon.innerHTML = '⛔'; icon.classList.add('status-debuff'); 
        } else if (effect.id === 'insta_kill') { 
            icon.innerHTML = '☠️'; icon.classList.add('status-buff'); 
        } else if (effect.id === 'def_up') { 
            icon.innerHTML = '🛡️'; icon.classList.add('status-buff'); 
        } else if (effect.id === 'atk_half') { 
            icon.innerHTML = '👎'; icon.classList.add('status-debuff'); 
        } else if (effect.id === 'regen') { 
            icon.innerHTML = '💖'; icon.classList.add('status-buff'); 
        } else if (effect.id === 'stun') { 
            icon.innerHTML = '💫'; icon.classList.add('status-debuff'); 
            icon.style.borderColor = 'yellow'; icon.style.color = 'yellow';
        }
        
        // Eğer savaş bekliyorsa grileştir
        if (effect.waitForCombat) {
            icon.style.filter = "grayscale(100%) opacity(0.7)";
            icon.title = `${effect.name} (Savaşta Başlayacak)`;
        } else {
            icon.title = `${effect.name} (${effect.turns} Tur)`;
        }
        heroStatusContainer.appendChild(icon);
    });

    // 2. Harita Etkileri (Map-Based) - Mavi Renk
    hero.mapEffects.forEach(effect => {
        const icon = document.createElement('div');
        icon.className = 'status-icon';
        icon.style.borderColor = '#00ccff'; 
        icon.style.color = '#00ccff'; 
        
        if (effect.id === 'map_atk_weak') { 
            icon.innerHTML = '😓'; 
        } else if (effect.id === 'map_hp_boost') { 
            icon.innerHTML = '💉'; 
        }
        
        // +1 ekliyoruz çünkü girilen oda dahil sayılıyor
        const remaining = effect.nodesLeft + 1;
        icon.title = `${effect.name} (${remaining} Oda)`;
        heroStatusContainer.appendChild(icon);
    });
}

function updateStats() {
    // HP ve Rage Barlarını Güncelle
    const heroHpPercent = (hero.hp / hero.maxHp) * 100;
    heroHpBar.style.width = heroHpPercent + '%';
    heroHpText.textContent = `${hero.hp} / ${hero.maxHp}`;
    
    const heroRagePercent = (hero.rage / hero.maxRage) * 100;
    heroRageBar.style.width = heroRagePercent + '%';
    heroRageText.textContent = `${hero.rage} / ${hero.maxRage}`;

    // İsim ve Level Gösterimi
    heroNameDisplay.innerHTML = `${hero.name} <span style="color:#f0e68c; font-size:0.8em; margin-left:5px;">| ${hero.level}</span>`;

    // Canavar Can Barı
    if (monster) {
        const monsterHpPercent = (monster.hp / monster.maxHp) * 100;
        monsterHpBar.style.width = monsterHpPercent + '%';
        monsterHpText.textContent = `${monster.hp} / ${monster.maxHp}`;
        monsterNameDisplay.textContent = `${monster.name}`;
    }
    
    // Status İkonlarını Yenile
    updateStatusIcons();

    // Eğer Stat Ekranı açıksa onu da güncelle (Canlı veri)
    if (!statScreen.classList.contains('hidden')) {
        updateStatScreen();
    }
}

function showMonsterIntention(action) {
    if (!monsterIntentionOverlay) return;
    
    monsterIntentionOverlay.classList.remove('attack', 'defend');
    
    if (action === 'attack') {
        monsterIntentionOverlay.innerHTML = '<i class="fas fa-dagger"></i>'; 
        monsterIntentionOverlay.classList.add('attack', 'active');
    } else if (action === 'defend') {
        monsterIntentionOverlay.innerHTML = '<i class="fas fa-shield-alt"></i>'; 
        monsterIntentionOverlay.classList.add('defend', 'active');
    }
}

// =========================================================
// YETENEK KİTABI (SKILL BOOK) FONKSİYONLARI
// =========================================================

let currentTab = 'attack'; 

function toggleSkillBook() {
    if (skillBookScreen.classList.contains('hidden')) {
        skillBookScreen.classList.remove('hidden');
        renderSkillBookList(); 
        renderEquippedSlotsInBook();
    } else {
        skillBookScreen.classList.add('hidden');
    }
}

function setSkillTab(tab) {
    currentTab = tab;
    
    // Butonların aktiflik durumunu değiştir
    const btnAttack = document.getElementById('tab-attack');
    const btnDefense = document.getElementById('tab-defense');

    if (tab === 'attack') {
        if(btnAttack) btnAttack.classList.add('active');
        if(btnDefense) btnDefense.classList.remove('active');
    } else {
        if(btnDefense) btnDefense.classList.add('active');
        if(btnAttack) btnAttack.classList.remove('active');
    }
    renderSkillBookList();
}

function renderSkillBookList() {
    if (!skillBookList) return;
    skillBookList.innerHTML = '';
    
    for (const [key, skill] of Object.entries(SKILL_DATABASE)) {
        // Sadece seçili sekmedeki yetenekleri göster
        if (skill.data.type === currentTab) {
            const item = document.createElement('div');
            item.classList.add('skill-book-item');
            
            const reqLevel = skill.data.levelReq || 1;
            const isLocked = hero.level < reqLevel;

            if (isLocked) {
                item.classList.add('locked'); 
                item.setAttribute('draggable', false); // Sürüklemeyi engelle
                item.title = `Seviye ${reqLevel} gerekli!`;
            } else {
                item.setAttribute('draggable', true); 
                item.addEventListener('dragstart', (e) => { 
                    e.dataTransfer.setData('text/plain', key); 
                });
            }

            item.innerHTML = `
                <img src="images/${skill.data.icon}" class="skill-book-icon">
                <div class="skill-info">
                    <h4>${skill.data.name}</h4>
                    <p>${skill.data.menuDescription}</p>
                    ${isLocked ? `<small style="color:#ff4d4d;">Gereken Seviye: ${reqLevel}</small>` : ''}
                </div>`;
            skillBookList.appendChild(item);
        }
    }
}

function renderEquippedSlotsInBook() {
    if (!skillBookEquippedBar) return;
    skillBookEquippedBar.innerHTML = '';
    
    for (let i = 0; i < 4; i++) {
        const slot = document.createElement('div');
        slot.classList.add('menu-slot');
        
        const keyHint = document.createElement('span');
        keyHint.classList.add('key-hint');
        keyHint.textContent = i + 1;
        slot.appendChild(keyHint);

        // Sürükle Bırak Olayları
        slot.addEventListener('dragover', (e) => { 
            e.preventDefault(); 
            slot.classList.add('drag-over'); 
        });
        
        slot.addEventListener('dragleave', () => { 
            slot.classList.remove('drag-over'); 
        });
        
        slot.addEventListener('drop', (e) => {
            e.preventDefault(); 
            slot.classList.remove('drag-over');
            
            const skillKey = e.dataTransfer.getData('text/plain');
            if (skillKey && SKILL_DATABASE[skillKey]) { 
                // Veriyi güncelle
                hero.equippedSkills[i] = skillKey; 
                
                // Arayüzleri yenile
                renderEquippedSlotsInBook(); 
                if (typeof initializeSkillButtons === 'function') {
                    initializeSkillButtons(); 
                }
            }
        });

        // Mevcut yeteneği göster
        const currentSkillKey = hero.equippedSkills[i];
        if (currentSkillKey && SKILL_DATABASE[currentSkillKey]) { 
            const img = document.createElement('img'); 
            img.src = `images/${SKILL_DATABASE[currentSkillKey].data.icon}`; 
            slot.appendChild(img); 
        }
        
        skillBookEquippedBar.appendChild(slot);
    }
}

// =========================================================
// STAT EKRANI (KARAKTER SAYFASI)
// =========================================================

function toggleStatScreen() {
    if (statScreen.classList.contains('hidden')) {
        updateStatScreen(); 
        statScreen.classList.remove('hidden');
    } else {
        statScreen.classList.add('hidden');
    }
}

function updateStatScreen() {
    if (!statName) return;
    
    // Gerçek (Effective) Statları al
    let effective = { atk: hero.attack, def: hero.defense };
    if (typeof getHeroEffectiveStats === 'function') {
        effective = getHeroEffectiveStats();
    }

    statName.textContent = hero.playerName;
    statClass.textContent = `(${hero.name})`;
    statLevel.textContent = `Lv. ${hero.level}`;
    statXp.textContent = `${hero.xp} / ${hero.xpToNextLevel}`;
    statHp.textContent = `${hero.hp} / ${hero.maxHp}`;
    
    // ATAK DEĞERİ (Renkli)
    // Base hesap: Statik Atak + (STR * 0.5)
    const baseAtk = hero.attack + Math.floor((hero.str||0)*0.5);
    
    if (effective.atk > baseAtk) {
        statAtk.innerHTML = `<span style="color:#43FF64">${effective.atk}</span>`; // Buff
    } else if (effective.atk < baseAtk) {
        statAtk.innerHTML = `<span style="color:#ff4d4d">${effective.atk}</span>`; // Debuff
    } else {
        statAtk.textContent = effective.atk;
    }

    // DEFANS DEĞERİ (Renkli)
    if (effective.def > hero.defense) {
        statDef.innerHTML = `<span style="color:#43FF64">${effective.def}</span>`; // Buff
    } else {
        statDef.textContent = effective.def;
    }
    
    statStr.textContent = hero.str;
    statDex.textContent = hero.dex;
    statInt.textContent = hero.int;
    statMp.textContent = hero.mp_pow;
}

// =========================================================
// OLAY DİNLEYİCİLERİ (INIT)
// =========================================================

document.addEventListener('DOMContentLoaded', () => {
    // Yetenek Kitabı Kapatma
    if(btnCloseSkillBook) btnCloseSkillBook.addEventListener('click', toggleSkillBook);
    
    // Sekme Butonları
    if(tabAttack) tabAttack.addEventListener('click', () => setSkillTab('attack'));
    if(tabDefense) tabDefense.addEventListener('click', () => setSkillTab('defense'));
    
    // Stat Ekranı Kapatma
    if(btnCloseStat) btnCloseStat.addEventListener('click', toggleStatScreen);
});