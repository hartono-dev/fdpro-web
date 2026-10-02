import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/input';
import { Search, User as UserIcon, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { getRoleName } from '@/lib/profileUtils';
import { useEffect, useMemo, useRef, useState } from 'react';

interface InviteTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  /** Dipanggil saat "Simpan Undangan" diklik. Mengirim userIds (user.id) terpilih ke form utama event. */
  onSave: (userIds: string[]) => void;
}

/**
 * Satu anggota tim yang bisa diundang.
 * `id` DI SINI = user.id (dari field `userId` node team-tree), sebab backend
 * `eventInvitee.userId` ber-FK ke `users.id` — BUKAN member.id (node `id`).
 */
type TeamMember = {
  id: string; // user.id
  name: string;
  fdCode?: string | null;
  /** Generasi dalam struktur tim (depth 1 = direct downline / GEN 1). */
  depth?: number | null;
  /** Posisi/role anggota (mis. `fc`, `abp`, `bp`, `calon_agen`). */
  role?: string | null;
};

/**
 * Tampilkan label posisi human-readable.  Gunakan getRoleName sebagai
 * *single source of truth* (profileUtils.ts) agar konsisten dengan seluruh
 * aplikasi.  Untuk role yang tidak dikenal, fallback ke kapitalisasi kata.
 */
const formatPosisi = (role?: string | null): string => {
  const r = (role || '').trim().toLowerCase();
  if (!r) return '';
  const label = getRoleName(r);
  if (label && label !== r) return label;
  return r
    .split('_')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
};

// Ringkas baris sekunder "Gen X • Posisi" dengan fallback bila sebagian kosong.
const buildSubtitle = (depth?: number | null, role?: string | null): string => {
  const gen = typeof depth === 'number' && Number.isFinite(depth) ? `Gen ${depth}` : '';
  const posisi = formatPosisi(role);
  if (gen && posisi) return `${gen} • ${posisi}`;
  return gen || posisi || '-';
};

// Node respons GET /api/users/team-tree (nested rekursif).
// Node memiliki `id` = member.id & `userId` = user.id; root punya `isRoot: true`.
type TeamTreeNode = {
  id: string;
  userId?: string;
  name?: string;
  fdCode?: string | null;
  children?: TeamTreeNode[];
  [key: string]: any;
};

const getChildren = (n: TeamTreeNode): TeamTreeNode[] => n.children ?? [];

// Ratakan pohon nested menjadi barisan datar downline (eksklusif root).
const flattenDownline = (root: TeamTreeNode | null): TeamMember[] => {
  if (!root) return [];
  const result: TeamMember[] = [];
  const walk = (nodes: TeamTreeNode[]) => {
    for (const n of nodes) {
      // Pakai user.id (bukan member.id) saat mengundang ke event.
      const userId = n.userId || n.id;
      if (userId && n.name) {
        result.push({
          id: userId,
          name: n.name,
          fdCode: n.fdCode ?? null,
          depth: typeof n.depth === 'number' ? n.depth : null,
          role: n.role ?? null,
        });
      }
      walk(getChildren(n));
    }
  };
  walk(getChildren(root));
  // Urutkan: PRIMARY generasi (depth) ascending sebagai ANGKA (bukan string,
  // agar "Gen 10" tidak mendahului "Gen 2"); SECONDARY nama alfabetis A-Z.
  return result.sort((a, b) => {
    const depthA = typeof a.depth === 'number' && Number.isFinite(a.depth) ? a.depth : Infinity;
    const depthB = typeof b.depth === 'number' && Number.isFinite(b.depth) ? b.depth : Infinity;
    if (depthA !== depthB) return depthA - depthB;
    return (a.name || '').localeCompare(b.name || '', 'id', { sensitivity: 'base' });
  });
};

export default function InviteTeamDialog({ isOpen, onClose, onSave }: InviteTeamDialogProps) {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    // Reset state lokal tiap kali modal dibuka kembali.
    setMembers([]);
    setSelectedIds(new Set());
    setSearch('');
    setError(null);
    setLoading(true);

    let cancelled = false;
    (async () => {
      try {
        const root = await api.get('/api/users/team-tree');
        const list = flattenDownline(root ?? null);
        if (!cancelled) setMembers(list);
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Gagal memuat daftar tim.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    // Fokus ke kolom pencarian setelah daftar dimuat.
    const t = window.setTimeout(() => searchInputRef.current?.focus(), 50);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [isOpen]);

  // Daftar tim yang difilter oleh kolom pencarian (nama & kode agen).
  const filteredMembers = useMemo(() => {
    const t = search.trim().toLowerCase();
    if (!t) return members;
    return members.filter(
      (m) =>
        (m.name || '').toLowerCase().includes(t) ||
        (m.fdCode || '').toLowerCase().includes(t)
    );
  }, [members, search]);

  const allVisibleSelected =
    filteredMembers.length > 0 &&
    filteredMembers.every((m) => selectedIds.has(m.id));
  const someVisibleSelected =
    filteredMembers.some((m) => selectedIds.has(m.id)) && !allVisibleSelected;

  const toggleAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        filteredMembers.forEach((m) => next.delete(m.id));
      } else {
        filteredMembers.forEach((m) => next.add(m.id));
      }
      return next;
    });
  };

  const toggleOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (!isOpen) {
    return null;
  }

  const handleSave = () => {
    onSave(Array.from(selectedIds));
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undang Peserta</DialogTitle>
          <DialogDescription>
            Pilih tim atau anggota yang ingin Anda undang ke event ini.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* Kolom pencarian */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              ref={searchInputRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau kode agen..."
              className="pl-9"
            />
          </div>

          {loading ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Memuat daftar tim...
            </div>
          ) : error ? (
            <div className="py-10 text-center text-sm text-red-500">{error}</div>
          ) : members.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              <Users className="mx-auto mb-2 h-8 w-8 text-gray-300" />
              Anda belum memiliki anggota tim untuk diundang.
            </div>
          ) : filteredMembers.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-500">
              Tidak ada anggota tim yang cocok dengan pencarian &quot;{search}&quot;.
            </div>
          ) : (
            <>
              {/* Checkbox master "Pilih Semua" */}
              <label className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-800 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someVisibleSelected;
                  }}
                  onChange={toggleAll}
                  className="h-4 w-4 accent-green-600"
                />
                <span>
                  Pilih Semua{' '}
                  <span className="font-normal text-gray-500">
                    ({selectedIds.size} dipilih)
                  </span>
                </span>
              </label>

              {/* Daftar tim (scrollable) */}
              <div className="max-h-60 overflow-y-auto overscroll-contain space-y-1 pr-1">
                {filteredMembers.map((m) => {
                  const checked = selectedIds.has(m.id);
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 rounded-md px-3 py-2.5 cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleOne(m.id)}
                        className="h-4 w-4 accent-green-600"
                      />
                      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-green-100 text-green-700">
                        <UserIcon className="h-4 w-4" />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-gray-800">
                          {m.name}
                        </span>
                        <span className="block truncate text-xs text-gray-500">
                          {buildSubtitle(m.depth, m.role)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSave}
            disabled={selectedIds.size === 0}
          >
            Simpan Undangan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
