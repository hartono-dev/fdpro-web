import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/DropdownMenu';
import { MoreHorizontal } from 'lucide-react';

type User = {
  id: string;
  fdCode: string | null;
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: string;
};

const roleLabels: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  calon_agen: 'Calon Agen',
  fc: 'FC',
  abp: 'ABP',
  bp: 'BP',
};

const AdminUsersPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/users');
      setUsers(response);
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
      await api.patch(`/api/admin/users/${userId}/status`, { status });
      // Refresh user list
      fetchUsers();
    } catch (error) {
      alert('Gagal mengubah status pengguna.');
      console.error(error);
    }
  };

  if (loading) return <div>Memuat pengguna...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Manajemen Pengguna</h2>
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
                  <TableCell><Badge variant="outline">{roleLabels[user.role] || user.role}</Badge></TableCell>
                  <TableCell><Badge variant={user.status === 'active' ? 'default' : 'destructive'}>{user.status}</Badge></TableCell>
                  <TableCell>{new Date(user.createdAt).toLocaleDateString('id-ID')}</TableCell>
                  <TableCell>
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
