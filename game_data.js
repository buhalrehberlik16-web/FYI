const MAX_LEVEL = 60;

const CLASS_CONFIG = {
    "Barbar": {
        startingStats: { str: 15, dex: 10, int: 5, vit: 10, mp_pow: 0 },
        // BAŞLANGIÇ DİRENÇLERİ (% olarak)
        startingResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
        // BAŞLANGIÇ ELEMENT HASARLARI (Flat/Sabit puan olarak)
        startingElementalDamage: { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
        
        atkStats: { "str": 0.5 },
        defStats: { "dex": 0.34 },
        blockStats: { "dex": 0.8 },
        vitMultiplier: 10,
        strDivisor: 2.0,
        dexDivisor: 3.0
    },
    "Magus": {
        startingStats: { str: 5, dex: 8, int: 10, vit: 8, mp_pow: 20 },
        startingResistances: { physical: 0, fire: 15, cold: 15, lightning: 15, curse: 5, poison: 0 },
        startingElementalDamage: { physical: 0, fire: 10, cold: 0, lightning: 0, curse: 0, poison: 0 },
        
        atkStats: { "int": 0.8 },
        defStats: { "dex": 0.2 },
        blockStats: { "int": 0.4 },
        vitMultiplier: 7,
        strDivisor: 5.0,
        dexDivisor: 4.0
    }
};

const LEVEL_SKILL_REWARDS = { 2: 2, 4: 4, 6: 4, 8: 6, 10: 8, 12: 10 };
const FULL_XP_REQUIREMENTS = Array.from({length: MAX_LEVEL + 1}, () => 5);

let hero = {
    name: "Barbar",
    playerName: "Oyuncu",
    class: "Barbar",
    level: 1, 
    xp: 0, 
    xpToNextLevel: 5,
    maxHp: 100, hp: 100,
    maxRage: 100, rage: 0,
    gold: 0,
    statPoints: 0, 
    skillPoints: 0,
    currentAct: 1,
    str: 15, dex: 10, int: 5, vit: 10, mp_pow: 0,
    baseAttack: 10, baseDefense: 1,
    baseResistances: { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
    elementalDamage: { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 },
    statusEffects: [],
    mapEffects: [],
    unlockedSkills: [],
    equippedSkills: [null, null, null, null, null, null],
    inventory: new Array(8).fill(null), 
    brooches: new Array(6).fill(null), 
    equipment: { earring1: null, earring2: null, necklace: null, belt: null, ring1: null, ring2: null }
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
        option2: { text: "Dök (Güvenli)", buff: "<span class='buff'>+10 XP</span>", debuff: "", action: (hero) => { gainXP(10); } }
    },
    {
        id: "stone_skin", type: "turn_based", title: "Taşlaşma Büyüsü", desc: "Eski bir parşömen.",
        option1: {
            text: "Büyüyü Oku",
            buff: "5 Tur: <span class='buff'>+10 Defans</span>",
            debuff: "5 Tur: <span class='debuff'>Yarı Hasar</span>",
            action: (hero) => {
                hero.statusEffects.push({ id: 'def_up', name: 'Taş Deri', turns: 5, value: 10, waitForCombat: true });
                hero.statusEffects.push({ id: 'atk_half', name: 'Hantal', turns: 5, waitForCombat: true }); 
            }
        },
        option2: { text: "Parşömeni Yak", buff: "<span class='buff'>+5 Rage</span>", debuff: "", action: (hero) => { hero.rage = Math.min(hero.maxRage, hero.rage + 5); } }
    },
    {
        id: "cursed_gold", type: "node_based", title: "Yorgunluk Laneti", desc: "Lanetli olduğu belli olan bir altın yığını.",
        option1: { text: "Altınları Al", buff: "Anında: <span class='buff'>+4 XP</span>", debuff: "2 Oda: <span class='debuff'>%60 Hasar</span>", action: (hero) => { gainXP(150); hero.mapEffects.push({ id: 'map_atk_weak', name: 'Yorgunluk', nodesLeft: 2, value: 0.6 }); } },
        option2: { text: "Uzaklaş", buff: "", debuff: "", action: (hero) => { } }
    },
    {
        id: "adrenaline", type: "node_based", title: "Adrenalin Meyvesi", desc: "Çok nadir bir meyve.",
        option1: { text: "Meyveyi Ye", buff: "2 Oda: <span class='buff'>+20 Max HP</span>", debuff: "Etki Bitince: <span class='debuff'>-30 Can Kaybı</span>", action: (hero) => { hero.maxHp += 20; hero.hp += 20; hero.mapEffects.push({ id: 'map_hp_boost', name: 'Adrenalin', nodesLeft: 2, val: 20 }); } },
        option2: { text: "Sakla", buff: "<span class='buff'>+10 HP</span>", debuff: "", action: (hero) => { hero.hp = Math.min(hero.maxHp, hero.hp + 10); } }
    },
    {
        id: "blood_pact", type: "permanent", title: "Kan Anlaşması", desc: "Kadim bir varlık fısıldıyor.",
        option1: { text: "Anlaşmayı Kabul Et", buff: "Kalıcı: <span class='buff'>+5 STR</span>", debuff: "Anında: <span class='debuff'>Canın %50'si Gider</span>", action: (hero) => { hero.str += 5; hero.hp = Math.floor(hero.hp / 2); } },
        option2: { text: "Reddet", buff: "", debuff: "", action: (hero) => {} }
    },
    {
        id: "gambler", type: "permanent", title: "Kumarbazın Ruhu", desc: "Önünde iki kadeh var.",
        option1: { 
            text: "Kırmızı Kadehi İç", 
            buff: "%50: <span class='buff'>Canı Fulle</span>", 
            debuff: "%50: <span class='debuff'>Canı 1'e İndir</span>", 
            action: (hero) => { 
                if (Math.random() > 0.5) { hero.hp = hero.maxHp; writeLog("Şanslısın! Canın fullendi."); } 
                else { hero.hp = 1; writeLog("Zehir! Canın 1'e düştü."); } 
            } 
        },
        option2: { text: "Masadan Kalk", buff: "", debuff: "", action: (hero) => {} }
    },
    {
        id: "random_campfire", 
        type: "neutral", 
        title: "Sönmüş Ateş", 
        desc: "Yol kenarında korları hala sıcak olan bir kamp alanı buldun. Ne yapacaksın?",
        option1: { 
            text: "Dinlen (+HP)", 
            buff: "<span class='buff'>+25 HP</span>", 
            debuff: "", 
            action: (hero) => { 
                const heal = 25;
                hero.hp = Math.min(hero.maxHp, hero.hp + heal); 
                writeLog(`🔥 Ateş başında dinlendin (+${heal} HP).`);
            } 
        },
        option2: { 
            text: "Antrenman Yap (+XP)", 
            buff: "<span class='buff'>+60 XP</span>", 
            debuff: "", 
            action: (hero) => { 
                const xp = 3;
                gainXP(xp); 
                writeLog(`⚔️ Ateş ışığında gölge dövüşü yaptın (+${xp} XP).`);
            } 
        }
    }
];