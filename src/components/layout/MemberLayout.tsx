import { Outlet, Link } from "react-router-dom";
// import { Sidebar } from "./Sidebar"; // Sidebar tidak digunakan
import { BottomNav } from "./BottomNav";
import { NotificationBell } from "../NotificationBell";
import ProfileMenu from "@/components/ProfileMenu";

export function MemberLayout() {
  
  return (
    <div className="flex flex-col min-h-screen"> {/* Hapus grid layout agar BottomNav bisa di bawah */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-4 border-b bg-white px-4 lg:h-[60px] lg:px-6"> {/* sticky header */}
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
      <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6 bg-muted pb-28 md:pb-28"> {/* pb-28 memberi ruang napas di atas BottomNav (h-16=64px) agar task terbawah tidak terpotong pada semua breakpoint */}
        <Outlet />
      </main>
      <BottomNav /> {/* BottomNav sudah diubah agar tampil di semua ukuran */}
    </div>
  );
}
