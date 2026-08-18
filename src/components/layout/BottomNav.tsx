import { Link, useLocation } from "react-router-dom";
import { memberNav } from "@/config/memberNav";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export function BottomNav() {
  const { user } = useAuth();
  const location = useLocation();
  const [poolLeadsCount, setPoolLeadsCount] = useState(0);

  // Ambil jumlah leads active yang belum di-pick-up (direfresh saat route berubah)
  useEffect(() => {
    if (!user) return;

    let cancelled = false;
    const fetchPoolLeadsCount = async () => {
      try {
        const data = await api.get("/api/member/metrics");
        if (!cancelled) {
          setPoolLeadsCount(data?.poolLeadsCount ?? 0);
        }
      } catch {
        if (!cancelled) setPoolLeadsCount(0);
      }
    };

    fetchPoolLeadsCount();
    return () => {
      cancelled = true;
    };
  }, [user, location.pathname]);

  if (!user) return null;

  // Show all nav items defined in the config
  const navItems = memberNav;

  return (
    <nav className="fixed bottom-0 inset-x-0 z-50 border-t bg-background/95 backdrop-blur-sm">
      <div className="grid h-16" style={{ gridTemplateColumns: `repeat(${navItems.length}, minmax(0, 1fr))` }}>
        {navItems.map(item => {
          const isDisabled = item.disabledFor?.includes(user.role);
          const isActive = location.pathname === item.href;
          const showBadge = item.label === 'Leads' && !isDisabled && poolLeadsCount > 0;

          const itemClasses = cn(
            "flex flex-col items-center justify-center gap-1 pt-2 pb-1 text-xs font-medium transition-colors",
            {
              "text-muted-foreground/50 cursor-not-allowed": isDisabled,
              "text-muted-foreground hover:text-primary": !isDisabled,
              "text-primary": !isDisabled && isActive,
            }
          );

          const renderIcon = () => (
            <span className="relative">
              <item.icon className="h-5 w-5" />
              {showBadge && (
                <span className="absolute -top-1.5 -right-2.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white">
                  {poolLeadsCount > 99 ? "99+" : poolLeadsCount}
                </span>
              )}
            </span>
          );

          if (isDisabled) {
            return (
              <div key={item.label} className={itemClasses}>
                {renderIcon()}
                <span>{item.label}</span>
              </div>
            );
          }

          return (
            <Link
              key={item.label}
              to={item.href}
              className={itemClasses}
            >
              {renderIcon()}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
