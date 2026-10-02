import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ChevronDown, ChevronUp, User as UserIcon, CheckCircle, Circle, AlertCircle } from 'lucide-react';
import { TeamEmptyState } from '@/components/member/TeamEmptyState';
import { api } from '@/lib/api';
import { OnboardingTaskModal, type TaskId, type TaskData, DEFAULT_PAYMENT_MODE } from './OnboardingTaskModal';

const TASK_DEFINITIONS: { id: TaskId; label: string }[] = [
  { id: 'policy', label: 'Beli Polis' },
  { id: 'agent_code', label: 'Dapatkan Kode Agen' },
  { id: 'training', label: 'Ikuti Pelatihan' },
  { id: 'aaji_license', label: 'Dapatkan Lisensi AAJI' },
];

// Struktur data Calon Agen dari GET /api/users/onboarding-list
interface OnboardingAgent {
  id: string;
  nama: string;
  status: 'CALON_AGEN';
  task_polis: boolean;
  task_kode: boolean;
  task_pelatihan: boolean;
  task_aaji: boolean;
  fdCode?: string;
  sequisCode?: string;
  // Detail polis (dari backend; dipakai prefill modal "Beli Polis"):
  policyNumber?: string | null;
  policyInforceDate?: string | null;
  policyPremium?: number | null;
  policyPaymentMode?: string | null;
  policyFyap?: number | null;
}

// Mapping task UI -> flag di response backend
const TASK_FLAG_MAP: Record<TaskId, keyof Pick<OnboardingAgent, 'task_polis' | 'task_kode' | 'task_pelatihan' | 'task_aaji'>> = {
  policy: 'task_polis',
  agent_code: 'task_kode',
  training: 'task_pelatihan',
  aaji_license: 'task_aaji',
};

function isTaskComplete(taskId: TaskId, agent: OnboardingAgent): boolean {
  if (!agent) return false;
  return !!agent[TASK_FLAG_MAP[taskId]];
}

// Validasi detail task yang disimpan lewat modal (data lokal user)
function isTaskDataComplete(taskId: TaskId, taskData: any): boolean {
  if (!taskData) return false;
  switch (taskId) {
    case 'policy': return !!(taskData.inforceDate && taskData.policyNumber && taskData.premium && Number(taskData.premium) > 0);
    case 'agent_code': return !!taskData.agentCode;
    case 'training': return taskData.welcome === true && taskData.conversion === true;
    case 'aaji_license': return !!(taskData.aajiDate && taskData.aajiCode);
    default: return false;
  }
}

export function OnboardingUpdateTab() {
  const [agents, setAgents] = useState<OnboardingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedAgentId, setExpandedAgentId] = useState<string | null>(null);
  // Detail task per agen yang diisi lewat modal (source of truth: input user)
  const [onboardingData, setOnboardingData] = useState<Record<string, Partial<TaskData>>>({});

  const [modalOpen, setModalOpen] = useState(false);
  const [activeTaskId, setActiveTaskId] = useState<TaskId>('policy');
  const [activeAgent, setActiveAgent] = useState<OnboardingAgent | null>(null);

  // AbortController untuk membatalkan request yang sudah basi (component unmount /
  // request baru). Mencegah "set state on unmounted component" dan double-fetch saat StrictMode.
  const abortRef = useRef<AbortController | null>(null);

  const fetchAgents = useCallback(async () => {
    // Batalkan request sebelumnya jika ada (mis. dipanggil ulang setelah promo).
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    try {
      // Ambil DAFTAR detail calon agen dari endpoint khusus
      // (bukan getDashboardMetrics / teamGenerations yang hanya berisi agregat)
      const list: OnboardingAgent[] = await api.get('/api/users/onboarding-list', controller.signal);
      if (controller.signal.aborted) return; // request dibatalkan -> jangan update state

      const calonAgens = (Array.isArray(list) ? list : []).filter(
        (user) => user.status === 'CALON_AGEN'
      );
      setAgents(calonAgens);

      // Seeder detail task dari flag backend supaya modal menampilkan status terbaru
      const seed: Record<string, Partial<TaskData>> = {};
      calonAgens.forEach((agent) => {
        const tasks: Partial<TaskData> = {};
        if (agent.task_polis) {
          tasks.policy = {
            inforceDate: agent.policyInforceDate ?? '',
            policyNumber: agent.policyNumber ?? '',
            premium: agent.policyPremium ? Number(agent.policyPremium) : 0,
            // Data lama (sebelum fitur payment mode) → fallback default 'tahunan'
            paymentMode: agent.policyPaymentMode || DEFAULT_PAYMENT_MODE,
          };
        }
        // PENTING: seed agent_code dengan kode agen resmi Sequis (sequisCode),
        // BUKAN fdCode (kode internal FDPro). Ini perbaikan bug logika di mana
        // fdCode sebelumnya keliru dianggap sebagai kode agen.
        if (agent.task_kode) tasks.agent_code = { agentCode: agent.sequisCode || '' };
        if (agent.task_pelatihan) tasks.training = { welcome: true, conversion: true };
        if (agent.task_aaji) tasks.aaji_license = { aajiDate: '', aajiCode: '' };
        seed[agent.id] = tasks;
      });
      setOnboardingData(seed);
    } catch (err) {
      if (controller.signal.aborted) return; // error karena dibatalkan -> abaikan
      console.error('Failed to fetch onboarding agents', err);
      setAgents([]);
      setOnboardingData({});
    } finally {
      if (!controller.signal.aborted) setLoading(false);
    }
  }, []);

  // PENTING (perbaikan infinite loop):
  // - fetchAgents dibungkus useCallback dengan dependency array KOSONG [], jadi
  //   referensinya STABIL dan tidak berubah antar-render.
  // - useEffect hanya bergantung pada [fetchAgents] (referensi stabil) => fetch
  //   hanya dijalankan SEKALI saat komponen mount, TIDAK mengikuti re-render.
  // Jangan meletakkan `data`, `isLoading`, atau state lain ke dependency array ini.
  useEffect(() => {
    fetchAgents();
    // Cleanup: batalkan request yang masih jalan saat komponen unmount.
    return () => abortRef.current?.abort();
  }, [fetchAgents]);

  const handleOpenModal = (agent: OnboardingAgent, taskId: TaskId) => {
    setActiveAgent(agent);
    setActiveTaskId(taskId);
    setModalOpen(true);
  };

  const handleSaveTask = async (taskId: TaskId, data: any): Promise<void> => {
    if (!activeAgent) return;

    // PRD 5.7: SEMUA task disimpan ke backend lewat endpoint
    // POST /api/users/update-onboarding-task (bukan hanya agent_code).
    // Saat task ke-4 selesai, backend OTOMATIS mengaktivasi calon agen
    // menjadi FC (respon `activated: true`).
    let result: any;
    try {
      result = await api.post('/api/users/update-onboarding-task', {
        memberId: activeAgent.id,
        taskId,
        data,
      });
    } catch (err: any) {
      // Lempar error supaya modal tetap terbuka dan menampilkan pesan kesalahan.
      throw new Error(err?.message || 'Gagal menyimpan data task onboarding.');
    }

    const current = onboardingData[activeAgent.id] || {};
    setOnboardingData({
      ...onboardingData,
      [activeAgent.id]: { ...current, [taskId]: data },
    });
    setModalOpen(false);

    if (result?.activated) {
      alert(
        `${activeAgent.nama} telah menyelesaikan seluruh task onboarding dan otomatis diaktivasi menjadi FC.`
      );
    }

    // Sinkronkan ulang dari backend supaya flag task & progress bar selalu
    // merefleksikan nilai yang tersimpan di database.
    fetchAgents();
  };

  // Task dianggap selesai jika sudah ditandai backend ATAU baru disimpan via modal
  // (state lokal antar render; backend tetap source of truth untuk persistensi jangka panjang).
  const isDisplayComplete = (taskId: TaskId, agent: OnboardingAgent): boolean =>
    isTaskComplete(taskId, agent) || isTaskDataComplete(taskId, onboardingData[agent.id]?.[taskId]);

  if (loading) {
    return <div className="py-12 text-center text-gray-500">Memuat data tim...</div>;
  }

  if (agents.length === 0) {
    return <TeamEmptyState message="Tidak ada Calon Agen aktif dalam tim Anda saat ini." />;
  }

  return (
    <div className="space-y-4 overflow-y-auto max-h-[calc(100dvh-280px)] pr-2 pb-4">
      {agents.map((agent) => {
        const completedCount = TASK_DEFINITIONS.filter((t) => isDisplayComplete(t.id, agent)).length;
        const isAajiMissing = completedCount === 3 && !isDisplayComplete('aaji_license', agent);
        const isExpanded = expandedAgentId === agent.id;

        return (
          <Card key={agent.id} className="overflow-hidden border-l-4 border-l-[#002D62]">
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedAgentId(isExpanded ? null : agent.id)}>
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-full text-[#002D62]"><UserIcon className="h-5 w-5" /></div>
                <div>
                  <h3 className="font-semibold text-gray-900">{agent.nama}</h3>
                  <p className="text-xs text-gray-500">{agent.fdCode || 'No FD Code'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant={completedCount === 4 ? "default" : "secondary"} className={completedCount === 4 ? "bg-green-100 text-green-700" : isAajiMissing ? "bg-orange-100 text-orange-700 hover:bg-orange-100" : ""}>
                  {completedCount === 4 ? "Selesai" : isAajiMissing ? "Menunggu AAJI" : `Progres: ${completedCount}/4`}
                </Badge>
                {isExpanded ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
              </div>
            </div>

            {isExpanded && (
              <CardContent className="bg-gray-50/50 border-t p-0">
                <div className="divide-y">
                  {TASK_DEFINITIONS.map((task) => {
                    const completed = isDisplayComplete(task.id, agent);
                    return (
                      <div key={task.id} className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {completed ? <CheckCircle className="h-5 w-5 text-green-500" /> : <Circle className="h-5 w-5 text-gray-300" />}
                          <span className={`text-sm ${completed ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>{task.label}</span>
                        </div>
                        <Button size="sm" variant={completed ? "outline" : "default"} className={!completed ? "bg-[#002D62] hover:bg-[#001f47]" : "border-gray-300"}
                          onClick={(e) => { e.stopPropagation(); handleOpenModal(agent, task.id); }}>
                          {completed ? 'Edit' : 'Update'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
                {completedCount === 4 && (
                  <div className="p-4 bg-green-50 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-green-700 font-medium">Semua task selesai! Klik Update pada salah satu task jika ingin memperbaiki data.</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {activeAgent && (
        <OnboardingTaskModal open={modalOpen} onOpenChange={setModalOpen} taskId={activeTaskId} agentName={activeAgent.nama}
          currentData={onboardingData[activeAgent.id]?.[activeTaskId]} onSave={handleSaveTask} />
      )}
    </div>
  );
}