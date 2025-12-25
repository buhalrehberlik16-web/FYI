// js/ui/interaction_ui.js
window.openRewardScreen = function(rewards) {
    switchScreen(rewardScreen);
    let currentRewards = [...rewards];
    const render = () => {
        rewardList.innerHTML = '';
        currentRewards.forEach((r, i) => {
            const div = document.createElement('div'); div.className = 'reward-item';
            div.innerHTML = `<i class="fas fa-coins" style="color:#ffd700 !important; filter:none !important;"></i><span style="color:#fff !important;">${r.value} Altın</span>`;
            div.onclick = () => { hero.gold += r.value; updateGoldUI(); currentRewards.splice(i, 1); render(); };
            rewardList.appendChild(div);
        });
    };
    render();
    btnRewardContinue.onclick = () => { currentRewards.forEach(r => hero.gold += r.value); updateGoldUI(); switchScreen(mapScreen); };
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
    switchScreen(eventScreen); eventChoicesContainer.innerHTML = '';
    const evt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    eventTitle.textContent = evt.title; eventDesc.textContent = evt.desc;
    [evt.option1, evt.option2].forEach(opt => {
        const b = document.createElement('button'); b.className = 'event-btn';
        b.innerHTML = `<span class="choice-title">${opt.text}</span><span class="choice-detail buff">${opt.buff}</span><span class="choice-detail debuff">${opt.debuff}</span>`;
        b.onclick = () => { opt.action(hero); updateStats(); switchScreen(mapScreen); };
        eventChoicesContainer.appendChild(b);
    });
};

document.addEventListener('click', e => {
    if (e.target.classList.contains('close-npc')) e.target.closest('.npc-modal')?.classList.add('hidden');
    if (e.target.classList.contains('npc-modal')) e.target.classList.add('hidden');
});