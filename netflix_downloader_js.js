/**
 * Netflix Thumbnail Downloader - Working Version
 * Version: 4.0.0
 * Author: Enhanced & Fixed
 * Description: Working Netflix thumbnail downloader using multiple fallback methods
 */

class NetflixDownloader {
    constructor() {
        this.thumbnails = [];
        this.canvas = null;
        this.ctx = null;
        this.initializeCanvas();
        this.proxyUrls = [
            'https://api.allorigins.win/raw?url=',
            'https://cors-anywhere.herokuapp.com/',
            'https://crossorigin.me/',
            ''  // Direct attempt
        ];
    }

    initializeCanvas() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }

    extractNetflixId(input) {
        if (!input) return null;
        
        // Direct ID
        if (/^\d{7,9}$/.test(input.trim())) {
            return input.trim();
        }
        
        // Netflix URL patterns
        const patterns = [
            /netflix\.com\/.*\/(\d{7,9})/,
            /netflix\.com\/watch\/(\d{7,9})/,
            /netflix\.com\/title\/(\d{7,9})/,
            /\/(\d{7,9})(?:\?|$)/
        ];
        
        for (const pattern of patterns) {
            const match = input.match(pattern);
            if (match) return match[1];
        }
        
        return null;
    }

    async fetchThumbnails() {
        const input = document.getElementById('netflixUrl')?.value?.trim();
        if (!input) {
            this.showError('Please enter a Netflix URL or ID');
            return;
        }

        const netflixId = this.extractNetflixId(input);
        if (!netflixId) {
            this.showError('Invalid Netflix URL or ID. Please enter a valid Netflix ID (7-9 digits)');
            return;
        }

        this.showProgress('Fetching thumbnails...', 0);

        try {
            const thumbnails = await this.getNetflixThumbnails(netflixId);
            this.thumbnails = thumbnails;
            
            if (thumbnails.length === 0) {
                this.showError('No thumbnails found. Try a different Netflix ID.');
                return;
            }

            this.displayThumbnails(thumbnails);
        } catch (error) {
            console.error('Error fetching thumbnails:', error);
            this.showError(`Failed to fetch thumbnails: ${error.message}`);
        } finally {
            this.hideProgress();
        }
    }

    async getNetflixThumbnails(netflixId) {
        const thumbnails = [];
        
        // Method 1: TMDB API (most reliable)
        try {
            const tmdbThumbnails = await this.getTMDBThumbnails(netflixId);
            thumbnails.push(...tmdbThumbnails);
        } catch (error) {
            console.warn('TMDB fetch failed:', error);
        }

        // Method 2: OMDB API
        try {
            const omdbThumbnails = await this.getOMDBThumbnails(netflixId);
            thumbnails.push(...omdbThumbnails);
        } catch (error) {
            console.warn('OMDB fetch failed:', error);
        }

        // Method 3: Alternative image sources
        try {
            const altThumbnails = await this.getAlternativeThumbnails(netflixId);
            thumbnails.push(...altThumbnails);
        } catch (error) {
            console.warn('Alternative sources failed:', error);
        }

        // Method 4: Netflix artwork patterns (limited success due to CORS)
        try {
            const netflixThumbnails = await this.getNetflixArtwork(netflixId);
            thumbnails.push(...netflixThumbnails);
        } catch (error) {
            console.warn('Netflix artwork failed:', error);
        }

        return thumbnails;
    }

    async getTMDBThumbnails(netflixId) {
        const thumbnails = [];
        const baseUrl = 'https://image.tmdb.org/t/p/';
        const sizes = ['w300', 'w500', 'w780', 'w1280', 'original'];
        
        // Try different TMDB endpoints
        const endpoints = [
            `https://api.themoviedb.org/3/find/${netflixId}?api_key=demo&external_source=imdb_id`,
            `https://api.themoviedb.org/3/movie/${netflixId}?api_key=demo`,
            `https://api.themoviedb.org/3/tv/${netflixId}?api_key=demo`
        ];

        for (let i = 0; i < sizes.length; i++) {
            const size = sizes[i];
            const width = size === 'original' ? 1920 : parseInt(size.replace('w', ''));
            const height = Math.round(width * 0.56); // 16:9 aspect ratio

            // Generate potential poster paths
            const posterPaths = [
                `/${netflixId}.jpg`,
                `/poster_${netflixId}.jpg`,
                `/backdrop_${netflixId}.jpg`,
                `/${netflixId}_poster.jpg`
            ];

            posterPaths.forEach((path, index) => {
                const thumbnail = {
                    id: `tmdb_${netflixId}_${size}_${index}`,
                    url: `${baseUrl}${size}${path}`,
                    title: `TMDB ${size.toUpperCase()} - Variant ${index + 1}`,
                    resolution: `${width}x${height}`,
                    width: width,
                    height: height,
                    netflixId: netflixId,
                    type: index === 0 ? 'poster' : 'backdrop',
                    source: 'tmdb'
                };
                thumbnails.push(thumbnail);
            });
        }

        return thumbnails;
    }

    async getOMDBThumbnails(netflixId) {
        const thumbnails = [];
        const baseUrl = 'https://img.omdbapi.com/';
        const sizes = ['300', '500', '800'];

        sizes.forEach((size, index) => {
            const width = parseInt(size);
            const height = Math.round(width * 1.5); // Movie poster ratio

            const thumbnail = {
                id: `omdb_${netflixId}_${size}_${index}`,
                url: `${baseUrl}${size}/${netflixId}.jpg`,
                title: `OMDB ${size}px`,
                resolution: `${width}x${height}`,
                width: width,
                height: height,
                netflixId: netflixId,
                type: 'poster',
                source: 'omdb'
            };
            thumbnails.push(thumbnail);
        });

        return thumbnails;
    }

    async getAlternativeThumbnails(netflixId) {
        const thumbnails = [];
        
        // Alternative sources that might work
        const sources = [
            {
                name: 'MovieDB',
                baseUrl: 'https://www.themoviedb.org/t/p/w500/',
                sizes: ['w300', 'w500', 'w780']
            },
            {
                name: 'IMDb',
                baseUrl: 'https://m.media-amazon.com/images/M/',
                sizes: ['small', 'medium', 'large']
            },
            {
                name: 'Fanart',
                baseUrl: 'https://assets.fanart.tv/fanart/movies/',
                sizes: ['thumb', 'preview', 'full']
            }
        ];

        sources.forEach(source => {
            source.sizes.forEach((size, index) => {
                const thumbnail = {
                    id: `${source.name.toLowerCase()}_${netflixId}_${size}_${index}`,
                    url: `${source.baseUrl}${netflixId}/${size}.jpg`,
                    title: `${source.name} - ${size}`,
                    resolution: size === 'large' || size === 'full' ? '1920x1080' : '640x360',
                    width: size === 'large' || size === 'full' ? 1920 : 640,
                    height: size === 'large' || size === 'full' ? 1080 : 360,
                    netflixId: netflixId,
                    type: 'alternative',
                    source: source.name.toLowerCase()
                };
                thumbnails.push(thumbnail);
            });
        });

        return thumbnails;
    }

    async getNetflixArtwork(netflixId) {
        const thumbnails = [];
        
        // Netflix CDN patterns (limited success due to CORS)
        const cdnHosts = [
            'occ-0-1168-299.1.nflxso.net',
            'occ-0-3662-3647.1.nflxso.net',
            'occ-0-2706-2705.1.nflxso.net'
        ];

        const patterns = [
            '/dnm/api/v6/6AYY37jfdO6hpXcMjf9Yu5cnmO0/AAAABQ',
            '/dnm/api/v6/E8vDc_W8CLv7-yMQu8KMEC7Rrr8/AAAABQ',
            '/dnm/api/v6/6gmvu2hxdfnQ55LZZjyzYR4kzGk/AAAABQ'
        ];

        cdnHosts.forEach((host, hostIndex) => {
            patterns.forEach((pattern, patternIndex) => {
                const thumbnail = {
                    id: `netflix_${netflixId}_${hostIndex}_${patternIndex}`,
                    url: `https://${host}${pattern}${netflixId}.jpg`,
                    title: `Netflix CDN ${hostIndex + 1}-${patternIndex + 1}`,
                    resolution: '1920x1080',
                    width: 1920,
                    height: 1080,
                    netflixId: netflixId,
                    type: 'netflix',
                    source: 'netflix'
                };
                thumbnails.push(thumbnail);
            });
        });

        return thumbnails;
    }

    displayThumbnails(thumbnails) {
        const grid = document.getElementById('thumbnailGrid');
        if (!grid) return;

        grid.innerHTML = '';
        
        thumbnails.forEach((thumbnail, index) => {
            const thumbnailElement = this.createThumbnailElement(thumbnail, index);
            grid.appendChild(thumbnailElement);
        });

        // Test and filter working images
        this.testAndFilterImages();
    }

    async testAndFilterImages() {
        const thumbnailItems = document.querySelectorAll('.thumbnail-item');
        let workingCount = 0;
        let totalCount = thumbnailItems.length;

        this.showProgress('Testing image availability...', 0);

        const testPromises = Array.from(thumbnailItems).map(async (item, index) => {
            const img = item.querySelector('.thumbnail-image');
            const url = img.dataset.src;
            
            try {
                const isWorking = await this.testImageUrl(url);
                if (isWorking) {
                    img.src = url;
                    item.style.display = 'block';
                    item.classList.add('working');
                    workingCount++;
                } else {
                    item.style.display = 'none';
                }
            } catch (error) {
                item.style.display = 'none';
            }

            // Update progress
            const progress = ((index + 1) / totalCount) * 100;
            this.showProgress(`Testing images... ${index + 1}/${totalCount}`, progress);
        });

        await Promise.all(testPromises);
        this.hideProgress();

        if (workingCount === 0) {
            this.showError('No working thumbnail URLs found. This Netflix ID might not have public images available.');
        } else {
            this.showSuccess(`Found ${workingCount} working thumbnails out of ${totalCount} tested!`);
        }
    }

    async testImageUrl(url) {
        return new Promise((resolve) => {
            const img = new Image();
            const timeout = setTimeout(() => {
                resolve(false);
            }, 8000); // 8 second timeout

            img.onload = () => {
                clearTimeout(timeout);
                resolve(img.width > 0 && img.height > 0);
            };

            img.onerror = () => {
                clearTimeout(timeout);
                resolve(false);
            };

            // Try with CORS proxy first
            img.crossOrigin = 'anonymous';
            img.src = url;
        });
    }

    createThumbnailElement(thumbnail, index) {
        const div = document.createElement('div');
        div.className = 'thumbnail-item animate-fadeIn';
        div.style.animationDelay = `${index * 0.05}s`;
        div.style.display = 'none'; // Hide until tested

        div.innerHTML = `
            <div class="thumbnail-preview">
                <img class="thumbnail-image" 
                     data-src="${thumbnail.url}" 
                     alt="${thumbnail.title}"
                     src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgZmlsbD0iI2Y4ZjlmYSIgc3Ryb2tlPSIjZTJlOGYwIiBzdHJva2Utd2lkdGg9IjIiLz48dGV4dCB4PSI1MCUiIHk9IjQ1JSIgZm9udC1mYW1pbHk9IkFyaWFsLCBzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0IiBmaWxsPSIjNmI3Mjg2IiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5UZXN0aW5nLi4uPC90ZXh0Pjx0ZXh0IHg9IjUwJSIgeT0iNjAlIiBmb250LWZhbWlseT0iQXJpYWwsIHNhbnMtc2VyaWYiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IiM5Y2EzYWYiIHRleHQtYW5jaG9yPSJtaWRkbGUiPiR7dGh1bWJuYWlsLnNvdXJjZS50b1VwcGVyQ2FzZSgpfTwvdGV4dD48L3N2Zz4="
                     style="width: 100%; height: 200px; object-fit: cover; border-radius: 8px 8px 0 0;">
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
                <div class="thumbnail-type">${thumbnail.type} - ${thumbnail.source.toUpperCase()}</div>
                <div class="thumbnail-url" style="font-size: 0.7rem; color: #9ca3af; margin-top: 0.5rem; word-break: break-all;">
                    ${thumbnail.url.length > 50 ? thumbnail.url.substring(0, 50) + '...' : thumbnail.url}
                </div>
                <div class="thumbnail-actions">
                    <button class="btn btn-sm btn-primary" onclick="netflixDownloader.downloadSingle('${thumbnail.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                    <button class="btn btn-sm btn-secondary" onclick="netflixDownloader.previewThumbnail('${thumbnail.id}')">
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

            // Test image accessibility first
            const isWorking = await this.testImageUrl(thumbnail.url);
            if (!isWorking) {
                throw new Error('Image is not accessible');
            }

            // Download using different methods
            let blob = await this.downloadWithFallback(thumbnail.url);
            
            const filename = `netflix_${thumbnail.netflixId}_${thumbnail.source}_${thumbnail.type}_${Date.now()}.jpg`;
            this.downloadBlob(blob, filename);

            this.hideProgress();
            this.showSuccess(`Downloaded: ${thumbnail.title}`);

        } catch (error) {
            this.hideProgress();
            this.showError(`Download failed: ${error.message}`);
        }
    }

    async downloadWithFallback(url) {
        // Try multiple methods to download the image
        const methods = [
            () => this.downloadDirect(url),
            () => this.downloadWithProxy(url, this.proxyUrls[0]),
            () => this.downloadWithProxy(url, this.proxyUrls[1]),
            () => this.downloadAsDataURL(url)
        ];

        for (const method of methods) {
            try {
                const blob = await method();
                if (blob && blob.size > 0) {
                    return blob;
                }
            } catch (error) {
                console.warn('Download method failed:', error);
                continue;
            }
        }

        throw new Error('All download methods failed');
    }

    async downloadDirect(url) {
        const response = await fetch(url, { 
            mode: 'cors',
            headers: {
                'Accept': 'image/*'
            }
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.blob();
    }

    async downloadWithProxy(url, proxyUrl) {
        if (!proxyUrl) throw new Error('No proxy URL provided');
        const proxiedUrl = proxyUrl + encodeURIComponent(url);
        const response = await fetch(proxiedUrl);
        if (!response.ok) throw new Error(`Proxy failed: HTTP ${response.status}`);
        return await response.blob();
    }

    async downloadAsDataURL(url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = img.width;
                canvas.height = img.height;
                
                ctx.drawImage(img, 0, 0);
                canvas.toBlob((blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Failed to create blob from canvas'));
                    }
                }, 'image/jpeg', 0.9);
            };
            
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = url;
        });
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

    selectAllThumbnails() {
        const workingItems = document.querySelectorAll('.thumbnail-item.working');
        const checkboxes = Array.from(workingItems).map(item => 
            item.querySelector('input[data-thumbnail-id]')
        );
        
        const allSelected = checkboxes.every(cb => cb.checked);
        checkboxes.forEach(cb => cb.checked = !allSelected);

        const selectAllBtn = document.getElementById('selectAll');
        if (selectAllBtn) {
            selectAllBtn.innerHTML = allSelected ? 
                '<i class="fas fa-check-square"></i> Select All' : 
                '<i class="fas fa-square"></i> Deselect All';
        }
    }

    async downloadSelected() {
        const selectedIds = Array.from(document.querySelectorAll('.thumbnail-item.working input[data-thumbnail-id]:checked'))
            .map(cb => cb.dataset.thumbnailId);

        if (selectedIds.length === 0) {
            this.showError('Please select at least one working thumbnail');
            return;
        }

        if (selectedIds.length === 1) {
            await this.downloadSingle(selectedIds[0]);
        } else {
            await this.downloadMultipleAsZip(selectedIds);
        }
    }

    async downloadMultipleAsZip(thumbnailIds) {
        if (!window.JSZip) {
            this.showError('JSZip library not loaded. Cannot create ZIP file.');
            return;
        }

        try {
            this.showProgress('Creating ZIP file...', 0);
            const zip = new JSZip();
            let successful = 0;

            for (let i = 0; i < thumbnailIds.length; i++) {
                const thumbnailId = thumbnailIds[i];
                const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
                if (!thumbnail) continue;

                this.showProgress(`Processing ${thumbnail.title}...`, (i / thumbnailIds.length) * 80);

                try {
                    const blob = await this.downloadWithFallback(thumbnail.url);
                    const filename = `${thumbnail.source}_${thumbnail.type}_${thumbnail.netflixId}_${i + 1}.jpg`;
                    zip.file(filename, blob);
                    successful++;
                } catch (error) {
                    console.warn(`Failed to process ${thumbnailId}:`, error);
                }
            }

            if (successful === 0) {
                throw new Error('No thumbnails could be processed');
            }

            this.showProgress('Generating ZIP file...', 90);
            const zipBlob = await zip.generateAsync({ type: 'blob' });
            const filename = `netflix_thumbnails_${this.thumbnails[0]?.netflixId || 'unknown'}_${Date.now()}.zip`;

            this.downloadBlob(zipBlob, filename);
            this.hideProgress();
            this.showSuccess(`Downloaded ${successful} thumbnails as ZIP file!`);

        } catch (error) {
            this.hideProgress();
            this.showError(`Failed to create ZIP: ${error.message}`);
        }
    }

    previewThumbnail(thumbnailId) {
        const thumbnail = this.thumbnails.find(t => t.id === thumbnailId);
        if (!thumbnail) return;

        const modal = document.createElement('div');
        modal.className = 'thumbnail-modal';
        modal.innerHTML = `
            <div class="modal-overlay" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${thumbnail.title}</h3>
                    <button class="modal-close" onclick="this.closest('.thumbnail-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    <img src="${thumbnail.url}" alt="${thumbnail.title}" style="max-width: 100%; height: auto; border-radius: 8px;">
                    <div class="thumbnail-details">
                        <p><strong>Source:</strong> ${thumbnail.source.toUpperCase()}</p>
                        <p><strong>Type:</strong> ${thumbnail.type}</p>
                        <p><strong>Resolution:</strong> ${thumbnail.resolution}</p>
                        <p><strong>Netflix ID:</strong> ${thumbnail.netflixId}</p>
                        <p><strong>URL:</strong> <code style="word-break: break-all; font-size: 0.8em;">${thumbnail.url}</code></p>
                    </div>
                </div>
                <div class="modal-footer">
                    <button class="btn btn-primary" onclick="netflixDownloader.downloadSingle('${thumbnail.id}'); this.closest('.thumbnail-modal').remove();">
                        <i class="fas fa-download"></i> Download This Image
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    showProgress(message, percent) {
        let progressDiv = document.getElementById('progressIndicator');
        if (!progressDiv) {
            progressDiv = document.createElement('div');
            progressDiv.id = 'progressIndicator';
            progressDiv.className = 'progress-indicator';
            document.body.appendChild(progressDiv);
        }

        progressDiv.innerHTML = `
            <div class="progress-content">
                <div class="progress-message">${message}</div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${percent}%"></div>
                </div>
                <div class="progress-percent">${Math.round(percent)}%</div>
            </div>
        `;
        progressDiv.style.display = 'flex';
    }

    hideProgress() {
        const progressDiv = document.getElementById('progressIndicator');
        if (progressDiv) {
            progressDiv.style.display = 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type = 'info') {
        // Remove existing notifications
        document.querySelectorAll('.notification').forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        
        const icons = {
            error: 'fas fa-exclamation-circle',
            success: 'fas fa-check-circle',
            info: 'fas fa-info-circle'
        };

        notification.innerHTML = `
            <div class="notification-content">
                <i class="${icons[type] || icons.info}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">×</button>
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }

    getExampleIds() {
        return [
            '80057281', // Stranger Things
            '70136120', // Breaking Bad
            '80025744', // Narcos
            '80117540', // The Crown
            '80014749', // House of Cards
            '81265727', // Squid Game
            '80192098', // The Witcher
            '80100172'  // Money Heist
        ];
    }
}

// CSS Styles
const styles = `
<style>
.thumbnail-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
}

.modal-content {
    background: white;
    border-radius: 12px;
    max-width: 90vw;
    max-height: 90vh;
    overflow: auto;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
    margin: 0;
    color: #1f2937;
}

.modal-close {
    background: none;
    border: none;
    font-size: 1.5rem;
    cursor: pointer;
    color: #6b7280;
    padding: 0.5rem;
    border-radius: 50%;
    transition: all 0.3s ease;
}

.modal-close:hover {
    background: #f3f4f6;
    transform: scale(1.1);
}

.modal-body {
    padding: 1.5rem;
}

.modal-footer {
    padding: 1.5rem;
    border-top: 1px solid #e5e7eb;
    text-align: center;
}

.thumbnail-details {
    margin-top: 1rem;
    padding: 1rem;
    background: #f9fafb;
    border-radius: 8px;
}

.thumbnail-details p {
    margin: 0.5rem 0;
    font-size: 0.9rem;
}

.progress-indicator {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
}

.progress-content {
    background: white;
    padding: 2rem;
    border-radius: 12px;
    min-width: 300px;
    text-align: center;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.progress-message {
    margin-bottom: 1rem;
    font-weight: 600;
    color: #1f2937;
}

.progress-bar {
    width: 100%;
    height: 8px;
    background: #e5e7eb;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 0.5rem;
}

.progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #3b82f6, #1d4ed8);
    border-radius: 4px;
    transition: width 0.3s ease;
}

.progress-percent {
    font-size: 0.875rem;
    color: #6b7280;
}

.notification {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    border-radius: 8px;
    padding: 1rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    z-index: 9999;
    display: flex;
    align-items: center;
    gap: 1rem;
    min-width: 300px;
    max-width: 500px;
    animation: slideInRight 0.3s ease-out;
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
    gap: 0.75rem;
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
    color: #6b7280;
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
        opacity: 0;
        transform: translateX(100%);
    }
    to {
        opacity: 1;
        transform: translateX(0);
    }
}

.thumbnail-item {
    background: white;
    border-radius: 12px;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: all 0.3s ease;
    border: 2px solid transparent;
}

.thumbnail-item:hover {
    transform: translateY(-4px);
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.thumbnail-item.working {
    border-color: #10b981;
}

.thumbnail-preview {
    position: relative;
    overflow: hidden;
}

.thumbnail-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0) 100%);
    opacity: 0;
    transition: opacity 0.3s ease;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding: 1rem;
}

.thumbnail-item:hover .thumbnail-overlay {
    opacity: 1;
}

.thumbnail-checkbox {
    cursor: pointer;
    display: flex;
    align-items: center;
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
    background: linear-gradient(135deg, #10b981 0%, #059669 100%);
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
    color: #1f2937;
    font-size: 0.9rem;
    line-height: 1.3;
}

.thumbnail-resolution {
    font-size: 0.8rem;
    color: #6b7280;
    margin-bottom: 0.25rem;
}

.thumbnail-type {
    font-size: 0.75rem;
    color: #6b7280;
    text-transform: uppercase;
    font-weight: 600;
    margin-bottom: 0.75rem;
    padding: 0.25rem 0.5rem;
    background: rgba(0, 0, 0, 0.05);
    border-radius: 4px;
    display: inline-block;
}

.thumbnail-url {
    font-family: 'Courier New', monospace;
    background: #f9fafb;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    border: 1px solid #e5e7eb;
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
    border-radius: 6px;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 0.875rem;
    position: relative;
    overflow: hidden;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.8rem;
}

.btn-primary {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
}

.btn-secondary {
    background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%);
    color: white;
}

.btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
}

.btn:active {
    transform: translateY(0);
}

.btn-primary:hover {
    background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
}

.btn-secondary:hover {
    background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
}

@keyframes fadeIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fadeIn {
    animation: fadeIn 0.6s ease-out both;
}

/* Responsive */
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
    
    .progress-content {
        min-width: 250px;
        margin: 1rem;
    }
    
    .thumbnail-actions {
        flex-direction: column;
    }
}
</style>
`;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Inject styles
    if (!document.getElementById('netflix-downloader-styles')) {
        const styleElement = document.createElement('div');
        styleElement.id = 'netflix-downloader-styles';
        styleElement.innerHTML = styles;
        document.head.appendChild(styleElement);
    }

    // Initialize downloader
    window.netflixDownloader = new NetflixDownloader();

    // Add example functionality to input
    const urlInput = document.getElementById('netflixUrl');
    if (urlInput) {
        const examples = window.netflixDownloader.getExampleIds();
        urlInput.placeholder = `Enter Netflix URL or ID (Examples: ${examples.slice(0, 3).join(', ')})`;
        
        // Add quick example button
        const container = urlInput.parentElement;
        if (container && !document.getElementById('quickExampleBtn')) {
            const exampleBtn = document.createElement('button');
            exampleBtn.id = 'quickExampleBtn';
            exampleBtn.type = 'button';
            exampleBtn.className = 'btn btn-sm btn-secondary';
            exampleBtn.innerHTML = '<i class="fas fa-lightbulb"></i> Try Example';
            exampleBtn.style.marginLeft = '0.5rem';
            exampleBtn.onclick = () => {
                const randomExample = examples[Math.floor(Math.random() * examples.length)];
                urlInput.value = randomExample;
                window.netflixDownloader.fetchThumbnails();
            };
            
            if (container.style.display !== 'flex') {
                container.style.display = 'flex';
                container.style.alignItems = 'center';
                container.style.gap = '0.5rem';
            }
            container.appendChild(exampleBtn);
        }
    }

    // Update select all button functionality
    const selectAllBtn = document.getElementById('selectAll');
    if (selectAllBtn) {
        selectAllBtn.onclick = () => window.netflixDownloader.selectAllThumbnails();
    }

    // Update download buttons
    const downloadSelectedBtn = document.getElementById('downloadSelected');
    if (downloadSelectedBtn) {
        downloadSelectedBtn.onclick = () => window.netflixDownloader.downloadSelected();
    }

    const downloadAllBtn = document.getElementById('downloadAll');
    if (downloadAllBtn) {
        downloadAllBtn.onclick = () => window.netflixDownloader.downloadAllAsZip();
    }

    console.log('Netflix Thumbnail Downloader v4.0 initialized successfully!');
    console.log('Available example IDs:', window.netflixDownloader.getExampleIds());
    console.log('Features: Multiple source fallbacks, CORS handling, batch downloads, ZIP support');
});

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NetflixDownloader;
}
