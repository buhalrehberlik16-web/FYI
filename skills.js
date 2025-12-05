// skills.js

const SKILL_DATABASE = {
    
    // --- 1. CEHENNEM KILICI (BUFFLARLA UYUMLU) ---
    hell_blade: {
        data: {
            name: "Cehennem Kılıcı",
            description: "Riskli ateş saldırısı.",
            menuDescription: "Kılıcını cehennem ateşiyle kaplar. 40 Öfke harcar.<br>Hasar: <b style='color:orange'>(0.8 x STR)</b> + Büyü Hasarı.<br><span style='color:#ff4d4d'>%15 Kritik Şansı</span>.",
            rageCost: 40,
            levelReq: 1,
            icon: 'icon_hell_blade.png',
            type: 'attack'
        },
        onCast: function(attacker, defender) {
            // 1. Temel Hasar Hesabı
            const strBonus = Math.floor((hero.str || 0) * 0.8);
            const animFrames = ['barbarian_hellblade_strike1.png', 'barbarian_hellblade_strike2.png', 'barbarian_hellblade_strike3.png'];
            let rawDamage = 0;

            if (Math.random() < 0.15) {
                const critBase = Math.floor(Math.random() * (65 - 45 + 1)) + 45;
                rawDamage = critBase + strBonus;
                writeLog(`⭐ **KRİTİK VURUŞ!** Alevler parladı!`);
            } else {
                const normalBase = Math.floor(Math.random() * (25 - 15 + 1)) + 15;
                rawDamage = normalBase + strBonus;
            }
            
            // YENİ: Buff ve Debuffları Uygula (applyDamageModifiers combat_manager'dan gelir)
            if (typeof applyDamageModifiers === 'function') {
                rawDamage = applyDamageModifiers(rawDamage);
            }

            const fullPathFrames = animFrames.map(f => `images/${f}`);
            animateCustomAttack(rawDamage, fullPathFrames, this.data.name);
        }
    },

    // --- 2. KÜÇÜK İYİLEŞME ---
    minor_healing: {
        data: {
            name: "Küçük İyileşme",
            description: "Az miktarda can yeniler.",
            menuDescription: "Büyülü bir sargı bezi kullanır. 15 Öfke harcar. <br><span style='color:#43FF64'>%40 Şansla Güçlü</span> (5-15 HP), <span style='color:#ffff00'>%60 Şansla Zayıf</span> (1-5 HP) iyileştirme yapar.",
            rageCost: 15,
            levelReq: 1,
            icon: 'icon_minor_healing.png',
            type: 'defense'
        },
        onCast: function(attacker, defender) {
            const minHeal = 1; const maxHeal = 15; const weakThreshold = 5; const weakChance = 0.60;
            let healAmount = 0;
            if (Math.random() < weakChance) {
                healAmount = Math.floor(Math.random() * (weakThreshold - minHeal + 1)) + minHeal;
            } else {
                healAmount = Math.floor(Math.random() * (maxHeal - weakThreshold)) + weakThreshold + 1;
            }
            const oldHp = hero.hp;
            hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
            const actualHeal = hero.hp - oldHp;
            updateStats(); 
            if (actualHeal > 0) {
                showFloatingText(heroDisplayContainer, actualHeal, 'heal');
                animateHealingParticles();
                writeLog(`💚 **${this.data.name}**: ${actualHeal} HP iyileşti.`);
                setTimeout(() => { nextTurn(); }, 1500); 
            } else {
                writeLog(`❌ Canın zaten dolu.`);
                nextTurn();
            }
        }
    },

    // --- 3. YENİLENME ---
    restore_healing: {
        data: {
            name: "Yenilenme",
            description: "Zamanla can yeniler. (3 Tur Bekleme)",
            menuDescription: "Vücudun doğal iyileşmesini hızlandırır. <b style='color:orange'>Seviye 3 Gerekir.</b><br><span style='color:#43FF64'>2-3 Tur boyunca Heal</span><br><span style='color:#ff4d4d'>%20 Şansla:</span> Yüksek heal ama sonraki tur <b style='color:yellow'>SERSEM</b> olursun.<br><b style='color:cyan'>Kullandıktan sonra 3 tur beklenmeli.</b>",
            rageCost: 25,
            levelReq: 3,
            icon: 'restore_healing.png',
            type: 'defense'
        },
        onCast: function(attacker, defender) {
            const roll = Math.random();
            let turns = 0; let minVal = 0; let maxVal = 0;
            let effectName = ""; let isDizzy = false;

            if (roll < 0.20) { 
                turns = 3; minVal = 1; maxVal = 5; effectName = "Hafif Yenilenme";
                writeLog(`✨ Büyü zayıf tuttu. (3 Tur / 1-5 HP)`);
            } else if (roll < 0.50) { 
                turns = 3; minVal = 6; maxVal = 10; effectName = "Yenilenme";
                writeLog(`✨ Büyü başarılı. (3 Tur / 6-10 HP)`);
            } else if (roll < 0.80) { 
                turns = 2; minVal = 11; maxVal = 15; effectName = "Güçlü Yenilenme";
                writeLog(`✨ Büyü çok güçlü! (2 Tur / 11-15 HP)`);
            } else { 
                turns = 2; minVal = 16; maxVal = 20; effectName = "Aşırı Yükleme";
                isDizzy = true;
                writeLog(`⚡ **AŞIRI YÜKLEME!** (2 Tur / 16-20 HP) ama başın dönüyor...`);
            }

            // Regen
            hero.statusEffects.push({ id: 'regen', name: effectName, turns: turns, min: minVal, max: maxVal });

            // COOLDOWN
            hero.statusEffects.push({ 
                id: 'block_skill', 
                name: 'Soğuma', 
                turns: 3, 
                maxTurns: 3, 
                blockedSkill: 'restore_healing' 
            });

            // Dizzy
            if (isDizzy) {
                hero.statusEffects.push({ id: 'stun', name: 'Sersem', turns: 1 });
            }

            animateHealingParticles(); 
            updateStats();
            setTimeout(() => { nextTurn(); }, 1000);
        }
    }
};