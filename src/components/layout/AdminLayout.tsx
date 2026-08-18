import { NavLink, Outlet } from 'react-router-dom';
import { adminNav } from '@/config/adminNav';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { ProfileMenu } from '@/components/ProfileMenu';

export function AdminLayout() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen w-full bg-gray-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r">
        <div className="p-4 border-b">
          <img src="/FDPro_logo_Landscape.svg" alt="FDPro Admin" className="h-10 mx-auto" />
        </div>
        <nav className="flex-grow p-4 space-y-2">
          {adminNav
            .filter((item) => !item.superOnly || user?.role === 'super_admin')
            .map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              end={item.href === '/admin'}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-gray-900',
                  isActive && 'bg-gray-100 font-semibold text-gray-900'
                )
              }
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex flex-col flex-1">
        <header className="flex h-14 items-center justify-between gap-4 border-b bg-white px-6">
          <h1 className="text-lg font-semibold text-gray-800">Admin Panel</h1>
          <div>
            {user && <ProfileMenu />}
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
