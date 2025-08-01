// Photo Converter App - Main JavaScript
class PhotoConverter {
    constructor() {
        this.selectedFiles = [];
        this.convertedImages = [];
        this.initializeElements();
        this.bindEvents();
    }

    initializeElements() {
        // Get DOM elements
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.selectBtn = document.getElementById('selectBtn');
        this.controlsSection = document.getElementById('controlsSection');
        this.previewSection = document.getElementById('previewSection');
        this.progressSection = document.getElementById('progressSection');
        this.resultsSection = document.getElementById('resultsSection');
        
        this.imageGrid = document.getElementById('imageGrid');
        this.resultsGrid = document.getElementById('resultsGrid');
        
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.convertBtn = document.getElementById('convertBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.clearBtn = document.getElementById('clearBtn');
        
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
    }

    bindEvents() {
        // File selection events
        this.selectBtn.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFiles(e.target.files));
        
        // Drag and drop events
        this.uploadArea.addEventListener('click', () => this.fileInput.click());
        this.uploadArea.addEventListener('dragover', this.handleDragOver.bind(this));
        this.uploadArea.addEventListener('dragleave', this.handleDragLeave.bind(this));
        this.uploadArea.addEventListener('drop', this.handleDrop.bind(this));
        
        // Control events
        this.qualitySlider.addEventListener('input', this.updateQualityValue.bind(this));
        this.convertBtn.addEventListener('click', this.convertImages.bind(this));
        this.downloadBtn.addEventListener('click', this.downloadAllImages.bind(this));
        this.clearBtn.addEventListener('click', this.clearAll.bind(this));
    }

    handleDragOver(e) {
        e.preventDefault();
        this.uploadArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        this.uploadArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        this.handleFiles(files);
    }

    handleFiles(files) {
        const imageFiles = Array.from(files).filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            alert('Please select valid image files.');
            return;
        }

        this.selectedFiles = imageFiles;
        this.displayPreview();
        this.showControls();
    }

    displayPreview() {
        this.imageGrid.innerHTML = '';
        
        this.selectedFiles.forEach((file, index) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const imageItem = this.createImagePreview(file, e.target.result, index);
                this.imageGrid.appendChild(imageItem);
            };
            reader.readAsDataURL(file);
        });

        this.previewSection.style.display = 'block';
    }

    createImagePreview(file, src, index) {
        const div = document.createElement('div');
        div.className = 'image-item';
        div.innerHTML = `
            <img src="${src}" alt="Preview" class="image-preview">
            <div class="image-info">
                <h4>${file.name}</h4>
                <p>Size: ${this.formatFileSize(file.size)}</p>
                <p>Type: ${file.type}</p>
            </div>
        `;
        return div;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    updateQualityValue() {
        this.qualityValue.textContent = this.qualitySlider.value;
    }

    showControls() {
        this.controlsSection.style.display = 'block';
    }

    async convertImages() {
        if (this.selectedFiles.length === 0) return;

        this.showProgressSection();
        this.convertedImages = [];
        const quality = this.qualitySlider.value / 100;

        for (let i = 0; i < this.selectedFiles.length; i++) {
            const file = this.selectedFiles[i];
            
            try {
                const convertedImage = await this.convertToJPG(file, quality);
                this.convertedImages.push({
                    originalFile: file,
                    convertedBlob: convertedImage.blob,
                    convertedDataURL: convertedImage.dataURL,
                    newSize: convertedImage.blob.size
                });
                
                this.updateProgress(i + 1, this.selectedFiles.length);
            } catch (error) {
                console.error('Error converting image:', error);
                alert(`Error converting ${file.name}: ${error.message}`);
            }
        }

        this.showResults();
    }

    convertToJPG(file, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    try {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Set canvas size to image size
                        canvas.width = img.width;
                        canvas.height = img.height;
                        
                        // Fill with white background (important for transparent images)
                        ctx.fillStyle = '#FFFFFF';
                        ctx.fillRect(0, 0, canvas.width, canvas.height);
                        
                        // Draw the image
                        ctx.drawImage(img, 0, 0);
                        
                        // Convert to JPG
                        canvas.toBlob((blob) => {
                            if (blob) {
                                const dataURL = canvas.toDataURL('image/jpeg', quality);
                                resolve({ blob, dataURL });
                            } else {
                                reject(new Error('Failed to convert image'));
                            }
                        }, 'image/jpeg', quality);
                        
                    } catch (error) {
                        reject(error);
                    }
                };
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(file);
        });
    }

    showProgressSection() {
        this.progressSection.style.display = 'block';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = `0 of ${this.selectedFiles.length} images converted`;
    }

    updateProgress(completed, total) {
        const percentage = (completed / total) * 100;
        this.progressFill.style.width = percentage + '%';
        this.progressText.textContent = `${completed} of ${total} images converted`;
    }

    showResults() {
        this.resultsGrid.innerHTML = '';
        
        this.convertedImages.forEach((item, index) => {
            const resultItem = this.createResultItem(item, index);
            this.resultsGrid.appendChild(resultItem);
        });

        this.resultsSection.style.display = 'block';
        this.downloadBtn.style.display = 'inline-block';
        this.progressSection.style.display = 'none';
    }

    createResultItem(item, index) {
        const div = document.createElement('div');
        div.className = 'result-item';
        
        const originalName = item.originalFile.name;
        const newName = originalName.replace(/\.[^/.]+$/, '.jpg');
        
        div.innerHTML = `
            <img src="${item.convertedDataURL}" alt="Converted" class="result-preview">
            <div class="result-info">
                <h4>${newName}</h4>
                <p>Original: ${this.formatFileSize(item.originalFile.size)}</p>
                <p>Converted: ${this.formatFileSize(item.newSize)}</p>
                <p>Savings: ${this.calculateSavings(item.originalFile.size, item.newSize)}</p>
                <button class="download-single" onclick="photoConverter.downloadSingle(${index})">
                    Download
                </button>
            </div>
        `;
        return div;
    }

    calculateSavings(originalSize, newSize) {
        const savings = ((originalSize - newSize) / originalSize) * 100;
        if (savings > 0) {
            return `${savings.toFixed(1)}% smaller`;
        } else {
            return `${Math.abs(savings).toFixed(1)}% larger`;
        }
    }

    downloadSingle(index) {
        const item = this.convertedImages[index];
        const originalName = item.originalFile.name;
        const newName = originalName.replace(/\.[^/.]+$/, '.jpg');
        
        this.downloadBlob(item.convertedBlob, newName);
    }

    downloadAllImages() {
        if (this.convertedImages.length === 0) return;

        this.convertedImages.forEach((item, index) => {
            const originalName = item.originalFile.name;
            const newName = originalName.replace(/\.[^/.]+$/, '.jpg');
            
            setTimeout(() => {
                this.downloadBlob(item.convertedBlob, newName);
            }, index * 200); // Stagger downloads
        });
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

    clearAll() {
        this.selectedFiles = [];
        this.convertedImages = [];
        this.fileInput.value = '';
        
        this.controlsSection.style.display = 'none';
        this.previewSection.style.display = 'none';
        this.progressSection.style.display = 'none';
        this.resultsSection.style.display = 'none';
        this.downloadBtn.style.display = 'none';
        
        this.imageGrid.innerHTML = '';
        this.resultsGrid.innerHTML = '';
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.photoConverter = new PhotoConverter();
});

// Prevent default drag behaviors on the whole document
document.addEventListener('dragover', (e) => {
    e.preventDefault();
});

document.addEventListener('drop', (e) => {
    e.preventDefault();
});