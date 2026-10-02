import * as React from 'react';
import { Clock } from 'lucide-react';

import { cn } from '@/lib/utils';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

interface TimePickerProps {
  /** Waktu terpilih dalam format string "HH:mm" (24-jam). */
  value?: string;
  onValueChange?: (value: string) => void;
  /** Alias kompatibel dari `onValueChange`. */
  onChange?: (value: string) => void;
  /** Teks panduan saat belum ada waktu terpilih. */
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function TimePicker({
  value,
  onValueChange,
  onChange,
  placeholder = 'Pilih waktu',
  className,
  disabled,
  id,
}: TimePickerProps) {
  const [open, setOpen] = React.useState(false);

  // State lokal untuk pre-selection visual di dalam popover.
  const [hour, setHour] = React.useState<number>(() => {
    if (!value) return 0;
    const h = parseInt(value.split(':')[0], 10);
    return Number.isNaN(h) ? 0 : h;
  });
  const [minute, setMinute] = React.useState<number>(() => {
    if (!value) return 0;
    const m = parseInt(value.split(':')[1], 10);
    return Number.isNaN(m) ? 0 : m;
  });

  // Sinkronkan state lokal bila nilai dari luar berubah (mis. reset form).
  React.useEffect(() => {
    if (!value) return;
    const [hStr, mStr] = value.split(':');
    const h = parseInt(hStr, 10);
    const m = parseInt(mStr, 10);
    if (!Number.isNaN(h)) setHour(h);
    if (!Number.isNaN(m)) setMinute(m);
  }, [value]);

  // Ref untuk auto-scroll ke posisi waktu yang sedang dipilih saat popover dibuka.
  const selectedHourRef = React.useRef<HTMLButtonElement | null>(null);
  const selectedMinuteRef = React.useRef<HTMLButtonElement | null>(null);
  React.useEffect(() => {
    if (open) {
      // Tunggu popover render lengkap sebelum scroll.
      const id = window.requestAnimationFrame(() => {
        selectedHourRef.current?.scrollIntoView({ block: 'center' });
        selectedMinuteRef.current?.scrollIntoView({ block: 'center' });
      });
      return () => window.cancelAnimationFrame(id);
    }
  }, [open]);

  const emit = (h: number, m: number) => {
    const iso = `${pad(h)}:${pad(m)}`;
    if (onChange) onChange(iso);
    if (onValueChange) onValueChange(iso);
  };

  const handleHour = (h: number) => {
    setHour(h);
    emit(h, minute);
  };

  const handleMinute = (m: number) => {
    setMinute(m);
    emit(hour, m);
  };

  const hours = React.useMemo(() => Array.from({ length: 24 }, (_, i) => i), []);
  const minutes = React.useMemo(() => Array.from({ length: 60 }, (_, i) => i), []);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          id={id}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="dialog"
          disabled={disabled}
          className={cn(
            'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm font-normal text-left shadow-none transition-colors hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
            className
          )}
        >
          <span
            className={cn(
              'flex-1 truncate',
              value ? 'text-gray-900' : 'text-muted-foreground'
            )}
          >
            {value ? value : placeholder}
          </span>
          <Clock className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex flex-col">
          <div className="border-b px-3 py-2 text-center text-sm font-medium">
            {pad(hour)}:{pad(minute)} <span className="text-xs font-normal text-muted-foreground">24-jam</span>
          </div>
          <div className="flex">
            {/* Kolom Jam: daftar scrollable 0–23. Wheel/trackpad & gestur sentuh
                tidak boleh diserap oleh body scroll-lock modal (Radix Dialog /
                react-remove-scroll) — pola sama dengan DatePicker tahun-list:
                `touch-pan-y` (izinkan native pan-Y), `overscroll-contain`,
                serta `onWheel`/`onTouchMove` stopPropagation agar event tidak
                turun ke induk scroll-lock yang me-block. */}
            <div
              className="max-h-[200px] w-16 touch-pan-y overflow-y-auto overscroll-contain border-r p-1"
              role="listbox"
              aria-label="Jam"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {hours.map((h) => (
                <button
                  key={h}
                  type="button"
                  ref={h === hour ? selectedHourRef : undefined}
                  onClick={() => handleHour(h)}
                  aria-selected={h === hour}
                  className={cn(
                    'w-full rounded px-2 py-1 text-sm transition-colors',
                    h === hour
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent'
                  )}
                >
                  {pad(h)}
                </button>
              ))}
            </div>
            {/* Kolom Menit: sama seperti Jam — scroll native berhasil meski
                berada di dalam modal dengan body scroll-lock aktif. */}
            <div
              className="max-h-[200px] w-16 touch-pan-y overflow-y-auto overscroll-contain p-1"
              role="listbox"
              aria-label="Menit"
              onWheel={(event) => event.stopPropagation()}
              onTouchMove={(event) => event.stopPropagation()}
            >
              {minutes.map((m) => (
                <button
                  key={m}
                  type="button"
                  ref={m === minute ? selectedMinuteRef : undefined}
                  onClick={() => handleMinute(m)}
                  aria-selected={m === minute}
                  className={cn(
                    'w-full rounded px-2 py-1 text-sm transition-colors',
                    m === minute
                      ? 'bg-primary text-primary-foreground font-medium'
                      : 'hover:bg-accent'
                  )}
                >
                  {pad(m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
