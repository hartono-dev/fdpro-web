import CalonAgentDashboard from "@/components/member/CalonAgentDashboard";
import AgentDashboard from "@/components/member/AgentDashboard";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";

const HomePage = () => {
  const { user } = useAuth();

  if (!user) {
    // This should technically be handled by ProtectedRoute, but as a fallback
    return <Navigate to="/member" replace />;
  }

  if (user.role === 'calon_agen') {
    return <CalonAgentDashboard />;
  }

  if (['fc', 'abp', 'bp', 'admin', 'super_admin'].includes(user.role)) {
    return <AgentDashboard />;
  }

  // Fallback for any unknown roles
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, {user.name}</h1>
      <p>Your role ({user.role}) does not have a specific dashboard yet.</p>
    </div>
  );
};

export default HomePage;