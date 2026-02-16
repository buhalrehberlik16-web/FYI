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
        const targetResists = targetStats.resists || { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 };

        // Düşman atağını kontrol et (Debuff varsa rawAtk düşer)
        const weakAtk = hero.statusEffects.find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
        if (!isAttackerHero && weakAtk) {
            rawAtk = Math.floor(rawAtk * (1 - weakAtk.value));
        }

        // Savunma bonuslarını ekle (Siper/Blok değil, saf defans değeri)
        let effectiveDef = targetStats.def || 0;
		const defUpEffect = target.statusEffects.find(e => e.id === 'def_up' && !e.waitForCombat);
		if (defUpEffect) {
			// Eğer varsa (örn: +8 veya +25), bunu baz defansa ekle
			effectiveDef += defUpEffect.value; 
		}
        if (target === hero && window.isHeroDefending) {
            effectiveDef += (window.heroDefenseBonus || 0);
        } else if (target !== hero && window.isMonsterDefending) {
            effectiveDef += (window.monsterDefenseBonus || 0);
        }
		
		// --- YENİ: ZIRH DELME VE KIRIK ZIRH KONTROLÜ ---
        // A. Saldıranın "Zırh Delme" (ignore_def) buff'ı var mı?
        const hasIgnoreDef = (isAttackerHero ? hero.statusEffects : []).some(e => e.id === 'ignore_def' && !e.waitForCombat);
        
        // B. Hedefin "Savunmasız" (defense_zero) debuff'ı var mı? (Reckless Strike veya Bone Shatter'dan gelir)
        const isTargetVulnerable = (target === hero ? hero.statusEffects : []).some(e => e.id === 'defense_zero' && !e.waitForCombat);

        if (hasIgnoreDef || isTargetVulnerable) {
            effectiveDef = 0; // Defans tamamen devre dışı!
        }

        // --- 2. FİZİKSEL HASAR HESABI ---
        let physRaw = 0;
        if (isAttackerHero) {
            const p = sc.physical;
            const bonusStatVal = attackerStats[p.stat] || 0;
            // Fiziksel hasar: (Atak * Çarpan) + (Stat * Çarpan)
            physRaw = Math.floor((rawAtk * p.atkMult) + (bonusStatVal * p.statMult));
        } else {
            // Canavar: (Atak * damageSplit.physical)
            physRaw = Math.floor(rawAtk * (sc.physical || 0));
        }

        // --- 3. ELEMENTAL HASAR HESABI (YENİ HİBRİT YAPI) ---
        let totalElemAfterResist = 0; // --- ERROR FIX: ÖNCE TANIMLADIK ---
        const elementTypes = ['fire', 'cold', 'lightning', 'poison', 'curse'];
		
        elementTypes.forEach(type => {
            let elemRaw = 0;
            if (isAttackerHero) {
                // Tılsım (Charm1) bonusları artık attackerStats.elementalDamage içinde hazır geliyor!
                const itemPlusCharmBonus = attackerStats.elementalDamage ? (attackerStats.elementalDamage[type] || 0) : 0;
                
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
                
                elemRaw = Math.floor(itemPlusCharmBonus + skillElemValue);
            } else {
                // Canavar: Sadece Atak * Çarpan
                elemRaw = Math.floor(rawAtk * (sc[type] || 0));
            }

            // Direnç Uygulama (Flat Resistance - Sabit Azalma)
            if (elemRaw > 0) {
                let resValue = targetResists[type] || 0;
                totalElemAfterResist += Math.max(0, elemRaw - resValue);
            }
        });

        // Fiziksel Net ve Kalan Defans Hesaplama
        let physNet = Math.max(0, physRaw - effectiveDef);
        let remDef = (physRaw < effectiveDef) ? (effectiveDef - physRaw) : 0;
        
        // Elemental Sönümleme (Kalan Defans / 2)
        let elemNet = Math.max(0, totalElemAfterResist - Math.floor(remDef / 2));
		
		// --- 4. CHARM1 TRIBE HASAR/DEFANS BONUSU ---
		let charmTribeDmg = 0;
		hero.brooches.forEach(c => {
			if (c && c.type === "charm1" && c.targetTribe === target.tribe) {
				const b = c.bonuses.find(x => x.type === 'tribe_mod');
				if (b) {
					charmTribeDmg += b.skillDmg;
				}
			}
		});

		// KURAL: Fiziksel mi ağır Elemental mi? (İstediğin Mantık)
		if (physNet >= elemNet) {
			physNet += charmTribeDmg;
		} else {
			elemNet += charmTribeDmg;
		}

        // --- 5. YÜZDESEL KORUMALAR (Guard Active vb.) ---
        let totalHasar = physNet + elemNet;
        const guardEffect = (target === hero) ? hero.statusEffects.find(e => e.id === 'guard_active' && !e.waitForCombat) : null;
        if (guardEffect) {
            totalHasar = Math.floor(totalHasar * (1 - guardEffect.value));
        }

        // Nihai paket (Tüm sayılar tam sayı)
        return {
            total: Math.floor(totalHasar),
            phys: Math.floor(physNet),
            elem: Math.floor(elemNet)
        };
    },

    init: function() {
        window.SKILL_DATABASE = { ...COMMON_SKILLS, ...BARBARIAN_SKILLS };
        console.log("Skill Engine: Hybrid Elemental & Physical System Initialized.");
    }
};

document.addEventListener('DOMContentLoaded', () => {
    SkillEngine.init();
});