// js/ui/interaction_ui.js
window.showGameInfo = function(title, content, color = "#00ccff") {
    const modal = document.getElementById('info-popup-modal');
    const titleEl = document.getElementById('info-popup-title');
    const contentEl = document.getElementById('info-popup-content');

    if (modal && titleEl && contentEl) {
        titleEl.textContent = title;
        titleEl.style.color = color;
        modal.querySelector('.stat-window').style.borderColor = color;
        contentEl.innerHTML = content;
        modal.classList.remove('hidden');
    }
};

window.openRewardScreen = function(rewards) {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    switchScreen(rewardScreen);
    const list = document.getElementById('reward-list');
    const btnContinue = document.getElementById('btn-reward-continue');
    
    // --- 1. BUTON VE GÖRSEL AYARLAR ---
    btnContinue.style.opacity = "0.5";
    btnContinue.classList.remove('pulse-reward');
    
    let btnTakeAll = document.getElementById('btn-take-all-rewards');
    if (!btnTakeAll) {
        btnTakeAll = document.createElement('button');
        btnTakeAll.id = 'btn-take-all-rewards';
        btnTakeAll.className = 'menu-secondary-btn';
        // ORTALAMA İÇİN KRİTİK STİLLER:
        btnTakeAll.style.display = "block";
        btnTakeAll.style.margin = "0 auto 20px auto"; 
        btnTakeAll.style.width = "250px";
        btnTakeAll.style.color = "#43FF64";
        btnTakeAll.style.borderColor = "#43FF64";
        list.parentNode.insertBefore(btnTakeAll, list);
    }
    btnTakeAll.textContent = lang.loot_all;
    btnTakeAll.classList.remove('hidden');

    list.innerHTML = '';

    const updateContinueButtonState = () => {
        const remainingItems = list.querySelectorAll('.reward-item').length;
        if (remainingItems === 0) {
            btnContinue.style.opacity = "1";
            btnContinue.classList.add('pulse-reward');
            btnTakeAll.classList.add('hidden');
        } else {
            btnContinue.style.opacity = "0.5";
            btnContinue.classList.remove('pulse-reward');
            btnTakeAll.classList.remove('hidden');
        }
    };

    // --- 2. ÖDÜL ÇİZİMİ (TIKLAMA MANTIĞI) ---
    rewards.forEach((reward) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'reward-item pulse-reward';
        
        if (reward.type === 'gold') {
            itemDiv.classList.add('reward-gold');
            itemDiv.innerHTML = `<i class="fas fa-coins" style="color:#ffd700;"></i><span>${reward.value} ${lang.gold_text}</span>`;
            itemDiv.onclick = () => {
                hero.gold += reward.value;
                updateGoldUI();
                itemDiv.remove();
                updateContinueButtonState();
				if(window.saveGame) window.saveGame();
            };
        } 
        else if (reward.type === 'item') {
            itemDiv.classList.add('reward-equipment');
            const item = reward.value;
            const itemName = getTranslatedItemName(item);
            const qty = reward.amount || 1;
            const isMaterial = (item.type === 'material' || item.type === 'stat_scroll' || item.type === 'type_scroll');
            const tierLabel = isMaterial ? lang.items.material_label : `${lang.items.tier_label} ${item.tier}`;
			// --- YENİ: MİKTAR GÖRÜNÜRLÜK KONTROLÜ ---
            // Eğer eşya bir materyal/parşömen ise miktar yazısını oluştur, değilse boş bırak
            const amountHtml = isMaterial ? `<span class="reward-item-amount">x${qty}</span>` : "";
            // ----------------------------------------
			
			// --- GÜNCELLEME: KURAL KONTROLÜ (ÇOKLU KONTROL) ---
            // Önce subtype'a bak, yoksa type'a bak, o da yoksa jewelry kuralını al
            const rules = window.ITEM_RULES[item.subtype] || window.ITEM_RULES[item.type] || window.ITEM_RULES.jewelry;
            
            // Eğer kuralda showTooltip açıkça false ise gösterme
            const canShowTooltip = rules && rules.showTooltip !== false;
            // ------------------------------------------------
			
			// --- GÜNCELLEME: Loot işlemini paketledik ---
            const processSingleLoot = () => {
				window.lastTappedSlot = null; // Herhangi bir şeyi aldığında mobil seçimi sıfırla
                const success = window.addItemToInventory(item, qty);
                if (success) {
                    window.hideItemTooltip();
                    renderInventory();
                    itemDiv.remove();
                    updateContinueButtonState();
                    if(window.saveGame) window.saveGame();
                    window.lastTappedSlot = null;
                } else {
                    window.showAlert(lang.bag_full_msg);
                }
            };

            // Eşyayı butona "emanet" ediyoruz ki toplu toplamada buna ulaşabilsin
            itemDiv.executeLoot = processSingleLoot; 

            itemDiv.innerHTML = `
                <img src="items/images/${item.icon}" class="reward-item-icon">
                <div class="reward-item-text">
                    <div class="reward-item-header">
                        <span class="reward-item-name tier-${isMaterial ? '' : item.tier}">${itemName}</span>
                        ${amountHtml} <!-- Sadece materyallerde x5, x10 gibi görünecek -->
                    </div>
                    <span class="reward-item-tier ${isMaterial ? 'tier-craft' : 'tier-' + item.tier}">${tierLabel}</span>
                </div>`;
				
			// --- KRİTİK DÜZELTME: OLAY DİNLEYİCİLERİ ---
            if (canShowTooltip) {
                // Sadece takı ve broşlarda çalışır
                itemDiv.onmouseenter = (e) => { if (window.innerWidth > 768) window.showItemTooltip(item, e); };
                itemDiv.onmousemove = (e) => { if (window.innerWidth > 768) window.moveTooltip(e); };
                itemDiv.onmouseleave = () => window.hideItemTooltip();
            } else {
                // Materyal ise hover olaylarını temizle (Garantiye alıyoruz)
                itemDiv.onmouseenter = null;
                itemDiv.onmousemove = null;
                itemDiv.onmouseleave = null;
            }

            // Tıklama mantığını (Loot alma) Tooltip ile uyumlu hale getiriyoruz
            itemDiv.onclick = (e) => {
                const isMobile = window.innerWidth <= 768;

                // --- MOBİLDE TOOLTIP KONTROLÜ EKLENDİ ---
                if (isMobile && canShowTooltip) {
                    if (window.lastTappedSlot === itemDiv) {
                        processSingleLoot();
                    } else {
                        window.lastTappedSlot = itemDiv;
                        window.showItemTooltip(item, e);
                        document.querySelectorAll('.reward-item').forEach(el => el.style.borderColor = "");
                        itemDiv.style.borderColor = "#43FF64"; 
                    }
                } else {
                    // PC ise VEYA materyal ise (canShowTooltip false ise) direkt al
                    processSingleLoot();
                }
            };
        }
        list.appendChild(itemDiv);
    });

    // --- 3. FAILSAFE VE AKSİYONLAR ---
    
    // HEPSİNİ TOPLA SADECE BU BUTONLA ÇALIŞIR
    btnTakeAll.onclick = () => {
        const allItemDivs = Array.from(list.querySelectorAll('.reward-item'));
        
        allItemDivs.forEach(div => {
            // Eğer bu bir altınsa (reward-gold sınıfı varsa) click() yap (Altında tooltip yok)
            if (div.classList.contains('reward-gold')) {
                div.click();
            } 
            // Eğer bu bir eşyaysa, direkt loot fonksiyonunu çalıştır (Tooltip'i bypass et)
            else if (div.executeLoot) {
                div.executeLoot();
            }
        });
        
        window.hideItemTooltip(); // Failsafe: Her ihtimale karşı tooltipi kapat
    };

    // YOLA DEVAM ET: OTOMATİK TOPLAMA SİLİNDİ
    btnContinue.onclick = () => {
        const remainingItems = list.querySelectorAll('.reward-item');
        
        if (remainingItems.length > 0) {
            // Ödül varken basılırsa sadece UYARI verir, toplama yapmaz
            window.showConfirm(lang.loot_full_msg, () => {
                switchScreen(mapScreen);
            });
        } else {
            // Ödül yoksa direkt geçer
            switchScreen(mapScreen);
        }
    };
};

window.openBuilding = function(type) {
    const modalId = `modal-${type}`;
    const modal = document.getElementById(modalId);
	
	 // EVENT KONTROLÜ
    if (window.EventManager.isSystemLocked(type)) {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    window.showAlert(lang.system_locked_msg, lang.warning_title); // Yeni Alert
    return;
	}
	
	 // --- YENİ: ŞEHİR VE MASTER KONTROLÜ ---
    const cityScreen = document.getElementById('city-screen');
    const isInsideCity = cityScreen && cityScreen.classList.contains('active');
    
    if (modal) {
		if (type === 'blacksmith') {
            const reforgeBtn = document.getElementById('btn-reforge-master');
			// EĞER şehirdeysek VEYA o kasabanın ustası blacksmith ise butonu GÖSTER
            const shouldShow = isInsideCity || window.currentTownMaster === 'blacksmith';
            // Eğer bu kasabanın ustası blacksmith değilse butonu gizle
             if (reforgeBtn) reforgeBtn.classList.toggle('hidden', !shouldShow);
        }

        if (type === 'alchemist') {
            const synthesisBtn = document.getElementById('btn-synthesis-master');
			// EĞER şehirdeysek VEYA o kasabanın ustası alchemist ise butonu GÖSTER
            const shouldShow = isInsideCity || window.currentTownMaster === 'alchemist';
            // Eğer bu kasabanın ustası alchemist değilse butonu gizle
            if (synthesisBtn) synthesisBtn.classList.toggle('hidden', !shouldShow);
        }

        if (type === 'stable') {
            const horseBtn = document.getElementById('btn-stable-master');
            // Eğer daha önce bu kasabada kiraladıysa VEYA usta stable değilse butonu gizle
            if (horseBtn) {
                const isNotMaster = window.currentTownMaster !== 'stable';
                const alreadyRented = window.hasRentedInThisTown === true;
                
                horseBtn.classList.toggle('hidden', isNotMaster || alreadyRented);
            }
        }
		
        // Her açılışta orijinal selamlamayı geri getir (Özellikle Han için)
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
        
        if (type === 'inn') {
            const dialogue = document.getElementById('inn-dialogue');
            if (dialogue) {
                dialogue.textContent = lang.innkeeper_hello;
                dialogue.style.color = ""; // Rengi sıfırla
            }
        }

		updateNPCStatsDisplay();
        modal.classList.remove('hidden');
        writeLog(`${type.toUpperCase()} binasına girdin.`);
    }
};

// 2. Han: Dinlenme
window.restAtInn = function() {
    const cost = 10;
    const dialogue = document.getElementById('inn-dialogue');
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    if (hero.gold >= cost) {
        // --- BAŞARI DURUMU ---
        hero.gold -= cost;
        
        // Dinamik limitleri al ve fulle
        const stats = getHeroEffectiveStats();
        hero.hp = stats.maxHp; 
		// --- YENİ: DİNLENME (-60 Yorgunluk) ---
        hero.exhaustion = Math.max(0, hero.exhaustion - 50);
        // --------------------------------------
		
		// --- YENİ: ALERT EKRANI ---
        window.showGameInfo(lang.innkeeper_title, `<div style="padding:10px;">${lang.rest_alert_msg}</div>`, "#43FF64");
        // --------------------------
		
        updateGoldUI();
        updateStats();
		window.updateExhaustionUI(); // Barı tazele
        
        dialogue.textContent = lang.rest_success;
        dialogue.style.color = "#43FF64";

        // KRİTİK: Sadece para varsa gün atlar
        window.CalendarManager.passDay(); 

    } else {
        window.showAlert(lang.rest_fail);
    }

    setTimeout(() => {
        if (dialogue) {
            dialogue.textContent = lang.innkeeper_hello;
            dialogue.style.color = ""; 
        }
    }, 3000);
};

// 3. Han: İçecek Al
window.buyDrink = function() {
     const cost = 5;
     const dialogue = document.getElementById('inn-dialogue');
     const currentLang = window.gameSettings.lang || 'tr';
     const lang = window.LANGUAGES[currentLang];
     
     if (hero.gold >= cost) {
         hero.gold -= cost;
		 // --- YENİ: İÇECEK (-25 Yorgunluk) ---
         hero.exhaustion = Math.max(0, hero.exhaustion - 25);
         // ------------------------------------
         updateGoldUI();
         updateStats();
		 window.updateExhaustionUI();
		 
		 // --- YENİ: ALERT EKRANI ---
         window.showGameInfo(lang.innkeeper_title, `<div style="padding:10px;">${lang.drink_alert_msg}</div>`, "#3498db");
         // --------------------------
         
         dialogue.textContent = lang.drink_success;
         dialogue.style.color = "#3498db"; // Mavi
     } else {
		 window.showAlert(lang.drink_fail);
         
     }

     // 3 SANİYE SONRA ESKİ HALİNE DÖN
     setTimeout(() => {
        if (dialogue) {
            dialogue.textContent = lang.innkeeper_hello;
            dialogue.style.color = ""; 
        }
    }, 3000);
};

window.updateNPCStatsDisplay = function() {
    // Tüm açık NPC pencerelerindeki stat alanlarını bul
    const hpDisplays = document.querySelectorAll('.npc-hp-stat .hp-val');
    const rageDisplays = document.querySelectorAll('.npc-rage-stat .rage-val');
    const goldDisplays = document.querySelectorAll('.npc-gold-stat .gold-val');
	const exhaustDisplays = document.querySelectorAll('.npc-exhaust-stat .exhaust-val');

    // Effective Stats'tan güncel Max HP'yi alalım
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : { maxHp: hero.maxHp, maxRage: hero.maxRage };

    hpDisplays.forEach(el => el.textContent = `${hero.hp}/${effective.maxHp}`);
    rageDisplays.forEach(el => el.textContent = `${hero.rage}/${effective.maxRage}`); // maxRage fix
    goldDisplays.forEach(el => el.textContent = hero.gold);
	 // --- YENİ: YORGUNLUK DEĞERİNİ YAZDIR ---
    exhaustDisplays.forEach(el => {
        const val = Math.floor(hero.exhaustion || 0);
        el.textContent = `${val}/200`; 
        // Görsel tutarlılık: 100'den sonra rengi mor yapalım (Stat ekranındaki gibi)
        el.parentElement.style.color = val >= 100 ? "#9b59b6" : "#ffd700";
    });
};

window.startCampfireEvent = function(node) {
    switchScreen(campfireScreen);
    campfireOptionsDiv.style.display = 'flex'; campfireResultDiv.classList.add('hidden');
    btnCampRest.onclick = () => { const h = Math.floor(hero.maxHp * 0.3); hero.hp = Math.min(hero.maxHp, hero.hp + h); showCampfireResult("Dinlendin", `+${h} HP kazandın.`); };
    btnCampTrain.onclick = () => { gainXP(3); showCampfireResult("Antrenman", "+3 XP kazandın."); };
    btnCampContinue.onclick = () => switchScreen(mapScreen);
};

window.showCampfireResult = function(title, text) {
    campfireOptionsDiv.style.display = 'none'; campfireResultDiv.classList.remove('hidden');
    campfireResultTitle.textContent = title; campfireResultText.textContent = text;
};

let isEventProcessing = false; // Sayfanın en üstünde tanımlayabilirsin

window.triggerRandomEvent = function(forcedEvent = null) {
    if (isEventProcessing) return;
    
    updateNPCStatsDisplay();
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
	
	// --- YENİ: KAYNAK ETİKETİNİ HAZIRLA ---
    const classRules = CLASS_CONFIG[hero.class];
    const resourceLabel = lang[`resource_${classRules.resourceName}`];
    // --------------------------------------
    
    switchScreen(eventScreen);
	
	gainXP(1, true);
	hero.exhaustion = Math.max(0, hero.exhaustion + 1);
    window.updateExhaustionUI(); // Barı güncelle
    
    // UI Sıfırlama
    document.getElementById('event-main-area').classList.remove('hidden');
    document.getElementById('event-result-area').classList.add('hidden');
    const container = document.getElementById('event-choices-container');
    container.innerHTML = ''; 
	
	// --- KRİTİK DEĞİŞİKLİK: ÖNCEDEN ATANMIŞ EVENT VAR MI? ---
	let evt;
	if (forcedEvent) {
		evt = forcedEvent;
	} else {
    const currentNode = GAME_MAP.nodes.find(n => n.id === GAME_MAP.currentNodeId);
    

    if (currentNode && currentNode.eventId) {
        // Scout tarafından belirlenmiş olayı çek
        evt = EVENT_POOL.find(e => e.id === currentNode.eventId);
    } 
    
    // Eğer Scout belirlenmemişse (Scout tutulmadıysa) rastgele seç
    if (!evt) {
        evt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    }
	}
    // ------------------------------------------------------
	
	//StatsManager.trackEvent(evt.id);

    const t = lang.events[evt.id];
	// --- GÜNCELLEME: BAŞLIK VE AÇIKLAMAYI FİLTRELE ---
    let rawTitle = t ? t.title : evt.title;
    let rawDesc = t ? t.desc : evt.desc;
    document.getElementById('event-title').textContent = t ? t.title : evt.title;
    document.getElementById('event-desc').textContent = t ? t.desc : evt.desc;

    const createBtn = (opt, optKey) => {
        if (!opt) return;
        const b = document.createElement('button');
        b.className = 'event-btn';
		
        // --- GÜNCELLEME: BUTON İÇİNDEKİ TÜM METİNLERİ FİLTRELE ---
        let btnText = t ? t[optKey] : opt.text;
        let bText = t ? t[optKey + "_b"] : (opt.buff || "");
        let dText = t ? t[optKey + "_d"] : (opt.debuff || "");

        // Kelime Değişimi (Rage/Öfke -> Mana/Öfke)
        btnText = btnText.replace(/Rage|Öfke/gi, resourceLabel);
        bText = bText.replace(/Rage|Öfke/gi, resourceLabel);
        dText = dText.replace(/Rage|Öfke/gi, resourceLabel);


        b.innerHTML = `
            <span class="choice-title">${btnText}</span>
            <div class="choice-details">
                <span class="choice-detail buff">${bText}</span>
                <span class="choice-detail debuff">${dText}</span>
            </div>`;
        
        b.onclick = () => {
            if (isEventProcessing) return; // Çift tıklama kilidi
            isEventProcessing = true;
			// 1. Aksiyonu çalıştır ve sonucu al
            const actionResult = opt.action(hero); 
            
            // 2. Tarihçiye kaydet (Event ID, Buton Metni, Sonuç)
            StatsManager.trackEvent(evt.id, btnText, actionResult, optKey);

            // 1. BUTONLARI ANINDA SİL (Görsel ve mantıksal olarak tıklamayı bitirir)
            container.innerHTML = '';
            document.getElementById('event-main-area').classList.add('hidden'); 
            
            // 3. UI'ı Güncelle
            updateStats();
            updateNPCStatsDisplay();
            
            // 4. Sonuç Ekranını Göster
            const resultArea = document.getElementById('event-result-area');
            const resultTextEl = document.getElementById('event-result-text');
			const visualEl = document.getElementById('event-visual-outcome'); // Yeni eklediğimiz div
			
			visualEl.innerHTML = ''; // Önceki görseli temizle
			
			// 1. EĞER SONUÇ BİR EŞYA İSE (Transmute gibi çiz)
            if (actionResult && actionResult.type === 'item') {
                const item = actionResult.value;
                const slot = document.createElement('div');
                slot.className = 'item-slot result-flash'; // Parlama efektiyle gelsin
                slot.style.width = "80px"; slot.style.height = "80px";
                
                slot.innerHTML = `
                    <img src="items/images/${item.icon}">
                    ${window.getItemBadgeHTML(item)}
                `;
                
                // Tooltip desteği (Transmute ile aynı)
                slot.onmouseenter = (e) => window.showItemTooltip(item, e);
                slot.onmouseleave = () => window.hideItemTooltip();
                
                visualEl.appendChild(slot);
                resultTextEl.innerHTML = `<span style="color:#43FF64;">${lang.items.scavenge_success_text}</span>`;
            } 
            // 2. EĞER SONUÇ HASAR İSE
            else if (actionResult && actionResult.type === 'damage') {
                visualEl.innerHTML = `<div style="font-size:3rem; filter:drop-shadow(0 0 10px red);">💔</div>`;
                resultTextEl.innerHTML = `<span style="color:#ff4d4d;">${lang.items.scavenge_fail_text.replace("$1", actionResult.value)}</span>`;
            }
            // 3. DİĞER DURUMLAR (Eski sistem)
            else {
                resultTextEl.innerHTML = `<span style="color:#ffd700; font-size:1.4em;">${btnText}</span><br><br>${lang.event_applied_msg}`;
            }
            
            resultArea.classList.remove('hidden');
            if(window.saveGame) window.saveGame();
            isEventProcessing = false; 
        };
        container.appendChild(b);
    };

    createBtn(evt.option1, 'opt1');
    createBtn(evt.option2, 'opt2');
};

window.openSmallMerchant = function() {
	window.isBroochTrade = false; // Normal takı modu
    // 1. İndirimi aç
    window.currentMerchantDiscount = 0.5; 
    
    // 2. SADECE 4 eşya üret (Fonksiyona 4 gönderiyoruz)
    window.refreshMerchantStock(4); 
    
    // 3. Trade ekranını aç
    window.openMerchantTrade('buy');
    writeLog("🎒 Gizemli bir gezgin sana mallarını indirimle sunuyor!");
};

window.openBroochMerchant = function() {
	window.isBroochTrade = true; // Broş önizleme modu AKTİF
    window.currentMerchantDiscount = 1.0; 
    window.merchantStock = [];
    
    // --- GÜNCELLEME: AYNI DENGELİ TIER MANTIĞI ---
    const progress = hero.highestTierDefeated || 1;
    const base = progress / 2;
    
    for (let i = 0; i < 4; i++) {
        // Buçuklu ise %50 ihtimalle seç
        let currentTier = (base % 1 === 0) ? base : (Math.random() < 0.5 ? Math.floor(base) : Math.ceil(base));
        currentTier = Math.max(1, currentTier);
        
        window.merchantStock.push(generateRandomBrooch(currentTier));
    }
    // ----------------------------------------------
    
    window.openMerchantTrade('buy');
    const lang = window.getCombatLang();
    writeLog("📿 **İşportacı**: Nadir broşlarını sana sunuyor!");
};

window.openVeteranMaster = function() {
	// --- YENİ: ANA ÇIKIŞ BUTONUNU GÖSTER ---
    const mainExitBtn = document.getElementById('btn-veteran-main-exit');
    if (mainExitBtn) mainExitBtn.classList.remove('hidden');
    // ---------------------------------------
    const modal = document.getElementById('modal-veteran');
    const list = document.getElementById('veteran-skill-list');
    const lang = window.getCombatLang();
    
    if (document.getElementById('veteran-master-title')) 
        document.getElementById('veteran-master-title').textContent = lang.veteran_master_title;
    if (document.getElementById('veteran-dialogue')) 
        document.getElementById('veteran-dialogue').textContent = lang.veteran_master_hello;

    list.innerHTML = '';
    
    const unlocked = hero.unlockedSkills.filter(key => {
        const s = SKILL_DATABASE[key];
        return s && s.data.tier > 0 && !(s.data.category === 'common' && s.data.tier === 1);
    });

    if (unlocked.length === 0) {
        list.innerHTML = `<p style="color:#777;">${lang.veteran_empty}</p>`;
    } else {
        // --- 1. TABLO BAŞLIĞINI OLUŞTUR ---
        const header = document.createElement('div');
        header.className = 'veteran-header-row';
        header.innerHTML = `
            <div class="v-col-name">${lang.veteran_header_skill}</div>
            <div class="v-col-btn">${lang.veteran_header_swap}</div>
            <div class="v-col-btn">${lang.veteran_header_forget}</div>
        `;
        list.appendChild(header);

        // --- 2. YETENEK SATIRLARINI OLUŞTUR ---
        unlocked.forEach(key => {
            const skill = SKILL_DATABASE[key];
            const swapCost = skill.data.tier * 7;
            const refundCost = skill.data.tier * 12;
            const div = document.createElement('div');
            div.className = 'veteran-skill-row';
            
            const skillName = lang.skills[key]?.name || skill.data.name;

            div.innerHTML = `
                <div class="v-col-name">
                    <img src="images/${skill.data.icon}" class="v-skill-icon">
                    <span class="v-skill-text">${skillName} (T${skill.data.tier})</span>
                </div>
                <div class="v-col-btn">
                    <button class="npc-btn v-action-btn" onclick="prepareVeteranSwap('${key}')">
                        -${swapCost}G
                    </button>
                </div>
                <div class="v-col-btn">
                    <button class="npc-btn v-action-btn btn-danger" onclick="processVeteranRefund('${key}')">
                        -${refundCost}G
                    </button>
                </div>
            `;
            list.appendChild(div);
        });
    }

    modal.classList.remove('hidden');
    updateNPCStatsDisplay();
};

// 1. SWAP AŞAMASI: Alternatifleri Göster
window.prepareVeteranSwap = function(oldSkillKey) {
	// --- YENİ: ANA ÇIKIŞ BUTONUNU GİZLE ---
    const mainExitBtn = document.getElementById('btn-veteran-main-exit');
    if (mainExitBtn) mainExitBtn.classList.add('hidden');
    // ---------------------------------------
    const list = document.getElementById('veteran-skill-list');
    const skill = SKILL_DATABASE[oldSkillKey];
    const lang = window.getCombatLang();
    
    document.getElementById('veteran-dialogue').textContent = lang.veteran_select_title;
    list.innerHTML = '';

    // Aynı Tab ve aynı Tier'daki DİĞER skilleri bul
    const alternatives = Object.keys(SKILL_DATABASE).filter(k => 
        SKILL_DATABASE[k].data.category === skill.data.category && 
        SKILL_DATABASE[k].data.tier === skill.data.tier && 
        k !== oldSkillKey
    );

    alternatives.forEach(newKey => {
        const newSkill = SKILL_DATABASE[newKey];
        const div = document.createElement('div');
        div.className = 'reforge-prop-card';
        div.style.border = "1px solid #43FF64";
        
        div.innerHTML = `
            <div style="display:flex; align-items:center; gap:10px;">
                <img src="images/${newSkill.data.icon}" style="width:30px; height:30px; border-radius:4px;">
                <span>${lang.skills[newKey].name}</span>
            </div>
            <button class="npc-btn" onclick="executeVeteranSwap('${oldSkillKey}', '${newKey}')">${lang.select}</button>
        `;
        list.appendChild(div);
    });

    // Vazgeçme butonu
    const backBtn = document.createElement('button');
    backBtn.className = "npc-btn";
    backBtn.style.marginTop = "10px";
    backBtn.textContent = lang.back;
    backBtn.onclick = openVeteranMaster;
    list.appendChild(backBtn);
};

// 2. SWAP UYGULAMA
window.executeVeteranSwap = function(oldKey, newKey) {
    const lang = window.getCombatLang();
    const oldSkill = SKILL_DATABASE[oldKey];
    
    // Eğer yetenek bir slot değiştiriciyse onay al
    const isSlotSkill = ['loot_junkie', 'hoarder', 'fired_up'].includes(oldKey);

    const performSwap = () => {
        const newSkill = SKILL_DATABASE[newKey];
        const cost = oldSkill.data.tier * 7;
        if (hero.gold < cost) { window.showAlert(lang.not_enough_msg); return; }

        if (oldSkill.data.onRemove) oldSkill.data.onRemove();
        if (newSkill.data.onAcquire) newSkill.data.onAcquire();

        hero.gold -= cost;
        hero.unlockedSkills = hero.unlockedSkills.filter(k => k !== oldKey);
        hero.unlockedSkills.push(newKey);
        
        const equipIdx = hero.equippedSkills.indexOf(oldKey);
        if (equipIdx !== -1) hero.equippedSkills[equipIdx] = newKey;

        writeLog(lang.combat.log_skill_swapped.replace("$1", lang.skills[oldKey].name).replace("$2", lang.skills[newKey].name));
        updateGoldUI(); updateStats(); openVeteranMaster();
        renderInventory(); // Çantayı tazele
        if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
    };

    if (isSlotSkill) {
        window.showConfirm(lang.veteran_slot_warning, performSwap);
    } else {
        performSwap();
    }
};

// 3. REFUND (UNUTMA) UYGULAMA
window.processVeteranRefund = function(skillKey) {
    const lang = window.getCombatLang();
    const targetSkill = SKILL_DATABASE[skillKey];
    if (!targetSkill) return;

    const category = targetSkill.data.category;
    const tier = targetSkill.data.tier;

    const dependentSkills = hero.unlockedSkills.filter(k => {
        const s = SKILL_DATABASE[k];
        return s && s.data.category === category && s.data.tier > tier;
    }).sort((a, b) => SKILL_DATABASE[b].data.tier - SKILL_DATABASE[a].data.tier);

    const allToDelete = [skillKey, ...dependentSkills];
    
    let totalGoldCost = 0;
    let totalSPRefund = 0;
    let skillNamesList = [];

    allToDelete.forEach(k => {
        const s = SKILL_DATABASE[k];
        totalGoldCost += s.data.tier * 12;
        totalSPRefund += (s.data.pointCost || s.data.tier);
        if (k !== skillKey) skillNamesList.push(lang.skills[k]?.name || k);
    });

    const performRefund = () => {
        if (hero.gold < totalGoldCost) { window.showAlert(lang.not_enough_msg); return; }

        const currentLang = window.getCombatLang();
        const combatL = currentLang.combat || {};

        hero.gold -= totalGoldCost;
        hero.skillPoints += totalSPRefund;

        allToDelete.forEach(k => {
            const s = SKILL_DATABASE[k];
            if (s.data.onRemove) s.data.onRemove();
            hero.unlockedSkills = hero.unlockedSkills.filter(unlocked => unlocked !== k);
            const equipIdx = hero.equippedSkills.indexOf(k);
            if (equipIdx !== -1) hero.equippedSkills[equipIdx] = null;
        });

        if (combatL.log_skill_chain_refunded) {
            const branchName = currentLang[`tab_${category}`] || category;
            writeLog(combatL.log_skill_chain_refunded.replace("$1", branchName).replace("$2", totalGoldCost).replace("$3", totalSPRefund));
        }

        updateGoldUI(); updateStats(); renderInventory(); openVeteranMaster();
        if (typeof initializeSkillButtons === 'function') initializeSkillButtons();
    };

    // --- ONAY PENCERESİ MANTIĞI ---
    if (dependentSkills.length > 0) {
        // DURUM 1: Zincirleme silme (Kendi renklendirdiğin mesaj)
        const namesStr = skillNamesList.join(", ");
        const warningMsg = lang.veteran_tree_warning
            .replace("$1", namesStr)
            .replace("$2", totalGoldCost)
            .replace("$3", totalSPRefund);
        window.showConfirm(warningMsg, performRefund);
    } else {
        // DURUM 2: Tekil silme (Artık bu da onay istiyor)
        const simpleWarning = lang.veteran_forget_simple_warning
            .replace("$1", totalGoldCost)
            .replace("$2", totalSPRefund);
        window.showConfirm(simpleWarning, performRefund);
    }
};

window.currentCompendiumTab = 'enemies';

window.openCompendium = function() {
    document.getElementById('compendium-modal').classList.remove('hidden');
    switchCompendiumTab('enemies');
};

window.switchCompendiumTab = function(tabId) {
    window.currentCompendiumTab = tabId;
    
    // Tab butonlarını görsel olarak güncelle
    document.querySelectorAll('#compendium-modal .tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('onclick').includes(tabId));
    });

    renderCompendiumList();
};

window.renderCompendiumList = function() {
    const list = document.getElementById('compendium-list');
    const lang = window.getCombatLang();
    const data = StatsManager.currentRun;
    list.innerHTML = '';

    if (currentCompendiumTab === 'enemies') {
        // Kabilelere göre grupla
        const tribes = ["Greenskins", "Humans", "B&M", "Plants", "Undead", "Dragonkind", "Magical Creatures"];
        tribes.forEach(tribe => {
            const tribeEnemies = data.seenEnemies.filter(e => ENEMY_STATS[e.name].tribe === tribe);
            if (tribeEnemies.length > 0) {
                const groupTitle = document.createElement('h3');
                groupTitle.className = 'compendium-group-title';
                groupTitle.textContent = lang.enemy_names[tribe] || tribe;
                list.appendChild(groupTitle);

                tribeEnemies.forEach(e => {
                    const card = document.createElement('div');
                    card.className = 'skill-book-item compendium-card';
                    // --- TIER VE VARYASYON ETİKETİ HESAPLAMA ---
                    let variantLabel = `T${e.tier}`;
                    if (e.isBoss) {
					// --- BOSS ÖZEL ETİKETİ ---
					const diffPercent = Math.round((e.bossScaling - 1) * 100);
					const sign = diffPercent >= 0 ? "+" : "";
					variantLabel = `<span style="color:#ffd700;">BOSS</span> <span style="color:${diffPercent >= 0 ? '#ff4d4d' : '#43FF64'}">${sign}${diffPercent}%</span>`;
				} else {
					if (e.isHalfTier) variantLabel += ".5";
					if (e.isHard) variantLabel += " <span style='color:#ff4d4d'>+20%</span>";
					if (e.isWeak) variantLabel += " <span style='color:#43FF64'>-20%</span>";
				}
                    // -------------------------------------------

                    card.innerHTML = `
                        <div class="comp-img-box"><img src="images/${e.idle}"></div>
                        <div class="skill-info" style="flex-grow:1;">
                            <h4>${lang.enemy_names[e.name] || e.name} <small style="color:#aaa;">(${variantLabel})</small></h4>
                            <div class="comp-stats-grid" style="color:#43FF64;">
                                <span>❤️ HP: ${e.hp}</span>
                                <span>⚔️ ATK: ${e.atk}</span>
                                <span>🛡️ DEF: ${e.def}</span>
                            </div>
                        </div>`;
                    list.appendChild(card);
                });
            }
        });
    } 
    else if (currentCompendiumTab === 'items') {
        if (!data.seenItems || data.seenItems.length === 0) {
            list.innerHTML = `<p style="color:#777; text-align:center; padding:20px;">${lang.items_empty}</p>`;
        } else {
            data.seenItems.forEach(item => {
                if (!item || !item.stats && !item.effects && !item.bonuses) return; 

                const card = document.createElement('div');
                card.className = 'skill-book-item compendium-item-card';
                
                let detailsHtml = "";

                // 1. ZIRH (DEFANS)
                if (item.implicitDef > 0) {
                    detailsHtml += `<div style="color:#3498db; font-size:0.7rem;">🛡️ DEF: +${item.implicitDef}</div>`;
                }

                // 2. STANDART STATLAR
                if (item.stats) {
                    Object.entries(item.stats).forEach(([sKey, val]) => {
                        if (val > 0) detailsHtml += `<div style="font-size:0.7rem;">${window.getStatDisplayName(sKey)}: +${val}</div>`;
                    });
                }

                // 3. BROŞ EFEKTLERİ VE FREKANS
                if (item.effects) {
                    item.effects.forEach(eff => {
                        let effectName = lang.items['eff_' + eff.id] || eff.id;
                        let displayVal = (eff.value < 1 && eff.value > 0) ? `%${Math.round(eff.value * 100)}` : `+${eff.value}`;
                        detailsHtml += `<div style="color:#df9cff; font-size:0.7rem;">✨ ${effectName}: ${displayVal}</div>`;
                    });
                    // BROŞ COOLDOWN (FREKANS)
                    if (item.frequency) {
                        const freqText = (lang.items.brooch_freq || "Her $1 Turda").replace("$1", item.frequency);
                        detailsHtml += `<div style="color:#3498db; font-size:0.65rem; width:100%; margin-top:2px;">⌛ ${freqText}</div>`;
                    }
                }

                // 4. TILSIM BONUSLARI (HASAR VE SAVUNMA)
                if (item.bonuses) {
                    item.bonuses.forEach(b => {
                        if (b.type === 'elemDmg') {
                            detailsHtml += `<div style="color:#f0e68c; font-size:0.7rem;">🔥 ${lang.items.eff_elemDmg}: +${b.value}</div>`;
                        } else if (b.type === 'tribe_mod') {
                            detailsHtml += `<div style="color:#ff4d4d; font-size:0.7rem;">⚔️ ${lang.items.eff_skill_dmg}: +${b.skillDmg}</div>`;
                            // --- EKLE: TILSIM SAVUNMA BONUSU ---
                            if (b.defense > 0) {
                                detailsHtml += `<div style="color:#3498db; font-size:0.7rem;">🛡️ ${lang.items.eff_tribe_def}: +${b.defense}</div>`;
                            }
                        }
                    });
                }

                // TIER BADGE'İ GÖRSELİN ÜSTÜNE EKLEDİK
                card.innerHTML = `
                    <div class="comp-img-box">
                        <img src="items/images/${item.icon}">
                        <span class="item-tier-badge badge-${item.tier}">T${item.tier}</span>
                    </div>
                    <div class="skill-info" style="flex-grow:1;">
                        <h4 class="tier-${item.tier}">${lang.items[item.nameKey] || item.nameKey}</h4>
                        <div class="comp-item-stats-grid" style="display:flex; flex-wrap:wrap; gap:8px; border-top:1px solid rgba(255,255,255,0.1); padding-top:5px;">
                            ${detailsHtml}
                        </div>
                    </div>`;
                list.appendChild(card);
            });
        }
    }
    else if (currentCompendiumTab === 'events') {
        // En yeni seçimler en üstte görünsün diye ters çeviriyoruz
        [...data.seenEvents].reverse().forEach(entry => {
            const eventData = lang.events[entry.id];
            if (!eventData) return;

            const card = document.createElement('div');
            card.className = 'skill-book-item compendium-event-card';
            
            let resultHtml = "";
            const res = entry.result;

            if (res && res.type !== 'nothing') {
                // 1. EŞYA KAZANIMI (Büyük İkonlu Özel Kutu)
                if (res.type === 'item') {
                    const item = res.value;
                    const itemName = lang.items[item.nameKey] || item.nameKey;
                    resultHtml = `
                        <div class="comp-event-item-display">
                            <img src="items/images/${item.icon}">
                            <div class="comp-event-item-info">
                                <span style="color:#43FF64; font-size:0.65rem; text-transform:uppercase;">🎁 ${lang.items.gained}</span>
                                <span class="comp-event-item-name">${itemName}</span>
                                <span class="tier-${item.tier}" style="font-size:0.75rem;">${lang.items.tier_label} ${item.tier}</span>
                            </div>
                        </div>`;
                }
                // 2. HASAR ALINDIĞINDA
                else if (res.type === 'damage') {
                    resultHtml = `<div style="color:#ff4d4d; font-size:0.85rem; margin-top:10px; font-weight:bold;">💔 ${lang.items.lost}: ${res.value} HP</div>`;
                }
                // 3. ALTIN KAZANILDIĞINDA
                else if (res.type === 'gold') {
                    resultHtml = `<div style="color:#ffd700; font-size:0.85rem; margin-top:10px; font-weight:bold;">💰 ${lang.items.gained}: ${res.value} ${lang.gold_text}</div>`;
                }
                // 4. TECRÜBE (XP) KAZANILDIĞINDA
                else if (res.type === 'xp') {
                    resultHtml = `<div style="color:#9b59b6; font-size:0.85rem; margin-top:10px; font-weight:bold;">✨ ${lang.items.gained}: ${res.value} XP</div>`;
                }
                // 5. BUFF/ETKİ UYGULANDIĞINDA (Dil Dosyasından Çekilen Dinamik Metin)
                else if (res.type === 'buff') {
                    const eData = lang.events[entry.id];
                    if (eData && entry.optKey) {
                        const buffTxt = eData[entry.optKey + "_b"] || "";
                        const debuffTxt = eData[entry.optKey + "_d"] || "";
                        const fullDesc = (buffTxt && debuffTxt) ? `${buffTxt} / ${debuffTxt}` : (buffTxt || debuffTxt);
                        resultHtml = `<div style="color:#3498db; font-size:0.85rem; margin-top:10px; font-style:italic;">📜 ${fullDesc}</div>`;
                    } else {
                        resultHtml = `<div style="color:#3498db; font-size:0.85rem; margin-top:10px;">📜 ${lang.items.applied_effect}</div>`;
                    }
                }
                // 6. ŞİFA VEYA KAYNAK (Rage/Mana) KAZANIMI
                else if (res.type === 'heal' || res.type === 'rage') {
                    const displayVal = (typeof res.value === 'number') ? `+${res.value}` : res.value;
                    const color = (res.type === 'heal') ? "#43FF64" : "#ffd700";
                    
                    // Kaynak ismini dile göre belirle (Öfke/Mana)
                    let label = "HP";
                    if (res.type === 'rage') {
                        const resKey = CLASS_CONFIG[hero.class].resourceName;
                        label = lang[`resource_${resKey}`];
                    }

                    resultHtml = `<div style="color:${color}; font-size:0.85rem; margin-top:10px; font-weight:bold;">✨ ${lang.items.gained}: ${displayVal} ${label}</div>`;
                }
            }

            card.innerHTML = `
                <div class="skill-info" style="width:100%;">
                    <div style="display:flex; justify-content:space-between; align-items:baseline; border-bottom:1px solid rgba(240,230,140,0.2); padding-bottom:5px;">
                        <h4 style="color:#f0e68c; margin:0;">${eventData.title}</h4>
                    </div>
                    <p style="font-size:0.75rem; color:#aaa; margin:8px 0 0 0;">
                        <i class="fas fa-hand-pointer" style="color:#a89373; font-size:0.6rem;"></i> 
                        <b style="color:#a89373;">${lang.compendium_choice_made}:</b> ${entry.choice}
                    </p>
                    ${resultHtml}
                </div>`;
            list.appendChild(card);
        });
    }
};

document.addEventListener('click', e => {
    // 1. Eğer tıklanan yer 'close-npc' sınıfına sahipse (NPC çıkış butonu) kapat
    if (e.target.classList.contains('close-npc')) {
        e.target.closest('.npc-modal')?.classList.add('hidden');
        return;
    }

    // 2. Siyah arka plana tıklandığında kapatma mantığı
    if (e.target.classList.contains('npc-modal')) {
        // GÜVENLİK: Transmute ve Merchant Trade ekranları dışarı tıklanarak KAPANAMAZ
        const forbiddenModals = ['transmute-screen', 'merchant-trade-screen', 'trade-confirm-modal', 'salvage-screen', 'synthesis-screen', 'reforge-screen','info-popup-modal',];
        
        if (forbiddenModals.includes(e.target.id)) {
            console.log("Güvenlik: İşlemi tamamlamak veya iptal etmek için butonları kullanmalısın.");
            return; 
        }
        
        // Diğer modalları (Han, Demirci vb.) dışarı tıklayarak kapatmaya devam edebilir
        e.target.classList.add('hidden');
    }
});
