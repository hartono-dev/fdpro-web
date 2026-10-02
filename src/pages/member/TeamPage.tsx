import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ApprovalsDashboard } from '@/components/member/ApprovalsDashboard';
import { ApprovalHistoryTab } from '@/components/member/ApprovalHistoryTab';
import TeamTreeViewer from '@/components/member/TeamTreeViewer';
import { OnboardingUpdateTab } from '@/components/member/OnboardingUpdateTab';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

const TeamPage = () => {
  const { user } = useAuth();
  const [approvalCount, setApprovalCount] = useState(0);
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    const fetchCounts = async () => {
      try {
        // 1. Hitung Approval Pending
        if (['fc', 'abp', 'bp', 'admin', 'super_admin'].includes(user.role)) {
          const pendingApprovals = await api.get('/api/approvals/pending');
          setApprovalCount(pendingApprovals.length || 0);
        }

        // 2. Hitung Onboarding Update (Progress < 4)
        if (['fc', 'abp', 'bp', 'admin', 'super_admin'].includes(user.role)) {
          const onboardingList = await api.get('/api/users/onboarding-list');
          const pendingOnboarding = onboardingList.filter((agent: any) => {
            const tasks = [agent.task_polis, agent.task_kode, agent.task_pelatihan, agent.task_aaji];
            const completedCount = tasks.filter(Boolean).length;
            return completedCount < 4;
          });
          setUpdateCount(pendingOnboarding.length || 0);
        }
      } catch (error) {
        console.error('Error fetching tab counts:', error);
      }
    };

    fetchCounts();
  }, [user]);

  if (!user) return null;

  // Determine which tabs are accessible based on role
  const canAccessApproval = ['fc', 'abp', 'bp', 'admin', 'super_admin'].includes(user.role);
  const canAccessUpdate = ['fc', 'abp', 'bp', 'admin', 'super_admin'].includes(user.role);
  const canAccessStruktur = ['fc', 'abp', 'bp', 'admin', 'super_admin', 'calon_agen'].includes(user.role);

  // Default to first accessible tab
  const getDefaultTab = () => {
    if (canAccessApproval) return 'approval';
    if (canAccessUpdate) return 'update';
    return 'struktur';
  };

  // Jumlah tab yang benar-benar tampil untuk user saat ini — dipakai untuk
  // grid dinamis agar tab (mis. hanya "Team Anda" untuk calon agen) tidak
  // meninggalkan kolom kosong di TabsList. Menggunakan literal class per jumlah
  // agar Tailwind JIT tetap mendeteksi kelas yang dihasilkan.
  const visibleTabCount =
    (canAccessApproval ? 2 : 0) + // approval + riwayat
    (canAccessUpdate ? 1 : 0) +   // update
    (canAccessStruktur ? 1 : 0);  // struktur (Team Anda)
  const gridColsClass =
    visibleTabCount === 1 ? 'grid-cols-1'
    : visibleTabCount === 2 ? 'grid-cols-2'
    : visibleTabCount === 3 ? 'grid-cols-3'
    : visibleTabCount === 4 ? 'grid-cols-4'
    : 'grid-cols-4';

  const Badge = ({ count }: { count: number }) => {
    if (count <= 0) return null;
    return (
      <span className="ml-2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] flex items-center justify-center rounded-full px-1">
        {count > 99 ? '99+' : count}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002D62]">Team</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola approval, onboarding calon agen, dan struktur jaringan tim</p>
        </div>
      </div>

      <Tabs defaultValue={getDefaultTab()} className="w-full">
        <TabsList className={`grid w-full ${gridColsClass}`}>
          {canAccessApproval && (
            <TabsTrigger value="approval" className="flex items-center justify-center">
              <span>Approval</span>
              <Badge count={approvalCount} />
            </TabsTrigger>
          )}
          {canAccessApproval && (
            <TabsTrigger value="history">Riwayat</TabsTrigger>
          )}
          {canAccessUpdate && (
            <TabsTrigger value="update" className="flex items-center justify-center">
              <span>Update</span>
              <Badge count={updateCount} />
            </TabsTrigger>
          )}
          {canAccessStruktur && (
            <TabsTrigger value="struktur">Team Anda</TabsTrigger>
          )}
        </TabsList>

        {canAccessApproval && (
          <TabsContent value="approval">
            <ApprovalsDashboard />
          </TabsContent>
        )}

        {canAccessApproval && (
          <TabsContent value="history">
            <ApprovalHistoryTab />
          </TabsContent>
        )}

        {canAccessUpdate && (
          <TabsContent value="update" className="min-h-0">
            <OnboardingUpdateTab />
          </TabsContent>
        )}

        {canAccessStruktur && (
          <TabsContent value="struktur">
            <TeamTreeViewer userId={user.id} role={user.role} />
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default TeamPage;
