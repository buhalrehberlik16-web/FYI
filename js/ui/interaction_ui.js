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

            itemDiv.innerHTML = `
                <img src="items/images/${item.icon}" class="reward-item-icon">
                <div class="reward-item-text">
                    <div class="reward-item-header">
                        <span class="reward-item-name tier-${isMaterial ? '' : item.tier}">${itemName}</span>
                        <span class="reward-item-amount">x${qty}</span>
                    </div>
                    <span class="reward-item-tier ${isMaterial ? 'tier-craft' : 'tier-' + item.tier}">${tierLabel}</span>
                </div>`;

            // --- YENİ: TOOLTIP DESTEĞİ ---
            // PC için üzerine gelince göster
            itemDiv.onmouseenter = (e) => { if (window.innerWidth > 768) window.showItemTooltip(item, e); };
            itemDiv.onmousemove = (e) => { if (window.innerWidth > 768) window.moveTooltip(e); };
            itemDiv.onmouseleave = () => window.hideItemTooltip();

            // Tıklama mantığını (Loot alma) Tooltip ile uyumlu hale getiriyoruz
            itemDiv.onclick = (e) => {
                const isMobile = window.innerWidth <= 768;
                
                const performLootAction = () => {
                    const success = window.addItemToInventory(item, qty);
                    if (success) {
                        window.hideItemTooltip(); // Eşya alınınca kutuyu kapat
                        renderInventory();
                        itemDiv.remove();
                        updateContinueButtonState();
                        if(window.saveGame) window.saveGame();
                        window.lastTappedSlot = null; // Mobil seçim kilidini temizle
                    } else {
                        window.showAlert(lang.bag_full_msg);
                    }
                };

                if (isMobile) {
                    // MOBİL MANTIĞI:
                    if (window.lastTappedSlot === itemDiv) {
                        // Eğer zaten seçiliyse eşyayı al
                        performLootAction();
                    } else {
                        // İlk dokunuşsa sadece seç ve tooltip göster
                        window.lastTappedSlot = itemDiv;
                        window.showItemTooltip(item, e);
                        
                        // Diğer satırlardaki seçili kalmış görsel efektleri temizlemek istersen:
                        document.querySelectorAll('.reward-item').forEach(el => el.style.borderColor = "");
                        itemDiv.style.borderColor = "#43FF64"; // Seçilen satırı yeşil yap
                    }
                } else {
                    // PC: Doğrudan al
                    performLootAction();
                }
            };
            // -----------------------------
        }
        list.appendChild(itemDiv);
    });

    // --- 3. FAILSAFE VE AKSİYONLAR ---
    
    // HEPSİNİ TOPLA SADECE BU BUTONLA ÇALIŞIR
    btnTakeAll.onclick = () => {
        const allRewards = Array.from(list.querySelectorAll('.reward-item'));
        allRewards.forEach(el => el.click());
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
    
    if (modal) {
		if (type === 'blacksmith') {
            const reforgeBtn = document.getElementById('btn-reforge-master');
            // Eğer bu kasabanın ustası blacksmith değilse butonu gizle
            if (reforgeBtn) reforgeBtn.classList.toggle('hidden', window.currentTownMaster !== 'blacksmith');
        }

        if (type === 'alchemist') {
            const synthesisBtn = document.getElementById('btn-synthesis-master');
            // Eğer bu kasabanın ustası alchemist değilse butonu gizle
            if (synthesisBtn) synthesisBtn.classList.toggle('hidden', window.currentTownMaster !== 'alchemist');
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
        hero.exhaustion = Math.max(0, hero.exhaustion - 60);
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

            // 1. BUTONLARI ANINDA SİL (Görsel ve mantıksal olarak tıklamayı bitirir)
            container.innerHTML = '';
            document.getElementById('event-main-area').classList.add('hidden');

            // 2. Aksiyonu Uygula
            // --- GÜNCELLEME: Aksiyondan dönen sonucu yakala ---
            const actionResult = opt.action(hero); 
            
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
    // 1. Normal tüccar stoğunu temizle ve 4 rastgele takı üret
    window.merchantStock = [];
    const progress = hero.highestTierDefeated || 1;
    for (let i = 0; i < 4; i++) {
        window.merchantStock.push(generateRandomItem(progress));
    }
    // 2. Tüccar ekranını aç
    window.openMerchantTrade('buy');
    writeLog("🎒 Gizemli bir gezgin sana mallarını gösteriyor...");
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