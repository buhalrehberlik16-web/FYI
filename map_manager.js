// map_manager.js

function movePlayerMarkerToNode(nodeId, isInstant = false) {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const markerContainer = document.getElementById('player-marker-container');
    
    if (nodeElement && markerContainer) {
        const rect = nodeElement.getBoundingClientRect();
        const mapRect = mapDisplay.getBoundingClientRect();
        
        if (mapRect.width === 0) return;

        const leftPos = rect.left - mapRect.left + (rect.width / 2);
        const topPos = rect.top - mapRect.top + (rect.height / 2);
        
        if (isInstant) markerContainer.style.transition = 'none';
        else markerContainer.style.transition = 'left 0.5s, top 0.5s';
        
        markerContainer.style.left = `${leftPos}px`;
        markerContainer.style.top = `${topPos}px`;
        markerContainer.style.display = 'block';

        if (isInstant) setTimeout(() => { markerContainer.style.transition = 'left 0.5s, top 0.5s'; }, 50);
    }
}

function drawTrail(fromNodeId, toNodeId, type = 'permanent') {
    const fromEl = document.getElementById(`node-${fromNodeId}`);
    const toEl = document.getElementById(`node-${toNodeId}`);

    if (fromEl && toEl && mapTrailsLayer) {
        const mapRect = mapDisplay.getBoundingClientRect();
        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        if (mapRect.width === 0) return;

        const x1 = ((fromRect.left - mapRect.left + fromRect.width / 2) / mapRect.width) * 100 + "%";
        const y1 = ((fromRect.top - mapRect.top + fromRect.height / 2) / mapRect.height) * 100 + "%";
        const x2 = ((toRect.left - mapRect.left + toRect.width / 2) / mapRect.width) * 100 + "%";
        const y2 = ((toRect.top - mapRect.top + toRect.height / 2) / mapRect.height) * 100 + "%";

        const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
        line.setAttribute("x1", x1);
        line.setAttribute("y1", y1);
        line.setAttribute("x2", x2);
        line.setAttribute("y2", y2);
        
        if (type === 'hint') {
            line.setAttribute("class", "map-path-hint");
        } else {
            line.setAttribute("class", "map-trail-line");
        }
        
        mapTrailsLayer.appendChild(line);
    }
}

function clearHintTrails() {
    if (!mapTrailsLayer) return;
    const hints = mapTrailsLayer.querySelectorAll('.map-path-hint');
    hints.forEach(line => line.remove());
}

function clearTrails() {
    if (mapTrailsLayer) {
        mapTrailsLayer.innerHTML = '';
    }
}

function showAvailablePaths() {
    clearHintTrails();
    const currentNode = ACT_1_MAP.nodes[ACT_1_MAP.currentNodeId];
    if (currentNode && currentNode.next) {
        currentNode.next.forEach(nextId => {
            drawTrail(ACT_1_MAP.currentNodeId, nextId, 'hint');
        });
    }
}

function updateMapScreen() {
    const currentNode = ACT_1_MAP.nodes[ACT_1_MAP.currentNodeId];
    document.getElementById('current-node-name').textContent = `#${ACT_1_MAP.currentNodeId}: ${currentNode.type.toUpperCase()}`;
    document.getElementById('map-description').textContent = currentNode.text;
    mapActionButtons.innerHTML = '';

    const nodeButtons = mapDisplay.querySelectorAll('.map-node');
    nodeButtons.forEach(button => {
        const id = parseInt(button.id.split('-')[1]);
        button.disabled = true; button.classList.remove('available'); button.onclick = null;
        if (currentNode.next && currentNode.next.includes(id)) { 
            button.disabled = false; 
            button.classList.add('available'); 
            button.onclick = () => advanceMap(id); 
        }
    });
    showAvailablePaths();

    if (currentNode.type === 'town') {
        const restButton = document.createElement('button');
        restButton.innerHTML = '<i class="fas fa-bed"></i> Köyde Dinlen (Full HP)';
        restButton.onclick = () => {
            hero.hp = hero.maxHp; hero.rage = hero.maxRage; 
            writeLog(`Köyde dinlendin.`); updateStats();
            restButton.disabled = true; restButton.textContent = "Dinlenildi";
        };
        mapActionButtons.appendChild(restButton);
    }
}

function checkCurrentNodeAction() {
    const currentNode = ACT_1_MAP.nodes[ACT_1_MAP.currentNodeId];
    if (currentNode.type === 'encounter') {
        startBattle(currentNode.enemy); 
    } else if (currentNode.type === 'campfire') {
        startCampfireEvent();
    } else if (currentNode.type === 'choice') {
        triggerRandomEvent();
    } else if (currentNode.type === 'town') {
        updateMapScreen();
    }
}

// --- KRİTİK DÜZELTME BURADA: advanceMap ---
function advanceMap(nextNodeId) {
    const allNodes = document.querySelectorAll('.map-node');
    allNodes.forEach(btn => btn.disabled = true);

    clearHintTrails();
    const previousNodeId = ACT_1_MAP.currentNodeId;
    drawTrail(previousNodeId, nextNodeId, 'permanent');
    
    ACT_1_MAP.currentNodeId = nextNodeId;
    
    // DÜZELTME: Savaş İçi Buffları Temizle AMA 'waitForCombat' Olanları Koru!
    // Eğer bunu yapmazsak, Event'ten aldığımız buff savaşa giderken yolda silinir.
    hero.statusEffects = hero.statusEffects.filter(e => e.id.startsWith('map_') || e.waitForCombat === true);
    
    updateStats(); 

    // --- MAP EFFECTS GÜNCELLEME ---
    if (hero.mapEffects.length > 0) {
        hero.mapEffects.forEach(e => e.nodesLeft--);
        
        // Süresi Bitenleri Bul (< 0 ise bitmiştir)
        const expired = hero.mapEffects.filter(e => e.nodesLeft < 0);
        
        expired.forEach(e => {
            writeLog(`Harita Etkisi Bitti: ${e.name}`);
            if (e.id === 'map_hp_boost') {
                hero.maxHp -= e.val;
                hero.hp = Math.max(1, hero.hp - 30);
                writeLog("Adrenalin etkisi geçti. (-30 HP).");
                updateStats();
            }
        });

        // Listeyi temizle (0 olanlar kalsın, -1 olanlar gitsin)
        hero.mapEffects = hero.mapEffects.filter(e => e.nodesLeft >= 0);
    }

    movePlayerMarkerToNode(nextNodeId, false);
    setTimeout(() => {
        checkCurrentNodeAction();
    }, 500); 
}

function randomizeMap() {
    const nodesToRandomize = [2, 3, 4, 5, 6, 7, 8, 9];
    let contentDeck = [];
    contentDeck.push({ type: 'campfire', text: "Yol kenarında sönmüş bir ateş buldun." });
    contentDeck.push({ type: 'choice', text: "Gizemli bir geçit görüyorsun." });
    contentDeck.push({ type: 'choice', text: "Tuhaf bir anıt taşı." });
    
    while (contentDeck.length < nodesToRandomize.length) {
        const randEnemy = RANDOM_ENEMY_POOL[Math.floor(Math.random() * RANDOM_ENEMY_POOL.length)];
        contentDeck.push({ type: 'encounter', enemy: randEnemy, text: `Vahşi bir ${randEnemy} yolunu kesti!` });
    }

    for (let i = contentDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [contentDeck[i], contentDeck[j]] = [contentDeck[j], contentDeck[i]];
    }

    nodesToRandomize.forEach((nodeId, index) => {
        const content = contentDeck[index];
        const node = ACT_1_MAP.nodes[nodeId];
        if (!node) return;
        
        node.type = content.type; node.text = content.text;
        if (content.type === 'encounter') node.enemy = content.enemy; else delete node.enemy;
    });
    updateMapIcons();
}

function updateMapIcons() {
    const nodesToUpdate = [2, 3, 4, 5, 6, 7, 8, 9];
    nodesToUpdate.forEach(nodeId => {
        const nodeData = ACT_1_MAP.nodes[nodeId];
        const btn = document.getElementById(`node-${nodeId}`);
        if (!nodeData || !btn) return;
        
        const img = btn.querySelector('img');
        btn.className = 'map-node';
        if (nodeData.type === 'encounter') { btn.classList.add('encounter-node'); img.src = 'images/skull_icon.png'; }
        else if (nodeData.type === 'campfire') { btn.classList.add('campfire-node'); img.src = 'images/campfire_icon.png'; }
        else if (nodeData.type === 'choice') { btn.classList.add('choice-node'); img.src = 'images/choice_icon.png'; }
    });
}

function startCampfireEvent() {
    const screen = document.getElementById('campfire-screen');
    const optionsDiv = document.getElementById('campfire-options');
    const resultDiv = document.getElementById('campfire-result');

    switchScreen(screen);
    if(optionsDiv) { optionsDiv.classList.remove('hidden'); optionsDiv.style.display = 'flex'; }
    if(resultDiv) resultDiv.classList.add('hidden');
    
    const btnRest = document.getElementById('btn-camp-rest');
    const btnTrain = document.getElementById('btn-camp-train');
    const btnCont = document.getElementById('btn-camp-continue');

    // Event Listener temizleme ve yeniden atama
    btnRest.onclick = null; btnTrain.onclick = null; btnCont.onclick = null;

    btnRest.onclick = () => {
        let healAmount = (Math.random() < 0.75) ? Math.floor(Math.random() * 6) + 15 : Math.floor(Math.random() * 25) + 21;
        const oldHp = hero.hp; hero.hp = Math.min(hero.maxHp, hero.hp + healAmount);
        updateStats(); showCampfireResult("Dinlendin", `Ateşin başında uyudun ve **${hero.hp - oldHp} HP** kazandın.`);
    };

    btnTrain.onclick = () => {
        let xpGain = (Math.random() < 0.75) ? Math.floor(Math.random() * 101) + 100 : Math.floor(Math.random() * 800) + 201;
        gainXP(xpGain); updateStats(); showCampfireResult("Antrenman Yaptın", `Kılıç talimi yaptın ve **${xpGain} XP** kazandın!`);
    };

    btnCont.onclick = () => { 
        switchScreen(mapScreen); 
        updateMapScreen(); 
    };
}

function showCampfireResult(title, text) {
    document.getElementById('campfire-options').style.display = 'none';
    document.getElementById('campfire-result').classList.remove('hidden');
    document.getElementById('campfire-result-title').textContent = title;
    document.getElementById('campfire-result-text').innerHTML = text;
}

function triggerRandomEvent() {
    const eScreen = document.getElementById('event-screen');
    const eContainer = document.getElementById('event-choices-container');
    if (!eContainer) return;

    switchScreen(eScreen);
    eContainer.innerHTML = ''; 

    if (typeof EVENT_POOL === 'undefined') return;
    
    const evt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    
    document.getElementById('event-title').textContent = evt.title;
    document.getElementById('event-desc').textContent = evt.desc;

    const btn1 = document.createElement('button');
    btn1.className = 'event-btn';
    btn1.innerHTML = `<span class="choice-title">${evt.option1.text}</span>
                      <span class="choice-detail">${evt.option1.buff}</span>
                      <span class="choice-detail">${evt.option1.debuff}</span>`;
    btn1.onclick = () => {
        evt.option1.action(hero);
        updateStats();
        writeLog(`Seçim yapıldı: ${evt.option1.text}`);
        switchScreen(mapScreen); 
        updateMapScreen();
    };
    eContainer.appendChild(btn1);

    const btn2 = document.createElement('button');
    btn2.className = 'event-btn';

    let isFleeOption = false;
    if (evt.type === 'permanent' && Math.random() < 0.30) {
        isFleeOption = true;
    }

    if (isFleeOption) {
        btn2.innerHTML = `<span class="choice-title">Korkup Kaç</span>
                          <span class="choice-detail">Hiçbir şey yapma</span>
                          <span class="choice-detail debuff">-10 HP Kaybet</span>`;
        btn2.onclick = () => {
            hero.hp = Math.max(1, hero.hp - 10);
            updateStats();
            writeLog(`Korkup kaçtın (-10 HP).`);
            switchScreen(mapScreen); 
            updateMapScreen();
        };
    } else {
        btn2.innerHTML = `<span class="choice-title">${evt.option2.text}</span>
                          <span class="choice-detail">${evt.option2.buff}</span>
                          <span class="choice-detail">${evt.option2.debuff}</span>`;
        btn2.onclick = () => {
            evt.option2.action(hero);
            updateStats();
            writeLog(`Seçim yapıldı: ${evt.option2.text}`);
            switchScreen(mapScreen); 
            updateMapScreen();
        };
    }
    eContainer.appendChild(btn2);
}