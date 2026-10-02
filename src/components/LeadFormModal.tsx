import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Label } from "@/components/ui/label";
import { SearchSelect } from "@/components/ui/SearchSelect";
import {
  countries,
} from "@/data/indonesia";
import { useAddress } from "@/hooks/useAddress";
import { useReferralName } from "@/hooks/useReferralName";
import { getStoredReferral } from "@/lib/referralUtils";
import { api } from "@/lib/api";

type LeadFormModalProps = {
  trigger: React.ReactNode;
  formType: "consultation" | "registration";
  referralId?: string;
};

export function LeadFormModal({ trigger, formType, referralId }: LeadFormModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [country, setCountry] = useState("ID");
  const [province, setProvince] = useState("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [village, setVillage] = useState("");
  const [postalCode, setPostalCode] = useState("")
  const [dob, setDob] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [emailError, setEmailError] = useState<string | null>(null);

  const isConsultation = formType === 'consultation';

    // Referral efektif: ambil dari ?ref= (Incognito URL) → prop explisit → localStorage.
  // First-Click-Win via localStorage (getStoredReferral) sudah dipilih di sini;
  // ?ref= di-URL lebih diprioritaskan hanya bila valid (tidak kosong).
    // Semua nilai disanitize ke null (bukan undefined) agar JSON yang dikirim
  // eksplisit `fdCode: null` ketika tidak ada referral — backend akan menolak
  // dengan HTTP 400 karena fdCode sekarang required (PRD §5.2.x keamanan).
  const [searchParams] = useSearchParams();
  const urlRef = searchParams.get("ref");
  const urlRefClean = urlRef && urlRef.trim() ? urlRef.trim() : null;
  const effectiveReferralId = (urlRefClean || referralId || getStoredReferral() || null) ?? null;

    // Resolve kode FDPro menjadi nama mitra referral untuk ditampilkan.
  // `useReferralName` menerima `string | undefined`; konversi `null` → `undefined`
  // di sini agar tidak mengubah tipe `effectiveReferralId` (string | null) yang
  // disengaja dipakai eksplisit di payload JSON di bawah.
  const { name: referralName } = useReferralName(effectiveReferralId ?? undefined);

  const {
    provinces,
    cities,
    districts,
    villages,
    setProvinceId,
    setCityId,
    setDistrictId,
  } = useAddress();

  const handleProvinceChange = (val: string) => {
    setProvince(val);
    setProvinceId(val);
    setCity("");
    setDistrict("");
    setVillage("");
    setPostalCode("");
  };

  const handleCityChange = (val: string) => {
    setCity(val);
    setCityId(val);
    setDistrict("");
    setVillage("");
    setPostalCode("");
  };

  const handleDistrictChange = (val: string) => {
    setDistrict(val);
    setDistrictId(val);
    setVillage("");
    setPostalCode("");
  };

  const handleVillageChange = (val: string) => {
    setVillage(val);
    const villageData = villages.find(v => v.value === val);
    if (villageData) {
      setPostalCode(villageData.postalCode || "");
    }
  };

  function handleRtChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 3);
    setRt(val);
  }

  function handleRwChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value.replace(/\D/g, "").slice(0, 3);
    setRw(val);
  }

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError("Format email tidak valid (contoh: nama@email.com)");
      return false;
    }
    setEmailError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(event.currentTarget);
    const data = Object.fromEntries(formData.entries());

    if (!validateEmail(data.email as string)) {
      setIsLoading(false);
      return;
    }

    try {
      if (isConsultation) {
                const payload = {
          name: data.name,
          phone: data.whatsapp,
          email: data.email,
          cityDomicile: data.city,
          type: effectiveReferralId ? 'referral' : 'pool',
          referralId: effectiveReferralId ?? null,
        };
        await api.leads.create(payload);
      } else {
          const payload = {
            name: data.name,
            email: data.email,
            phone: data.whatsapp,
            // Password TIDAK diisi/dikirim dari client (PRD v1.0): password
            // default dibuat sistem saat aktivasi final & dikirim via Welcome Email.
            nik: data.ktp,
            pob: data.pob,
            dob: dob,
            gender: data.gender,
            address: data.address,
            country: country,
            province: province,
            city: city,
            district: district,
            village: village,
            rt: data.rt,
            rw: data.rw,
            postalCode: postalCode,
                    fdCode: effectiveReferralId,
            mustChangePwd: true,
          };
          const res = await api.post('/api/auth/register', payload);
          void res;
        }
      setIsSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setTimeout(() => setIsSuccess(false), 500);
      }, 3000);
        } catch (err: any) {
      // Dev: tampilkan error code/status agar frontend dapat menyelidiki
      // (mis. 400 REFERRAL_NOT_FOUND vs 500 constraint hint dari backend).
      const isDev = import.meta.env.MODE === "development";
      let msg = err.message || "Terjadi kesalahan saat mengirim data.";
      if (isDev) {
        const extra: string[] = [];
        if (err.code) extra.push(`code:${err.code}`);
        if (err.status) extra.push(`http:${err.status}`);
        if (err.meta) extra.push(`meta:${JSON.stringify(err.meta).slice(0, 120)}`);
        if (extra.length) msg += ` (${extra.join(", ")})`;
      }
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const resetFormState = () => {
    setIsLoading(false);
    setError(null);
    setIsSuccess(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open);
      if (!open) resetFormState();
    }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        {isSuccess ? (
          <div className="text-center py-10">
            <svg className="w-16 h-16 mx-auto text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            <DialogTitle className="mt-4">Terima Kasih!</DialogTitle>
            <DialogDescription className="mt-2">
              {isConsultation
                ? "Data Anda telah kami terima. Tim kami akan segera menghubungi Anda melalui WhatsApp."
                : "Pendaftaran Anda berhasil. Silakan cek email Anda untuk instruksi selanjutnya."
              }
            </DialogDescription>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isConsultation ? "Form Konsultasi Kemitraan" : "Form Pendaftaran Kemitraan"}
            </DialogTitle>
            <DialogDescription>
              {isConsultation
                ? "Dapatkan panduan simulasi tabungan terproteksi & potensi second income yang sesuai dengan kondisi Anda."
                : `Lengkapi data diri sesuai KTP untuk proses verifikasi kemitraan.`
              }
              {!isConsultation && effectiveReferralId && (
                <span className="block mt-1 font-semibold text-primary">Referral: {referralName || effectiveReferralId}</span>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Field Nama */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">{isConsultation ? "Nama Lengkap *" : "Nama Sesuai KTP"}</Label>
              <Input 
                id="name" 
                name="name" 
                placeholder={isConsultation ? "Masukkan nama lengkap Anda" : "Masukkan Nama Lengkap"} 
                required 
              />
            </div>

            {/* Field WhatsApp & Email */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="whatsapp">No. WhatsApp *</Label>
                <Input 
                  id="whatsapp" 
                  name="whatsapp" 
                  type="tel" 
                  placeholder={isConsultation ? "081234567890" : "0812..."} 
                  required 
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Alamat Email *</Label>
                <Input 
                  id="email" 
                  name="email" 
                  type="email" 
                  placeholder={isConsultation ? "nama@email.com" : "nama@email.com"} 
                  required 
                  onChange={() => {
                    // Hanya menghapus error yang ada — validasi format email
                    // TIDAK dilakukan real-time tiap ketik (onBlur + on-submit saja).
                    if (emailError) setEmailError(null);
                    if (error) setError(null);
                  }}
                  // Trigger validasi format email saat pengguna meninggalkan kolom
                  // (on-blur), bukan saat mengetik. Kolom kosong dibiarkan ke
                  // validasi native required pada saat submit.
                  onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
                    if (e.target.value.trim()) validateEmail(e.target.value);
                  }}
                  aria-invalid={!!emailError}
                  className={emailError ? "border-red-500 text-red-600" : ""}
                />
                {emailError && <p className="text-red-500 text-xs mt-1 font-medium" role="alert">{emailError}</p>}
              </div>
            </div>

            {!isConsultation && (
              <>
                {/* Field KTP */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="ktp">No. KTP (NIK)</Label>
                  <Input id="ktp" name="ktp" placeholder="16 digit angka KTP" minLength={16} maxLength={16} required />
                </div>

                {/* Field Tempat & Tanggal Lahir */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="pob">Tempat Lahir</Label>
                    <Input id="pob" name="pob" placeholder="Kota Kelahiran" required />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="dob">Tanggal Lahir</Label>
                    <DatePicker
                      id="dob"
                      value={dob}
                      onValueChange={setDob}
                      placeholder="Pilih tanggal lahir"
                      maxDate={new Date()}
                    />
                  </div>
                </div>

                {/* Field Jenis Kelamin */}
                <div className="flex flex-col gap-2">
                  <Label htmlFor="gender">Jenis Kelamin</Label>
                  <select 
                    id="gender" 
                    name="gender" 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    required
                  >
                    <option value="">Pilih Jenis Kelamin</option>
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>

                {/* Alamat Domisili */}
                <div className="border rounded-md p-4 space-y-4 bg-gray-50">
                  <Label className="text-base font-semibold">Alamat Domisili</Label>

                  {/* Alamat */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="address">Alamat</Label>
                    <Input id="address" name="address" placeholder="Nama Jalan, Gang, No. Rumah" required />
                  </div>

                  {/* Negara */}
                  <SearchSelect
                    label="Negara"
                    options={countries}
                    value={country}
                    onChange={setCountry}
                    placeholder="Pilih Negara"
                    searchPlaceholder="Cari negara..."
                    required
                  />

                  {/* Provinsi */}
                   <SearchSelect
                     label="Provinsi"
                     options={provinces}
                     value={province}
                     onChange={handleProvinceChange}
                     placeholder="Pilih Provinsi"
                     searchPlaceholder="Cari provinsi..."
                     required
                   />

                  {/* Kota/Kabupaten */}
                   <SearchSelect
                     label="Kota/Kabupaten"
                     options={cities}
                     value={city}
                     onChange={handleCityChange}
                     placeholder={province ? "Pilih Kota/Kabupaten" : "Pilih provinsi terlebih dahulu"}
                     searchPlaceholder="Cari kota/kabupaten..."
                     required
                     disabled={!province}
                   />

                   {/* Kecamatan */}
                   <SearchSelect
                     label="Kecamatan"
                     options={districts}
                     value={district}
                     onChange={handleDistrictChange}
                     placeholder={city ? "Pilih Kecamatan" : "Pilih kota/kabupaten terlebih dahulu"}
                     searchPlaceholder="Cari kecamatan..."
                     required
                     disabled={!city}
                   />

                   {/* Kelurahan */}
                   <SearchSelect
                     label="Kelurahan"
                     options={villages}
                     value={village}
                     onChange={handleVillageChange}
                     placeholder={district ? "Pilih Kelurahan" : "Pilih kecamatan terlebih dahulu"}
                     searchPlaceholder="Cari kelurahan..."
                     required
                     disabled={!district}
                   />

                  {/* RT/RW */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="rt">RT</Label>
                      <Input id="rt" name="rt" placeholder="000" value={rt} onChange={handleRtChange} maxLength={3} required />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label htmlFor="rw">RW</Label>
                      <Input id="rw" name="rw" placeholder="000" value={rw} onChange={handleRwChange} maxLength={3} required />
                    </div>
                  </div>

                  {/* Kode Pos */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="postal_code">Kode Pos</Label>
                    <Input id="postal_code" name="postal_code" placeholder="Otomatis terisi dari kelurahan" value={postalCode} disabled />
                  </div>
                </div>
              </>
            )}

            {isConsultation && (
              <>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="city">Kota Domisili *</Label>
                  <Input id="city" name="city" placeholder="Contoh: Jakarta Selatan" required />
                </div>
                <div className="flex flex-col gap-2">
                  <Label htmlFor="job">Pekerjaan Saat Ini *</Label>
                  <Input id="job" name="job" placeholder="Contoh: Karyawan / Ibu Rumah Tangga" required />
                </div>
              </>
            )}

            {/* Privacy Policy Consent */}
            <div className="flex items-start gap-2 mt-2">
              <input 
                type="checkbox" 
                id="privacy" 
                name="privacy" 
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary" 
                required 
              />
              <Label htmlFor="privacy" className="text-xs leading-normal font-normal text-gray-600">
                {isConsultation ? (
                  <>
                    Saya menyetujui pemrosesan data pribadi di atas sesuai [Kebijakan Privasi] FDPro khusus untuk keperluan konsultasi program, analisis kebutuhan, dan komunikasi layanan. FDPro menjamin kerahasiaan data Anda dan tidak diperjualbelikan kepada pihak ketiga.
                  </>
                ) : (
                  <>
                    Saya menyatakan bahwa seluruh data pribadi yang saya berikan adalah benar, serta menyetujui pemrosesan data (termasuk NIK, data kontak, dan domisili) sesuai [Kebijakan Privasi] & [Syarat Ketentuan] FDPro untuk verifikasi keanggotaan, pencegahan akun ganda, dan komunikasi layanan. FDPro menjamin kerahasiaan data Anda dan tidak diperjualbelikan kepada pihak ketiga.
                  </>
                )}
              </Label>
            </div>
          </div>
          <DialogFooter className="flex-col gap-2">
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Mengirim...' : (isConsultation ? "KONSULTASI GRATIS" : "Konfirmasi & Daftar Sekarang")}
              </Button>
              {error && <p className="text-sm text-red-500 text-center">{error}</p>}
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
