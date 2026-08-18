import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { ProfileInfoCard } from "@/components/member/profile/ProfileInfoCard";
import { ProfileFormCard } from "@/components/member/profile/ProfileFormCard";

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  // Panggil hanya SEKALI saat mount. Jangan menjadikan `user`/`updateUser` sebagai
  // dependency karena `fetchProfile` memanggil `updateUser(data)` yang membuat referensi
  // `user` baru -> effect terpicu ulang -> infinite loop pemanggilan API.
  useEffect(() => {
    let cancelled = false;
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await api.get('/api/users/me');
        if (cancelled) return;
        setProfileData(data);
        updateUser(data);
      } catch (err: any) {
        console.error("Failed to fetch profile:", err);
        if (!cancelled) setProfileData(user);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchProfile();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateProfile = async (formData: any) => {
    try {
      const updatedUser = await api.post('/api/users/me', formData);
      updateUser(updatedUser);
      setProfileData(updatedUser);
      alert('Profil berhasil diperbarui!');
    } catch (err: any) {
      alert(`Gagal memperbarui profil: ${err.message}`);
      throw err;
    }
  };

  if (loading && !profileData) {
    return <div className="flex items-center justify-center min-h-[400px]">Memuat profil...</div>;
  }

  const displayData = profileData || user;

  return (
    <div className="container mx-auto py-6 px-4 pb-28 space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Info Summary */}
        <div>
          <ProfileInfoCard 
            user={{
              fdCode: displayData?.fdCode,
              name: displayData?.name,
              role: displayData?.role,
              sequisCode: displayData?.sequisAgentCode,
              aajiCode: displayData?.aajiCode,
              aajiExpiry: displayData?.aajiExpiredDate,
              uplineName: displayData?.upline?.name || displayData?.uplineName || "—",
              policyNumber: displayData?.policyNumber,
              premium: displayData?.premium,
              premiumDueDate: displayData?.premiumDueDate,
            }} 
          />
        </div>

        {/* Right Column: Editable Form */}
        <div>
          <ProfileFormCard 
            user={{
              name: displayData?.name,
              phone: displayData?.phone,
              email: displayData?.email,
              nik: displayData?.nik,
              dob: displayData?.dob || displayData?.birthDate,
              address: displayData?.address,
            }}
            onUpdate={handleUpdateProfile}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
