import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface EventDetailModalProps {
  event: any | null;
  isOpen: boolean;
  onClose: () => void;
  onRsvpChange?: (updatedEvent: any) => void;
}

const formatDate = (date: string | Date) =>
  format(new Date(date), 'EEEE, d MMMM yyyy', { locale: id });

const formatTime = (date: string | Date) =>
  format(new Date(date), 'HH:mm', { locale: id });

const rsvpLabelMap: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  belum: 'Belum',
};

// Label & warna teks status kehadiran peserta pada daftar undangan (creator-only).
const participantStatusColor: Record<string, string> = {
  hadir: 'text-green-600',
  tidak_hadir: 'text-red-600',
  belum: 'text-gray-500',
};

const participantStatusLabel: Record<string, string> = {
  hadir: 'Hadir',
  tidak_hadir: 'Tidak Hadir',
  belum: 'Belum Konfirmasi',
};

export default function EventDetailModal({ event, isOpen, onClose, onRsvpChange }: EventDetailModalProps) {
    const [loadingRsvp, setLoadingRsvp] = useState(false);
  const [localRsvp, setLocalRsvp] = useState(event?.myRsvp ?? 'belum');
  const [participants, setParticipants] = useState<any[] | null>(null);
  const [isParticipantsLoading, setIsParticipantsLoading] = useState(false);

  // Sync local RSVP state when prop changes (modal dibuka untuk event lain).
  useEffect(() => {
    setLocalRsvp(event?.myRsvp ?? 'belum');
  }, [event]);

  // Fetch daftar peserta + status RSVP — HANYA untuk creator & event valid.
  // AbortController di-cleanup agar tidak memicu "signal is aborted" /
  // state-update setelah modal ditutup secara cepat.
  useEffect(() => {
    const isCreator = event?.isCreator;
    const eventId = event?.id;
    if (!isCreator || !eventId) {
      setParticipants(null);
      return;
    }
    const controller = new AbortController();
    const signal = controller.signal;
    let cancelled = false;

    setIsParticipantsLoading(true);
    api.events
      .get(String(eventId), signal)
      .then((res) => {
        if (cancelled) return;
        const invs = res?.event?.invitees ?? res?.data?.event?.invitees ?? [];
        setParticipants(Array.isArray(invs) ? invs : []);
        setIsParticipantsLoading(false);
      })
      .catch((err: any) => {
        if (err?.name === 'AbortError') return; // pembatalan legit — abaiki
        if (cancelled) return;
        toast.error('Gagal memuat daftar peserta.', { description: err.message });
        setParticipants([]);
        setIsParticipantsLoading(false);
      });

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [event?.isCreator, event?.id]);

  const handleRsvp = async (rsvp: 'hadir' | 'tidak_hadir') => {
    if (!event?.id) return;
    setLoadingRsvp(true);
    try {
      const res = await api.events.rsvp(event.id, { rsvp });
      // Backend mengembalikan event yang sudah di-update ({ event: {...} }).
      const updatedEvent = res.event ?? res.data?.event ?? { ...event, myRsvp: rsvp };
      setLocalRsvp(updatedEvent.myRsvp ?? rsvp);
      onRsvpChange?.(updatedEvent);
      toast.success(rsvp === 'hadir' ? 'Anda konfirmasi hadir.' : 'Anda konfirmasi tidak hadir.');
    } catch (error: any) {
      toast.error('Gagal mengirim RSVP.', { description: error.message });
    } finally {
      setLoadingRsvp(false);
    }
  };

    // Jika tidak ada event yang dipilih, jangan render apa-apa.
  if (!event) return null;

  const rsvpStatusText = rsvpLabelMap[localRsvp] ?? 'Belum';

  // Ringkasan distribusi kehadiran peserta (hanya ditampilkan oleh creator pada daftar undangan).
  const rsvpSummaryText = (() => {
    if (!participants) return null;
    const hadir = participants.filter((p: any) => p?.rsvp === 'hadir').length;
    const tidakHadir = participants.filter((p: any) => p?.rsvp === 'tidak_hadir').length;
    const belum = participants.length - hadir - tidakHadir;
    return `Peserta: ${hadir} Hadir, ${tidakHadir} Tidak Hadir, ${belum} Belum Konfirmasi`;
  })();

  return (
        <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
            <DialogContent className="max-w-md w-full flex flex-col max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[#002D62]">
            {event.title}
          </DialogTitle>
        </DialogHeader>

        {/* Konten yang bisa discroll: info, deskripsi, RSVP (non-creator) & daftar peserta (creator) */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-3 mt-2">
          {/* Baris informasi: label sejajar titik dua */}
          <div className="grid grid-cols-[130px_1fr] gap-1 text-sm">
            <span className="text-gray-500">Mulai Event</span>
            <span className="text-gray-800 col-start-2">
              {formatDate(event.startDate)} Pukul {formatTime(event.startDate)}
            </span>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-1 text-sm">
            <span className="text-gray-500">Selesai Event</span>
            <span className="text-gray-800 col-start-2">
              {formatDate(event.endDate)} Pukul {formatTime(event.endDate)}
            </span>
          </div>
          <div className="grid grid-cols-[130px_1fr] gap-1 text-sm">
            <span className="text-gray-500">Jenis Meeting</span>
            <span className="text-gray-800 col-start-2">
              {event.meetingType && (
                <span className="capitalize">
                  {event.meetingType === 'online'
                    ? 'Online'
                    : event.meetingType === 'onsite'
                      ? 'Onsite (Offline)'
                      : event.meetingType === 'hybrid'
                        ? 'Hybrid'
                        : event.meetingType}
                </span>
              )}
            </span>
          </div>

          {/* Deskripsi: label di atas, isi di bawah */}
          <div className="pt-1">
            <span className="block text-sm text-gray-500 mb-1">Deskripsi</span>
            <p className="text-sm text-gray-800 break-words">
              {event.description || '-'}
            </p>
          </div>

                    {/* Bagian RSVP — hanya untuk peserta biasa (non-creator). Creator tidak mengirim RSVP ke eventnya sendiri. */}
          {!event.isCreator && (
            <div className="border-t pt-4 mt-4">
              <div className="flex items-center gap-3">
                <Button
                  size="sm"
                  variant={localRsvp === 'hadir' ? 'default' : 'outline'}
                  onClick={() => handleRsvp('hadir')}
                  disabled={loadingRsvp}
                >
                  {loadingRsvp && localRsvp === 'hadir' ? 'Mengirim...' : 'Hadir'}
                </Button>
                <Button
                  size="sm"
                  variant={localRsvp === 'tidak_hadir' ? 'destructive' : 'outline'}
                  onClick={() => handleRsvp('tidak_hadir')}
                  disabled={loadingRsvp}
                >
                  {loadingRsvp && localRsvp === 'tidak_hadir' ? 'Mengirim...' : 'Tidak Hadir'}
                </Button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Anda sudah konfirmasi: {rsvpStatusText}
              </p>
            </div>
          )}

          {/* Daftar Peserta & Status RSVP — khusus pembuat event (creator). */}
          {event.isCreator && (() => {
            return (
              <>
                <hr className="my-4 border-gray-200" />
                <p className="text-lg font-bold text-gray-800 mb-1">
                  Daftar Undangan
                </p>
                {rsvpSummaryText && (
                  <p className="text-sm text-gray-500 mb-3">{rsvpSummaryText}</p>
                )}
                {isParticipantsLoading ? (
                  <p className="text-sm text-gray-500">Memuat daftar peserta...</p>
                ) : participants && participants.length > 0 ? (
                  <div className="max-h-48 overflow-y-auto pr-2">
                    {participants.map((p: any) => {
                      const rsvp = p?.rsvp ?? 'belum';
                      return (
                        <div
                          key={p?.id ?? p?.name}
                          className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                        >
                          <span className="text-sm font-normal text-gray-800">
                            {p?.name ?? 'Peserta'}
                          </span>
                          <span
                            className={`text-xs ${participantStatusColor[rsvp] ?? 'text-gray-500'}`}
                          >
                            {participantStatusLabel[rsvp] ?? 'Belum Konfirmasi'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">Belum ada peserta diundang.</p>
                )}
              </>
            );
          })()}
        </div>

        {/* Akhir konten yang bisa discroll */}
        </div>

        {/* Footer statis: "Dibuat Oleh" — di luar area scroll, selalu terlihat (kiri/bawah). */}
        <div className="border-t pt-3 flex justify-end">
          <p className="text-xs text-gray-500">
            Dibuat Oleh: {event.creator?.name ?? 'N/A'}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
