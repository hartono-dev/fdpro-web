import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/ui/DatePicker';
import { SearchSelect } from '@/components/ui/SearchSelect';
import { Textarea } from '@/components/ui/textarea';
import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { RadioGroup, RadioGroupItem } from '@/components/ui/RadioGroup';
import InviteTeamDialog from './InviteTeamDialog'; // Placeholder for the new dialog


const eventSchema = z.object({
  title: z.string().min(3, 'Judul minimal 3 karakter'),
  description: z.string().optional(),
  type: z.string().optional(),
  startDate: z.date(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu tidak valid (HH:MM)'),
  endDate: z.date(),
  endTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Format waktu tidak valid (HH:MM)'),
  meetingType: z.string().min(1, 'Jenis pertemuan harus dipilih'),
  location: z.string().optional(),
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

export default function CreateEventDialog({ isOpen, onClose, onEventCreated }: CreateEventDialogProps) {
  const [isSubmitting, setSubmitting] = useState(false);
  const [isInviteModalOpen, setInviteModalOpen] = useState(false);
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

      reset({
        startDate: now,
        endDate: now,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
        accessType: 'terbatas',
        title: '',
        description: '',
        type: '',
        meetingType: '',
        location: '',
      });
    }
  }, [isOpen, reset]);

  const meetingType = useWatch({ control, name: 'meetingType' });
  const onSubmit = async (data: EventFormData) => {
    setSubmitting(true);
    const payload = {
      ...data,
      location: data.meetingType === 'online' ? 'Online' : data.location,
    };

    try {
      const response = await api.events.create(payload);
      toast.success('Event berhasil dibuat!');
      onEventCreated(response.data.event);
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
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Buat Event</DialogTitle>
          <DialogDescription>
            Isi detail di bawah ini untuk membuat jadwal event atau kegiatan baru.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4 max-h-[85vh] overflow-y-auto pb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="title">Judul Event</Label>
              <Input id="title" {...register('title')} />
              {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="type">Tipe Event</Label>
              <Input id="type" {...register('type')} placeholder="cth: Pelatihan, Seminar" />
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Controller
                name="startDate"
                control={control}
                render={({ field }) => <DatePicker selected={field.value} onSelect={field.onChange} />}
              />
              {errors.startDate && <p className="text-xs text-red-500">{errors.startDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Waktu Mulai</Label>
              <Input id="startTime" type="text" inputMode="numeric" maxLength={5} placeholder="HH:MM" {...register('startTime')} />
              {errors.startTime && <p className="text-xs text-red-500">{errors.startTime.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">Tanggal Selesai</Label>
              <Controller
                name="endDate"
                control={control}
                render={({ field }) => <DatePicker selected={field.value} onSelect={field.onChange} />}
              />
              {errors.endDate && <p className="text-xs text-red-500">{errors.endDate.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">Waktu Selesai</Label>
              <Input id="endTime" type="text" inputMode="numeric" maxLength={5} placeholder="HH:MM" {...register('endTime')} />
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
                    placeholder="Pilih"
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

          <div className={cn("space-y-2", meetingType === 'online' && 'hidden')}>
            <Label htmlFor="location">Lokasi</Label>
            <Input id="location" {...register('location')} placeholder="Lokasi" />
            {errors.location && <p className="text-xs text-red-500">{errors.location.message}</p>}
          </div>

          <div className="space-y-2">
            <Button type="button" variant="outline" onClick={() => setInviteModalOpen(true)}>
              Undang Peserta
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
        />
      </DialogContent>
    </Dialog>
  );
}
