import { Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Textarea } from '@/components/ui/textarea';
import { DatePicker } from '@/components/ui/DatePicker';
import { TimePicker } from '@/components/ui/TimePicker';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { addYears, parseISO } from 'date-fns';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import InviteTeamDialog from './InviteTeamDialog'; // Placeholder for the new dialog


const eventSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().optional(),
  type: z.string(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu tidak valid (HH:MM)'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Format tanggal tidak valid (YYYY-MM-DD)'),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu tidak valid (HH:MM)'),
  meetingType: z.string().min(1, 'Jenis pertemuan harus dipilih'),
  accessType: z.string().min(1, 'Jenis akses harus dipilih'),
});

type EventFormData = z.infer<typeof eventSchema>;

interface CreateEventDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onEventCreated: (newEvent: any) => void;
}

const meetingTypeOptions = [
  { value: 'online', label: 'Online' },
  { value: 'onsite', label: 'Onsite (Offline)' },
  { value: 'hybrid', label: 'Hybrid' },
];

const typeOptions = [
  { value: 'Pelatihan', label: 'Pelatihan' },
  { value: 'Seminar', label: 'Seminar' },
  { value: 'Meeting', label: 'Meeting' },
  { value: 'BOS', label: 'BOS' },
];

/**
 * Batas atas tanggal event: +10 tahun dari hari ini. Tidak dipakai sebagai
 * "deadline keras" bisnis — hanya mencegah dropdown/mis-klik meleset terlalu
 * jauh ke masa depan. Dihitung sekali di module scope (nilai konstan).
 */
const eventMaxDate = addYears(new Date(), 10);

export default function CreateEventDialog({ isOpen, onClose, onEventCreated }: CreateEventDialogProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
  const [selectedInvitees, setSelectedInvitees] = useState<string[]>([]);
  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
  });

  useEffect(() => {
    if (isOpen) {
      const now = new Date();
      const roundedMinutes = Math.ceil(now.getMinutes() / 30) * 30;
      const startTime = new Date(now);
      startTime.setMinutes(roundedMinutes, 0, 0);

      const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);

      const formatTime = (date: Date) => date.toTimeString().slice(0, 5);
      // Format tanggal lokal YYYY-MM-DD agar cocok dengan <input type="date">
      const toDateInput = (date: Date) => {
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      };

      reset({
        startDate: toDateInput(now),
        endDate: toDateInput(now),
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        accessType: 'terbatas',
        title: '',
        description: '',
        type: '',
        meetingType: '',
      });
      setSelectedInvitees([]);
    }
  }, [isOpen, reset]);

  const watchedStartDate = useWatch({ control, name: 'startDate' });
  const onSubmit = async (data: EventFormData) => {
    setSubmitting(true);
    const payload = {
      ...data,
      invitees: selectedInvitees,
    };

    try {
      const response = await api.events.create(payload);
      toast.success('Event berhasil dibuat!');
      onEventCreated((response as any)?.event ?? (response as any)?.data?.event ?? null);
      handleClose();
    } catch (error: any) {
      toast.error('Gagal membuat event', {
        description: error.message || 'Terjadi kesalahan pada server.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    setSelectedInvitees([]);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]" hideCloseButton>
        <DialogHeader>
          <DialogTitle>Buat Event</DialogTitle>
        </DialogHeader>
        <button
          type="button"
          onClick={handleClose}
          className="absolute right-4 top-4 text-green-600 font-medium text-sm hover:text-green-700"
        >
          Batal
        </button>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[85vh] overflow-y-auto pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Event</Label>
              <Input id="title" {...register('title')} placeholder="Isi judul event" />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Event</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={typeOptions}
                    placeholder="Pilih tipe event"
                  />
                )}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="startDate"
                    value={field.value}
                    onValueChange={field.onChange}
                    minDate={new Date()}
                    maxDate={eventMaxDate}
                    placeholder="Pilih tanggal mulai"
                  />
                )}
              />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Waktu Mulai</Label>
              <Controller
                name="startTime"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    id="startTime"
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Pilih waktu mulai"
                  />
                )}
              />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    id="endDate"
                    value={field.value}
                    onValueChange={field.onChange}
                    minDate={
                      watchedStartDate ? parseISO(watchedStartDate) : new Date()
                    }
                    maxDate={eventMaxDate}
                    placeholder="Pilih tanggal selesai"
                  />
                )}
              />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Waktu Selesai</Label>
              <Controller
                name="endTime"
                control={control}
                render={({ field }) => (
                  <TimePicker
                    id="endTime"
                    value={field.value}
                    onValueChange={field.onChange}
                    placeholder="Pilih waktu selesai"
                  />
                )}
              />
              {errors.endTime && <p className="text-xs text-red-500">{errors.endTime.message}</p>}
            </div>
          </div>
          
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetingType">Jenis Meeting</Label>
              <Controller
                name="meetingType"
                control={control}
                render={({ field }) => (
                  <SearchSelect
                    value={field.value}
                    onValueChange={field.onChange}
                    options={meetingTypeOptions}
                    placeholder="Pilih jenis meeting"
                  />
                )}
              />
              {errors.meetingType && <p className="text-xs text-red-500">{errors.meetingType.message}</p>}
            </div>
            <div className="space-y-2">
              <Label>Jenis Undangan</Label>
              <Controller
                name="accessType"
                control={control}
                render={({ field }) => (
                  <RadioGroup
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    className="flex items-center space-x-4"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="terbatas" id="r1" />
                      <Label htmlFor="r1">Terbatas</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="umum" id="r2" />
                      <Label htmlFor="r2">Umum</Label>
                    </div>
                  </RadioGroup>
                )}
              />
              {errors.accessType && <p className="text-xs text-red-500">{errors.accessType.message}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={() => setInviteModalOpen(true)}>
              {selectedInvitees.length > 0
                ? `Undang Peserta (${selectedInvitees.length} dipilih)`
                : 'Undang Peserta'}
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea
              id="description"
              {...register('description')}
              placeholder="Tulis Deskripsi"
              className="min-h-[100px]"
            />
            {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
          </div>

          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Membuat...' : 'Buat Event'}
            </Button>
          </DialogFooter>
        </form>

        <InviteTeamDialog
          isOpen={isInviteModalOpen}
          onClose={() => setInviteModalOpen(false)}
          onSave={(userIds) => setSelectedInvitees(userIds)}
        />
      </DialogContent>
    </Dialog>
  );
}
