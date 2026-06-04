// js/stats_manager.js

window.StatsManager = {
    // Mevcut aktif koşu istatistikleri
    currentRun: {
        playerName: "",
        className: "",
        nodesPassed: 0,
        startTime: null,
        totalDamageDealt: 0,
        totalDamageTaken: 0,
        monsterEncounters: {}, // { "İskelet": 5, "Kurt": 2 }
        finalInventory: [],
		seenEnemies: [], // ["İskelet", "Gri Kurt"] gibi
        seenItems: [],   // ["item_ring_str"] gibi nameKey'ler
        seenEvents: []   // ["lost_child"] gibi ID'ler
    },

    initNewRun: function(name, className) {
        this.currentRun = {
            playerName: name,
            className: className,
            nodesPassed: 0,
            startTime: Date.now(),
            totalDamageDealt: 0,
            totalDamageTaken: 0,
            monsterEncounters: {},
            finalInventory: [],
			seenEnemies: [], // ["İskelet", "Gri Kurt"] gibi
			seenItems: [],   // ["item_ring_str"] gibi nameKey'ler
			seenEvents: []   // ["lost_child"] gibi ID'ler
        };
        this.saveToProfile();
    },

    trackDamageDealt: function(amount) { this.currentRun.totalDamageDealt += amount; },
    trackDamageTaken: function(amount) { this.currentRun.totalDamageTaken += amount; },
    trackNode: function() { this.currentRun.nodesPassed++; },
    trackMonster: function(monsterName) {
        this.currentRun.monsterEncounters[monsterName] = (this.currentRun.monsterEncounters[monsterName] || 0) + 1;
    },
	trackEnemy: function(monsterObj) {
        if (!monsterObj) return;

        // Benzersiz kimlik: İsim + Zorluk Durumu (Aynı canavarın farklı hallerini ayırır)
        const variantSignature = `${monsterObj.name}_${monsterObj.tier}_${monsterObj.isHard}_${monsterObj.isHalfTier}_${monsterObj.isWeak}`;
        
        if (!this.currentRun.seenEnemies) this.currentRun.seenEnemies = [];

        const alreadySeen = this.currentRun.seenEnemies.some(seen => seen.signature === variantSignature);

        if (!alreadySeen) {
            this.currentRun.seenEnemies.push({
                name: monsterObj.name,
                tier: monsterObj.tier,
                isHard: monsterObj.isHard,
                isHalfTier: monsterObj.isHalfTier,
                isWeak: monsterObj.isWeak,
                hp: monsterObj.maxHp,
                atk: monsterObj.attack,
                def: monsterObj.defense,
                idle: monsterObj.idle,
				isBoss: monsterObj.isBoss, // Boss olup olmadığını kaydet
				bossScaling: window.currentBossScaling || 1.0, // O anki zaman çarpanını kaydet
                signature: variantSignature
            });
        }
    },

    trackItem: function(item) {
        if (!item) return;

        // --- GÜNCELLEME: TÜM ÖZELLİKLERİ KAPSAYAN İMZA ---
        const statsSig = JSON.stringify(item.stats || {});
        const effectSig = item.effects ? JSON.stringify(item.effects) : "";
        const bonusSig = item.bonuses ? JSON.stringify(item.bonuses) : "";
        
        const statSignature = `${item.tier}_${statsSig}_${effectSig}_${bonusSig}_${item.implicitDef || 0}`;
        
        if (!this.currentRun.seenItems) this.currentRun.seenItems = [];

        const alreadySeen = this.currentRun.seenItems.some(seen => 
            seen.nameKey === item.nameKey && seen.signature === statSignature
        );

        if (!alreadySeen) {
            this.currentRun.seenItems.push({
                nameKey: item.nameKey,
                type: item.type,
                tier: item.tier,
                stats: item.stats ? { ...item.stats } : null,
                effects: item.effects ? [...item.effects] : null, // Broş efektleri
                bonuses: item.bonuses ? [...item.bonuses] : null, // Tılsım bonusları
				frequency: item.frequency,
                specialtyTribe: item.specialtyTribe,
                icon: item.icon,
                implicitDef: item.implicitDef || 0,
                signature: statSignature
            });
            console.log(`📖 Compendium: Yeni ekipman kaydedildi - ${item.nameKey}`);
        }
    },
    // OLAY TAKİBİ: Yapılan seçimi (choiceText) de kaydeder
    trackEvent: function(eventId, choiceText, resultObj = null, optKey = null) {
        if (!this.currentRun.seenEvents) this.currentRun.seenEvents = [];
        
        this.currentRun.seenEvents.push({
            id: eventId,
            choice: choiceText,
			optKey: optKey,
            // Sonuç bir item, hasar rakamı veya altın olabilir
            result: resultObj ? JSON.parse(JSON.stringify(resultObj)) : null 
        });
    },

    saveToProfile: function() {
    // filter(item => item !== null) yerine filter(item => !!item) kullanıyoruz
    // Bu sayede hem null hem undefined olan boş slotları eliyoruz.
    this.currentRun.finalInventory = hero.inventory
        .filter(item => !!item && item.nameKey) // Eşyanın varlığından ve nameKey'inden emin ol
        .map(item => item.nameKey);
        
    localStorage.setItem("RPG_Last_Run_Stats", JSON.stringify(this.currentRun));
},

    loadProfile: function() {
        const data = localStorage.getItem("RPG_Last_Run_Stats");
        return data ? JSON.parse(data) : null;
    },

    getMostEncountered: function(encounters) {
        let max = 0, name = "-";
        for (let m in encounters) {
            if (encounters[m] > max) { max = encounters[m]; name = m; }
        }
        return name;
    }
};