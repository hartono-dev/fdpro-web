import { LayoutDashboard, Users, UserPlus, ScrollText, Settings } from 'lucide-react';

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<any>;
  /** Jika true, menu hanya ditampilkan untuk user dengan role super_admin */
  superOnly?: boolean;
};

export const adminNav: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: LayoutDashboard,
  },
  {
    href: '/admin/users',
    label: 'Manajemen Pengguna',
    icon: Users,
  },
  {
    href: '/admin/settings',
    label: 'Pengaturan Sistem',
    icon: Settings,
  },
  {
    href: '/admin/create-admin',
    label: 'Tambah Admin',
    icon: UserPlus,
    superOnly: true,
  },
  {
    href: '/admin/audit-logs',
    label: 'Audit Logs',
    icon: ScrollText,
    superOnly: true,
  },
];
