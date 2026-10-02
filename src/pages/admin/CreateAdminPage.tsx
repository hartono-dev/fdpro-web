import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { UserPlus } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
import { z } from 'zod';

/**
 * Daftar hak akses (permission) yang dapat diberikan ke admin yang dibuat.
 *
 * @dev Source of truth sisi-klien form Tambah Admin; backend `createAdmin`
 *      memvalidasi & menyimpan ke kolom `User.permissions` (PostgreSQL `text[]`
 *      via Prisma `String[]`). Setiap value HARUS ada di `VALID_PERMISSIONS`
 *      (authMiddleware.ts) agar konsisten & anti typo.
 *
 * Arsitektur RBAC:
 * - Super Admin (`role: 'super_admin'`) adalah ROLE, bukan permission â€” ia
 *   otomatis mengakses SEMUA fitur dan TIDAK wajib dicentang di sini. Backend
 *   (`hasPermission`) melewati pengecekan permission untuk super_admin demi
 *   memastikan mereka tidak terbatas oleh data `permissions` yang berbeda.
 * - Permission di bawah ini hanya mengikat role `admin` yang dibuat manual.
 *
   * Dampak tiap permission:
   * - `view_reports`        : akses laporan & statistik (termasuk statistik global admin).
   * - `manajemen_pengguna`  : kelola akun pengguna & member, set status (active/suspend/terminate).
   * - `pengaturan_sistem`   : atur parameter/variabel sistem (menu "Pengaturan Sistem" di /admin/settings).
   */

const PERMISSION_OPTIONS: { value: string; label: string; description: string }[] = [
  { value: 'view_reports', label: 'Lihat Laporan', description: 'Mengakses laporan dan statistik.' },
  { value: 'manajemen_pengguna', label: 'Manajemen Pengguna', description: 'Mengelola akun pengguna' },
  { value: 'pengaturan_sistem', label: 'Pengaturan Sistem', description: 'Mengelola parameter sistem agen' },
];


// Skema validasi (Zod) untuk form pembuatan admin â€” DOB wajib.
const createAdminSchema = z.object({
  name: z.string().min(1, 'Nama lengkap wajib diisi'),
  email: z.string().email('Format email tidak valid'),
  phone: z.string().min(1, 'No. WhatsApp / Telepon wajib diisi'),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Tanggal lahir wajib diisi (YYYY-MM-DD)'),
    // Fase 3 (RBAC): minimal 1 hak akses wajib dipilih. Kosong = ditolak.
  permissions: z.array(z.string()).min(1, 'Pilih minimal satu hak akses untuk admin ini.'),
});

type FormState = { name: string; email: string; phone: string; dob: string; };

export default function CreateAdminPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
    const [form, setForm] = useState<FormState>({ name: '', email: '', phone: '', dob: '' });
    const [permissions, setPermissions] = useState<string[]>([]);
  const [permissionsError, setPermissionsError] = useState<string | null>(null);
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
    // Hapus error "minimal 1 hak akses" begitu user memilih/mengganti pilihan.
    setPermissionsError(null);
  };

  const validate = () => {
    const result = createAdminSchema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone,
      dob: form.dob,
      permissions,
    });
    if (!result.success) {
            const next: Partial<Record<keyof FormState, string>> = {};
      for (const err of result.error.issues) {
        const key = err.path[0] as string | undefined;
        // `permissions` tak ada di FormState â€” ditangani terpisah agar bisa
        // merender pesan error "minimal 1 hak akses" di bawah checkbox.
        if (key === 'permissions') {
          setPermissionsError(err.message);
        } else if (key) {
          next[key as keyof FormState] = err.message;
        }
      }
      setErrors(next);
      return false;
    }
        setPermissionsError(null);
    setErrors({});
    return true;
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
        dob: form.dob,
        permissions,
      });
      toast.success('Admin berhasil dibuat. Kredensial sementara dikirim ke email admin baru.');
      navigate('/admin/users');
    } catch (error: any) {
      toast.error('Gagal membuat admin', { description: error?.message || 'Terjadi kesalahan pada server.' });
    } finally {
      setLoading(false);
    }
  };

    return (
    <div className="max-w-2xl mx-auto space-y-4">
      <Card>
        <CardHeader>
                    <CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5" /> Form Tambah Admin</CardTitle>

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
              <Label htmlFor="dob">Tanggal Lahir</Label>
              <DatePicker
                id="dob"
                value={form.dob}
                onValueChange={(v) => { setForm(p => ({ ...p, dob: v })); setErrors(p => ({ ...p, dob: '' })); }}
                placeholder="Pilih tanggal lahir"
                maxDate={new Date()}
              />
              {errors.dob && <p className="text-sm text-destructive">{errors.dob}</p>}
            </div>
            <div className="space-y-3">
                            <Label>Tambah Role</Label>
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
            {permissionsError && (
              <p className="text-sm text-destructive">{permissionsError}</p>
            )}
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

