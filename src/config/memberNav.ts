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
    disabledFor: ['calon_agen'],
  },
  {
    href: '/member/team',
    label: 'Team',
    icon: Users,
    roles: ['fc', 'abp', 'bp', 'admin', 'super_admin', 'calon_agen'],
    disabledFor: ['calon_agen'],
  },
  {
    href: '/member/event',
    label: 'Event',
    icon: CalendarDays,
    roles: ['fc', 'abp', 'bp', 'admin', 'super_admin', 'calon_agen'],
  },
];
