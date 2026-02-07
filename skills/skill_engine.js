const SkillEngine = {
    calculate: function(attacker, skillData, target) {
        // --- 1. TEMEL VERİLERİ HAZIRLA ---
        const isAttackerHero = (attacker === hero);
        const attackerStats = isAttackerHero ? getHeroEffectiveStats() : { atk: attacker.attack };
        const targetStats = (target === hero) ? getHeroEffectiveStats() : { def: target.defense, resists: target.resists };
        
        let rawAtk = attackerStats.atk;
        let targetDef = targetStats.def;
        const targetResists = targetStats.resists || { fire: 0, cold: 0, lightning: 0, poison: 0, curse: 0 };

        // --- 2. SALDIRI GÜCÜNÜ ETKİLEYEN DURUMLAR (weakAtk / atk_up) ---
        // Canavarın atağını kontrol et (Düşman güçsüzleşmiş mi?)
        const weakAtk = (isAttackerHero ? hero.statusEffects : hero.statusEffects).find(e => e.id === 'debuff_enemy_atk' && !e.waitForCombat);
        if (!isAttackerHero && weakAtk) {
            rawAtk = Math.floor(rawAtk * (1 - weakAtk.value));
        }

        // --- 3. SAVUNMA GÜCÜNÜ ETKİLEYEN DURUMLAR (Guard / Defense Bonus) ---
        let effectiveDef = targetDef;
        if (target === hero && window.isHeroDefending) {
            effectiveDef += (window.heroDefenseBonus || 0);
        } else if (target !== hero && window.isMonsterDefending) {
            effectiveDef += (window.monsterDefenseBonus || 0);
        }

        // --- 4. FİZİKSEL HASAR HESABI ---
        const sc = isAttackerHero ? skillData.scaling : (skillData.damageSplit || { physical: 1.0 });
        let physRaw = 0;
        if (isAttackerHero) {
            const p = sc.physical;
            const bonusStatVal = attackerStats[p.stat] || 0;
            physRaw = Math.floor((rawAtk * p.atkMult) + (bonusStatVal * p.statMult));
        } else {
            physRaw = Math.floor(rawAtk * (sc.physical || 0));
        }

        let physNet = Math.max(0, physRaw - effectiveDef);
        let remDef = (physRaw < effectiveDef) ? (effectiveDef - physRaw) : 0;

        // --- 5. ELEMENTAL HASAR HESABI (Flat Resist) ---
        let totalElemAfterResist = 0;
        const elementTypes = ['fire', 'cold', 'lightning', 'poison', 'curse'];

        elementTypes.forEach(type => {
            let elemRaw = 0;
            if (isAttackerHero) {
                const itemElemBonus = attackerStats.elementalDamage ? (attackerStats.elementalDamage[type] || 0) : 0;
                const skillMult = (sc.elemental && sc.elemental[type]) ? sc.elemental[type] : 0;
                elemRaw = Math.floor(itemElemBonus + (skillMult));
            } else {
                elemRaw = Math.floor(rawAtk * (sc[type] || 0));
            }

            if (elemRaw > 0) {
                let resValue = targetResists[type] || 0;
                totalElemAfterResist += Math.max(0, elemRaw - resValue);
            }
        });

        // Elemental Sönümleme (Kalan Defans / 2)
        let elemNet = Math.max(0, totalElemAfterResist - Math.floor(remDef / 2));

        // --- 6. YÜZDESEL AZALTMALAR (Guard Active %25 Azaltma) ---
        let totalHasar = physNet + elemNet;
        const guardEffect = (target === hero) ? hero.statusEffects.find(e => e.id === 'guard_active' && !e.waitForCombat) : null;
        if (guardEffect) {
            totalHasar = Math.floor(totalHasar * (1 - guardEffect.value));
        }

        return {
            total: Math.floor(totalHasar),
            phys: Math.floor(physNet),
            elem: Math.floor(elemNet)
        };
    },
    init: function() {
        window.SKILL_DATABASE = { ...COMMON_SKILLS, ...BARBARIAN_SKILLS };
		console.log("Skill Engine:(Flat Resistance Mode) Aktif.");
    }
};

// Sayfa yüklenince motoru ateşle
document.addEventListener('DOMContentLoaded', () => {
    SkillEngine.init();

});
