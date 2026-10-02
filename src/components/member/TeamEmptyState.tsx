import { Card, CardContent } from '@/components/ui/Card';
import { User as UserIcon } from 'lucide-react';

interface TeamEmptyStateProps {
  message: string;
}

/**
 * Empty-state visual yang konsisten untuk keempat tab di halaman Team
 * (Update, Approval, Riwayat, Team Anda).
 *
 * Ikon orang (User) berukuran 48px (h-12 w-12), berwarna abu-abu muda
 * (text-gray-300), berada di tengah (mx-auto) dengan margin bawah 1rem (mb-4).
 * Teks keterangan di bawahnya memakai warna abu-abu (text-gray-500).
 * Seluruhnya terpuskov di dalam Card > CardContent ber-padding vertikal 3rem
 * (py-12) dan terpusat horizontal (text-center).
 */
export function TeamEmptyState({ message }: TeamEmptyStateProps) {
  return (
    <Card>
      <CardContent className="py-12 text-center">
        <UserIcon className="h-12 w-12 text-gray-300 mx-auto mb-4" />
        <p className="text-gray-500">{message}</p>
      </CardContent>
    </Card>
  );
}
