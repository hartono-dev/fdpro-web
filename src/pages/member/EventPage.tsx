import { CalendarDays, Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Badge } from '@/components/ui/Badge';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import CreateEventDialog from './dialogs/CreateEventDialog'; // Akan dibuat nanti

// Helper function to format date range
const formatEventDate = (start: string | Date, end: string | Date) => {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const startFormat = format(startDate, 'd MMM yyyy, HH:mm', { locale: id });
  const endFormat = format(endDate, 'HH:mm', { locale: id });
  return `${startFormat} - ${endFormat}`;
};

// --- Main Component ---
export default function EventPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setCreateOpen] = useState(false);

  const fetchEvents = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await api.events.list(signal);
      setEvents(res.data.events || []);
    } catch (error: any) {
      if (!error.isAbort) {
        toast.error('Gagal mengambil data event.', {
          description: error.message || 'Terjadi kesalahan pada server.',
        });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    fetchEvents(controller.signal);
    return () => controller.abort();
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
    setEvents((prev) => [newEvent, ...prev]);
    // Optional: switch to upcoming tab
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002D62]">Event & Kegiatan</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola jadwal pelatihan, seminar, dan kegiatan tim Anda.</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Buat Event
        </Button>
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
              <EventList events={upcomingEvents} loading={loading} type="upcoming" />
            </TabsContent>
            <TabsContent value="past">
              <EventList events={pastEvents} loading={loading} type="past" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <CreateEventDialog
        isOpen={isCreateOpen}
        onClose={() => setCreateOpen(false)}
        onEventCreated={handleEventCreated}
      />
    </div>
  );
}

// --- Event List Component ---
interface EventListProps {
  events: any[];
  loading: boolean;
  type: 'upcoming' | 'past';
}

function EventList({ events, loading, type }: EventListProps) {
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
            ? 'Semua event yang akan datang akan muncul di sini.'
            : 'Event yang sudah selesai akan muncul di sini.'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-4">
      {events.map((event) => (
        <EventListItem key={event.id} event={event} />
      ))}
    </div>
  );
}

// --- Event List Item Component ---
function EventListItem({ event }: { event: any }) {
  const navigate = useNavigate();

  // Defensive check for creator
  const creatorName = event.creator?.name ?? 'N/A';

  return (
    <div
      onClick={() => navigate(`/member/event/${event.id}`)}
      className="border rounded-lg p-4 flex flex-col sm:flex-row gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
    >
      <div className="flex-grow">
        <div className="flex items-center gap-3 mb-2">
          <h4 className="font-semibold text-base text-[#002D62]">{event.title}</h4>
          {event.type && <Badge variant="outline">{event.type}</Badge>}
        </div>
        <p className="text-sm text-gray-600 mb-2">{formatEventDate(event.startDate, event.endDate)}</p>
        <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
          <span>Dibuat oleh: {creatorName}</span>
          {event.inviteeCount > 0 && <span>{event.inviteeCount} Undangan</span>}
          {event.rsvpHadirCount > 0 && <span>{event.rsvpHadirCount} Hadir</span>}
        </div>
      </div>
      <div className="flex-shrink-0 flex sm:flex-col items-end justify-between gap-2">
        <div className="flex items-center gap-2">
          {event.myRsvp === 'belum' && event.status !== 'finished' && <Badge variant="destructive">Menunggu RSVP</Badge>}
          {event.myRsvp !== 'belum' && <Badge variant={event.myRsvp === 'hadir' ? 'default' : 'secondary'}>RSVP: {event.myRsvp}</Badge>}
          {event.isCreator && <Badge className="bg-green-100 text-green-800">Creator</Badge>}
        </div>
        <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); navigate(`/member/event/${event.id}`); }}>
          Lihat Detail
        </Button>
      </div>
    </div>
  );
}

