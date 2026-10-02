import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { MoreHorizontal, Clock } from 'lucide-react';
import { toast } from 'sonner';
import { getRoleName } from '@/lib/profileUtils';

// --- Default sort untuk tabel Manajemen User ---
// Aturan: (1) Terminated di paling bawah; (2) Sisa diurut alfabetis A-Z by Nama.
// PRD changelog #80: penataan posisi terminated di bawah tabel
const sortUsersByDefault = (users: User[]): User[] =>
  [...users].sort((a, b) => {
    // Terminated selalu berada di bawah
    if (a.status === 'terminated' && b.status !== 'terminated') return 1;
    if (a.status !== 'terminated' && b.status === 'terminated') return -1;
    // Semua non-terminated (atau semua terminated) urut A-Z by nama
    return a.name.localeCompare(b.name);
  });


type User = {
  id: string;
  fdCode: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
  pendingApproval: {
    approvalId: string | null;
    targetStatus: string | null;
  } | null;
};



// Mapping target status -> label pending yang ditampilkan di UI
const PENDING_STATUS_LABELS: Record<string, string> = {
  active: 'Pending Aktif',
  suspended: 'Pending Suspend',
  terminated: 'Pending Terminate',
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      // Terapkan pengurutan default: terminated di bawah, sisanya A-Z by nama
      setUsers(sortUsersByDefault(response));
    } catch (err) {
      setError('Gagal memuat daftar pengguna.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

    const handleStatusChange = async (userId: string, status: 'active' | 'suspended' | 'terminated') => {
    if (!confirm(`Apakah Anda yakin ingin mengubah status pengguna ini menjadi ${status}?`)) return;
    
    try {
      const response = await api.patch(`/api/admin/users/${userId}/status`, { status });
      
      if (response.requiresApproval) {
        toast.info(
          `Permintaan persetujuan perubahan status ke ${response.approval.targetStatus} ` +
          `telah dikirim ke ${response.approval.approver.name}.`
        );
      } else {
        toast.success('Status pengguna berhasil diubah.');
      }
      fetchUsers();
    } catch (error: any) {
      toast.error('Gagal mengubah status pengguna.');
      console.error(error);
    }
  };

  if (loading) return <div>Memuat pengguna...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
        <div className="space-y-4">
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama</TableHead>
                <TableHead>Kontak</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Tanggal Daftar</TableHead>
                <TableHead><span className="sr-only">Aksi</span></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">
                    <div>{user.name}</div>
                    {user.fdCode && (
                      <div className="text-xs text-muted-foreground">{user.fdCode}</div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div>{user.email}</div>
                    <div className="text-xs text-muted-foreground">{user.phone}</div>
                  </TableCell>
                                    <TableCell><Badge variant="outline">{getRoleName(user.role)}</Badge></TableCell>
                                  <TableCell>
                  {user.pendingApproval ? (
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-800 border-yellow-200">
                      <Clock className="h-3 w-3 mr-1" />
                      {PENDING_STATUS_LABELS[user.pendingApproval.targetStatus || ''] || `Pending ${user.pendingApproval.targetStatus}`}
                    </Badge>
                  ) : (
                    <Badge variant={user.status === 'active' ? 'default' : 'destructive'}>{user.status}</Badge>
                  )}
                </TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>
                  {user.pendingApproval ? (
                    <Button variant="ghost" className="h-8 w-8 p-0" disabled>
                      <span className="sr-only">Menunggu persetujuan</span>
                      <Clock className="h-4 w-4 text-yellow-500" />
                    </Button>
                  ) : user.status === 'terminated' ? (
                    // Status terminated adalah final & permanen — tombol aksi disembunyikan (PRD changelog #80)
                    <span className="text-muted-foreground text-sm">-</span>
                  ) : (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Buka menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'active')}>
                          Set Aktif
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'suspended')}>
                          Set Suspend
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleStatusChange(user.id, 'terminated')}>
                          Set Terminate
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminUsersPage;
