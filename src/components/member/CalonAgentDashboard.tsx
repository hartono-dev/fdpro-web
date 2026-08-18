import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/contexts/AuthContext';
import { Share2, ChevronRight, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { Input } from '@/components/ui/input';
import { Check, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/Progress';
import { api } from '@/lib/api';

// Define a more detailed structure for each generation's data
interface GenerationData {
  total_rekrut: number;
  belum_terlisensi: number;
}

const CalonAgentDashboard = () => {
  const { user } = useAuth();
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showMoreGenerations, setShowMoreGenerations] = useState(false);

  // Use a more structured state for team summary
  const [teamGenerations, setTeamGenerations] = useState<GenerationData[]>([]);
  const [isLoadingGenerations, setIsLoadingGenerations] = useState(true);
  const [errorGenerations, setErrorGenerations] = useState<string | null>(null);

  const [steps, setSteps] = useState([
    {
      title: "Beli Polis",
      description: "Segera miliki proteksi untuk diri sendiri dan keluarga Anda.",
      completed: false
    },
    {
      title: "Dapatkan Kode Agen",
      description: "Dapatkan kode agen Anda untuk mulai merekrut.",
      completed: false
    },
    {
      title: "Ikuti Pelatihan",
      description: "Tingkatkan skill Anda dengan mengikuti pelatihan rutin.",
      completed: false
    },
    {
      title: "Dapatkan Lisensi AAJI",
      description: "Selesaikan lisensi AAJI untuk menjadi agen resmi.",
      completed: false
    }
  ]);

  useEffect(() => {
    // This part remains as it might have its own API call in the future
    const fetchProgress = async () => {
      try {
        const progressData = await Promise.resolve({
          beliPolis: false,
          dapatkanKodeAgen: false,
          ikutiPelatihan: false,
          dapatkanLisensiAaji: false,
        });

        setSteps(prevSteps => prevSteps.map(step => {
          if (step.title === "Beli Polis") return { ...step, completed: progressData.beliPolis };
          if (step.title === "Dapatkan Kode Agen") return { ...step, completed: progressData.dapatkanKodeAgen };
          if (step.title === "Ikuti Pelatihan") return { ...step, completed: progressData.ikutiPelatihan };
          if (step.title === "Dapatkan Lisensi AAJI") return { ...step, completed: progressData.dapatkanLisensiAaji };
          return step;
        }));
      } catch (error) {
        console.error("Failed to fetch progress", error);
      }
    };

    const fetchTeamData = async () => {
      setIsLoadingGenerations(true);
      setErrorGenerations(null);
      try {
        const data = await api.get('/api/member/metrics');
        if (data.teamGenerations && Array.isArray(data.teamGenerations)) {
          setTeamGenerations(data.teamGenerations);
        } else {
          setTeamGenerations(Array(10).fill({ total_rekrut: 0, belum_terlisensi: 0 }));
        }
      } catch (err) {
        console.error('Failed to fetch generation data:', err);
        setErrorGenerations('Gagal memuat data tim.');
        setTeamGenerations(Array(10).fill({ total_rekrut: 0, belum_terlisensi: 0 }));
      } finally {
        setIsLoadingGenerations(false);
      }
    };

    fetchProgress();
    fetchTeamData();
  }, []);

  const referralLink = user?.fdCode ? `${window.location.origin}/?ref=${user.fdCode}` : "";

  const copyReferral = () => {
    if (!referralLink) return;
    navigator.clipboard.writeText(referralLink).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const getPowerOf5Target = (genLevel: number) => Math.pow(5, genLevel);
  const formatNumber = (num: number) => new Intl.NumberFormat('id-ID').format(num);

  const totalRekrut = teamGenerations.reduce((sum, gen) => sum + gen.total_rekrut, 0);
  const totalBelumTerlisensi = teamGenerations.reduce((sum, gen) => sum + gen.belum_terlisensi, 0);

  return (
    <div className="w-full px-4 md:px-8 lg:px-12 space-y-6 pb-20">
      <div className="max-w-3xl mx-auto py-4">
        <h1 className="text-2xl font-bold text-[#002D62]">Halo, {user?.name?.toUpperCase()}</h1>
        <p className="text-gray-600 text-sm mt-1">Lengkapi langkah-langkah berikut untuk memulai <span className="font-bold">BISNIS</span> Anda</p>
      </div>

      <div className="max-w-3xl mx-auto flex flex-col space-y-4">
        {steps.map((step, index) => (
          <Card key={index} className="bg-[#002D62] text-white border-0 overflow-hidden">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-6 w-6 text-green-500" />
                ) : (
                  <Clock className="h-6 w-6 text-blue-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm">{step.title}</h3>
                  <span className={`text-[10px] font-bold ${step.completed ? 'text-green-500' : 'text-yellow-500'}`}>
                    {step.completed ? 'SELESAI' : 'BELUM SELESAI'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-300 mt-0.5 line-clamp-1">{step.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="max-w-3xl mx-auto text-center space-y-3 py-2">
        <p className="text-sm font-medium text-[#002D62]">Bagikan FDPro dengan Teman dan Keluarga!</p>
        <Button
          onClick={() => setShowReferralModal(true)}
          className="bg-[#00A896] hover:bg-[#008c7a] text-white rounded-full px-8 py-2 flex items-center gap-2 mx-auto"
        >
          <Share2 className="h-4 w-4" />
          Bagikan
        </Button>
      </div>

      <div className="max-w-3xl mx-auto space-y-4">
        {/* --- Generasi Section --- */}
        <div className="pb-2">
          <h2 className="text-lg font-bold text-[#002D62] mb-2">Generasi Anda</h2>

          {errorGenerations && (
            <div className="bg-orange-50 border border-orange-200 text-orange-700 px-4 py-3 rounded-lg flex items-center gap-3 text-sm mb-4">
              <AlertCircle className="h-4 w-4" />
              {errorGenerations}
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-500">Total Rekrut</p>
              <p className="text-xl font-bold text-[#002D62]">
                {isLoadingGenerations ? "..." : formatNumber(totalRekrut)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Belum Terlisensi</p>
              <p className="text-xl font-bold text-orange-600">
                {isLoadingGenerations ? "..." : formatNumber(totalBelumTerlisensi)}
              </p>
            </div>
          </div>
        </div>

        {isLoadingGenerations ? (
          <div className="space-y-3 animate-pulse">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 bg-gray-100 rounded-xl"></div>
            ))}
          </div>
        ) : (
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
                    {/* Row 1: Header */}
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-md">Gen {genLevel}</span>
                      <ChevronRight className="h-5 w-5" />
                    </div>

                    {/* Row 2: Progress Info */}
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

                    {/* Row 3: Obstacles */}
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
        )}

        <div className="text-center pt-2">
          <button
            onClick={() => setShowMoreGenerations(!showMoreGenerations)}
            disabled={isLoadingGenerations}
            className={`text-[#00A896] text-xs font-bold ${isLoadingGenerations ? 'opacity-50' : ''}`}
          >
            {showMoreGenerations ? "Tampilkan lebih sedikit <<" : "Tampilkan lebih banyak >>"}
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto text-center pt-2">
        {/* Modal Link Referral */}
        <Dialog open={showReferralModal} onOpenChange={setShowReferralModal}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-[#002D62]">Bagikan Link Referral</DialogTitle>
              <DialogDescription>
                Salin link referral di bawah dan bagikan ke calon mitra Anda.
              </DialogDescription>
            </DialogHeader>

            <div className="py-4">
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={referralLink}
                  className="flex-1 font-mono text-sm"
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                />
                <Button
                  type="button"
                  onClick={copyReferral}
                  variant={copied ? "default" : "outline"}
                  className={copied ? "bg-[#00A896] hover:bg-[#008c7a]" : ""}
                >
                  {copied ? (
                    <span className="flex items-center gap-1">
                      <Check className="h-4 w-4" />
                      Tersalin!
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <Copy className="h-4 w-4" />
                      Salin
                    </span>
                  )}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default CalonAgentDashboard;
