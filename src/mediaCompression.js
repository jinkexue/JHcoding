export function getImageCompressionPlan(fileSize = 0, userAgent = '') {
  const size = Number(fileSize || 0);
  const ua = String(userAgent || '').toLowerCase();
  const isMobile = /android|iphone|ipad|ipod|mobile/i.test(ua);
  const isTablet = /ipad|tablet/i.test(ua) || (/android/i.test(ua) && !/mobile/i.test(ua));

  if (size <= 1024 * 1024) {
    return {
      shouldCompress: false,
      maxWidth: isMobile ? 1200 : isTablet ? 1600 : 1800,
      quality: isMobile ? 0.76 : isTablet ? 0.82 : 0.88,
      outputType: 'image/jpeg',
    };
  }

  return {
    shouldCompress: true,
    maxWidth: isMobile ? 1400 : isTablet ? 1800 : 2000,
    quality: isMobile ? 0.72 : isTablet ? 0.78 : 0.84,
    outputType: 'image/jpeg',
  };
}

function loadImageFromBlob(blob) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };

    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Image decode failed'));
    };

    image.src = url;
  });
}

export async function compressImageFile(file, options = {}) {
  if (!file || !file.type || !file.type.startsWith('image/')) {
    return file;
  }

  const plan = getImageCompressionPlan(file.size, options.userAgent || '');
  const shouldCompress = options.forceCompress === true || plan.shouldCompress;

  if (!shouldCompress || file.size <= 1024 * 1024) {
    return file;
  }

  const maxWidth = Number(options.maxWidth || plan.maxWidth || 1600);
  const quality = Number(options.quality || plan.quality || 0.8);
  const outputType = options.outputType || plan.outputType || 'image/jpeg';

  try {
    const image = await loadImageFromBlob(file);
    const ratio = Math.min(1, maxWidth / Math.max(image.width, image.height));
    const canvas = document.createElement('canvas');
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
      return file;
    }

    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, outputType, quality));
    if (!blob) {
      return file;
    }

    const extension = outputType === 'image/png' ? 'png' : 'jpg';
    const fileName = (file.name || 'family-upload').replace(/\.[^.]+$/, '') + `.${extension}`;
    return new File([blob], fileName, {
      type: outputType,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Image compression failed, keeping original file', error);
    return file;
  }
}
