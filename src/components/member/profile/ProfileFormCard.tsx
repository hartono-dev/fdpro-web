import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/ui/DatePicker";
import { Button } from "@/components/ui/Button";
import { SearchSelect } from "@/components/ui/SearchSelect";
import { AlertCircle, Edit, Info, Lock, Save, X } from "lucide-react";
import { countries } from "@/data/indonesia";
import { useAddress, type AddressOption } from "@/hooks/useAddress";

type ProfileFormCardProps = {
  user: {
    name?: string;
    phone?: string;
    email?: string;
    nik?: string;
    dob?: string;
    address?: string;
    rt?: string;
    rw?: string;
    country?: string;
    province?: string;
    city?: string;
    district?: string;
    village?: string;
    postalCode?: string;
    // Nama wilayah ter-resolve dari backend (untuk tampilan view mode).
    provinceName?: string;
    cityName?: string;
    districtName?: string;
    villageName?: string;
  };
  onUpdate: (data: any) => Promise<void>;
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
);

/**
 * Susun alamat menjadi 3 baris terstruktur. Setiap segmen hanya dirender
 * jika datanya ada, agar tidak muncul label seperti "RT undefined".
 *   Baris 1: {address} RT {rt} RW {rw}
 *   Baris 2: Kel. {villageName} Kec. {districtName}
 *   Baris 3: {cityName}, {provinceName} {postal_code}
 */
const buildAddressLines = (u: ProfileFormCardProps["user"]): string[] => {
  const line1 = [
    u.address,
    u.rt ? `RT ${u.rt}` : "",
    u.rw ? `RW ${u.rw}` : "",
  ].filter(Boolean).join(" ");
  const village = u.villageName || u.village;
  const district = u.districtName || u.district;
  const city = u.cityName || u.city;
  const province = u.provinceName || u.province;
  const line2 = [
    village ? `Kel. ${village}` : "",
    district ? `Kec. ${district}` : "",
  ].filter(Boolean).join(" ");
  const cityProvince = [city, province].filter(Boolean).join(", ");
  const line3 = [cityProvince, u.postalCode].filter(Boolean).join(" ");
  return [line1, line2, line3].filter((line) => line.trim().length > 0);
};

/**
 * Cocokkan nilai wilayah yang tersimpan (bisa berupa ID seperti "JK" atau
 * NAMA seperti "DKI Jakarta") dengan opsi dari API. Khusus label kota yang
 * berprefix tipe ("Kota X" / "Kabupaten X"), cocokkan tanpa prefix tersebut.
 */
const matchAddressOption = (options: AddressOption[], raw?: string): string => {
  if (!raw) return "";
  const byValue = options.find((o) => o.value === raw);
  if (byValue) return byValue.value;
  const norm = (s: string) => s.toLowerCase().trim();
  const rawNorm = norm(raw);
  const byLabel = options.find((o) => norm(o.label) === rawNorm);
  if (byLabel) return byLabel.value;
  const bySuffix = options.find(
    (o) => norm(o.label).replace(/^(kota|kabupaten)\s+/, "") === rawNorm
  );
  if (bySuffix) return bySuffix.value;
  return raw; // Tetap pakai nilai asli; pengguna bisa memilih ulang manual.
};

const resetFormDataFromUser = (user: ProfileFormCardProps["user"]) => ({
  name: user.name || "",
  email: user.email || "",
  phone: user.phone || "",
  nik: user.nik || "",
  dob: user.dob ? user.dob.split("T")[0] : "",
  address: user.address || "",
  rt: user.rt || "",
  rw: user.rw || "",
  country: user.country || "ID",
  province: user.province || "",
  city: user.city || "",
  district: user.district || "",
  village: user.village || "",
  postalCode: user.postalCode || "",
});

export function ProfileFormCard({ user, onUpdate }: ProfileFormCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(() => resetFormDataFromUser(user));
  const addressLines = buildAddressLines(user);

  const {
    provinces,
    cities,
    districts,
    villages,
    setProvinceId,
    setCityId,
    setDistrictId,
    reset: resetAddress,
  } = useAddress();

  // Pre-fill cascade dropdown dari data alamat yang tersimpan
  // (bisa berupa ID maupun nama). Dijalankan sekali, kecuali setelah
  // pengguna menekan "Batal" (prefill dijalankan ulang).
  const storedAddressRef = useRef({
    province: user.province || "",
    city: user.city || "",
    district: user.district || "",
    village: user.village || "",
  });
  const prefillDone = useRef(false);
  const [prefillRun, setPrefillRun] = useState(0);

  useEffect(() => {
    if (prefillDone.current || provinces.length === 0) return;
    const v = matchAddressOption(provinces, storedAddressRef.current.province);
    setFormData((p) => ({ ...p, province: v }));
    if (v) {
      setProvinceId(v);
    } else {
      prefillDone.current = true;
    }
  }, [provinces, prefillRun, setProvinceId, setFormData]);

  useEffect(() => {
    if (prefillDone.current || cities.length === 0) return;
    const v = matchAddressOption(cities, storedAddressRef.current.city);
    setFormData((p) => ({ ...p, city: v }));
    if (v) {
      setCityId(v);
    } else {
      prefillDone.current = true;
    }
  }, [cities, prefillRun, setCityId, setFormData]);

  useEffect(() => {
    if (prefillDone.current || districts.length === 0) return;
    const v = matchAddressOption(districts, storedAddressRef.current.district);
    setFormData((p) => ({ ...p, district: v }));
    if (v) {
      setDistrictId(v);
    } else {
      prefillDone.current = true;
    }
  }, [districts, prefillRun, setDistrictId, setFormData]);

  useEffect(() => {
    if (prefillDone.current || villages.length === 0) return;
    const v = matchAddressOption(villages, storedAddressRef.current.village);
    const postal = villages.find((o) => o.value === v)?.postalCode || "";
    setFormData((p) => ({
      ...p,
      village: v,
      postalCode: postal || p.postalCode,
    }));
    prefillDone.current = true;
  }, [villages, prefillRun, setFormData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRtRwChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const val = value.replace(/\D/g, "").slice(0, 3);
    setFormData((prev) => ({ ...prev, [name]: val }));
  };

  const handleProvinceChange = (val: string) => {
    setFormData((p) => ({ ...p, province: val, city: "", district: "", village: "", postalCode: "" }));
    setProvinceId(val);
  };

  const handleCityChange = (val: string) => {
    setFormData((p) => ({ ...p, city: val, district: "", village: "", postalCode: "" }));
    setCityId(val);
  };

  const handleDistrictChange = (val: string) => {
    setFormData((p) => ({ ...p, district: val, village: "", postalCode: "" }));
    setDistrictId(val);
  };

  const handleVillageChange = (val: string) => {
    const villageData = villages.find((o) => o.value === val);
    setFormData((p) => ({ ...p, village: val, postalCode: villageData?.postalCode || "" }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      // Payload sesuai skema tabel member: phone + alamat terstruktur.
      await onUpdate({
        phone: formData.phone,
        address: formData.address,
        rt: formData.rt,
        rw: formData.rw,
        country: formData.country,
        province: formData.province,
        city: formData.city,
        district: formData.district,
        village: formData.village,
                postalCode: formData.postalCode,
        dob: formData.dob,
      });
      setIsEditing(false); // Switch back to view mode on success
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form ke data awal + jalankan ulang cascade pre-fill.
    setFormData(resetFormDataFromUser(user));
    resetAddress();
    prefillDone.current = false;
    setPrefillRun((r) => r + 1);
    setIsEditing(false);
    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Data Pribadi
        </CardTitle>
        <CardDescription>
            {isEditing ? "Klik 'Simpan' untuk menyimpan perubahan." : "Klik 'Ubah Data' untuk mengedit informasi Anda."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          // EDIT MODE
          <form onSubmit={handleFormSubmit} className="space-y-4">
              {/* IDENTITAS INTI — DITANDA TANGANI OLEH ADMIN, READ-ONLY */}
              <div className="space-y-3 rounded-lg border border-dashed border-gray-300 bg-gray-50/50 p-4">
                <p className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <Lock className="h-3.5 w-3.5" />
                  Data Identitas (Terkunci)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Nama Lengkap</label>
                      <Input id="name" name="name" value={formData.name} readOnly disabled className="bg-gray-100 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input id="email" name="email" type="email" value={formData.email} readOnly disabled className="bg-gray-100 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="nik" className="text-sm font-medium">No. KTP (NIK)</label>
                      <Input id="nik" name="nik" value={formData.nik} readOnly disabled className="bg-gray-100 text-gray-500" />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="dob" className="text-sm font-medium">Tanggal Lahir</label>
                      <DatePicker
                        id="dob"
                        value={formData.dob}
                        disabled
                        placeholder="Tanggal lahir tidak dapat diedit"
                      />
                  </div>
                </div>
                <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-2 py-1.5">
                  <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                  Hubungi Admin jika ada kesalahan pada data identitas ini.
                </p>
              </div>

              {/* FIELD YANG BOLEH DIEDIT */}
              <div className="space-y-2">
                  <label htmlFor="phone" className="text-sm font-medium">No. Telepon / WhatsApp</label>
                  <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} placeholder="08xxxxxxxxxx" />
              </div>
              {/* ALAMAT DOMISILI — STRUKTUR SESUAI PENDAFTARAN AWAL */}
              <div className="space-y-3 rounded-lg border bg-gray-50/50 p-4">
                <p className="text-sm font-semibold text-gray-700">Alamat Domisili</p>

                <div className="space-y-2">
                    <label htmlFor="address" className="text-sm font-medium">Alamat Jalan</label>
                    <Input id="address" name="address" value={formData.address} onChange={handleChange} placeholder="Nama Jalan, Gang, No. Rumah" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="rt" className="text-sm font-medium">RT</label>
                    <Input id="rt" name="rt" value={formData.rt} onChange={handleRtRwChange} placeholder="000" maxLength={3} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="rw" className="text-sm font-medium">RW</label>
                    <Input id="rw" name="rw" value={formData.rw} onChange={handleRtRwChange} placeholder="000" maxLength={3} />
                  </div>
                </div>

                <SearchSelect
                  label="Negara"
                  id="country"
                  options={countries}
                  value={formData.country}
                  onChange={(val) => setFormData((p) => ({ ...p, country: val }))}
                  placeholder="Pilih Negara"
                  searchPlaceholder="Cari negara..."
                />

                <SearchSelect
                  label="Provinsi"
                  id="province"
                  options={provinces}
                  value={formData.province}
                  onChange={handleProvinceChange}
                  placeholder="Pilih Provinsi"
                  searchPlaceholder="Cari provinsi..."
                />

                <SearchSelect
                  label="Kota/Kabupaten"
                  id="city"
                  options={cities}
                  value={formData.city}
                  onChange={handleCityChange}
                  placeholder={formData.province ? "Pilih Kota/Kabupaten" : "Pilih provinsi terlebih dahulu"}
                  searchPlaceholder="Cari kota/kabupaten..."
                  disabled={!formData.province}
                />

                <SearchSelect
                  label="Kecamatan"
                  id="district"
                  options={districts}
                  value={formData.district}
                  onChange={handleDistrictChange}
                  placeholder={formData.city ? "Pilih Kecamatan" : "Pilih kota/kabupaten terlebih dahulu"}
                  searchPlaceholder="Cari kecamatan..."
                  disabled={!formData.city}
                />

                <SearchSelect
                  label="Kelurahan"
                  id="village"
                  options={villages}
                  value={formData.village}
                  onChange={handleVillageChange}
                  placeholder={formData.district ? "Pilih Kelurahan" : "Pilih kecamatan terlebih dahulu"}
                  searchPlaceholder="Cari kelurahan..."
                  disabled={!formData.district}
                />

                <div className="space-y-2">
                    <label htmlFor="postalCode" className="text-sm font-medium">Kode Pos</label>
                    <Input id="postalCode" name="postalCode" value={formData.postalCode} disabled placeholder="Otomatis terisi dari kelurahan" className="bg-gray-100 text-gray-500" />
                </div>
              </div>
              {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                  </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
              </div>
          </form>
        ) : (
          // VIEW MODE
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 border rounded-lg p-4">
                <InfoRow label="Nama Lengkap" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="No. Telepon / WhatsApp" value={user.phone} />
                <InfoRow label="No. KTP (NIK)" value={user.nik} />
                <InfoRow label="Tanggal Lahir" value={user.dob ? new Date(user.dob).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'}) : '—'} />
                <div className="md:col-span-2">
                    <div className="py-2">
                      <p className="text-xs text-muted-foreground">Alamat Domisili</p>
                      {addressLines.length > 0 ? (
                        <div className="flex flex-col text-sm font-medium text-foreground">
                          {addressLines.map((line) => (
                            <span key={line}>{line}</span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-foreground">{"\u2014"}</p>
                      )}
                    </div>
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Ubah Data
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
