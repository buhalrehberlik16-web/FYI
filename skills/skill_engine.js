const SkillEngine = {
    // Hasar Hesaplama Motoru (Mutfak Robotu)
    calculate: function(attacker, skillData) {
        const stats = getHeroEffectiveStats(); // U ekranındaki anlık veriler
        const scaling = skillData.scaling || {};
        
        // 1. ATAK BİLEŞENİ (Süt)
        let atkPart = (stats.atk || 0) * (scaling.atkMult || 0);

        // 2. STAT BİLEŞENİ (Meyveler: STR, INT, DEX...)
        let statPart = 0;
        if (scaling.stats) {
            for (const [statName, multiplier] of Object.entries(scaling.stats)) {
                // stats objesinde yoksa (örneğin vit) doğrudan hero'dan bak
                const val = stats[statName] !== undefined ? stats[statName] : (hero[statName] || 0);
                statPart += val * multiplier;
            }
        }

        // 3. ELEMENTEL BİLEŞEN (Baharatlar: Ateş, Fiziksel...)
        let elementPart = 0;
        if (scaling.elements && hero.elementalDamage) {
            for (const [elementName, multiplier] of Object.entries(scaling.elements)) {
                elementPart += (hero.elementalDamage[elementName] || 0) * multiplier;
            }
        }

        // Toplam Ham Hasar
        return Math.floor(atkPart + statPart + elementPart);
    },

    // Dosyaları birleştiren fonksiyon
    init: function() {
        window.SKILL_DATABASE = {
            ...COMMON_SKILLS,
            ...BARBARIAN_SKILLS,
            ...(typeof MAGUS_SKILLS !== 'undefined' ? MAGUS_SKILLS : {}),
            ...(typeof TRICKSTER_SKILLS !== 'undefined' ? TRICKSTER_SKILLS : {})
        };
        console.log("Skill Engine: Tüm yetenekler başarıyla birleştirildi.");
    }
};

// Sayfa yüklenince motoru ateşle
document.addEventListener('DOMContentLoaded', () => {
    SkillEngine.init();
});