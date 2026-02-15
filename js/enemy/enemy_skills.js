// js/enemy/enemy_skills.js

window.EnemySkillEngine = {
    applyOptionalDot: function(packet, config, dmgPack) {
        if (config.dotType && config.duration) {
            let dotVal = config.dotValue || 0;
            
            if (dmgPack && dmgPack.elem > 0) {
                // tickMult yoksa varsayılan 0.5 kullan
                const mult = config.tickMult !== undefined ? config.tickMult : 0.5;
                dotVal = Math.floor(dmgPack.elem * mult);
            }

            // Hero dirençlerini kontrol et (Failsafe: 0 dönmesi garanti edildi)
            const heroStats = getHeroEffectiveStats();
            const resists = heroStats.resists || {};
            const heroResist = resists[config.dotType] || 0;
            
            // NaN engellemek için her zaman en az 0 veya 1 dönmesini sağla
            let finalTickDamage = Math.max(1, (dotVal || 0) - heroResist);

            packet.statusEffects.push({ 
                id: config.dotType, 
                name: window.LANGUAGES[window.gameSettings.lang].status[config.dotType] || config.dotType,
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
            window.EnemySkillEngine.applyOptionalDot(packet, config, dmgPack);
            return packet;
        },

        "stat_debuff": (monster, config) => {
            let packet = {
                id: config.id,
                category: config.category,
                statusEffects: [],
                text: config.textKey,
                value: config.value || 0, // NaN koruması
                damage: { total: 0, phys: 0, elem: 0 }
            };

            // A. Stat Değişimi (Sadece subtype "poison" veya "fire" DEĞİLSE uygula)
            // Çünkü poison/fire'ı applyOptionalDot halledecek.
            const dotIds = ['poison', 'fire', 'cold', 'lightning', 'curse'];
            
            if (config.subtype === "rage_burn") {
                packet.rageReduction = config.value || 0;
            } else if (config.subtype && !dotIds.includes(config.subtype)) {
                packet.statusEffects.push({ 
                    id: config.subtype, 
                    value: config.value || 0, 
                    turns: config.duration 
                });
            }

            // B. Hasar Hesabı (damageSplit varsa)
            if (config.damageSplit) {
                packet.damage = SkillEngine.calculate(monster, config, hero);
            }

            // C. DoT Hesabı
            window.EnemySkillEngine.applyOptionalDot(packet, config, packet.damage);

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
        const config = stats.skills.find(s => s.id === skillId);
        if (!config) return null;
        const templateKey = (config.template === "damage_and_dot") ? "special_attack" : config.template;
        const templateFunc = this.templates[templateKey];
        return templateFunc ? templateFunc(monster, config) : null;
    }
};