import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useSettings } from '@/contexts/SettingsContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/Dialog';
import { toast } from 'sonner';
import { Target, Loader2, ListChecks, MapPin, Search, Save, Pencil } from 'lucide-react';
import { useAddress, type AddressOption } from '@/hooks/useAddress';
import { cn } from '@/lib/utils';

interface AppSetting {
  settingKey: string;
  settingValue: string;
  category: string;
  description: string | null;
  updatedAt: string;
  updatedBy: string | null;
}

const ROLE_COLUMNS: { key: string; label: string; sublabel: string }[] = [
  { key: 'FC',  label: 'FC',  sublabel: 'Financial Consultant' },
  { key: 'ABP', label: 'ABP', sublabel: 'Associate Business Partner' },
  { key: 'BP',  label: 'BP',  sublabel: 'Business Partner' },
];

function parseRoleValue(raw: string | undefined): Record<string, number> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw);
    if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
      const out: Record<string, number> = {};
      for (const [k, v] of Object.entries(obj)) {
        const n = Number(v);
        if (Number.isFinite(n)) out[k] = n;
      }
      return out;
    }
  } catch {
    const n = Number(raw);
    if (Number.isFinite(n)) return { FC: n, ABP: n, BP: n };
  }
  return {};
}

function formatRupiahDisplay(n: number): string {
  if (!n && n !== 0) return '';
  return new Intl.NumberFormat('id-ID').format(n);
}

function parseNumberInput(val: string): string {
  return val.replace(/[^0-9]/g, '');
}

interface RegionEditModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  currentValue: string;
  onSave: (newValue: string) => Promise<void>;
  saving: boolean;
}

/**
 * RegionEditModal — Reusable modal for editing a region name.
 * Pre-populates the input with `currentValue` when opened and calls
 * `onSave` with the trimmed new value on confirm.
 */
function RegionEditModal({ open, onClose, title, currentValue, onSave, saving }: RegionEditModalProps) {
  const [inputValue, setInputValue] = useState(currentValue);

  useEffect(() => {
    if (open) setInputValue(currentValue);
  }, [open, currentValue]);

  const handleSave = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed || trimmed === currentValue) {
      onClose();
      return;
    }
    await onSave(trimmed);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={() => !saving && onClose()}>
      <DialogContent hideCloseButton={saving}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full"
            disabled={saving}
            autoFocus
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={saving}
            className="w-32"
          >
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !inputValue.trim() || inputValue.trim() === currentValue}
            className="w-32"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * RegionManagement — Tab "Manajemen Wilayah"
 * Allows admin to correct typo nama kelurahan / kode pos setelah memilih
 * provinsi → kota → kecamatan → kelurahan via cascade dropdown.
 */
function RegionManagement() {
    const {
    provinces,
    cities,
    districts,
    villages,
    setProvinceId,
    setCityId,
    setDistrictId,
    setProvinces,
    setCities,
    setDistricts,
    setVillages,
  } = useAddress();

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>('');
  const [selectedCityId, setSelectedCityId] = useState<string>('');
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('');
  const [selectedVillageId, setSelectedVillageId] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');

  // Region edit modal state (province / city / district)
  const [regionEditOpen, setRegionEditOpen] = useState(false);
  const [regionEditLevel, setRegionEditLevel] = useState<'province' | 'city' | 'district'>('province');
  const [regionSaving, setRegionSaving] = useState(false);

  // Village edit modal state
  const [villageEditOpen, setVillageEditOpen] = useState(false);
  const [villageEditing, setVillageEditing] = useState<AddressOption | null>(null);
  const [villageEditName, setVillageEditName] = useState('');
  const [villageEditPostalCode, setVillageEditPostalCode] = useState('');
  const [villageSaving, setVillageSaving] = useState(false);

  // Sync selected IDs to useAddress hook (triggers cascade fetch)
  useEffect(() => {
    setProvinceId(selectedProvinceId);
  }, [selectedProvinceId, setProvinceId]);

  useEffect(() => {
    setCityId(selectedCityId);
  }, [selectedCityId, setCityId]);

  useEffect(() => {
    setDistrictId(selectedDistrictId);
  }, [selectedDistrictId, setDistrictId]);

  // Reset downstream selections when parent changes
    const handleProvinceChange = (val: string) => {
    setSelectedProvinceId(val);
    setSelectedCityId('');
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setSearchTerm('');
  };

  const handleCityChange = (val: string) => {
    setSelectedCityId(val);
    setSelectedDistrictId('');
    setSelectedVillageId('');
    setSearchTerm('');
  };

  const handleDistrictChange = (val: string) => {
    setSelectedDistrictId(val);
    setSelectedVillageId('');
    setSearchTerm('');
  };

      const handleVillageChange = (val: string) => {
    setSelectedVillageId(val);
    setSearchTerm('');
  };

  // --- Village edit modal handlers ---
  const openVillageEdit = (village: AddressOption) => {
    setVillageEditing(village);
    setVillageEditName(village.label);
    setVillageEditPostalCode(village.postalCode ?? '');
    setVillageEditOpen(true);
  };

  const handleVillageSave = async () => {
    if (!villageEditing) return;
    setVillageSaving(true);
    try {
      await api.address.updateVillage(villageEditing.value, {
        name: villageEditName,
        postalCode: villageEditPostalCode,
      });
      // Update local state immediately
      setVillages(prev => prev.map(v =>
        v.value === villageEditing.value
          ? { ...v, label: villageEditName, postalCode: villageEditPostalCode || undefined }
          : v
      ));
      toast.success('Data kelurahan berhasil diperbarui.');
      setVillageEditOpen(false);
    } catch (err: any) {
      console.error('[VillageEdit] Gagal memperbarui kelurahan:', err);
      toast.error(err.message || 'Gagal memperbarui data kelurahan.');
    } finally {
      setVillageSaving(false);
    }
  };

  // --- Region edit modal handlers ---
  const openRegionEdit = (level: 'province' | 'city' | 'district') => {
    setRegionEditLevel(level);
    setRegionEditOpen(true);
  };

    const getRegionEditTitle = (): string => {
    switch (regionEditLevel) {
      case 'province': return 'Edit Provinsi';
      case 'city': return 'Edit Kota/Kabupaten';
      case 'district': return 'Edit Kecamatan';
      default: return 'Edit Wilayah';
    }
  };

  const getRegionEditValue = (): string => {
    switch (regionEditLevel) {
      case 'province':
        return provinces.find(p => p.value === selectedProvinceId)?.label ?? '';
      case 'city':
        return cities.find(c => c.value === selectedCityId)?.label ?? '';
      case 'district':
        return districts.find(d => d.value === selectedDistrictId)?.label ?? '';
      default:
        return '';
    }
  };

  const handleRegionSave = async (newValue: string) => {
    setRegionSaving(true);
    try {
      if (regionEditLevel === 'province' && selectedProvinceId) {
        await api.address.updateProvince(selectedProvinceId, { name: newValue });
        setProvinces(prev => prev.map(p =>
          p.value === selectedProvinceId ? { ...p, label: newValue } : p
        ));
        toast.success('Nama Provinsi berhasil diperbarui.');
      } else if (regionEditLevel === 'city' && selectedCityId) {
        await api.address.updateCity(selectedCityId, { name: newValue });
        setCities(prev => prev.map(c => {
          if (c.value === selectedCityId) {
            // Label format: "Kota Jakarta" or "Kabupaten Bandung"
            const parts = c.label.split(' ');
            const type = parts[0] ?? '';
            return { ...c, label: type ? `${type} ${newValue}` : newValue };
          }
          return c;
        }));
        toast.success('Nama Kota/Kabupaten berhasil diperbarui.');
      } else if (regionEditLevel === 'district' && selectedDistrictId) {
        await api.address.updateDistrict(selectedDistrictId, { name: newValue });
        setDistricts(prev => prev.map(d =>
          d.value === selectedDistrictId ? { ...d, label: newValue } : d
        ));
        toast.success('Nama Kecamatan berhasil diperbarui.');
      }
    } catch (err: any) {
      const entityName =
        regionEditLevel === 'province' ? 'Provinsi' :
        regionEditLevel === 'city' ? 'Kota/Kabupaten' : 'Kecamatan';
      toast.error(err.message || `Gagal memperbarui ${entityName}.`);
    } finally {
      setRegionSaving(false);
    }
  };

    const filteredVillages = villages.filter(v =>
    v.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

        return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Wilayah</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Step 1: Province */ }
        <div className="grid gap-1.5 mt-2">
          <Label htmlFor="province-select" className="text-sm font-semibold">
            Provinsi
          </Label>
          <div className="flex items-center gap-2">
            <select
              id="province-select"
              value={selectedProvinceId}
              onChange={(e) => handleProvinceChange(e.target.value)}
              className="flex-1 h-11 px-3 rounded-md border bg-background text-sm focus:ring-2 focus:ring-ring focus:outline-none"
            >
              <option value="">Pilih Provinsi</option>
              {provinces.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
            {selectedProvinceId && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openRegionEdit('province')}
                className="h-11 w-11 px-0"
                title="Edit Provinsi"
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

                        
        {/* Step 2: City (visible after province selected) */ }
        {selectedProvinceId && (
          <div className="grid gap-1.5">
            <Label htmlFor="city-select" className="text-sm font-semibold">
              Kota / Kabupaten
            </Label>
            <div className="flex items-center gap-2">
              <select
                id="city-select"
                value={selectedCityId}
                onChange={(e) => handleCityChange(e.target.value)}
                className="flex-1 h-11 px-3 rounded-md border bg-background text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Pilih Kota / Kabupaten</option>
                {cities.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
              {selectedCityId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openRegionEdit('city')}
                  className="h-11 w-11 px-0"
                  title="Edit Kota/Kabupaten"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}

                        
        {/* Step 3: District (visible after city selected) */ }
        {selectedCityId && (
          <div className="grid gap-1.5">
            <Label htmlFor="district-select" className="text-sm font-semibold">
              Kecamatan
            </Label>
            <div className="flex items-center gap-2">
              <select
                id="district-select"
                value={selectedDistrictId}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="flex-1 h-11 px-3 rounded-md border bg-background text-sm focus:ring-2 focus:ring-ring focus:outline-none"
              >
                <option value="">Pilih Kecamatan</option>
                {districts.map((d) => (
                  <option key={d.value} value={d.value}>
                    {d.label}
                  </option>
                ))}
              </select>
              {selectedDistrictId && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => openRegionEdit('district')}
                  className="h-11 w-11 px-0"
                  title="Edit Kecamatan"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        )}
        {/* Step 4: Village search */ }
        {selectedDistrictId && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="village-search"
                placeholder="Cari kelurahan..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-11 pl-10"
              />
            </div>
                        <div className="grid gap-1.5 max-h-48 overflow-y-auto border rounded-md">
              {filteredVillages.length > 0 ? (
                filteredVillages.map((v) => (
                  <div
                    key={v.value}
                    className={cn(
                      'flex items-center justify-between px-3 py-2 text-sm hover:bg-accent rounded-md m-1 transition-colors cursor-pointer',
                      selectedVillageId === v.value && 'bg-accent font-medium'
                    )}
                    onClick={() => handleVillageChange(v.value)}
                  >
                    <span className="flex-1">
                      {v.label}
                      {v.postalCode && (
                        <span className="text-xs text-muted-foreground ml-2">
                          ({v.postalCode})
                        </span>
                      )}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 px-0"
                      title="Edit Kelurahan"
                      onClick={(e) => {
                        e.stopPropagation();
                        openVillageEdit(v);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Kelurahan tidak ditemukan
                </p>
              )}
            </div>
          </>
        )}

            </CardContent>
    </Card>
      <RegionEditModal
        open={regionEditOpen}
        onClose={() => setRegionEditOpen(false)}
        title={getRegionEditTitle()}
        currentValue={getRegionEditValue()}
        onSave={handleRegionSave}
        saving={regionSaving}
      />

      {/* Village edit modal */ }
      <Dialog open={villageEditOpen} onOpenChange={(open) => !villageSaving && !open && setVillageEditOpen(false)}>
        <DialogContent hideCloseButton={villageSaving}>
          <DialogHeader>
            <DialogTitle>Edit Kelurahan</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-1.5">
              <Label htmlFor="village-edit-name" className="text-sm font-semibold">
                Nama Kelurahan
              </Label>
              <Input
                id="village-edit-name"
                value={villageEditName}
                onChange={(e) => setVillageEditName(e.target.value)}
                className="h-11 font-medium"
                disabled={villageSaving}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="village-edit-postal" className="text-sm font-semibold">
                Kode Pos
              </Label>
              <Input
                id="village-edit-postal"
                value={villageEditPostalCode}
                onChange={(e) => setVillageEditPostalCode(e.target.value)}
                className="h-11 font-medium"
                disabled={villageSaving}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setVillageEditOpen(false)}
              disabled={villageSaving}
            >
              Batal
            </Button>
            <Button
              onClick={handleVillageSave}
              disabled={villageSaving}
            >
              {villageSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
</>
    );
}

const AdminSettingsPage = () => {
  const { refreshSettings } = useSettings();
  const [settings, setSettings] = useState<AppSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [fyapValues, setFyapValues] = useState<Record<string, number>>({});
  const [aaValues, setAaValues]     = useState<Record<string, number>>({});
  const [originalFyapJson, setOriginalFyapJson] = useState('');
  const [originalAaJson, setOriginalAaJson]     = useState('');

    // ── Distribusi Lead (lead_distribution) ──
  const [leadDistValues, setLeadDistValues] = useState<Record<string, string>>({
        max_active_pool_leads: '1',
    db_lock_timeout_ms: '5000',
    cooldown_hours: '12',
    night_hold_start_hour: '19',
    night_hold_end_hour: '9',
        phase_delay_minutes: '30',
    supply_demand_ratio_threshold: '3',
    downline_min_count: '1',
    downline_max_count: '4',
    active_agent_days: '3',
    stagnant_lead_hours: '12',
  });
  const [originalLeadDistJson, setOriginalLeadDistJson] = useState('');
  
  // Only track changes for visible/editable fields (exclude db_lock_timeout_ms)
  const getVisibleLeadDistValues = (values: Record<string, string>) => {
        const { db_lock_timeout_ms: _db_lock_timeout_ms, ...visible } = values;
    return visible;
  };
  
  const leadDistChanged =
    JSON.stringify(getVisibleLeadDistValues(leadDistValues)) !== originalLeadDistJson;

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/admin/settings');
      const data = res.settings as AppSetting[];
      setSettings(data);
      const fyapRaw = data.find(s => s.settingKey === 'target_fyap')?.settingValue;
      const aaRaw   = data.find(s => s.settingKey === 'target_active_agent')?.settingValue;
      setFyapValues(parseRoleValue(fyapRaw));
      setAaValues(parseRoleValue(aaRaw));
      setOriginalFyapJson(fyapRaw ?? '');
      setOriginalAaJson(aaRaw ?? '');

      // Distribusi lead: fallback ke default bila key belum tersedia.
      const leadRaw = (key: string, fallback: string) =>
        data.find(s => s.settingKey === key)?.settingValue ?? fallback;
            const leadDistNext: Record<string, string> = {
        max_active_pool_leads: leadRaw('max_active_pool_leads', '1'),
        db_lock_timeout_ms: leadRaw('db_lock_timeout_ms', '5000'),
        cooldown_hours: leadRaw('cooldown_hours', '12'),
        night_hold_start_hour: leadRaw('night_hold_start_hour', '19'),
        night_hold_end_hour: leadRaw('night_hold_end_hour', '9'),
                phase_delay_minutes: leadRaw('phase_delay_minutes', '30'),
        supply_demand_ratio_threshold: leadRaw('supply_demand_ratio_threshold', '3'),
                downline_min_count: leadRaw('downline_min_count', '1'),
        downline_max_count: leadRaw('downline_max_count', '4'),
        active_agent_days: leadRaw('active_agent_days', '3'),
        stagnant_lead_hours: leadRaw('stagnant_lead_hours', '12'),
      };
      setLeadDistValues(leadDistNext);
      // Store only visible fields for change detection
      setOriginalLeadDistJson(JSON.stringify(getVisibleLeadDistValues(leadDistNext)));
    } catch (err) {
      toast.error('Gagal memuat pengaturan sistem.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSettings(); }, []);

  // Single save handler — persists FYAP + Active-agent targets concurrently
  const handleSaveTargets = async () => {
    if (!targetsChanged) return;
    const fyapPayload = JSON.stringify(fyapValues);
    const aaPayload   = JSON.stringify(aaValues);
    try {
      setSaving('targets');
      const requests: Promise<unknown>[] = [];
      if (fyapPayload !== originalFyapJson) requests.push(api.patch('/api/admin/settings/target_fyap', { value: fyapPayload }));
      if (aaPayload   !== originalAaJson)   requests.push(api.patch('/api/admin/settings/target_active_agent', { value: aaPayload }));
      await Promise.all(requests);
      toast.success('Target FYAP dan Target Agen Aktif berhasil diperbarui.');
      await refreshSettings();
      fetchSettings();
    } catch (err) {
      toast.error('Gagal memperbarui target.');
      console.error(err);
    } finally {
      setSaving(null);
    }
  };
  const handleSaveLeadDistribution = async () => {
    try {
      setSaving('lead_distribution');
      // Filter out db_lock_timeout_ms (hidden from UI for security)
      // Only save parameters that are visible and editable by Admin
                  const allowedKeys = ['max_active_pool_leads',
                            'cooldown_hours', 'night_hold_start_hour', 'night_hold_end_hour',
                            'phase_delay_minutes', 'supply_demand_ratio_threshold',
                            'downline_min_count', 'downline_max_count',
                            'active_agent_days', 'stagnant_lead_hours'];
      const filteredValues = Object.entries(leadDistValues).filter(([key]) => allowedKeys.includes(key));
      
      // Simpan satu per satu — setiap perubahan tercatat di audit log.
      // Cast string values to numbers for numeric settings to ensure type safety
      for (const [key, value] of filteredValues) {
        // Parse string to number for numeric settings
        const numericValue = parseInt(value, 10);
        
        // Validate: ensure the parsed number is valid
        if (!Number.isFinite(numericValue) || numericValue < 0) {
          toast.error(`Nilai ${key} tidak valid. Harus berupa angka positif.`);
          return;
        }
        
        // Send as number (backend will convert to string for TEXT storage)
        await api.patch(`/api/admin/settings/${key}`, { value: numericValue });
      }
      toast.success('Manajemen Leads berhasil diperbarui.');
      await refreshSettings();
      fetchSettings();
    } catch (err) {
      toast.error('Gagal memperbarui Manajemen Leads.');
      console.error('[AdminSettings] Lead distribution save error:', err);
      // Log detailed error for debugging
      if (err && typeof err === 'object' && 'response' in err) {
        console.error('[AdminSettings] Error details:', (err as any).response?.data || err);
      }
    } finally {
      setSaving(null);
    }
  };

    // Reset Lead Distribution: restore visible fields to last-persisted (API) values (keep hidden db_lock_timeout_ms unchanged)
  const handleResetLeadDistribution = () => {
    if (!originalLeadDistJson) return;
    const restored = JSON.parse(originalLeadDistJson);
    setLeadDistValues(prev => ({ ...restored, db_lock_timeout_ms: prev.db_lock_timeout_ms }));
  };

  // Reset FYAP + Active-agent targets to last-persisted (API) values
  const handleResetTargets = () => {
    setFyapValues(parseRoleValue(originalFyapJson));
    setAaValues(parseRoleValue(originalAaJson));
  };

  const fyapSetting = settings.find(s => s.settingKey === 'target_fyap');
  const targetsChanged =
    JSON.stringify(fyapValues) !== originalFyapJson ||
    JSON.stringify(aaValues) !== originalAaJson;

    // Remove db_lock_timeout_ms from UI (Security - keep it backend-only)
  const LEAD_DIST_FIELDS: { key: string; label: string; hint: string; type?: string }[] = [
    { key: 'max_active_pool_leads', label: 'Maks Leads Aktif', hint: 'Maks leads aktif yang boleh dimiliki agen', type: 'number' },
        { key: 'cooldown_hours', label: 'Cooldown (jam)', hint: 'Jam cooldown setelah aksi Cancel (pembatalan) lead pada My Leads sebelum boleh pickup lagi (Reject & Recruit tidak memicu cooldown)', type: 'number' },
    { key: 'night_hold_start_hour', label: 'Mulai Jam Malam (WIB)', hint: 'Jam mulai embargo malam (0-23)', type: 'number' },
    { key: 'night_hold_end_hour', label: 'Akhir Jam Malam (WIB)', hint: 'Jam berakhirnya embargo malam (0-23)', type: 'number' },
    { key: 'phase_delay_minutes', label: 'Jeda Fase Prioritas (Menit)', hint: 'Waktu tunggu sebelum Pool Leads membuka akses ke prioritas agen berikutnya jika prioritas sebelumnya belum mengambil leads. Dasar delay untuk 4-tier cascading exception (1×, 2×, 3×). Default 30.', type: 'number' },
        { key: 'supply_demand_ratio_threshold', label: 'Rasio Suplai/Permintaan', hint: 'Rasio di atas ini melepas role restrictions (open etalase)', type: 'number' },
    { key: 'active_agent_days', label: 'Batas Hari Agen Aktif', hint: 'Maksimal hari sejak login terakhir agar agen dihitung dalam pemerataan kuota.', type: 'number' },
    { key: 'stagnant_lead_hours', label: 'Batas Leads Menganggur (Jam)', hint: 'Usia leads di pool sebelum aturan pemerataan kuota di-bypass agar tidak telantar.', type: 'number' },
  ];

      // Real-time reactive values for operational notes
  const maxLeadsActive = leadDistValues.max_active_pool_leads || '1';
  const cooldownHours = leadDistValues.cooldown_hours || '12';
  const downlineMin = leadDistValues.downline_min_count || '1';
  const downlineMax = leadDistValues.downline_max_count || '4';
  const activeAgentDays = leadDistValues.active_agent_days || '3';
  const stagnantLeadHours = leadDistValues.stagnant_lead_hours || '12';
  const phaseDelayMinutes = leadDistValues.phase_delay_minutes || '30';


  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }
  return (
        <div className="space-y-6 max-w-4xl">
      <Tabs defaultValue="performa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performa" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Manajemen Target
          </TabsTrigger>
                    <TabsTrigger value="lead_distribution" className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Manajemen Leads
          </TabsTrigger>
          <TabsTrigger value="region_management" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Manajemen Wilayah
          </TabsTrigger>
        </TabsList>

        <TabsContent value="performa" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Target FYAP</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {ROLE_COLUMNS.map(col => (
                  <div className="grid gap-1.5" key={col.key}>
                    <Label htmlFor={"fyap_" + col.key} className="text-sm font-semibold">
                      Target {col.label}
                    </Label>
                    <Input
                      id={"fyap_" + col.key}
                      placeholder="0"
                      value={formatRupiahDisplay(fyapValues[col.key] ?? 0)}
                      onChange={(e) => {
                        const raw = parseNumberInput(e.target.value);
                        const n = Number(raw);
                        setFyapValues(prev => ({ ...prev, [col.key]: Number.isFinite(n) ? n : 0 }));
                      }}
                      className="h-11 font-medium"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Target Agen Aktif</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                {ROLE_COLUMNS.map(col => (
                  <div className="grid gap-1.5" key={col.key}>
                    <Label htmlFor={"aa_" + col.key} className="text-sm font-semibold">
                      Target {col.label}
                    </Label>
                    <Input
                      id={"aa_" + col.key}
                      type="number"
                      min={0}
                      placeholder="0"
                      value={aaValues[col.key] ?? ''}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        setAaValues(prev => ({ ...prev, [col.key]: Number.isFinite(n) && n >= 0 ? n : 0 }));
                      }}
                      className="h-11 font-medium"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={handleResetTargets} className="w-32 px-6 py-2">
              Batal
            </Button>
            <Button onClick={handleSaveTargets} disabled={saving === 'targets' || !targetsChanged} className="w-32 px-6 py-2">
              {saving === 'targets' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Simpan
            </Button>
          </div>

          <Card className="bg-slate-50 border-dashed">
            <CardContent className="p-4 text-xs text-slate-500 flex justify-between">
              <div>Terakhir diperbarui: {fyapSetting ? new Date(fyapSetting.updatedAt).toLocaleString('id-ID') : '-'}</div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="lead_distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Manajemen Leads</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                            {/* Task 1: Team Qualification Group */}
              <div className="space-y-3">
                <Label className="text-sm font-semibold">Downline untuk Kelayakan</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="flex gap-4">
                    <div className="flex-1 grid gap-1.5">
                      <Label htmlFor="lead_downline_min_count" className="text-sm">Min.</Label>
                      <Input
                        id="lead_downline_min_count"
                        type="number"
                        min={0}
                        value={leadDistValues.downline_min_count ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          setLeadDistValues(prev => ({ ...prev, downline_min_count: v }));
                        }}
                        className="h-11 font-medium"
                      />
                    </div>
                    <div className="flex-1 grid gap-1.5">
                      <Label htmlFor="lead_downline_max_count" className="text-sm">Maks.</Label>
                      <Input
                        id="lead_downline_max_count"
                        type="number"
                        min={0}
                        value={leadDistValues.downline_max_count ?? ''}
                        onChange={(e) => {
                          const v = e.target.value.replace(/[^0-9]/g, '');
                          setLeadDistValues(prev => ({ ...prev, downline_max_count: v }));
                        }}
                        className="h-11 font-medium"
                      />
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">Min. dan maks direct downline aktif untuk kelayakan.</p>
              </div>


              {/* Task 2: Max Active Leads */}
              <div className="grid gap-4 md:grid-cols-2">
                {LEAD_DIST_FIELDS.map(field => {
                  return (
                    <div className="grid gap-1.5" key={field.key}>
                      <Label htmlFor={'lead_' + field.key} className="text-sm font-semibold">
                        {field.label}
                      </Label>
                      <Input
                        id={'lead_' + field.key}
                        type={field.type ?? 'text'}
                        value={leadDistValues[field.key] ?? ''}
                        onChange={(e) => {
                          let v = e.target.value;
                          if (field.type === 'number') v = v.replace(/[^0-9]/g, '');
                          setLeadDistValues(prev => ({ ...prev, [field.key]: v }));
                        }}
                        className="h-11 font-medium"
                      />
                      <p className="text-xs text-muted-foreground">{field.hint}</p>
                    </div>
                  );
                })}
              </div>

              {/* Task 4: Remove redundant info text, keep only Save button */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleResetLeadDistribution}
                  className="w-32 px-6 py-2"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSaveLeadDistribution}
                  disabled={saving === 'lead_distribution' || !leadDistChanged}
                  className="w-32 px-6 py-2"
                >
                  {saving === 'lead_distribution' ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Real-time Dynamic Operational Notes */}
          <Card className="bg-slate-50 border-dashed">
            <CardContent className="p-4 text-xs text-slate-500">
              <div className="font-semibold mb-1">Catatan Operasional</div>
                            <ul className="list-disc pl-5 space-y-1">
                <li>Agen yang boleh Pick-Up Leads jika memiliki direct downline {downlineMin} - {downlineMax} agen.</li>
                <li>Setiap Agen hanya boleh memiliki {maxLeadsActive} Leads Aktif yang didapat dari Pool Leads.</li>
                                <li>Setelah melakukan aksi **Cancel** (pembatalan) pada lead di My Leads, agen harus menunggu {cooldownHours} jam (cooldown) sebelum dapat mengambil lead baru. Reject & Recruit tidak memicu cooldown.</li>
                <li>Pada mode unlock, kuota dinamis = max(dasar {maxLeadsActive}, MIN_LEADS + 1), dengan MIN_LEADS = leads aktif terendah di antara Agen Aktif (login dalam {activeAgentDays} hari terakhir).</li>
                <li>Leads pool yang usianya melebihi {stagnantLeadHours} jam dapat diselamatkan (rescue) melebihi kuota, kuota pribadi agen = leads aktif + 1 — hanya pada mode unlock.</li>
                <li>Pada mode cascading (supply &gt; demand), 4-tier pengecualian: Tier 1 dapat lead fresh, Tier 2 setelah {phaseDelayMinutes} menit atau semua lead Tier 1 habis, Tier 3 setelah 2&times; {phaseDelayMinutes} menit, Tier 4 setelah 3&times; {phaseDelayMinutes} menit. Waterfall unlock membuka tier berikutnya secara instan ketika kuota/tersedia lead tier di bawah habis.</li>
              </ul>
            </CardContent>
          </Card>
                </TabsContent>

        <TabsContent value="region_management" className="space-y-4">
          <RegionManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettingsPage;
