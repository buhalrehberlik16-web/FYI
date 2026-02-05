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
            
            // Pop-up'ı Göster
            this.showInfoPopup(lang.stable_steed_popup_title, lang.stable_steed_popup_text, "#ffd700");
            this.updateStableDialogue(lang.stable_steed_dialogue);
        } else {
            this.updateStableDialogue(lang.rest_fail);
        }
    },

    // 2. KEŞİF ULAĞI TUT
    hireScout: function() {
        const cost = 20;
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
		
		if (hero.gold < cost) {
        window.showAlert(lang.not_enough_msg);
        return;
		}

        if (hero.gold >= cost) {
            hero.gold -= cost;
            hero.scoutedNodesLeft = 3;
            updateGoldUI();
            
            // RAPOR OLUŞTURMA
            const reportHtml = this.generateScoutReport();
            
            // Pop-up'ı Göster
            this.showInfoPopup(lang.stable_scout_popup_title, reportHtml, "#00ccff");
            
            if (typeof renderMap === 'function') renderMap(); 
        } else {
            this.updateStableDialogue(lang.rest_fail);
        }
    },

    // 3. RAPOR OLUŞTURUCU
    generateScoutReport: function() {
        const currentLang = window.gameSettings.lang || 'tr';
        const lang = window.LANGUAGES[currentLang];
        
        const currentStage = (window.GAME_MAP && window.GAME_MAP.currentNodeId !== null) 
            ? window.GAME_MAP.nodes.find(n => n.id === window.GAME_MAP.currentNodeId).stage 
            : -1;

        let report = `<div style="text-align: left; font-family: 'Cinzel', serif;">`;

        for (let i = 1; i <= 3; i++) {
            const targetStage = currentStage + i;
            const nodesInStage = window.GAME_MAP.nodes.filter(n => n.stage === targetStage);
            
            if (nodesInStage.length > 0) {
                report += `<div style="margin-bottom: 10px; border-bottom: 1px solid #444; padding-bottom: 5px;">
                            <strong style="color: #ffd700;">${lang.scout_stage} ${targetStage + 1}:</strong><br>`;
                
                 nodesInStage.forEach(node => {
        let typeName = lang[`node_${node.type}`] || node.type;
        let biomeInfo = "";
        
        // Eğer biyom varsa raporun yanına ekle
        if (node.biome) {
            // "Biyom: Orman" gibi
            const biomeLabel = lang.items[`biome_${node.biome}`] || node.biome;
            biomeInfo = ` <span style="color: #43FF64; font-size: 0.9em;">(${biomeLabel})</span>`;
        }
                    let detail = "";
                    if (node.type === 'encounter') {
                        const enemyName = lang.enemy_names[node.enemyName] || node.enemyName;
                        detail = ` - <span style="color: #ff4d4d;">${enemyName}</span>`;
                    }
                    report += `<span style="font-size: 0.85em; margin-left: 10px; color: #bbb;">• ${typeName}${detail}</span><br>`;
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