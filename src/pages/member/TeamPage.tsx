import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { ApprovalsDashboard } from '@/components/member/ApprovalsDashboard';
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
        <TabsList className="grid w-full grid-cols-3">
          {canAccessApproval && (
            <TabsTrigger value="approval" className="flex items-center justify-center">
              <span>Approval</span>
              <Badge count={approvalCount} />
            </TabsTrigger>
          )}
          {canAccessUpdate && (
            <TabsTrigger value="update" className="flex items-center justify-center">
              <span>Update</span>
              <Badge count={updateCount} />
            </TabsTrigger>
          )}
          {canAccessStruktur && (
            <TabsTrigger value="struktur">Struktur</TabsTrigger>
          )}
        </TabsList>

        {canAccessApproval && (
          <TabsContent value="approval">
            <ApprovalsDashboard />
          </TabsContent>
        )}

        {canAccessUpdate && (
          <TabsContent value="update">
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
