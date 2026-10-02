import { Outlet, Link } from "react-router-dom";
// import { Sidebar } from "./Sidebar"; // Sidebar tidak digunakan
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "../NotificationBell";
import ProfileMenu from "@/components/ProfileMenu";

export function MemberLayout() {
  
  return (
    <div className="flex h-[100dvh] flex-col overflow-hidden"> {/* h-[100dvh] = dynamic viewport height (aman di iOS Safari); overflow-hidden supaya scroll terjadi di dalam <main>, bukan di body */}
      <header className="flex h-14 shrink-0 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6"> {/* shrink-0: header menetap di atas, main yang scroll di bawahnya */}
        <div className="flex items-center gap-2 font-semibold md:hidden">
          <Link to="/member">
            <img src="/FDPro_logo_Landscape.svg" alt="FDPro" className="h-7 w-auto" />
          </Link>
        </div>
        <div className="w-full flex-1 md:flex-row md:justify-start">
          <Link to="/member" className="hidden md:flex items-center gap-2 font-semibold">
            <img src="/FDPro_logo_Landscape.svg" alt="FDPro" className="h-8 w-auto" />
          </Link>
        </div>
        
        <div className="flex items-center gap-4">
          <NotificationBell />
          <ProfileMenu />
        </div>
      </header>
      {/* main = satu-satunya area scrollable (overflow-y-auto + min-h-0 agar bisa
          menyusut di flex column). padding-bottom (pb-28 = 112px) > tinggi BottomNav
          (h-16 = 64px) sehingga item paling bawah bisa discroll penuh melewati nav
          tanpa terpotong/tertutup — diterapkan global untuk semua halaman member. */}
      <main className="flex flex-1 flex-col gap-4 overflow-y-auto bg-muted p-4 pb-28 md:pb-28 lg:gap-6 lg:p-6 lg:pb-28 min-h-0">
        <Outlet />
      </main>
      <BottomNav /> {/* BottomNav sudah diubah agar tampil di semua ukuran */}
    </div>
  );
}
