// game_logic.js (Partikül Animasyonu Güncellendi: 100 Partikül, Rastgele Dairesel Uçuş, Hasar Kayması Düzeltildi, YETENEK TUR AKIŞI SENKRONİZE EDİLDİ)

// =========================================================
// 1. GÖRSEL KAYNAKLAR VE YALNIZCA LOGIC DOSYASINA ÖZEL VERİLER
// =========================================================

// Karakter Görsel Kaynakları (DOM'dan çekildi, game_data.js'te olmadığı varsayılanlar)
const heroDisplayImg = document.querySelector('#hero-display img');
const monsterDisplayImg = document.querySelector('#monster-display img');

// Kahramanın ana konteynerini (partikül eklemek için) al
const heroDisplayContainer = document.getElementById('hero-display'); 

// HERO ANIMASYON GÖRSELLERİ 
const HERO_IDLE_SRC = 'images/barbarian.png'; 
const HERO_ATTACK_FRAMES = [ 
    'images/barbarian_attack1.png', 
    'images/barbarian_attack2.png', // Hasar Vuruşu
    'images/barbarian_attack3.png'  
];
const HERO_DEAD_SRC = 'images/barbarian_dead.png'; // Ölüm görseli

// Savunma Durumu Değişkenleri (Global olarak burada tutulmalı)
let heroDefenseBonus = 0;
let isHeroDefending = false;

// Canavar Savunma/Niyet Değişkenleri (Global olarak burada tutulmalı)
let monsterDefenseBonus = 0;
let isMonsterDefending = false;
let monsterNextAction = 'attack'; // Varsayılan: attack


// =========================================================
// 2. TEMEL EKRAN VE GÖRSEL FONKSİYONLAR
// =========================================================

/** Ekranları değiştirir. */
function switchScreen(targetScreen) {
    const screens = [startScreen, cutsceneScreen, mapScreen, battleScreen, gameOverScreen];
    
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

/** Oyun günlüğüne yeni bir mesaj ekler. */
function writeLog(message) {
    const logEntry = document.createElement('div');
    logEntry.innerHTML = message;
    log.prepend(logEntry); // En son mesajı en üste ekle
    
    // Log uzunluğunu koru (isteğe bağlı)
    if (log.children.length > 50) {
        log.removeChild(log.lastChild);
    }
}

/** 🔴 KAYMA SORUNU ÇÖZÜMÜ: Hasar alındığında karakterin görselini sallama animasyonu. */
function animateDamage(isHero) {
    const display = isHero ? heroDisplayImg : monsterDisplayImg;
    
    // 1. Hasar Pozisyonu ve Görsel Efekt
    // Kısa ve keskin bir geçiş ayarla.
    display.style.transition = 'transform 0.1s ease-out, filter 0.1s ease-out'; 
    display.style.transform = 'translateY(-10px) scale(1.05)';
    display.style.filter = 'brightness(1.5) drop-shadow(0 0 10px red)';
    
    // 2. Orijinal Konuma Geri Dönüş
    setTimeout(() => {
        // Görseli orijinal pozisyonuna sıfırla
        display.style.transform = 'translateY(0) scale(1)';
        display.style.filter = 'none';
        
        // ÖNEMLİ: Kaymayı engellemek için transition özelliğini tamamen sıfırla.
        // Bu işlem, bir sonraki transform/saldırı animasyonunda kaymayı engeller.
        setTimeout(() => {
             display.style.transition = 'none'; 
        }, 0); // Anında sıfırlama

    }, 150); // 150ms sonra sallanmayı durdur
}

/** 💖 Yeni İyileşme Animasyonu: Çoklu Partikül Fırlatma ve Metin Gösterme (MAKSİMUM YAYILIM) */
function animateHealingParticles(actualHealAmount) {
    // 1. İyileşme Metnini Ekle
    const healText = document.createElement('div');
    healText.classList.add('healing-text');
    healText.textContent = `+${actualHealAmount}`; // İyileşen miktarı göster
    heroDisplayContainer.appendChild(healText);
    
    // Metin animasyonu süresi
    setTimeout(() => {
        if (heroDisplayContainer.contains(healText)) {
            heroDisplayContainer.removeChild(healText);
        }
    }, 1200); 

    // 2. Çoklu Partikülleri Oluştur ve Fırlat 
    const numberOfParticles = 100; // 100 Partikül
    
    for (let i = 0; i < numberOfParticles; i++) {
        const particle = document.createElement('div');
        particle.classList.add('healing-particle');
        
        // BAŞLANGIÇ YAYILIMI: Karakterin tüm konteynerinin her yerinden başlaması için %200 yayılım.
        
        // Yatay Yayılma: %-100 ile %+100 arası (Tüm konteyner genişliği)
        const startOffsetX = (Math.random() * 200 - 100); 
        
        // Dikey Yayılma: %-100 ile %+100 arası (Tüm konteyner yüksekliği)
        const startOffsetY = (Math.random() * 200 - 100); 

        // UÇUŞ HAREKETİ: Daha rastgele ve dairesel/süzülme hissi için mesafeyi artırdık.
        const moveDistance = Math.random() * 200 + 100; // 100% ile 300% arası rastgele hareket
        
        // Açıyı kullanarak X ve Y hareketlerini hesaplayın (Dairesel/Uçuşma Hissi)
        const angle = Math.random() * 360; 
        const moveX = Math.cos(angle * (Math.PI / 180)) * moveDistance; 
        const moveY = Math.sin(angle * (Math.PI / 180)) * moveDistance; 
        
        // Rastgele animasyon süresi ve gecikme (Daha yavaş süzülme için süreyi artırdık)
        const duration = 1.5 + Math.random() * 1.5; // 1.5s ile 3.0s arası (Daha yavaş uçuş)
        const delay = Math.random() * 0.5;          // 0s ile 0.5s arası gecikme

        particle.style.cssText = `
            /* Partikülün başlangıç noktası konteynerin merkezi (50%/50%) */
            left: 50%;
            top: 50%;
            opacity: 1;
            /* İlk transform: Başlangıç pozisyonu (Geniş yayılım) ve küçüklüğü */
            transform: translate(${startOffsetX}%, ${startOffsetY}%) scale(0.2); 
            transition: transform ${duration}s ease-out ${delay}s, 
                         opacity ${duration}s ease-out ${delay}s;
        `;
        
        heroDisplayContainer.appendChild(particle);

        // Animasyonun başlaması için bir sonraki frame'de CSS transform'u değiştir
        requestAnimationFrame(() => {
            // Final transform: Başlangıç + Rastgele Uçuş ve kaybolurken büyüme/dönme
            particle.style.transform = `translate(${startOffsetX + moveX}%, ${startOffsetY + moveY}%) scale(1.0) rotate(${Math.random() * 360}deg)`;
            particle.style.opacity = '0'; // Kaybolma

            // Animasyon bittikten sonra elementi temizle
            setTimeout(() => {
                if (heroDisplayContainer.contains(particle)) {
                    heroDisplayContainer.removeChild(particle);
                }
            }, (duration + delay) * 1000 + 100);
        });
    }
}


// =========================================================
// 3. SAVAŞ MEKANİĞİ VE YETENEKLER
// =========================================================

/** Hasar hesaplaması yapar. */
function calculateDamage(attacker, defender) {
    let rawDamage = attacker.attack;
    let effectiveDefense = defender.defense;
    
    if (defender === hero && isHeroDefending) {
        effectiveDefense += heroDefenseBonus; 
        writeLog(`✨ **${hero.name}** savunma pozisyonu sayesinde fazladan ${heroDefenseBonus} savunma kullandı!`);
    } 
    else if (defender === monster && isMonsterDefending) { 
        effectiveDefense += monsterDefenseBonus;
        writeLog(`✨ **${monster.name}** savunma pozisyonu sayesinde fazladan ${monsterDefenseBonus} savunma kullandı!`);
    }
    
    let finalDamage = Math.max(1, rawDamage - effectiveDefense); 
    return finalDamage;
}

/** ⚔️ NORMAL SALDIRI SIRASINI YÖNETEN ANA FONKSİYON. */
function handleAttackSequence(attacker, defender) {
    const attackerIsHero = (attacker === hero);
    const attackerImgElement = attackerIsHero ? heroDisplayImg : monsterDisplayImg;
    const defenderIsHero = (defender === hero);
    
    let attackFrames, idleSrc;

    if (attackerIsHero) {
        attackFrames = HERO_ATTACK_FRAMES;
        idleSrc = HERO_IDLE_SRC;
    } else {
        // ENEMY_STATS'ın enemy_data.js'ten geldiği varsayılır.
        attackFrames = ENEMY_STATS[attacker.name].attackFrames.map(frameName => `images/${frameName}`);
        idleSrc = `images/${ENEMY_STATS[attacker.name].idle}`;
    }
    
    attackButton.disabled = true;
    defendButton.disabled = true;
    toggleSkillButtons(true);

    let frameIndex = 0;
    
    function showNextFrame() {
        if (frameIndex < attackFrames.length) {
            
            const currentFrameSrc = attackFrames[frameIndex];
            attackerImgElement.src = currentFrameSrc; 
            
            // HASAR UYGULAMA MANTIĞI
            if (frameIndex === 1) { 
                const damage = calculateDamage(attacker, defender);
                defender.hp = Math.max(0, defender.hp - damage);
                
                animateDamage(defenderIsHero); 
                writeLog(`⚔️ **${attacker.name}** saldırdı ve **${defender.name}**'e ${damage} hasar verdi!`);
                
                if (attackerIsHero) {
                    hero.rage = Math.min(hero.maxRage, hero.rage + 15);
                    writeLog(`🔥 **${hero.name}** isabetli vuruşla 15 Öfke kazandı.`);
                }
                
                updateStats();
                
                if (attackerIsHero && isMonsterDefending) {
                    isMonsterDefending = false;
                    monsterDefenseBonus = 0;
                    writeLog(`Canavarın Savunma pozisyonu kalktı.`);
                }
            }

            frameIndex++;
            
            setTimeout(showNextFrame, 150); 
            
        } else {
            // GERİ ÇEKİLME (IDLE)
            attackerImgElement.src = idleSrc; 
            
            if (!checkGameOver()) {
                nextTurn(); 
            }
        }
    }

    showNextFrame();
}

/** Özel animasyonlu saldırı fonksiyonu (Yetenekler için) */
function animateCustomAttack(rawDamage, skillFrames, skillName) {
    const attackerImgElement = heroDisplayImg;
    
    const customAttacker = {
        attack: rawDamage, 
        defense: 0
    };

    let frameIndex = 0;
    
    function showNextFrame() {
        if (frameIndex < skillFrames.length) {
            
            attackerImgElement.src = skillFrames[frameIndex]; 
            
            if (frameIndex === 1) { 
                const damage = calculateDamage(customAttacker, monster); 
                
                monster.hp = Math.max(0, monster.hp - damage);
                
                animateDamage(false); 
                writeLog(`💥 **${hero.name}** ${skillName.toUpperCase()} ile ${monster.name}'e ${damage} hasar verdi!`);
                updateStats();
                
                if (isMonsterDefending) {
                    isMonsterDefending = false;
                    monsterDefenseBonus = 0;
                    writeLog(`Canavarın Savunma pozisyonu kalktı.`);
                }
            }

            frameIndex++;
            setTimeout(showNextFrame, 150); 
            
        } else {
            attackerImgElement.src = HERO_IDLE_SRC; 
            if (!checkGameOver()) {
                nextTurn(); 
            }
        }
    }
    showNextFrame();
}


// -----------------------------
// YETENEK SİSTEMİ FONKSİYONLARI
// -----------------------------

/** Hero için yetenek butonlarını oluşturur ve DOM'a ekler. */
function initializeSkillButtons() {
    if (!skillButtonsContainer) return;

    skillButtonsContainer.innerHTML = ''; 

    for (const [key, skill] of Object.entries(HERO_SKILLS)) {
        const button = document.createElement('button');
        button.id = `${key}-skill-button`;
        button.textContent = `${skill.name} (${skill.rageCost} Öfke)`;
        button.classList.add('skill-button');
        
        button.addEventListener('click', () => handleSkillUse(key));

        skillButtonsContainer.appendChild(button);
    }
    toggleSkillButtons(false); 
}

/** Yetenek butonlarını etkinleştirir/devre dışı bırakır (Öfkeye göre). */
function toggleSkillButtons(forceDisable) {
    if (!skillButtonsContainer) return;
    
    const buttons = skillButtonsContainer.querySelectorAll('.skill-button');
    
    buttons.forEach(button => {
        if (forceDisable) {
            button.disabled = true;
            return;
        }

        const skillKey = button.id.split('-')[0]; 
        const skill = HERO_SKILLS[skillKey];

        if (skill && hero.rage >= skill.rageCost) {
            button.disabled = false;
        } else {
            button.disabled = true;
        }
    });
}

/** Yetenek kullanımını kontrol eder ve turu bitirir. */
function handleSkillUse(skillKey) {
    if (!isHeroTurn) return;

    const skill = HERO_SKILLS[skillKey];
    if (!skill) return;

    if (hero.rage < skill.rageCost) {
        writeLog(`❌ **${hero.name}** yeterli Öfkeye (${skill.rageCost}) sahip değil!`);
        return;
    }
    
    hero.rage -= skill.rageCost;
    updateStats(); 
    
    attackButton.disabled = true;
    defendButton.disabled = true;
    toggleSkillButtons(true);

    if (skillKey === 'hell_blade') {
        handleHellBlade(skill);
    } else if (skillKey === 'minor_healing') {
        handleMinorHealing(skill);
        // nextTurn() artık handleMinorHealing içinde çağrılıyor, animasyon süresi beklendikten sonra.
    }
}

/** 🔥 Cehennem Kılıcı (Hell Blade) Yeteneği Mantığı */
function handleHellBlade(skill) {
    
    let rawDamage = 0;
    
    if (Math.random() < 0.60) {
        rawDamage = Math.floor(Math.random() * (skill.maxDamage - skill.highDamageThreshold + 1)) + skill.highDamageThreshold;
        writeLog(`⭐ **KRİTİK YETENEK!** **${skill.name}** güçlü bir darbe için hazırlanıyor!`);
    } else {
        rawDamage = Math.floor(Math.random() * (skill.highDamageThreshold - skill.minDamage)) + skill.minDamage;
    }

    animateCustomAttack(rawDamage, skill.animFrames.map(frameName => `images/${frameName}`), skill.name);
}

/** 🩹 Küçük İyileşme (Minor Healing) Yeteneği Mantığı */
function handleMinorHealing(skill) {
    
    let healAmount = 0;
    
    if (Math.random() < skill.weakChance) {
        healAmount = Math.floor(Math.random() * (skill.weakHealThreshold - skill.minHeal + 1)) + skill.minHeal;
        writeLog(`😥 **${skill.name}** zayıf kaldı! Sadece ${healAmount} HP iyileşti.`);
    } else {
        healAmount = Math.floor(Math.random() * (skill.maxHeal - skill.weakHealThreshold)) + skill.weakHealThreshold + 1;
        writeLog(`💚 **${skill.name}** başarılı oldu! ${hero.name}, ${healAmount} HP iyileşti.`);
    }

    const oldHp = hero.hp;
    hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
    
    // Gerçekleşen iyileşme miktarını hesapla (max HP'yi aşmamış olabilir)
    const actualHeal = hero.hp - oldHp; 

    updateStats(); // İstatistikleri hemen güncelle

    // İyileşme miktarını animasyon fonksiyonuna gönder
    if (actualHeal > 0) {
        animateHealingParticles(actualHeal); 
        
        // Animasyon süresi dolduktan sonra sırayı bitir (1.5 saniye)
        setTimeout(() => {
            nextTurn();
        }, 1500); 

    } else {
        // İyileşme gerçekleşmediyse (HP tamamsa), ek bir bilgilendirme yapıp sırayı hemen bitir.
        writeLog(`❌ **${skill.name}** kullanıldı ama **${hero.name}**'nun canı zaten tam.`);
        nextTurn();
    }
}


// =========================================================
// 4. TUR VE CANAVAR MANTIĞI
// =========================================================

/** Canavarın sıradaki eylemini belirler. */
function determineMonsterAction() {
    const random = Math.random();
    
    if (random < 0.70) {
        monsterNextAction = 'attack';
    } else {
        monsterNextAction = 'defend';
        
        const minBonus = Math.floor(monster.attack / 2);
        const maxBonus = Math.floor(monster.maxHp * 0.1);
        monsterDefenseBonus = Math.floor(Math.random() * (maxBonus - minBonus + 1)) + minBonus;
    }
}

/** Canavarın niyetini (gösterge) ekranda gösterir. */
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

/** Sıra değişimini yönetir. */
function nextTurn() {
    isHeroTurn = !isHeroTurn;
    
    if (checkGameOver()) {
        return;
    }

    if (isHeroTurn) {
        // KAHRAMAN SIRASI BAŞLANGICI
        
        if (isHeroDefending) {
             isHeroDefending = false;
             heroDefenseBonus = 0;
             writeLog(`🛡️ Kahramanın Savunma pozisyonu sona erdi.`); 
        }
        
        // PASİF ÖFKE KAZANIMI (+10 Rage)
        hero.rage = Math.min(hero.maxRage, hero.rage + 10);
        writeLog(`🔥 Pasif kazançla 10 Öfke kazandın.`);
        updateStats();

        // CANAVARIN YENİ NİYETİNİ BELİRLE VE GÖSTER
        determineMonsterAction();
        showMonsterIntention(monsterNextAction);
        
        // Kontrolleri Etkinleştir
        attackButton.disabled = false;
        defendButton.disabled = false;
        toggleSkillButtons(false); 
        writeLog(`... **${hero.name}**'nun Sırası! ...`);

    } else {
        // CANAVAR SIRASI BAŞLANGICI
        
        attackButton.disabled = true;
        defendButton.disabled = true;
        toggleSkillButtons(true); 
        
        const action = monsterNextAction;
        
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');
        
        writeLog(`... **${monster.name}**'ın Sırası ...`);
        
        setTimeout(() => {
            if (!checkGameOver()) {
                if (action === 'attack') {
                    handleAttackSequence(monster, hero); 
                } else if (action === 'defend') {
                    isMonsterDefending = true; 
                    writeLog(`🛡️ **${monster.name}** ${monsterDefenseBonus} defans bonusu kazanarak savunma yaptı.`);
                    
                    nextTurn(); 
                }
            }
        }, 1000); 
    }
}


// =========================================================
// 5. LEVEL VE XP SİSTEMİ FONKSİYONLARI
// =========================================================

function levelUp() {
    if (hero.level >= MAX_LEVEL) return; 
    
    hero.level++;
    
    hero.maxHp += 15; 
    hero.hp = hero.maxHp; 
    hero.attack += 3; 
    hero.defense += 1; 
    hero.maxRage += 10;
    hero.rage = hero.maxRage; 
    
    hero.xp = hero.xp - FULL_XP_REQUIREMENTS[hero.level - 1]; 
    hero.xpToNextLevel = FULL_XP_REQUIREMENTS[hero.level] || Infinity; 

    writeLog(`⬆️ **${hero.name} SEVİYE ATLAYARAK ${hero.level}. SEVİYEYE ULAŞTI!**`);
    writeLog(`Yeni İstatistikler: HP: ${hero.maxHp}, Saldırı: ${hero.attack}, Savunma: ${hero.defense}, Öfke: ${hero.maxRage}`);

    updateStats(); 
}

/** Canavar öldüğünde XP ekler ve seviye atlamayı kontrol eder. */
function gainXP(amount) {
    if (hero.level >= MAX_LEVEL) {
        writeLog(`🎉 ${hero.name} maksimum seviyeye ulaştı!`);
        return;
    }

    hero.xp += amount;
    writeLog(`🌟 ${hero.name}, ${amount} deneyim puanı kazandı.`);
    
    while (hero.xp >= hero.xpToNextLevel) {
        levelUp();
        if (hero.level >= MAX_LEVEL) break; 
    }
    updateStats(); 
}


// =========================================================
// 6. HARİTA VE AKIŞ YÖNETİMİ (DÜZELTİLMİŞ)
// =========================================================

/** Player marker'ını harita üzerindeki bir düğüme taşır. */
function movePlayerMarkerToNode(nodeId) {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const markerContainer = document.getElementById('player-marker-container');
    
    if (nodeElement && markerContainer) {
        const rect = nodeElement.getBoundingClientRect();
        const mapRect = mapDisplay.getBoundingClientRect();
        
        const leftPos = rect.left - mapRect.left + (rect.width / 2);
        const topPos = rect.top - mapRect.top + (rect.height / 2);
        
        markerContainer.style.left = `${leftPos}px`;
        markerContainer.style.top = `${topPos}px`;
        markerContainer.style.display = 'block';
    }
}

/** Harita ekranındaki bilgileri ve aksiyon butonlarını günceller. */
function updateMapScreen() {
    const currentNode = ACT_1_MAP.nodes[ACT_1_MAP.currentNodeId];
    const mapInfoTitle = document.getElementById('current-node-name');
    const mapInfoDescription = document.getElementById('map-description');
    
    mapInfoTitle.textContent = `#${ACT_1_MAP.currentNodeId}: ${currentNode.type.toUpperCase()}`;
    mapInfoDescription.textContent = currentNode.text;
    
    mapActionButtons.innerHTML = '';

    const nodeButtons = mapDisplay.querySelectorAll('.map-node');
    nodeButtons.forEach(button => {
        const id = parseInt(button.id.split('-')[1]);
        
        button.disabled = true;
        button.classList.remove('available');
        button.onclick = null;
        
        if (currentNode.next.includes(id)) {
            button.disabled = false;
            button.classList.add('available');
            button.onclick = () => advanceMap(id);
        }
    });

    if (currentNode.type === 'town') {
        const healButton = document.createElement('button');
        healButton.textContent = "Dinlen ve İyileş";
        healButton.onclick = () => {
            hero.hp = hero.maxHp;
            hero.rage = hero.maxRage; 
            writeLog(`⛺ **${hero.name}** dinlendi ve tamamen iyileşti. HP ve Öfke sıfırlandı.`);
            updateStats();
        };
        mapActionButtons.appendChild(healButton);
    }
}

/** Mevcut düğümün aksiyonunu kontrol eder ve tetikler. (DÜZELTİLDİ: Gecikme Kaldırıldı) */
function checkCurrentNodeAction() {
    const currentNode = ACT_1_MAP.nodes[ACT_1_MAP.currentNodeId];
    
    if (currentNode.type === 'encounter') {
        // Gecikme olmadan savaşı hemen başlat.
        writeLog(`[Harita]: Yeni bir düşmanla karşılaştın: **${currentNode.enemy}**!`);
        startBattle(currentNode.enemy); 
        
    } else if (currentNode.type === 'choice' || currentNode.type === 'town') {
        updateMapScreen();
    }
}

/** Haritada ilerlemeyi yönetir ve yeni aksiyonu başlatır. */
function advanceMap(nextNodeId) {
    ACT_1_MAP.currentNodeId = nextNodeId;
    movePlayerMarkerToNode(nextNodeId);
    
    checkCurrentNodeAction();
    
    if (ACT_1_MAP.nodes[nextNodeId].next.length === 0) {
        writeLog("Oyun Sonu: Tüm Harita Tamamlandı!");
    }
}

/** Yeni bir savaşı başlatır ve canavarı oluşturur. */
function startBattle(enemyType) {
    switchScreen(battleScreen);
    
    const stats = ENEMY_STATS[enemyType];
    
    monster = {
        name: enemyType,
        maxHp: stats.maxHp,
        hp: stats.maxHp,
        attack: stats.attack,
        defense: stats.defense,
        xp: stats.xp,
        idle: stats.idle, 
        dead: stats.dead, 
        attackFrames: stats.attackFrames 
    };
    
    monsterDisplayImg.src = `images/${monster.idle}`;
    monsterDisplayImg.style.filter = 'none';
    
    heroDisplayImg.src = HERO_IDLE_SRC;
    
    writeLog(`💥 **${monster.name}** ortaya çıktı! Savaş Başladı!`);

    isMonsterDefending = false;
    monsterDefenseBonus = 0;
    isHeroDefending = false;
    heroDefenseBonus = 0;
    
    updateStats(); 
    initializeSkillButtons(); 
    
    determineMonsterAction(); 
    showMonsterIntention(monsterNextAction);

    isHeroTurn = true;
    nextTurn();
}


// =========================================================
// 7. OYUN SONU VE STAT GÜNCELLEMELERİ
// =========================================================

/** Savaş bittiğinde oyun durumunu kontrol eder. */
function checkGameOver() {
    if (hero.hp <= 0) {
        hero.hp = 0; 
        updateStats();
        heroDisplayImg.src = HERO_DEAD_SRC;
        switchScreen(gameOverScreen);
        writeLog(`💀 **${hero.name}** yenildi! Oyun Bitti.`);
        return true;
    } else if (monster && monster.hp <= 0) {
        monster.hp = 0; 
        updateStats();
        monsterDisplayImg.src = `images/${monster.dead}`;
        monsterDisplayImg.style.filter = 'grayscale(100%) brightness(0.5)';
        
        writeLog(`🎉 **${monster.name}** yenildi!`);
        
        gainXP(monster.xp);
        
        if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active');

        // 1 saniye sonra haritaya dön
        setTimeout(() => {
            monster = null; 
            switchScreen(mapScreen);
            
            updateMapScreen();
            
            writeLog("Haritada ilerlemeye devam edebilirsin.");
        }, 1000); 
        return true;
    }
    return false;
}

/** Karakter istatistiklerini ve HP çubuklarını günceller. */
function updateStats() {
    
    const heroHpPercent = (hero.hp / hero.maxHp) * 100;
    heroHpBar.style.width = heroHpPercent + '%';
    heroHpText.textContent = `${hero.hp} / ${hero.maxHp}`;
    
    const heroRagePercent = (hero.rage / hero.maxRage) * 100;
    heroRageBar.style.width = heroRagePercent + '%';
    heroRageText.textContent = `${hero.rage} / ${hero.maxRage}`;
    toggleSkillButtons(false); 

    heroNameDisplay.textContent = `${hero.name} (Lv. ${hero.level} | XP: ${hero.xp}/${hero.xpToNextLevel})`;

    if (monster) {
        const monsterHpPercent = (monster.hp / monster.maxHp) * 100;
        monsterHpBar.style.width = monsterHpPercent + '%';
        monsterHpText.textContent = `${monster.hp} / ${monster.maxHp}`;
        monsterNameDisplay.textContent = `${monster.name}`;
    }
}

/** Oyunu başlatan animasyon ve harita geçişi. (DÜZELTİLDİ: Anında geçiş) */
function startCutscene() {
    switchScreen(cutsceneScreen);
    cutsceneText.textContent = "Kahraman zindanlara iniyor...";
    
    function transitionToMap() {
        cutsceneText.textContent = "Hazır!";
        // Hata yaratan 500ms'lik gecikmeyi kaldırdık.
        switchScreen(mapScreen);
        writeLog("Harita Ekranı: Maceran Başladı.");
        checkCurrentNodeAction(); // İlk savaş anında başlar.
    }

    skipCutsceneButton.onclick = transitionToMap;

    setTimeout(() => {
        cutsceneText.textContent = "Harita Yükleniyor...";
        setTimeout(transitionToMap, 1500);
    }, 1500);
}


function initGame() {
    // Statları sıfırla
    hero.maxHp = 100; 
    hero.attack = 20;
    hero.defense = 5;
    hero.level = 1;          
    hero.xp = 0;             
    hero.xpToNextLevel = FULL_XP_REQUIREMENTS[1];

    hero.hp = hero.maxHp; 
    hero.maxRage = 100; 
    hero.rage = 0; 
    
    // Haritayı başlangıç düğümüne sıfırla
    ACT_1_MAP.currentNodeId = 1; 
    
    // Durumları sıfırla
    isHeroDefending = false;
    heroDefenseBonus = 0;
    isMonsterDefending = false;
    monsterDefenseBonus = 0;
    monsterNextAction = 'attack';
    if (monsterIntentionOverlay) monsterIntentionOverlay.classList.remove('active', 'attack', 'defend');

    log.innerHTML = '';
    writeLog("--- Oyun Başlatılmaya Hazır ---");
    heroDisplayImg.src = HERO_IDLE_SRC;
    updateStats();

    // Player marker'ı ilk düğüme taşı
    movePlayerMarkerToNode(ACT_1_MAP.currentNodeId); 
}


// =========================================================
// 8. OLAY DİNLEYİCİLERİ VE BAŞLANGIÇ
// =========================================================

attackButton.addEventListener('click', () => {
    if (isHeroTurn) {
        handleAttackSequence(hero, monster);
    }
});

defendButton.addEventListener('click', () => {
    if (isHeroTurn) {
        const minBonus = 5;
        const maxBonus = 25;
        heroDefenseBonus = Math.floor(Math.random() * (maxBonus - minBonus + 1)) + minBonus;
        isHeroDefending = true; 

        writeLog(`🛡️ **${hero.name}** savunma pozisyonu aldı ve **${heroDefenseBonus}** ekstra savunma kazandı!`);
        
        nextTurn();
    }
});

startButton.addEventListener('click', startCutscene);

returnToMenuButton.addEventListener('click', () => {
    initGame();
    switchScreen(startScreen);
});

document.addEventListener('DOMContentLoaded', () => {
    initGame(); 
    switchScreen(startScreen); 
});