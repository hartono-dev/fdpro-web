import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

/**
 * Mengambil nama mitra referral berdasarkan kode FDPro.
 *
 * @param fdCode Kode FDPro referral (mis. "FD2608xxxx").
 * @returns { name } nama mitra referral, atau `null` jika kode belum
 *          ditemukan / proses sedang berjalan / kode tidak valid.
 */
export function useReferralName(fdCode?: string) {
  const [name, setName] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    if (!fdCode) {
      setName(null);
      return;
    }

    setName(null);

    api
      .get(`/api/referrals/${encodeURIComponent(fdCode)}`)
      .then((data) => {
        if (isMounted && data?.name) {
          setName(data.name);
        } else if (isMounted) {
          setName(null);
        }
      })
      .catch(() => {
        if (isMounted) setName(null);
      });

    return () => {
      isMounted = false;
    };
  }, [fdCode]);

  return { name };
}