class ComponentRenderer {
    constructor() {
        this.webappList = document.getElementById('webapp-list');
        this.developingList = document.getElementById('developing-list');
        this.gameList = document.getElementById('game-list');
        this.snsList = document.getElementById('sns-list');
        this.marqueeBar = document.getElementById('marquee-bar');
    }

    renderMarquee() {
        if (!this.marqueeBar) return;
        const data = window.dataLoader.getData();
        const lang = window.efI18n.getLang();
        const keywords = data.keywords[lang] || [];
        
        this.marqueeBar.innerHTML = '';
        
        // Create a single set of keywords
        const createSet = () => {
            const div = document.createElement('div');
            div.className = 'marquee-content';
            keywords.forEach(keyword => {
                const span = document.createElement('span');
                span.className = 'keyword-tag';
                span.textContent = keyword;
                div.appendChild(span);
            });
            return div;
        };

        // Inject three sets for seamless loop and wide screen coverage
        this.marqueeBar.appendChild(createSet());
        this.marqueeBar.appendChild(createSet());
        this.marqueeBar.appendChild(createSet());
    }

    renderServices() {
        if (!this.webappList || !this.gameList) return;
        const data = window.dataLoader.getData();
        const lang = window.efI18n.getLang();
        
        this.webappList.innerHTML = '';
        if (this.developingList) this.developingList.innerHTML = '';
        this.gameList.innerHTML = '';

        data.services.forEach(service => {
            const card = this.createServiceCard(service, lang);
            if (service.type === 'webapp') {
                this.webappList.appendChild(card);
            } else if (service.type === 'developing' && this.developingList) {
                this.developingList.appendChild(card);
            } else if (service.type === 'game') {
                this.gameList.appendChild(card);
            }
        });
    }

    createServiceCard(service, lang) {
        const div = document.createElement('div');
        div.className = 'service-card';
        
        let typeLabel = '';
        if (service.type === 'webapp') {
            typeLabel = window.efI18n.t('sections.webapps') || 'Web App';
        } else if (service.type === 'developing') {
            typeLabel = window.efI18n.t('sections.developing') || 'In Development';
        } else {
            typeLabel = window.efI18n.t('sections.games') || 'Game';
        }
        
        const statusLabel = window.efI18n.t(`common.${service.status}`) || service.status;
        let visitLabel = window.efI18n.t('common.visit') || 'Visit';
        let buttonAttr = `href="${service.url}" target="_blank"`;

        if (service.type === 'developing') {
            visitLabel = window.efI18n.t('common.developing') || 'In Development';
            const devMsg = window.efI18n.t('common.dev_msg') || 'Coming Soon';
            buttonAttr = `href="javascript:void(0)" onclick="window.modalManager.open('${typeLabel}', '${devMsg.replace(/'/g, "\\'")}', 'developing')"`;
        }

        div.innerHTML = `
            <div class="thumb-container">
                <img src="${service.thumbnail}?v=19" alt="${service.name[lang]}" loading="lazy">
            </div>
            <div class="card-content">
                <div class="card-header">
                    <div class="card-tags">
                        <span class="badge badge-type">${typeLabel}</span>
                        ${service.type !== 'developing' ? `<span class="badge badge-status">${statusLabel}</span>` : ''}
                    </div>
                </div>
                <h3 class="service-name">${service.name[lang]}</h3>
                <p class="service-desc">${service.description[lang]}</p>
                <a ${buttonAttr} class="visit-btn ${service.type === 'developing' ? 'developing' : ''}">${visitLabel}</a>
            </div>
        `;
        return div;
    }

    renderSNS() {
        if (!this.snsList) return;
        const data = window.dataLoader.getData();
        
        this.snsList.innerHTML = '';
        data.sns.forEach(sns => {
            const card = document.createElement('a');
            card.href = sns.url;
            card.target = '_blank';
            card.className = 'sns-card';
            card.innerHTML = `
                <span class="sns-icon">${sns.icon}</span>
                <span class="sns-label">${sns.label}</span>
            `;
            this.snsList.appendChild(card);
        });
    }
}

window.componentRenderer = new ComponentRenderer();
