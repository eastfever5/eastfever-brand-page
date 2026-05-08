class ModalManager {
    constructor() {
        this.modal = document.getElementById('privacy-modal');
        this.modalBody = document.getElementById('privacy-content');
        this.modalIconArea = document.getElementById('modal-icon-area'); // 아이콘 영역 추가
        this.modalContent = this.modal ? this.modal.querySelector('.modal-content') : null;
        this.modalFooter = this.modal ? this.modal.querySelector('.modal-footer') : null;
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
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Escape' && this.modal && !this.modal.classList.contains('hidden')) {
                this.close();
            }
        });
    }

    open(title = null, content = null, type = 'info') {
        const modalTitle = document.getElementById('privacy-modal-title');
        const modalBody = document.getElementById('privacy-content');
        const lang = window.efI18n.getLang();
        this.resetModalState(type);
        
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

        this.show();
    }

    openServicePreview(service, lang = window.efI18n.getLang()) {
        if (!service || !service.preview) return;

        const modalTitle = document.getElementById('privacy-modal-title');
        const modalBody = document.getElementById('privacy-content');
        const title = this.getLocalizedText(service.name, lang, 'E-Fi-Board');

        this.resetModalState('preview');

        if (this.modalIconArea) this.modalIconArea.innerHTML = '';
        if (modalTitle) modalTitle.textContent = title;
        if (modalBody) {
            modalBody.innerHTML = this.createPreviewGalleryHTML(service, lang);
            this.bindPreviewGallery(modalBody);
        }

        this.show();
    }

    resetModalState(type) {
        if (this.modalContent) {
            this.modalContent.classList.toggle('preview-modal', type === 'preview');
        }
        if (this.modalFooter) {
            this.modalFooter.hidden = type === 'preview';
        }
        if (this.confirmBtn) {
            this.confirmBtn.style.background = '';
        }
        if (this.modalIconArea && type !== 'developing') {
            this.modalIconArea.innerHTML = '';
        }
    }

    createPreviewGalleryHTML(service, lang) {
        const preview = service.preview || {};
        const images = Array.isArray(preview.images) ? preview.images : [];
        const serviceName = this.getLocalizedText(service.name, lang, 'E-Fi-Board');
        const videoTitle = this.getLocalizedText(preview.videoTitle, lang, serviceName);
        const youtubeEmbedUrl = this.getYouTubeEmbedUrl(preview.youtubeUrl);
        const previousLabel = window.efI18n.t('common.previous') || 'Previous';
        const nextLabel = window.efI18n.t('common.next') || 'Next';
        const imageCards = images.map((src, index) => {
            const itemNumber = String(index + 1).padStart(2, '0');
            return `
                <article class="preview-card">
                    <span class="preview-index">${itemNumber}</span>
                    <img src="${this.escapeAttribute(src)}" alt="${this.escapeAttribute(`${serviceName} ${itemNumber}`)}" loading="lazy">
                </article>
            `;
        }).join('');
        const videoNumber = String(images.length + 1).padStart(2, '0');
        const videoCard = youtubeEmbedUrl ? `
            <article class="preview-card preview-video-card">
                <span class="preview-index">${videoNumber}</span>
                <div class="preview-video-frame">
                    <iframe
                        src="${this.escapeAttribute(youtubeEmbedUrl)}"
                        title="${this.escapeAttribute(videoTitle)}"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowfullscreen></iframe>
                </div>
            </article>
        ` : '';

        return `
            <div class="preview-gallery">
                <button type="button" class="preview-nav preview-nav-prev" data-preview-nav="prev" aria-label="${this.escapeAttribute(previousLabel)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M15.5 5L8.5 12l7 7"></path>
                    </svg>
                </button>
                <div class="preview-track" tabindex="0">
                    ${imageCards}
                    ${videoCard}
                </div>
                <button type="button" class="preview-nav preview-nav-next" data-preview-nav="next" aria-label="${this.escapeAttribute(nextLabel)}">
                    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                        <path d="M8.5 5l7 7-7 7"></path>
                    </svg>
                </button>
            </div>
        `;
    }

    bindPreviewGallery(container) {
        const track = container.querySelector('.preview-track');
        if (!track) return;

        container.querySelectorAll('[data-preview-nav]').forEach((button) => {
            button.addEventListener('click', () => {
                const direction = button.dataset.previewNav === 'next' ? 1 : -1;
                track.scrollBy({ left: direction * track.clientWidth * 0.9, behavior: 'smooth' });
            });
        });

        track.querySelectorAll('img').forEach((image) => {
            image.addEventListener('error', () => {
                const card = image.closest('.preview-card');
                if (card) card.classList.add('is-missing');
            });
        });
    }

    getYouTubeEmbedUrl(url) {
        if (!url) return '';
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname.includes('youtube.com')) {
                const videoId = parsedUrl.searchParams.get('v');
                if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            }
            if (parsedUrl.hostname.includes('youtu.be')) {
                const videoId = parsedUrl.pathname.replace('/', '');
                if (videoId) return `https://www.youtube.com/embed/${videoId}`;
            }
        } catch (error) {
            console.warn('Invalid YouTube URL:', error);
        }
        return url;
    }

    getLocalizedText(value, lang, fallback = '') {
        if (!value) return fallback;
        if (typeof value === 'string') return value;
        return value[lang] || value.ko || fallback;
    }

    escapeAttribute(value) {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    show() {
        if (!this.modal) return;

        this.modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';

        // 애니메이션 리셋을 위해 클래스 재부착 가능성 고려
        if (this.modalContent) {
            this.modalContent.style.animation = 'none';
            this.modalContent.offsetHeight; // force reflow
            this.modalContent.style.animation = '';
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
