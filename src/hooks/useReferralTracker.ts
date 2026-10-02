import { useEffect, useState } from "react";
import {
  clearReferralParam,
  getStoredReferral,
  setStoredReferral,
} from "@/lib/referralUtils";

/**
 * Hook pelacak referral berbasis localStorage dengan aturan "First-Click Wins" (60 hari).
 *
 * - Mendeteksi parameter `?ref=` pada URL saat aplikasi dimuat.
 * - Menyimpan kode referral hanya jika localStorage kosong / data lama sudah kedaluwarsa
 *   (kode pertama yang "menang", kode berikutnya diabaikan).
 * - Membersihkan parameter `?ref=` dari address bar TANPA reload halaman.
 * - Memaparkan kode referral yang valid (dari localStorage maupun URL) untuk konsumsi UI.
 */
export function useReferralTracker() {
  const [referralId, setReferralId] = useState<string | null>(() => {
    // Baca sinkron agar render pertama sudah benar (tidak ada flash UI salah)
    const stored = getStoredReferral();
    if (stored) return stored;

    const urlRef = new URLSearchParams(window.location.search).get("ref")?.trim();
    return urlRef || null;
  });

  useEffect(() => {
    // Data di localStorage lebih valid dari parameter URL (First-Click Wins)
    const stored = getStoredReferral();

    if (stored) {
      setReferralId(stored);
      clearReferralParam();
      return;
    }

    const urlRef = new URLSearchParams(window.location.search).get("ref")?.trim();

    if (urlRef) {
      // localStorage kosong / kedaluwarsa → simpan kode pertama kali ini
      setStoredReferral(urlRef);
      setReferralId(getStoredReferral());
      clearReferralParam();
      return;
    }

    setReferralId(null);
  }, []);

  return { referralId };
}
