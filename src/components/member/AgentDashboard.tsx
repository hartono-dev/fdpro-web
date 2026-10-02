import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Progress } from '@/components/ui/Progress';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Wallet, Users, ChevronRight, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { isAajiExpiryUrgent } from '@/lib/profileUtils';

interface GenerationData {
  total_rekrut: number;
  belum_terlisensi: number;
}

const AgentDashboard = () => {
  const { user } = useAuth();
  const { targetFyap, targetActiveAgent, loading: settingsLoading } = useSettings();
  const [showMoreGenerations, setShowMoreGenerations] = useState(false);
  const [fyapPercentage, setFyapPercentage] = useState(0);
  const [aaPercentage, setAaPercentage] = useState(0);
  const [fyapAchievement, setFyapAchievement] = useState(0);
  const [activeAgentCount, setActiveAgentCount] = useState(0);
  const [aajiExpiry, setAajiExpiry] = useState<string | null>(null);
  const [teamGenerations, setTeamGenerations] = useState<GenerationData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const currentYear = new Date().getFullYear();


  const fetchDashboard = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get('/api/member/metrics');
      
      setFyapPercentage(data.fyapPercentage || 0);
      setAaPercentage(data.aaPercentage || 0);
      setFyapAchievement(data.fyapAchievement || 0);
      setActiveAgentCount(data.activeAgentCount || 0);
      setAajiExpiry(data.aajiExpiry || null);
      
      if (data.teamGenerations && Array.isArray(data.teamGenerations)) {
        setTeamGenerations(data.teamGenerations);
      } else {
        setTeamGenerations(Array(10).fill({ total_rekrut: 0, belum_terlisensi: 0 }));
      }
    } catch (err) {
      console.error('Failed to fetch agent dashboard:', err);
      setError('Gagal memuat data dashboard. Menampilkan data terakhir/kosong.');
      setTeamGenerations(Array(10).fill({ total_rekrut: 0, belum_terlisensi: 0 }));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '--';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '--';
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getPowerOf5Target = (genLevel: number) => Math.pow(5, genLevel);
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);
  const formatRupiah = (num: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);

  const totalRekrut = teamGenerations.reduce((sum, gen) => sum + gen.total_rekrut, 0);
  const totalBelumTerlisensi = teamGenerations.reduce((sum, gen) => sum + gen.belum_terlisensi, 0);

  // ── CALON AGEN: tidak memiliki target Builder Path ──────────────────
  // Meskipun routing umumnya sudah mengarahkan calon_agen ke
  // CalonAgentDashboard, guard ini memastikan jika komponen ini dipanggil
  // langsung untuk role calon_agen, kartu Builder Path tetap tersembunyi
  // dan empty-state ditampilkan.
  const isCalonAgen = user?.role?.toLowerCase() === 'calon_agen';

  if (isLoading || settingsLoading) {
    return (
      <div className="w-full px-4 md:px-8 lg:px-12 space-y-6 pb-20 animate-pulse">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between py-4">
            <div className="space-y-2">
              <div className="h-8 w-48 bg-gray-200 rounded"></div>
              <div className="h-4 w-32 bg-gray-100 rounded"></div>
            </div>
          </div>
          <div className="h-48 bg-gray-100 rounded-xl mb-6"></div>
          <div className="space-y-4">
            <div className="h-6 w-32 bg-gray-200 rounded"></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="h-16 bg-gray-100 rounded"></div>
              <div className="h-16 bg-gray-100 rounded"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-50 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── CALON AGEN: tampilkan empty-state ────────────────────────────────
  if (isCalonAgen) {
    return (
      <div className="w-full px-4 md:px-8 lg:px-12 space-y-6 pb-20">
        <div className="max-w-3xl mx-auto flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-[#002D62]">{user?.name}</h1>
            <p className="text-xs text-gray-500">
              Lisensi berlaku hingga:{' '}
              <span className="font-semibold text-gray-700">
                {formatDate(aajiExpiry)}
              </span>
            </p>
          </div>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          <Card className="bg-white border-0 shadow-sm">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center py-10">
              <AlertCircle className="h-10 w-10 text-gray-300 mb-3" />
              <h2 className="text-lg font-bold text-gray-600">Builder Path</h2>
              <p className="text-sm text-gray-400 mt-2 max-w-xs">
                Target Builder Path belum tersedia untuk Calon Agen.
                Selesaikan onboarding untuk mulai melacak pencapaian.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Generasi tetap tampil untuk calon agen */}
        <div className="max-w-3xl mx-auto space-y-4 pt-2">
          <div className="pb-2">
            <h2 className="text-lg font-bold text-[#002D62] mb-2">Generasi Anda</h2>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-sm text-gray-500">Total Rekrut</p>
                <p className="text-xl font-bold text-[#002D62]">{formatNumber(totalRekrut)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Belum Terlisensi</p>
                <p className="text-xl font-bold text-orange-600">{formatNumber(totalBelumTerlisensi)}</p>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {teamGenerations.slice(0, showMoreGenerations ? 10 : 5).map((genData, index) => {
              const genLevel = index + 1;
              const target = getPowerOf5Target(genLevel);
              const progress = (genData.total_rekrut / target) * 100;
              const hasRecruits = genData.total_rekrut > 0;
              const cardClass = hasRecruits ? 'bg-[#002D62] text-white' : 'bg-[#E6F4F1] text-[#002D62]';

              return (
                <Card key={genLevel} className={`${cardClass} border-0 shadow-sm`}>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-md">Gen {genLevel}</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className={`font-medium ${hasRecruits ? 'text-blue-200' : 'text-gray-500'}`}>
                          Total Rekrut: {formatNumber(genData.total_rekrut)}/{formatNumber(target)}
                        </span>
                        <span className={`font-bold ${hasRecruits ? 'text-white' : 'text-blue-900'}`}>
                          {progress.toFixed(1).replace('.', ',')}%
                        </span>
                      </div>
                      <Progress value={progress} className="h-2 [&>div]:bg-blue-400" />
                    </div>
                    <div>
                      <span className="text-xs font-medium text-orange-300">
                        Belum Terlisensi: {formatNumber(genData.belum_terlisensi)}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="text-center pt-2">
            <button
              onClick={() => setShowMoreGenerations(!showMoreGenerations)}
              className="text-[#00A896] text-xs font-bold"
            >
              {showMoreGenerations ? 'Tampilkan lebih sedikit <<' : 'Tampilkan lebih banyak >>'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 space-y-6 pb-20">
      <div className="max-w-3xl mx-auto flex items-center justify-between py-4">
        <div>
          <h1 className="text-2xl font-bold text-[#002D62]">{user?.name}</h1>
          <p className="text-xs text-gray-500">
            Lisensi berlaku hingga:{" "}
            <span className={`font-semibold ${isAajiExpiryUrgent(aajiExpiry ?? undefined) ? "text-red-600" : "text-gray-700"}`}>
              {formatDate(aajiExpiry)}
            </span>
          </p>
        </div>
      </div>

      {error && (
        <div className="max-w-3xl mx-auto bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      <div className="max-w-3xl mx-auto space-y-4">
        <Card className="bg-white border-0 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-black leading-tight">Builder Path</h2>
              <p className="text-xs text-gray-500">
                Periode: <span className="text-blue-700 font-medium">Jan {currentYear} - Des {currentYear}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {/* FYAP Card */}
              <div className="flex flex-col items-center justify-center p-6 bg-[#E0F2FE] rounded-2xl space-y-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm">
                  <Wallet className="h-6 w-6 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">FYAP</span>
                <span className="text-3xl font-bold text-black">{String(fyapPercentage).replace('.', ',')}%</span>
                <span className="text-xs font-medium text-gray-600 text-center leading-snug">
                  {targetFyap > 0 ? `${formatRupiah(fyapAchievement)} / ${formatRupiah(targetFyap)}` : '—'}
                </span>
              </div>

              {/* Agen Aktif Card */}
              <div className="flex flex-col items-center justify-center p-6 bg-[#FFEDD5] rounded-2xl space-y-3">
                <div className="p-2.5 bg-white rounded-xl shadow-sm">
                  <Users className="h-6 w-6 text-gray-700" />
                </div>
                <span className="text-sm font-medium text-gray-700">Agen Aktif</span>
                <span className="text-3xl font-bold text-black">{String(aaPercentage).replace('.', ',')}%</span>
                <span className="text-xs font-medium text-gray-600 text-center leading-snug">
                  {targetActiveAgent > 0 ? `${activeAgentCount} / ${targetActiveAgent} Agen` : '—'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="max-w-3xl mx-auto space-y-6">
      </div>

      <div className="max-w-3xl mx-auto space-y-4 pt-2">
        <div className="pb-2">
          <h2 className="text-lg font-bold text-[#002D62] mb-2">Generasi Anda</h2>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total Rekrut</p>
              <p className="text-xl font-bold text-[#002D62]">{formatNumber(totalRekrut)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Belum Terlisensi</p>
              <p className="text-xl font-bold text-orange-600">{formatNumber(totalBelumTerlisensi)}</p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {teamGenerations.slice(0, showMoreGenerations ? 10 : 5).map((genData, index) => {
            const genLevel = index + 1;
            const target = getPowerOf5Target(genLevel);
            const progress = (genData.total_rekrut / target) * 100;
            const hasRecruits = genData.total_rekrut > 0;
            const cardClass = hasRecruits ? "bg-[#002D62] text-white" : "bg-[#E6F4F1] text-[#002D62]";

            return (
              <Card key={genLevel} className={`${cardClass} border-0 shadow-sm`}>
                <CardContent className="p-4 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-md">Gen {genLevel}</span>
                    <ChevronRight className="h-5 w-5" />
                  </div>
                  <div className="space-y-1 pt-1">
                    <div className="flex justify-between items-center text-xs">
                       <span className={`font-medium ${hasRecruits ? 'text-blue-200' : 'text-gray-500'}`}>
                         Total Rekrut: {formatNumber(genData.total_rekrut)}/{formatNumber(target)}
                      </span>
                      <span className={`font-bold ${hasRecruits ? 'text-white' : 'text-blue-900'}`}>
                        {progress.toFixed(1).replace('.', ',')}%
                      </span>
                    </div>
                    <Progress value={progress} className="h-2 [&>div]:bg-blue-400" />
                  </div>
                  <div>
                    <span className="text-xs font-medium text-orange-300">
                      Belum Terlisensi: {formatNumber(genData.belum_terlisensi)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="text-center pt-2">
          <button
            onClick={() => setShowMoreGenerations(!showMoreGenerations)}
            className="text-[#00A896] text-xs font-bold"
          >
            {showMoreGenerations ? "Tampilkan lebih sedikit <<" : "Tampilkan lebih banyak >>"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AgentDashboard;