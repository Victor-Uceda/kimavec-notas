/**
 * Comprime y redimensiona una imagen en el cliente usando Canvas API nativa.
 * Reduce el peso hasta un 95% convirtiendo a WebP con calidad balanceada.
 */
export async function compressImageFile(
  file: File,
  maxWidth = 1280,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Redimensionar proporcionalmente si supera el ancho máximo
        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        // Exportar a WebP de bajo peso. Fallback automático a JPEG si el navegador no lo soporta.
        try {
          const webpData = canvas.toDataURL('image/webp', quality);
          if (webpData.startsWith('data:image/webp')) {
            resolve(webpData);
            return;
          }
        } catch {
          // Continuar con fallback
        }

        const jpegData = canvas.toDataURL('image/jpeg', quality);
        resolve(jpegData);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}
