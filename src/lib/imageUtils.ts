/**
 * Utility untuk image crop + auto-resize di browser.
 * Digunakan oleh UploadAvatarModal untuk:
 * 1. Mengekstrak area yang sudah di-crop (dari react-easy-crop)
 * 2. Me-resize hasil crop ke resolusi tetap (default 400×400)
  * 3. Mengonversi ke Blob (WebP, kualitas 0.85) siap upload
 */

/** Ukuran output maksimal avatar (pixel). */
export const AVATAR_OUTPUT_SIZE = 400;

/** Kualitas WebP (0-1). 0.85 memberi keseimbangan ukuran vs kualitas yang baik. */
export const AVATAR_WEBP_QUALITY = 0.85;

export interface PixelCrop {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Memuat image dari URL/file path ke objek HTMLImageElement.
 * Mengembalikan Promise yang resolve ketika image siap digambar ke canvas.
 */
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Jika sumber adalah blob URL (dari URL.createObjectURL), crossOrigin tidak
    // perlu dan malah bisa menyebabkan gambar gagal dimuat karena browser
    // mencoba lakukan permintaan CORS ke blob: URL. Hanya atur crossOrigin untuk
    // URL HTTP(S) eksternal agar canvas tidak "tainted".
    if (!src.startsWith('blob:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve(img);
    // onerror menerima Event, bukan Error — jangan akses properti .message.
    img.onerror = () => reject(new Error(`Gagal memuat gambar dari sumber: ${src.substring(0, 50)}...`));
    img.src = src;
  });
}

/**
 * Menggunakan canvas untuk mengekstrak area crop dari image dan me-resizenya
 * ke ukuran persegi yang ditentukan (default 400×400).
 *
  * Hasilnya adalah Blob WebP yang siap dikirim ke backend via FormData.
 * Resize di sini penting agar:
 * - Bandwidth upload berkurang (400×400 WebP tipikal < 50KB)
 * - Storage server efisien
 * - Konsistensi ukuran thumbnail di seluruh UI
 */
export async function getCroppedImg(
  imageSrc: string,
  crop: PixelCrop,
  outputSize: number = AVATAR_OUTPUT_SIZE,
): Promise<Blob> {
  const image = await loadImage(imageSrc);

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser tidak mendukung canvas 2D');
  }

  // Set canvas ke ukuran output persegi
  canvas.width = outputSize;
  canvas.height = outputSize;

  // Gambar bagian yang sudah di-crop, diskalakan ke outputSize×outputSize.
  // drawImage dengan 9-argumen:
  //   (img, sx, sy, sw, sh, dx, dy, dw, dh)
  // Crop area (sx,sy,sw,sh) diproyeksikan ke canvas penuh (0,0,dw,dh).
  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error('Gagal mengonversi canvas ke Blob'));
        }
      },
            'image/webp',
      AVATAR_WEBP_QUALITY,
    );
  });
}