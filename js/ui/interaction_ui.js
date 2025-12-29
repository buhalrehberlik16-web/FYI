// js/ui/interaction_ui.js
window.openRewardScreen = function(rewards) {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];

    switchScreen(rewardScreen);
    const list = document.getElementById('reward-list');
    const btnContinue = document.getElementById('btn-reward-continue');
    list.innerHTML = '';
    
    rewards.forEach((reward, index) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'reward-item reward-gold'; // Altın sınıfı eklendi
        
        if (reward.type === 'gold') {
            itemDiv.innerHTML = `<i class="fas fa-coins" style="color:#ffd700;"></i><span>${reward.value} ${lang.gold_text}</span>`;
            itemDiv.onclick = () => {
                hero.gold += reward.value;
                updateGoldUI();
                itemDiv.style.opacity = '0';
                setTimeout(() => itemDiv.remove(), 200);
            };
        } 
        else if (reward.type === 'item') {
			itemDiv.className = 'reward-item reward-equipment'; // Eşya sınıfı eklendi
            const item = reward.value;
            // Daha önce yazdığımız getTranslatedItemName fonksiyonunu kullanıyoruz
            const itemName = getTranslatedItemName(item);
            
            itemDiv.innerHTML = `<img src="items/images/${item.icon}" class="reward-item-icon"><div class="reward-item-text"><span class="reward-item-name">${itemName}</span><span class="reward-item-tier">Tier ${item.tier}</span></div>`;
            
            itemDiv.onclick = () => {
                // Çantada boş yer var mı kontrol et
                const emptySlotIndex = hero.inventory.indexOf(null);
                
                if (emptySlotIndex !== -1) {
                    hero.inventory[emptySlotIndex] = item;
                    renderInventory();
                    writeLog(`🎁 ${itemName} ${currentLang === 'tr' ? 'çantaya eklendi.' : 'added to bag.'}`);
                    itemDiv.style.opacity = '0';
                    setTimeout(() => itemDiv.remove(), 200);
                } else {
                    alert(currentLang === 'tr' ? "Envanter dolu!" : "Inventory full!");
                }
            };
        }
        list.appendChild(itemDiv);
    });

    btnContinue.onclick = () => { switchScreen(mapScreen); };
};

window.openBuilding = function(type) {
    const m = document.getElementById(`modal-${type}`); if (m) { m.classList.remove('hidden'); writeLog(`${type.toUpperCase()} binasına girdin.`); }
};

window.restAtInn = function() {
    const cost = 10; const d = document.getElementById('inn-dialogue');
    if (hero.gold >= cost) { hero.gold -= cost; hero.hp = hero.maxHp; hero.rage = hero.maxRage; updateGoldUI(); updateStats(); d.textContent = "Mışıl mışıl uyudun!"; d.style.color = "#43FF64"; }
    else { d.textContent = "Paran yetmiyor!"; d.style.color = "#ff4d4d"; }
};

window.buyDrink = function() {
     const cost = 5; const d = document.getElementById('inn-dialogue');
     if (hero.gold >= cost) { hero.gold -= cost; hero.rage = Math.min(hero.maxRage, hero.rage + 10); updateGoldUI(); updateStats(); d.textContent = "Bira içtin. (+10 Rage)"; d.style.color = "#3498db"; }
     else { d.textContent = "Paran yoksa içki de yok!"; d.style.color = "#ff4d4d"; }
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

window.triggerRandomEvent = function() {
    const currentLang = window.gameSettings.lang || 'tr';
    const lang = window.LANGUAGES[currentLang];
    
    console.log("DEDEKTİF: Şu anki dil:", currentLang); // KONSOLDA GÖRÜRSÜN

    switchScreen(eventScreen);
    eventChoicesContainer.innerHTML = ''; 
    
    const evt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    const t = lang.events[evt.id];

    // Eğer çeviri bulunamazsa (Hata koruması)
    if (!t) {
        console.error("HATA: Çeviri dosyası bulunamadı! ID:", evt.id);
        eventTitle.textContent = evt.title;
        eventDesc.textContent = evt.desc;
    } else {
        eventTitle.textContent = t.title;
        eventDesc.textContent = t.desc;
    }

    const createBtn = (opt, optKey) => {
        const b = document.createElement('button');
        b.className = 'event-btn';
        
        // KRİTİK: Burası t[optKey] üzerinden dilden çekmeli!
        const btnText = t ? t[optKey] : opt.text;
        const bText = t ? t[optKey + "_b"] : "";
        const dText = t ? t[optKey + "_d"] : "";

        b.innerHTML = `<span class="choice-title">${btnText}</span>
                       <span class="choice-detail buff">${bText}</span>
                       <span class="choice-detail debuff">${dText}</span>`;
        
        b.onclick = () => { 
            opt.action(hero); 
            updateStats(); 
            switchScreen(mapScreen); 
            if(window.saveGame) window.saveGame();
        };
        eventChoicesContainer.appendChild(b);
    };

    createBtn(evt.option1, 'opt1');

    if (evt.type === 'permanent' && Math.random() < 0.30) {
        const fleeBtn = document.createElement('button');
        fleeBtn.className = 'event-btn';
        fleeBtn.innerHTML = `<span class="choice-title">${lang.events.flee_option}</span>
                             <span class="choice-detail debuff">${lang.events.flee_debuff}</span>`;
        fleeBtn.onclick = () => { 
            hero.hp = Math.max(1, hero.hp - 10); 
            updateStats(); 
            switchScreen(mapScreen); 
            if(window.saveGame) window.saveGame();
        };
        eventChoicesContainer.appendChild(fleeBtn);
    } else { 
        createBtn(evt.option2, 'opt2'); 
    }
};

document.addEventListener('click', e => {
    // Eğer tıklanan yer 'close-npc' sınıfına sahipse (Çıkış butonu) her türlü kapat
    if (e.target.classList.contains('close-npc')) {
        e.target.closest('.npc-modal')?.classList.add('hidden');
        return;
    }

    // Siyah arka plana tıklandığında kapatma mantığı
    if (e.target.classList.contains('npc-modal')) {
        // KRİTİK GÜNCELLEME: Eğer tıklanan modal 'transmute-screen' ise HİÇBİR ŞEY YAPMA
        if (e.target.id === 'transmute-screen') {
            console.log("Güvenlik: Eşyaların kaybolmaması için geri butonunu kullanmalısın.");
            return; 
        }
        
        // Diğer modalları (Han, Demirci vb.) dışarı tıklayarak kapatmaya devam edebilir
        e.target.classList.add('hidden');
    }
});