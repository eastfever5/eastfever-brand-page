class ModalManager {
    constructor() {
        this.modal = document.getElementById('privacy-modal');
        this.modalBody = document.getElementById('privacy-content');
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

    open() {
        const lang = window.efI18n.getLang();
        const data = window.dataLoader.getData();
        if (data && data.privacy && data.privacy[lang]) {
            // Simple markdown-to-html (coarse)
            const content = data.privacy[lang].replace(/### (.*)/g, '<h3>$1</h3>')
                                             .replace(/## (.*)/g, '<h2>$1</h2>')
                                             .replace(/\n/g, '<br>');
            this.modalBody.innerHTML = content;
        }
        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }

    close() {
        this.modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

window.modalManager = new ModalManager();
