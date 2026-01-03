// map_manager.js - FİNAL DÜZELTİLMİŞ SÜRÜM

const MAP_CONFIG = {
    totalStages: 15, 
    lanes: 3,        
    townStages: [4, 8, 12]
};
window.GAME_MAP = {
    nodes: [],      // Tüm düğümlerin listesi
    connections: [], // Hangi düğüm hangisine bağlı
    currentNodeId: null, // Oyuncunun şu anki konumu
    completedNodes: []   // Oyuncunun geçtiği düğümler
};


// --- HARİTA ÜRETİM (GENERATOR) ---
let enemiesByStage = {}; // Hangi stage'e hangi düşmanların atandığını tutar

function generateMap() {
	enemiesByStage = {};
    const mapContent = document.getElementById('map-content');
    const mapBg = document.getElementById('map-background');
    
    // --- ACT'E GÖRE GÖRSEL AYARI ---
    if (mapBg) {
        if (hero.currentAct === 2) {
            mapBg.src = "images/utils/map_background.webp"; // Act 2 harita resmi
        } else {
            mapBg.src = "images/utils//map_background.webp"; // Act 1 harita resmi
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

            if (nodeType === 'encounter' || nodeType === 'start') {
                const enemyData = getPreDeterminedEnemy(stage);
                node.enemyName = enemyData.name;
                node.isHard = enemyData.isHard; 
            }

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
    const rand = Math.random();
    let selectedPool = [];
    let isHard = false;

    // 1. HAVUZ BELİRLEME
    if (hero.currentAct === 1) {
        let baseTier = (stage < 5) ? 1 : (stage < 10 ? 2 : 3);
        if (rand < 0.80) {
            if (baseTier === 1) selectedPool = [...TIER_1_ENEMIES];
            else if (baseTier === 2) selectedPool = [...TIER_2_ENEMIES];
            else selectedPool = [...TIER_3_ENEMIES];
            isHard = false;
        } else {
            if (baseTier === 1) selectedPool = [...TIER_2_ENEMIES];
            else if (baseTier === 2) selectedPool = [...TIER_3_ENEMIES];
            else selectedPool = [...TIER_4_ENEMIES];
            isHard = true;
        }
    } else {
        selectedPool = hero.currentAct === 2 ? ["İskelet Şövalye", "Gulyabani", "Kemik Golemi"] : TIER_3_ENEMIES;
        isHard = rand > 0.8;
    }

    // 2. GELİŞMİŞ TEKRAR ENGELLEME (Stage Bazlı)
    // Bir önceki stage'de kullanılan düşmanları bul
    let forbiddenEnemies = enemiesByStage[stage - 1] || [];
    
    // Havuzdan yasaklı olanları çıkar
    let availableEnemies = selectedPool.filter(enemy => !forbiddenEnemies.includes(enemy));

    // Eğer havuz boşaldıysa (seçenek kalmadıysa) mecburen orijinal havuzu kullan
    if (availableEnemies.length === 0) availableEnemies = selectedPool;

    // Rastgele seçim yap
    const enemyName = availableEnemies[Math.floor(Math.random() * availableEnemies.length)];

    // 3. HAFIZAYA KAYDET (Bu stage'e bu düşman atandı de)
    if (!enemiesByStage[stage]) enemiesByStage[stage] = [];
    enemiesByStage[stage].push(enemyName);

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
	
	 // --- YENİ TEMİZLİK KISMI ---
    // Önce ekrandaki tüm eski düğümleri (butonları) sil
    const existingNodes = document.querySelectorAll('.map-node');
    existingNodes.forEach(n => n.remove());
    
    // Eski çizgileri (SVG) temizle
    clearTrails(); 
    // ---------------------------
    
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
        if (node.type === 'encounter') img.src = 'images/utils/skull_icon.webp';
        else if (node.type === 'town') img.src = 'images/utils/village_icon.webp';
        else if (node.type === 'choice') img.src = 'images/utils/choice_icon.webp';
        else if (node.type === 'boss') img.src = 'images/utils/skull_icon.webp';
        else if (node.type === 'city') img.src = 'images/utils/village_icon.webp';
        else if (node.type === 'start') img.src = 'images/utils/skull_icon.webp';
        
        btn.appendChild(img);
        btn.onclick = () => handleNodeClick(node);
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
             let enemy = node.enemyName;
             if (!enemy) enemy = "Goblin Devriyesi"; 
             document.getElementById('map-description').textContent = `Vahşi bir ${enemy} belirdi!`;
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