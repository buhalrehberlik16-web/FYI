// js/enemy/enemy_skills.js

window.EnemySkillEngine = {
    // GÜNCELLEME: monster parametresi eklendi
    applyOptionalDot: function(packet, config, dmgPack, monster) {
        if (config.dotType && config.duration) {
            const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
            
            // --- KRİTİK HESAPLAMA DÜZELTMESİ ---
            // Senin istediğin mantık: Canavarın o anki ATK değeri üzerinden hesapla
            // (Scaling, Hard bonusları dahil olan monster.attack kullanılır)
            const basePower = monster.attack || 0;
            const mult = config.tickMult !== undefined ? config.tickMult : 0.5;
            
            // 4 * 0.75 = 3.0 (Küsürat kalmaması için Math.round veya Math.ceil en güvenlisidir)
            let dotValRaw = Math.round(basePower * mult);

            // --- DİRENÇ KONTROLÜ ---
            const heroStats = getHeroEffectiveStats();
            const heroResist = heroStats.resists[config.dotType] || 0;
            
            // Net DoT Hasarı (En az 1 vurması için failsafe)
            let finalTickDamage = Math.max(1, dotValRaw - heroResist);
            // ----------------------------------

            packet.statusEffects.push({ 
                id: config.dotType, 
                name: lang.status[config.dotType] || config.dotType,
                value: finalTickDamage, 
                turns: config.duration 
            });
        }
    },

    templates: {
        "special_attack": (monster, config) => {
            const dmgPack = SkillEngine.calculate(monster, config, hero);
            let packet = {
                id: config.id,
                category: "attack",
                damage: dmgPack,
                statusEffects: [],
                healing: config.healPercent ? Math.floor(dmgPack.total * config.healPercent) : 0,
                text: config.textKey
            };
            // monster parametresini gönderiyoruz
            window.EnemySkillEngine.applyOptionalDot(packet, config, dmgPack, monster);
            return packet;
        },

        "stat_debuff": (monster, config) => {
            let packet = {
                id: config.id,
                category: config.category,
                statusEffects: [],
                text: config.textKey,
                value: config.value || 0,
                damage: { total: 0, phys: 0, elem: 0 }
            };

            const dotIds = ['poison', 'fire', 'cold', 'lightning', 'curse', 'bleed'];
            
            if (config.subtype === "rage_burn") {
                packet.rageReduction = config.value || 0;
            } else if (config.subtype && !dotIds.includes(config.subtype)) {
                packet.statusEffects.push({ 
                    id: config.subtype, 
                    value: config.value || 0, 
                    turns: config.duration 
                });
            }

            if (config.damageSplit) {
                packet.damage = SkillEngine.calculate(monster, config, hero);
            }

            // monster parametresini gönderiyoruz
            window.EnemySkillEngine.applyOptionalDot(packet, config, packet.damage, monster);

            return packet;
        },

        "self_buff": (monster, config) => {
            let healing = 0;
            if (config.subtype === "heal") {
                healing = Math.floor(monster.maxHp * (config.value || 0));
            }
            return {
                id: config.id,
                category: "buff",
                healing: healing,
                statusEffects: config.statusId ? [{ id: config.statusId, value: config.value || 0, turns: config.duration }] : [],
                text: config.textKey
            };
        }
    },

    resolve: function(monster, skillId) {
        const stats = ENEMY_STATS[monster.name];
        let config = stats.skills.find(s => s.id === skillId);

        if (!config && (skillId === 'attack1' || skillId === 'attack2')) {
            config = { id: skillId, template: "special_attack", damageSplit: { physical: 1.0 } };
        }

        if (!config) return null;

        const templateFunc = this.templates[config.template];
        return templateFunc ? templateFunc(monster, config) : null;
    }
};