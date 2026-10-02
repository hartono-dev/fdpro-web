import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, Search } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/Table';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { toast } from 'sonner';

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

/** Format tanggal mulai event: "28 September 2026" (pakai Intl locale bawaan id-ID). */
const formatEventDate = (startDate: string | Date | undefined) => {
  if (!startDate) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** Format waktu mulai event: "10:00" (24h; diasumsikan WIB per timezone server). */
const formatEventTime = (startDate: string | Date | undefined) => {
  if (!startDate) return null;
  const d = new Date(startDate);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false });
};

/**
 * Halaman Daftar Hadir khusus Creator (PRD §5.5 changelog #86).
 * Route: /member/event/:id/attendance. Semua setState berasal dari callback async/fetch,
 * bukan body render → tidak ada infinite render.
 */
export default function AttendancesPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  // 'submit' | 'add' | participant-id (hapus) | null
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // --- Modal "Tambah Peserta" ---
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [members, setMembers] = useState<any[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');

  const actionBusy = !!actionLoading;

  const fetchParticipants = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      setLoading(true);
      try {
        const res: any = await api.events.participants.list(id, signal);
        const list: any[] = Array.isArray(res?.participants)
          ? res.participants
          : Array.isArray(res?.data?.participants)
            ? res.data.participants
            : [];
        setParticipants(list);
        setIsSubmitted(!!(res?.isAttendanceSubmitted ?? res?.data?.isAttendanceSubmitted));
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.isAbort) return;
        toast.error('Gagal memuat daftar peserta.', { description: error.message });
      } finally {
        setLoading(false);
      }
    },
    [id]
  );

  const fetchEvent = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      try {
        const res: any = await api.events.get(id, signal);
        setEvent(res?.event ?? res?.data?.event ?? null);
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.isAbort) return;
        toast.error('Gagal memuat event.', { description: error.message });
      }
    },
    [id]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchParticipants(controller.signal);
    fetchEvent(controller.signal);
    return () => controller.abort();
  }, [fetchParticipants, fetchEvent]);

  const fetchMembers = useCallback(
    async (signal?: AbortSignal, term: string = '', limit: number = 50) => {
      if (!id) return;
      setMembersLoading(true);
      try {
        const res: any = await api.events.team(
          id,
          { scope: 'all', search: term || undefined, limit: term ? undefined : limit },
          signal
        );
        const list: any[] = Array.isArray(res?.members)
          ? res.members
          : Array.isArray(res?.data?.members)
            ? res.data.members
            : [];
        setMembers(list);
      } catch (error: any) {
        if (error?.name === 'AbortError' || error?.isAbort) return;
        toast.error('Gagal memuat daftar anggota.', { description: error.message });
      } finally {
        setMembersLoading(false);
      }
    },
    [id]
  );

  const openMemberModal = () => {
    setSelectedMemberIds(new Set());
    setSearchTerm('');
    setIsMemberModalOpen(true);
    // Fetch dipicu oleh useEffect pencarian (searchTerm='') — tidak dipanggil manual
    // agar tidak menimpa state pencarian/scan halus di dalam modal.
  };

  // Server-side search pada modal "Tambah Peserta": debounce 300ms agar tidak
  // spam API saat mengetik. Fetch hanya dipicu oleh perubahan `searchTerm` /
  // visibilitas modal — setState di dalam fetchMembers (setMembers/setMembersLoading)
  // tidak ada di dependency ini sehingga tidak menimbulkan re-fetch loop tak berujung.
  useEffect(() => {
    if (!isMemberModalOpen) return;
    const controller = new AbortController();
    const term = searchTerm.trim();
    const debounced = setTimeout(() => {
      fetchMembers(controller.signal, term).catch(() => {});
    }, 300);
    return () => {
      clearTimeout(debounced);
      controller.abort();
    };
  }, [searchTerm, isMemberModalOpen, fetchMembers]);

  const removeParticipant = async (participantId: string) => {
    if (!id) return;
    setActionLoading(participantId);
    try {
      await api.events.participants.remove(id, participantId);
      toast.success('Peserta berhasil dihapus.');
      setParticipants((prev) => prev.filter((p) => p.id !== participantId));
    } catch (error: any) {
      toast.error('Gagal menghapus peserta.', { description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const addSelected = async () => {
    if (!id) return;
    const userIds = Array.from(selectedMemberIds);
    if (!userIds.length) {
      toast('Pilih setidaknya satu anggota.');
      return;
    }
    setActionLoading('add');
    try {
      await api.events.participants.add(id, { userIds });
      toast.success(`Berhasil menambah ${userIds.length} peserta.`);
      const ctrl = new AbortController();
      await fetchParticipants(ctrl.signal);
      setIsMemberModalOpen(false);
      setSelectedMemberIds(new Set());
      setSearchTerm('');
    } catch (error: any) {
      toast.error('Gagal menambahkan peserta.', { description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  const handleSubmit = async () => {
    if (!id) return;
    setActionLoading('submit');
    try {
      await api.events.attendance.submit(id);
      toast.success('Absensi berhasil disubmit.', {
        description: 'Tombol "Hadir" peserta kini aktif untuk konfirmasi kehadiran.',
      });
      setIsSubmitted(true);
      const ctrl = new AbortController();
      await fetchParticipants(ctrl.signal);
    } catch (error: any) {
      toast.error('Gagal men-submit absensi.', { description: error.message });
    } finally {
      setActionLoading(null);
    }
  };

  // NOTE: pencarian anggota di modal "Tambah Peserta" sudah dilakukan di backend

  // Daftar hadir: hanya peserta yang konfirmasi kehadiran ("hadir" atau attended=true).
  // Peserta "Belum Konfirmasi" / "Tidak Hadir" tidak ditampilkan di tabel ini.
  const presentParticipants = participants.filter(
    (p) => p?.rsvp === 'hadir' || p?.attended === true
  );

  if (!id) {
    return (
      <div className="p-6">
        <p className="text-sm text-gray-500">Event tidak ditemukan.</p>
      </div>
    );
  }
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate('/member/event')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-[#002D62]">Daftar Hadir</h1>
          {event?.title && (
            <p className="text-sm text-gray-500">
              {event.title} - {formatEventDate(event.startDate) ?? '—'}{' '}
              Pukul {formatEventTime(event.startDate) ?? '—'} WIB
            </p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader />
        <CardContent>
          {loading ? (
            <p className="text-sm text-gray-500">Memuat daftar peserta...</p>
          ) : participants.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-6">Belum ada peserta diundang.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama</TableHead>
                  <TableHead>Posisi</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Aksi</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {presentParticipants.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell>
                      <span className="text-sm font-medium text-gray-800">{p.name}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600">{p.role || '-'}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={p.attended ? 'default' : p.rsvp === 'hadir' ? 'default' : 'secondary'}>
                        {p.status}
                      </Badge>
                      {p.isExternal && (
                        <Badge variant="secondary" className="ml-1">
                          Eksternal
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 w-8 p-0"
                        onClick={() => removeParticipant(p.id)}
                        disabled={actionBusy || isSubmitted}
                        aria-label={`Hapus ${p.name}`}
                        title={isSubmitted ? 'Daftar sudah disubmit' : `Hapus ${p.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-2">
        <Button variant="outline" onClick={openMemberModal} disabled={actionBusy || isSubmitted}>
          <Plus className="h-4 w-4 mr-2" />
          Tambah Peserta
        </Button>
        {/* Tombol Submit — kotak biru di kanan bawah halaman. */}
        <Button
          className="bg-blue-700 hover:bg-blue-800 text-white"
          onClick={handleSubmit}
          disabled={isSubmitted || actionBusy}
        >
          {isSubmitted ? 'Sudah Disubmit' : actionLoading === 'submit' ? 'Menyubmit...' : 'Submit'}
        </Button>
      </div>

      {isSubmitted && (
        <p className="text-xs text-green-700">
          Daftar hadir telah disubmit. Peserta dapat konfirmasi kehadiran via tombol “Hadir” pada
          kartu event tab Riwayat.
        </p>
      )}
            {/* Modal: pilih anggota tim untuk ditambahkan ke daftar peserta. */}
      <Dialog open={isMemberModalOpen} onOpenChange={setIsMemberModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah Peserta</DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2 mb-3">
            <Search className="h-4 w-4 text-gray-400" />
            <Input
              placeholder="Cari nama atau kode..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          {membersLoading ? (
            <p className="text-sm text-gray-500">Mencari…</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-gray-500">Anggota tidak ditemukan.</p>
          ) : (
            <div className="max-h-60 overflow-y-auto pr-1 space-y-2">
              {members.map((m) => {
                const checked = selectedMemberIds.has(m.id);
                return (
                  <label key={m.id} className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-gray-300 text-[#002D62] focus:ring-[#002D62]"
                      checked={checked}
                      onChange={(e) => {
                        const next = new Set(selectedMemberIds);
                        if (e.target.checked) next.add(m.id);
                        else next.delete(m.id);
                        setSelectedMemberIds(next);
                      }}
                    />
                    <Avatar>
                      <AvatarFallback>{getInitials(m.name || m.id)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-sm font-medium text-gray-800">{m.name || m.id}</span>
                      {m.role && <span className="text-xs text-gray-500"> — {m.role}</span>}
                    </div>
                  </label>
                );
              })}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setIsMemberModalOpen(false);
                setSelectedMemberIds(new Set());
                setSearchTerm('');
              }}
            >
              Batal
            </Button>
            <Button
              onClick={addSelected}
              disabled={actionLoading === 'add' || selectedMemberIds.size === 0}
            >
              {actionLoading === 'add' ? 'Menambahkan...' : `Tambah (${selectedMemberIds.size})`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
