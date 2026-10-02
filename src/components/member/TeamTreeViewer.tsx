import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';
import { ChevronDown, ChevronUp, Search, User as UserIcon, Download, FileText, CheckCircle, MapPin, Phone, Mail, Calendar, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { TeamEmptyState } from '@/components/member/TeamEmptyState';
import { getRoleName } from '@/lib/profileUtils';

// Normalisasi nomor telepon Indonesia menjadi link wa.me
// ("0812-3456-7890" -> "https://wa.me/6281234567890"; awalan 62 dipertahankan).
const buildWaMeLink = (phone?: string | null): string | null => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (!digits) return null;
  const normalized = digits.startsWith('62') ? digits : `62${digits.replace(/^0+/, '')}`;
  return `https://wa.me/${normalized}`;
};

// Susun alamat menjadi 3 baris terstruktur dengan null-handling per segmen
// agar tidak muncul teks "RT undefined" pada data yang tidak lengkap:
//   Baris 1: {address} RT {rt} RW {rw}
//   Baris 2: Kel. {village} Kec. {district}
//   Baris 3: {city}, {province} {postal_code}
// Nama wilayah ter-resolve dari backend (villageName, dst.) diprioritaskan
// di atas raw value kolom (yang bisa berupa ID wilayah seperti "KB-01").
const buildAddressLines = (u: any): string[] => {
  const line1 = [u.address, u.rt ? `RT ${u.rt}` : '', u.rw ? `RW ${u.rw}` : '']
    .filter(Boolean)
    .join(' ');
  // Prioritas: field ter-resolve dari backend (*Name) -> bentuk objek relasi
  // (province?.name, untuk API yang mengirim include relasi wilayah) ->
  // raw value kolom (yang bisa berupa ID wilayah seperti "KB-01").
  const village = u.villageName || u.village?.name || u.village;
  const district = u.districtName || u.district?.name || u.district;
  const city = u.cityName || u.city?.name || u.city;
  const province = u.provinceName || u.province?.name || u.province;
  const line2 = [village ? `Kel. ${village}` : '', district ? `Kec. ${district}` : '']
    .filter(Boolean)
    .join(' ');
  const cityProvince = [city, province].filter(Boolean).join(', ');
  const line3 = [cityProvince, u.postalCode].filter(Boolean).join(' ');
  return [line1, line2, line3].filter((line) => line.trim().length > 0);
};

// Satu baris domisili ringkas untuk kartu list & kolom ekspor CSV:
// "Kec. X • Kota/Kab Y • Provinsi Z". Optional chaining di semua tingkat
// agar aman ketika alamat anggota kosong/null.
const formatDomicile = (m: any): string =>
  [
    m?.districtName || m?.district?.name,
    m?.cityName || m?.city?.name,
    m?.provinceName || m?.province?.name,
  ]
    .filter(Boolean)
    .join(' • ');

// ---- Struktur pohon rekursif (nested JSON dari GET /api/users/team-tree) ----
// Backend mengirim SATU objek ROOT = user yang login (depth 0); children[]
// memuat seluruh downline deep-recursive hasil BFS adjacency users_tree —
// GEN 1 = direct downline, GEN 2 = downline dari downline, dst.
type TeamTreeNode = {
  id: string;
  depth: number;
  children?: TeamTreeNode[];
  [key: string]: any;
};

const getChildren = (n: TeamTreeNode): TeamTreeNode[] => n.children ?? [];

const matchesSearch = (n: TeamTreeNode, term: string): boolean => {
  const t = term.trim().toLowerCase();
  if (!t) return true;
  return (
    (n.name || '').toLowerCase().includes(t) ||
    (n.fdCode || '').toLowerCase().includes(t)
  );
};

// Filter rekursif: node dipertahankan bila dirinya match ATAU memiliki
// keturunan yang match (agar jalur menuju hasil pencarian tetap utuh).
const filterTree = (nodes: TeamTreeNode[], term: string): TeamTreeNode[] =>
  nodes
    .map((n) => ({ ...n, children: filterTree(getChildren(n), term) }))
    .filter((n) => matchesSearch(n, term) || getChildren(n).length > 0);

// Kumpulkan id semua node yang punya anak — dipakai tombol "Expand All".
const collectParentIds = (nodes: TeamTreeNode[], acc: Set<string> = new Set()): Set<string> => {
  nodes.forEach((n) => {
    if (getChildren(n).length > 0) {
      acc.add(n.id);
      collectParentIds(getChildren(n), acc);
    }
  });
  return acc;
};

// Ratakan pohon nested kembali menjadi barisan datar (ekspor CSV).
const flattenTree = (nodes: TeamTreeNode[]): TeamTreeNode[] =>
  nodes.flatMap((n) => [n, ...flattenTree(getChildren(n))]);

// Komponen REKURSIF: merender satu anggota lalu (bila ada children dan node
// sedang expand) memanggil dirinya sendiri untuk tiap anak dengan depth+1.
// Dipanggil mulai depth={1} untuk direct downline (badge "GEN 1"); rekursi
// menaikkan depth+1 (GEN 2, dst.). ROOT tidak pernah lewat komponen ini —
// dirender manual oleh parent. Rekursi dijamin berhenti: children berasal
// dari pohon asiklik hasil traversal users_tree dan kosong pada leaf.
type MemberNodeProps = {
  member: TeamTreeNode;
  depth: number;
  expandedIds: Set<string>;
  onToggle: (id: string) => void;
  onMemberClick: (m: any) => void;
};

const MemberNode = ({ member, depth, expandedIds, onToggle, onMemberClick }: MemberNodeProps) => {
  const children = getChildren(member);
  const hasChildren = children.length > 0;
  const isExpanded = expandedIds.has(member.id);
  const isPending = member.status === 'pending_approval';

  return (
    <div>
      <div
        onClick={() => onMemberClick(member)}
        className={`flex items-center justify-between py-2 px-2 rounded transition-colors cursor-pointer ${
          isPending
            ? 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
            : 'hover:bg-blue-50'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0">
            GEN {depth}
          </span>
          <div className={`p-1.5 rounded-full ${isPending ? 'bg-yellow-200' : 'bg-gray-100'}`}>
            <UserIcon className={`h-4 w-4 ${isPending ? 'text-yellow-700' : 'text-gray-500'}`} />
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800">{member.name}</p>
            <p className="text-[10px] text-gray-500 font-mono">
              {member.fdCode || 'PENDING'} • {getRoleName(member.role) || member.role}
            </p>
            {(member.districtName || member.district?.name ||
              member.cityName || member.city?.name ||
              member.provinceName || member.province?.name) && (
              <p className="text-[11px] text-gray-600 flex items-center gap-1 mt-0.5 max-w-[240px]">
                <MapPin className="h-3 w-3 flex-shrink-0 text-[#00A896]" />
                <span className="truncate">{formatDomicile(member)}</span>
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isPending ? (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-yellow-200 text-yellow-800">
              <CheckCircle className="h-3 w-3" />
              Pending Approval
            </span>
          ) : (
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
              member.status === 'active'
                ? 'bg-green-100 text-green-700'
                : member.status === 'suspended'
                ? 'bg-orange-100 text-orange-700'
                : 'bg-yellow-100 text-yellow-700'
            }`}>
              {member.status}
            </span>
          )}
          {hasChildren && (
            <button
              type="button"
              onClick={(e) => {
                // stopPropagation: klik chevron hanya toggle cabang,
                // tidak ikut membuka modal detail member.
                e.stopPropagation();
                onToggle(member.id);
              }}
              aria-expanded={isExpanded}
              className="flex items-center gap-1 text-[10px] font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-full px-2 py-0.5 transition-colors"
            >
              {children.length} downline
              {isExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>

      {/* Rekursi ke level generasi berikutnya (depth + 1) */}
      {hasChildren && isExpanded && (
        <div className="ml-6 border-l-2 border-blue-100 pl-2 space-y-1 mt-1 mb-1">
          {children.map((child) => (
            <MemberNode
              key={child.id}
              member={child}
              depth={depth + 1}
              expandedIds={expandedIds}
              onToggle={onToggle}
              onMemberClick={onMemberClick}
            />
          ))}
        </div>
      )}
    </div>
  );
};
const TeamTreeViewer = ({ userId: _userId, role: _role }: { userId: string; role: string }) => {
  // teamRoot = objek ROOT (user yang login); children[] = seluruh downline.
  const [teamRoot, setTeamRoot] = useState<TeamTreeNode | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState<any>(null);

  useEffect(() => {
    const fetchTree = async () => {
      setLoading(true);
      try {
        const data = await api.get('/api/users/team-tree');
        // Kontrak baru: SATU objek root (user login). Defensif: array berisi
        // tepat 1 elemen (respons lama) juga diterima; selain itu -> null.
        const root: TeamTreeNode | null = Array.isArray(data)
          ? data.length === 1
            ? data[0]
            : null
          : data;
        setTeamRoot(root);
        // Default: buka SELURUH cabang agar silsilah lintas generasi langsung
        // terlihat (bug lama: turunan GEN 2+ tampak "hilang" karena cabang
        // default tertutup). Collapse tetap tersedia untuk merapikan.
        setExpandedIds(collectParentIds(root ? [root] : []));
      } catch (err) {
        console.error('Failed to fetch tree data', err);
        setTeamRoot(null); // Pastikan state bersih saat error
      } finally {
        setLoading(false);
      }
    };
    fetchTree();
  }, []);

  // Toggle expand/collapse satu cabang berdasarkan id node-nya.
  const toggleNode = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
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

  // Baris alamat siap-render untuk modal detail (kosong bila tidak ada data).
  const addressLines = selectedMember ? buildAddressLines(selectedMember) : [];

  const handleExport = () => {
    if (!teamRoot) return;

    // Ratakan pohon nested kembali menjadi barisan datar — hanya downline
    // (root "ANDA" tidak ikut diekspor); kolom Generasi memakai depth
    // otoritatif dari backend yang tersimpan di tiap node.
    const rows = flattenTree(getChildren(teamRoot)).map((member) => ({
      Generasi: member.depth,
      Nama: member.name,
      'Kode FDPro': member.fdCode || 'PENDING',
      Role: member.role,
      Status: member.status,
      Domisili: formatDomicile(member),
    }));

    const csv = [
      ['Generasi', 'Nama', 'Kode FDPro', 'Role', 'Status', 'Domisili'],
      ...rows.map((r) => [r.Generasi, r.Nama, r['Kode FDPro'], r.Role, r.Status, r.Domisili]),
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
  
  // Mode pencarian: buka semua cabang otomatis agar hasil di kedalaman mana
  // pun tetap terlihat; di luar pencarian hormati state expand manual.
  const searching = searchTerm.trim().length > 0;
  const visibleTree = teamRoot ? filterTree([teamRoot], searchTerm) : [];
  const filteredRoot = visibleTree[0] || null;
  const effectiveExpanded = searching ? collectParentIds(visibleTree) : expandedIds;
  const totalCount = teamRoot ? flattenTree(getChildren(teamRoot)).length : 0;

  // Pohon kosong setelah loading -> tampilan kosong
  if (totalCount === 0) {
    return <TeamEmptyState message="Belum ada anggota tim di jaringan Anda saat ini." />;
  }


  return (
    <div className="space-y-4">
      <Card id="team-tree-print">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Team Anda
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleExport}>
                <Download className="h-4 w-4 mr-1" /> Excel
              </Button>
              <Button size="sm" variant="outline" onClick={() => window.print()}>
                <FileText className="h-4 w-4 mr-1" /> PDF
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedIds(collectParentIds(teamRoot ? [teamRoot] : []))}
              >
                Expand All
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setExpandedIds(new Set())}
              >
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
            {!filteredRoot ? (
              <p className="text-center text-gray-500 py-4">Belum ada anggota tim.</p>
            ) : (
              <>
                {/* Kartu ROOT (user login) dirender MANUAL di atas — TIDAK
                    melalui komponen rekursif — sehingga mustahil ter-render
                    dobel; badge gelap "ANDA", non-klik. */}
                <div className="flex items-center justify-between py-2 px-2 rounded bg-slate-50 border border-slate-200">
                  <div className="flex items-center gap-3">
                    <span className="bg-gray-800 text-white text-[10px] font-bold px-2 py-0.5 rounded flex-shrink-0">
                      ANDA
                    </span>
                    <div className="p-1.5 rounded-full bg-gray-100">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{filteredRoot.name}</p>
                      <p className="text-[10px] text-gray-500 font-mono uppercase">
                        {filteredRoot.fdCode || 'PENDING'} • {String(filteredRoot.role || '').replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-gray-500">
                    {totalCount} anggota
                  </span>
                </div>

                {/* Direct downlines dilempar ke komponen rekursif mulai
                    depth={1} -> badge "GEN 1"; rekursi menaikkan depth+1 untuk
                    turunannya (GEN 2, GEN 3, dst.) hingga generasi terdalam.

                    Scroll fix: struktur tim bisa sangat panjang (ratusan
                    downline lintas generasi). Pembungkus daftar diberi batas
                    tinggi relatif viewport (menyisakan header ~60px + header
                    halaman + tab + header kartu + pencarian + bottom nav) dan
                    overflow-y-auto, sehingga konten panjang di-scroll vertikal
                    di dalam kartu — bukan memperluas/memotong halaman. */}
                <div className="max-h-[calc(100dvh-340px)] overflow-y-auto pr-1 space-y-2">
                  {getChildren(filteredRoot).map((child) => (
                    <MemberNode
                      key={child.id}
                      member={child}
                      depth={1}
                      expandedIds={effectiveExpanded}
                      onToggle={toggleNode}
                      onMemberClick={handleMemberClick}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      <Dialog open={!!selectedMember} onOpenChange={(open) => !open && closeMemberDetail()}>
        <DialogContent className="sm:max-w-md">
          {/* Header visual dikosongkan — nama user di tengah modal adalah fokus
              utama. DialogTitle sr-only tetap ada demi aksesibilitas Radix, dan
              tombol close (X) tetap dirender otomatis oleh DialogContent. */}
          <DialogHeader>
            <DialogTitle className="sr-only">Detail Anggota Tim</DialogTitle>
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
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-700" title={getRoleName(selectedMember.role)}>
                        {getRoleName(selectedMember.role) || selectedMember.role}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                        selectedMember.status === 'active' ? 'bg-green-100 text-green-700' : selectedMember.status === 'suspended' ? 'bg-orange-100 text-orange-700' : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {String(selectedMember.status || '').replace(/_/g, ' ')}
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
                        {selectedMember.phone ? (
                          <a
                            href={buildWaMeLink(selectedMember.phone) ?? '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline break-all"
                          >
                            {selectedMember.phone}
                          </a>
                        ) : (
                          <p className="text-gray-800">-</p>
                        )}
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
                    {addressLines.length > 0 && (
                      <div className="flex items-start gap-3">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wide">Domisili</p>
                          <div className="text-gray-800">
                            {addressLines.map((line, idx) => (
                              <p key={idx}>{line}</p>
                            ))}
                          </div>
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
