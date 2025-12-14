// map_manager.js - NO CAMPFIRE ON MAP (ONLY EVENTS)

// --- HARİTA ÜRETİM (GENERATOR) ---

function generateMap() {
    const mapContent = document.getElementById('map-content');
    
    // Temizlik
    const existingNodes = document.querySelectorAll('.map-node');
    existingNodes.forEach(n => n.remove());
    clearTrails();

    GAME_MAP.nodes = [];
    GAME_MAP.connections = [];
    GAME_MAP.completedNodes = []; 

    let nodeIdCounter = 0;

    // 1. DÜĞÜMLERİ OLUŞTUR
    for (let stage = 0; stage < MAP_CONFIG.totalStages; stage++) {
        let nodeCountInStage = 0;
        let isChokepoint = false;

        // Stage Kuralları
        if (stage === 0) { 
            nodeCountInStage = 3; 
        } else if (stage === MAP_CONFIG.totalStages - 1) { 
            nodeCountInStage = 1; isChokepoint = true; // Şehir
        } else if (stage === MAP_CONFIG.totalStages - 2) { 
            nodeCountInStage = 1; isChokepoint = true; // Boss
        } else if (MAP_CONFIG.townStages.includes(stage)) { 
            nodeCountInStage = 1; isChokepoint = true; // Town
        } else {
            // Ara yollar
            nodeCountInStage = Math.random() > 0.2 ? 3 : 2;
        }

        // Lane Seçimi
        let availableLanes = [0, 1, 2];
        if (isChokepoint) {
            availableLanes = [1];
        } else {
            availableLanes.sort(() => Math.random() - 0.5);
            availableLanes = availableLanes.slice(0, nodeCountInStage);
            availableLanes.sort(); 
        }

        // --- İÇERİK BELİRLEME ---
        let nodesInThisStage = [];
        
        availableLanes.forEach(lane => {
            const nodeType = determineNodeType(stage, lane);
            
            // Jitter
            const jitterX = (Math.random() * 6 - 3); 
            const waveOffset = Math.sin(stage * 0.5) * 40; 
            const jitterY = (Math.random() * 16 - 8) + waveOffset; 

            const node = {
                id: nodeIdCounter++,
                stage: stage,
                lane: lane,
                type: nodeType,
                jitterX: jitterX,
                jitterY: jitterY,
                next: [],
                enemyName: null,
                isHard: false
            };

            // Düşman Belirleme (Eğer Savaşsa)
            if (nodeType === 'encounter' || nodeType === 'start') {
                const enemyData = getPreDeterminedEnemy(stage);
                node.enemyName = enemyData.name;
                node.isHard = enemyData.isHard; 
            }

            nodesInThisStage.push(node);
        });

        // Anti-Pacifist (Zorunlu Savaş)
        if (!isChokepoint && stage !== 0) {
            const hasCombat = nodesInThisStage.some(n => n.type === 'encounter');
            if (!hasCombat) {
                const randIndex = Math.floor(Math.random() * nodesInThisStage.length);
                const targetNode = nodesInThisStage[randIndex];
                
                targetNode.type = 'encounter';
                const enemyData = getPreDeterminedEnemy(stage);
                targetNode.enemyName = enemyData.name;
                targetNode.isHard = enemyData.isHard;
            }
        }

        nodesInThisStage.forEach(n => GAME_MAP.nodes.push(n));
    }

    // 2. BAĞLANTILARI OLUŞTUR
    for (let stage = 0; stage < MAP_CONFIG.totalStages - 1; stage++) {
        const currentNodes = GAME_MAP.nodes.filter(n => n.stage === stage);
        const nextNodes = GAME_MAP.nodes.filter(n => n.stage === stage + 1);

        currentNodes.forEach(current => {
            nextNodes.forEach(next => {
                const isNextChokepoint = (nextNodes.length === 1);
                const isCurrentChokepoint = (currentNodes.length === 1);
                
                if (isNextChokepoint || isCurrentChokepoint || Math.abs(current.lane - next.lane) <= 1) {
                    current.next.push(next.id);
                    GAME_MAP.connections.push({ from: current.id, to: next.id });
                }
            });
        });
    }

    renderMap();
    const marker = document.getElementById('player-marker-container');
    if(marker) marker.style.display = 'none';
}

// --- DÜŞMAN SEÇİMİ ---
function getPreDeterminedEnemy(stage) {
    const rand = Math.random();
    let selectedPool = [];
    let isHard = false;

    const town1 = MAP_CONFIG.townStages[0]; 
    const town2 = MAP_CONFIG.townStages[1]; 

    if (stage <= town1) {
        if (rand < 0.80) { selectedPool = TIER_1_ENEMIES; } 
        else { selectedPool = TIER_2_ENEMIES; isHard = true; }
    } else if (stage <= town2) {
        if (rand < 0.80) { selectedPool = TIER_2_ENEMIES; } 
        else { selectedPool = TIER_3_ENEMIES; isHard = true; }
    } else {
        selectedPool = TIER_3_ENEMIES;
        // Tier 4 eklersen buraya isHard koyabilirsin
        // Şimdilik T3'ler standart kabul ediliyor bu bölge için
        if (typeof TIER_4_ENEMIES !== 'undefined' && rand < 0.3) {
             selectedPool = TIER_4_ENEMIES;
             isHard = true;
        }
    }

    const enemyName = selectedPool[Math.floor(Math.random() * selectedPool.length)];
    return { name: enemyName, isHard: isHard };
}

// --- NODE TİPİ BELİRLEME (DÜZELTİLDİ) ---
function determineNodeType(stage, lane) {
    // Sabit Tipler
    if (stage === MAP_CONFIG.totalStages - 1) return 'city';
    if (stage === MAP_CONFIG.totalStages - 2) return 'boss';
    if (MAP_CONFIG.townStages.includes(stage)) return 'town';
    if (stage === 0) return 'start';

    // Köy Yakını Kontrolü
    const isNextTown = MAP_CONFIG.townStages.includes(stage + 1);
    const isPrevTown = MAP_CONFIG.townStages.includes(stage - 1);
    const rand = Math.random();

    if (isNextTown || isPrevTown) {
        // Köy dibinde %70 Savaş, %30 Choice
        return rand < 0.70 ? 'encounter' : 'choice';
    }

    // Geçmiş Kontrolü (Streak Breaker)
    const prevNode = GAME_MAP.nodes.find(n => n.stage === stage - 1 && n.lane === lane);
    const prevPrevNode = GAME_MAP.nodes.find(n => n.stage === stage - 2 && n.lane === lane);

    let combatChance = 0.60; // Standart %60 Savaş

    if (prevNode && prevNode.type === 'choice') {
        combatChance = 0.85; // Önceki Choice ise savaş ihtimali artar
        if (prevPrevNode && prevPrevNode.type === 'choice') {
            return 'encounter'; // 2 Choice üst üste geldiyse 3. kesin savaş
        }
    }

    // --- BURASI DEĞİŞTİ: Campfire Kaldırıldı ---
    // Artık sadece 'encounter' veya 'choice' dönebilir.
    return rand < combatChance ? 'encounter' : 'choice';
}

function renderMap() {
    const mapContent = document.getElementById('map-content');
    
    document.getElementById('current-node-name').textContent = "Maceraya Başla";
    document.getElementById('map-description').textContent = "Haritadan bir başlangıç noktası seç.";

    GAME_MAP.nodes.forEach(node => {
        const btn = document.createElement('button');
        btn.id = `node-${node.id}`;
        btn.className = `map-node ${node.type}-node`;
        
        if (node.isHard) {
            btn.classList.add('hard-encounter');
            btn.title = "Tehlikeli Düşman (Yüksek Ödül)"; 
        }

        const baseLeft = (node.stage / (MAP_CONFIG.totalStages - 1)) * 92 + 4;
        let baseTop = 50;
        if (node.lane === 0) baseTop = 15; 
        if (node.lane === 1) baseTop = 50;
        if (node.lane === 2) baseTop = 85; 

        btn.style.left = `calc(${baseLeft}% + ${node.jitterX}px)`;
        btn.style.top = `calc(${baseTop}% + ${node.jitterY}px)`; 

        const img = document.createElement('img');
        // İkon Seçimi (Campfire yok)
        if (node.type === 'encounter') img.src = 'images/skull_icon.png';
        else if (node.type === 'town') img.src = 'images/village_icon.png';
        else if (node.type === 'choice') img.src = 'images/choice_icon.png';
        else if (node.type === 'boss') img.src = 'images/skull_icon.png';
        else if (node.type === 'city') img.src = 'images/village_icon.png';
        else if (node.type === 'start') img.src = 'images/skull_icon.png';
        
        btn.appendChild(img);
        btn.onclick = () => handleNodeClick(node);
        btn.disabled = true;

        mapContent.appendChild(btn);
    });

    setTimeout(() => {
        drawAllConnections();
    }, 200);
    
    updateAvailableNodes();
}

// --- ÇİZGİ SİSTEMİ ---
function drawAllConnections() {
    clearTrails();
    if (GAME_MAP.completedNodes && GAME_MAP.completedNodes.length > 1) {
        for (let i = 0; i < GAME_MAP.completedNodes.length - 1; i++) {
            const fromId = GAME_MAP.completedNodes[i];
            const toId = GAME_MAP.completedNodes[i+1];
            drawTrail(fromId, toId, 'permanent');
        }
    }
    if (GAME_MAP.currentNodeId !== null) {
        const currentNode = GAME_MAP.nodes.find(n => n.id === GAME_MAP.currentNodeId);
        if (currentNode && currentNode.next) {
            currentNode.next.forEach(nextId => {
                drawTrail(currentNode.id, nextId, 'hint');
            });
        }
    }
}

function drawTrail(fromNodeId, toNodeId, type = 'permanent') {
    const fromEl = document.getElementById(`node-${fromNodeId}`);
    const toEl = document.getElementById(`node-${toNodeId}`);
    const svgLayer = document.getElementById('map-trails-layer');

    if (fromEl && toEl && svgLayer) {
        const x1 = fromEl.offsetLeft + fromEl.offsetWidth / 2;
        const y1 = fromEl.offsetTop + fromEl.offsetHeight / 2;
        const x2 = toEl.offsetLeft + toEl.offsetWidth / 2;
        const y2 = toEl.offsetTop + toEl.offsetHeight / 2;

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
        svgLayer.appendChild(line);
    }
}

function clearTrails() {
    const layer = document.getElementById('map-trails-layer');
    if(layer) layer.innerHTML = '';
}

// --- OYUNCU İLERLEME ---
function handleNodeClick(node) {
    GAME_MAP.currentNodeId = node.id;
    GAME_MAP.completedNodes.push(node.id);

    processMapEffects();
    drawAllConnections();

    const typeNames = {
        'start': 'Başlangıç', 'encounter': 'Düşman', 'town': 'Köy',
        'choice': 'Olay', 'boss': 'BOSS', 'city': 'Şehir'
    };
    
    let desc = "İlerleniyor...";
    if (node.isHard) desc = "⚠️ Güçlü bir düşman hissediyorsun!";
    else if (node.type === 'encounter') desc = "Düşman göründü.";
    
    document.getElementById('current-node-name').textContent = `Aşama ${node.stage + 1}: ${typeNames[node.type]}`;
    document.getElementById('map-description').textContent = desc;

    movePlayerMarkerToNode(node.id);
    updateAvailableNodes();
    triggerNodeAction(node);
}

function processMapEffects() {
    if (hero.mapEffects.length > 0) {
        hero.mapEffects.forEach(e => e.nodesLeft--);
        const expired = hero.mapEffects.filter(e => e.nodesLeft < 0);
        expired.forEach(e => {
            writeLog(`ℹ️ Harita Etkisi Bitti: ${e.name}`);
            if (e.id === 'map_hp_boost') {
                hero.maxHp -= e.val;
                hero.hp = Math.max(1, hero.hp - 30); 
                writeLog("Adrenalin etkisi geçti. (-30 HP).");
            }
        });
        hero.mapEffects = hero.mapEffects.filter(e => e.nodesLeft >= 0);
        updateStats(); 
    }
}

function movePlayerMarkerToNode(nodeId, isInstant = false) {
    const nodeElement = document.getElementById(`node-${nodeId}`);
    const markerContainer = document.getElementById('player-marker-container');
    const mapDisplay = document.getElementById('map-display');

    if (nodeElement && markerContainer) {
        markerContainer.style.display = 'block';
        
        const leftPos = nodeElement.offsetLeft + (nodeElement.offsetWidth / 2) - (markerContainer.offsetWidth / 2);
        const topPos = nodeElement.offsetTop + (nodeElement.offsetHeight / 2) - (markerContainer.offsetHeight / 2);
        
        if (isInstant) markerContainer.style.transition = 'none';
        else markerContainer.style.transition = 'left 0.5s, top 0.5s';
        
        markerContainer.style.left = `${leftPos}px`;
        markerContainer.style.top = `${topPos}px`;

        if (isInstant) setTimeout(() => { markerContainer.style.transition = 'left 0.5s, top 0.5s'; }, 50);

        const scrollTarget = leftPos - (mapDisplay.clientWidth / 2);
        mapDisplay.scrollTo({ left: scrollTarget, behavior: 'smooth' });
    }
}

function updateAvailableNodes() {
    const allBtns = document.querySelectorAll('.map-node');
    allBtns.forEach(b => {
        b.disabled = true; 
        b.classList.remove('available');
    });

    if (GAME_MAP.currentNodeId === null) {
        GAME_MAP.nodes.filter(n => n.stage === 0).forEach(node => {
            const btn = document.getElementById(`node-${node.id}`);
            if(btn) { btn.disabled = false; btn.classList.add('available'); }
        });
    } else {
        const currentNode = GAME_MAP.nodes.find(n => n.id === GAME_MAP.currentNodeId);
        if (currentNode) {
            currentNode.next.forEach(nextId => {
                const btn = document.getElementById(`node-${nextId}`);
                if(btn) { btn.disabled = false; btn.classList.add('available'); }
            });
            const currentBtn = document.getElementById(`node-${currentNode.id}`);
            if(currentBtn) currentBtn.classList.add('visited');
        }
    }
}

// --- AKSİYON TETİKLEME ---
function triggerNodeAction(node) {
    setTimeout(() => {
        if (node.type === 'encounter' || node.type === 'start') {
             // Önceden belirlenmiş düşmanı al
             let enemy = node.enemyName;
             if (!enemy) enemy = "Goblin Devriyesi"; // Fallback

             document.getElementById('map-description').textContent = `Vahşi bir ${enemy} belirdi!`;
             startBattle(enemy);

        } else if (node.type === 'town') {
            document.getElementById('map-description').textContent = "Güvenli bölge.";
            enterTown();
        
        // CAMPFIRE BURADA YOK (Çünkü node tipi olarak üretilmiyor)

        } else if (node.type === 'choice') {
            document.getElementById('map-description').textContent = "Karşına bir şey çıktı.";
            triggerRandomEvent();
        } else if (node.type === 'boss') {
            document.getElementById('map-description').textContent = "BÖLÜM SONU CANAVARI!";
            startBattle("Goblin Şefi");
        } else if (node.type === 'city') {
            alert("TEBRİKLER! Zindandan sağ salim çıktın.");
        }
    }, 600);
}

// -- EKRAN FONKSİYONLARI --

function enterTown() {
    switchScreen(townScreen);
    writeLog("🏰 Köye giriş yaptın.");
    if(btnLeaveTown) {
        btnLeaveTown.onclick = () => {
            writeLog("Köyden ayrıldın.");
            switchScreen(mapScreen);
        };
    }
    const buildings = document.querySelectorAll('.town-building');
    buildings.forEach(building => {
        building.onclick = () => {
            const buildingName = building.getAttribute('data-name');
            handleBuildingClick(building.id, buildingName);
        };
    });
}

function handleBuildingClick(buildingId, buildingName) {
    writeLog(`🏛️ ${buildingName} binasına tıkladın.`);
    if (buildingId === 'building-inn') {
        if (hero.gold >= 10) { }
    }
}

// Bu fonksiyon 'triggerRandomEvent' içinden veya özel durumlarda çağrılır.
// Harita üzerinde node olarak çağrılmaz.
function startCampfireEvent(node) {
    const screen = document.getElementById('campfire-screen');
    const optionsDiv = document.getElementById('campfire-options');
    const resultDiv = document.getElementById('campfire-result');
    switchScreen(screen);
    if(optionsDiv) { optionsDiv.classList.remove('hidden'); optionsDiv.style.display = 'flex'; }
    if(resultDiv) resultDiv.classList.add('hidden');
    
    const btnRest = document.getElementById('btn-camp-rest');
    const btnTrain = document.getElementById('btn-camp-train');
    const btnCont = document.getElementById('btn-camp-continue');

    // Node bilgisi varsa ceza kontrolü yap, yoksa normal kamp
    let efficiency = 1.0;
    let penaltyText = "";
    
    // node parametresi opsiyoneldir (Random eventten gelirse node olmayabilir)
    if (node && typeof hero.lastCampfireStage !== 'undefined' && (node.stage - hero.lastCampfireStage) <= 1) {
        efficiency = 0.3; 
        penaltyText = "<br><br><span style='color:#ff4d4d; font-weight:bold;'>⚠️ Daha yeni dinlendin! (%30 Etki)</span>";
    }
    
    if(node) hero.lastCampfireStage = node.stage;

    btnRest.onclick = () => {
        let baseHeal = (Math.random() < 0.75) ? Math.floor(Math.random() * 6) + 15 : Math.floor(Math.random() * 25) + 21;
        let finalHeal = Math.floor(baseHeal * efficiency); if(finalHeal < 1) finalHeal = 1;
        hero.hp = Math.min(hero.maxHp, hero.hp + finalHeal);
        updateStats(); 
        showCampfireResult("Dinlendin", `Ateşin başında uyudun ve **${finalHeal} HP** kazandın.${penaltyText}`);
    };

    btnTrain.onclick = () => {
        let baseXp = (Math.random() < 0.75) ? Math.floor(Math.random() * 101) + 100 : Math.floor(Math.random() * 800) + 201;
        let finalXp = Math.floor(baseXp * efficiency); if(finalXp < 1) finalXp = 1;
        gainXP(finalXp); 
        updateStats(); 
        showCampfireResult("Antrenman Yaptın", `Kılıç talimi yaptın ve **${finalXp} XP** kazandın!${penaltyText}`);
    };
    btnCont.onclick = () => switchScreen(mapScreen);
}

function showCampfireResult(title, text) {
    document.getElementById('campfire-options').style.display = 'none';
    const res = document.getElementById('campfire-result');
    res.classList.remove('hidden');
    document.getElementById('campfire-result-title').textContent = title;
    document.getElementById('campfire-result-text').innerHTML = text;
}

function triggerRandomEvent() {
    const eScreen = document.getElementById('event-screen');
    const eContainer = document.getElementById('event-choices-container');
    if (!eContainer) return;
    switchScreen(eScreen);
    eContainer.innerHTML = ''; 
    const evt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
    document.getElementById('event-title').textContent = evt.title;
    document.getElementById('event-desc').textContent = evt.desc;

    const createBtn = (opt) => {
        const btn = document.createElement('button');
        btn.className = 'event-btn';
        btn.innerHTML = `<span class="choice-title">${opt.text}</span><span class="choice-detail">${opt.buff}</span><span class="choice-detail">${opt.debuff}</span>`;
        btn.onclick = () => { opt.action(hero); updateStats(); writeLog(`Seçim: ${opt.text}`); switchScreen(mapScreen); };
        eContainer.appendChild(btn);
    };
    createBtn(evt.option1);
    if (evt.type === 'permanent' && Math.random() < 0.30) {
        const fleeBtn = document.createElement('button');
        fleeBtn.className = 'event-btn';
        fleeBtn.innerHTML = `<span class="choice-title">Korkup Kaç</span><span class="choice-detail debuff">-10 HP</span>`;
        fleeBtn.onclick = () => { hero.hp = Math.max(1, hero.hp - 10); updateStats(); writeLog("Kaçtın (-10 HP)."); switchScreen(mapScreen); };
        eContainer.appendChild(fleeBtn);
    } else { createBtn(evt.option2); }
}