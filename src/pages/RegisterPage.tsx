import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useReferralName } from "@/hooks/useReferralName";
import { Eye, EyeOff, UserPlus, Info, Check } from 'lucide-react';
import { DatePicker } from "@/components/ui/DatePicker";

const RegisterPage = () => {
  const [searchParams] = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    nik: '',
    pob: '',
    dob: new Date(),
    gender: 'Laki-laki',
    address: '',
    province: '',
    city: '',
    district: '',
    village: '',
    rt: '',
    rw: '',
    postalCode: '',
  });

  const referralId = searchParams.get('ref');

  // Resolve kode FDPro menjadi nama mitra referral untuk ditampilkan
  const { name: referralName } = useReferralName(referralId || undefined);

  // Jika sudah login, redirect ke dashboard
  // useEffect(() => {
  //   if (user) {
  //     navigate('/member');
  //   }
  // }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    setFormData(prev => ({ ...prev, [id]: value }));
  };

  const handleDateChange = (date: Date) => {
    setFormData(prev => ({ ...prev, dob: date }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
      const payload = { ...formData, referralId };
      await api.post('/api/auth/register', payload);
      setStep(3); // Go to success page
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat pendaftaran.');
    } finally {
      setLoading(false);
    }
  };

  if (step === 3) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <Card className="w-full max-w-lg text-center p-8">
          <CardHeader>
            <div className="mx-auto bg-green-100 rounded-full h-16 w-16 flex items-center justify-center">
              <Check className="h-8 w-8 text-green-600" />
            </div>
            <CardTitle className="mt-4 text-2xl">Pendaftaran Berhasil!</CardTitle>
            <CardDescription className="mt-2">
              Data Anda telah kami terima. Akun Anda sedang menunggu persetujuan dari tim kami. 
              Anda akan menerima notifikasi email setelah akun Anda aktif.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full mt-4">
              <Link to="/">Kembali ke Beranda</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 py-12">
      <div className="w-full max-w-2xl px-4">
        <Card>
          <CardHeader className="text-center">
            <UserPlus className="mx-auto h-12 w-12 text-primary" />
            <CardTitle className="mt-4">Form Pendaftaran Mitra FDPro</CardTitle>
            <CardDescription className="mt-2">
              {referralId ? `Anda direferensikan oleh ${referralName || referralId}. ` : ''} 
              Lengkapi data di bawah untuk bergabung.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="bg-red-50 text-red-700 p-3 rounded-md text-sm flex items-start gap-2">
                  <Info size={16} className="mt-0.5" />
                  <span>{error}</span>
                </div>
              )}
              
              {/* Step 1: Data Kontak */}
              {step === 1 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Lengkap (sesuai KTP)</Label>
                      <Input id="name" required value={formData.name} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input id="email" type="email" required value={formData.email} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. WhatsApp</Label>
                      <Input id="phone" type="tel" required value={formData.phone} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">Password</Label>
                      <div className="relative">
                        <Input id="password" type={showPassword ? "text" : "password"} required value={formData.password} onChange={handleInputChange} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                        <div className="mt-2 space-y-1">
                          <p className="text-[10px] text-gray-500 flex items-center gap-1">
                            <Info size={12} /> Password minimal 8 karakter, 1 huruf besar, 1 angka & 1 karakter spesial.
                          </p>
                        </div>

                  </div>
                  <Button type="button" className="w-full" onClick={() => setStep(2)}>
                    Lanjut ke Data Diri
                  </Button>
                </div>
              )}

              {/* Step 2: Data Diri */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nik">No. KTP (NIK)</Label>
                      <Input id="nik" required value={formData.nik} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pob">Tempat Lahir</Label>
                      <Input id="pob" required value={formData.pob} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="dob">Tanggal Lahir</Label>
                      <DatePicker selected={formData.dob} onSelect={handleDateChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="gender">Jenis Kelamin</Label>
                      <select
                        id="gender"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        value={formData.gender}
                        onChange={(e) => setFormData((p) => ({ ...p, gender: e.target.value }))}
                      >
                        <option value="Laki-laki">Laki-laki</option>
                        <option value="Perempuan">Perempuan</option>
                      </select>
                    </div>
                  </div>

                  <h3 className="font-medium pt-4 border-t">Alamat Domisili</h3>
                  
                  {/* Address fields here... */}

                  <div className="flex gap-4 pt-4">
                    <Button type="button" variant="outline" className="w-full" onClick={() => setStep(1)}>
                      Kembali
                    </Button>
                    <Button type="submit" className="w-full" disabled={loading}>
                      {loading ? "Menyimpan..." : "Daftar Sekarang"}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RegisterPage;
