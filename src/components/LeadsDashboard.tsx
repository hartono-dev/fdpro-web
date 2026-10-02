import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/DropdownMenu';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Inbox, ChevronDown } from 'lucide-react';

import { RecruitLeadModal } from './modals/RecruitLeadModal';
import { RejectLeadModal } from './modals/RejectLeadModal';
import { CancelLeadModal } from './modals/CancelLeadModal';

/**
 * PoolStatusBanner: Menampilkan sisa kuota pickup agen di tab Pool Leads.
 *
 * Logika sederhana:
 *   {x} = maxActivePoolLeads - inProgressCount  (sisa kuota agen)
 *
 * Jika agen tidak berhak, maka {x} otomatis menjadi 0:
 *   - agen tidak eligible (recruiterQualification?.eligible === false)
 *   - cooldown aktif (cooldownStatus?.inCooldown)
 *   - hard cap tercapai (inProgressCount >= maxActivePoolLeads)
 *   - daily limit habis (dailyPickupCount >= dailyLimit), bila tersedia
 *   - pool kosong (poolCount === 0)
 *
 * Styling biner:
 *   - {x} > 0  → background biru info  (bg-blue-50)
 *   - {x} === 0 → background abu-abu netral (bg-gray-50)
 */
const PoolStatusBanner = ({
  inProgressCount,
  maxActivePoolLeads,
  cooldownStatus,
  poolCount,
  recruiterQualification,
  dailyPickupCount,
  dailyLimit,
    isPoolUnlocked,
   allowedQuota,
   isBalancingBypass,
       tierMode = false,
    roleRestrictionsActive = true,
}: any) => {
  // Hard cap: di mode bypass pakai allowedQuota dinamis; di luar mode pakai
  // maxActivePoolLeads (dasar). PRD §5.2.4.2.
  const effectiveMax = isBalancingBypass ? (allowedQuota ?? maxActivePoolLeads) : maxActivePoolLeads;
  const isAtHardCap = inProgressCount >= effectiveMax;
  const isCooldown = cooldownStatus?.inCooldown;
  const isEligible = recruiterQualification?.eligible ?? false;
  const isDailyLimitReached =
    dailyLimit != null &&
    dailyPickupCount != null &&
    dailyPickupCount >= dailyLimit;
  const isPoolEmpty = poolCount === 0;

    // Hitung sisa kuota — otomatis 0 bila agen tidak berhak / kuota habis / pool kosong.
  // Unlock Pool: bila `isPoolUnlocked`, agen yang tidak memenuhi syarat downline
  // tetap diperlakukan memiliki sisa kuota (= maxActivePoolLeads - inProgressCount).
    const remaining =
        (!tierMode && roleRestrictionsActive && !isEligible && !isPoolUnlocked) ||
    isCooldown ||
    isAtHardCap ||
    isDailyLimitReached ||
    isPoolEmpty
      ? 0
            : Math.max(0, effectiveMax - inProgressCount);

  return (
    <div
      className={`mb-3 rounded-md p-3 text-sm ${
        remaining > 0 ? 'bg-blue-50' : 'bg-gray-50'
      }`}
    >
      Anda dapat mengambil {remaining} Leads saat ini.
    </div>
  );
};

// Komponen Empty State terpusat (ikon + pesan) untuk tab yang datanya kosong.
// Dipakai konsisten di Pool Leads & My Leads agar layar tetap rapi.
const EmptyState = ({ message }: { message: string }) => (
  <div className="flex flex-col items-center justify-center gap-4 py-8">
    <Inbox className="h-16 w-16 text-gray-400" />
    <p className="text-gray-500 font-medium">{message}</p>
  </div>
);

// Konfigurasi badge status leads (label human-readable + warna Tailwind)
const STATUS_BADGE_CONFIG: Record<string, { label: string; className: string }> = {
  in_progress: { label: 'In Progress', className: 'bg-blue-100 text-blue-700 border-blue-200' },
  done: { label: 'Done', className: 'bg-green-100 text-green-700 border-green-200' },
  rejected: { label: 'Reject', className: 'bg-red-100 text-red-600 border-red-200' },
  available: { label: 'Available', className: 'bg-gray-100 text-gray-600 border-gray-200' },
};

const StatusBadge = ({ status, source }: { status?: string; source?: string }) => {
  // Fase 3 §5.2.7: Lead referral yang masih aktif (in_progress) ditampilkan
  // dengan label khusus "In Progress - Referral" agar agen membedakan lead
  // hasil usaha sendiri dari lead yang di-pick-up dari Pool.
  // Untuk status terminal (done/rejected/available), label tidak berubah
  // — referral tidak perlu diidentifikasi kembali setelah selesai.
  const config = (status && STATUS_BADGE_CONFIG[status]) || {
    label: status || '-',
    className: 'bg-gray-100 text-gray-600 border-gray-200',
  };
  const isReferralInProgress = status === 'in_progress' && source === 'REFERRAL';
  const label = isReferralInProgress ? 'In Progress - Referral' : config.label;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium leading-none whitespace-nowrap ${config.className}`}
    >
      {label}
    </span>
  );
};

// Baris lead di tabel My Leads / Pool Leads (kolom Aksi, isPool=false):
// - is_registered === true             -> teks statis "Terdaftar" (non-interaktif).
// - status 'rejected'                  -> teks statis "Reject" (non-interaktif).
// - status 'cancelled'                 -> teks statis "Cancel" (non-interaktif; defensif).
// - status 'done' & !is_registered     -> tombol "Recruit Link" (buka modal read-only, salin ulang link).
// - lainnya (in_progress, belum aksi)  -> DropdownMenu Aksi (Recruit/Reject/Cancel).
// Catatan: StatusBadge di bawah nama lead menampilkan label 'In Progress - Referral'
// untuk lead referral yang masih aktif (in_progress & source === 'REFERRAL').
const LeadRow = ({ lead, isPool, onPickup, onAction, pickupDisabled, isPickingUp, pickupReason }: any) => {
  const isRejected = !isPool && lead.status === 'rejected';
  return (
    <TableRow className={`${isPickingUp ? 'opacity-60' : ''} ${isRejected ? 'text-gray-400 bg-gray-50' : ''}`}>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <span className="font-medium">{lead.name}</span>
          {!isPool && <StatusBadge status={lead.status} source={lead.source} />}
        </div>
      </TableCell>
      <TableCell>{lead.cityDomicile || '-'}</TableCell>
      {/* API mengirim createdAt (Prisma default); submittedAt hanya fallback defensif */}
      <TableCell>{new Date(lead.createdAt || lead.submittedAt).toLocaleDateString('id-ID')}</TableCell>
      {isPool ? (
        <TableCell className="text-right">
          <Button
            size="sm"
            onClick={() => onPickup(lead.id)}
            disabled={pickupDisabled || isPickingUp}
            title={isPickingUp ? 'Sedang diproses...' : pickupReason || undefined}
          >
            {isPickingUp ? 'Mengambil...' : 'Pick Up'}
          </Button>
        </TableCell>
      ) : (
        <>
          <TableCell>{lead.pickupAt ? new Date(lead.pickupAt).toLocaleDateString('id-ID') : '-'}</TableCell>
          <TableCell className="text-right">
            {lead.isRegistered ? (
              // Aturan 1: agen sudah membagikan link DAN lead berhasil mendaftar
              // (is_registered === true). Teks statis "Terdaftar", tidak ada aksi klik.
              <span className="text-sm font-medium text-green-700">
                Terdaftar
              </span>
            ) : isRejected ? (
              // Aturan 2: agen menolak lead (status 'rejected'). Teks statis "Reject".
              <span className="text-sm text-gray-500">
                Reject
              </span>
            ) : lead.status === 'cancelled' ? (
              // Aturan 3: agen membatalkan lead (status 'cancelled'). Teks statis "Cancel".
              // Defensif: saat ini cancelLead mengembalikan lead ke pool (status
              // 'available') sehingga tidak muncul di My Leads; cabang ini melindungi UI
              // bila suatu kapan model status menambahkan state 'cancelled' yang tetap
              // ditampilkan di My Leads.
              <span className="text-sm text-gray-500">
                Cancel
              </span>
            ) : lead.status === 'done' ? (
              // Aturan 4: link sudah dishare (status 'done') tapi belum terdaftar.
              // Tombol "Recruit Link" membuka RecruitLeadModal read-only (tanpa tombol
              // Done, karena showDone = status === 'in_progress' -> false) agar agen
              // dapat membagikan atau menyalin ulang link pendaftaran.
              <Button
                size="sm"
                variant="outline"
                className="border-green-700 text-green-700 hover:bg-green-50"
                onClick={() => onAction(lead, 'recruit')}
                title="Buka kembali link pendaftaran (modal read-only)"
              >
                Recruit Link
              </Button>
            ) : (
              // Aturan 5: lead baru di-pick up, belum ada tindakan — DropdownMenu standar.
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="outline" className="flex items-center gap-1">
                    Aksi
                    <ChevronDown className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                  <DropdownMenuItem
                    onClick={() => onAction(lead, 'recruit')}
                    disabled={lead.status !== 'in_progress'}
                  >
                    Recruit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onAction(lead, 'reject')}
                    disabled={lead.status !== 'in_progress'}
                  >
                    Reject
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onAction(lead, 'cancel')}
                    disabled={lead.status !== 'in_progress' || lead.type === 'referral'}
                  >
                    Cancel
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </TableCell>
        </>
      )}
    </TableRow>
  );
};

export function LeadsDashboard() {
  const { user } = useAuth();
    const [poolLeads, setPoolLeads] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);     // initial load only
  const [refreshing, setRefreshing] = useState(false); // refetch after actions (keeps Tabs mounted)
  const [error, setError] = useState('');

    // State untuk modal — dikelola di luar DropdownItem agar modal tidak tertutup
  // saat dropdown tertutup (best practice UX untuk Radix Popover/Dialog).
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);


    // Calon Agen tidak boleh akses Pool Leads
  const isCalonAgen = user?.role === 'calon_agen';

  // ── Tab state (controlled + URL sync) ──
  // Bug sebelumnya: <Tabs defaultValue="pool"> (uncontrolled) + setLoading(true) di
  // fetchData menyebabkan unmount → remount Tabs ⇒ tab kembali "pool". Sekarang dikendalikan
  // penuh lewat activeTab & disinkronkan ke query ?tab=... agar tahan refresh / back-button.
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'pool' | 'my-leads'>(
    () => (searchParams.get('tab') === 'my-leads' ? 'my-leads' : 'pool'),
  );
  useEffect(() => {
    if (searchParams.get('tab') !== activeTab) {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('tab', activeTab);
          return next;
        },
        { replace: true },
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // ═══════════════════════════════════════════════════════════════════
  //  ETALASE TERBUKA — State Reaktif Anti-Spam
  // ═══════════════════════════════════════════════════════════════════
  const [poolMeta, setPoolMeta] = useState<any>(null);

    // Kalkulasi dari backend response
    const inProgressCount = poolMeta?.inProgressCount
    ?? (Array.isArray(myLeads) ? myLeads.filter((l: any) => l?.status === 'in_progress' && l?.source === 'POOL').length : 0);
    // Kuota harian (opsional — bila backend belum mengembalikan field ini, diperlakukan non-aktif)
  const dailyPickupCount = poolMeta?.dailyPickupCount ?? 0;
  const dailyLimit = poolMeta?.dailyLimit ?? null;

  // ── Distribusi lead dinamis (admin-configurable) ──
    const recruiterQualification = poolMeta?.recruiterQualification as
    | { eligible: boolean; recruitCount: number; downlineMin: number; downlineMax: number }
    | undefined;
  const cooldownStatus = poolMeta?.cooldownStatus as
    | { inCooldown: boolean; remainingHours: number; lastClosedAt: Date | string | null; cooldownHours: number }
    | undefined;
          const maxActivePoolLeads = (poolMeta?.maxActivePoolLeads ?? 1) as number;
        const isPoolUnlocked = poolMeta?.isPoolUnlocked ?? false;
        // 4-Tier Cascading Exception (PRD §5.2.4.3): bila supply > demand &
        // role restrictions aktif, agen yang tidak memenuhi syarat downline
        // (Tier 1, 0 downline) tetap dapat pick-up lead yang isPickable.
                const tierMode = poolMeta?.tierMode ?? false;
        // Open Etalase / Etalase Terbuka: ketika role restrictions dilepas
        // (supply/demand >= threshold), SEMUA lead isPickable=true di backend.
        // Frontend harus melewati gate kualifikasi downline juga — jika tidak,
        // agen Tier 1 (0 downline) tidak bisa pickup meski lead tersedia.
        const roleRestrictionsActive = poolMeta?.roleRestrictionsActive ?? true;
  // Kuota efektif (PRD §5.2.4.2): di mode bypass pakai allowedQuota dinamis
  // (max(max_active_pool_leads, MIN_LEADS + 1)); di luar mode pakai
  // maxActivePoolLeads (dasar). Backend kini mengekspose semua field ini.
  const isBalancingBypass = poolMeta?.isBalancingBypass ?? isPoolUnlocked;
  const allowedQuota = poolMeta?.allowedQuota ?? maxActivePoolLeads;
  const effectiveQuota = isBalancingBypass ? allowedQuota : maxActivePoolLeads;
  // ──────────────────────────────────────────────────────────────────
  //  OPTIMISTIC STATE: kuota lokal yang langsung berkurang saat klik
  //  tanpa menunggu response backend. Ini kunci anti-spam click.
  // ──────────────────────────────────────────────────────────────────
    const [optimisticPickups, setOptimisticPickups] = useState<Set<string>>(new Set());

  // Reset optimistic set pada data fresh
  useEffect(() => {
    if (poolMeta) {
      setOptimisticPickups(new Set());
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolMeta]);

    // Hard cap: lead aktif sudah mencapai kuota yang diizinkan.
  // Di mode bypass pakai allowedQuota dinamis (bukan lagi maxActivePoolLeads
  // dasar) agar agen tunggal tidak-eligible downline tetap bisa pick-up.
  const isAtHardCap = inProgressCount >= effectiveQuota;
    // Cooldown: agen masih dalam masa tunggu setelah aksi Cancel (hanya Cancel yang trigger cooldown)
  const isCooldown = cooldownStatus?.inCooldown ?? false;

    const fetchData = useCallback(async (opts?: { refresh?: boolean }) => {
    const isInitial = !(opts && opts.refresh);
    if (isInitial) setLoading(true); else setRefreshing(true);
    setError('');
    try {
      const fetchPromises = [
        // Pool Leads: tampilkan ke seluruh role (term. Calon Agen = view read-only).
        // Pick Up tetap dikunci (tombol disabled di LeadRow + backend tolak 403).
        api.get('/api/leads/pool').catch(() => null),
        // Always fetch my leads
        api.get('/api/leads/my-leads').catch(() => null),
      ];
      
      const [poolData, myData] = await Promise.all(fetchPromises);
      if (poolData) {
        setPoolLeads(Array.isArray(poolData) ? poolData : poolData.leads ?? []);
        if (!Array.isArray(poolData)) setPoolMeta(poolData.meta ?? null);
      }
      if (myData) setMyLeads(myData);
    } catch (err: any) {
      setError(err.message);
        } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

    useEffect(() => {
    fetchData();
  }, [fetchData]);

  // SORTING: lead 'rejected' selalu berada di paling bawah tabel;
  // lead aktif (in_progress/available) di atas, diikuti lead yang belum selesai.
  const sortedMyLeads = useMemo(() => {
    const statusRank: Record<string, number> = {
      in_progress: 0,
      available: 0,
      done: 1,
      rejected: 2,
    };
    return [...(myLeads || [])].sort((a: any, b: any) => {
      const ar = statusRank[a?.status] ?? 0;
      const br = statusRank[b?.status] ?? 0;
      if (ar !== br) return ar - br; // rejected (rank 2) turun ke paling bawah
      return 0;
    });
  }, [myLeads]);


  const handlePickup = async (leadId: string) => {
    // Guard: cegah double-click dan spam click serta pickup di luar syarat dinamis
                                const notQualified =
                    (!tierMode && roleRestrictionsActive && (recruiterQualification ? !recruiterQualification.eligible : false)) && !isPoolUnlocked;
    if (isCalonAgen || isAtHardCap || isCooldown || optimisticPickups.has(leadId) ||
        notQualified) return;

        // ── OPTIMISTIC UPDATE: tandai sedang proses agar tombol lain disabled ──
    // DETIK INI JUGA semua tombol Pick Up lain langsung disabled
    // tanpa menunggu response backend.
    setOptimisticPickups(prev => new Set(prev).add(leadId));

    try {
      await api.post(`/api/leads/${leadId}/pickup`, {});
            // Refresh data dari backend (termasuk update inProgressCount & dailyPickupCount)
      fetchData({ refresh: true });
    } catch (err: any) {
            // ── ROLLBACK: hapus tanda proses ──
      setOptimisticPickups(prev => { const next = new Set(prev); next.delete(leadId); return next; });
      alert(err.message);
    } finally {
      // Bersihkan tanda "sedang pickup" (data sudah di-refresh atau di-rollback)
      setOptimisticPickups(prev => { const next = new Set(prev); next.delete(leadId); return next; });
    }
  };

    // ── DropdownMenu action handler: membuka modal yang sesuai ──
  const handleAction = (lead: any, actionType: 'recruit' | 'reject' | 'cancel') => {
    setSelectedLead(lead);
    if (actionType === 'recruit') setIsRecruitModalOpen(true);
    else if (actionType === 'reject') setIsRejectModalOpen(true);
    else if (actionType === 'cancel') setIsCancelModalOpen(true);
  };

  // ── Recruit Done: panggil API, refresh, tutup modal ──
  const handleRecruitDone = async () => {
    if (!selectedLead) return;
    try {
            await api.leads.recruit(selectedLead.id, {});
      fetchData({ refresh: true });
    } catch (err: any) {
      alert('Gagal merekrut: ' + err.message);
      throw err;
    }
  };

  // ── Reject Done: submit alasan reject ke backend ──
  const handleRejectDone = async (reason: string) => {
    if (!selectedLead) return;
    try {
            await api.leads.reject(selectedLead.id, { reason });
      fetchData({ refresh: true });
    } catch (err: any) {
      alert('Gagal menolak lead: ' + err.message);
      throw err;
    }
  };

  // ── Cancel Done: submit alasan cancel ke backend ──
  const handleCancelDone = async (reason: string) => {
    if (!selectedLead) return;
    try {
            await api.leads.cancel(selectedLead.id, { reason });
      fetchData({ refresh: true });
    } catch (err: any) {
      alert('Gagal membatalkan lead: ' + err.message);
      throw err;
    }
  };

  if (loading) return <p>Loading leads...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  // Calon Agen hanya bisa lihat My Leads
  if (isCalonAgen) {
    return (
      <>
      <Card>
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-3">My Leads ({myLeads.length})</h3>
              {myLeads.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Domisili</TableHead>
                      <TableHead>Masuk</TableHead>
                      <TableHead>Diambil</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedMyLeads.map((lead: any) => (
                      <LeadRow 
                        key={lead.id} 
                        lead={lead} 
                        isPool={false} 
                        onAction={handleAction}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <EmptyState message="Anda belum memiliki leads" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {selectedLead && (
        <>
          <RecruitLeadModal
            open={isRecruitModalOpen}
            onOpenChange={setIsRecruitModalOpen}
            leadName={selectedLead.name}
            fdCode={user?.fdCode}
            leadId={selectedLead.id}
            showDone={selectedLead?.status === 'in_progress'}
            onDone={handleRecruitDone}
          />
          <RejectLeadModal
            open={isRejectModalOpen}
            onOpenChange={setIsRejectModalOpen}
            onDone={handleRejectDone}
          />
          <CancelLeadModal
            open={isCancelModalOpen}
            onOpenChange={setIsCancelModalOpen}
            leadName={selectedLead.name}
            onDone={handleCancelDone}
          />
        </>
      )}
      </>
    );
  }

  // Agen Resmi (FC, ABP, BP) dan Admin
  return (
    <>
            <Card className="relative">
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
        </CardHeader>
        <CardContent>
          {refreshing && (
            <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-xs text-gray-500 z-10 pointer-events-none">
              Memperbarui data…
            </div>
          )}
          <Tabs
            defaultValue="pool"
            value={activeTab}
            onValueChange={(v) => setActiveTab(v as 'pool' | 'my-leads')}
          >
          <TabsList>
            <TabsTrigger value="pool">Pool Leads ({poolLeads.length})</TabsTrigger>
            <TabsTrigger value="my-leads">My Leads ({myLeads.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pool">
                                    <PoolStatusBanner
              inProgressCount={inProgressCount}
              maxActivePoolLeads={maxActivePoolLeads}
              cooldownStatus={cooldownStatus}
              poolCount={poolLeads.length}
              recruiterQualification={recruiterQualification}
              dailyPickupCount={dailyPickupCount}
                            dailyLimit={dailyLimit}
                            isPoolUnlocked={isPoolUnlocked}
              allowedQuota={allowedQuota}
              isBalancingBypass={isBalancingBypass}
                            tierMode={tierMode}
              roleRestrictionsActive={roleRestrictionsActive}
            />
            {poolLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Domisili</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poolLeads.map((lead: any) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      isPool={true}
                      onPickup={handlePickup}
                                            pickupDisabled={isCalonAgen ||
                                                isAtHardCap ||
                        isCooldown ||
                                                                                                (!tierMode && roleRestrictionsActive && !isPoolUnlocked && (recruiterQualification ? !recruiterQualification.eligible : false)) ||
                        !lead.isPickable
                      }
                      isPickingUp={optimisticPickups.has(lead.id)}
                      pickupReason={isCalonAgen ? 'Selesaikan pendaftaran/lisensi untuk mengambil leads' : 
                        isCooldown
                          ? `Cooldown aktif (${cooldownStatus?.remainingHours} jam tersisa)`
                          : isAtHardCap
                          ? 'Kuota lead aktif penuh'
                                                                                                        : (!tierMode && roleRestrictionsActive && !isPoolUnlocked && recruiterQualification && !recruiterQualification.eligible)
                          ? `Anda perlu ${recruiterQualification.downlineMin}–${recruiterQualification.downlineMax} rekrut aktif (saat ini: ${recruiterQualification.recruitCount})`
                          : !lead.isPickable ? (lead.pickupReason ?? 'Lead belum terbuka untuk tier/ro peran Anda') : undefined
                      }
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="Leads belum tersedia" />
            )}
          </TabsContent>
          <TabsContent value="my-leads">
            {myLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Domisili</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Diambil</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedMyLeads.map((lead: any) => (
                    <LeadRow 
                      key={lead.id} 
                      lead={lead} 
                      isPool={false} 
                      onAction={handleAction}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <EmptyState message="Anda belum memiliki leads" />
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      </Card>
      {selectedLead && (
        <>
          <RecruitLeadModal
            open={isRecruitModalOpen}
            onOpenChange={setIsRecruitModalOpen}
            leadName={selectedLead.name}
            fdCode={user?.fdCode}
            leadId={selectedLead.id}
            showDone={selectedLead?.status === 'in_progress'}
            onDone={handleRecruitDone}
          />
          <RejectLeadModal
            open={isRejectModalOpen}
            onOpenChange={setIsRejectModalOpen}
            onDone={handleRejectDone}
          />
          <CancelLeadModal
            open={isCancelModalOpen}
            onOpenChange={setIsCancelModalOpen}
            leadName={selectedLead.name}
            onDone={handleCancelDone}
          />
        </>
      )}
    </>
  );
}