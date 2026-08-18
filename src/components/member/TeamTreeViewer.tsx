import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { ChevronDown, ChevronUp, Search, User as UserIcon, Download, FileText, CheckCircle, MapPin, Phone, Mail, Calendar, Shield } from 'lucide-react';
import { api } from '@/lib/api';

// Helper function to group members by their depth (generation)
const groupMembersByGeneration = (members: any[]) => {
  if (!Array.isArray(members)) {
    return {};
  }
  return members.reduce((acc, member) => {
    const generation = member.depth;
    if (!acc[generation]) {
      acc[generation] = [];
    }
    acc[generation].push(member);
    return acc;
  }, {});
};
const TeamTreeViewer = ({ userId: _userId, role: _role }: { userId: string; role: string }) => {
  const [treeData, setTreeData] = useState<any>({}); // Initialize with empty object
  const [expandedGenerations, setExpandedGenerations] = useState<number[]>([1]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      try {
        const data = await api.get('/api/users/team-tree');
        setTreeData(groupMembersByGeneration(data));
      } catch (err) {
        console.error('Failed to fetch tree data', err);
        setTreeData({}); // Ensure it's an empty object on error
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  const toggleGeneration = (gen: number) => {
    setExpandedGenerations(
      expandedGenerations.includes(gen)
        ? expandedGenerations.filter((g) => g !== gen)
        : [...expandedGenerations, gen]
    );
  };

  const handleMemberClick = async (member: any) => {
    setSelectedMember({ ...member, fetching: true });
    try {
      const detail = await api.get(`/api/users/team-member/${member.id}`);
      setSelectedMember({ ...member, ...detail, fetching: false });
    } catch (err) {
      console.error('Failed to fetch member detail', err);
      setSelectedMember({ ...member, fetching: false });
    }
  };

  const closeMemberDetail = () => {
    setSelectedMember(null);
  };

  const handleExport = () => {
    if (!treeData) return;

    const rows: any[] = [];
    const gens = Object.keys(treeData).map(Number).sort((a, b) => a - b).filter(g => g > 0);

    gens.forEach((gen) => {
      treeData[gen].forEach((member: any) => {
        rows.push({
          Generasi: gen,
          Nama: member.name,
          'Kode FDPro': member.fdCode || 'PENDING',
          Role: member.role,
          Status: member.status,
        });
      });
    });

    const csv = [
      ['Generasi', 'Nama', 'Kode FDPro', 'Role', 'Status'],
      ...rows.map((r) => [r.Generasi, r.Nama, r['Kode FDPro'], r.Role, r.Status]),
    ].map((row) => row.map((cell: any) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'struktur-tim-fdpro.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  if (loading) return <p className="text-center py-4">Memuat data tim...</p>;
  
  // Ensure generations are sorted and valid for rendering
  const gens = Object.keys(treeData || {}).map(Number).sort((a, b) => a - b).filter(g => g > 0);

  // If no generations are found after loading, display a message
  if (gens.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Struktur Jaringan Tim</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center py-8 text-gray-500">Tidak ada data tim yang tersedia.</p>
        </CardContent>
      </Card>
    );
  }


  return (
    <div className="space-y-4">
      <Card id="team-tree-print">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Struktur Jaringan Tim
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button size="sm" variant="outline" onClick={() => setExpandedGenerations(gens)}>
                Expand All
              </Button>
              <Button size="sm" variant="outline" onClick={() => setExpandedGenerations([1])}>
                Collapse
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative mb-4">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Cari nama atau kode anggota..."
              className="pl-9 pr-4 py-2 border rounded-md w-full text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="space-y-3">
            {gens.length === 0 ? (
              <p className="text-center text-gray-500 py-4">Belum ada anggota tim.</p>
            ) : (
              gens.map((gen) => (
                <div key={gen} className="border rounded-lg overflow-hidden">
                  <div
                    className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleGeneration(gen)}
                  >
                    <div className="flex items-center gap-2">
                      <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded">
                        GEN {gen}
                      </span>
                      <span className="text-sm font-medium text-gray-700">
                        {treeData[gen].length} Anggota
                      </span>
                    </div>
                    {expandedGenerations.includes(gen) ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>

                  {expandedGenerations.includes(gen) && (
                    <div className="p-2 bg-white divide-y divide-gray-50">
                      {treeData[gen]
                        .filter((m: any) =>
                          m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (m.fdCode && m.fdCode.toLowerCase().includes(searchTerm.toLowerCase()))
                        )
                        .map((member: any) => {
                          const isPending = member.status === 'pending_approval';
                          return (
                            <div
                              key={member.id}
                              onClick={() => handleMemberClick(member)}
                              className={`flex items-center justify-between py-2 px-2 rounded transition-colors cursor-pointer ${
                                isPending
                                  ? 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                                  : 'hover:bg-blue-50'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <div className={`p-1.5 rounded-full ${
                                  isPending ? 'bg-yellow-200' : 'bg-gray-100'
                                }`}>
                                  <UserIcon className={`h-4 w-4 ${
                                    isPending ? 'text-yellow-700' : 'text-gray-500'
                                  }`} />
                                </div>
                                <div>
                                  <p className="text-sm font-semibold text-gray-800">{member.name}</p>
                                  <p className="text-[10px] text-gray-500 font-mono">
                                    {member.fdCode || 'PENDING'} • {member.role.toUpperCase()}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {isPending && (
                                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-200 text-yellow-800">
                                    <CheckCircle className="h-3 w-3" />
                                    Perlu Persetujuan
                                  </span>
                                )}
                                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  member.status === 'active'
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {member.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && closeMemberDetail()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#002D62]">
              <UserIcon className="h-5 w-5" />
              Detail Agen / Calon Agen
            </DialogTitle>
          </DialogHeader>
          {selectedMember && (
            <div className="space-y-4 pt-2">
              {selectedMember.fetching ? (
                <p className="text-sm text-gray-500 text-center py-6">Memuat detail...</p>
              ) : (
                <>
                  <div className="flex flex-col items-center text-center pb-4 border-b">
                    <div className="bg-primary/10 p-4 rounded-full mb-2">
                      <UserIcon className="h-10 w-10 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-[#002D62]">{selectedMember.name}</h3>
                    <p className="text-xs font-mono text-gray-500">{selectedMember.fdCode || 'PENDING'}</p>
                    <div className="mt-2 flex gap-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700 uppercase">
                        {selectedMember.role}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedMember.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {selectedMember.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                      <Mail className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">Email</p>
                        <p className="text-gray-800 break-all">{selectedMember.email || '-'}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <Phone className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-500 uppercase tracking-wide">WhatsApp</p>
                        <p className="text-gray-800">{selectedMember.phone || '-'}</p>
                      </div>
                    </div>
                    {selectedMember.dob && (
                      <div className="flex items-start gap-3">
                        <Calendar className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Tanggal Lahir</p>
                          <p className="text-gray-800">{new Date(selectedMember.dob).toLocaleDateString('id-ID')}</p>
                        </div>
                      </div>
                    )}
                    {(selectedMember.province || selectedMember.city) && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Domisili</p>
                          <p className="text-gray-800">
                            {[selectedMember.city, selectedMember.province].filter(Boolean).join(', ') || '-'}
                          </p>
                        </div>
                      </div>
                    )}
                    {selectedMember.aajiCode && (
                      <div className="flex items-start gap-3">
                        <Shield className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Lisensi AAJI</p>
                          <p className="text-gray-800 font-mono">{selectedMember.aajiCode}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TeamTreeViewer;
