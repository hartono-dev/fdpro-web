import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

type PopoverContentProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
> & {
  /**
   * Saat `true` (default), konten popover dirender via React Portal langsung ke
   * `<body>` — keluar dari DOM modal sehingga `overflow: hidden`/`overflow-y-auto`
   * modal tidak pernah me-clip popup.
   *
   * Saat `false`, konten dirender INLINE di tempat pemakaian (di dalam DOM modal)
   * — diperlukan oleh pendekatan CSS Scroll & Padding (fallback fix): popup ikut
   * ter-scroll bersama isi modal, dan modal diberi `padding-bottom` ekstra agar
   * tombol "OKE" di footer kalender selalu terjangkau.
   */
  portal?: boolean;
  /**
   * Saat `true`, popup DIPAKSA membuka tepat di BAWAH trigger (side="bottom",
   * align="start") DAN auto-flip/collision detection Radix Popper DINONAKTIFKAN
   * (`avoidCollisions={false}`). Cocok untuk pemakaian pada HALAMAN PENUH yang
   * bisa di-scroll secara native (mis. form pendaftaran `/register`): di sana
   * flip ke atas justru menimbulkan bug clipping header kalender, sementara
   * membuka ke bawah akan menimpa field form di bawahnya — aman karena z-index
   * `z-[9999]` memastikan kalender selalu tampil paling atas.
   *
   * Default `false` → perilaku Radix asli (collision + flip) tetap dipertahankan,
   * dibutuhkan mis. oleh kalender di dalam modal (Lihat `OnboardingTaskModal`).
   */
  forceBottom?: boolean;
};

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 4, side = 'bottom', portal = true, forceBottom = false, ...props }, ref) => {
  // Collision detection & flip (Radix Popper) AKTIF secara eksplisit — kecuali
  // ketika `forceBottom` di-set true:
  // • `avoidCollisions` → begitu ruang di bawah trigger tak cukup menampung
  //   tinggi kalender, Radix otomatis membalik (`side`) ke ATAS trigger. Saat
  //   `forceBottom` true, nilai ini di-set `false` sehingga flip sama sekali
  //   dinonaktifkan & kalender selalu membuka di BAWAH trigger.
  // • `collisionPadding` → menyisakan jarak aman ke tepi viewport (atas/bawah/
  //   kiri/kanan) agar kalender tidak menempel persis di tepi layar.
  // • `sticky="always"` → begitu flip terjadi, kalender TETAP pada sisi tersebut.
  // • `collisionBoundary` default = viewport sebagai kontainer terluar.
  const content = (
    <PopoverPrimitive.Content
      ref={ref}
      align={forceBottom ? 'start' : align}
      side={side}
      sideOffset={sideOffset}
      avoidCollisions={!forceBottom}
      collisionPadding={12}
      sticky="always"
      className={cn(
        'z-[9999] w-72 rounded-md border border-gray-200 bg-white p-4 text-gray-900 opacity-100 shadow-2xl outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        className
      )}
      {...props}
    />
  );

  // Mode portal: break-out ke <body> (tidak ter-clip oleh modal).
  // Mode non-portal: inline di dalam DOM — dipakai fallback CSS Scroll & Padding.
  return portal ? <PopoverPrimitive.Portal>{content}</PopoverPrimitive.Portal> : content;
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
