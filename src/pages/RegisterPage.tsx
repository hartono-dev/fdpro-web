import { useState, useMemo, useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardDescription, CardTitle } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id as idLocale } from "date-fns/locale";
import { DatePicker } from "@/components/ui/DatePicker";
import { api } from "@/lib/api";
import { useReferralName } from "@/hooks/useReferralName";
import { useReferralTracker } from "@/hooks/useReferralTracker";
import { UserPlus, Info, Check } from 'lucide-react';

import { useAddress } from "@/hooks/useAddress";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/;
const EMAIL_ERROR_MSG = 'Format email tidak valid (contoh: nama@email.com)';
const NIK_REGEX = /^\d{16}$/;
const NIK_ERROR_MSG = 'NIK tidak valid. NIK wajib terdiri dari tepat 16 digit angka.';

// PRD §5.2.7 — sessionStorage key untuk lead_id (Intercept & Clean URL).
// sessionStorage (bukan localStorage): lead_id spesifik per-kampanye tidak boleh
// bocor antar sesi browser; otomatis hilang saat tab ditutup.
const LEAD_ID_SESSION_KEY = 'fdpro_reg_lead_id';

const RegisterPage = () => {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [step, setStep] = useState(1);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [nikError, setNikError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    nik: '',
    pob: '',
    dob: '',
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

  // ── Batas Usia Minimum 17 Tahun (form registrasi kemitraan) ─────────
  // `legalAgeDate` = tanggal 17 tahun lalu dari hari ini — tanggal lahir
  // TERAKHIR yang sah (usia >= 17). Kalender men-disable semua tanggal di
  // atasnya (`maxDate`) agar pendaftar di bawah umur tidak bisa memilih.
  // State `formData.dob` sengaja KOSONG (`''`) agar pendaftar sadar memilih,
  // dengan placeholder menampilkan tanggal 17 tahun lalu sbg panduan.
  const legalAgeDate = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 17);
    return d;
  }, []);
  const legalAgePlaceholder = format(legalAgeDate, 'd MMM yyyy', { locale: idLocale });

  // Referral diambil dari localStorage (First-Click Wins, 60 hari).
  // Fallback ke parameter URL jika tracker belum sempat menyimpannya
  // (misalnya pengunjung masuk langsung ke halaman /register).
  const { referralId } = useReferralTracker();

  // Resolve kode FDPro menjadi nama mitra referral untuk ditampilkan
  const { name: referralName } = useReferralName(referralId || undefined);

  const {
    provinces, cities, districts, villages,
    setProvinceId, setCityId, setDistrictId,
    } = useAddress();

  // Intercept & Clean URL: simpan lead_id ke sessionStorage, lalu bersihkan query
  // string agar address bar selalu tampil /register. `ref` dikelola terpisah oleh
  // useReferralTracker → localStorage (First-Click Wins, 60 hari); lead_id dipindah
  // ke sessionStorage karena spesifik per-kampanye (terhapus saat tab ditutup).
  // replaceState tidak reload; HANYA lead_id yang dihapus di sini — ref dibiarkan
  // agar useReferralTracker tetap sempat menyimpannya ke localStorage. (PRD §5.2.7)
  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    const hadParams = sp.toString().length > 0;
    const leadId = sp.get('lead_id');

    if (leadId) {
      try {
        sessionStorage.setItem(LEAD_ID_SESSION_KEY, leadId);
      } catch {
        // sessionStorage penuh / non-aktif — abaikan; lead_id tetap terbaca dari URL di render pertama
      }
      sp.delete('lead_id');
    }

    if (hadParams) {
      const remaining = sp.toString();
      window.history.replaceState(
        {},
        document.title,
        remaining ? `${window.location.pathname}?${remaining}` : window.location.pathname
      );
    }
  }, []);

  // Proteksi keamanan: blokir akses langsung ke /register tanpa kode referral.
  // Redirect ke landing page jika tidak ada kode referral valid (dari URL ?ref=
  // atau localStorage). Logika tracker sudah menyediakan nilai null bila tidak ada.
  // Diletakkan SETELAH semua hook calls (useReferralName, useAddress) agar
  // tidak melanggar Rules of Hooks — semua hook selalu dieksekusi secara berurutan.
  if (!referralId) {
    return <Navigate to="/" replace />;
  }


  const handleAddressChange = (type: 'province' | 'city' | 'district', id: string) => {
    setFormData(prev => {
      const next = { ...prev, [type]: id };
      if (type === 'province') {
        next.city = ''; next.district = ''; next.village = ''; next.postalCode = '';
      }
      if (type === 'city') {
        next.district = ''; next.village = ''; next.postalCode = '';
      }
      if (type === 'district') {
        next.village = ''; next.postalCode = '';
      }
      return next;
    });
    if (type === 'province') { setProvinceId(id); setCityId(''); setDistrictId(''); }
    if (type === 'city') { setCityId(id); setDistrictId(''); }
    if (type === 'district') { setDistrictId(id); }
  };


  // Jika sudah login, redirect ke dashboard
  // useEffect(() => {
  //   if (user) {
  //     navigate('/member');
  //   }
  // }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { id, value } = e.target;
    // Blokir input non-numeric untuk field NIK; strip karakter non-angka & batasi 16 digit
    if (id === 'nik') {
      const numericValue = value.replace(/\D/g, '').slice(0, 16);
      setFormData(prev => ({ ...prev, [id]: numericValue }));
      setNikError(null);
      return;
    }
    setFormData(prev => ({ ...prev, [id]: value }));
    // Clear email error saat user mengetik
    if (id === 'email') setEmailError(null);
  };

  const validateEmail = (email: string): boolean => {
    if (!EMAIL_REGEX.test(email)) {
      setEmailError(EMAIL_ERROR_MSG);
      return false;
    }
    setEmailError(null);
    return true;
  };

  const validateNik = (nik: string): boolean => {
    if (!NIK_REGEX.test(nik)) {
      setNikError(NIK_ERROR_MSG);
      return false;
    }
    setNikError(null);
    return true;
  };

  const handleNextStep1 = async () => {
    setError('');
    
    // 1. Validasi format lokal
    if (!validateEmail(formData.email)) return;
    if (!formData.name || !formData.phone) {
      setError('Mohon lengkapi nama dan nomor WhatsApp');
      return;
    }

    // 2. Cek duplikasi email di backend (asynchronous)
    setIsCheckingEmail(true);
    try {
      const res = await api.get(`/api/auth/check-email?email=${encodeURIComponent(formData.email)}`);
      if (res.exists) {
        setEmailError('Email ini sudah terdaftar. Silakan gunakan email lain atau masuk ke akun Anda.');
        return;
      }
      // Jika aman, lanjut ke step 2
      setStep(2);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat mengecek email');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    // Guard: validasi email sebelum submit
    if (!validateEmail(formData.email)) {
      setLoading(false);
      return;
    }

    // Guard: validasi NIK sebelum submit
    if (!validateNik(formData.nik)) {
      setLoading(false);
      return;
    }

    // Guard: validasi Tanggal Lahir (wajib diisi — input diganti DatePicker yang
    // tidak punya atribut `required` native; cek manual agar dob tak terkirim kosong).
    if (!formData.dob) {
      setError('Tanggal lahir wajib diisi.');
      setLoading(false);
      return;
    }

    setLoading(true);
    
    try {
      // PRD §5.2.7 — forward lead_id dari URL agar backend dapat mencatat
      // pendaftaran ke lead yang bersangkutan (membedakan "link disaharekan"
      // dari "benar-benar terdaftar").
      // Baca lead_id dari sessionStorage (disimpan di mount) sebagai fallback bila
      // query string sudah dibersihkan oleh Intercept & Clean URL di atas.
      const leadIdParam =
        new URLSearchParams(window.location.search).get('lead_id') ||
        sessionStorage.getItem(LEAD_ID_SESSION_KEY);
            const payload = {
        ...formData,
        fdCode: referralId,
        ...(leadIdParam ? { lead_id: leadIdParam } : {}),
      };
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
              Data Anda telah kami terima dan sedang menunggu persetujuan upline Anda
              sesuai alur approval FDPro. Password login akan dikirim ke email Anda
              segera setelah akun Anda diaktifkan.
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
                      <Input
                        id="email"
                        type="email"
                        required
                        placeholder="nama@email.com"
                        value={formData.email}
                        onChange={handleInputChange}
                        onBlur={() => formData.email && validateEmail(formData.email)}
                      />
                      {emailError && <p className="text-xs text-red-500">{emailError}</p>}
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">No. WhatsApp</Label>
                      <Input id="phone" type="tel" required value={formData.phone} onChange={handleInputChange} />
                    </div>

                  </div>
                  <Button 
                    type="button" 
                    className="w-full" 
                    onClick={handleNextStep1}
                    disabled={isCheckingEmail}
                  >
                    {isCheckingEmail ? "Mengecek Email..." : "Lanjut ke Data Diri"}
                  </Button>
                </div>
              )}

              {/* Step 2: Data Diri */}
              {step === 2 && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="nik">No. KTP (NIK)</Label>
                      <Input
                        id="nik"
                        required
                        inputMode="numeric"
                        maxLength={16}
                        placeholder="16 digit angka"
                        value={formData.nik}
                        onChange={handleInputChange}
                        onBlur={() => formData.nik && validateNik(formData.nik)}
                      />
                      {nikError && <p className="text-xs text-red-500">{nikError}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="pob">Tempat Lahir</Label>
                      <Input id="pob" required value={formData.pob} onChange={handleInputChange} />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                     <div className="space-y-2">
                      <Label htmlFor="dob">Tanggal Lahir</Label>
                      {/* Global DatePicker: ikon kalender di kanan + seluruh kotak clickable.
                          State `formData.dob` sengaja KOSONG agar pendaftar sadar memilih;
                          placeholder = tanggal 17 tahun lalu (format "dd Mmm yyyy").
                          `maxDate={legalAgeDate}` men-disable semua tanggal dengan usia < 17
                          (mencegah pendaftar di bawah umur); nilai tersimpan tetap
                          `YYYY-MM-DD` (kontrak DatePicker) → payload API tidak berubah.
                          `defaultViewDate={legalAgeDate}` → kalender membuka LANGSUNG pada
                          bulan/tahun 17 tahun lalu, tidak perlu scroll jauh dari tahun ini. */}
                      <DatePicker
                        id="dob"
                        value={formData.dob}
                        onValueChange={(v) => setFormData((p) => ({ ...p, dob: v }))}
                        maxDate={legalAgeDate}
                        defaultViewDate={legalAgeDate}
                        placeholder={legalAgePlaceholder}
                        // Force popup membuka ke BAWAH kotak input (matikan
                        // auto-flip ke atas) — header kalender tak terpotong,
                        // tahun/bulan tetap bisa diklik. Aman menimpa field di
                        // bawah karena z-index kalender `z-[9999]`.
                        forceBottom
                      />
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
                  
                  <div className="space-y-2">
                    <Label htmlFor="address">Alamat Lengkap (Jalan/No. Rumah)</Label>
                    <Input id="address" required value={formData.address} onChange={handleInputChange} placeholder="Contoh: Jl. Merdeka No. 123" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="province">Provinsi</Label>
                      <select
                        id="province"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        value={formData.province}
                        onChange={(e) => handleAddressChange('province', e.target.value)}
                      >
                        <option value="">Pilih Provinsi</option>
                        {provinces.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="city">Kota/Kabupaten</Label>
                      <select
                        id="city"
                        required
                        disabled={!formData.province}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                        value={formData.city}
                        onChange={(e) => handleAddressChange('city', e.target.value)}
                      >
                        <option value="">Pilih Kota</option>
                        {cities.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="district">Kecamatan</Label>
                      <select
                        id="district"
                        required
                        disabled={!formData.city}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                        value={formData.district}
                        onChange={(e) => handleAddressChange('district', e.target.value)}
                      >
                        <option value="">Pilih Kecamatan</option>
                        {districts.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="village">Kelurahan/Desa</Label>
                      <select
                        id="village"
                        required
                        disabled={!formData.district}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:opacity-50"
                        value={formData.village}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormData(p => ({ ...p, village: val }));
                          // Auto-fill postal code jika ada
                          const postal = villages.find(x => x.value === val)?.postalCode;
                          if (postal) setFormData(p => ({ ...p, postalCode: postal }));
                        }}
                      >
                        <option value="">Pilih Kelurahan</option>
                        {villages.map(v => <option key={v.value} value={v.value}>{v.label}</option>)}
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="rt">RT</Label>
                      <Input id="rt" placeholder="000" value={formData.rt} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="rw">RW</Label>
                      <Input id="rw" placeholder="000" value={formData.rw} onChange={handleInputChange} />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="postalCode">Kode Pos</Label>
                      <Input
                        id="postalCode"
                        placeholder="Otomatis terisi dari kelurahan"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        disabled
                        readOnly
                        className="bg-gray-100 text-gray-500"
                      />
                    </div>
                  </div>


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
