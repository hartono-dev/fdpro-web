import { LayoutDashboard, Users, FolderKanban, CalendarDays } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  roles: string[]; // Roles that can access this nav item
  disabledFor?: string[]; // Roles that see this nav item as disabled
};

export const memberNav: NavItem[] = [
  {
    href: '/member',
    label: 'Home',
    icon: LayoutDashboard,
    roles: ['calon_agen', 'fc', 'abp', 'bp', 'admin', 'super_admin'],
  },
  {
    href: '/member/leads',
    label: 'Leads',
    icon: FolderKanban,
    roles: ['fc', 'abp', 'bp', 'admin', 'super_admin', 'calon_agen'],
    // Calon Agen diizinkan **melihat & mengakses** halaman Leads (view read-only).
    // Tombol Pick Up tetap dikunci (disabled + tooltip) & backend menolak request pickup
    // — lihat LeadsDashboard.isCalonAgen + leadController.pickupLead guard.
  },
  {
    href: '/member/team',
    label: 'Team',
    icon: Users,
    roles: ['fc', 'abp', 'bp', 'admin', 'super_admin', 'calon_agen'],
    // Calon Agen boleh mengakses halaman Team namun hanya melihat tab "Team Anda"
    // (Approval, Riwayat, dan Update disembunyikan di TeamPage via canAccess*).
    disabledFor: [],
  },
  {
    href: '/member/event',
    label: 'Event',
    icon: CalendarDays,
    roles: ['fc', 'abp', 'bp', 'admin', 'super_admin', 'calon_agen'],
  },
];
