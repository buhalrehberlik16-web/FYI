// js/ui/interaction_ui.js
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

            itemDiv.onclick = () => {
                const success = window.addItemToInventory(item, qty);
                if (success) {
                    renderInventory();
                    itemDiv.remove();
                    updateContinueButtonState();
					if(window.saveGame) window.saveGame();
                } else {
                    window.showAlert(lang.bag_full_msg);
                }
            };
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
            // Eğer bu kasabanın ustası stable değilse butonu gizle
            if (horseBtn) horseBtn.classList.toggle('hidden', window.currentTownMaster !== 'stable');
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

        updateGoldUI();
        updateStats();
        
        dialogue.textContent = lang.rest_success;
        dialogue.style.color = "#43FF64";

        // KRİTİK: Sadece para varsa gün atlar
        window.CalendarManager.passDay(); 

    } else {
        window.showAlert(lang.rest_fail);
        // --- BAŞARISIZLIK DURUMU ---
        //dialogue.textContent = lang.rest_fail;
        //dialogue.style.color = "#ff4d4d";
        // Gün atlatma kodunu buraya koymadığımız için hiçbir şey değişmez.
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
         hero.rage = Math.min(hero.maxRage, hero.rage + 10);
         updateGoldUI();
         updateStats();
         
         dialogue.textContent = lang.drink_success;
         dialogue.style.color = "#3498db"; // Mavi
     } else {
		 window.showAlert(lang.drink_fail);
         //dialogue.textContent = lang.drink_fail;
         //dialogue.style.color = "#ff4d4d"; // Kırmızı
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

    // Effective Stats'tan güncel Max HP'yi alalım
    const effective = typeof getHeroEffectiveStats === 'function' ? getHeroEffectiveStats() : { maxHp: hero.maxHp, maxRage: hero.maxRage };

    hpDisplays.forEach(el => el.textContent = `${hero.hp}/${effective.maxHp}`);
    rageDisplays.forEach(el => el.textContent = `${hero.rage}/${effective.maxRage}`); // maxRage fix
    goldDisplays.forEach(el => el.textContent = hero.gold);
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

window.triggerRandomEvent = function() {
    if (isEventProcessing) return;
    
    updateNPCStatsDisplay();
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
	
	// --- YENİ: KAYNAK ETİKETİNİ HAZIRLA ---
    const classRules = CLASS_CONFIG[hero.class];
    const resourceLabel = lang[`resource_${classRules.resourceName}`];
    // --------------------------------------
    
    switchScreen(eventScreen);
    
    // UI Sıfırlama
    document.getElementById('event-main-area').classList.remove('hidden');
    document.getElementById('event-result-area').classList.add('hidden');
    const container = document.getElementById('event-choices-container');
    container.innerHTML = ''; 

    // --- KRİTİK DEĞİŞİKLİK: ÖNCEDEN ATANMIŞ EVENT VAR MI? ---
    const currentNode = GAME_MAP.nodes.find(n => n.id === GAME_MAP.currentNodeId);
    let evt;

    if (currentNode && currentNode.eventId) {
        // Scout tarafından belirlenmiş olayı çek
        evt = EVENT_POOL.find(e => e.id === currentNode.eventId);
    } 
    
    // Eğer Scout belirlenmemişse (Scout tutulmadıysa) rastgele seç
    if (!evt) {
        evt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
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
            opt.action(hero); 
            
            // 3. UI'ı Güncelle
            updateStats();
            updateNPCStatsDisplay();
            
            // 4. Sonuç Ekranını Göster
            const resultArea = document.getElementById('event-result-area');
            const resultTextEl = document.getElementById('event-result-text');
			
			// Sonuç metnini de filtrele
            let finalBtnText = btnText; 
            
            resultTextEl.innerHTML = `
                <span style="color:#ffd700; font-size:1.4em;">${btnText}</span>
                <br><br>
                <span style="color:#fff;">${lang.event_applied_msg}</span>
            `;
            
            resultArea.classList.remove('hidden');
            
            // Kaydet ve Kilidi bir sonraki oda için hazırla
            if(window.saveGame) window.saveGame();
            isEventProcessing = false; 
        };
        container.appendChild(b);
    };

    createBtn(evt.option1, 'opt1');
    createBtn(evt.option2, 'opt2');
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