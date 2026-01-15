// map_manager.js - FİNAL DÜZELTİLMİŞ SÜRÜM

const MAP_CONFIG = {
    totalStages: 25, 
    lanes: 3,        
    townStages: [4, 9, 14, 19]
};
window.GAME_MAP = {
    nodes: [],      // Tüm düğümlerin listesi
    connections: [], // Hangi düğüm hangisine bağlı
    currentNodeId: null, // Oyuncunun şu anki konumu
    completedNodes: []   // Oyuncunun geçtiği düğümler
};

// --- HARİTA ÜRETİM (GENERATOR) ---
let enemiesByStage = {}; // Hangi stage'e hangi düşmanların atandığını tutar

function pickBiomeBasedOnEnemy(enemyName) {
    const weights = window.BIOME_WEIGHTS[enemyName] || window.DEFAULT_BIOME_WEIGHTS;
    const rand = Math.random();
    let cumulative = 0;

    for (const [biome, chance] of Object.entries(weights)) {
        cumulative += chance;
        if (rand < cumulative) return biome;
    }
    return "plains"; // Fallback
}

function generateMap() {
	enemiesByStage = {};
    const mapContent = document.getElementById('map-content');
    const mapBg = document.getElementById('map-background');
	const mapDisp = document.getElementById('map-display');
    if (mapDisp) mapDisp.scrollLeft = 0; // Üretim anında başa sar
    
    // --- ACT'E GÖRE GÖRSEL AYARI ---
    if (mapBg) {
        if (hero.currentAct === 2) {
            mapBg.src = "images/utils/map_background.webp"; // Act 2 harita resmi
        } else {
            mapBg.src = "images/utils//map_background1.webp"; // Act 1 harita resmi
        }
    }

    
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
            
            // 1. Değişkenleri tertemiz başlatalım
            let nodeEnemy = null;
            let nodeIsHard = false;
            let nodeBiome = null; 
            let imgName = null;
			let masterNPC = null;
            
            // 2. SADECE Düşmanlı Node'lar için Biyom ve Resim atayalım
            if (nodeType === 'encounter' || nodeType === 'start' || nodeType === 'boss') {
                const enemyData = (nodeType === 'boss') ? { name: "Goblin Şefi", isHard: true } : getPreDeterminedEnemy(stage);
                nodeEnemy = enemyData.name;
                nodeIsHard = enemyData.isHard;

                // Biyom ve Resim ataması sadece bu if bloğu içinde kalmalı!
                nodeBiome = pickBiomeBasedOnEnemy(nodeEnemy);
                const variation = Math.floor(Math.random() * 4); 
                imgName = variation === 0 ? `biome_${nodeBiome}.webp` : `biome_${nodeBiome}${variation}.webp`;
            }
			
			if (nodeType === 'town') {
    const masters = ['blacksmith', 'alchemist', 'stable'];
    masterNPC = masters[Math.floor(Math.random() * masters.length)];
}

            // 3. Node objesini oluşturalım
            const node = {
                id: nodeIdCounter++,
                stage: stage,
                lane: lane,
                type: nodeType,
                biome: nodeBiome,     // Yukarıdaki if'e girmezse null kalır
                biomeImg: imgName,    // Yukarıdaki if'e girmezse null kalır
				masterNPC: masterNPC, 
                jitterX: (Math.random() * 6 - 3), 
                jitterY: (Math.random() * 16 - 8) + (Math.sin(stage * 0.5) * 40), 
                next: [],
                enemyName: nodeEnemy,
                isHard: nodeIsHard
            };

            nodesInThisStage.push(node);
        });

        // Anti-Pacifist
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

function getPreDeterminedEnemy(stage) {
    let pool = [];
    let isHard = false;
    let targetTier = 1;

    // --- BÖLGE MANTIĞI (Senin kurgun) ---

    // Bölge 1: İlk Town'a kadar (Stage 0-3) -> Sadece T1
    if (stage <= 3) {
        targetTier = 1;
        isHard = false;
    } 
    // Bölge 2: Town 1 ile Town 2 arası (Stage 5-7) -> T1 Normal, T2 Strong
    else if (stage > 4 && stage <= 7) {
        // %70 T1 (Normal), %30 T2 (Strong)
        targetTier = (Math.random() < 0.7) ? 1 : 2;
        isHard = (targetTier === 2);
    }
    // Bölge 3: Town 2 ile Town 3 arası (Stage 9-11) -> T2 Normal, T3 Strong
    else if (stage > 8 && stage <= 11) {
        // %70 T2 (Normal), %30 T3 (Strong)
        targetTier = (Math.random() < 0.7) ? 2 : 3;
        isHard = (targetTier === 3);
    }
    // Bölge 4: Town 3'ten sonrası (Stage 13-14) -> T3 Normal, T4 Elite/Boss
    else if (stage > 12) {
        targetTier = (Math.random() < 0.6) ? 3 : 4;
        isHard = (targetTier === 4);
    }

    // Act 2 ve sonrası için otomatik Tier artış sistemi (Opsiyonel Güvenlik)
    if (hero.currentAct > 1) {
        targetTier += (hero.currentAct - 1) * 3; // Her Act düşmanları +3 Tier kaydırır
    }

    // Seçilen Tier havuzundan rastgele düşman al
    const currentPool = TIER_ENEMIES[targetTier] || TIER_ENEMIES[1];
    
    // Eğer havuz boşsa bir alt havuza bak (Hata koruması)
    let selectedPool = currentPool.length > 0 ? currentPool : TIER_ENEMIES[1];
    
    const enemyName = selectedPool[Math.floor(Math.random() * selectedPool.length)];

    return { name: enemyName, isHard: isHard };
}

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

function renderMap() {
    const mapContent = document.getElementById('map-content');
	const lang = window.LANGUAGES[window.gameSettings.lang || 'tr']; // Dili al
    
    // Hardcoded yazıları dille değiştir
    document.getElementById('current-node-name').textContent = lang.map_start_title;
    document.getElementById('map-description').textContent = lang.map_start_desc;
	
	 // --- YENİ TEMİZLİK KISMI ---
    // Önce ekrandaki tüm eski düğümleri (butonları) sil
    const existingNodes = document.querySelectorAll('.map-node');
    existingNodes.forEach(n => n.remove());
    
    // Eski çizgileri (SVG) temizle
    clearTrails(); 
    // ---------------------------
    

    GAME_MAP.nodes.forEach(node => {
        const btn = document.createElement('button');
        btn.id = `node-${node.id}`;
        btn.className = `map-node ${node.type}-node biome-${node.biome}`;
		
		// --- MASTER NPC GÖRSELİ EKLEME (YENİ YÖNTEM) ---
    if (node.type === 'town' && node.masterNPC) {
        btn.classList.add(`master-${node.masterNPC}`);
        
        // Butonun içine ayrı bir dekorasyon div'i ekliyoruz
        const masterDeco = document.createElement('div');
        masterDeco.className = 'master-decorator';
        masterDeco.style.backgroundImage = `url('images/npc/master_${node.masterNPC}.webp')`;
        btn.appendChild(masterDeco);
    }
		
		// BİYOM KONTROLÜ: Sadece biyom varsa resim ve efekt ata
    if (node.biome) {
        btn.classList.add(`biome-${node.biome}`); // Klası şimdi ekle
        btn.style.setProperty('--biome-bg-img', `url('../images/biomes/${node.biomeImg}')`);
        
        // Partikülleri sadece biyom varsa oluştur
        if (node.biome === 'iceland') createSnowParticles(btn);
        else if (node.biome === 'forest') createLeafParticles(btn);
        else if (node.biome === 'urban') createAshParticles(btn);
        else if (node.biome === 'cave') createMistParticles(btn);
        else if (node.biome === 'mountain') createCloudParticles(btn);
    } else {
        // Biyom yoksa (Town, Choice, City) CSS değişkenini temizle
        btn.style.setProperty('--biome-bg-img', 'none');
    }
			
        if (GAME_MAP.currentNodeId === node.id) {
			btn.classList.add('current-node'); // Oyuncunun o an durduğu node
		}
		
		
        if (node.isHard) {
            btn.classList.add('hard-encounter');
            btn.title = "Tehlikeli Düşman (Yüksek Ödül)"; 
        }

        const baseLeft = (node.stage / (MAP_CONFIG.totalStages - 1)) * 92 + 4;
        let baseTop = 50;
        if (node.lane === 0) baseTop = 10; 
        if (node.lane === 1) baseTop = 40;
        if (node.lane === 2) baseTop = 75; 

        btn.style.left = `calc(${baseLeft}% + ${node.jitterX}px)`;
        btn.style.top = `calc(${baseTop}% + ${node.jitterY}px)`; 

        const img = document.createElement('img');
        if (node.type === 'encounter') img.src = 'images/utils/skull_icon.webp';
        else if (node.type === 'town') img.src = 'images/utils/village_icon.webp';
        else if (node.type === 'choice') img.src = 'images/utils/choice_icon.webp';
        else if (node.type === 'boss') img.src = 'images/utils/skull_icon.webp';
        else if (node.type === 'city') img.src = 'images/utils/village_icon.webp';
        else if (node.type === 'start') img.src = 'images/utils/skull_icon.webp';
        
        btn.appendChild(img);
        btn.onclick = () => handleNodeClick(node);
		// KEŞİF MEKANİĞİ: Eğer scoutedNodesLeft aktifse ve bu düğüm bir sonraki aşamalardaysa
const nodeDistance = node.stage - (GAME_MAP.currentNodeId !== null ? GAME_MAP.nodes.find(n=>n.id === GAME_MAP.currentNodeId).stage : -1);

if (hero.scoutedNodesLeft > 0 && nodeDistance <= hero.scoutedNodesLeft && nodeDistance > 0) {
    // Düğümün üzerine gelince içeriği göster
    let contentInfo = "";
    if (node.type === 'encounter') contentInfo = lang.enemy_names[node.enemyName] || node.enemyName;
    else if (node.type === 'choice') contentInfo = lang.node_choice;
    
    btn.title = `🔍 ${lang.scout_report}: ${contentInfo}`;
    btn.classList.add('scouted-node'); // CSS ile parlatabiliriz
}
        btn.disabled = true;

        mapContent.appendChild(btn);
    });

    setTimeout(() => {
        drawAllConnections();
		updateAvailableNodes();
    }, 200);
    
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
			if (node.type === 'encounter') StatsManager.trackMonster(node.enemyName);
            
            // Düşman ismini çeviriden al
            const translatedEnemy = lang.enemy_names[enemy] || enemy;
            
            // DÜZELTME: "Vahşi bir ... belirdi" yazısını dile bağla
            const appearanceMsg = lang.enemy_spotted.replace("$1", translatedEnemy);
            document.getElementById('map-description').textContent = appearanceMsg;

            startBattle(enemy);
         

        } else if (node.type === 'town') {
            document.getElementById('map-description').textContent = "Güvenli bölge.";
            enterTown();
        
        } else if (node.type === 'choice') {
            document.getElementById('map-description').textContent = "Karşına bir şey çıktı.";
            triggerRandomEvent();
        } else if (node.type === 'boss') {
            document.getElementById('map-description').textContent = "BÖLÜM SONU CANAVARI!";
            startBattle("Goblin Şefi");
        } else if (node.type === 'city') {
			writeLog("🏆 Tebriler! Büyük Eldoria şehrine ulaştın.");
			enterCity();
}
    }, 600);
}

// -- EKRAN FONKSİYONLARI (KÖY GİRİŞİ DÜZELTİLDİ) --
// Not: Burada 'onclick' ezen kodlar SİLİNDİ.
function enterTown() {
	window.saveGame();
	refreshMerchantStock();
    switchScreen(townScreen);
    writeLog("🏰 Köye giriş yaptın.");
    if(btnLeaveTown) {
        btnLeaveTown.onclick = () => {
            writeLog("Köyden ayrıldın.");
            switchScreen(mapScreen);
        };
    }
    // ARTIK BURADA BİNALARA CLICK EVENTİ ATAMIYORUZ. HTML'DEKİ ONCLICK ÇALIŞIYOR.
}
function enterCity() {
    switchScreen(cityScreen);
    // Şehre özel müzik veya efekt başlatılabilir
}

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