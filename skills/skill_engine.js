const SkillEngine = {
    // Hasar Hesaplama Motoru (Mutfak Robotu)
    calculate: function(attacker, skillData) {
        // U ekranında görünen o anki EN GÜÇLÜ halini alıyoruz
        const stats = getHeroEffectiveStats(); 
        const scaling = skillData.scaling || {};
        
        // 1. ATAK BİLEŞENİ (Artık içinde stat bonusları ve atk_up buffları var!)
        let atkPart = (stats.atk || 0) * (scaling.atkMult || 0);

        // 2. EXTRA STAT BİLEŞENİ (Skille özel çarpan: örn %60 STR bonusu)
        let statPart = 0;
        if (scaling.stats) {
            for (const [statName, multiplier] of Object.entries(scaling.stats)) {
                // Bufflı stat değerini kullan (Str_up varsa onu da kapsar)
                const statVal = stats[statName] || 0;
                statPart += statVal * multiplier;
            }
        }

        // 3. ELEMENTEL BİLEŞEN (İleride itemlerden gelecek)
        let elementPart = 0;
        if (scaling.elements && hero.elementalDamage) {
            for (const [elementName, multiplier] of Object.entries(scaling.elements)) {
                elementPart += (hero.elementalDamage[elementName] || 0) * multiplier;
            }
        }

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