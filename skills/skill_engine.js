// js/skill_engine.js

const SkillEngine = {
    calculate: function(attacker, skillData, target) {
        // --- 1. GÜVENLİK KONTROLÜ VE VERİ HAZIRLIĞI ---
        const isAttackerHero = (attacker === hero);
        const sc = isAttackerHero ? skillData.scaling : skillData.damageSplit;

        // Eğer yeteneğin hasar verisi yoksa direkt 0 dön
        if (!sc) return { total: 0, phys: 0, elem: 0 };

        const attackerStats = isAttackerHero ? getHeroEffectiveStats() : { atk: attacker.attack };
        const targetStats = (target === hero) ? getHeroEffectiveStats() : { def: target.defense, resists: target.resists };
        
        let rawAtk = attackerStats.atk;
		
		// --- YENİ: SALDIRGANIN ÜZERİNDEKİ ATK BUFFLARINI KONTROL ET (DİNAMİK) ---
        // Sadece Hero'da değil, artık Canavar'da da atk_up etkisini kontrol ediyoruz
        if (attacker.statusEffects) {
            const atkUpEffect = attacker.statusEffects.find(e => e.id === 'atk_up' && !e.waitForCombat);
            if (atkUpEffect) {
                rawAtk += atkUpEffect.value; // +15 veya config'deki değer kadar hasar ekle
            }
            
            // Yüzdesel Atak Bonusu kontrolü (Örn: %25 Atak Artışı)
            const atkUpPercent = attacker.statusEffects.find(e => e.id === 'atk_up_percent' && !e.waitForCombat);
            if (atkUpPercent) {
                rawAtk = Math.floor(rawAtk * (1 + atkUpPercent.value));
            }
        }
        // ---------------------------------------------------------------------
		
        const targetResists = targetStats.resists || { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 };

        // Düşman atağını kontrol et (Debuff varsa rawAtk düşer)
        // Saldırganın (Canavarın) üzerinde bu debuff var mı diye bakıyoruz
		const atkDebuff = attacker.statusEffects.find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
		if (atkDebuff) {
			// Eğer varsa, atağı düşür (Örn: 12 * 0.8 = 9.6 -> 9)
			rawAtk = Math.floor(rawAtk * (1 - atkDebuff.value));
		}

        // --- 1. SAVUNMA HESAPLAMA VE DEBUFF KONTROLÜ ---
        let effectiveDef = targetStats.def || 0;

        if (target.statusEffects) {
            // A. DÜŞMAN DEFANS DEBUFF (Distract vb. ile canavarın zırhını kırma)
            const weakDef = target.statusEffects.find(e => e.id === 'debuff_enemy_def' && !e.waitForCombat);
            if (weakDef) {
                effectiveDef = Math.floor(effectiveDef * (1 - weakDef.value));
            }

            // B. SABİT DEFANS ARTIŞI (Stone Skin veya Canavarın Kalkanı)
            const defUpEffect = target.statusEffects.find(e => e.id === 'def_up' && !e.waitForCombat);
            if (defUpEffect) {
                effectiveDef += defUpEffect.value; 
            }
        }

        // C. SİPER / SAVUNMA DURUŞU (A ve D tuşları veya Canavarın Defend hamlesi)
        if (target === hero && window.isHeroDefending) {
            effectiveDef += (window.heroDefenseBonus || 0);
        } else if (target !== hero && window.isMonsterDefending) {
            effectiveDef += (window.monsterDefenseBonus || 0);
        }

        // --- 2. ZIRH DELME VE KIRIK ZIRH KONTROLÜ (EVRENSEL) ---
        
        // DÜZELTME A: Saldıran kimse (Attacker) onun üzerindeki "ignore_def" buff'ına bak
        const hasIgnoreDef = attacker.statusEffects && attacker.statusEffects.some(e => e.id === 'ignore_def' && !e.waitForCombat);
        
        // DÜZELTME B: Hedef kimse (Target) onun üzerindeki "defense_zero" debuff'ına bak
        const isTargetVulnerable = target.statusEffects && target.statusEffects.some(e => e.id === 'defense_zero' && !e.waitForCombat);

        // Eğer saldırgan zırh deliyorsa VEYA hedef savunmasızsa zırhı 0'la
        if (hasIgnoreDef || isTargetVulnerable) {
            effectiveDef = 0; 
        }

        // E. YETENEK BAZLI ZIRH DELME (IgnoreDefPercent/IgnoreDef - skillData'dan gelir)
        if (skillData.ignoreDefPercent) {
            effectiveDef *= (1 - skillData.ignoreDefPercent);
        }
        if (skillData.ignoreDef) {
            effectiveDef = Math.max(0, effectiveDef - skillData.ignoreDef);
        }

        // --- 2. FİZİKSEL HASAR HESABI ---
        let physRaw = 0;
        if (isAttackerHero) {
            const p = sc.physical;
            const bonusStatVal = attackerStats[p.stat] || 0;
			
			// --- YENİ ZİNCİRLEME MANTIĞI BURAYA GELİYOR ---
            // Yeteneğin ana stat çarpanını alıyoruz (Örn: 1.4)
            let physStatMult = p.statMult || 0;

            // Eğer yetenek bilgisinde 'statMultPerUse' varsa (Chain Blast gibi)
            // Kullanım sayısına göre çarpanı artırıyoruz.
            if (skillData.statMultPerUse) {
                // hero.skillUsage["Chain_Blast"] değerine bakıyoruz
                const usageCount = hero.skillUsage[skillData.id] || 0;
                physStatMult += (usageCount * skillData.statMultPerUse);
            }
            // ----------------------------------------------
			
            // Fiziksel hasar: (Atak * Çarpan) + (Stat * Çarpan)
            physRaw = Math.floor((rawAtk * p.atkMult) + (bonusStatVal * physStatMult));
        } else {
            // Canavar: (Atak * damageSplit.physical)
            physRaw = Math.floor(rawAtk * (sc.physical || 0));
        }

        // --- 3. ELEMENTAL HASAR HESABI (YENİ HİBRİT YAPI) ---
        let totalElemAfterResist = 0; // --- ERROR FIX: ÖNCE TANIMLADIK ---
        const elementTypes = ['fire', 'cold', 'lightning', 'poison', 'curse'];
		
		// --- CHARM1 ELEMENTAL BONUS KONTROLÜ ---
        let charmElemBonuses = { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 };
        hero.brooches.forEach(c => {
            if (c && c.type === "charm1") {
                c.bonuses.forEach(b => {
                    if (b.type === 'elemDmg') charmElemBonuses[b.element] += b.value;
                });
            }
        });

        elementTypes.forEach(type => {
            let elemRaw = 0;
            if (isAttackerHero) {
                // Karakterin itemlarından gelen sabit elemental hasar
                const itemElemBonus = attackerStats.elementalDamage ? (attackerStats.elementalDamage[type] || 0) : 0;
                
                // Skilin o element için konfigürasyonu
                const elemConf = (sc.elemental && sc.elemental[type]) ? sc.elemental[type] : 0;
                
                let skillElemValue = 0;
                if (typeof elemConf === 'object') {
                    // --- YENİ MANTIK: Obje tanımlanmışsa (stat + atkMix) ---
                    const fromAtk = Math.floor(rawAtk * (elemConf.atkMult || 0));
                    const fromStat = Math.floor((attackerStats[elemConf.stat] || 0) * (elemConf.statMult || 0));
                    skillElemValue = fromAtk + fromStat;
                } else {
                    // --- ESKİ MANTIK: Sadece sayıysa (Atak çarpanı kabul et) ---
                    skillElemValue = Math.floor(rawAtk * elemConf);
                }
                
                elemRaw = Math.floor(itemElemBonus + skillElemValue);
            } else {
                // Canavar: Sadece Atak * Çarpan (Canavarların karmaşık statları yok)
                elemRaw = Math.floor(rawAtk * (sc[type] || 0));
            }
			
			// Tılsımdan gelen ek hasarı ekle
            elemRaw += charmElemBonuses[type]; 

            // Direnç Uygulama (Flat Resistance)
            if (elemRaw > 0) {
                let resValue = targetResists[type] || 0;
                totalElemAfterResist += Math.max(0, elemRaw - resValue);
            }
        });

        // --- 4. CHARM1 TRIBE HASAR BONUSU (HESAPLAMA ÖNCESİNE ÇEKİLDİ) ---
        let charmTribeDmg = 0;
        hero.brooches.forEach(c => {
            if (c && c.type === "charm1" && c.targetTribe === target.tribe) {
                const b = c.bonuses.find(x => x.type === 'tribe_mod');
                if (b) {
                    charmTribeDmg += b.skillDmg;
                }
            }
        });

        // Kural: Fiziksel ağırsa oraya, değilse elementale ekle (True damage olmaması için ham verilere ekliyoruz)
        if (physRaw >= totalElemAfterResist) {
            physRaw += charmTribeDmg;
        } else {
            totalElemAfterResist += charmTribeDmg;
        }

        // --- 5. NİHAİ NET HASAR HESAPLAMALARI ---
        // Fiziksel Net ve Kalan Defans Hesaplama (Tılsım eklenmiş physRaw üzerinden)
        let physNet = Math.max(0, physRaw - effectiveDef);
        let remDef = (physRaw < effectiveDef) ? (effectiveDef - physRaw) : 0;
        
        // Elemental Sönümleme (Tılsım eklenmiş totalElemAfterResist üzerinden)
        let elemNet = Math.max(0, totalElemAfterResist - Math.floor(remDef / 2));

        // --- 6. YÜZDESEL KORUMALAR (Guard Active vb.) ---
        let totalHasar = physNet + elemNet;
		
		// --- YANKI / KURULMA (WIND UP) BONUSU ---
		// Eğer saldıran kahramansa ve üzerinde wind_up etkisi varsa hasara ekle
		const windUp = attacker.statusEffects && attacker.statusEffects.find(e => (e.id === 'wind_up' || e.id === 'arcane_echo_active') && !e.waitForCombat);
		if (windUp) {
			totalHasar += windUp.value;
			physNet += windUp.value; // Fiziksel hasar kısmına da ekleyelim ki detayda doğru gözüksün
		}
		// ----------------------------------------
		
        // --- 2. LANET VE SON ÇARPANLAR ---
        let finalDamageMultiplier = 1.0;

        // KRİTİK: Hedefin (Target) üzerinde 'curse_damage' var mı diye bakıyoruz
        if (target.statusEffects) {
            const curseEffect = target.statusEffects.find(e => e.id === 'curse_damage' && !e.waitForCombat);
            if (curseEffect) {
                // Eğer varsa çarpanı artır (Örn: 1.0 + 0.20 = 1.20)
                finalDamageMultiplier += curseEffect.value; 
            }
        }

        // Nihai paket (Tüm sayılar tam sayı)
        return {
            total: Math.floor(totalHasar * finalDamageMultiplier),
            phys: Math.floor(physNet * finalDamageMultiplier),
            elem: Math.floor(elemNet * finalDamageMultiplier)
        };
    },

    init: function() {
        window.SKILL_DATABASE = { ...COMMON_SKILLS, ...BARBARIAN_SKILLS, ...MAGUS_SKILLS };
        console.log("Skill Engine: Tüm yetenekler (Barbar & Magus) başarıyla birleştirildi.");
    },
	
	calculateDoT: function(attacker, skillData, target) {
    // --- TAM GÜVENLİK KONTROLÜ ---
    // Eğer skill içinde dotEffect yoksa veya scaling tanımlanmamışsa hata verme, 0 dön.
    if (!skillData || !skillData.dotEffect || !skillData.dotEffect.scaling) {
        return 0; 
    }

    const attackerStats = (attacker === hero) ? getHeroEffectiveStats() : { atk: attacker.attack };
    const targetStats = (target === hero) ? getHeroEffectiveStats() : { resists: target.resists };

    let totalTickDmg = 0;
    const s = skillData.dotEffect.scaling;

    // Elemental Tick Hesabı
    if (s.elemental) {
        for (const [ele, conf] of Object.entries(s.elemental)) {
            let eleRaw = 0;
            if (typeof conf === 'object') {
                eleRaw = (attackerStats.atk * (conf.atkMult || 0)) + 
                         ((attackerStats[conf.stat] || 0) * (conf.statMult || 0));
            } else {
                eleRaw = attackerStats.atk * (conf || 0);
            }

            const resist = targetStats.resists[ele] || 0;
            totalTickDmg += Math.max(0, eleRaw - resist);
        }
    }
    return Math.floor(totalTickDmg);
	}

};

// Sayfa yüklenince motoru ateşle
document.addEventListener('DOMContentLoaded', () => {
    SkillEngine.init();
});