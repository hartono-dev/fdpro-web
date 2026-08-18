import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle } from 'lucide-react';

export type TaskId = 'policy' | 'agent_code' | 'training' | 'aaji_license';

export type TaskData = {
  [P in TaskId]?: any;
} & {
  policy?: { inforceDate: string; policyNumber: string; premium: number };
  agent_code?: { agentCode: string };
  training?: { welcome: boolean; conversion: boolean };
  aaji_license?: { aajiDate: string; aajiCode: string };
};

interface OnboardingTaskModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  taskId: TaskId;
  currentData?: any;
  agentName: string;
  onSave: (taskId: TaskId, data: any) => Promise<void> | void;
}

const TASK_LABELS: Record<TaskId, { title: string; description: string }> = {
  policy: { title: 'Beli Polis', description: 'Catat pembelian polis pertama calon agen.' },
  agent_code: { title: 'Dapatkan Kode Agen', description: 'Masukkan kode agen Sequis yang sudah diberikan.' },
  training: { title: 'Ikuti Pelatihan', description: 'Centang kedua modul pelatihan yang sudah diikuti.' },
  aaji_license: { title: 'Dapatkan Lisensi AAJI', description: 'Catat tanggal dan kode lisensi AAJI calon agen.' },
};

export function OnboardingTaskModal({ open, onOpenChange, taskId, currentData, agentName, onSave }: OnboardingTaskModalProps) {
  const label = TASK_LABELS[taskId];

  const [policyForm, setPolicyForm] = useState({
    inforceDate: '',
    policyNumber: '',
    premium: { raw: '', formatted: '' },
  });

  const [agentCodeForm, setAgentCodeForm] = useState({ agentCode: '' });
  const [trainingForm, setTrainingForm] = useState({ welcome: false, conversion: false });
  const [aajiForm, setAajiForm] = useState({ aajiDate: '', aajiCode: '' });

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
        setPolicyForm({
          inforceDate: currentData.inforceDate || '',
          policyNumber: currentData.policyNumber || '',
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
      if (taskId === 'policy') setPolicyForm({ inforceDate: '', policyNumber: '', premium: { raw: '', formatted: '' } });
      if (taskId === 'agent_code') setAgentCodeForm({ agentCode: '' });
      if (taskId === 'training') setTrainingForm({ welcome: false, conversion: false });
      if (taskId === 'aaji_license') setAajiForm({ aajiDate: '', aajiCode: '' });
    }
  }, [open, currentData, taskId]);

  const todayIso = new Date().toISOString().split('T')[0];

  const validate = (): string | null => {
    if (taskId === 'policy') {
      if (!policyForm.inforceDate) return 'Tanggal Inforce wajib diisi';
      if (policyForm.inforceDate > todayIso) return 'Tanggal Inforce tidak boleh lebih dari hari ini';
      if (!policyForm.policyNumber.trim()) return 'No. Polis wajib diisi';
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#002D62]">{label.title}</DialogTitle>
          <p className="text-sm text-gray-500 pt-1">{label.description}</p>
          <p className="text-xs text-gray-400 pt-1">
            Untuk: <span className="font-semibold text-gray-700">{agentName}</span>
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {taskId === 'policy' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="inforceDate">Tanggal Inforce</Label>
                <Input id="inforceDate" type="date" value={policyForm.inforceDate} max={todayIso}
                  onChange={(e) => setPolicyForm({ ...policyForm, inforceDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="policyNumber">No. Polis</Label>
                <Input id="policyNumber" type="text" value={policyForm.policyNumber}
                  onChange={(e) => setPolicyForm({ ...policyForm, policyNumber: e.target.value })}
                  placeholder="Contoh: 3001234567" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="premium">Premi (Rp)</Label>
                <Input id="premium" type="text" inputMode="numeric" value={policyForm.premium.formatted}
                  onChange={handlePremiumChange}
                  placeholder="Contoh: 1.500.000" required />
                <p className="text-xs text-gray-500">Nominal akan otomatis diformat. Pastikan jumlah digit sudah benar.</p>
              </div>
            </>
          )}

          {taskId === 'agent_code' && (
            <div className="space-y-2">
              <Label htmlFor="agentCode">Kode Agen (Sequis)</Label>
              <Input id="agentCode" type="text" value={agentCodeForm.agentCode}
                onChange={(e) => setAgentCodeForm({ agentCode: e.target.value })}
                placeholder="Contoh: SQ-AG-12345" required />
              <p className="text-xs text-gray-500">
                Kode agen ini akan otomatis tersinkronisasi ke profil calon agen.
              </p>
            </div>
          )}

          {taskId === 'training' && (
            <>
              <p className="text-sm text-gray-700 font-medium">Centang kedua modul yang sudah diselesaikan:</p>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={trainingForm.welcome}
                  onChange={(e) => setTrainingForm({ ...trainingForm, welcome: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[#002D62] cursor-pointer" />
                <div>
                  <p className="font-medium text-sm">Modul "Selamat Datang"</p>
                  <p className="text-xs text-gray-500">Pengenalan dasar bisnis kemitraan FDPro.</p>
                </div>
              </label>
              <label className="flex items-start gap-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={trainingForm.conversion}
                  onChange={(e) => setTrainingForm({ ...trainingForm, conversion: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[#002D62] cursor-pointer" />
                <div>
                  <p className="font-medium text-sm">Modul "Conversion"</p>
                  <p className="text-xs text-gray-500">Teknik konversi prospek menjadi mitra.</p>
                </div>
              </label>
              <div className="text-xs text-gray-500 bg-blue-50 p-3 rounded">
                <p>Task dianggap selesai hanya jika <strong>kedua checkbox</strong> dicentang.</p>
              </div>
            </>
          )}

          {taskId === 'aaji_license' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="aajiDate">Tanggal Lisensi AAJI</Label>
                <Input id="aajiDate" type="date" value={aajiForm.aajiDate} max={todayIso}
                  onChange={(e) => setAajiForm({ ...aajiForm, aajiDate: e.target.value })} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="aajiCode">Kode AAJI</Label>
                <Input id="aajiCode" type="text" value={aajiForm.aajiCode}
                  onChange={(e) => setAajiForm({ ...aajiForm, aajiCode: e.target.value })}
                  placeholder="Contoh: AAJI-2026-987654" required />
              </div>
            </>
          )}

          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Batal
            </Button>
            <Button type="submit" disabled={submitting} className="bg-[#002D62] hover:bg-[#001f47]">
              {submitting ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}