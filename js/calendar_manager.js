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
            window.hero.calendar = {
                startDayOfYear: Math.floor(Math.random() * window.CALENDAR_CONFIG.totalCycleDays),
                daysPassed: 0,
                isInitialized: true
            };
        
        console.log("📅 Zaman Sistemi Sıfırlandı: 0. Günden başlanıyor.");
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
		
		// --- YENİ: TOWNDA ZAMAN GEÇİRME (-10 YORGUNLUK) ---
        // Eğer oyuncu şu an town ekranındaysa yorgunluk düşer
        const townEl = document.getElementById('town-screen');
        const isInsideTown = townEl && (townEl.classList.contains('active') || townEl.style.display === 'flex');
        
        if (isInsideTown) {
            hero.exhaustion = Math.max(0, hero.exhaustion - 10);
            window.updateExhaustionUI();
        }

        // --- YÜZDESEL KAYNAK (MANA) YENİLEME ---
		const classRules = CLASS_CONFIG[hero.class];
		if (classRules && classRules.resourcePerDay) {
			const stats = getHeroEffectiveStats(); 
        
			// HESAPLAMA: Sonucu Math.floor() ile tam sayıya zorluyoruz.
			// Örn: 155 Max Mana * 0.10 = 15.5 -> Sonuç kesinlikle 15 olur.
			// Atlı yolculukta: 0.5 * 15.5 = 7.75 -> Sonuç kesinlikle 7 olur.
			const gainAmount = Math.floor(passed * (stats.maxRage * classRules.resourcePerDay));

			if (gainAmount > 0) {
				hero.rage = Math.min(stats.maxRage, hero.rage + gainAmount);
				console.log(`✨ ${hero.class} Meditasyonu: +${gainAmount} Mana kazanıldı.`);
			}
		}
		// -----------------------------------------------
		
	const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    // Tam sayı olarak geçen günü yazdır
    console.log(lang.log_days_passed.replace("$1", Math.floor(window.hero.calendar.daysPassed)));

    this.updateTownUI();
	if (typeof updateStats === 'function') updateStats(); // Barları anında güncelle
    if (window.saveGame) window.saveGame();
},

    updateTownUI: function() {
        const dateStr = this.getFormattedDate();
        
        // 1. Köy Tarih Alanı
        const townDate = document.getElementById('town-date-display');
        if (townDate) {
            townDate.textContent = dateStr;
            townDate.style.display = "block";
        }

        // 2. Şehir Tarih Alanı (YENİ)
        const cityDate = document.getElementById('city-date-display');
        if (cityDate) {
            cityDate.textContent = dateStr;
            cityDate.style.display = "block";
        }
    }
};