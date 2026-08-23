/**
 * Image processing utilities for trade screenshot upload, compression, and clipboard handling.
 */

/**
 * Optimizes an uploaded image file (resizes if too large, compresses to WebP/JPEG)
 * to keep payload lightweight (100KB-300KB) while maintaining crisp chart readability.
 */
export async function optimizeImageFile(
  file: File,
  maxWidth = 1600,
  maxHeight = 1600,
  quality = 0.85
): Promise<string> {
  return new Promise((resolve, reject) => {
    // If it's an SVG, read directly as data URL without canvas rasterization
    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let { width, height } = img;

        // Calculate proportional scale if image exceeds max bounds
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          // Fallback to original data URL if canvas context unavailable
          resolve(e.target?.result as string);
          return;
        }

        // Draw image smoothly
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Try exporting as webp with fallback to jpeg
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          if (dataUrl && dataUrl.startsWith('data:image/webp')) {
            resolve(dataUrl);
            return;
          }
        } catch {
          // WebP not supported or failed, fallback to JPEG
        }

        const jpegUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegUrl);
      };

      img.onerror = () => {
        // Fallback to raw data URL on image load error
        resolve(e.target?.result as string);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/**
 * Validates whether a given string is a valid image URL or base64 data URI.
 */
export function isValidImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  const trimmed = url.trim();
  if (trimmed.startsWith('data:image/')) return true;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('/')) {
    return true;
  }
  return false;
}

/**
 * Extracts images from clipboard paste event items.
 */
export function extractImageFilesFromClipboard(items: DataTransferItemList): File[] {
  const files: File[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.type.indexOf('image') !== -1) {
      const file = item.getAsFile();
      if (file) files.push(file);
    }
  }
  return files;
}

/**
 * Uploads an image (File, Blob, or base64 data URL) to Cloudinary.
 * Supports:
 * 1. Server-side upload via API Route /api/upload/cloudinary (using API Key & API Secret)
 * 2. Client-side unsigned upload preset via Cloudinary REST API
 * Returns the permanent HTTPS URL.
 */
/**
 * Uploads an image (File, Blob, or base64 data URL) using:
 * 1. The backend universal upload API /api/upload (which uses Cloudinary if configured, or local server storage fallback)
 * 2. Or direct Cloudinary client-side preset if configured
 * Returns the permanent image URL.
 */
export async function uploadScreenshotImage(
  fileOrDataUrl: File | Blob | string,
  cloudName?: string,
  uploadPreset?: string,
  apiKey?: string,
  apiSecret?: string
): Promise<string> {
  // Convert File/Blob to base64 if needed
  let dataPayload = fileOrDataUrl;
  if (fileOrDataUrl instanceof File || fileOrDataUrl instanceof Blob) {
    dataPayload = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(fileOrDataUrl);
    });
  }

  // 1. Try server API /api/upload
  try {
    const res = await fetch('/api/upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: dataPayload,
        cloudName,
        apiKey,
        apiSecret,
        folder: 'trading_journal',
      }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.optimizedUrl || json.url) {
        return json.optimizedUrl || json.url;
      }
    }
  } catch (err) {
    console.warn('Backend /api/upload attempt warning:', err);
  }

  // 2. Direct Cloudinary unsigned preset if available
  const cName = (cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'bgowyyl2').trim();
  const preset = (uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();

  if (cName && preset) {
    try {
      const formData = new FormData();
      formData.append('file', dataPayload);
      formData.append('upload_preset', preset);
      formData.append('folder', 'trading_journal');

      const response = await fetch(`https://api.cloudinary.com/v1_1/${encodeURIComponent(cName)}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (data.secure_url || data.url) {
          return data.secure_url || data.url;
        }
      }
    } catch (presetErr) {
      console.warn('Direct Cloudinary preset upload warning:', presetErr);
    }
  }

  // 3. If everything else fails, return the dataPayload so the image is never lost
  return dataPayload as string;
}

export async function uploadToCloudinary(
  fileOrDataUrl: File | Blob | string,
  cloudName?: string,
  uploadPreset?: string,
  apiKey?: string,
  apiSecret?: string
): Promise<string> {
  return uploadScreenshotImage(fileOrDataUrl, cloudName, uploadPreset, apiKey, apiSecret);
}

/**
 * Checks if Cloudinary is configured via settings or environment variables.
 */
export function isCloudinaryConfigured(
  cloudName?: string,
  uploadPreset?: string,
  apiKey?: string,
  apiSecret?: string
): boolean {
  const cName = (cloudName || import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'bgowyyl2').trim();
  const preset = (uploadPreset || import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || '').trim();
  const aSecret = (apiSecret || '').trim();
  return Boolean(cName && (preset || aSecret));
}

