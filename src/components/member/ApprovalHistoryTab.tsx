import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { TeamEmptyState } from '@/components/member/TeamEmptyState';

// Mapping warna badge berdasarkan STATUS FINAL calon agen.
// Backend sudah melakukan pemetaan dari users.status (Single Source of Truth),
// frontend cukup menampilkan apa adanya tanpa logika tambahan.
const STATUS_BADGE_STYLES: Record<string, string> = {
  'DISETUJUI': 'bg-green-100 text-green-700 hover:bg-green-100 border-none',
  'DITOLAK': 'bg-red-100 text-red-700 hover:bg-red-100 border-none',
  'MENUNGGU PERSETUJUAN': 'bg-amber-100 text-amber-700 hover:bg-amber-100 border-none',
  // FIX: Add SUSPEND badge style - previously fell to DEFAULT_BADGE_STYLE (amber)
  'SUSPEND': 'bg-orange-100 text-orange-700 hover:bg-orange-100 border-none',
  'TERMINASI': 'bg-gray-100 text-gray-700 hover:bg-gray-100 border-none',
};

const DEFAULT_BADGE_STYLE = STATUS_BADGE_STYLES['MENUNGGU PERSETUJUAN'];

export function ApprovalHistoryTab() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/approvals/history');
      setHistory(data ?? []);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  if (loading) return <p className="text-gray-500 py-4">Memuat riwayat...</p>;

  if (history.length === 0) {
    return <TeamEmptyState message="Belum ada riwayat persetujuan." />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Status Akhir</TableHead>
                <TableHead>Alasan Penolakan</TableHead>
                <TableHead>Tanggal Selesai</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((app: any) => (
                <TableRow key={app.userId ?? app.id}>
                  <TableCell className="font-medium">
                    <div>
                      <p>{app.name}</p>
                      <p className="text-xs text-gray-400 font-normal">{app.email}</p>
                      {app.fdCode && (
                        <p className="text-xs text-gray-400 font-normal">{app.fdCode}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={STATUS_BADGE_STYLES[app.status] ?? DEFAULT_BADGE_STYLE}>
                      {app.status}
                    </Badge>
                  </TableCell>
                  {/* Guard: notes kosong/null dirender sebagai strip agar sel tidak bolong */}
                  <TableCell>
                    <p className="text-sm max-w-[200px] truncate md:max-w-xs md:whitespace-normal">
                      {app.notes && app.notes.trim() !== '' ? app.notes : '-'}
                    </p>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500 whitespace-nowrap">
                    {app.updatedAt
                      ? new Date(app.updatedAt).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
      </CardContent>
    </Card>
  );
}

