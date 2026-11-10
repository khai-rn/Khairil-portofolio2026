/**
 * CLIENT-SIDE IMAGE OPTIMIZER
 * Resizes high-resolution photographs, converts to modern WebP,
 * generates responsive thumbnails, and ensures safe file validation
 * before uploading to Supabase Storage.
 */

(function () {
  const ImageOptimizer = {
    MAX_FILE_SIZE: 15 * 1024 * 1024, // 15MB maximum input
    MAX_WIDTH: 2048,
    MAX_HEIGHT: 2048,
    THUMB_MAX_WIDTH: 480,
    QUALITY: 0.85,
    THUMB_QUALITY: 0.80,

    ALLOWED_MIME_TYPES: [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif'
    ],

    validateFile(file) {
      if (!file) {
        throw new Error('Tidak ada file yang dipilih.');
      }
      if (!this.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
        throw new Error(`Format file "${file.type}" tidak didukung. Harap unggah JPEG, PNG, WebP, atau GIF.`);
      }
      if (file.size > this.MAX_FILE_SIZE) {
        throw new Error(`Ukuran file (${(file.size / (1024 * 1024)).toFixed(1)}MB) melebihi batas maksimum 15MB.`);
      }
      return true;
    },

    /**
     * Loads a File or Blob into an HTMLImageElement
     */
    loadImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = (err) => {
          URL.revokeObjectURL(url);
          reject(new Error('Gagal membaca data gambar. Pastikan file gambar tidak rusak.'));
        };
        img.src = url;
      });
    },

    /**
     * Calculates scaled dimensions preserving aspect ratio
     */
    calculateDimensions(width, height, maxWidth, maxHeight) {
      let targetWidth = width;
      let targetHeight = height;

      if (targetWidth > maxWidth) {
        targetHeight = Math.round((targetHeight * maxWidth) / targetWidth);
        targetWidth = maxWidth;
      }

      if (targetHeight > maxHeight) {
        targetWidth = Math.round((targetWidth * maxHeight) / targetHeight);
        targetHeight = maxHeight;
      }

      return { width: targetWidth, height: targetHeight };
    },

    /**
     * Renders an image to a canvas and exports as Blob
     */
    canvasToBlob(canvas, mimeType = 'image/webp', quality = 0.85) {
      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            // Fallback to jpeg if webp unsupported
            canvas.toBlob((fallbackBlob) => {
              resolve(fallbackBlob);
            }, 'image/jpeg', quality);
          }
        }, mimeType, quality);
      });
    },

    /**
     * Main optimization method
     * Compresses the main image and generates a thumbnail
     */
    async processImage(file) {
      this.validateFile(file);

      // GIFs are kept intact to preserve animation
      if (file.type === 'image/gif') {
        const img = await this.loadImage(file);
        return {
          file: file,
          thumbnailFile: null,
          width: img.naturalWidth || 800,
          height: img.naturalHeight || 600,
          originalSize: file.size,
          optimizedSize: file.size,
          mimeType: 'image/gif',
          savingsPercent: 0
        };
      }

      const img = await this.loadImage(file);
      const originalWidth = img.naturalWidth;
      const originalHeight = img.naturalHeight;

      // 1. Process Main Optimized Image
      const mainDims = this.calculateDimensions(originalWidth, originalHeight, this.MAX_WIDTH, this.MAX_HEIGHT);
      const mainCanvas = document.createElement('canvas');
      mainCanvas.width = mainDims.width;
      mainCanvas.height = mainDims.height;

      const mainCtx = mainCanvas.getContext('2d');
      mainCtx.imageSmoothingEnabled = true;
      mainCtx.imageSmoothingQuality = 'high';
      mainCtx.drawImage(img, 0, 0, mainDims.width, mainDims.height);

      const mainBlob = await this.canvasToBlob(mainCanvas, 'image/webp', this.QUALITY);
      const baseName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_\-]/g, "_");
      const optimizedFile = new File([mainBlob], `${baseName}.webp`, { type: 'image/webp' });

      // 2. Process Thumbnail
      const thumbDims = this.calculateDimensions(originalWidth, originalHeight, this.THUMB_MAX_WIDTH, this.THUMB_MAX_WIDTH);
      const thumbCanvas = document.createElement('canvas');
      thumbCanvas.width = thumbDims.width;
      thumbCanvas.height = thumbDims.height;

      const thumbCtx = thumbCanvas.getContext('2d');
      thumbCtx.imageSmoothingEnabled = true;
      thumbCtx.imageSmoothingQuality = 'high';
      thumbCtx.drawImage(img, 0, 0, thumbDims.width, thumbDims.height);

      const thumbBlob = await this.canvasToBlob(thumbCanvas, 'image/webp', this.THUMB_QUALITY);
      const thumbFile = new File([thumbBlob], `${baseName}_thumb.webp`, { type: 'image/webp' });

      const savings = Math.max(0, Math.round(((file.size - mainBlob.size) / file.size) * 100));

      return {
        file: optimizedFile,
        thumbnailFile: thumbFile,
        width: mainDims.width,
        height: mainDims.height,
        originalSize: file.size,
        optimizedSize: mainBlob.size,
        mimeType: 'image/webp',
        savingsPercent: savings
      };
    }
  };

  window.ImageOptimizer = ImageOptimizer;
})();

