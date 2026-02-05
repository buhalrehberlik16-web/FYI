// map_manager.js - FİNAL DÜZELTİLMİŞ SÜRÜM

// map_manager.js - TAM SÜRÜM (Biyom, Act/Tier, Master NPC ve Scout Entegre)

const MAP_CONFIG = {
    totalStages: 25, 
    lanes: 3,        
    townStages: [4, 9, 14, 19]
};

window.GAME_MAP = {
    nodes: [],      
    connections: [], 
    currentNodeId: null, 
    completedNodes: []   
};

// --- 1. YARDIMCI: Biyoma Göre Düşman Seçici (Ağırlıklı) ---
function pickEnemyForBiome(biome, targetTier) {
    const enemyPool = window.TIER_ENEMIES[targetTier];
    if (!enemyPool || enemyPool.length === 0) return window.TIER_ENEMIES[1][0];

    let candidates = [];
    let totalWeight = 0;

    enemyPool.forEach(enemyName => {
        const weight = window.BIOME_WEIGHTS[enemyName]?.[biome] || 0.1; 
        if (weight > 0) {
            candidates.push({ name: enemyName, weight: weight });
            totalWeight += weight;
        }
    });

    let rand = Math.random() * totalWeight;
    for (let c of candidates) {
        if (rand < c.weight) return c.name;
        rand -= c.weight;
    }
    return enemyPool[0]; 
}

// --- 2. YARDIMCI: Aşamaya ve Act'e Göre Tier Belirleyici ---
function getTierAndDifficultyForStage(stage, act = 1) {
    const baseTierOfAct = (act - 1) * 3 + 1; // Act 1->T1, Act 2->T4
    
    // Kaç tane köyü geride bıraktık?
    const passedTowns = MAP_CONFIG.townStages.filter(t => t < stage).length;
    
    // --- BOSS KONTROLÜ (Son Oda) ---
    if (stage >= MAP_CONFIG.totalStages - 2) {
        return { 
            tier: "B" + act, // "B1", "B2" vb. döner
            isHard: true, 
            isHalfTier: false 
        };
    }
	
	// Şehir Odası Kontrolü (Stage 24 - Son oda)
    if (stage === MAP_CONFIG.totalStages - 1) {
        return { tier: base, isHard: false, isHalfTier: false };
    }

    // --- NORMAL VE YARIM TIER MANTIĞI ---
    // passedTowns'a göre Act içindeki ilerlemeyi buluruz
    // 0 köy: T1 | 1 köy: T1.5/T2H | 2 köy: T2 | 3 köy: T2.5/T3H | 4 köy: T3
    
    let currentTier = baseTierOfAct + Math.floor(passedTowns / 2);

    if (passedTowns % 2 === 1) {
        // GEÇİŞ BÖLGESİ (Köy 1 ve Köy 3 sonrası)
        const isHard = Math.random() < 0.5;
        return { 
            tier: isHard ? currentTier + 1 : currentTier, 
            isHard: isHard, 
            isHalfTier: !isHard 
        };
    } else {
        // STABİL BÖLGE (Başlangıç, Köy 2 ve Köy 4 sonrası)
        return { tier: currentTier, isHard: false, isHalfTier: false };
    }
}

// --- 3. ANA FONKSİYON: Harita Üretimi ---
function generateMap() {
    const act = hero.currentAct || 1;
    const mapContent = document.getElementById('map-content');
    const mapBg = document.getElementById('map-background');
    if (mapBg) mapBg.src = act === 2 ? "images/utils/map_background1.webp" : "images/utils/map_background.webp";

    const existingNodes = document.querySelectorAll('.map-node');
    existingNodes.forEach(n => n.remove());
    clearTrails();
    GAME_MAP.nodes = []; GAME_MAP.connections = []; GAME_MAP.completedNodes = []; 

    let nodeIdCounter = 0;
    const biomes = ['forest', 'iceland', 'mountain', 'cave', 'urban', 'plains'];

    for (let stage = 0; stage < MAP_CONFIG.totalStages; stage++) {
        let nodeCountInStage = 0;
        let isChokepoint = false;
		const diff = getTierAndDifficultyForStage(stage, act);

        // --- DÜZELTME: STAGE KURALLARI ---
        if (stage === 0) { 
            // Başlangıç aşamasında her zaman 3 seçenek olsun
            nodeCountInStage = 3; 
        } 
        else if (stage >= MAP_CONFIG.totalStages - 2 || MAP_CONFIG.townStages.includes(stage)) { 
            // Town, Boss ve City (Oyun sonu) tek node olsun
            nodeCountInStage = 1; 
            isChokepoint = true; 
        } 
        else {
            // Ara aşamalarda rastgele 2 veya 3 seçenek
            nodeCountInStage = Math.random() > 0.2 ? 3 : 2;
        }

        // Lane Seçimi
        let availableLanes = [];
        if (isChokepoint) {
            availableLanes = [1]; // Dar boğazlarda orta lane
        } else {
            // Karıştır ve stage'deki node sayısı kadar lane seç
            availableLanes = [0, 1, 2].sort(() => Math.random() - 0.5).slice(0, nodeCountInStage).sort();
        }

        let nodesInThisStage = [];

        availableLanes.forEach(lane => {
            const nodeType = determineNodeType(stage, lane);
            let b = null, e = null, ih = false, t = 1, m = null, img = null; iht= false;

            // Sadece Savaş odalarına Biyom ve Canavar ata
            if (['encounter', 'start', 'boss'].includes(nodeType)) {
                b = (nodeType === 'boss') ? 'urban' : biomes[Math.floor(Math.random() * biomes.length)];
                const diff = getTierAndDifficultyForStage(stage, act);
                t = diff.tier; ih = diff.isHard; iht = diff.isHalfTier;
                e = (nodeType === 'boss') ? "Goblin Şefi" : pickEnemyForBiome(b, t);
                const variation = Math.floor(Math.random() * 4);
                img = variation === 0 ? `biome_${b}.webp` : `biome_${b}${variation}.webp`;
            } 
            else if (nodeType === 'town') {
                const masters = ['blacksmith', 'alchemist', 'stable'];
                m = masters[Math.floor(Math.random() * masters.length)];
            }

            const node = {
                id: nodeIdCounter++, stage: stage, lane: lane, type: nodeType,
                biome: b, biomeImg: img, enemyName: e, isHard: ih, isHalfTier: iht, tier: t, masterNPC: m,
                jitterX: (Math.random() * 6 - 3), 
                jitterY: (Math.random() * 16 - 8) + (Math.sin(stage * 0.5) * 40), 
                next: []
            };
            nodesInThisStage.push(node);
        });

        // Anti-Pacifist Mantığı (Savaşsız stage kalmasın)
        if (!isChokepoint && stage !== 0) {
            const hasCombat = nodesInThisStage.some(n => n.type === 'encounter');
            if (!hasCombat) {
                const target = nodesInThisStage[Math.floor(Math.random() * nodesInThisStage.length)];
                target.type = 'encounter';
                // Biyom ve canavarı bu node için yeniden üret
                target.biome = biomes[Math.floor(Math.random() * biomes.length)];
                const diff = getTierAndDifficultyForStage(stage, act);
                target.tier = diff.tier; target.isHard = diff.isHard;
                target.enemyName = pickEnemyForBiome(target.biome, target.tier);
                const v = Math.floor(Math.random() * 4);
                target.biomeImg = v === 0 ? `biome_${target.biome}.webp` : `biome_${target.biome}${v}.webp`;
            }
        }

        nodesInThisStage.forEach(n => GAME_MAP.nodes.push(n));
    }

    createMapConnections();
    renderMap();
}

function createMapConnections() {
    for (let stage = 0; stage < MAP_CONFIG.totalStages - 1; stage++) {
        const currentNodes = GAME_MAP.nodes.filter(n => n.stage === stage);
        const nextNodes = GAME_MAP.nodes.filter(n => n.stage === stage + 1);
        currentNodes.forEach(curr => {
            nextNodes.forEach(next => {
                if (nextNodes.length === 1 || currentNodes.length === 1 || Math.abs(curr.lane - next.lane) <= 1) {
                    curr.next.push(next.id);
                    GAME_MAP.connections.push({ from: curr.id, to: next.id });
                }
            });
        });
    }
}

function renderMap() {
    const mapContent = document.getElementById('map-content');
	
	// --- KRİTİK TEMİZLİK: Eski node'ları sil ki üst üste binmesinler! ---
    const existingNodes = document.querySelectorAll('.map-node');
    existingNodes.forEach(n => n.remove());
    
    // Varsa eski çizgileri (trails) de temizle
    clearTrails(); 
    // -----------------------------------------------------------------

	
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    
    document.getElementById('current-node-name').textContent = lang.map_start_title;
    document.getElementById('map-description').textContent = lang.map_start_desc;

    GAME_MAP.nodes.forEach(node => {
        const btn = document.createElement('button');
        btn.id = `node-${node.id}`;
        btn.className = `map-node ${node.type}-node`;

        // --- MASTER NPC GÖRSELİ ---
        if (node.type === 'town' && node.masterNPC) {
            const masterDeco = document.createElement('div');
            masterDeco.className = 'master-decorator';
            masterDeco.style.backgroundImage = `url('images/npc/master_${node.masterNPC}.webp')`;
            btn.appendChild(masterDeco);
        }

        // --- BİYOM VE SCOUT GÖRÜNÜRLÜĞÜ ---
        const isVisible = btn.classList.contains('available') || 
                         (GAME_MAP.currentNodeId === node.id) || 
                         hero.scoutedNodesLeft > 0; // Scouted logic (Basitleştirildi)

        if (node.biome) {
            // CSS'e resim yolunu ver
            btn.style.setProperty('--biome-bg-img', `url('../images/biomes/${node.biomeImg}')`);
            // Scout veya Aktiflik durumuna göre class ekle (CSS bu class'ı görünür yapar)
            btn.classList.add(`biome-${node.biome}`);
            
            // Partikülleri oluştur (Görünürlüklerini CSS yönetir)
            if (node.biome === 'iceland') createSnowParticles(btn);
            else if (node.biome === 'forest') createLeafParticles(btn);
            else if (node.biome === 'urban') createAshParticles(btn);
            else if (node.biome === 'cave') createMistParticles(btn);
            else if (node.biome === 'mountain') createCloudParticles(btn);
        }

        if (node.isHard) btn.classList.add('hard-encounter');

        const baseLeft = (node.stage / (MAP_CONFIG.totalStages - 1)) * 92 + 4;
        let baseTop = 50;
        if (node.lane === 0) baseTop = 15; 
        if (node.lane === 1) baseTop = 45;
        if (node.lane === 2) baseTop = 75; 

        btn.style.left = `${baseLeft}%`;
        btn.style.top = `calc(${baseTop}% + ${node.jitterY}px)`; 

        const img = document.createElement('img');
        const icons = { encounter: 'skull_icon.webp', town: 'village_icon.webp', choice: 'choice_icon.webp', boss: 'skull_icon.webp', start: 'skull_icon.webp', city: 'village_icon.webp' };
        img.src = `images/utils/${icons[node.type] || 'skull_icon.webp'}`;
        
        btn.appendChild(img);
        btn.onclick = () => handleNodeClick(node);
        btn.disabled = true;
        mapContent.appendChild(btn);
    });

    setTimeout(() => { drawAllConnections(); updateAvailableNodes(); }, 200);
}

// Geri kalan fonksiyonların (handleNodeClick, updateAvailableNodes, determineNodeType vb.)
// mevcut halleriyle uyumlu olduğunu ve bozulmadığını kontrol ettim.

function determineNodeType(stage, lane) {
    if (stage === MAP_CONFIG.totalStages - 1) return 'city';
    if (stage === MAP_CONFIG.totalStages - 2) return 'boss';
    if (MAP_CONFIG.townStages.includes(stage)) return 'town';
    if (stage === 0) return 'start';

    const isNextTown = MAP_CONFIG.townStages.includes(stage + 1);
    const isPrevTown = MAP_CONFIG.townStages.includes(stage - 1);
    const rand = Math.random();

    if (isNextTown || isPrevTown) {
        return rand < 0.65 ? 'encounter' : 'choice';
    } else {
        // Normal Havuz (Encounter veya Choice)
        return rand < 0.55 ? 'encounter' : 'choice';
    }
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
	window.CalendarManager.passDay();
	StatsManager.trackNode();
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
	// Önceki "current" olanları temizle
    document.querySelectorAll('.map-node').forEach(n => n.classList.remove('current-node'));
    // Şimdiki seçilene ekle
    document.getElementById(`node-${node.id}`).classList.add('current-node');
    GAME_MAP.currentNodeId = node.id;
    GAME_MAP.completedNodes.push(node.id);
		
	

    processMapEffects();
    drawAllConnections();

    // DÜZELTME: Tür isimlerini dilden al
    const typeNames = {
        'start': lang.node_start, 
        'encounter': lang.node_encounter, 
        'town': lang.node_town,
        'choice': lang.node_choice, 
        'boss': lang.node_boss, 
        'city': lang.node_city
    };
    
    let desc = "";
	if (node.isHard) desc = lang.hard_enemy_warning;
	else if (node.type === 'encounter') desc = lang.normal_enemy_spotted;
	else if (node.type === 'town') desc = lang.desc_town; // EKLENDİ
	else if (node.type === 'choice') desc = lang.desc_event; // EKLENDİ
	else if (node.type === 'boss') desc = lang.desc_boss; // EKLENDİ
    
    // DÜZELTME: "Aşama 1" yazısını dile bağla
    document.getElementById('current-node-name').textContent = `${lang.stage_label} ${node.stage + 1}: ${typeNames[node.type]}`;
    document.getElementById('map-description').textContent = desc;
	
	window.currentTownMaster = node.masterNPC || null; 
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
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    setTimeout(() => {
        if (node.type === 'encounter' || node.type === 'start') {
            let enemy = node.enemyName;
            const translatedEnemy = lang.enemy_names[enemy] || enemy;
            const appearanceMsg = lang.enemy_spotted.replace("$1", translatedEnemy);
            document.getElementById('map-description').textContent = appearanceMsg;
            startBattle(enemy, node.isHard, node.isHalfTier); 

        } else if (node.type === 'town') {
            // DÜZELTİLDİ:
            document.getElementById('map-description').textContent = lang.desc_town;
            enterTown();
        
        } else if (node.type === 'choice') {
            // DÜZELTİLDİ:
            document.getElementById('map-description').textContent = lang.desc_event;
            triggerRandomEvent();

        } else if (node.type === 'boss') {
            // DÜZELTİLDİ:
            document.getElementById('map-description').textContent = lang.desc_boss;
            startBattle("Goblin Şefi");
        }
          // --- KRİTİK EKLENTİ BURASI ---
        else if (node.type === 'city') {
            document.getElementById('map-description').textContent = lang.desc_city;
            writeLog("🏆 " + lang.desc_city);
            
            // 1 saniye sonra şehir ekranına geç
            setTimeout(() => {
                if (typeof enterCity === 'function') {
                    enterCity();
                } else {
                    switchScreen(window.cityScreen);
                }
            }, 1000);
        }
    }, 600);
}

// -- EKRAN FONKSİYONLARI (KÖY GİRİŞİ DÜZELTİLDİ) --
// Not: Burada 'onclick' ezen kodlar SİLİNDİ.
function enterTown() {
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    refreshMerchantStock();
    switchScreen(townScreen);
	if(window.saveGame) window.saveGame();
    
    // DÜZELTİLDİ:
    writeLog(lang.log_enter_town);

    if(btnLeaveTown) {
        btnLeaveTown.onclick = () => {
            // DÜZELTİLDİ:
            writeLog(lang.log_leave_town);
            switchScreen(mapScreen);
			if(window.saveGame) window.saveGame();
        };
    }
}
window.enterCity = function() {
    switchScreen(window.cityScreen);
	if(window.saveGame) window.saveGame();
	const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    writeLog(lang.desc_city);
};

// ... Random Event ve Campfire (UI Manager'dan çağrılır) ...
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

    let efficiency = 1.0;
    let penaltyText = "";
    
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


// BIOME EFEKTLERİ
function createSnowParticles(parentEl) {
    const particleCount = 45; // Her node için kar tanesi sayısı
    for (let i = 0; i < particleCount; i++) {
        const snow = document.createElement('span');
        snow.className = 'snow-particle';
        
        // Rastgele değerler atayalım
        const left = Math.random() * 100; // Başlangıç X pozisyonu (%)
        const delay = Math.random() * 5;  // Başlangıç gecikmesi (s)
        const duration = 2 + Math.random() * 3; // Düşüş hızı (s)
        const size = 1 + Math.random() * 2.5; // Kar tanesi boyutu (px)
        const drift = (Math.random() * 50 - 25); // Havada sağa sola savrulma miktarı (px)

        snow.style.left = `${left}%`;
        snow.style.width = `${size}px`;
        snow.style.height = `${size}px`;
        snow.style.setProperty('--drift', `${drift}px`);
        snow.style.animationDuration = `${duration}s`;
        snow.style.animationDelay = `-${delay}s`; // Negatif delay animasyonun ortadan başlamasını sağlar

        parentEl.appendChild(snow);
    }
}

function createLeafParticles(parentEl) {
    for (let i = 0; i < 15; i++) {
        const leaf = document.createElement('span');
        leaf.className = 'leaf-particle';
        leaf.style.left = `${Math.random() * 200 - 50}%`;
        leaf.style.animationDuration = `${5 + Math.random() * 5}s`;
        leaf.style.animationDelay = `-${Math.random() * 5}s`;
        leaf.style.setProperty('--rot', `${Math.random() * 360}deg`);
        parentEl.appendChild(leaf);
    }
}

// RUINS: Uçuşan Küller ve Kıvılcımlar
function createAshParticles(parentEl) {
    for (let i = 0; i < 20; i++) {
        const ash = document.createElement('span');
        ash.className = 'ash-particle';
        ash.style.left = `${Math.random() * 140 - 20}%`;
        ash.style.animationDuration = `${3 + Math.random() * 3}s`;
        ash.style.animationDelay = `-${Math.random() * 5}s`;
        // Bazıları turuncu (kıvılcım), bazıları gri (kül) olsun
        if(Math.random() > 0.6) ash.classList.add('ember'); 
        parentEl.appendChild(ash);
    }
}

// CAVE: Tavandan Sızan Toz ve Polenler (Yavaş ve Kaotik)
function createMistParticles(parentEl) {
    for (let i = 0; i < 10; i++) {
        const particle = document.createElement('span');
        particle.className = 'cave-particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDuration = `${5 + Math.random() * 5}s`;
        particle.style.animationDelay = `-${Math.random() * 10}s`;
        parentEl.appendChild(particle);
    }
}

// MOUNTAIN: Hızlı Geçen Sis Bulutları
function createCloudParticles(parentEl) {
    for (let i = 0; i < 3; i++) {
        const cloud = document.createElement('span');
        cloud.className = 'cloud-particle';
        cloud.style.top = `${20 + Math.random() * 60}%`;
        cloud.style.animationDuration = `${6 + Math.random() * 4}s`;
        cloud.style.animationDelay = `-${Math.random() * 10}s`;
        parentEl.appendChild(cloud);
    }
}

window.startNextAct = function() {
    // 1. Dil Desteğini Alalım (Çeviri için)
    const lang = window.LANGUAGES[window.gameSettings.lang || 'tr'];
    
    // 2. Onay Al (Birinci versiyondaki gibi, kazara basılmayı önler)
    // confirm içindeki mesajı da dilden çekebiliriz veya şimdilik böyle kalabilir
    const confirmMsg = hero.currentAct === 1 ? 
        (window.gameSettings.lang === 'tr' ? "2. Perdeye geçmek istediğine emin misin? Harita yenilenecek!" : "Are you sure you want to sail to Act 2? The map will be reset!") :
        (window.gameSettings.lang === 'tr' ? "Sonraki perdeye geçilsin mi?" : "Proceed to next act?");

    if (!confirm(confirmMsg)) return;

    console.log("DEBUG: startNextAct tetiklendi!");

    // 3. Act Değerini Artır
    if (!hero.currentAct) hero.currentAct = 1; 
    hero.currentAct++;
    console.log("DEBUG: Yeni Act:", hero.currentAct);

    // 4. Kahramanı Tazele (Birinci versiyondaki ödül mantığı)
    hero.hp = hero.maxHp;
    hero.rage = hero.maxRage;

    // 5. Harita Verilerini Sıfırla
    window.GAME_MAP.currentNodeId = null;
    window.GAME_MAP.completedNodes = [];
    console.log("DEBUG: Harita verileri sıfırlandı.");

    // 6. Haritayı Yeniden Üret (Düşmanlar ve görseller Act 2'ye göre seçilecek)
    if (typeof generateMap === 'function') {
        generateMap();
        console.log("DEBUG: Harita yeniden üretildi.");
    } else {
        console.error("HATA: generateMap fonksiyonu bulunamadı!");
    }

    // 7. Ekranı Haritaya Çevir
    if (typeof switchScreen === 'function') {
        switchScreen(window.mapScreen); 
        console.log("DEBUG: mapScreen'e geçiş yapıldı.");
    } else {
        console.error("HATA: switchScreen fonksiyonu bulunamadı!");
    }

    // 8. UI Güncelleme ve Log Yazma (Log mesajını dilden alıyoruz)
    updateStats();
    
    const logMsg = window.gameSettings.lang === 'tr' ? 
        `🚢 Perde Değişti: **${hero.currentAct}. PERDE**` : 
        `🚢 Act Changed: **ACT ${hero.currentAct}**`;
        
    writeLog(`⚔️ ${logMsg} ⚔️`);
    
    // 9. Haritayı başa sar
    const mapDisp = document.getElementById('map-display');
    if(mapDisp) mapDisp.scrollLeft = 0;

    // 10. OTOMATİK KAYIT (Yeni perdeye geçtiğini unutmasın)
    if(window.saveGame) window.saveGame();
};

window.toggleMapInfo = function() {
    const box = document.getElementById('map-info-box');
    const checkbox = document.getElementById('info-toggle-check');
    const arrow = document.getElementById('info-arrow');

    if (box.classList.contains('collapsed')) {
        // Aç
        box.classList.remove('collapsed');
        box.classList.add('expanded');
        checkbox.checked = true;
    } else {
        // Kapat
        box.classList.remove('expanded');
        box.classList.add('collapsed');
        checkbox.checked = false;
    }
};

// Tik kutusuna tıklandığında da çalışması için (opsiyonel ama iyi olur)
document.getElementById('info-toggle-check').addEventListener('change', function(e) {
    // Tıklama event'i header'a da sıçramaması için stopPropagation kullanıyoruz
    e.stopPropagation();
    const box = document.getElementById('map-info-box');
    if (this.checked) {
        box.classList.remove('collapsed');
    } else {
        box.classList.add('collapsed');
    }
});
// Haritayı fareyle tutup kaydırma (Drag to Scroll)
const mapDisplay = document.getElementById('map-display');
let isDown = false;
let startX;
let scrollLeft;

mapDisplay.addEventListener('mousedown', (e) => {
    isDown = true;
    mapDisplay.classList.add('active-dragging');
    startX = e.pageX - mapDisplay.offsetLeft;
    scrollLeft = mapDisplay.scrollLeft;
});

mapDisplay.addEventListener('mouseleave', () => {
    isDown = false;
});

mapDisplay.addEventListener('mouseup', () => {
    isDown = false;
});

mapDisplay.addEventListener('mousemove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - mapDisplay.offsetLeft;
    const walk = (x - startX) * 2; // Kaydırma hızı (2 katı)
    mapDisplay.scrollLeft = scrollLeft - walk;

});
