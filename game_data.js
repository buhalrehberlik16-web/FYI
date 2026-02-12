// --- START OF FILE game_data.js ---

const MAX_LEVEL = 60;

const CLASS_CONFIG = {
    "Barbar": {
        startingStats: { str: 6, dex: 3, int: 2, vit: 4, mp_pow: 2 },
        startingResistances: { fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
        startingElementalDamage: { fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
        
        atkStats: { "str": 0.5 },
        defStats: { "dex": 0.34 },
        blockStats: { "dex": 0.8 },
        vitMultiplier: 5,
        baseHp: 20,
		hitRageGain: 0.25
    },
    "Magus": {
        startingStats: { str: 5, dex: 8, int: 10, vit: 8, mp_pow: 20 },
        startingResistances: { fire: 15, cold: 15, lightning: 15, curse: 5, poison: 0 },
        startingElementalDamage: { fire: 10, cold: 0, lightning: 0, curse: 0, poison: 0 },
        
        atkStats: { "int": 0.8 },
        defStats: { "dex": 0.2 },
        blockStats: { "int": 0.4 },
        vitMultiplier: 7,
        baseHp: 15
    }
};

const LEVEL_SKILL_REWARDS = { 2: 2, 5: 2, 8: 3, 12: 4, 16: 4, 20: 5 };
const FULL_XP_REQUIREMENTS = Array.from({length: MAX_LEVEL + 1}, () => 10);

window.hero = {
    name: "Barbar",
    playerName: "Oyuncu",
    class: "Barbar",
    level: 1, 
    xp: 0, 
    xpToNextLevel: 10,
    hp: 40,    // maxHp silindi (dinamik hesaplanıyor)
    rage: 0,   // maxRage silindi (dinamik hesaplanıyor)
    gold: 0,
    statPoints: 0, 
    skillPoints: 0,
    currentAct: 1,
    str: 6, dex: 3, int: 2, vit: 4, mp_pow: 2,
    baseAttack: 10, baseDefense: 0,
    baseResistances: { fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
    elementalDamage: { fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
    highestTierDefeated: 1,
    statusEffects: [],
    mapEffects: [],
    unlockedSkills: [],
    equippedSkills: [null, null, null, null, null, null],
    inventory: new Array(8).fill(null), 
    brooches: new Array(6).fill(null), 
    equipment: { earring1: null, earring2: null, necklace: null, belt: null, ring1: null, ring2: null },
    calendar: {startDayOfYear: 0, daysPassed: 0, isInitialized: false },
    mountedNodesLeft: 0, 
    scoutedNodesLeft: 0,
	hasSeenSkillWarning: false,
};

// EVENT HAVUZU
const EVENT_POOL = [
    {
        id: "berserk_brew", type: "turn_based", title: "Öfke İksiri", desc: "Yerde fokurdayan kırmızı bir şişe buldun.",
        option1: {
            text: "İç (Riskli Güç)",
            buff: "3 Tur: <span class='buff'>+15 Saldırı</span>",
            debuff: "3 Tur: <span class='debuff'>TÜM İyileşmeler Kilitli</span>",
            action: (hero) => {
                hero.statusEffects.push({ id: 'atk_up', name: 'Öfke', turns: 3, value: 15, waitForCombat: true });
                hero.statusEffects.push({ id: 'block_type', name: 'İyileşme Kilitli', turns: 3, blockedType: 'defense', waitForCombat: true });
            }
        },
        option2: { text: "Dök (Güvenli)", buff: "<span class='buff'>+XP</span>", debuff: "", action: (hero) => { gainXP(1); } }
    },
    {
        id: "stone_skin", type: "turn_based", title: "Taşlaşma Büyüsü", desc: "Eski bir parşömen.",
        option1: {
            text: "Büyüyü Oku",
            buff: "5 Tur: <span class='buff'>+10 Defans</span>",
            debuff: "5 Tur: <span class='debuff'>-%50 Hasar</span>",
            action: (hero) => {
                hero.statusEffects.push({ id: 'def_up', name: 'Taş Deri', turns: 5, value: 10, waitForCombat: true });
                hero.statusEffects.push({ id: 'atk_half', name: 'Hantal', turns: 5, waitForCombat: true }); 
            }
        },
        option2: { 
            text: "Parşömeni Yak", 
            buff: "<span class='buff'>+5 Rage</span>", 
            action: (hero) => { 
                const stats = getHeroEffectiveStats();
                hero.rage = Math.min(stats.maxRage, hero.rage + 5); 
            } 
        }
    },
    {
        id: "cursed_gold", type: "node_based", title: "Yorgunluk Laneti", desc: "Lanetli olduğu belli olan bir altın yığını.",
        option1: { text: "Altınları Al", buff: "Anında: <span class='buff'>+2 XP</span>", debuff: "2 Oda: <span class='debuff'>%60 Hasar</span>", action: (hero) => { gainXP(2); hero.mapEffects.push({ id: 'map_atk_weak', name: 'Yorgunluk', nodesLeft: 2, value: 0.6 }); } },
        option2: { text: "Uzaklaş", action: (hero) => { } }
    },
    {
        id: "adrenaline", type: "node_based", title: "Adrenalin Meyvesi", desc: "Çok nadir bir meyve.",
        option1: { 
            text: "Meyveyi Ye", 
            buff: "2 Oda: <span class='buff'>+20 Max HP</span>", 
            debuff: "Etki Bitince: <span class='debuff'>-30 Can Kaybı</span>", 
            action: (hero) => {
                // Not: maxHp harita etkilerinde geçici artar, hero.hp'yi de artırıyoruz
                hero.hp += 20; 
                hero.mapEffects.push({ id: 'map_hp_boost', name: 'Adrenalin', nodesLeft: 2, val: 20 }); 
            } 
        },
        option2: { 
            text: "Sakla", 
            buff: "<span class='buff'>+10 HP</span>", 
            action: (hero) => {
                const stats = getHeroEffectiveStats();
                hero.hp = Math.min(stats.maxHp, hero.hp + 10); 
            } 
        }
    },
    {
        id: "blood_pact", type: "permanent", title: "Kan Anlaşması", desc: "Kadim bir varlık fısıldıyor.",
        option1: { text: "Anlaşmayı Kabul Et", buff: "Kalıcı: <span class='buff'>+5 STR</span>", debuff: "Anında: <span class='debuff'>Canın %50'si Gider</span>", action: (hero) => { hero.str += 5; hero.hp = Math.floor(hero.hp / 2); } },
        option2: { text: "Reddet", action: (hero) => {} }
    },
    {
        id: "gambler", type: "permanent", title: "Kumarbazın Ruhu", desc: "Önünde iki kadeh var.",
        option1: { 
            text: "Kırmızı Kadehi İç", 
            buff: "%50: <span class='buff'>Canı Fulle</span>", 
            debuff: "%50: <span class='debuff'>Canı 1'e İndir</span>", 
            action: (hero) => { 
                const stats = getHeroEffectiveStats(); // stats tanımlandı
                if (Math.random() > 0.5) { 
                    hero.hp = stats.maxHp; 
                    writeLog("Şanslısın! Canın fullendi."); 
                } 
                else { 
                    hero.hp = 1; 
                    writeLog("Zehir! Canın 1'e düştü."); 
                } 
            } 
        },
        option2: { text: "Masadan Kalk", action: (hero) => {} }
    },
    {
        id: "random_campfire", 
        type: "neutral", 
        title: "Sönmüş Ateş", 
        desc: "Yol kenarında korları hala sıcak olan bir kamp alanı buldun. Ne yapacaksın?",
        option1: { 
            text: "Dinlen (+HP)", 
            buff: "<span class='buff'>+25 HP</span>", 
            action: (hero) => { 
                const stats = getHeroEffectiveStats();
                hero.hp = Math.min(stats.maxHp, hero.hp + 25); 
                writeLog(`🔥 Ateş başında dinlendin (+25 HP).`);
            } 
        },
        option2: { 
            text: "Antrenman Yap (+XP)", 
            buff: "<span class='buff'>+XP</span>", 
            action: (hero) => { 
                gainXP(3); 
                writeLog(`⚔️ Ateş ışığında gölge dövüşü yaptın (+3 XP).`);
            } 
        }
    }
];