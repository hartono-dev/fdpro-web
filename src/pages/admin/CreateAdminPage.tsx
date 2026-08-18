import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const PERMISSION_OPTIONS = [
  { value: 'manage_users', label: 'Kelola Pengguna', description: 'Mengelola akun dan status pengguna.' },
  { value: 'manage_events', label: 'Kelola Event', description: 'Membuat dan mengelola event/kegiatan.' },
  { value: 'view_reports', label: 'Lihat Laporan', description: 'Mengakses laporan dan statistik.' },
  { value: 'manage_approvals', label: 'Kelola Persetujuan', description: 'Menyetujui/menolak pengajuan.' },
];

type FormState = { name: string; email: string; phone: string; password: string; };

export default function CreateAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', password: '' });
  const [permissions, setPermissions] = useState<string[]>([]);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [loading, setLoading] = useState(false);

  if (user && user.role !== 'super_admin') {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Akses Ditolak</h2>
        <p className="text-sm text-muted-foreground">Hanya Super Admin yang dapat membuat admin baru.</p>
        <Button asChild variant="outline"><Link to="/admin/users">Kembali ke Manajemen Pengguna</Link></Button>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const togglePermission = (value: string) => {
    setPermissions((prev) => prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]);
  };

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) next.name = 'Nama lengkap wajib diisi.';
    if (!form.email.trim()) { next.email = 'Email wajib diisi.'; } 
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { next.email = 'Format email tidak valid.'; }
    if (!form.phone.trim()) next.phone = 'No. WhatsApp / Telepon wajib diisi.';
    if (!form.password) { next.password = 'Password wajib diisi.'; } 
    else if (form.password.length < 6) { next.password = 'Password minimal 6 karakter.'; }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/api/admin/create-admin', {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
        permissions,
      });
      toast.success('Admin berhasil dibuat!');
      navigate('/admin/users');
    } catch (error: any) {
      toast.error('Gagal membuat admin', { description: error?.message || 'Terjadi kesalahan pada server.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* HEADER */}
      <div>
        <Button asChild variant="ghost" size="sm" className="mb-2 -ml-2 text-muted-foreground">
          <Link to="/admin/users"><ArrowLeft className="h-4 w-4" /> Kembali</Link>
        </Button>
        <h2 className="text-2xl font-bold">Tambah Admin Baru</h2>
        <p className="text-sm text-muted-foreground">Buat akun admin baru. Admin wajib ganti password saat login pertama.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Form Admin</CardTitle>
          <CardDescription>Lengkapi data di bawah untuk membuat admin baru.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <div className="space-y-2">
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" value={form.name} onChange={handleChange} placeholder="cth. Budi Santoso" />
              {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="admin@contoh.com" />
              {errors.email && <p className="text-sm text-destructive">{errors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">No. WhatsApp / Telepon</Label>
              <Input id="phone" name="phone" value={form.phone} onChange={handleChange} placeholder="cth. 08123456789" />
              {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimal 6 karakter" />
              {errors.password && <p className="text-sm text-destructive">{errors.password}</p>}
            </div>
            <div className="space-y-3">
              <Label>Permissions</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {PERMISSION_OPTIONS.map((opt) => {
                  const checked = permissions.includes(opt.value);
                  return (
                    <label key={opt.value} className={cn('flex items-start gap-3 rounded-lg border p-3 cursor-pointer transition-colors', checked ? 'border-[#002D62] bg-[#002D62]/5' : 'hover:bg-gray-50')}>
                      <input type="checkbox" checked={checked} onChange={() => togglePermission(opt.value)} className="mt-1 h-4 w-4 accent-[#002D62] cursor-pointer" />
                      <span>
                        <span className="block text-sm font-medium text-gray-900">{opt.label}</span>
                        <span className="block text-xs text-muted-foreground">{opt.description}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button asChild variant="outline" type="button"><Link to="/admin/users">Batal</Link></Button>
              <Button type="submit" disabled={loading}>{loading ? 'Menyimpan...' : 'Buat Admin'}</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
