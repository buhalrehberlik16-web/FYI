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
        finalInventory: []
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
            finalInventory: []
        };
        this.saveToProfile();
    },

    trackDamageDealt: function(amount) { this.currentRun.totalDamageDealt += amount; },
    trackDamageTaken: function(amount) { this.currentRun.totalDamageTaken += amount; },
    trackNode: function() { this.currentRun.nodesPassed++; },
    trackMonster: function(monsterName) {
        this.currentRun.monsterEncounters[monsterName] = (this.currentRun.monsterEncounters[monsterName] || 0) + 1;
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