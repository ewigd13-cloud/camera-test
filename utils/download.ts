export const dataUrlToBlob = (dataUrl: string): Blob => {
  const parts = dataUrl.split(',');
  const mimeMatch = parts[0].match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const bstr = atob(parts[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
};

export const dataUrlToFile = (dataUrl: string, filename: string): File => {
  const blob = dataUrlToBlob(dataUrl);
  return new File([blob], filename, { type: blob.type || 'image/jpeg' });
};

export const isIOS = (): boolean => {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') return false;
  return (
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
  );
};

export const canUseWebShare = (files?: File[]): boolean => {
  if (typeof navigator === 'undefined' || !navigator.share) return false;
  if (!files || files.length === 0) return true;
  if (navigator.canShare && typeof navigator.canShare === 'function') {
    try {
      return navigator.canShare({ files });
    } catch (e) {
      return false;
    }
  }
  return true;
};

export const saveOrSharePhoto = async (
  dataUrl: string,
  filename: string
): Promise<{ success: boolean; method: 'share' | 'download' | 'new_tab' | 'cancel' }> => {
  const file = dataUrlToFile(dataUrl, filename);

  if (canUseWebShare([file])) {
    try {
      await navigator.share({
        files: [file],
        title: filename,
      });
      return { success: true, method: 'share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancel' };
      }
      console.warn('Web Share failed, attempting fallback download:', err);
    }
  }

  // Fallback for browsers without Web Share file support
  const blob = dataUrlToBlob(dataUrl);
  const blobUrl = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  
  if (isIOS()) {
    // iOS Safari long-press or new tab support
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
  }

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  return { success: true, method: isIOS() ? 'new_tab' : 'download' };
};

export const saveOrShareMultiplePhotos = async (
  photos: { dataUrl: string; filename: string }[]
): Promise<{ success: boolean; count: number; method: 'share' | 'download' | 'cancel' }> => {
  if (photos.length === 0) return { success: false, count: 0, method: 'download' };

  const files = photos.map(p => dataUrlToFile(p.dataUrl, p.filename));

  if (canUseWebShare(files)) {
    try {
      await navigator.share({
        files,
        title: `保存した写真 (${photos.length}枚)`,
      });
      return { success: true, count: photos.length, method: 'share' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, count: 0, method: 'cancel' };
      }
      console.warn('Batch Web Share failed, falling back to individual download:', err);
    }
  }

  // Sequential download with Blob URLs
  let downloadedCount = 0;
  for (let i = 0; i < photos.length; i++) {
    const photo = photos[i];
    const blob = dataUrlToBlob(photo.dataUrl);
    const blobUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = photo.filename;
    
    if (isIOS()) {
      link.target = '_blank';
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    downloadedCount++;

    setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
  }

  return { success: true, count: downloadedCount, method: 'download' };
};
