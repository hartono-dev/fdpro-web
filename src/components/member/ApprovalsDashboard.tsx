import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

export function ApprovalsDashboard() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const data = await api.get('/api/approvals/pending');
      setApprovals(data);
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
      await api.post(`/api/approvals/${id}/approve`);
      alert('Pendaftaran berhasil disetujui!');
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
      await api.post(`/api/approvals/${id}/reject`, { notes: reason });
      alert('Pendaftaran ditolak.');
      setIsModalOpen(false);
      fetchApprovals();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <p>Memuat antrian approval...</p>;

  return (
    <Card>
      <CardContent className="p-6">
        {approvals.length === 0 ? (
          <p className="text-gray-500 text-center py-4">Tidak ada pendaftaran menunggu approval.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Level</TableHead>
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
                    <span className={`px-2 py-1 rounded text-xs ${app.level === 1 ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                      Level {app.level}
                    </span>
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
        )}

        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detail Pendaftaran Anggota</DialogTitle>
            </DialogHeader>
            {selectedApproval && (
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
                    <p className="text-gray-500 text-xs">Level Approval</p>
                    <p className="font-medium">Level {selectedApproval.level}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4 flex justify-end gap-3">
                  <Button variant="destructive" onClick={() => handleReject(selectedApproval.id)}>
                    Tolak Pendaftaran
                  </Button>
                  <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={() => handleApprove(selectedApproval.id)}>
                    Setujui & Aktifkan
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
