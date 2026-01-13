// js/event_manager.js

window.EventManager = {
    // 1. Sistem Kilidi Kontrolü
    isSystemLocked: function(systemKey) {
        const activeEvent = this.getActiveEventId();
        if (systemKey === 'blacksmith' && activeEvent === 'EVENT_BLACKSMITH_LOCK') return true;
        return false;
    },

    // 2. Sayısal Çarpanlar (İndirim, XP, Boss Scaling)
    getModifier: function(type) {
        const activeEvent = this.getActiveEventId();

        switch(type) {
            case 'merchant_price':
                return (activeEvent === 'EVENT_MERCHANT_SALE') ? 0.8 : 1.0;
            
            case 'xp_gain':
                return (activeEvent === 'EVENT_XP_BOOST') ? 1.2 : 1.0;

            case 'boss_scaling':
    const gracePeriod = 25; // Kritik Eşik (Gün)
    const days = hero.calendar.daysPassed;

    if (days > gracePeriod) {
        // 18 Günden SONRA: Her gün için +%5 Güçlenme
        const penaltyDays = days - gracePeriod;
        return 1.0 + (penaltyDays * 0.05); 
    } 
    else if (days < gracePeriod) {
        // 18 Günden ÖNCE: Her gün için -%2.5 Zayıflama
        const bonusDays = gracePeriod - days;
        const reduction = bonusDays * 0.025;
        // Güvenlik: Boss'un gücü en fazla %50 düşebilir (0.5 floor)
        return Math.max(0.5, 1.0 - reduction);
    }
    
    return 1.0; // Tam 18. günde ulaşıldıysa normal güç

            default:
                return 1.0;
        }
    },

    // 3. Savaş Başlangıcı Bonusları
    getCombatBonus: function() {
        const activeEvent = this.getActiveEventId();
        if (activeEvent === 'EVENT_STORM_FURY') return { rage: 10 };
        return { rage: 0 };
    },

    getActiveEventId: function() {
        const info = window.CalendarManager.getCurrentInfo();
        return info ? info.month.eventId : null;
    }
};