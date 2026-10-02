import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { DatePicker } from '@/components/ui/DatePicker';

export type TaskId = 'policy' | 'agent_code' | 'training' | 'aaji_license';

export type TaskData = {
  [P in TaskId]?: any;
} & {
  policy?: { inforceDate: string; policyNumber: string; premium: number; paymentMode?: string };
  agent_code?: { agentCode: string };
  training?: { welcome: boolean; conversion: boolean };
  aaji_license?: { aajiDate: string; aajiCode: string };
};

// Opsi "Jenis Pembayaran" â€” pengali FYAP harus SELALU konsisten dengan
// backend (onboardingService.POLICY_PAYMENT_MODE_MULTIPLIERS). Frontend
// hanya menampilkan Preview; hasil FYAP final dihitung kembali di backend.
const PAYMENT_MODE_OPTIONS = [
  { value: 'bulanan', label: 'Bulanan', multiplier: 12 },
  { value: 'kuartalan', label: 'Kuartalan', multiplier: 4 },
  { value: 'semesteran', label: 'Semesteran', multiplier: 2 },
  { value: 'tahunan', label: 'Tahunan', multiplier: 1 },
] as const;

const DEFAULT_PAYMENT_MODE = 'tahunan';

export { PAYMENT_MODE_OPTIONS, DEFAULT_PAYMENT_MODE };

const formatRupiah = (value: number) => `Rp ${new Intl.NumberFormat('id-ID').format(value)}`;

interface OnboardingTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: TaskId;
  currentData?: any;
  agentName: string;
  onSave: (taskId: TaskId, data: any) => Promise<void> | void;
}

const TASK_LABELS: Record<TaskId, { title: string; description: string }> = {
  policy: { title: 'Beli Polis', description: '' },
  agent_code: { title: 'Dapatkan Kode Agen', description: '' },
  training: { title: 'Selesaikan Pelatihan', description: '' },
  aaji_license: { title: 'Lisensi AAJI', description: '' },
};

export function OnboardingTaskModal({ open, onOpenChange, taskId, currentData, agentName, onSave }: OnboardingTaskModalProps) {
  const label = TASK_LABELS[taskId];

  const [policyForm, setPolicyForm] = useState({
    inforceDate: '',
    policyNumber: '',
    paymentMode: DEFAULT_PAYMENT_MODE,
    premium: { raw: '', formatted: '' },
  });

  const [agentCodeForm, setAgentCodeForm] = useState({ agentCode: '' });
  const [trainingForm, setTrainingForm] = useState({ welcome: false, conversion: false });
  const [aajiForm, setAajiForm] = useState({ aajiDate: '', aajiCode: '' });
  // Status buka/tutup popup kalender "Tanggal Lisensi AAJI". Dipakai untuk
  // memberi ruang (padding-bottom) pada form secara DINAMIS selagi kalender
  // terbuka, agar kalender (dirender inline) punya tempat & bisa di-scroll
  // sampai tombol "OKE" terlihat — pendekatan CSS Scroll & Padding.
  const [aajiCalOpen, setAajiCalOpen] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePremiumChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value.replace(/\D/g, '');
    const numValue = Number(rawValue);

    if (isNaN(numValue)) {
      setPolicyForm((prev) => ({
        ...prev,
        premium: { raw: '', formatted: '' },
      }));
      return;
    }

    setPolicyForm((prev) => ({
      ...prev,
      premium: {
        raw: rawValue,
        formatted: new Intl.NumberFormat('id-ID').format(numValue),
      },
    }));
  };

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (currentData) {
      if (taskId === 'policy') {
        const rawPremium = (currentData.premium || '').toString().replace(/\D/g, '');
        const numPremium = Number(rawPremium);
        const savedMode = String(currentData.paymentMode || '');
        setPolicyForm({
          inforceDate: currentData.inforceDate || '',
          policyNumber: currentData.policyNumber || '',
          // Prefill mode pembayaran yang tersimpan; fallback ke kosong bila
          // tidak valid / belum pernah diisi (data lama sebelum fitur ini).
          paymentMode: PAYMENT_MODE_OPTIONS.some((o) => o.value === savedMode) ? savedMode : '',
          premium: {
            raw: rawPremium,
            formatted: isNaN(numPremium) ? '' : new Intl.NumberFormat('id-ID').format(numPremium),
          },
        });
      } else if (taskId === 'agent_code') {
        setAgentCodeForm({ agentCode: currentData.agentCode || '' });
      } else if (taskId === 'training') {
        setTrainingForm({ welcome: !!currentData.welcome, conversion: !!currentData.conversion });
      } else if (taskId === 'aaji_license') {
        setAajiForm({
          aajiDate: currentData.aajiDate || '',
          aajiCode: currentData.aajiCode || '',
        });
      }
    } else {
      // Default "Tanggal Inforce" = hari ini (ISO lokal, kontrak DatePicker).
      // Polis boleh di-backdate, sehingga hari ini hanya titik awal yang aman.
      if (taskId === 'policy') setPolicyForm({ inforceDate: format(new Date(), 'yyyy-MM-dd'), policyNumber: '', paymentMode: '', premium: { raw: '', formatted: '' } });
      if (taskId === 'agent_code') setAgentCodeForm({ agentCode: '' });
      if (taskId === 'training') setTrainingForm({ welcome: false, conversion: false });
      // Default "Tanggal Lisensi AAJI" = hari ini (ISO lokal). Lisensi AAJI
      // tidak bisa terbit di masa depan, jadi hari ini adalah pilihan terbaru
      // yang valid; agen tetap bebas mundur ke tahun-tahun sebelumnya.
      if (taskId === 'aaji_license') setAajiForm({ aajiDate: format(new Date(), 'yyyy-MM-dd'), aajiCode: '' });
    }
  }, [open, currentData, taskId]);

  // "Hari ini" dalam ISO lokal (date-fns, bukan `toISOString()` UTC) agar
  // konsisten dengan nilai `YYYY-MM-DD` dari DatePicker / <input type="date">.
  const todayIso = format(new Date(), 'yyyy-MM-dd');

  // â”€â”€ Live Preview FYAP (UI only; nilai final dihitung ulang di backend) â”€â”€
  const selectedPaymentMode =
    PAYMENT_MODE_OPTIONS.find((o) => o.value === policyForm.paymentMode) ?? PAYMENT_MODE_OPTIONS[3];
  const premiumNum = Number(policyForm.premium.raw);
  const fyapPreview =
    taskId === 'policy' && policyForm.premium.raw.trim() !== '' && Number.isFinite(premiumNum) && premiumNum > 0
      ? Math.round(premiumNum * selectedPaymentMode.multiplier * 100) / 100
      : 0;

  const validate = (): string | null => {
    if (taskId === 'policy') {
      if (!policyForm.inforceDate) return 'Tanggal Inforce wajib diisi';
      if (policyForm.inforceDate > todayIso) return 'Tanggal Inforce tidak boleh lebih dari hari ini';
      if (!policyForm.policyNumber.trim()) return 'No. Polis wajib diisi';
      if (!PAYMENT_MODE_OPTIONS.some((o) => o.value === policyForm.paymentMode)) {
        return 'Jenis Pembayaran wajib dipilih';
      }
      const premiumNum = Number(policyForm.premium.raw);
      if (!policyForm.premium.raw.trim() || isNaN(premiumNum) || premiumNum <= 0) {
        return 'Premi harus berupa angka yang valid dan lebih dari 0';
      }
    }
    if (taskId === 'agent_code') {
      if (!agentCodeForm.agentCode.trim()) return 'Kode Agen wajib diisi';
    }
    if (taskId === 'training') {
      if (!trainingForm.welcome || !trainingForm.conversion) {
        return 'Kedua modul pelatihan harus dicentang untuk menyelesaikan task';
      }
    }
    if (taskId === 'aaji_license') {
      if (!aajiForm.aajiDate) return 'Tanggal AAJI wajib diisi';
      if (aajiForm.aajiDate > todayIso) return 'Tanggal AAJI tidak boleh lebih dari hari ini';
      if (!aajiForm.aajiCode.trim()) return 'Kode AAJI wajib diisi';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      let payload: any;
      if (taskId === 'policy') {
        payload = {
          ...policyForm,
          premium: Number(policyForm.premium.raw), // Kirim sebagai angka murni
        };
      }
      else if (taskId === 'agent_code') payload = { ...agentCodeForm };
      else if (taskId === 'training') payload = { ...trainingForm };
      else payload = { ...aajiForm };
      await onSave(taskId, payload);
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan data');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* `hideCloseButton` menyembunyikan ikon "X" bawaan (Dialog.tsx). Sebagai
          gantinya, tombol teks hijau "Batal" di kanan atas (diposisikan absolute di
          sudut modal) yang menutup modal — bukan navigasi router, agar pengguna
          tidak terlempar dari halaman utama pembuka modal ini. */}
      <DialogContent
        hideCloseButton
        className="max-w-md max-h-[90vh] overflow-y-auto overscroll-contain pb-6"
      >
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          aria-label="Batal"
          className="absolute right-6 top-6 text-green-600 hover:text-green-700 font-medium cursor-pointer bg-transparent border-none p-0 focus:outline-none disabled:pointer-events-none"
        >
          Batal
        </button>
        <DialogHeader>
          <DialogTitle className="text-[#002D62]">{label.title}</DialogTitle>
          {label.description && (
            <p className="text-sm text-gray-500 pt-1">{label.description}</p>
          )}
          <p className="text-xs text-gray-400 pt-1">
            {agentName}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {taskId === 'policy' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="inforceDate">Tanggal Inforce</Label>
                {/* Global DatePicker: ikon kalender di kanan + seluruh kotak clickable (alur 2-langkah Pilih -> OKE).
                    TANPA minDate -> tanggal masa lalu bebas dipilih (backdating polis diizinkan); maxDate = hari ini
                    agar polis tidak bisa inforce di masa depan. Rentang tahun dropdown otomatis [tahun ini - 90 s/d maxYear]. */}
                <DatePicker
                  id="inforceDate"
                  value={policyForm.inforceDate}
                  onValueChange={(v) => setPolicyForm((prev) => ({ ...prev, inforceDate: v }))}
                  maxDate={new Date()}
                  placeholder="Pilih tanggal inforce"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policyNumber">No. Polis</Label>
                <Input id="policyNumber" type="text" value={policyForm.policyNumber}
                  onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })}
                  placeholder="Input no Polis" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premium">Premi (Rp)</Label>
                <Input id="premium" type="text" inputMode="numeric" value={policyForm.premium.formatted}
                  onChange={handlePremiumChange}
                  placeholder="Input premi" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMode">Jenis Pembayaran</Label>
                <select id="paymentMode" value={policyForm.paymentMode} required
                  onChange={(e) => setPolicyForm({ ...policyForm, paymentMode: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                  <option value="" disabled>Pilih jenis pembayaran</option>
                  {PAYMENT_MODE_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <p className="text-xs text-green-600">
                FYAP: {formatRupiah(fyapPreview)}
              </p>
            </>
          )}

          {taskId === 'agent_code' && (
            <div className="space-y-2">
              <Label htmlFor="agentCode">Kode Agen</Label>
              <Input id="agentCode" type="text" value={agentCodeForm.agentCode}
                onChange={(e) => setAgentCodeForm({ agentCode: e.target.value })}
                placeholder="Isi Kode Agen Sequis" required />
            </div>
          )}

          {taskId === 'training' && (
            <>
              <p className="text-sm text-gray-700 font-medium">Centang modul pelatihan yang sudah diikuti agen:</p>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={trainingForm.welcome}
                  onChange={(e) => setTrainingForm({ ...trainingForm, welcome: e.target.checked })}
                  className="h-4 w-4 accent-[#002D62] cursor-pointer" />
                <p className="font-medium text-sm">Modul "Selamat Datang"</p>
              </label>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={trainingForm.conversion}
                  onChange={(e) => setTrainingForm({ ...trainingForm, conversion: e.target.checked })}
                  className="h-4 w-4 accent-[#002D62] cursor-pointer" />
                <p className="font-medium text-sm">Modul "Conversion"</p>
              </label>
            </>
          )}

          {taskId === 'aaji_license' && (
            <div
              className={
                aajiCalOpen
                  ? 'space-y-4 pb-[320px] transition-all duration-300 ease-in-out'
                  : 'space-y-4 pb-6 transition-all duration-300 ease-in-out'
              }
            >
              <div className="space-y-2">
                <Label htmlFor="aajiDate">Tanggal Lisensi AAJI</Label>
                {/* Global DatePicker: ikon kalender di kanan + seluruh kotak clickable
                    (alur 2-langkah Pilih → OKE). Default = hari ini. `maxDate` = hari ini →
                    tanggal besok & seterusnya di-disable (lisensi AAJI tak mungkin terbit di
                    masa depan); TANPA `minDate` → agen bebas memilih tahun-tahun sebelumnya.
                    Nilai tersimpan tetap `YYYY-MM-DD` (kontrak DatePicker, sama dengan input
                    native lama) sehingga payload API tidak berubah.
                    `portal={false}` -> kalender dirender INLINE di dalam modal & diberi
                    ruang via padding-bottom dinamis (`pb-[320px]` selagi terbuka) dengan
                    transisi halus `transition-all duration-300 ease-in-out` — modal hanya
                    memanjang saat kalender terbuka & kembali compact (`pb-6`) saat ditutup. */}
                <DatePicker
                  id="aajiDate"
                  value={aajiForm.aajiDate}
                  onValueChange={(v) => setAajiForm((prev) => ({ ...prev, aajiDate: v }))}
                  onOpenChange={setAajiCalOpen}
                  portal={false}
                  maxDate={new Date()}
                  placeholder="Pilih tanggal lisensi AAJI"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aajiCode">Kode AAJI</Label>
                <Input id="aajiCode" type="text" value={aajiForm.aajiCode}
                  onChange={(e) => setAajiForm({ ...aajiForm, aajiCode: e.target.value })}
                  placeholder="Input kode AAJI" required />
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="submit" disabled={submitting} className="bg-[#002D62] hover:bg-[#001f47]">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
