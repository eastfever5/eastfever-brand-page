class App {
    constructor() {
        this.typingTimeout = null;
        this.init();
    }

    async init() {
        // 1. Data Load
        const data = await window.dataLoader.load();
        if (!data) return;

        // 2. i18n Initialization (handled by instance creation, but need updateUI)
        window.efI18n.updateUI();

        // 3. Force Component Rendering if not already done by i18n
        if (window.componentRenderer) {
            console.log('Main: Rendering components...');
            window.componentRenderer.renderMarquee();
            window.componentRenderer.renderServices();
            window.componentRenderer.renderSNS();
        } else {
            console.error('Main: componentRenderer not found!');
        }

        // 4. Event Listeners
        this.setupEventListeners();

        // 5. Analytics (Sentry)
        this.setupAnalytics();

        // 6. Visual Effects
        this.startTypingEffect();
    }

    setupAnalytics() {
        // 방문 로그 (언어 및 해상도 정보 포함)
        if (window.Sentry) {
            window.Sentry.captureMessage(`Page Visit: ${window.efI18n.getLang()}`, {
                level: 'info',
                extra: {
                    referrer: document.referrer,
                    resolution: `${window.screen.width}x${window.screen.height}`,
                    language: window.navigator.language
                }
            });
        }

        // 관심도 추적 (이벤트 위임 사용)
        document.addEventListener('click', (e) => {
            if (!window.Sentry) return;

            // 앱 방문 버튼 클릭
            const visitBtn = e.target.closest('.visit-btn');
            if (visitBtn) {
                const appId = visitBtn.dataset.id;
                const card = visitBtn.closest('.service-card');
                const appName = card ? card.querySelector('.service-name').textContent : 'Unknown';
                
                window.Sentry.captureMessage(`App Interest: ${appId}`, {
                    level: 'info',
                    tags: { 
                        action: 'click_visit', 
                        app_id: appId,
                        app_name: appName // 참고용 이름 유지
                    }
                });
                return;
            }

            // SNS 카드 클릭
            const snsCard = e.target.closest('.sns-card');
            if (snsCard) {
                const label = snsCard.querySelector('.sns-label').textContent;
                window.Sentry.captureMessage(`Connect Interest: ${label}`, {
                    level: 'info',
                    tags: { action: 'click_sns', sns_label: label }
                });
                return;
            }

            // 브랜드 로그(홈) 클릭
            if (e.target.closest('.logo-link')) {
                window.Sentry.captureMessage('Brand Logo Click', {
                    level: 'info',
                    tags: { action: 'click_home' }
                });
            }
        });
    }

    setupEventListeners() {
        // lang-selector logic moved to i18n.js
    }

    startTypingEffect() {
        const subTextElement = document.getElementById('hero-sub-text');
        if (!subTextElement) return;

        const lang = window.efI18n.getLang();
        const text = window.efI18n.t('hero.subText');
        
        if (this.typingTimeout) clearTimeout(this.typingTimeout);
        subTextElement.innerHTML = '';
        
        let i = 0;
        const type = () => {
            if (i < text.length) {
                // Check for <br>
                if (text.substring(i, i + 4) === '<br>') {
                    subTextElement.innerHTML += '<br>';
                    i += 4;
                } 
                // Check for &nbsp;
                else if (text.substring(i, i + 6) === '&nbsp;') {
                    subTextElement.innerHTML += '&nbsp;';
                    i += 6;
                }
                else {
                    subTextElement.innerHTML += text.charAt(i);
                    i++;
                }
                this.typingTimeout = setTimeout(type, 50);
            }
        };
        type();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.mainApp = new App();
});
