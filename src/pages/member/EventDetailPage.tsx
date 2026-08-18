import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CalendarDays,
  Clock,
  MapPin,
  Users,
  UserPlus,
  CheckCircle2,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Avatar, AvatarFallback } from '@/components/ui/Avatar';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const formatDateTime = (date: string | Date) =>
  format(new Date(date), 'EEEE, d MMMM yyyy • HH:mm', { locale: id });

const getInitials = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchEvent = useCallback(
    async (signal?: AbortSignal) => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await api.events.get(id, signal);
        setEvent(res.data.event);
      } catch (error: any) {
        if (!error?.isAbort) {
          toast.error('Gagal memuat detail event.', { description: error.message });
          navigate('/member/event');
        }
      } finally {
        setLoading(false);
      }
    },
    [id, navigate]
  );

  useEffect(() => {
    const controller = new AbortController();
    fetchEvent(controller.signal);
    return () => controller.abort();
  }, [fetchEvent]);

  const handleRsvp = async (rsvp: 'hadir' | 'tidak_hadir') => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.events.rsvp(id, { rsvp });
      setEvent(res.data.event);
      toast.success(rsvp === 'hadir' ? 'Anda konfirmasi hadir.' : 'Anda konfirmasi tidak hadir.');
    } catch (error: any) {
      toast.error('Gagal mengirim RSVP.', { description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  const handleFinish = async () => {
    if (!id) return;
    setActionLoading(true);
    try {
      const res = await api.events.finish(id, { attendance: [] });
      setEvent(res.data.event);
      toast.success('Event telah ditandai selesai.', {
        description: 'Anda sekarang dapat mengelola absensi peserta.',
      });
    } catch (error: any) {
      toast.error('Gagal menyelesaikan event.', { description: error.message });
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-gray-500">Memuat detail event...</p>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-4">Event tidak ditemukan.</p>
        <Button variant="outline" onClick={() => navigate('/member/event')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali
        </Button>
      </div>
    );
  }

  const isFinished = event.status === 'finished';
  const canRsvp = !!event.myInviteeId && !isFinished;

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate('/member/event')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Kembali ke Event
        </Button>
        {event.isCreator && !isFinished && (
          <Button onClick={handleFinish} disabled={actionLoading}>
            <CheckCircle2 className="h-4 w-4 mr-2" />
            {actionLoading ? 'Menyelesaikan...' : 'Selesaikan Event'}
          </Button>
        )}
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3">
            <CardTitle className="text-2xl text-[#002D62]">{event.title}</CardTitle>
            {event.type && <Badge variant="outline">{event.type}</Badge>}
            <Badge variant={isFinished ? 'secondary' : 'default'}>
              {isFinished ? 'Selesai' : 'Aktif'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarDays className="h-4 w-4 text-gray-400" />
              {formatDateTime(event.startDate)}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock className="h-4 w-4 text-gray-400" />
              {event.endDate ? formatDateTime(event.endDate) : 'Waktu tidak ditentukan'}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <MapPin className="h-4 w-4 text-gray-400" />
              {event.meetingType === 'online'
                ? 'Online'
                : event.meetingType === 'hybrid'
                ? `Hybrid · ${event.location || '-'}`
                : event.location || 'Onsite'}
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Users className="h-4 w-4 text-gray-400" />
              {event.inviteeCount} Diundang · {event.rsvpHadirCount} Konfirmasi Hadir
            </div>
          </div>

          {event.description && (
            <div>
              <h4 className="font-medium text-gray-900 mb-1">Deskripsi</h4>
              <p className="text-sm text-gray-600 whitespace-pre-wrap">{event.description}</p>
            </div>
          )}

          {event.creator && (
            <div className="flex items-center gap-3 border-t pt-4">
              <Avatar>
                <AvatarFallback>{getInitials(event.creator.name)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-gray-500">Dibuat oleh</p>
                <p className="text-sm font-medium text-gray-900">{event.creator.name}</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {canRsvp && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Konfirmasi Kehadiran (RSVP)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                onClick={() => handleRsvp('hadir')}
                disabled={actionLoading || event.myRsvp === 'hadir'}
                variant={event.myRsvp === 'hadir' ? 'default' : 'outline'}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-2" /> Hadir
              </Button>
              <Button
                onClick={() => handleRsvp('tidak_hadir')}
                disabled={actionLoading || event.myRsvp === 'tidak_hadir'}
                variant={event.myRsvp === 'tidak_hadir' ? 'destructive' : 'outline'}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-2" /> Tidak Hadir
              </Button>
            </div>
            {event.myRsvp && event.myRsvp !== 'belum' && (
              <p className="text-xs text-gray-500 mt-3">
                Status RSVP Anda saat ini:{' '}
                <strong>{event.myRsvp === 'hadir' ? 'Hadir' : 'Tidak Hadir'}</strong>
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
          <CardTitle className="text-lg">Daftar Peserta ({event.inviteeCount})</CardTitle>
          {event.isCreator && (
            <Button size="sm" variant="outline" disabled>
              <UserPlus className="h-4 w-4 mr-2" /> Undang Peserta
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <AttendanceList
            eventId={event.id}
            invitees={event.invitees}
            attendances={event.attendances}
            isFinished={isFinished}
            isCreator={event.isCreator}
            canEditAttendance={!!event.canEditAttendance}
            onUpdate={setEvent}
          />
        </CardContent>
      </Card>
    </div>
  );
}

interface AttendanceListProps {
  eventId: string;
  invitees: any[];
  attendances: any[];
  isFinished: boolean;
  isCreator: boolean;
  canEditAttendance: boolean;
  onUpdate: (event: any) => void;
}

function AttendanceList({
  eventId,
  invitees,
  attendances,
  isFinished,
  isCreator,
  canEditAttendance,
  onUpdate,
}: AttendanceListProps) {
  // Memoize the map creation to prevent re-creating it on every render
  const attendanceMap = useMemo(() => {
    const map = new Map<string, boolean>();
    (attendances || []).forEach((att: any) => map.set(att.inviteeId, att.attended));
    return map;
  }, [attendances]);


  const [localMap, setLocalMap] = useState<Map<string, boolean>>(attendanceMap);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLocalMap(new Map(attendanceMap));
  }, [attendanceMap]);

  const canEdit = isFinished && isCreator && canEditAttendance;

  const handleToggle = (inviteeId: string, attended: boolean) => {
    setLocalMap((prev) => {
      const next = new Map(prev);
      next.set(inviteeId, attended);
      return next;
    });
  };

  const hasChanges = (() => {
    if (localMap.size !== attendanceMap.size) return true;
    for (const [k, v] of localMap) {
      if (attendanceMap.get(k) !== v) return true;
    }
    return false;
  })();

  const handleSaveChanges = async () => {
    setSaving(true);
    try {
      const payload = {
        attendance: Array.from(localMap.entries()).map(([inviteeId, attended]) => ({
          inviteeId,
          attended,
        })),
      };
      const res = await api.events.updateAttendance(eventId, payload);
      onUpdate(res.data.event);
      toast.success('Absensi berhasil diperbarui.');
    } catch (error: any) {
      toast.error('Gagal memperbarui absensi.', { description: error.message });
    } finally {
      setSaving(false);
    }
  };

  if (!invitees || invitees.length === 0) {
    return (
      <p className="text-sm text-gray-500 text-center py-6">Belum ada peserta diundang.</p>
    );
  }

  return (
    <div className="space-y-3">
      {invitees.map((inv: any) => {
        const isAttended = localMap.get(inv.id) ?? false;
        const displayName = inv.name || 'Tanpa Nama';

        return (
          <div
            key={inv.id}
            className="flex items-center justify-between border-b pb-2 last:border-0"
          >
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback>{getInitials(displayName)}</AvatarFallback>
              </Avatar>
              <div>
                <p className="text-sm font-medium text-gray-900">{displayName}</p>
                <p className="text-xs text-gray-500">
                  {inv.isExternal ? 'Eksternal' : inv.role || 'Member'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isFinished ? (
                canEdit ? (
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={isAttended ? 'default' : 'ghost'}
                      onClick={() => handleToggle(inv.id, true)}
                      className="h-8 w-8 p-0"
                      aria-label="Tandai hadir"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant={!isAttended ? 'destructive' : 'ghost'}
                      onClick={() => handleToggle(inv.id, false)}
                      className="h-8 w-8 p-0"
                      aria-label="Tandai tidak hadir"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <Badge variant={isAttended ? 'default' : 'secondary'}>
                    {isAttended ? 'Hadir' : 'Tidak Hadir'}
                  </Badge>
                )
              ) : (
                <Badge
                  variant={
                    inv.rsvp === 'hadir'
                      ? 'default'
                      : inv.rsvp === 'tidak_hadir'
                      ? 'destructive'
                      : 'outline'
                  }
                >
                  RSVP: {inv.rsvp === 'belum' ? 'Belum' : inv.rsvp}
                </Badge>
              )}
            </div>
          </div>
        );
      })}
      {canEdit && hasChanges && (
        <div className="flex justify-end pt-4">
          <Button onClick={handleSaveChanges} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan Absensi'}
          </Button>
        </div>
      )}
    </div>
  );
}
