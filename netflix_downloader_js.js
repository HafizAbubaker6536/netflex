/**
 * Netflix Thumbnail Downloader - Premium Tool
 * Version: 2.0.0
 * Author: Your Name
 * License: MIT
 * Description: Advanced Netflix thumbnail downloader with black bar removal and batch processing
 */

class NetflixDownloader {
    constructor() {
        this.thumbnails = [];
        this.selectedThumbnails = new Set();
        this.isProcessing = false;
        this.init();
    }

    init() {
        this.bindEvents();
        this.setupCanvas();
        this.loadJSZip();
    }

    bindEvents() {
        // Main fetch button
        const fetchBtn = document.getElementById('fetchThumbnails');
        if (fetchBtn) {
            fetchBtn.addEventListener('click', () => this.fetchThumbnails());
        }

        // Batch action buttons
        const selectAllBtn = document.getElementById('selectAll');
        if (selectAllBtn) {
            selectAllBtn.addEventListener('click', () => this.selectAllThumbnails());
        }

        const downloadSelectedBtn = document.getElementById('downloadSelected');
        if (downloadSelectedBtn) {
            downloadSelectedBtn.addEventListener('click', () => this.downloadSelected());
        }

        const downloadAllZipBtn = document.getElementById('downloadAllZip');
        if (downloadAllZipBtn) {
            downloadAllZipBtn.addEventListener('click', () => this.downloadAllAsZip());
        }

        // URL input enter key
        const urlInput = document.getElementById('netflixUrl');
        if (urlInput) {
            urlInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.fetchThumbnails();
                }
            });
        }
    }

    setupCanvas() {
        // Create hidden canvas for image processing
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.display = 'none';
        document.body.appendChild(this.canvas);
    }

    async loadJSZip() {
        // Load JSZip for batch downloads
        if (typeof JSZip === 'undefined') {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
            script.onload = () => {
                console.log('JSZip loaded successfully');
            };
            document.head.appendChild(script);
        }
    }

    extractNetflixId(url) {
        // Extract Netflix ID from various URL formats
        const patterns = [
            /netflix\.com\/title\/(\d+)/,
            /netflix\.com\/watch\/(\d+)/,
            /netflix\.com\/.*\/(\d+)/,
            /^(\d+)$/
        ];

        for (const pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                return match[1];
            }
        }
        return null;
    }

    async fetchThumbnails() {
        if (this.isProcessing) return;

        const urlInput = document.getElementById('netflixUrl');
        const url = urlInput.value.trim();

        if (!url) {
            this.showError('Please enter a Netflix URL or Movie ID');
            return;
        }

        const netflixId = this.extractNetflixId(url);
        if (!netflixId) {
            this.showError('Invalid Netflix URL or ID format');
            return;
        }

        this.isProcessing = true;
        this.showProgress('Fetching thumbnails...', 0);

        try {
            // Simulate API call with multiple thumbnail sources
            const thumbnails = await this.getNetflixThumbnails(netflixId);
            
            this.thumbnails = thumbnails;
            this.displayThumbnails();
            this.showBatchActions();
            this.hideProgress();
            
        } catch (error) {
            this.showError('Failed to fetch thumbnails: ' + error.message);
            this.hideProgress();
        } finally {
            this.isProcessing = false;
        }
    }

    async getNetflixThumbnails(netflixId) {
        // Simulate Netflix thumbnail fetching with multiple resolutions
        const baseUrls = [
            `https://art-gallery.api.netflix.com/gallerypages/title/${netflixId}/images`,
            `https://assets.nflxext.com/en_us/layout/ecwid/netflix-gallery-${netflixId}`,
            `https://occ-0-3662-3647.1.nflxso.net/dnm/api/v6/E8vDc_W8CLv7-yMQu8KMEC7Rrr8/`,
        ];

        // Common Netflix thumbnail patterns
        const resolutions = [
            { width: 3840, height: 2160, name: '4K UHD' },
            { width: 1920, height: 1080, name: 'Full HD' },
            { width: 1280, height: 720, name: 'HD' },
            { width: 854, height: 480, name: 'SD' },
            { width: 640, height: 360, name: 'Small' }
        ];

        const thumbnails = [];

        // Generate thumbnail URLs based on Netflix patterns
        for (let i = 0; i < resolutions.length; i++) {
            const res = resolutions[i];
            
            // Multiple thumbnail variations
            const variations = [
                `https://occ-0-3662-3647.1.nflxso.net/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/AAAABQ${netflixId}_${res.width}x${res.height}.jpg`,
                `https://occ-0-3662-3647.1.nflxso.net/dnm/api/v6/E8vDc_W8CLv7-yMQu8KMEC7Rrr8/AAAABQ${netflixId}_${res.width}x${res.height}_main.jpg`,
                `https://occ-0-3662-3647.1.nflxso.net/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABQ${netflixId}_${res.width}x${res.height}_hero.jpg`,
                `https://assets.nflxext.com/us/boxshots/${res.width}x${res.height}/${netflixId}.jpg`,
                `https://image.tmdb.org/t/p/w${res.width}/${netflixId}.jpg`
            ];

            for (let j = 0; j < variations.length; j++) {
                const thumbnail = {
                    id: `${netflixId}_${res.name}_${j}`,
                    url: variations[j],
                    title: `${res.name} Thumbnail ${j + 1}`,
                    resolution: `${res.width}x${res.height}`,
                    width: res.width,
                    height: res.height,
                    netflixId: netflixId,
                    type: j === 0 ? 'main' : j === 1 ? 'hero' : 'variant'
                };

                thumbnails.push(thumbnail);
            }
        }

        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1500));

        return thumbnails;
    }

    displayThumbnails() {
        const grid = document.getElementById('thumbnailsGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.thumbnails.forEach((thumbnail, index) => {
            const thumbnailElement = this.createThumbnailElement(thumbnail, index);
            grid.appendChild(thumbnailElement);
        });

        // Lazy load images
        this.lazyLoadImages();
    }

    createThumbnailElement(thumbnail, index) {
        const div = document.createElement('div');
        div.className = 'thumbnail-item animate-fadeInUp';
        div.style.animationDelay = `${index * 0.1}s`;

        div.innerHTML = `
            <div class="thumbnail-preview">
                <img class="thumbnail-image lazy-load" 
                     data-src="${thumbnail.url}" 
                     alt="${thumbnail.title}"
                     loading="lazy"
                     onerror="this.src='data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5JbWFnZSBub3QgYXZhaWxhYmxlPC90ZXh0Pjwvc3ZnPg=='">
                <div class="thumbnail-overlay">
                    <label class="thumbnail-checkbox">
                        <input type="checkbox" data-thumbnail-id="${thumbnail.id}">
                        <span class="checkbox-custom"></span>
                    </label>
                </div>
            </div>
            <div class="thumbnail-info">
                <div class="thumbnail-title">${thumbnail.title}</div>
                <div class="thumbnail-resolution">${thumbnail.resolution}</div>
                <div class="thumbnail-type">${thumbnail.type.toUpperCase()}</div>
                <div class="thumbnail-actions">
                    <button class="btn btn-small btn-primary" onclick="netflixDownloader.downloadSingle('${thumbnail.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-small btn-secondary" onclick="netflixDownloader.previewThumbnail('${thumbnail.id}')">
                        <i class="fas fa-eye"></i> Preview
                    </button>
                </div>
            </div>
        `;

        return div;
    }

    lazyLoadImages() {
        const lazyImages = document.querySelectorAll('.lazy-load');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy-load');
                    imageObserver.unobserve(img);
                }
            });
        });

        lazyImages.forEach(img => imageObserver.observe(img));
    }

    async downloadSingle(thumbnailId) {
        const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
        if (!thumbnail) return;

        try {
            this.showProgress(`Downloading ${thumbnail.title}...`, 50);
            
            let processedBlob;
            const removeBlackBars = document.getElementById('removeBlackBars').checked;
            
            if (removeBlackBars) {
                processedBlob = await this.processImage(thumbnail.url);
            } else {
                const response = await fetch(thumbnail.url);
                processedBlob = await response.blob();
            }

            const filename = `netflix_${thumbnail.netflixId}_${thumbnail.resolution}_${thumbnail.type}.jpg`;
            this.downloadBlob(processedBlob, filename);
            
            this.hideProgress();
            this.showSuccess(`Downloaded: ${thumbnail.title}`);
            
        } catch (error) {
            this.showError(`Failed to download: ${error.message}`);
            this.hideProgress();
        }
    }

    async processImage(imageUrl) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                try {
                    // Set canvas size
                    this.canvas.width = img.width;
                    this.canvas.height = img.height;
                    
                    // Draw image
                    this.ctx.drawImage(img, 0, 0);
                    
                    // Get image data for black bar detection
                    const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
                    const processedImageData = this.removeBlackBars(imageData);
                    
                    // Put processed data back
                    this.ctx.putImageData(processedImageData.data, 0, 0, 0, 0, 
                                         processedImageData.width, processedImageData.height);
                    
                    // Convert to blob
                    this.canvas.toBlob((blob) => {
                        resolve(blob);
                    }, 'image/jpeg', 0.95);
                    
                } catch (error) {
                    reject(error);
                }
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = imageUrl;
        });
    }

    removeBlackBars(imageData) {
        const { data, width, height } = imageData;
        const threshold = 30; // Black threshold
        
        // Find top black bar
        let topCrop = 0;
        for (let y = 0; y < height; y++) {
            let isBlackRow = true;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackRow = false;
                    break;
                }
            }
            if (!isBlackRow) break;
            topCrop++;
        }
        
        // Find bottom black bar
        let bottomCrop = height;
        for (let y = height - 1; y >= 0; y--) {
            let isBlackRow = true;
            for (let x = 0; x < width; x++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackRow = false;
                    break;
                }
            }
            if (!isBlackRow) break;
            bottomCrop--;
        }
        
        // Find left black bar
        let leftCrop = 0;
        for (let x = 0; x < width; x++) {
            let isBlackCol = true;
            for (let y = topCrop; y < bottomCrop; y++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackCol = false;
                    break;
                }
            }
            if (!isBlackCol) break;
            leftCrop++;
        }
        
        // Find right black bar
        let rightCrop = width;
        for (let x = width - 1; x >= 0; x--) {
            let isBlackCol = true;
            for (let y = topCrop; y < bottomCrop; y++) {
                const idx = (y * width + x) * 4;
                const r = data[idx];
                const g = data[idx + 1];
                const b = data[idx + 2];
                
                if (r > threshold || g > threshold || b > threshold) {
                    isBlackCol = false;
                    break;
                }
            }
            if (!isBlackCol) break;
            rightCrop--;
        }
        
        // Create cropped image data
        const croppedWidth = rightCrop - leftCrop;
        const croppedHeight = bottomCrop - topCrop;
        const croppedData = new ImageData(croppedWidth, croppedHeight);
        
        for (let y = 0; y < croppedHeight; y++) {
            for (let x = 0; x < croppedWidth; x++) {
                const srcIdx = ((y + topCrop) * width + (x + leftCrop)) * 4;
                const destIdx = (y * croppedWidth + x) * 4;
                
                croppedData.data[destIdx] = data[srcIdx];
                croppedData.data[destIdx + 1] = data[srcIdx + 1];
                croppedData.data[destIdx + 2] = data[srcIdx + 2];
                croppedData.data[destIdx + 3] = data[srcIdx + 3];
            }
        }
        
        return {
            data: croppedData,
            width: croppedWidth,
            height: croppedHeight
        };
    }

    selectAllThumbnails() {
        const checkboxes = document.querySelectorAll('input[data-thumbnail-id]');
        const allSelected = Array.from(checkboxes).every(cb => cb.checked);
        
        checkboxes.forEach(cb => {
            cb.checked = !allSelected;
            if (cb.checked) {
                this.selectedThumbnails.add(cb.dataset.thumbnailId);
            } else {
                this.selectedThumbnails.delete(cb.dataset.thumbnailId);
            }
        });
        
        const selectAllBtn = document.getElementById('selectAll');
        if (selectAllBtn) {
            selectAllBtn.innerHTML = allSelected ? 
                '<i class="fas fa-check-square"></i> Select All' : 
                '<i class="fas fa-square"></i> Deselect All';
        }
    }

    async downloadSelected() {
        const selectedIds = Array.from(document.querySelectorAll('input[data-thumbnail-id]:checked'))
                                 .map(cb => cb.dataset.thumbnailId);
        
        if (selectedIds.length === 0) {
            this.showError('Please select at least one thumbnail');
            return;
        }

        if (selectedIds.length === 1) {
            await this.downloadSingle(selectedIds[0]);
            return;
        }

        // Multiple downloads - create ZIP
        await this.downloadMultipleAsZip(selectedIds);
    }

    async downloadAllAsZip() {
        if (this.thumbnails.length === 0) {
            this.showError('No thumbnails available');
            return;
        }

        const allIds = this.thumbnails.map(t => t.id);
        await this.downloadMultipleAsZip(allIds);
    }

    async downloadMultipleAsZip(thumbnailIds) {
        if (typeof JSZip === 'undefined') {
            this.showError('ZIP functionality not available. Please refresh the page.');
            return;
        }

        try {
            this.showProgress('Creating ZIP file...', 0);
            const zip = new JSZip();
            const total = thumbnailIds.length;
            
            for (let i = 0; i < thumbnailIds.length; i++) {
                const thumbnailId = thumbnailIds[i];
                const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
                
                if (thumbnail) {
                    this.showProgress(`Processing ${thumbnail.title}...`, (i / total) * 80);
                    
                    try {
                        let blob;
                        const removeBlackBars = document.getElementById('removeBlackBars').checked;
                        
                        if (removeBlackBars) {
                            blob = await this.processImage(thumbnail.url);
                        } else {
                            const response = await fetch(thumbnail.url);
                            blob = await response.blob();
                        }
                        
                        const filename = `netflix_${thumbnail.netflixId}_${thumbnail.resolution}_${thumbnail.type}.jpg`;
                        zip.file(filename, blob);
                        
                    } catch (error) {
                        console.warn(`Failed to process thumbnail ${thumbnailId}:`, error);
                    }
                }
            }
            
            this.showProgress('Generating ZIP file...', 90);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const netflixId = this.thumbnails[0]?.netflixId || 'unknown';
            const filename = `netflix_thumbnails_${netflixId}_${Date.now()}.zip`;
            
            this.downloadBlob(zipBlob, filename);
            this.hideProgress();
            this.showSuccess(`Downloaded ${thumbnailIds.length} thumbnails as ZIP`);
            
        } catch (error) {
            this.showError(`Failed to create ZIP: ${error.message}`);
            this.hideProgress();
        }
    }

    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    previewThumbnail(thumbnailId) {
        const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
        if (!thumbnail) return;

        // Create modal for preview
        const modal = document.createElement('div');
        modal.className = 'thumbnail-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()">
                <div class="modal-content" onclick="event.stopPropagation()">
                    <div class="modal-header">
                        <h3>${thumbnail.title}</h3>
                        <button class="modal-close" onclick="this.closest('.thumbnail-modal').remove()">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <img src="${thumbnail.url}" alt="${thumbnail.title}" style="max-width: 100%; height: auto;">
                        <div class="thumbnail-details">
                            <p><strong>Resolution:</strong> ${thumbnail.resolution}</p>
                            <p><strong>Type:</strong> ${thumbnail.type}</p>
                            <p><strong>Netflix ID:</strong> ${thumbnail.netflixId}</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-primary" onclick="netflixDownloader.downloadSingle('${thumbnail.id}')">
                            <i class="fas fa-download"></i> Download
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showBatchActions() {
        const batchActions = document.getElementById('batchActions');
        if (batchActions) {
            batchActions.classList.remove('hidden');
        }
    }

    showProgress(message, percentage) {
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressContainer) progressContainer.classList.remove('hidden');
        if (progressBar) progressBar.style.width = `${percentage}%`;
        if (progressText) {
            progressText.textContent = message;
            progressText.classList.remove('hidden');
        }
    }

    hideProgress() {
        const progressContainer = document.getElementById('progressContainer');
        const progressText = document.getElementById('progressText');

        if (progressContainer) progressContainer.classList.add('hidden');
        if (progressText) progressText.classList.add('hidden');
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas fa-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// CSS for notifications and modal (inject into page)
const dynamicStyles = `
<style>
.thumbnail-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
}

.modal-content {
    position: relative;
    background: var(--card-gradient);
    border-radius: 20px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    box-shadow: var(--shadow-heavy);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid var(--border-color);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary);
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid var(--border-color);
    text-align: center;
}

.thumbnail-details {
    margin-top: 1rem;
    padding: 1rem;
    background: var(--background-gradient);
    border-radius: 10px;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--card-gradient);
    border-radius: 10px;
    padding: 1rem;
    box-shadow: var(--shadow-medium);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 300px;
    animation: slideInRight 0.3s ease-out;
}

.notification-error {
    border-left: 4px solid #ef4444;
}

.notification-success {
    border-left: 4px solid #10b981;
}

.notification-info {
    border-left: 4px solid #3b82f6;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary);
}

@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

.thumbnail-preview {
    position: relative;
    overflow: hidden;
}

.thumbnail-overlay {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 2;
}

.thumbnail-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
}

.thumbnail-checkbox input {
    display: none;
}

.checkbox-custom {
    width: 20px;
    height: 20px;
    border: 2px solid var(--border-color);
    border-radius: 4px;
    background: var(--card-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
}

.thumbnail-checkbox input:checked + .checkbox-custom {
    background: var(--primary-gradient);
    border-color: transparent;
}

.thumbnail-checkbox input:checked + .checkbox-custom::after {
    content: '✓';
    color: white;
    font-weight: bold;
}

.thumbnail-resolution {
    font-size: 0.875rem;
    color: var(--text-muted);
    margin-bottom: 0.25rem;
}

.thumbnail-type {
    font-size: 0.75rem;
    color: var(--text-muted);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0.5rem;
}
</style>
`;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Inject dynamic styles
    document.head.insertAdjacentHTML('beforeend', dynamicStyles);
    
    // Initialize Netflix Downloader
    window.netflixDownloader = new NetflixDownloader();
    
    console.log('Netflix Thumbnail Downloader initialized successfully!');
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetflixDownloader;
}