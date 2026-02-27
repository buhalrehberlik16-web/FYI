// js/calendar_manager.js

// 1. Ayarlar ve Veriler (En üstte olmalı!)
window.CALENDAR_CONFIG = {
    totalCycleDays: 300,
    months: [
        { name: "Frostfall", length: 22, eventId: "EVENT_MERCHANT_SALE" },
        { name: "Embercrest", length: 35, eventId: null },
        { name: "Stormreach", length: 18, eventId: "EVENT_STORM_FURY" },
        { name: "Bloomheıght", length: 42, eventId: null },
        { name: "Shadowveıl", length: 27, eventId: "EVENT_BLACKSMITH_LOCK" },
        { name: "Ironheart", length: 31, eventId: null },
        { name: "Marchober", length: 25, eventId: "EVENT_XP_BOOST" },
        { name: "Goldleaf", length: 38, eventId: null },
        { name: "Nıghtshade", length: 20, eventId: "EVENT_POISON_DANGER" },
        { name: "Sunpeak", length: 42, eventId: null }
    ]
};

window.CalendarManager = {
    init: function() {
        // GÜVENLİK: Eğer config henüz yüklenmemişse (çok düşük ihtimal ama hata önler)
        if (!window.CALENDAR_CONFIG) {
            console.error("HATA: CALENDAR_CONFIG bulunamadı!");
            return;
        }

        // Eğer hero objesinde takvim verisi yoksa veya bozuksa oluştur
        if (!window.hero.calendar || window.hero.calendar.startDayOfYear === 0) {
            window.hero.calendar = {
                startDayOfYear: Math.floor(Math.random() * window.CALENDAR_CONFIG.totalCycleDays),
                daysPassed: 0,
                isInitialized: true
            };
        }
        
        console.log("Zaman Sistemi Başlatıldı.");
        this.updateTownUI();
    },

    getCurrentInfo: function() {
        // Eğer hero.calendar bir şekilde silindiyse tekrar oluştur
        if (!window.hero.calendar || window.hero.calendar.startDayOfYear === undefined) {
            this.init();
        }

        const cal = window.hero.calendar;
        const conf = window.CALENDAR_CONFIG;

        const currentTotalDay = (cal.startDayOfYear + cal.daysPassed) % conf.totalCycleDays;
        
        let dayCounter = 0;
        for (let m of conf.months) {
            if (currentTotalDay < dayCounter + m.length) {
                return { 
                    day: Math.floor(currentTotalDay - dayCounter) + 1, 
                    month: m 
                };
            }
            dayCounter += m.length;
        }
        return { day: 1, month: conf.months[0] };
    },

    getFormattedDate: function() {
        const info = this.getCurrentInfo();
        return `${info.day} ${info.month.name}`;
    },

    passDay: function() {
    if (!window.hero.calendar) this.init();
	
	let passed = 0; // Geçen süreyi hesaplamak için değişken

        // EĞER ATLIYSA: Zaman yarı yarıya akar (0.5 gün)
        if (window.hero.mountedNodesLeft > 0) {
            passed = 0.5;
            window.hero.calendar.daysPassed += 0.5;
            window.hero.mountedNodesLeft--;
            console.log(`Atlı Yolculuk: 0.5 gün geçti. Kalan Atlı Tur: ${window.hero.mountedNodesLeft}`);
        } else {
            passed = 1.0;
            window.hero.calendar.daysPassed += 1;
        }

        // --- YENİ: SINIF BAZLI KAYNAK (MANA) YENİLEME ---
        const classRules = CLASS_CONFIG[hero.class];
        if (classRules && classRules.resourcePerDay) {
            const stats = getHeroEffectiveStats(); // Max sınırı için
            // Geçen gün * Günlük çarpan (1.0 * 10 veya 0.5 * 10)
            hero.rage = Math.min(stats.maxRage, hero.rage + (passed * classRules.resourcePerDay));
        }
        // -----------------------------------------------

    this.updateTownUI();
	if (typeof updateStats === 'function') updateStats(); // Barları anında güncelle
    if (window.saveGame) window.saveGame();
},

    updateTownUI: function() {
        const dateArea = document.getElementById('town-date-display');
        if (dateArea) {
            dateArea.textContent = this.getFormattedDate();
            // Görünürlüğü zorla (eğer CSS engelliyorsa)
            dateArea.style.display = "block";
        }
    }
};