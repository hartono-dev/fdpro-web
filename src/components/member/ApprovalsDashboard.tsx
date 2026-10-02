import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { api } from '@/lib/api';
import { getRoleName } from '@/lib/profileUtils';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { TeamEmptyState } from '@/components/member/TeamEmptyState';

/**
 * Format DOB (ISO string / Date) menjadi tanggal ringkas DD/MM/YYYY.
 * Parsing dilakukan pada string ISO (slice YYYY-MM-DD) agar BEBAS
 * pergeseran timezone — bukan via getDay() lokal.
 */
const formatDob = (dob: unknown): string => {
  if (!dob) return '';
  let iso = '';
  if (typeof dob === 'string') {
    iso = dob.slice(0, 10);
  } else {
    try {
      iso = new Date(dob as string | number | Date).toISOString().slice(0, 10);
    } catch {
      return '';
    }
  }
  const [y, m, d] = iso.split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};

/** Gabungkan POB + DOB menjadi satu baris TTL, mis. "Jakarta, 17/05/1990". */
const formatBirthPlace = (member: any): string =>
  [member?.pob || '', formatDob(member?.dob)].filter(Boolean).join(', ');

/**
 * Susun alamat domisili menjadi 3 baris human-readable:
 *   Baris 1: {address} RT. {rt} RW. {rw}
 *   Baris 2: Kel. {villageName} Kec. {districtName}
 *   Baris 3: {cityName}, {provinceName} {postalCode}
 * Optional chaining + fallback '' di semua variabel agar tidak crash /
 * tidak muncul label yatim ("RT undefined") bila data belum lengkap.
 */
const buildAddressLines = (member: any): string[] => {
  const m = member ?? {};
  const line1 = [
    m.address || '',
    m.rt ? `RT. ${m.rt}` : '',
    m.rw ? `RW. ${m.rw}` : '',
  ].filter(Boolean).join(' ');
  const line2 = [
    m.villageName ? `Kel. ${m.villageName}` : '',
    m.districtName ? `Kec. ${m.districtName}` : '',
  ].filter(Boolean).join(' ');
  const line3 = [
    [m.cityName || '', m.provinceName || ''].filter(Boolean).join(', '),
    m.postalCode || '',
  ].filter(Boolean).join(' ');
  return [line1, line2, line3].filter(Boolean);
};

export function ApprovalsDashboard() {
  const [approvals, setApprovals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/approvals/pending');
      // Defensive programming: buang baris duplikat untuk calon agen yang sama
      // (proteksi terhadap data ganda warisan di DB sebelum perbaikan backend).
      const uniqueData = Array.from(
        new Map(((data ?? []) as any[]).map((item) => [item.user?.id ?? item.id, item])).values()
      );
      setApprovals(uniqueData);
    } catch (err: any) {
      console.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

    const handleApprove = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui anggota ini?')) return;
    try {
      const response = await api.post(`/api/approvals/${id}/approve`);
      alert(response.message || 'Pendaftaran berhasil disetujui!');
      setIsModalOpen(false);
      fetchApprovals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Masukkan alasan penolakan:');
    if (!reason) return;
    try {
      const response = await api.post(`/api/approvals/${id}/reject`, { notes: reason });
      alert(response.message || 'Pendaftaran ditolak.');
      setIsModalOpen(false);
      fetchApprovals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p>Memuar antrian approval...</p>;

  if (approvals.length === 0) {
    return <TeamEmptyState message="Tidak ada data persetujuan (approval) baru saat ini." />;
  }

  return (
    <Card>
      <CardContent className="p-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Tingkat</TableHead>
              <TableHead>Tanggal</TableHead>
              <TableHead className="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {approvals.map((app: any) => (
              <TableRow key={app.id}>
                <TableCell className="font-medium">{app.user.name}</TableCell>
                <TableCell>{app.user.email}</TableCell>
                                <TableCell>
                  {app.type === 'user_status_change' ? (
                    <Badge className="bg-orange-100 text-orange-700 border-none">Perubahan Status</Badge>
                  ) : app.level === 2 ? (
                    <Badge className="bg-purple-100 text-purple-700 border-none">Level 2 (Final Approval)</Badge>
                  ) : (
                    <Badge className="bg-blue-100 text-blue-700 border-none">Level 1 (Perekrut)</Badge>
                  )}
                </TableCell>
                <TableCell>{new Date(app.createdAt).toLocaleDateString('id-ID')}</TableCell>
                <TableCell className="text-right">
                  <Button size="sm" onClick={() => { setSelectedApproval(app); setIsModalOpen(true); }}>
                    Lihat Detail
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
                        <DialogHeader>
              <DialogTitle>
                {selectedApproval?.type === 'user_status_change'
                  ? 'Perubahan Status Pengguna'
                  : 'Data Calon Agen'}
              </DialogTitle>
              <p className="text-xs text-gray-500 mt-1">
                {selectedApproval?.type === 'user_status_change'
                  ? 'Persetujuan perubahan status pengguna (diarahkan ke BP/ABP)'
                  : selectedApproval?.level === 2
                    ? 'Level 2 — Final Approval (ABP/BP di atas jaringan perekrut)'
                    : 'Level 1 — Persetujuan Perekrut/Atasan langsung'}
              </p>
            </DialogHeader>
                        {selectedApproval && (
              <div className="space-y-4">
                {selectedApproval.type === 'user_status_change' ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500 text-xs">Nama Lengkap</p>
                        <p className="font-medium">{selectedApproval.user.name}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Email</p>
                        <p className="font-medium">{selectedApproval.user.email}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Role</p>
                        <p className="font-medium">{getRoleName(selectedApproval.user.role)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Status Saat Ini</p>
                        <p className="font-medium">{selectedApproval.user.status}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Status Tujuan</p>
                        <p className="font-medium text-orange-700">
                          {selectedApproval.payload?.target_status || '-'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 text-xs">Diajukan Oleh</p>
                        <p className="font-medium text-sm">Admin Panel</p>
                      </div>
                    </div>
                  </div>
                ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 text-xs">Nama Lengkap</p>
                      <p className="font-medium">{selectedApproval.user.name}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Email</p>
                      <p className="font-medium">{selectedApproval.user.email}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">WhatsApp</p>
                      <p className="font-medium">{selectedApproval.user.phone}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs">Tempat, Tanggal Lahir</p>
                      <p className="font-medium">
                        {(() => {
                          const ttl = formatBirthPlace(selectedApproval.user?.member);
                          return ttl || '—';
                        })()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-gray-500 text-xs">Alamat Domisili</p>
                    {(() => {
                      const lines = buildAddressLines(selectedApproval.user?.member);
                      return lines.length > 0 ? (
                        <div className="font-medium text-sm leading-relaxed mt-0.5">
                          {lines.map((line, idx) => (
                            <p key={`addr-${idx}`}>{line}</p>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 mt-0.5">Alamat belum diisi oleh calon agen.</p>
                      );
                    })()}
                  </div>
                </div>
                )}

                <div className="border-t pt-4 flex justify-end gap-3">
                  <Button variant="destructive" onClick={() => handleReject(selectedApproval.id)}>
                    Tolak
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedApproval.id)}>
                    Setuju
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
