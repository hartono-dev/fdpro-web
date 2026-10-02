import * as React from 'react';
import { CalendarIcon, ChevronDown } from 'lucide-react';
import {
  endOfDay,
  format,
  isBefore,
  parseISO,
  startOfDay,
} from 'date-fns';
import { id as idLocale } from 'date-fns/locale';

import { cn } from '@/lib/utils';
import { DayPicker, useDayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/Popover';

interface DatePickerProps {
  /** Tanggal terpilih dalam format string `YYYY-MM-DD` (sama seperti nilai `<input type="date">`). */
  value?: string;
  /** Dipanggil saat user memilih tanggal di kalender (nilai `YYYY-MM-DD`). */
  onValueChange?: (value: string) => void;
  /** Alias kompatibel dari `onValueChange`. */
  onChange?: (value: string) => void;
  /** Teks panduan saat belum ada tanggal terpilih. */
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  /** Tanggal terawal yang boleh dipilih (sebelumnya akan di-disable). Api kanonik baru. */
  minDate?: Date;
  /** Tanggal terakhir yang boleh dipilih (sesudahnya akan di-disable). Api kanonik baru. */
  maxDate?: Date;
  /** Tanggal terawal yang boleh dipilih (alias kompatibel dari `minDate`). */
  fromDate?: Date;
  /** Tanggal terakhir yang boleh dipilih (alias kompatibel dari `maxDate`). */
  toDate?: Date;
  id?: string;
  /**
   * Saat `false`, kalender dirender INLINE di dalam DOM modal (bukan via React
   * Portal ke `<body>`). Dipakai fallback CSS Scroll & Padding: modal diberi
   * `padding-bottom` dinamis selagi kalender terbuka sehingga tombol "OKE"
   * selalu ter-scroll ke tampilan. Default `true` (portal — break-out dari
   * modal, paling aman). Hanya atur `false` bila kamu sengaja memakai
   * pendekatan scroll-modal.
   */
  portal?: boolean;
  /** Dipanggil setiap status buka/tutup popup kalender berubah (`open`). */
  onOpenChange?: (open: boolean) => void;
  /**
   * Tanggal yang menentukan BULAN/Tahun awal yang ditampilkan kalender saat
   * popup dibuka (default view). Saat `value` kosong, kalender membuka langsung
   * pada bulan/tahun tanggal ini — berguna mis. form "Tanggal Lahir" yang ingin
   * membuka kalender pada tanggal 17 tahun lalu (batas umur) agar user tidak
   * harus scroll jauh dari tahun sekarang. Tidak mengubah nilai yang dipilih;
   * hanya posisi awal tampilan kalender. (`defaultMonth` react-day-picker.)
   */
  defaultViewDate?: Date;
  /**
   * Saat `true`, popup kalender DIPAKSA membuka tepat di BAWAH kotak input
   * (side="bottom", align="start") dengan auto-flip/collision Radix Popper
   * DINONAKTIFKAN (`avoidCollisions=false` di `PopoverContent`). Cocok untuk
   * halaman penuh yang bisa di-scroll secara native (mis. form pendaftaran
   * `/register`): flip ke atas justru memotong header kalender, membuka ke
   * bawah aman karena `z-[9999]` membuat kalender menimpa field di bawahnya.
   * Default `false` → perilaku Radix asli (collision + flip) dipertahankan.
   */
  forceBottom?: boolean;
}

/**
 * Konteks batas tanggal yang "efektif" (setelah `minDate`/`maxDate` digabung
 * dengan alias `fromDate`/`toDate`). Dipakai oleh `MonthYearDropdown` agar
 * rentang tahun dan penguncian bulan mengikuti props yang diterima komponen —
 * bukan di-hardcode — sehingga komponen tetap aman/reusable antar form.
 */
const DatePickerBoundsContext = React.createContext<{
  minDate?: Date;
  maxDate?: Date;
}>({});

function useDatePickerBounds() {
  return React.useContext(DatePickerBoundsContext);
}

/**
 * Header caption bulan/tahun yang interaktif (dipasang sebagai
 * `components.CaptionLabel` pada DayPicker):
 * - Tombol "Agustus 2026 ▼" (ikon SVG ChevronDown) menjadi SATU-SATUNYA
 *   navigasi — tombol panah prev/next dihapus (`hideNavigation` pada RDP).
 * - Klik → dropdown MELAYANG (`position absolute`, `z-[60]`), TIDAK mendorong
 *   grid tanggal ke bawah; berisi kisi 12 bulan + daftar tahun scrollable
 *   (`max-h-60 overflow-y-auto overscroll-contain`) yang bisa di-scroll
 *   dengan roda mouse / trackpad.
 * - Rentang tahun DINAMIS mengikuti props, bukan hardcode:
 *     • tanpa `minDate`/`maxDate` → fallback 100 tahun
 *       ((Tahun Saat Ini − 90) s/d (Tahun Saat Ini + 10));
 *     • dengan `minDate`/`maxDate` → persis [minYear … maxYear]
 *       (form event: [Tahun Saat Ini] s/d [Tahun Saat Ini + 10]).
 *   Range di-clamp agar tahun aktif selalu ada di list.
 * - Bulan terkunci (Kondisi A): bila `minDate` di-set dan tahun yang tampil ==
 *   tahun minDate, bulan sebelum bulan minDate dinonaktifkan; bila tahun yang
 *   tampil lebih besar (Kondisi B) seluruh bulan kembali aktif.
 * - Auto-scroll tahun aktif ke tengah list saat dropdown dibuka
 *   (`scrollIntoView({ block: 'center' })` via `requestAnimationFrame`).
 * - Navigasi bulan/tahun memakai logika bawaan react-day-picker (`goToMonth`).
 */
function MonthYearDropdown(props: React.HTMLAttributes<HTMLSpanElement>) {
  const { className, role, 'aria-live': ariaLive } = props;

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const activeYearRef = React.useRef<HTMLButtonElement>(null);

  const { months, goToMonth } = useDayPicker();

  // Bulan yang sedang ditampilkan (komponen ini hanya menampilkan 1 bulan).
  const displayMonth = months[0]?.date ?? new Date();
  const currentYear = displayMonth.getFullYear();
  const currentMonth = displayMonth.getMonth();

  // ── Batas dari props (dinamis, bukan hardcode) ──────────────────────
  // Diperoleh dari DatePicker lewat context. `minDate`/`maxDate` menggantikan
  // alias `fromDate`/`toDate`. Ketiadaan keduanya (mis. form "Tanggal Lahir")
  // berarti kalender boleh menampilkan masa lalu → fallback rentang 100 tahun.
  const { minDate, maxDate } = useDatePickerBounds();
  const minDateYear = minDate ? minDate.getFullYear() : null;
  const minDateMonth = minDate ? minDate.getMonth() : null;
  const maxDateYear = maxDate ? maxDate.getFullYear() : null;
  const anchorYear = new Date().getFullYear();

  // ── Rentang tahun DINAMIS ───────────────────────────────────────────
  // Range dihitung semata-mata dari props:
  //   • Ada min & max        → [minYear … maxYear] (form event: now … now+10)
  //   • Hanya min            → [minYear … (anchor+10)] (arah masa depan)
  //   • Hanya max            → [(anchor−90) … maxYear] (arah masa lalu)
  //   • Tanpa keduanya       → fallback 100 tahun (anchor−90 … anchor+10)
  // Semua di-clamp ke `currentYear` agar tahun yang sedang tampil selalu
  // ada di list (mis. value awal di luar rentang standar).
  const minYear =
    minDateYear != null && maxDateYear != null
      ? Math.min(minDateYear, currentYear)
      : minDateYear != null
        ? Math.min(minDateYear, currentYear)
        : Math.min(anchorYear - 90, currentYear);
  const maxYear =
    minDateYear != null && maxDateYear != null
      ? Math.max(maxDateYear, currentYear)
      : maxDateYear != null
        ? Math.max(maxDateYear, currentYear)
        : Math.max(anchorYear + 10, currentYear);
  const years = React.useMemo(() => {
    const list: number[] = [];
    for (let year = maxYear; year >= minYear; year -= 1) list.push(year);
    return list;
  }, [minYear, maxYear]);

  // Bulan terkunci? (Kondisi A) — hanya berlaku bila `minDate` di-set dan
  // tahun yang sedang ditampilkan == tahun minDate: bulan sebelum minDate
  // dinonaktifkan. (Kondisi B) — tahun > minDateYear → semua bulan bebas.
  const isMonthDisabled = (year: number, month: number) =>
    !!minDate &&
    minDateYear != null &&
    minDateMonth != null &&
    year === minDateYear &&
    month < minDateMonth;

  // Tutup dropdown saat klik di luar area atau menekan Escape.
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const rootEl = rootRef.current;
      if (
        rootEl &&
        event.target instanceof Node &&
        !rootEl.contains(event.target)
      ) {
        setOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  // Auto-scroll tahun aktif ke tengah list ketika dropdown dibuka.
  // Dijalankan satu frame setelah layout dropdown selesai agar akurat,
  // apapun scroll-posisi list sebelumnya.
  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      activeYearRef.current?.scrollIntoView({ block: 'center' });
    });
    return () => cancelAnimationFrame(frame);
  }, [open]);

    const goTo = (year: number, month: number | null = null) => {
    // `month === null` artinya user memilih TAHUN saja — biarkan dropdown
    // (month/year picker) terbuka agar ia lanjut ke pilihan Bulan berikutnya.
    // `month !== null` artinya user memilih BULAN — tutup dropdown dan
    // tekankan DayPicker kembali ke grid Hari pada bulan/tahun yang dipilih.
    const requestedMonth = month ?? currentMonth;
    // Jika bulan yang diminta jatuh pada bulan terkunci (Kondisi A), geser ke
    // bulan pertama yang valid agar navigasi tidak "masuk dead-end" month.
    const resolvedMonth = isMonthDisabled(year, requestedMonth)
      ? (minDateMonth ?? requestedMonth)
      : requestedMonth;
    // Navigasi DayPicker → `months[0].date` berubah → `currentYear` di-refresh,
    // sehingga kisi Bulan otomatis menampilkan tahun yang baru dipilih.
    goToMonth(new Date(year, resolvedMonth, 1));
    // Penting: hanya tutup dropdown ini pada pemilihan BULAN. Pemilihan TAHUN
    // sengaja TIDAK menutup agar alur year -> month bersambungan. PopOver luar
    // (shadcn Popover, controlled `open={open}`) tidak pernah ditutup di sini —
    // ia hanya ditutup oleh tombol OKE/BATAL, klik di luar, atau ESC, sehingga
    // memilih tahun/bulan/tanggal TIDAK menutup kalendar secara keseluruhan.
    if (month !== null) setOpen(false);
  };

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
      role={role}
      aria-live={ariaLive}
    >
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={(event) => {
          event.preventDefault();
          setOpen((value) => !value);
        }}
        className="inline-flex h-7 items-center gap-1 rounded-md px-1.5 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500"
      >
        <span>{format(displayMonth, 'MMMM yyyy', { locale: idLocale })}</span>
        <ChevronDown
          aria-hidden
          strokeWidth={2.5}
          className={cn(
            'h-3.5 w-3.5 text-gray-500 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Pilih bulan dan tahun"
          className="absolute left-0 top-full z-[60] mt-1 flex w-64 gap-2 rounded-lg border border-gray-200 bg-white p-2 shadow-xl"
        >
          {/* ===== KISI BULAN ===== */}
          <div className="grid w-[104px] shrink-0 grid-cols-3 gap-1">
            {Array.from({ length: 12 }, (_, monthIndex) => {
              const monthDisabled = isMonthDisabled(currentYear, monthIndex);
              return (
                <button
                  key={monthIndex}
                  type="button"
                  disabled={monthDisabled}
                  aria-disabled={monthDisabled || undefined}
                  onClick={() => goTo(currentYear, monthIndex)}
                  className={cn(
                    'h-8 rounded-md text-xs font-medium text-gray-700 transition-colors hover:bg-teal-50',
                    monthDisabled &&
                      'cursor-not-allowed text-gray-300 opacity-50 hover:bg-transparent',
                    !monthDisabled &&
                      monthIndex === currentMonth &&
                      'bg-teal-50 font-bold text-teal-700'
                  )}
                >
                  {format(new Date(currentYear, monthIndex, 1), 'MMM', {
                    locale: idLocale,
                  })}
                </button>
              );
            })}
          </div>

          {/* ===== DAFTAR TAHUN (melayang + scrollable) =====
              Native scroll mulus: `overflow-y-auto` + `max-h-60` + `overscroll-contain`
              (cegah wheel "bocor" ke ancestor saat mentok) + `touch-pan-y`
              (izinkan gestur scroll vertikal native di perangkat sentuh).
              Handler onWheel & onTouchMove menghentikan propagasi event ke
              wrapper modal (Radix Dialog / react-remove-scroll) yang membajak
              event scroll — roda mouse, trackpad, dan jempol bisa scroll list. */}
          <div
            className="max-h-60 w-[120px] shrink-0 touch-pan-y overflow-y-auto overscroll-contain pr-0.5"
            onWheel={(event) => event.stopPropagation()}
            onTouchMove={(event) => event.stopPropagation()}
          >
            {years.map((year) => (
              <button
                key={year}
                ref={year === currentYear ? activeYearRef : undefined}
                type="button"
                onClick={() => goTo(year)}
                aria-current={year === currentYear ? 'date' : undefined}
                className={cn(
                  'block w-full rounded-md px-2 py-1.5 text-center text-sm text-gray-700 transition-colors hover:bg-gray-100',
                  year === currentYear &&
                    'bg-teal-600 font-semibold text-white hover:bg-teal-600 hover:text-white'
                )}
              >
                {year}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function DatePicker({
  value,
  onValueChange,
  onChange,
  placeholder = 'Pilih tanggal',
  className,
  disabled,
  minDate,
  maxDate,
  fromDate,
  toDate,
  id,
  portal = true,
  onOpenChange,
  defaultViewDate,
  forceBottom = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  // State pilihan sementara di dalam popover: tanggal baru benar-benar dikirim
  // ke form hanya ketika user menekan tombol "OKE" (BATAL membatalkan perubahan).
  const [draft, setDraft] = React.useState<Date | undefined>(
    value ? parseISO(value) : undefined
  );

  // Sinkronkan draft saat nilai dari luar berubah (mis. reset form).
  React.useEffect(() => {
    setDraft(value ? parseISO(value) : undefined);
  }, [value]);

  // ── Batas tanggal EFEKTIF ───────────────────────────────────────────
  // `minDate`/`maxDate` adalah API kanonik; `fromDate`/`toDate` dipertahankan
  // sebagai alias kompatibel. Digunakan baik untuk matcher grid (date hapus
  // masa lalu) maupun diteruskan ke context untuk rentang tahun/bulan dropdown.
  const effectiveMin = minDate ?? fromDate;
  const effectiveMax = maxDate ?? toDate;

  // Matcher disabled berbasis fungsi — membandingkan per-hari (startOfDay/
  // endOfDay) sehingga `minDate` hari ini tetap bisa dipilih, tanggal sebelum
  // hari itu dinonaktifkan. react-day-picker menerapkan atribut `disabled`
  // native pada tombol tanggal + guard `if (m.disabled) return` di
  // `handleDayClick`, sehingga klik tanggal masa lalu benar-benar mati.
  const disabledMatcher = (date: Date): boolean => {
    let disabled = false;
    if (effectiveMin) {
      disabled = disabled || isBefore(date, startOfDay(effectiveMin));
    }
    if (effectiveMax) {
      disabled = disabled || isBefore(endOfDay(effectiveMax), date);
    }
    return disabled;
  };

  // ── Sinkronisasi state buka/tutup ke luar (parent/modal) ──────────────
  // `open` adalah state internal komponen; `onOpenChange` (jika disediakan)
  // menginformasikan parent — mis. modal onboarding "Lisensi AAJI" — kapan
  // popup kalender terbuka/tutup, sehingga parent bisa memberi ruang (dynamic
  // padding) yang benar. Dijalankan SELALU saat `open` berubah, mencakup SEMUA
  // skenario penutupan: tombol OKE (handleConfirm), BATAL (handleCancel), klik
  // di luar popover, dan tombol ESC (Radix). Ini memastikan parent selalu di-
  // set ke `false` ketika kalender hilang dari DOM → modal menyusut kembali.
  React.useEffect(() => {
    onOpenChange?.(open);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleConfirm = () => {
    if (draft) {
      const iso = format(draft, 'yyyy-MM-dd');
      if (onChange) onChange(iso);
      if (onValueChange) onValueChange(iso);
    }
    setOpen(false);
  };

  const handleCancel = () => {
    // Kembalikan pilihan sementara ke nilai yang sudah dikirim ke form.
    setDraft(value ? parseISO(value) : undefined);
    setOpen(false);
  };

  return (
    <Popover
      open={open}
      // Kelola state internal saja; propagasi keluar ditangani `useEffect` di
      // atas agar sinkron untuk SEMUA jalur buka/tutup (OKE/BATAL/click-outside/
      // ESC), bukan hanya yang lewat callback trigger.
      onOpenChange={setOpen}
    >
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
              value ? 'text-gray-900' : 'text-gray-400'
            )}
          >
            {value
              ? format(parseISO(value), 'd MMM yyyy', { locale: idLocale })
              : placeholder}
          </span>
          <CalendarIcon className="h-4 w-4 shrink-0 text-gray-400" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        portal={portal}
        forceBottom={forceBottom}
        side="bottom"
        className="w-[280px] overflow-hidden rounded-xl border border-gray-200 bg-white p-0 shadow-xl"
        align="start"
      >
        {/* ===== HEADER TEAL — PILIH TANGGAL ===== */}
        <div className="bg-teal-600 px-4 pb-3 pt-3 text-white">
          <p className="text-[10px] font-semibold uppercase tracking-widest">
            Pilih Tanggal
          </p>
          <p className="mt-0.5 text-xl font-bold leading-tight">
            {draft
              ? format(draft, 'dd MMMM yyyy', { locale: idLocale })
              : 'Pilih tanggal'}
          </p>
        </div>

        {/* ===== KALENDER (react-day-picker, UI-only override) =====
            Containing div dibuat `relative z-0 pointer-events-auto` agar
            grid tanggal berada dalam stacking-context sendiri dan tidak
            pernah terkena overlay transparan / `pointer-events: none`
            (penyebab umum angka tanggal "mati" saat diklik). */}
        <DatePickerBoundsContext.Provider value={{ minDate, maxDate }}>
          <div className="relative z-0 pointer-events-auto px-3 pb-2 pt-1.5">
            <DayPicker
              mode="single"
              selected={draft}
              onSelect={(date) => setDraft(date)}
              disabled={disabledMatcher}
              showOutsideDays
              locale={idLocale}
              weekStartsOn={0}
              navLayout="after"
              hideNavigation
              // Bulan/tahun awal tampilan kalender: jika sudah ada pilihan gunakan
              // bulan pilihan; jika KOSONG (mis. form "Tanggal Lahir" ber-state
              // kosong) gunakan `defaultViewDate` agar kalender membuka langsung
              // pada bulan/tahun 17 tahun lalu — user tidak perlu scroll jauh dari
              // tahun sekarang. (`defaultMonth` = uncontrolled, dipakai saat mount.)
              defaultMonth={draft ?? defaultViewDate}
              className="p-0"
              classNames={{
                months: 'space-y-0',
                month: 'space-y-0',
                month_caption: 'flex items-center justify-start',
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday:
                  'w-9 h-8 text-[11px] font-semibold uppercase text-gray-400 flex items-center justify-center',
                week: 'flex w-full',
                day: 'w-9 h-10 p-0 text-center relative z-0',
                day_button:
                  'h-9 w-9 cursor-pointer flex items-center justify-center rounded-full text-sm text-gray-700 hover:bg-gray-100 transition-colors',
                selected:
                  'bg-teal-600 text-white hover:bg-teal-600 hover:text-white font-semibold',
                today: 'text-teal-700 font-bold',
                // Tanggal dari bulan sebelumnya / berikutnya (outside days / padding)
                // disembunyikan namun tetap dirender agar grid tanggal tidak bergeser
                // / rusak. `invisible` (= visibility:hidden) menyembunyikan isi sel
                // (nomor & button) sekaligus mematikan efek hover, sementara elemen
                // <td> tetap mengambil ruang (w-9 h-10) sehingga susunan Senin–Minggu
                // tetap proporsional dan tanggal 1 bulan aktif jatuh pada kolom yang
                // tepat.
                outside: 'invisible',
                // Tanggal masa lalu (di bawah minDate) / di luar maxDate: abu-abu,
                // `opacity-50` + `cursor-not-allowed`; klik-nya sudah dimatikan
                // react-day-picker (atribut `disabled` native + guard di
                // handleDayClick → `if (m.disabled) return`).
                disabled:
                  'text-gray-300 opacity-50 cursor-not-allowed hover:bg-transparent',
                hidden: 'invisible',
              }}
              components={{
                CaptionLabel: MonthYearDropdown,
              }}
            />
          </div>
        </DatePickerBoundsContext.Provider>

        {/* ===== FOOTER — BATAL / OKE ===== */}
        <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-4 py-2.5">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            BATAL
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="text-sm font-semibold text-teal-600 hover:text-teal-700 transition-colors"
          >
            OKE
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

