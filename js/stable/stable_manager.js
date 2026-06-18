// js/stable_manager.js

window.StableManager = {
    // 1. HIZLI AT KİRALA
    rentSwiftSteed: function() {
        const cost = 40;
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
		
		if (hero.gold < cost) {
        window.showAlert(lang.not_enough_msg);
        return;
		}

        if (hero.gold >= cost) {
            hero.gold -= cost;
            hero.mountedNodesLeft = 4;
            updateGoldUI();
			
			// --- YENİ: SATIN ALMA DURUMUNU KAYDET VE BUTONU GİZLE ---
            window.hasRentedInThisTown = true; 
            const btn = document.getElementById('btn-stable-master');
            if(btn) btn.classList.add('hidden');
            // -------------------------------------------------------
            
            // Pop-up'ı Göster
            this.showInfoPopup(lang.stable_steed_popup_title, lang.stable_steed_popup_text, "#ffd700");
            this.updateStableDialogue(lang.stable_steed_dialogue);
        } else {
            this.updateStableDialogue(lang.rest_fail);
        }
    },

    // 2. KEŞİF ULAĞI TUT
    hireScout: function() {
        const cost = 15;
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
		if (hero.gold < cost) { window.showAlert(lang.not_enough_msg); return; }

        if (hero.gold >= cost) {
            hero.gold -= cost;
            hero.scoutedNodesLeft = 3;

            // --- YENİ: KİRALAMA ANINDAKİ STAGE'İ KAYDET ---
            // Neden?: Raporun 3 oda boyunca hep aynı yerleri göstermesi için başlangıç noktasını çiviliyoruz.
            const currentNode = window.GAME_MAP.nodes.find(n => n.id === window.GAME_MAP.currentNodeId);
            hero.scoutStartStage = currentNode ? currentNode.stage : -1;
            // ----------------------------------------------

            updateGoldUI();
            // Butonun (Nav-bar) anında görünmesi için updateStats'ı tetikle
            if (typeof updateStats === 'function') updateStats(); 
            
            // Pop-up'ı Göster
            this.showInfoPopup(lang.stable_scout_popup_title, this.generateScoutReport(), "#00ccff");
            if (typeof renderMap === 'function') renderMap(); 
        } else {
            this.updateStableDialogue(lang.rest_fail);
        }
    },

    // 3. RAPOR OLUŞTURUCU
    generateScoutReport: function() {
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
        
        // --- YENİ: KAYITLI STAGE'İ KULLAN ---
        // Eğer scout tutulmuşsa kaydedilen stage'den başla, yoksa (hile vb) canlıstage kullan.
        const startStage = hero.scoutStartStage !== undefined ? hero.scoutStartStage : -1;

        let report = `<div style="text-align: left; font-family: 'Cinzel', serif;">`;

        for (let i = 1; i <= 3; i++) {
            const targetStage = startStage + i;
            const nodesInStage = window.GAME_MAP.nodes.filter(n => n.stage === targetStage);
            
            if (nodesInStage.length > 0) {
                report += `<div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 5px;">
                            <strong style="color: #ffd700;">${lang.scout_stage} ${targetStage + 1}:</strong><br>`;
                
                nodesInStage.forEach(node => {
            // 1. Ziyaret Edilme Kontrolü
            const isVisited = window.GAME_MAP.completedNodes.includes(node.id);
            const strikeStyle = isVisited ? "text-decoration: line-through; opacity: 0.5;" : "";

            let displayTitle = lang[`node_${node.type}`] || node.type;
            let color = isVisited ? "#777" : "#bbb"; 

            // --- 2. TIER VE VARYASYON ETİKETİ (GÜVENLİ YAZIM) ---
            let tierLabel = "";
            if (!isVisited && (node.type === 'encounter' || node.type === 'start')) {
                let tText = "T" + node.tier;
                if (node.isHalfTier) tText += ".5";
                if (node.isHard) tText += " <span style='color:#ff4d4d'>+25%</span>";
                if (node.isWeak) tText += " <span style='color:#43FF64'>-20%</span>";
                
                tierLabel = " <small style='color:#aaa;'>(" + tText + ")</small>";
            }
            // ---------------------------------------------------

            // Olay ve Düşman Belirleme (Mevcut mantık)
            if (node.type === 'choice') {
                if (!node.eventId) {
                    const randomEvt = EVENT_POOL[Math.floor(Math.random() * EVENT_POOL.length)];
                    node.eventId = randomEvt.id;
                }
                const eventData = lang.events[node.eventId];
                displayTitle = eventData ? eventData.title : node.eventId;
                if (!isVisited) color = "#3498db";
            }

            if (node.type === 'encounter') {
                const enemyName = lang.enemy_names[node.enemyName] || node.enemyName;
                displayTitle = enemyName;
                if (!isVisited) color = "#ff4d4d";
            }

            let biomeInfo = "";
            if (node.biome) {
                const biomeLabel = lang.items[`biome_${node.biome}`] || node.biome;
                biomeInfo = " <span style='color: " + (isVisited ? '#555' : '#43FF64') + "; font-size: 0.8em;'>(" + biomeLabel + ")</span>";
            }
            
            let roomEventInfo = "";
            const isCombat = (node.type === 'encounter' || node.type === 'boss' || node.type === 'start');
            if (isCombat) {
                const eventKey = node.roomEvent || "none";
                const eventLabel = lang.room_events["event_" + eventKey] || eventKey;
                roomEventInfo = " <span style='color: " + (isVisited ? '#555' : '#df9cff') + "; font-size: 0.8em;'>[" + eventLabel + "]</span>";
            }
            report += "<span style='font-size: 0.85em; margin-left: 10px; color: " + color + "; " + strikeStyle + "'>• " + displayTitle + tierLabel + biomeInfo + roomEventInfo + "</span><br>";
        });
                report += `</div>`;
            }
        }
        report += `</div>`;
        return report;
    },

    // 4. POP-UP GÖSTERİCİ
    showInfoPopup: function(title, content, color) {
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
    },

    // 5. DİALOG GÜNCELLEYİCİ
    updateStableDialogue: function(msg) {
        const diag = document.getElementById('stable-dialogue');
        if (diag) {
            diag.textContent = msg;
            diag.style.color = "#ffd700";
            setTimeout(() => {
                const currentLang = window.gameSettings.lang || 'tr';
                diag.textContent = window.LANGUAGES[currentLang].stable_hello;
                diag.style.color = "";
            }, 3000);
        }
    }
};
// --- EKLEME: ÜST BAR BUTONU İÇİN TETİKLEYİCİ ---
// index.html'deki butonun çalışması için bu global fonksiyon şarttır.
window.openScoutReport = function() {
    const lang = window.getCombatLang();
    window.showGameInfo(lang.scout_report_title, window.StableManager.generateScoutReport(), "#00ccff");
};