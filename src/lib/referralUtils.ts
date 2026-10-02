export const REFERRAL_KEY = "fdpro_referral_data";
export const REFERRAL_EXPIRY_MS = 60 * 24 * 60 * 60 * 1000; // 60 Days

interface ReferralData {
  code: string;
  timestamp: number;
}

/**
 * Mendapatkan kode referral yang tersimpan jika masih valid (< 60 hari).
 */
export const getStoredReferral = (): string | null => {
  try {
    const stored = localStorage.getItem(REFERRAL_KEY);
    if (!stored) return null;

    const data: ReferralData = JSON.parse(stored);
    const now = Date.now();

    if (now - data.timestamp > REFERRAL_EXPIRY_MS) {
      localStorage.removeItem(REFERRAL_KEY);
      return null;
    }

    return data.code;
  } catch (error) {
    console.error("Error reading referral from localStorage", error);
    return null;
  }
};

/**
 * Menyimpan kode referral dengan aturan "First-Click Wins".
 * Hanya menyimpan jika belum ada data atau data lama sudah kedaluwarsa.
 */
export const setStoredReferral = (code: string): void => {
  if (!code) return;

  const existing = getStoredReferral();
  
  // First-Click Wins: Jangan timpa jika sudah ada yang valid
  if (existing) {
    return;
  }

  const data: ReferralData = {
    code,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(REFERRAL_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("Error saving referral to localStorage", error);
  }
};

/**
 * Membersihkan parameter ?ref= dari URL tanpa reload halaman.
 */
export const clearReferralParam = (): void => {
  const url = new URL(window.location.href);
  if (url.searchParams.has("ref")) {
    url.searchParams.delete("ref");
    window.history.replaceState({}, document.title, url.pathname + url.search);
  }
};
