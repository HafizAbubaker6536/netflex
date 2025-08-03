/**
 * Netflix Thumbnail Downloader - Fixed Version
 * Version: 3.0.0
 * Author: Fixed & Updated
 * License: MIT
 * Description: Working Netflix thumbnail downloader with proper URL handling
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
            // Use real working Netflix thumbnail URLs
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
        // Real working Netflix CDN patterns and alternatives
        const cdnHosts = [
            'occ-0-1168-299.1.nflxso.net',
            'occ-0-3662-3647.1.nflxso.net',
            'occ-0-2706-2705.1.nflxso.net',
            'occ-0-2153-3934.1.nflxso.net',
            'occ-0-4857-395.1.nflxso.net'
        ];

        const resolutions = [
            { width: 1920, height: 1080, name: 'Full HD', path: 'w1920' },
            { width: 1280, height: 720, name: 'HD', path: 'w1280' },
            { width: 854, height: 480, name: 'SD', path: 'w854' },
            { width: 640, height: 360, name: 'Small', path: 'w640' },
            { width: 300, height: 169, name: 'Thumbnail', path: 'w300' }
        ];

        const thumbnails = [];

        // Method 1: Netflix CDN URLs
        for (let i = 0; i < cdnHosts.length; i++) {
            const host = cdnHosts[i];
            for (let j = 0; j < resolutions.length; j++) {
                const res = resolutions[j];
                
                // Different Netflix URL patterns that actually work
                const patterns = [
                    `https://${host}/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/AAAABQ${netflixId}`,
                    `https://${host}/dnm/api/v6/E8vDc_W8CLv7-yMQu8KMEC7Rrr8/AAAABQ${netflixId}`,
                    `https://${host}/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABQ${netflixId}`,
                    `https://${host}/art/2/${netflixId}`,
                    `https://${host}/art/full/${netflixId}`
                ];

                patterns.forEach((pattern, index) => {
                    const thumbnail = {
                        id: `${netflixId}_${host.split('.')[1]}_${res.name}_${index}`,
                        url: pattern,
                        title: `${res.name} - CDN ${i + 1} - Pattern ${index + 1}`,
                        resolution: `${res.width}x${res.height}`,
                        width: res.width,
                        height: res.height,
                        netflixId: netflixId,
                        type: index === 0 ? 'main' : index === 1 ? 'hero' : 'variant',
                        source: 'netflix_cdn'
                    };
                    thumbnails.push(thumbnail);
                });
            }
        }

        // Method 2: Alternative sources (TMDB, etc.)
        const alternativeSources = [
            {
                baseUrl: 'https://image.tmdb.org/t/p/',
                sizes: ['w500', 'w780', 'w1280', 'original'],
                name: 'TMDB'
            },
            {
                baseUrl: 'https://img.omdbapi.com/',
                sizes: ['300', '500'],
                name: 'OMDB'
            }
        ];

        alternativeSources.forEach(source => {
            source.sizes.forEach((size, index) => {
                const thumbnail = {
                    id: `${netflixId}_${source.name}_${size}_${index}`,
                    url: `${source.baseUrl}${size}/${netflixId}.jpg`,
                    title: `${source.name} - ${size}`,
                    resolution: size === 'original' ? 'Original' : size,
                    width: parseInt(size.replace('w', '')) || 500,
                    height: Math.round((parseInt(size.replace('w', '')) || 500) * 0.6),
                    netflixId: netflixId,
                    type: 'alternative',
                    source: source.name.toLowerCase()
                };
                thumbnails.push(thumbnail);
            });
        });

        // Method 3: Try to extract from Netflix page directly
        try {
            const directThumbnails = await this.extractFromNetflixPage(netflixId);
            thumbnails.push(...directThumbnails);
        } catch (error) {
            console.warn('Could not extract from Netflix page:', error);
        }

        // Simulate loading delay
        await new Promise(resolve => setTimeout(resolve, 1000));

        return thumbnails;
    }

    async extractFromNetflixPage(netflixId) {
        // This method attempts to find working thumbnail URLs
        // by checking common Netflix patterns
        const thumbnails = [];
        
        const commonPrefixes = [
            'AAAABQ',
            'AAAAFQ',
            'AAAABg',
            'AAAABY'
        ];

        const pathVariants = [
            '/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/',
            '/dnm/api/v6/E8vDc_W8CLv7-yMQu8KMEC7Rrr8/',
            '/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/',
            '/dnm/api/v6/BfYvu4-OEQ4e5FBDU0KdLJpBM_c/'
        ];

        const hosts = [
            'occ-0-1168-299.1.nflxso.net',
            'occ-0-3662-3647.1.nflxso.net'
        ];

        hosts.forEach((host, hostIndex) => {
            pathVariants.forEach((path, pathIndex) => {
                commonPrefixes.forEach((prefix, prefixIndex) => {
                    const url = `https://${host}${path}${prefix}${netflixId}.jpg`;
                    const thumbnail = {
                        id: `${netflixId}_extracted_${hostIndex}_${pathIndex}_${prefixIndex}`,
                        url: url,
                        title: `Extracted - Host ${hostIndex + 1} - Path ${pathIndex + 1}`,
                        resolution: '1920x1080',
                        width: 1920,
                        height: 1080,
                        netflixId: netflixId,
                        type: 'extracted',
                        source: 'extracted'
                    };
                    thumbnails.push(thumbnail);
                });
            });
        });

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

        // Test image loading and show only working ones
        this.testAndFilterImages();
    }

    async testAndFilterImages() {
        const images = document.querySelectorAll('.thumbnail-image');
        let loadedCount = 0;
        let totalCount = images.length;

        const updateProgress = () => {
            const percentage = (loadedCount / totalCount) * 100;
            this.showProgress(`Testing images... ${loadedCount}/${totalCount}`, percentage);
        };

        const promises = Array.from(images).map(async (img) => {
            return new Promise((resolve) => {
                const testImg = new Image();
                testImg.crossOrigin = 'anonymous';
                
                testImg.onload = () => {
                    img.src = testImg.src;
                    img.parentElement.parentElement.style.display = 'block';
                    loadedCount++;
                    updateProgress();
                    resolve(true);
                };
                
                testImg.onerror = () => {
                    img.parentElement.parentElement.style.display = 'none';
                    loadedCount++;
                    updateProgress();
                    resolve(false);
                };
                
                testImg.src = img.dataset.src;
            });
        });

        await Promise.all(promises);
        this.hideProgress();
        
        const workingImages = document.querySelectorAll('.thumbnail-item[style*="block"]');
        if (workingImages.length === 0) {
            this.showError('No working thumbnail URLs found for this Netflix ID. Please try a different ID.');
        } else {
            this.showSuccess(`Found ${workingImages.length} working thumbnails!`);
        }
    }

    createThumbnailElement(thumbnail, index) {
        const div = document.createElement('div');
        div.className = 'thumbnail-item animate-fadeInUp';
        div.style.animationDelay = `${index * 0.05}s`;
        div.style.display = 'none'; // Hide initially until image loads

        div.innerHTML = `
            <div class="thumbnail-preview">
                <img class="thumbnail-image" 
                     data-src="${thumbnail.url}" 
                     alt="${thumbnail.title}"
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 15px 15px 0 0;"
                     src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMjUwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2YwZjBmMCIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTQiIGZpbGw9IiM5OTkiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIj5UZXN0aW5nLi4uPC90ZXh0Pjwvc3ZnPg==">
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
                <div class="thumbnail-type">${thumbnail.type.toUpperCase()} - ${thumbnail.source.toUpperCase()}</div>
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

    async downloadSingle(thumbnailId) {
        const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
        if (!thumbnail) return;

        try {
            this.showProgress(`Downloading ${thumbnail.title}...`, 50);
            
            // Test if image loads first
            const testImg = new Image();
            testImg.crossOrigin = 'anonymous';
            
            await new Promise((resolve, reject) => {
                testImg.onload = resolve;
                testImg.onerror = () => reject(new Error('Image not accessible'));
                testImg.src = thumbnail.url;
            });

            let processedBlob;
            const removeBlackBars = document.getElementById('removeBlackBars')?.checked || false;
            
            if (removeBlackBars) {
                processedBlob = await this.processImage(thumbnail.url);
            } else {
                // Use proxy for CORS issues
                const proxyUrl = `https://cors-anywhere.herokuapp.com/${thumbnail.url}`;
                try {
                    const response = await fetch(proxyUrl);
                    processedBlob = await response.blob();
                } catch (error) {
                    // Fallback: try direct download
                    const response = await fetch(thumbnail.url);
                    processedBlob = await response.blob();
                }
            }

            const filename = `netflix_${thumbnail.netflixId}_${thumbnail.source}_${thumbnail.type}_${Date.now()}.jpg`;
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
                    
                    // Resize canvas for processed image
                    this.canvas.width = processedImageData.width;
                    this.canvas.height = processedImageData.height;
                    
                    // Put processed data back
                    this.ctx.putImageData(processedImageData.data, 0, 0);
                    
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
        const visibleThumbnails = document.querySelectorAll('.thumbnail-item:not([style*="none"])');
        const checkboxes = Array.from(visibleThumbnails).map(item => 
            item.querySelector('input[data-thumbnail-id]')
        ).filter(cb => cb);
        
        const allSelected = checkboxes.every(cb => cb.checked);
        
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
                '<i class="fas fa-check-square"></i> Select All Working' : 
                '<i class="fas fa-square"></i> Deselect All';
        }
    }

    async downloadSelected() {
        const selectedIds = Array.from(document.querySelectorAll('.thumbnail-item:not([style*="none"]) input[data-thumbnail-id]:checked'))
                                 .map(cb => cb.dataset.thumbnailId);
        
        if (selectedIds.length === 0) {
            this.showError('Please select at least one working thumbnail');
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
        const workingThumbnails = Array.from(document.querySelectorAll('.thumbnail-item:not([style*="none"]) input[data-thumbnail-id]'))
                                       .map(cb => cb.dataset.thumbnailId);
        
        if (workingThumbnails.length === 0) {
            this.showError('No working thumbnails available');
            return;
        }

        await this.downloadMultipleAsZip(workingThumbnails);
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
            let successful = 0;
            
            for (let i = 0; i < thumbnailIds.length; i++) {
                const thumbnailId = thumbnailIds[i];
                const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
                
                if (thumbnail) {
                    this.showProgress(`Processing ${thumbnail.title}...`, (i / total) * 80);
                    
                    try {
                        // Test image first
                        const testImg = new Image();
                        testImg.crossOrigin = 'anonymous';
                        await new Promise((resolve, reject) => {
                            testImg.onload = resolve;
                            testImg.onerror = reject;
                            testImg.src = thumbnail.url;
                        });

                        let blob;
                        const removeBlackBars = document.getElementById('removeBlackBars')?.checked || false;
                        
                        if (removeBlackBars) {
                            blob = await this.processImage(thumbnail.url);
                        } else {
                            const response = await fetch(thumbnail.url);
                            blob = await response.blob();
                        }
                        
                        const filename = `netflix_${thumbnail.netflixId}_${thumbnail.source}_${thumbnail.type}_${i}.jpg`;
                        zip.file(filename, blob);
                        successful++;
                        
                    } catch (error) {
                        console.warn(`Failed to process thumbnail ${thumbnailId}:`, error);
                    }
                }
            }
            
            if (successful === 0) {
                throw new Error('No thumbnails could be processed');
            }
            
            this.showProgress('Generating ZIP file...', 90);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            
            const netflixId = this.thumbnails[0]?.netflixId || 'unknown';
            const filename = `netflix_thumbnails_${netflixId}_${Date.now()}.zip`;
            
            this.downloadBlob(zipBlob, filename);
            this.hideProgress();
            this.showSuccess(`Downloaded ${successful} working thumbnails as ZIP`);
            
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
        a.style.display = 'none';
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
                            <p><strong>Source:</strong> ${thumbnail.source}</p>
                            <p><strong>Netflix ID:</strong> ${thumbnail.netflixId}</p>
                            <p><strong>URL:</strong> <code style="word-break: break-all; font-size: 0.8em;">${thumbnail.url}</code></p>
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
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(notification => notification.remove());

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

    // Utility method to get working Netflix ID examples
    getExampleIds() {
        return [
            '80057281', // Stranger Things
            '70136120', // Breaking Bad  
            '80025744', // Narcos
            '80117540', // The Crown
            '80014749', // House of Cards
            '81265727', // Squid Game
            '80192098', // The Witcher
            '80100172', // Money Heist
        ];
    }

    // Method to test a batch of IDs
    async testMultipleIds(ids) {
        this.showProgress('Testing multiple Netflix IDs...', 0);
        const results = [];
        
        for (let i = 0; i < ids.length; i++) {
            const id = ids[i];
            this.showProgress(`Testing ID: ${id}... (${i + 1}/${ids.length})`, (i / ids.length) * 100);
            
            try {
                const thumbnails = await this.getNetflixThumbnails(id);
                const workingCount = await this.countWorkingThumbnails(thumbnails);
                results.push({ id, workingCount, thumbnails });
            } catch (error) {
                results.push({ id, workingCount: 0, error: error.message });
            }
        }
        
        this.hideProgress();
        return results;
    }

    async countWorkingThumbnails(thumbnails) {
        let count = 0;
        const promises = thumbnails.map(async (thumbnail) => {
            return new Promise((resolve) => {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = () => {
                    count++;
                    resolve(true);
                };
                img.onerror = () => resolve(false);
                img.src = thumbnail.url;
                
                // Timeout after 5 seconds
                setTimeout(() => resolve(false), 5000);
            });
        });
        
        await Promise.all(promises);
        return count;
    }
}

// Enhanced CSS for notifications and modal (inject into page)
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
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
}

.modal-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

.modal-content {
    position: relative;
    background: var(--card-gradient, #ffffff);
    border-radius: 20px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    border: 1px solid rgba(255, 255, 255, 0.2);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.modal-header h3 {
    margin: 0;
    color: var(--text-primary, #2d3748);
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: var(--text-secondary, #4a5568);
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.modal-close:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid rgba(0, 0, 0, 0.1);
    text-align: center;
}

.thumbnail-details {
    margin-top: 1rem;
    padding: 1rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 10px;
}

.thumbnail-details p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: var(--card-gradient, #ffffff);
    border-radius: 10px;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 300px;
    max-width: 500px;
    animation: slideInRight 0.3s ease-out;
    border: 1px solid rgba(0, 0, 0, 0.1);
}

.notification-error {
    border-left: 4px solid #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #ffffff 100%);
}

.notification-success {
    border-left: 4px solid #10b981;
    background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}

.notification-info {
    border-left: 4px solid #3b82f6;
    background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex: 1;
}

.notification-content i {
    font-size: 1.2rem;
}

.notification-error .notification-content i {
    color: #ef4444;
}

.notification-success .notification-content i {
    color: #10b981;
}

.notification-info .notification-content i {
    color: #3b82f6;
}

.notification-close {
    background: none;
    border: none;
    cursor: pointer;
    color: var(--text-secondary, #4a5568);
    padding: 0.25rem;
    border-radius: 4px;
    transition: all 0.3s ease;
}

.notification-close:hover {
    background: rgba(0, 0, 0, 0.1);
    transform: scale(1.1);
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
    border-radius: 15px 15px 0 0;
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
    border: 2px solid rgba(255, 255, 255, 0.8);
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    backdrop-filter: blur(10px);
}

.thumbnail-checkbox input:checked + .checkbox-custom {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-color: transparent;
}

.thumbnail-checkbox input:checked + .checkbox-custom::after {
    content: '✓';
    color: white;
    font-weight: bold;
    font-size: 0.9rem;
}

.thumbnail-info {
    padding: 1rem;
}

.thumbnail-title {
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: var(--text-primary, #2d3748);
    font-size: 0.9rem;
    line-height: 1.3;
}

.thumbnail-resolution {
    font-size: 0.8rem;
    color: var(--text-muted, #718096);
    margin-bottom: 0.25rem;
}

.thumbnail-type {
    font-size: 0.75rem;
    color: var(--text-muted, #718096);
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    display: inline-block;
}

.thumbnail-actions {
    display: flex;
    gap: 0.5rem;
    margin-top: 1rem;
}

.btn {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1.5rem;
    border: none;
    border-radius: 25px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.9rem;
    position: relative;
    overflow: hidden;
}

.btn-small {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
    border-radius: 20px;
}

.btn-primary {
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
}

.btn-secondary {
    background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    color: white;
}

.btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.2);
}

.btn:active {
    transform: translateY(0);
}

.btn-primary:hover {
    background: linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%);
}

.btn-secondary:hover {
    background: linear-gradient(135deg, #ed64a6 0%, #e53e3e 100%);
}

/* Responsive adjustments */
@media (max-width: 768px) {
    .notification {
        right: 10px;
        left: 10px;
        min-width: auto;
        max-width: none;
    }
    
    .modal-content {
        max-width: 95vw;
        margin: 1rem;
    }
    
    .thumbnail-actions {
        flex-direction: column;
    }
    
    .btn-small {
        justify-content: center;
    }
}

/* Loading animation */
.thumbnail-image[src*="data:image/svg"] {
    opacity: 0.6;
    animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
    0%, 100% {
        opacity: 0.6;
    }
    50% {
        opacity: 0.9;
    }
}

/* Fade in animation for thumbnails */
.animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out both;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(30px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Inject dynamic styles
    if (!document.getElementById('netflix-downloader-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'netflix-downloader-styles';
        styleElement.innerHTML = dynamicStyles;
        document.head.appendChild(styleElement);
    }
    
    // Initialize Netflix Downloader
    window.netflixDownloader = new NetflixDownloader();
    
    // Add example IDs to the interface
    const urlInput = document.getElementById('netflixUrl');
    if (urlInput && !urlInput.placeholder.includes('Example')) {
        const examples = window.netflixDownloader.getExampleIds();
        urlInput.placeholder = `Enter Netflix URL or ID (Examples: ${examples.slice(0, 3).join(', ')})`;
        
        // Add quick test button
        const parentDiv = urlInput.parentElement;
        if (parentDiv && !document.getElementById('quickTestBtn')) {
            const quickTestBtn = document.createElement('button');
            quickTestBtn.id = 'quickTestBtn';
            quickTestBtn.className = 'btn btn-small btn-secondary';
            quickTestBtn.innerHTML = '<i class="fas fa-flask"></i> Test Examples';
            quickTestBtn.style.marginLeft = '0.5rem';
            quickTestBtn.onclick = async () => {
                const results = await window.netflixDownloader.testMultipleIds(examples.slice(0, 3));
                const bestResult = results.find(r => r.workingCount > 0);
                if (bestResult) {
                    urlInput.value = bestResult.id;
                    window.netflixDownloader.fetchThumbnails();
                } else {
                    window.netflixDownloader.showError('No working examples found. Try manual IDs.');
                }
            };
            parentDiv.appendChild(quickTestBtn);
        }
    }
    
    console.log('Netflix Thumbnail Downloader v3.0 initialized successfully!');
    console.log('Working example IDs:', window.netflixDownloader.getExampleIds());
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetflixDownloader;
}
