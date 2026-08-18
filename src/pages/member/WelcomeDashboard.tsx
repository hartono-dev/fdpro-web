import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { useAuth } from "@/contexts/AuthContext";

const WelcomeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if(user && user.role !== 'calon_agen') {
      navigate('/member/omzet', { replace: true });
    }
  }, [user, navigate]);

  if (user?.role !== 'calon_agen') {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h1 className="text-2xl font-bold">
            Selamat datang, {user?.name}!
          </h1>
          <p className="text-muted-foreground">
            Lengkapi tugas di bawah ini untuk mengaktifkan semua fitur agen.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Role</p>
              <p className="font-medium uppercase">{user?.role}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Status</p>
              <span className="font-medium capitalize px-2 py-1 bg-yellow-100 text-yellow-800 rounded text-sm">
                {user?.status?.replace('_', ' ') || 'Pending'}
              </span>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Kode FDPro</p>
              <p className="font-mono text-sm">{user?.fdCode || 'Belum Ditentukan'}</p>
            </div>
          </div>
        </CardContent>
      </Card>
      {/* The CalonAgentDashboard is now part of the OmzetPage, but we can have a simplified version here if needed */}
    </div>
  );
};

export default WelcomeDashboard;
