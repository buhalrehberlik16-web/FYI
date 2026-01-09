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
                const gracePeriod = 18;
                if (hero.calendar.daysPassed > gracePeriod) {
                    const penaltyDays = hero.calendar.daysPassed - gracePeriod;
                    return 1.0 + (penaltyDays * 0.05); // Her gün için +%5
                }
                return 1.0;

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