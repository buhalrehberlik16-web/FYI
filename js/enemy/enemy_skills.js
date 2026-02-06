// js/enemy/enemy_skills.js

window.ENEMY_SKILLS_DATABASE = {
    // YARDIMCI: Çeviri verisine hızlı erişim
    getLang: () => window.LANGUAGES[window.gameSettings.lang || 'tr'],

    // --- TIER 1 ---
    
    // --- MANTAR ---
    "spore_poison": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.spore_poison;
            // Zehir hasarı sabit 5, dirençler SkillEngine içinde hesaplandığı için burası direkt etki ekler
            applyStatusEffect({ id: 'poison', name: 'Zehir', turns: 3, value: 5, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`🍄 **${monster.name}**: ${skillLang.name} (3 Tur Zehir)`);
        }
    },
    "fungal_regrow": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.fungal_regrow;
            // %20 can yenileme (Math.floor ile tam sayıya yuvarlandı)
            const heal = Math.floor(monster.maxHp * 0.2);
            monster.hp = Math.min(monster.maxHp, monster.hp + heal);
            showFloatingText(document.getElementById('monster-display'), heal, 'heal');
            writeLog(`💚 **${monster.name}**: ${skillLang.name} (+${heal} HP)`);
        }
    },

    // --- ORMAN ÖRÜMCEĞİ ---
    "web_trap": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.web_trap;
            // Artik Stun degil, 2 tur boyunca %30 ATK ve %30 DEF azaltma (Debuff)
            applyStatusEffect({ 
                id: 'debuff_webbed', 
                name: skillLang.effect, 
                turns: 2, 
                value: 0.30, 
                resetOnCombatEnd: true 
            });
            writeLog(`🕸️ **${monster.name}**: ${skillLang.name} (Saldırı ve Savunman %30 azaldı!)`);
        }
    },
    "chitin_harden": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.chitin_harden;
            // Sabit defans artışı
            monster.defense += 8;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🛡️ **${monster.name}**: ${skillLang.name} (+8 Defans)`);
        }
    },

    // --- HIRSIZ KOBOLD ---
    "pocket_sand": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.pocket_sand;
            // Atak yarıya düşer
            applyStatusEffect({ id: 'atk_half', name: 'Blind', turns: 2, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`⏳ **${monster.name}**: ${skillLang.name}! Hasarın azaldı.`);
        }
    },
    "cowardly_dash": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.cowardly_dash;
            // Savunma moduna geçer ve geçici bonus alır
            window.isMonsterDefending = true;
            window.monsterDefenseBonus = 15;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🏃 **${monster.name}**: ${skillLang.name}! (+15 Defans)`);
        }
    },

    // --- KAN YARASASI ---
    "vampiric_bite": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.vampiric_bite;
            
            // dmgPack (SkillEngine'den gelen paket) kullanılarak can çalma hesaplanır
            if (dmgPack) {
                const heal = Math.floor(dmgPack.total * 0.5); // Vurulan toplam hasarın yarısı kadar iyileş
                monster.hp = Math.min(monster.maxHp, monster.hp + heal);
                showFloatingText(document.getElementById('monster-display'), heal, 'heal');
                writeLog(`🦇 **${monster.name}**: ${skillLang.name} (${heal} Can Çaldı)`);
            }
        }
    },
    "bat_shriek": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.bat_shriek;
            const amount = 20;
            // Öfke çalma
            hero.rage = Math.max(0, hero.rage - amount);
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`🦇 **${monster.name}**: ${skillLang.name} (-20 Öfke)`);
        }
    },

    // --- İSKELET ---
    "bone_shatter": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.bone_shatter;
            // Savunmayı 0'a indirir
            applyStatusEffect({ id: 'defense_zero', name: 'Broken', turns: 2, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`💀 **${monster.name}**: ${skillLang.name}! (2 Tur Defans 0)`);
        }
    },
    "undead_fortitude": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.undead_fortitude;
            window.isMonsterDefending = true;
            window.monsterDefenseBonus = 20;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🛡️ **${monster.name}**: ${skillLang.name} (+20 Defans)`);
        }
    },

    // --- TIER 2 ---

    // --- GOBLIN DEVRİYESİ ---
    "goblin_yell": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.goblin_yell;
            // Kalıcı atak artışı
            monster.attack += 10;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`📢 **${monster.name}**: ${skillLang.name} (+10 Atak)`);
        }
    },
    "shield_wall": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.shield_wall;
            window.isMonsterDefending = true;
            window.monsterDefenseBonus = 25;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🛡️ **${monster.name}**: ${skillLang.name} (+25 Defans)`);
        }
    },

    // --- KAÇAK HAYDUT ---
    "dirty_strike": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.dirty_strike;
            // Hasar processMonsterDamage tarafından uygulanır, burada sadece loglama yapılır
            if (dmgPack) {
                writeLog(`🔪 **${monster.name}**: ${skillLang.name} (${dmgPack.total} Ağır Hasar!)`);
            }
        }
    },
    "smoke_bomb": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.smoke_bomb;
            applyStatusEffect({ id: 'atk_half', name: 'Blind', turns: 2, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`☁️ **${monster.name}**: ${skillLang.name}`);
        }
    },

    // --- GRİ KURT ---
    "vicious_bite": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.vicious_bite;
            const amount = 30;
            hero.rage = Math.max(0, hero.rage - amount);
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`⚠️ **${monster.name}**: ${skillLang.name} (-30 Öfke)`);
        }
    },
    "alpha_howl": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.alpha_howl;
            monster.attack += 12;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🐺 **${monster.name}**: ${skillLang.name} (+12 Atak)`);
        }
    },

    // --- TIER 3 ---

    // --- YABAN DOMUZU ---
    "trample": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.trample;
            // 1 tur boyunca heronun defansını zayıflatır
            applyStatusEffect({ id: 'debuff_enemy_def', name: 'Sarsıldı', turns: 1, value: 0.5, resetOnCombatEnd: true });
            writeLog(`🐗 **${monster.name}**: ${skillLang.name} (${dmgPack ? dmgPack.total : 0} Hasar + Defansın düştü!)`);
        }
    },
    "thick_hide": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.thick_hide;
            monster.defense += 15;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🐗 **${monster.name}**: ${skillLang.name} (+15 Defans)`);
        }
    },

    // --- GOBLIN SAVAŞÇISI ---
    "mace_bash": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.mace_bash;
            // Hasar verir ve sersemletir
            applyStatusEffect({ id: 'stun', name: 'Stun', turns: 1, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`🔨 **${monster.name}**: ${skillLang.name}`);
        }
    },
    "berserker_rage": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.berserker_rage;
            monster.attack += 20;
            monster.defense = Math.max(0, monster.defense - 10);
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🔥 **${monster.name}**: ${skillLang.name}! Atak arttı, Defans düştü.`);
        }
    },

    // --- İSKELET ŞÖVALYE ---
    "cursed_blade": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.cursed_blade;
            // Hasar ve Lanet (Gelecek hasarları artırır)
            applyStatusEffect({ id: 'curse_damage', name: 'Curse', turns: 3, value: 0.2, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`💀 **${monster.name}**: ${skillLang.name}`);
        }
    },
    "unholy_armor": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.unholy_armor;
            window.isMonsterDefending = true;
            window.monsterDefenseBonus = 35;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🛡️ **${monster.name}**: ${skillLang.name} (+35 Defans)`);
        }
    },

    // --- GULYABANİ ---
    "paralyzing_claws": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.paralyzing_claws;
            applyStatusEffect({ id: 'stun', name: 'Paralyzed', turns: 1, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`🧟 **${monster.name}**: ${skillLang.name}`);
        }
    },
    "cannibalize": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.cannibalize;
            const heal = 50;
            monster.hp = Math.min(monster.maxHp, monster.hp + heal);
            showFloatingText(document.getElementById('monster-display'), heal, 'heal');
            writeLog(`🧟 **${monster.name}**: ${skillLang.name} (+${heal} HP)`);
        }
    },

    // --- TIER 4 ---

    // --- KAYA GOLEMİ ---
    "ground_slam": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.ground_slam;
            applyStatusEffect({ id: 'stun', name: 'Stun', turns: 1, resetOnCombatEnd: true });
            showFloatingText(document.getElementById('hero-display'), skillLang.effect, 'damage');
            writeLog(`⛰️ **${monster.name}**: ${skillLang.name}`);
        }
    },
    "stone_form": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.stone_form;
            monster.defense += 25;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`⛰️ **${monster.name}**: ${skillLang.name} (+25 Defans)`);
        }
    },

    // --- ORC FEDAİSİ ---
    "crushing_blow": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.crushing_blow;
            // Crushing blow yüksek hasarını SkillEngine'in damageSplit çarpanından alacak
            writeLog(`🪓 **${monster.name}**: ${skillLang.name} (${dmgPack ? dmgPack.total : 0} Hasar!)`);
        }
    },
    "iron_will": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.iron_will;
            const heal = Math.floor(monster.maxHp * 0.15);
            monster.hp = Math.min(monster.maxHp, monster.hp + heal);
            monster.attack += 10;
            showFloatingText(document.getElementById('monster-display'), heal, 'heal');
            writeLog(`💪 **${monster.name}**: ${skillLang.name} (+${heal} HP ve +10 Atak)`);
        }
    },

    // --- KEMİK GOLEMİ ---
    "marrow_drain": {
        execute: (monster, hero, dmgPack) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.marrow_drain;
            if (dmgPack) {
                const heal = Math.floor(dmgPack.total * 0.7); // Vurduğunun %70'ini iyileşir
                monster.hp = Math.min(monster.maxHp, monster.hp + heal);
                showFloatingText(document.getElementById('monster-display'), heal, 'heal');
                writeLog(`💀 **${monster.name}**: ${skillLang.name} (${heal} İlik Sömürdü)`);
            }
        }
    },
    "bone_rebuild": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.bone_rebuild;
            const heal = 80;
            monster.hp = Math.min(monster.maxHp, monster.hp + heal);
            showFloatingText(document.getElementById('monster-display'), heal, 'heal');
            writeLog(`🦴 **${monster.name}**: ${skillLang.name} (+80 HP)`);
        }
    },

    // --- GOBLIN ŞEFİ (BOSS) ---
    "chief_command": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.chief_command;
            monster.attack += 25;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🚩 **${monster.name}**: ${skillLang.name}! Atak muazzam arttı.`);
        }
    },
    "last_stand": {
        execute: (monster, hero) => {
            const lang = ENEMY_SKILLS_DATABASE.getLang();
            const skillLang = lang.enemy_skills.last_stand;
            // Boss savunma moduna girer
            window.isMonsterDefending = true;
            window.monsterDefenseBonus = 60;
            showFloatingText(document.getElementById('monster-display'), skillLang.effect, 'heal');
            writeLog(`🛡️ **${monster.name}**: ${skillLang.name} (+60 Defans)`);
        }
    }
};