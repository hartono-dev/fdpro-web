import { CalendarDays, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import CreateEventDialog from './dialogs/CreateEventDialog';
import EventDetailModal from './dialogs/EventDetailModal';

// Helper function to format date range
const formatEventDate = (start: string | Date, end: string | Date) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startFormat = format(startDate, 'd MMM yyyy, HH:mm', { locale: id });
  const endFormat = format(endDate, 'HH:mm', { locale: id });
  return `${startFormat} - ${endFormat}`;
};

// Helper: normalisasi label RSVP menjadi kapital kata pertama dan ganti _ dengan spasi.
const capitalizeRsvp = (status: string) =>
  status.replace(/_/g, ' ').split(' ').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

// --- Main Component ---
export default function EventPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isDetailOpen, setDetailOpen] = useState(false);

  const { user } = useAuth();
  // Role 'calon_agen' bersifat Read-Only pada fitur Event: hanya boleh melihat daftar/detail.
  const isCalonAgen = user?.role === 'calon_agen';

  const fetchEvents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res: any = await api.events.list(signal);
      // Ekstraksi defensif: dukung { events: [...] }, { data: { events: [...] } }, maupun raw array.
      const list: any[] = Array.isArray(res)
        ? res
        : Array.isArray(res?.events)
          ? res.events
          : Array.isArray(res?.data?.events)
            ? res.data.events
            : [];
      setEvents(list);
    } catch (error: any) {
      // Abaikan error akibat pembatalan request (abort) — lazim saat StrictMode remount / navigasi cepat.
      if (error?.name === 'AbortError' || error?.isAbort) return;
      toast.error('Gagal mengambil data event.', {
        description: error.message || 'Terjadi kesalahan pada server.',
      });
    } finally {
      setLoading(false);
    }
  }, []);

    useEffect(() => {
    const controller = new AbortController();
    fetchEvents(controller.signal);
    // PRD §5.5 (changelog #86): polling ringan tiap 60s + refresh saat fokus/tab
    // agar UI peserta mereaktifasi perubahan status submit (isAttendanceSubmitted)
    // dari creator. setState hanya lewat fetchEvents di dalam try — tidak langsung
    // di sini, sehingga tak ada infinite render (StrictMode double-invoke hanya
    // mensetup/menyiapkan listener sekali per mount).
    const poll = setInterval(() => {
      const c = new AbortController();
      fetchEvents(c.signal);
    }, 60000);
    const onFocus = () => {
      const c = new AbortController();
      fetchEvents(c.signal);
    };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => {
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      controller.abort();
    };
  }, [fetchEvents]);

  const { upcomingEvents, pastEvents } = useMemo(() => {
    const now = new Date();
    return events.reduce(
      (acc, event) => {
        if (new Date(event.endDate) < now) {
          acc.pastEvents.push(event);
        } else {
          acc.upcomingEvents.push(event);
        }
        return acc;
      },
      { upcomingEvents: [] as any[], pastEvents: [] as any[] }
    );
  }, [events]);

  const handleEventCreated = (newEvent: any) => {
    if (!newEvent?.id) return;
    setEvents((prev) => [newEvent, ...prev]);
  };

    // Buka modal detail event (mengganti navigasi URL yang buggy).
  const handleViewDetail = (event: any) => {
    setSelectedEvent(event);
    setDetailOpen(true);
  };

  // PRD §5.5 (changelog #86): di tab Riwayat, creator mengklik "Daftar Hadir" →
  // navigate ke halaman absensi khusus (/member/event/:id/attendance).
  const navigate = useNavigate();
  const handleViewAttendance = (event: any) => {
    navigate(`/member/event/${event.id}/attendance`);
  };

  // Tutup modal detail event dan bersihkan seleksi.
  const handleCloseDetail = () => {
    setDetailOpen(false);
    setSelectedEvent(null);
  };

    // Update local RSVP di daftar ketika modal memberi umpan balik RSVP.
  const handleRsvpChange = (updatedEvent: any) => {
    setEvents((prev) =>
      prev.map((e) => (e.id === updatedEvent.id ? { ...e, myRsvp: updatedEvent.myRsvp } : e))
    );
  };

  // PRD §5.5 (changelog #86): RSVP "Hadir" langsung dari kartu event di tab Riwayat
  // (peserta, setelah creator submit). Optimis update myRsvp agar UI langsung reaktif.
  const handleParticipantRsvp = async (eventId: string, rsvp: 'hadir' | 'tidak_hadir') => {
    const prev: any[] = [];
    try {
      const res: any = await api.events.rsvp(eventId, { rsvp });
      const updated = res?.event ?? res?.data?.event;
      setEvents((cur) => cur.map((e) => (e.id === eventId ? { ...e, myRsvp: updated?.myRsvp ?? rsvp } : e)));
      toast.success(rsvp === 'hadir' ? 'Anda konfirmasi hadir.' : 'Anda konfirmasi tidak hadir.');
    } catch (error: any) {
      toast.error('Gagal mengirim RSVP.', { description: error.message });
      // revert optimis: tidak ada data lokal prior, biarkan state tetap konsisten.
      void prev;
    }
  };

  const handleCreateOpen = () => {
    if (isCalonAgen) {
      toast.error('Anda tidak memiliki akses untuk membuat event');
      return;
    }
    setCreateOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002D62]">Event & Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola jadwal pelatihan, seminar, dan kegiatan tim Anda.</p>
        </div>
        {!isCalonAgen && (
          <Button onClick={handleCreateOpen} className="w-full sm:w-auto">
            <Plus className="h-4 w-4 mr-2" />
            Buat Event
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Daftar Event</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="upcoming">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="upcoming">Mendatang</TabsTrigger>
              <TabsTrigger value="past">Riwayat</TabsTrigger>
            </TabsList>
            <TabsContent value="upcoming">
              <EventList
                events={upcomingEvents}
                loading={loading}
                type="upcoming"
                isCalonAgen={isCalonAgen}
                onViewDetail={handleViewDetail}
              />
            </TabsContent>
            <TabsContent value="past">
                          <EventList
                events={pastEvents}
                loading={loading}
                type="past"
                isCalonAgen={isCalonAgen}
                onViewDetail={handleViewDetail}
                onViewAttendance={handleViewAttendance}
                                onRsvp={handleParticipantRsvp}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

            <CreateEventDialog
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onEventCreated={handleEventCreated}
      />

      <EventDetailModal
        event={selectedEvent}
        isOpen={isDetailOpen}
        onClose={handleCloseDetail}
        onRsvpChange={handleRsvpChange}
      />
    </div>
  );
}

// --- Event List Component ---
interface EventListProps {
  events: any[];
  loading: boolean;
  type: 'upcoming' | 'past';
  isCalonAgen?: boolean;
  onViewDetail: (event: any) => void;
  onViewAttendance?: (event: any) => void;
  onRsvp?: (id: string, rsvp: 'hadir' | 'tidak_hadir') => void;
}

function EventList({ events, loading, type, isCalonAgen, onViewDetail, onViewAttendance, onRsvp }: EventListProps) {
  if (loading) {
    return <div className="text-center py-12">Memuat data...</div>;
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarDays className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {type === 'upcoming' ? 'Tidak ada event mendatang' : 'Tidak ada riwayat event'}
        </h3>
        <p className="text-gray-500">
          {type === 'upcoming'
            ? isCalonAgen
              ? 'Belum ada jadwal event mendatang saat ini.'
            : 'Semua event yang akan datang akan muncul di sini.'
            : 'Event yang sudah selesai akan muncul di sini.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {events.map((event) => (
                <EventListItem
            key={event.id}
            event={event}
            type={type}
            onViewDetail={onViewDetail}
            onViewAttendance={onViewAttendance}
            onRsvp={onRsvp}
          />
      ))}
    </div>
  );
}

// --- Event List Item Component ---
function EventListItem({ event, type, onViewDetail, onViewAttendance, onRsvp }: {
  event: any;
  type: 'upcoming' | 'past';
  onViewDetail: (event: any) => void;
  onViewAttendance?: (event: any) => void;
  onRsvp?: (id: string, rsvp: 'hadir' | 'tidak_hadir') => void;
}) {
  const creatorName = event.creator?.name ?? 'N/A';
  const isPast = type === 'past';
  const isCreatorEvent = event.isCreator;
  const isParticipant = !event.isCreator;

  return (
    <div className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 transition-colors">
      <div className="flex-grow">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-semibold text-base text-[#002D62]">{event.title}</h4>
        </div>
        <p className="text-sm text-gray-600 mb-2">{formatEventDate(event.startDate, event.endDate)}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>Dibuat oleh: {creatorName}</span>
        </div>
      </div>
                  <div className="flex-shrink-0 flex sm:flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          {/* Badge RSVP: hanya untuk non-creator di tab Mendatang. Di tab Riwayat, peserta non-creator
              tidak menampilkan badge status kehadiran (RSVP dilihat lewat aksi "Hadir"/statis di bawah);
              creator tidak pernah melihat badge RSVP event-sendiri. Kondisi ditambah `!isPast` supaya
              tab Riwayat tidak menampilkan badge status (tidak ada celah/spasi kosong). */}
          {!event.isCreator && !isPast && event.myRsvp === 'belum' && event.status !== 'finished' && (
            <Badge variant="destructive">Menunggu RSVP</Badge>
          )}
          {!event.isCreator && !isPast && event.myRsvp !== 'belum' && (
            <Badge variant={event.myRsvp === 'hadir' ? 'default' : 'secondary'}>
              {capitalizeRsvp(event.myRsvp)}
            </Badge>
          )}
          {isCreatorEvent && (
            <Badge className="bg-green-100 text-green-800">Creator</Badge>
          )}
          {/* Tag "Peserta" khusus non-creator di tab Riwayat (PRD §5.5 changelog #86). */}
          {isParticipant && isPast && (
            <Badge variant="outline" className="bg-blue-50 text-blue-800">
              Peserta
            </Badge>
          )}
        </div>

        {/* Slot aksi kanan (PRD §5.5 changelog #86/#87):
            - Tab Riwayat + peserta non-creator → aksi dinamis (tombol/static "Hadir" atau kosong).
            - Tab Mendatang / creator → tombol standar "Lihat Detail" (creator Riwayat → "Daftar Hadir"). */}
        {isParticipant && isPast ? (
          <ParticipantHistoryAttendance event={event} onRsvp={onRsvp} />
        ) : (
          <Button
            size="sm"
            variant={isPast && isCreatorEvent ? 'default' : 'outline'}
            onClick={(e) => {
              e.stopPropagation();
              if (isPast && isCreatorEvent) onViewAttendance?.(event);
              else onViewDetail(event);
            }}
          >
            {isPast && isCreatorEvent ? 'Daftar Hadir' : 'Lihat Detail'}
          </Button>
        )}
      </div>
    </div>
  );
}

// --- Peserta di tab Riwayat: aksi "Hadir" bersyarat (PRD §5.5 changelog #87). ---
// Render tidak-NULL hanya bila:
//   (a) creator sudah submit/mengunci daftar hadir  -> `event.isAttendanceSubmitted === true`, DAN
//   (b) login user termasuk peserta/daftar absensi  -> `event.myInviteeId != null`
//      (field compute di `serializeEvent` backend, bernilai invitee user bila ia ada di daftar event).
// Jika belum submit (a) ATAU user tidak terdaftar (b) -> area tetap kosong (render `null`),
// sehingga tidak ada badge status/ tombol "Lihat Detail" apa pun di kartu ini.
function ParticipantHistoryAttendance({
  event,
  onRsvp,
}: {
  event: any;
  onRsvp?: (id: string, rsvp: 'hadir' | 'tidak_hadir') => void;
}) {
  const submitted = !!event.isAttendanceSubmitted; // syarat (a)
  const inRoster = event.myInviteeId != null; // syarat (b)
  const ready = submitted && inRoster;

  // State lokal: inisiasi dari myRsvp awal DB; refresh tiap polling/refresh
  // (EventPage polling 60s + refresh-on-focus, PRD #86) agar statis "Hadir"
  // langsung berubah bila state RSVP berubah.
  const [hasConfirmed, setHasConfirmed] = useState(event.myRsvp === 'hadir');
  useEffect(() => setHasConfirmed(event.myRsvp === 'hadir'), [event.myRsvp]);

  if (!ready) return null;

  // RSVP 'hadir' sudah pernah dikonfirmasi -> tampilkan sebagai teks statis (tanpa border/background tombol).
  if (hasConfirmed) {
    return <span className="text-xs font-medium text-green-700">Hadir</span>;
  }

  // Tombol "Hadir" pertama kali: klik -> RSVP 'hadir' lewat API + set state lokal optimis.
  return (
    <Button
      size="sm"
      variant="outline"
      className="border-green-600 text-green-700 hover:bg-green-50"
      onClick={(e) => {
        e.stopPropagation();
        onRsvp?.(event.id, 'hadir'); // POST /api/events/:id/rsvp via api.events.rsvp
        setHasConfirmed(true);
      }}
    >
      Hadir
    </Button>
  );
}

