import CalonAgentDashboard from "@/components/member/CalonAgentDashboard";
import AgentDashboard from "@/components/member/AgentDashboard";
import { useAuth } from "@/contexts/AuthContext";

const OmzetPage = () => {
  const { user } = useAuth();

  if (!user) return null;

  if (user.role === 'calon_agen') {
    return <CalonAgentDashboard />;
  }

  if (['fc', 'abp', 'bp', 'admin', 'super_admin'].includes(user.role)) {
    return <AgentDashboard />;
  }

  return <div>Role tidak dikenal.</div>;
};

export default OmzetPage;
