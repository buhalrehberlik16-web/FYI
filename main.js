// main.js - FİNAL VE HATASIZ SÜRÜM

window.openCodex = function() {
    document.getElementById('codex-modal').classList.remove('hidden');
    window.switchCodexTab('world'); // İlk sayfayı aç
};

window.switchCodexTab = function(tabId) {
    const lang = window.getCombatLang();
    const contentArea = document.getElementById('codex-content-area');
    const c = lang.codex;

    let html = "";

    if (tabId === 'world') {
        // Renkler + Oda Olayları + Hasar Mekaniği
        html = `<h3><i class="fas fa-swords" style="margin-right:10px;"></i>${c.combat_colors_title}</h3>
                <p>${c.combat_colors_desc}</p>
                <h3><i class="fas fa-cloud-bolt" style="margin-right:10px;"></i>${c.room_events_title}</h3>
                <p>${c.room_events_desc}</p>
                <h3><i class="fas fa-calculator" style="margin-right:10px;"></i>${c.damage_system_title}</h3>
                <p>${c.damage_system_desc}</p>
                <h3><i class="fas fa-question-circle" style="margin-right:10px;"></i>${c.events_title}</h3>
                <p>${c.events_desc}</p>`;
    } 
    else if (tabId === 'hero') {
        // Stat Dağılımları (Barbar ve Magus)
        html = `<h3><i class="fas fa-chart-line" style="margin-right:10px;"></i>${c.stats_title}</h3>
                <p>${c.stats_barbarian}</p>
                <p>${c.stats_magus}</p>`;
    } else if (tabId === 'craft') {
        html = `<h3><i class="fas fa-hammer" style="margin-right:10px;"></i>${c.salvage_reforge_title}</h3>
                <p>${c.salvage_reforge_desc}</p>
                <h3><i class="fas fa-magic" style="margin-right:10px;"></i>${c.transmute_synth_title}</h3>
                <p>${c.transmute_synth_desc}</p>`;
    } else if (tabId === 'gear') {
        html = `<h3><i class="fas fa-gem" style="margin-right:10px;"></i>${c.brooch_title}</h3>
                <p>${c.brooch_desc}</p>
                <h3><i class="fas fa-scroll" style="margin-right:10px;"></i>${c.charms_title}</h3>
                <p>${c.charms_desc}</p>
                <h3><i class="fas fa-shield-alt" style="margin-right:10px;"></i>${c.defense_rule_title}</h3>
                <p>${c.defense_rule_desc}</p>`;
    } else if (tabId === 'town') {
        html = `<h3><i class="fas fa-crown" style="margin-right:10px;"></i>${c.master_system_title}</h3>
                <p>${c.master_system_desc}</p>
                <h3><i class="fas fa-bed" style="margin-right:10px;"></i>${c.inn_title}</h3>
                <p>${c.inn_desc}</p>
                <h3><i class="fas fa-horse" style="margin-right:10px;"></i>${c.stables_title}</h3>
                <p>${c.stables_desc}</p>
                <h3><i class="fas fa-coins" style="margin-right:10px;"></i>${c.merchant_title}</h3>
                <p>${c.merchant_desc}</p>`;
    }

    contentArea.innerHTML = html;

    // Tab aktiflik görselini güncelle (Zaten vardı ama garanti olsun)
    document.querySelectorAll('.codex-tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabId);
    });
};

window.starterCityProgress = {
    classChosen: false,
    skillsChosen: false
};

window.openStarterActivity = function(type) {
    // Mevcut dili al
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    if (type === 'barracks') {
        switchScreen(window.classSelectionScreen);
    } else if (type === 'elder') {
        if (!window.starterCityProgress.classChosen) {
            // Hardcoded alert yerine dilden çekiyoruz
            window.showAlert(lang.choose_class_first, lang.warning_title);
            return;
        }
        openBasicSkillSelection(); 
    }
};

window.updateStarterCityUI = function() {
    const barracksLabel = document.querySelector('#building-barracks .town-label-text');
    const elderLabel = document.querySelector('#building-elder .town-label-text');
    const msgEl = document.getElementById('starter-city-msg');
    
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    // 1. KIŞLA (Class Seçimi) Kontrolü
    if (window.starterCityProgress.classChosen) {
        barracksLabel.classList.remove('task-incomplete');
        barracksLabel.classList.add('task-complete');
    } else {
        barracksLabel.classList.add('task-incomplete');
		barracksLabel.classList.remove('task-complete');
    }

    // 2. BİLGE (Skill Seçimi) Kontrolü
    if (window.starterCityProgress.skillsChosen) {
        elderLabel.classList.remove('task-incomplete');
        elderLabel.classList.add('task-complete');
    } else {
        elderLabel.classList.remove('task-complete');
        elderLabel.classList.add('task-incomplete');
    }

    // 3. Alt Mesaj ve Yola Çıkış Durumu (Önceki adımda yaptığımız mantık)
    if (!window.starterCityProgress.classChosen) {
        msgEl.textContent = lang.starter_step_1;
        msgEl.classList.remove('ready-to-leave');
    } else if (!window.starterCityProgress.skillsChosen) {
        msgEl.textContent = lang.starter_step_2;
        msgEl.classList.remove('ready-to-leave');
    } else {
        msgEl.textContent = lang.starter_ready;
        msgEl.classList.add('ready-to-leave');
    }
};

// Yeni Tıklama Fonksiyonu (Failsafe için)
window.handleStarterTextClick = function() {
    // Sadece her iki seçim de yapıldıysa haritaya gönder
    if (window.starterCityProgress.classChosen && window.starterCityProgress.skillsChosen) {
        leaveStarterCity();
    }
};

window.leaveStarterCity = function() {
    writeLog("Maceran başlıyor...");
    if (typeof generateMap === 'function') {
        generateMap(); 
    }
	if (window.saveGame) {
        window.saveGame(); 
    }
    switchScreen(window.mapScreen);
};

function levelUp() {
    if (hero.level >= MAX_LEVEL) return; 
	
	const stats = getHeroEffectiveStats(); // Yeni Max HP'yi al
    const healAmount = Math.ceil(stats.maxHp * 0.50); // %50 iyileşme (yukarı yuvarla)
    
    hero.level++;
    hero.hp = Math.min(stats.maxHp, hero.hp + healAmount);
    hero.attack += 1; 
    hero.maxRage += 0;
    
    hero.statPoints += 4; // Stat puanı sabit 3 kalsın (veya değiştirebilirsin)
    
    // --- YENİ SKILL PUANI MANTIĞI ---
    let spGain = 0;
    if (hero.level > 20) {
        // 20. seviyeden sonra her level 1 puan
        spGain = 1;
    } else {
        // 20. seviyeye kadar tablodaki değerler (yoksa 0)
        spGain = LEVEL_SKILL_REWARDS[hero.level] || 0;
    }
    
    hero.skillPoints += spGain;
    // --------------------------------
    
    hero.xp = hero.xp - 10; // Gereken XP artık sabit 10
    hero.xpToNextLevel = 10;
	
	 // --- YENİ: LEVEL UP ZIPLAMA EFEKTİ ---
    if (window.gameSettings.levelJump) {
        const markerContainer = document.getElementById('player-marker-container');
        if (markerContainer) {
            // Önce varsa eski sınıfı sil, sonra animasyonu tetikle (Reflow)
            markerContainer.classList.remove('marker-jump-active');
            void markerContainer.offsetWidth; 
            markerContainer.classList.add('marker-jump-active');
            
            // Animasyon bitince temizle (1.5 saniye sonra)
            setTimeout(() => {
                markerContainer.classList.remove('marker-jump-active');
            }, 2500);
        }
    }
    // -------------------------------------
    
    writeLog(`⬆️ **SEVİYE ATLADIN!** (Lv. ${hero.level}) - Kazanılan SP: ${spGain} - %50 Can Yenilendi (+${healAmount} HP)`);
    updateStats(); 
    triggerLevelUpEffect();
}

function increaseStat(statName) {
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    if (isInBattle) { writeLog("❌ Savaş sırasında stat puanı dağıtamazsın!"); return; }

     if (hero.statPoints > 0) {
        window.syncHpWithRatio(() => {
            hero.statPoints--;
            if (statName === 'str') hero.str++;
            else if (statName === 'dex') hero.dex++;
            else if (statName === 'int') hero.int++;
            else if (statName === 'mp_pow') hero.mp_pow++;
            else if (statName === 'vit') hero.vit++;
			const stats = getHeroEffectiveStats();
            if (hero.hp > stats.maxHp) hero.hp = stats.maxHp;
        });
        }
        updateStats(); // Bu fonksiyon barları ve renkleri yeni statlara göre tazeler   
}

// 1. ASIL ÖĞRENME İŞLEMİ (Bu fonksiyon sadece her şey onaylandığında çalışır)
function executeLearnSkill(skillKey) {
    const skill = SKILL_DATABASE[skillKey];
    const cost = skill.data.pointCost !== undefined ? skill.data.pointCost : (skill.data.tier || 1);

    hero.skillPoints -= cost;
    hero.unlockedSkills.push(skillKey);
    
    // Pasif kontrolü
    if (skill.data.type === 'passive' && typeof skill.data.onAcquire === 'function') {
        skill.data.onAcquire();
    } else {
        // Otomatik kuşanma
        const emptySlotIndex = hero.equippedSkills.indexOf(null);
        if (emptySlotIndex !== -1) {
            hero.equippedSkills[emptySlotIndex] = skillKey;
        }
    }

    // UI Güncellemeleri
    if (typeof renderSkillBookList === 'function') renderSkillBookList();
    if (typeof renderEquippedSlotsInBook === 'function') renderEquippedSlotsInBook();
    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
    updateStats();
    
    // Log yazma
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const skillName = lang.skills[skillKey]?.name || skill.data.name;
    writeLog(`📖 ${lang.log_skill_learned} **${skillName}**`);
}

// 2. TETİKLEYİCİ FONKSİYON (Kontrolcü)
function learnSkill(skillKey) {
    const isInBattle = document.getElementById('battle-screen').classList.contains('active');
    if (isInBattle) { writeLog("❌ Savaş sırasında yetenek öğrenemezsin!"); return; }

    const skill = SKILL_DATABASE[skillKey];
    if (!skill) return;

    // Önce bu kategoride/tier'da bir şey açılmış mı kontrolü
    const isTierAlreadyTaken = hero.unlockedSkills.some(unlockedKey => {
        const s = SKILL_DATABASE[unlockedKey];
        return s.data.category === skill.data.category && s.data.tier === skill.data.tier;
    });

    if (isTierAlreadyTaken) return; // Zaten açılmışsa bir şey yapma

    const cost = skill.data.pointCost !== undefined ? skill.data.pointCost : (skill.data.tier || 1);
    if (hero.skillPoints < cost) {
		window.showConfirm(lang.skill_notenough_confirm_msg,);
        writeLog("❌ Yetersiz Skill Puanı!");
        return;
    }

    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    // --- KRİTİK ONAY SİSTEMİ ---
    if (!hero.hasSeenSkillWarning) {
        // Eğer oyuncu uyarısı daha önce görmediyse: ONAY PENCERESİ AÇ
        window.showConfirm(lang.skill_lock_confirm_msg, () => {
            hero.hasSeenSkillWarning = true; // Bayrağı işaretle
            executeLearnSkill(skillKey);    // İşlemi tamamla
        }, () => {
            // "Hayır" derse hiçbir şey yapma
        });
    } else {
        // Daha önce gördüyse: HİÇ SORMA, DİREKT ÖĞREN
        executeLearnSkill(skillKey);
    }
}

// AĞAÇ KONTROLÜ
function checkSkillTreeRequirement(category, tier) {
    if (tier === 1) return true;
    const requiredTier = tier - 1;
    return hero.unlockedSkills.some(unlockedKey => {
        const dbSkill = SKILL_DATABASE[unlockedKey];
        if (!dbSkill) return false;
        return dbSkill.data.category === category && dbSkill.data.tier === requiredTier;
    });
}

function gainXP(amount) {
    if (hero.level >= MAX_LEVEL) return;
    hero.xp += amount;
    writeLog(`🌟 ${amount} XP kazanıldı.`);
    while (hero.xp >= hero.xpToNextLevel) {
        levelUp();
        if (hero.level >= MAX_LEVEL) break; 
    }
    updateStats(); 
}

function triggerLevelUpEffect() {
    const container = document.getElementById('hero-display');
    if (!container) return;
    const halo = document.createElement('div');
    halo.className = 'levelup-halo';
    container.appendChild(halo);
    if (typeof showFloatingText === 'function') {
        setTimeout(() => {
            showFloatingText(container, "LEVEL UP!", "heal"); 
        }, 200);
    }
    setTimeout(() => { halo.remove(); }, 2000);
}

// 2. Sınıf Seçme Fonksiyonu:
function selectClass(className) {
    const config = CLASS_CONFIG[className];
    if (!config) return;
	
	// --- YENİ: SINIF DEĞİŞTİRME KONTROLÜ VE SIFIRLAMA ---
    // Eğer oyuncu zaten bir sınıf seçmişse ve şimdi değiştiriyorsa:
    if (window.starterCityProgress.classChosen) {
        
        // 1. Yetenekleri Sıfırla: Sadece 'rest' (Dinlen) yeteneği kalsın, diğerlerini sil.
        // SEBEP: Eski sınıfın başlangıç yeteneklerinin yeni sınıfa taşınmasını engellemek.
        hero.unlockedSkills = ['rest']; 

        // 2. Skill Barı Temizle: İlk iki slotu (A ve D) boşalt, rest'i 3. slotta koru.
        hero.equippedSkills = [null, null, 'rest', null, null, null];

        // 3. İlerleme Bayrağını Sıfırla: Bilge lambasını tekrar kırmızıya çevir.
        // SEBEP: Oyuncuyu yeni sınıfına uygun yetenekleri seçmesi için Bilge'ye gitmeye zorlamak.
        window.starterCityProgress.skillsChosen = false;
        
        writeLog("Sistem: Sınıf değiştiği için eski yeteneklerin sıfırlandı.");
    }
    // ---------------------------------------------------

    hero.class = className;
    StatsManager.initNewRun(hero.playerName, className);

    // 1. Temel Statları Kopyala (str, dex, int, vit, mp_pow)
    for (const [stat, value] of Object.entries(config.startingStats)) {
        hero[stat] = value;
    }
	
	// --- YENİ: TEMEL ATAK VE DEFANS DEĞERLERİNİ KOPYALA ---
    hero.baseAttack = config.baseAttack || 0;
    hero.baseDefense = config.baseDefense || 0;
    // ----------------------------------------------------

    // 2. Dirençleri ve Element Hasarlarını Kopyala
    hero.baseResistances = { ...config.startingResistances };
    hero.elementalDamage = { ...config.startingElementalDamage };

    // 3. CAN VE KAYNAK (MANA/RAGE) HESAPLAMASI
    // getHeroEffectiveStats() yeni kopyaladığımız statlara (int, vit vb.) bakar
    const effective = getHeroEffectiveStats();
    
    hero.hp = effective.maxHp; // Sınıfın vit değerine göre canı fulle
    
    // Kaynak Başlangıç Kuralı: 
    // Barbar 0 Öfke ile başlar, Magus Full Mana ile başlar.
    if (config.resourceName === "mana") {
		hero.rage = 0;
        //hero.rage = effective.maxRage; 
    } else {
        hero.rage = 0;
    }

    writeLog(`${className} seçildi. Yolun açık olsun!`);
    
    // UI'ı hemen güncelle
    updateStats(); 
    
    // Starter City ilerlemesini işaretle
    window.starterCityProgress.classChosen = true;
    switchScreen(window.starterCityScreen); 
    updateStarterCityUI();
}


function startCutscene() {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    switchScreen(cutsceneScreen);
    cutsceneText.textContent = lang.descending_dungeons;
    
    let timer1 = null; let timer2 = null;
    
    function transitionToCity() {
        if (timer1) clearTimeout(timer1); 
        if (timer2) clearTimeout(timer2);
        
        skipCutsceneButton.onclick = null;
        
        // Şehre geçiş yap (screen_manager'da artık listede olduğu için çalışacak)
        switchScreen(window.starterCityScreen);
        if(window.updateStarterCityUI) window.updateStarterCityUI(); 
        writeLog("Başlangıç şehrine ulaşıldı."); 
    }
    
    skipCutsceneButton.onclick = transitionToCity;
    
    timer1 = setTimeout(() => {
        cutsceneText.textContent = lang.map_loading;
        timer2 = setTimeout(() => { transitionToCity(); }, 1500);
    }, 2000);
}


window.addItemToInventory = function(item, amount = 1) {
    // 1. Stackable kontrolü
    if (item.isStack) {
        // Çantada aynı isimde/ID'de başka bir stack var mı?
        const existingStack = hero.inventory.find(i => i && i.nameKey === item.nameKey);
        
        if (existingStack) {
            existingStack.count += amount;
            return true; // Mevcut stack'e eklendi
        }
    }

    // 2. Eğer stackable değilse veya mevcut stack yoksa, boş slot bul
    for (let i = 0; i < hero.inventory.length; i++) {
        if (hero.inventory[i] === null) {
            item.count = amount; // İlk miktar
            hero.inventory[i] = item;
            return true; // Boş slot bulundu
        }
    }

    return false; // Çanta dolu
};

// --- INIT GAME (TAM SIFIRLAMA) ---
function initGame() {
	
	hero.highestTierDefeated = 1;
	window.currentTab = 'common'; 
	window.starterCityProgress = {
        classChosen: false,
        skillsChosen: false
    };
	
	 // UI noktalarını kırmızıya döndürmek için (Görseli de güncelle)
    // Eğer o an Starter City ekranındaysak veya oraya gideceksek:
    const barracksDot = document.getElementById('status-barracks');
    const elderDot = document.getElementById('status-elder');
    const leaveBtn = document.getElementById('btn-leave-starter-city');
    
    if (barracksDot) barracksDot.style.background = "#ff4d4d";
    if (elderDot) elderDot.style.background = "#ff4d4d";
    if (leaveBtn) leaveBtn.classList.add('hidden');
	
	window.isMapNodeProcessing = false;
	
    hero.level = 1; hero.xp = 0; 
    hero.maxRage = 100; hero.rage = 0; hero.gold = 0; 
    hero.statPoints = 0; hero.skillPoints = 0;
	
	// --- YENİ: YORGUNLUK VE SAYAÇ SIFIRLAMA ---
    // SİLME YAPILMADI: Eksik olan sıfırlama komutları eklendi.
    hero.exhaustion = 0;     // Yorgunluk barını boşalt
    hero.autoRestCount = 0;  // Zorunlu dinlenme ceza sayacını sıfırla
    hero.skillUsage = {};    // Yetenek kullanım sayılarını temizle (Maliyetler normale dönsün)
	hero.mountedNodesLeft = 0;    // Kiralık atı sıfırla
    hero.scoutedNodesLeft = 0;    // Gözcü sayacını sıfırla
    hero.scoutStartStage = undefined; // Gözcü başlangıç noktasını sil
    hero.eventBonusGold = 0; 
    // ------------------------------------------
	window.currentBossScaling = 1.0;
	window.lastExhaustionThreshold = 0;
	
	if (typeof updateStarterCityUI === 'function') {
        updateStarterCityUI(); 
    }
	
    hero.unlockedSkills = []; 
    hero.equippedSkills = [null, null, null, null, null, null]; 
    hero.currentAct = 1;
	CalendarManager.init();
	
	const stats = window.getHeroEffectiveStats();
    hero.maxHp = stats.maxHp;
    hero.hp = stats.maxHp; 
    hero.maxRage = stats.maxRage;
    hero.rage = 0;

	hero.unlockedSkills = ['rest']; // <--- YENİ: Dinlen skilli her zaman açık başlar
	hero.equippedSkills[2] = 'rest'; // 3. slota (numara 1) yerleştirdik
    hero.baseResistances = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    hero.elementalDamage = { physical: 0, fire: 0, cold: 0, lightning: 0, curse: 0, poison: 0 };
    hero.statusEffects = []; hero.mapEffects = []; 
    hero.inventory = new Array(8).fill(null);
    hero.brooches = new Array(6).fill(null);
    hero.equipment = { earring1: null, earring2: null, necklace: null, belt: null, ring1: null, ring2: null };
    

    GAME_MAP.nodes = []; GAME_MAP.connections = []; GAME_MAP.currentNodeId = null; GAME_MAP.completedNodes = [];

    // 4. Görsel Temizlik
    const marker = document.getElementById('player-marker-container');
    if (marker) {
        marker.style.transition = 'none';
        marker.style.display = 'none'; 
        marker.style.left = '10px';    
        marker.style.top = '50%';      
    }
		
    isHeroDefending = false; monster = null; isHeroTurn = true; 

    
    // Basic Skill Görsellerini Yükle (UI Manager)
    if (typeof initializeSkillButtons === 'function') initializeSkillButtons();

    writeLog("--- Yeni Oyun Başlatıldı ---");
    updateStats();
    if(typeof updateGoldUI === 'function') updateGoldUI();
    if(typeof renderInventory === 'function') renderInventory();
}
window.openSettings = function() {
    document.getElementById('settings-modal').classList.remove('hidden');
};

window.closeSettings = function() {
    document.getElementById('settings-modal').classList.add('hidden');
};

// 1. İstatistik Butonu ve invItems Çeviri Mantığı
document.getElementById('btn-show-stats').onclick = () => {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const data = StatsManager.loadProfile();
    const content = document.getElementById('stats-content');
    
    if (!data) {
        content.innerHTML = `<p style='text-align:center;'>${lang.stats_empty}</p>`;
    } else {
        const duration = Math.floor((Date.now() - data.startTime) / 60000);
        const mostMetMonster = data.monsterEncounters ? StatsManager.getMostEncountered(data.monsterEncounters) : "-";
        const translatedMonster = lang.enemy_names[mostMetMonster] || mostMetMonster;

        
        const invItems = data.finalInventory.map(key => lang.items[key] || key).join(", ");

        content.innerHTML = `
            <p><strong>${lang.stats_hero}:</strong> ${data.playerName} (${data.className})</p>
            <p><strong>${lang.stats_nodes}:</strong> ${data.nodesPassed}</p>
            <p><strong>${lang.stats_damage_dealt}:</strong> ${data.totalDamageDealt}</p>
            <p><strong>${lang.stats_damage_taken}:</strong> ${data.totalDamageTaken}</p>
            <p><strong>${lang.stats_most_met}:</strong> ${translatedMonster}</p>
            <p><strong>${lang.stats_duration}:</strong> ${duration} ${lang.stats_minutes}</p>
            <p><strong>${lang.stats_inventory}:</strong> ${invItems || "-"}</p>
        `;
    }
    document.getElementById('modal-stats').classList.remove('hidden');
};

// İsim Ekranından Sınıf Seçimine Geçiş
document.getElementById('btn-confirm-name').onclick = () => {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    const input = document.getElementById('player-nick-input');
    const nick = input.value.trim();

    if (!nick) {
        window.showAlert(lang.name_required_msg); 
        return;
    }

    const profileKey = "RPG_Save_" + nick;
    const exists = localStorage.getItem(profileKey) !== null;

    const startNewProfileLogic = () => {
        let list = window.getProfileList(); 
        if (!list.includes(nick)) {
            list.push(nick);
            localStorage.setItem("RPG_Profile_List", JSON.stringify(list));
        }

        window.activeProfile = nick;
        localStorage.setItem("RPG_Active_Profile_Name", nick);

        window.starterCityProgress = { classChosen: false, skillsChosen: false };

        initGame(); 
        hero.playerName = nick; 
        
        // --- KRİTİK EKLENEN SATIR ---
        // Yeni profil yaratıldığı an ana menüdeki isim göstergesini güncelle.
        window.updateActiveProfileUI(); 
        // ----------------------------
        
        startCutscene();
    };

    if (exists) {
        window.showConfirm(lang.save_warning, () => {
            startNewProfileLogic();
        });
    } else {
        startNewProfileLogic();
    }
};

window.deleteProfile = function(pName) {
    const lang = window.getCombatLang();
    
    window.showConfirm(lang.profile_delete_confirm.replace("$1", pName), () => {
        // 1. Profili listeden çıkar
        let list = window.getProfileList();
        list = list.filter(p => p !== pName);
        localStorage.setItem("RPG_Profile_List", JSON.stringify(list));
        
        // 2. O profile ait save dosyasını sil
        localStorage.removeItem("RPG_Save_" + pName);

        // --- YENİ AKILLI GEÇİŞ MANTIĞI ---
        // Eğer sildiğimiz profil şu an seçili olan (aktif) profil ise:
        if (window.activeProfile === pName) {
            
            if (list.length > 0) {
                // DURUM A: Başka profiller var. Listenin ilk sırasındakine geç.
                const nextProfile = list[0];
                window.activeProfile = nextProfile;
                localStorage.setItem("RPG_Active_Profile_Name", nextProfile);
                
                // Yeni seçilen profilin verilerini arka plana yükle (Load)
                // SEBEP: 'Devam Et' butonunun yeni profile göre güncellenmesini sağlar.
                window.loadGame(nextProfile);
                
                writeLog(`🧹 **Sistem**: Aktif profil silindi. Otomatik olarak '${nextProfile}' profiline geçildi.`);
            } 
            else {
                // DURUM B: Hiç profil kalmadı. Her şeyi temizle.
                window.activeProfile = null;
                localStorage.removeItem("RPG_Active_Profile_Name");
                
                writeLog("🧹 **Sistem**: Tüm profiller silindi.");
            }
        }
        // ---------------------------------

        // 3. UI'ı ve Profiller Listesini Tazele
        window.updateActiveProfileUI(); // Ana menüdeki kutuyu ve 'Devam Et' butonunu günceller
        window.openProfileScreen();     // Modal içindeki listeyi yeniler
    });
};

// --- EVENT LISTENERS ---

// 1. Basic Slot 1 (A)
if (btnBasicAttack) {
    btnBasicAttack.addEventListener('click', () => {
        if (isHeroTurn && !btnBasicAttack.classList.contains('disabled')) {
            // Index 0'daki yeteneği kullan
            const key = hero.equippedSkills[0];
            if (key && typeof handleSkillUse === 'function') handleSkillUse(key);
        }
    });
}

// 2. Basic Slot 2 (D)
if (btnBasicDefend) {
    btnBasicDefend.addEventListener('click', () => {
        if (isHeroTurn && !btnBasicDefend.classList.contains('disabled')) {
            // Index 1'deki yeteneği kullan
            const key = hero.equippedSkills[1];
            if (key && typeof handleSkillUse === 'function') handleSkillUse(key);
        }
    });
}

// Klavye Kontrolleri
document.addEventListener('keydown', (e) => {
    if (startScreen.classList.contains('active') || cutsceneScreen.classList.contains('active')) {
        return; 
    }

    const key = e.key.toLowerCase();
	
	// CODEX
	if(e.key==='h') window.openCodex();
	
    // Savaş Kısayolları
    if (battleScreen.classList.contains('active') && isHeroTurn) {
        // A ve D (Tıklamayı simüle et)
        if (key === 'a') {
            if (btnBasicAttack && !btnBasicAttack.classList.contains('disabled')) btnBasicAttack.click();
        }
        if (key === 'd') {
            if (btnBasicDefend && !btnBasicDefend.classList.contains('disabled')) btnBasicDefend.click();
        }

        // --- YENİ DİNAMİK TUŞ KONTROLÜ ---
    // 1'den 9'a kadar olan tuşları kontrol et
    const skillSlots = document.querySelectorAll('#skill-bar-container .skill-slot');
    const numKey = parseInt(key);
    
    if (!isNaN(numKey) && numKey >= 1 && numKey <= 9) {
        // Eğer basılan rakama karşılık gelen bir slot varsa (Örn: 5 tuşu -> skillSlots[4])
        const targetIndex = numKey - 1;
        if (skillSlots[targetIndex]) {
            skillSlots[targetIndex].click();
        }
    }
    // --------------------------------
}

    // MENÜ KISAYOLLARI (Sadece izin varsa çalışacaklar)
    if (key === 'i' || key === 'ı') { 
        toggleInventory(); 
    }
    if (key === 'k') { 
        toggleSkillBook(); 
    }
    if (key === 'u') { 
        toggleStatScreen(); 
    }
});

returnToMenuButton.addEventListener('click', () => {
    initGame(); // Bu fonksiyon zaten GAME_MAP.currentNodeId'yi null yapıyor.
	// "Devam Et" butonu kontrolü: Kayıt silindiği için artık görünmemeli
    const continueBtn = document.getElementById('btn-continue');
    if (window.hasSaveGame && !window.hasSaveGame()) {
        if (continueBtn) continueBtn.classList.add('hidden');
    }
    switchScreen(startScreen);
});

window.showWarningWithToggle = function(msg, onYes, onNo) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    gModalTitle.textContent = lang.combat_warning_title;
    gModalText.textContent = msg;
    
    // Checkbox alanını göster
    const toggleContainer = document.getElementById('g-modal-toggle-container');
    toggleContainer.classList.remove('hidden');
    document.getElementById('g-modal-checkbox').checked = false;

    gModalActions.innerHTML = `
        <button id="g-modal-yes" class="npc-btn confirm-btn-yes" style="width:120px;">${lang.yes}</button>
        <button id="g-modal-no" class="npc-btn confirm-btn-no" style="width:120px;">${lang.no}</button>
    `;

    document.getElementById('g-modal-yes').onclick = () => { 
        toggleContainer.classList.add('hidden'); 
        closeGlobalModal(); 
        onYes(); 
    };
    document.getElementById('g-modal-no').onclick = () => { 
        toggleContainer.classList.add('hidden'); 
        closeGlobalModal(); 
        onNo(); 
    };
    
    globalModal.classList.remove('hidden');
};

// ALERT (Sadece Tamam butonu olan uyarılar)
window.showAlert = function(msg, title = null) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    gModalTitle.textContent = title || (window.gameSettings.lang === 'tr' ? "UYARI" : "WARNING");
    gModalText.innerHTML = msg;
    gModalActions.innerHTML = `<button class="npc-btn" onclick="closeGlobalModal()" style="width:120px;">${lang.back || 'TAMAM'}</button>`;
    globalModal.classList.remove('hidden');
};

// CONFIRM (Evet/Hayır seçeneği olan uyarılar)
window.showConfirm = function(msg, onYes, onNo = null) {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    gModalTitle.textContent = lang.confirm_title || (window.gameSettings.lang === 'tr' ? "ONAY" : "CONFIRM");
    gModalText.innerHTML = msg;
    
    gModalActions.innerHTML = `
        <button id="g-modal-yes" class="npc-btn confirm-btn-yes" style="width:120px;">${lang.yes || 'EVET'}</button>
        <button id="g-modal-no" class="npc-btn confirm-btn-no" style="width:120px;">${lang.no || 'HAYIR'}</button>
    `;

    document.getElementById('g-modal-yes').onclick = () => { closeGlobalModal(); onYes(); };
    document.getElementById('g-modal-no').onclick = () => { closeGlobalModal(); if(onNo) onNo(); };
    
    globalModal.classList.remove('hidden');
};

window.closeGlobalModal = function() {
    globalModal.classList.add('hidden');
};

window.currentCityDistrict = 0; // -1: Craft, 0: Main, 1: Legends

window.changeCityDistrict = function(direction) {
    window.currentCityDistrict += direction;
    
    // Sınırları kontrol et
    if (window.currentCityDistrict < -1) window.currentCityDistrict = -1;
    if (window.currentCityDistrict > 1) window.currentCityDistrict = 1;

    const lang = window.getCombatLang();
    const districts = {
        "-1": { id: "city-district-craft", title: lang.city_district_craft },
        "0": { id: "city-district-main", title: "ELDORIA" },
        "1": { id: "city-district-legends", title: lang.city_district_legends }
    };

    // Tüm ekranları gizle, seçileni aç
    document.querySelectorAll('.city-sub-screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(districts[window.currentCityDistrict].id).classList.remove('hidden');

    // Başlığı ve Okları Güncelle
    const mainTitle = document.getElementById('city-district-title');
    if (mainTitle) mainTitle.textContent = districts[window.currentCityDistrict].title;

    updateCityArrows();
};

function updateCityArrows() {
    const leftArrow = document.getElementById('btn-city-left');
    const rightArrow = document.getElementById('btn-city-right');
    const leftLabel = document.getElementById('city-label-left');
    const rightLabel = document.getElementById('city-label-right');
    const lang = window.getCombatLang();

    // Sol Ok Kontrolü
    if (window.currentCityDistrict === -1) {
        leftArrow.style.display = "none";
    } else {
        leftArrow.style.display = "flex";
        leftLabel.textContent = window.currentCityDistrict === 0 ? lang.city_district_craft : lang.city_district_main;
    }

    // Sağ Ok Kontrolü
    if (window.currentCityDistrict === 1) {
        rightArrow.style.display = "none";
    } else {
        rightArrow.style.display = "flex";
        rightLabel.textContent = window.currentCityDistrict === 0 ? lang.city_district_legends : lang.city_district_main;
    }
}

window.getProfileList = () => JSON.parse(localStorage.getItem("RPG_Profile_List") || "[]");

window.openProfileScreen = function() {
    const modal = document.getElementById('profile-modal');
    const container = document.getElementById('profile-list-container');
    const lang = window.getCombatLang();
    const profiles = window.getProfileList();

    // 1. Önce kutunun içini tamamen boşaltıyoruz
    container.innerHTML = '';

    // 3. ALT BÖLÜM: Mevcut Profillerin Listesi
    if (profiles.length === 0) {
        // Profil yoksa mesaj göster
        const emptyMsg = document.createElement('p');
        emptyMsg.style.cssText = "color:#666; padding:20px; font-style:italic;"; // Basit bir görsel ayar
        emptyMsg.textContent = lang.profile_empty_msg;
        container.appendChild(emptyMsg);
    } else {
        // Profiller varsa her biri için bir satır oluştur
        profiles.forEach(pName => {
            const row = document.createElement('div');
            row.className = 'profile-item'; // CSS: menu.css içinden yönetilir
            row.innerHTML = `
                <span class="profile-name">${pName}</span>
                <div class="profile-actions">
                    <button class="npc-btn" onclick="window.selectProfile('${pName}')">${lang.profile_select_btn}</button>
                    <button class="npc-btn confirm-btn-no" onclick="window.deleteProfile('${pName}')">${lang.profile_delete_btn}</button>
                </div>
            `;
            container.appendChild(row);
        });
    }

    // 4. Pencereyi görünür yap
    modal.classList.remove('hidden');
};
window.selectProfile = function(pName) {
    // 1. Önce aktif profili hafızaya ve tarayıcıya işle
    window.activeProfile = pName;
    localStorage.setItem("RPG_Active_Profile_Name", pName);

    // 2. Bu profile ait bir kayıt dosyası var mı kontrol et ve yükle
    // loadGame(pName) çağrıldığında save_manager.js içindeki yükleme motoru çalışır
    const hasData = window.loadGame(pName);

    if (hasData) {
        writeLog(`👤 **Profil**: ${pName} ve kayıtlı ilerlemesi yüklendi.`);
    } else {
        // Eğer bu isimde bir profil varsa ama henüz bir save dosyası oluşmadıysa
        // (Yani sadece isim yaratılmış ama maceraya hiç başlanmamışsa)
        writeLog(`👤 **Profil**: ${pName} seçildi (Kayıt dosyası bulunamadı).`);
    }

    // 3. UI'ı güncelle (İsim ana menüye yazılır, 'Devam Et' butonu duruma göre belirir)
    window.updateActiveProfileUI();
    
    // 4. Modalı kapat
    document.getElementById('profile-modal').classList.add('hidden');
};

// YENİ: Ana Menüdeki ismi güncelleyen fonksiyon
window.updateActiveProfileUI = function() {
    const infoBox = document.getElementById('active-profile-info');
    const nameSpan = document.getElementById('display-active-profile-name');
    const continueBtn = document.getElementById('btn-continue');
    
    const currentProfile = localStorage.getItem("RPG_Active_Profile_Name");

    if (currentProfile) {
        if (infoBox) infoBox.classList.remove('hidden');
        if (nameSpan) nameSpan.textContent = currentProfile;
        
        // --- GÜNCELLEME: KAYIT DOSYASININ İÇERİĞİNİ KONTROL ET ---
        const rawData = localStorage.getItem("RPG_Save_" + currentProfile);
        let hasPlayableSave = false;

        if (rawData) {
            const saveData = JSON.parse(rawData);
            // Sadece içinde harita (nodes) olan kayıtlar 'Oynanabilir' kabul edilir
            if (saveData.GAME_MAP && saveData.GAME_MAP.nodes && saveData.GAME_MAP.nodes.length > 0) {
                hasPlayableSave = true;
            }
        }

        // Eğer harita yoksa 'Devam Et' butonu görünmez
        if (continueBtn) continueBtn.classList.toggle('hidden', !hasPlayableSave);
        // --------------------------------------------------------
    } else {
        if (infoBox) infoBox.classList.add('hidden');
        if (continueBtn) continueBtn.classList.add('hidden');
    }
};


window.startNewProfileFlow = function() {
    document.getElementById('profile-modal').classList.add('hidden');
    switchScreen(window.nameEntryScreen); // İsim girişine gönder
};

document.addEventListener('touchstart', (e) => {
    // Eğer dokunulan yer bir item-slot değilse tooltip'i kapat
    if (!e.target.closest('.item-slot') && !e.target.closest('.reward-item')) {
        window.hideItemTooltip();
        window.lastTappedSlot = null; // window. prefix'i eklemek daha güvenlidir
    }
}, { passive: true });

document.addEventListener('DOMContentLoaded', () => {
	if(typeof applySettings === 'function') applySettings();
    // 1. Oyunu ve İlk Ekranı Başlat
    if (typeof initGame === 'function') initGame(); 
    if (typeof switchScreen === 'function') switchScreen(window.startScreen); 

    // 2. ANA MENÜ VE SEÇİM BUTONLARI
    if (window.startButton) {
    window.startButton.onclick = () => {
    const currentLang = window.getCombatLang();

    if (window.activeProfile) {
        // --- YENİ: KAYITLI OYUN KONTROLÜ ---
        const profileKey = "RPG_Save_" + window.activeProfile;
        const hasSave = localStorage.getItem(profileKey) !== null;

        const startFresh = () => {
            initGame(); 
            hero.playerName = window.activeProfile; 
            window.saveGame(); // Mevcut save'in üzerine temiz dosya yazar
            startCutscene();
            writeLog(currentLang.combat.log_battle_start.replace("$1", window.activeProfile));
        };

        if (hasSave) {
            // Eğer kayıt varsa 'Emin misin?' diye sor
            window.showConfirm(currentLang.confirm_new_game, startFresh);
        } else {
            // Kayıt yoksa direkt başla
            startFresh();
        }
    } 
    else {
        // Profil yoksa isim ekranına gönder (Eski mantık)
        const nickInput = document.getElementById('player-nick-input');
        if (nickInput) nickInput.value = ""; 
        switchScreen(window.nameEntryScreen);
        setTimeout(() => { if (nickInput) nickInput.focus(); }, 150);
    }
};
}

    if (window.btnConfirmBasicSkills) {
        window.btnConfirmBasicSkills.onclick = () => {
            if (typeof window.confirmBasicSkills === 'function') {
                window.confirmBasicSkills();
            }
        };
    }

    if (window.returnToMenuButton) {
        window.returnToMenuButton.onclick = () => {
            if (typeof initGame === 'function') initGame();
            switchScreen(window.startScreen);
        };
    }

    // 3. ÜST NAVİGASYON BAR BUTONLARI (U, I, K)
    if (window.btnOpenSkills) {
        window.btnOpenSkills.onclick = () => toggleSkillBook();
    }
    if (window.btnOpenStats) {
        window.btnOpenStats.onclick = () => toggleStatScreen();
    }
    if (window.btnOpenInventoryNav) {
        window.btnOpenInventoryNav.onclick = () => toggleInventory();
    } else if (window.btnOpenInventory) {
        window.btnOpenInventory.onclick = () => toggleInventory();
    }

    // 4. PUAN BİLDİRİMLERİ (STAT + / SKILL +)
    if (window.statNotif) {
        window.statNotif.onclick = () => toggleStatScreen();
    }
    if (window.skillNotif) {
        window.skillNotif.onclick = () => toggleSkillBook();
    }

    // 5. YETENEK KİTABI TABLARI (Gelişmiş Bağlama)
    const tabList = ['common', 'brutal', 'chaos', 'fervor'];
    tabList.forEach(tabId => {
        const tabEl = document.getElementById(`tab-${tabId}`);
        if (tabEl) {
            tabEl.onclick = (e) => {
                e.preventDefault();
                if (typeof setSkillTab === 'function') setSkillTab(tabId);
            };
        }
    });

    // 6. TÜM KAPATMA TUŞLARI (X) - KESİN ÇÖZÜM
    if (window.btnCloseSkillBook) {
        window.btnCloseSkillBook.onclick = (e) => {
            e.preventDefault();
            toggleSkillBook();
        };
    }

    if (window.btnCloseStat) {
        window.btnCloseStat.onclick = (e) => {
            e.preventDefault();
            toggleStatScreen();
        };
    }

    if (window.btnCloseInventory) {
        window.btnCloseInventory.onclick = (e) => {
            e.preventDefault();
            console.log("Envanter kapatma tıklandı.");
            toggleInventory();
        };
    }

    // 7. TOWN (KÖY) ÇIKIŞ BUTONU
    if (window.btnLeaveTown) {
        window.btnLeaveTown.onclick = () => {
            writeLog("Köyden ayrıldın.");
            switchScreen(window.mapScreen);
			window.saveGame();
        };
    }
	//8. MENU DÖNÜŞ BUTONU
	if (window.returnToMenuButton) {
        window.returnToMenuButton.onclick = () => {
            // KRİTİK: Ana menüye dönerken siyah perdeyi anında YOK ET
            const overlay = document.getElementById('fade-overlay');
            if (overlay) {
                overlay.style.transition = "none"; // Animasyonu kapat
                overlay.classList.remove('active-fade'); // Sınıfı sil
                setTimeout(() => { overlay.style.transition = "opacity 1.5s ease-in-out"; }, 100); // Animasyonu geri aç
            }

            if (typeof initGame === 'function') initGame();
            switchScreen(window.startScreen);
        };
    }
	//9. KAYIT-DEVAM BUTONLARI
	const continueBtn = document.getElementById('btn-continue');
    
    if (window.hasSaveGame()) {
        continueBtn.classList.remove('hidden'); // Kayıt varsa butonu göster
    }

    continueBtn.onclick = () => {
    // 1. Önce hangi kahramanın seçili olduğunu öğrenelim
    const currentProfile = localStorage.getItem("RPG_Active_Profile_Name");
    
    if (!currentProfile) {
        console.error("HATA: Seçili bir profil bulunamadı!");
        return;
    }

    // --- KRİTİK DÜZELTME: DİNAMİK ANAHTAR ---
    // SİLİNDİ: const rawData = localStorage.getItem("RPG_Adventure_SaveGame");
    // SEBEP: Bu sabit isimli anahtar artık kullanılmıyor. 
    // YENİ: Seçili olan profile özel kayıt dosyasını okuyoruz.
    const profileKey = "RPG_Save_" + currentProfile;
    const rawData = localStorage.getItem(profileKey);
    // ----------------------------------------

    if (!rawData) {
        console.warn("Sistem: Bu profile ait oynanabilir bir kayıt bulunamadı.");
        return;
    }

    const saveData = JSON.parse(rawData);

    // 2. Oyunu yükle (Değişkenleri doldur)
    if (window.loadGame(currentProfile)) {
        
        // 3. Konum Kontrolü (Nerede kaldıysa oraya gönder)
        if (saveData.isInsideTown) {
            window.currentTownMaster = saveData.currentTownMaster;
            if (typeof enterTown === 'function') {
                enterTown(); 
            } else {
                switchScreen(window.townScreen);
            }
            writeLog(`🏰 **${currentProfile}** köye geri döndü.`);
        } 
        else if (saveData.isInsideCity) {
            if (typeof enterCity === 'function') {
                enterCity(); 
            } else {
                switchScreen(window.cityScreen);
            }
            writeLog(`🏛️ **${currentProfile}** Eldoria'ya geri döndü.`);
        }
        else {
            // Köyde veya Şehirde değilse: Normal haritaya git
            switchScreen(window.mapScreen);
            writeLog(`📂 **${currentProfile}** macerasına devam ediyor...`);
        }
    }
};
	window.updateActiveProfileUI();
});