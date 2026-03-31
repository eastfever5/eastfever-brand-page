class ModalManager {
    constructor() {
        this.modal = document.getElementById('privacy-modal');
        this.modalBody = document.getElementById('privacy-content');
        this.modalIconArea = document.getElementById('modal-icon-area'); // 아이콘 영역 추가
        this.openBtn = document.getElementById('privacy-btn');
        this.closeBtn = document.getElementById('modal-close');
        this.confirmBtn = document.getElementById('modal-confirm');
        this.overlay = this.modal ? this.modal.querySelector('.modal-overlay') : null;

        this.init();
    }

    init() {
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.open());
        }
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.close());
        }
        if (this.confirmBtn) {
            this.confirmBtn.addEventListener('click', () => this.close());
        }
        if (this.overlay) {
            this.overlay.addEventListener('click', () => this.close());
        }
    }

    open(title = null, content = null, type = 'info') {
        const modalTitle = document.getElementById('privacy-modal-title');
        const modalBody = document.getElementById('privacy-content');
        const lang = window.efI18n.getLang();
        
        // 아이콘 설정
        if (this.modalIconArea) {
            if (type === 'developing') {
                this.modalIconArea.innerHTML = `
                    <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation: spin 4s linear infinite;">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                    </svg>
                `;
                // 레드 테마 적용
                document.querySelector('.confirm-btn').style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
            } else {
                this.modalIconArea.innerHTML = ''; // 기본 정보형은 아이콘 생략 혹은 다른 아이콘
            }
        }

        if (title && content) {
            // 커스텀 메시지 팝업
            if (modalTitle) modalTitle.textContent = title;
            if (modalBody) modalBody.innerHTML = content.replace(/\n/g, '<br>');
        } else {
            // 기본 개인정보보호방침 로드
            const data = window.dataLoader.getData();
            if (modalTitle) modalTitle.textContent = window.efI18n.t('common.privacy');
            if (data && data.privacy && data.privacy[lang]) {
                const privacyText = data.privacy[lang].replace(/### (.*)/g, '<h3>$1</h3>')
                                                     .replace(/## (.*)/g, '<h2>$1</h2>')
                                                     .replace(/\n/g, '<br>');
                if (modalBody) modalBody.innerHTML = privacyText;
            }
        }
        
        if (this.modal) {
            this.modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
            
            // 애니메이션 리셋을 위해 클래스 재부착 가능성 고려
            const content = this.modal.querySelector('.modal-content');
            if (content) {
                content.style.animation = 'none';
                content.offsetHeight; // force reflow
                content.style.animation = '';
            }
        }
    }

    close() {
        if (this.modal) {
            this.modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
        }
    }
}

window.modalManager = new ModalManager();
