import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card, CardContent } from '@/components/ui/Card';
import { Input } from '@/components/ui/input';
import { Search, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';

interface AuditLog {
  id: string;
  action: string;
  targetId: string | null;
  details: string | null;
    createdAt: string;
  user: { email: string } | null;
}

interface AuditDetails {
  actor?: { name: string; email: string; role: string };
  description?: string;
}

interface AuditLogsResponse {
  logs: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const clampPage = (page: number, totalPages: number) =>
  Math.min(Math.max(page, 1), Math.max(totalPages, 1));

const AdminAuditLogsPage = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [actionFilter, setActionFilter] = useState('');
  const [actionInput, setActionInput] = useState('');
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (actionFilter) params.set('action', actionFilter);
      const response: AuditLogsResponse = await api.get(`/api/admin/audit-logs?${params.toString()}`);
      setLogs(response.logs);
      setTotalPages(clampPage(response.pagination.totalPages, response.pagination.totalPages || 1));
      setTotal(response.pagination.total);
    } catch (err) {
      setError('Gagal memuat audit logs.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, actionFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Reset ke halaman 1 ketika filter berubah
  const applyFilter = () => {
    setActionInput(actionInput.trim());
    setActionFilter(actionInput.trim());
    setPage(1);
  };

  const clearFilter = () => {
    setActionInput('');
    setActionFilter('');
    setPage(1);
  };

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  const parseDetails = (raw: string | null): AuditDetails => {
    if (!raw) return {};
    try {
      const parsed = JSON.parse(raw);
      return parsed as AuditDetails;
    } catch {
      return { description: raw };
    }
  };

  const actionBadgeVariant = (action: string) => {
    if (action.includes('CREATE_ADMIN')) return 'default';
    if (
      action.includes('ESCALATE') ||
      action.includes('UPDATE_USER_STATUS') ||
      action.includes('LOGIN_FAILED')
    )
      return 'destructive';
    if (action.includes('LOGIN_SUCCESS')) return 'success';
    if (
      action.includes('CHANGE_PASSWORD') ||
      action.includes('PASSWORD_RESET')
    )
      return 'warning';
    return 'outline';
  };
return (
    <div className="space-y-4">
                  {/* Filter */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari berdasarkan aksi (mis. CREATE_ADMIN)"
              value={actionInput}
              onChange={(e) => setActionInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyFilter()}
              className="pl-8"
            />
          </div>
          <Button onClick={applyFilter}>Terapkan Filter</Button>
          {actionFilter && (
            <Button variant="ghost" onClick={clearFilter}>
              Hapus Filter
            </Button>
          )}
          <Button variant="outline" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Memuat...' : 'Muat Ulang'}
          </Button>
        </div>
        <span className="text-sm text-muted-foreground sm:ml-auto">
          Total {total} catatan
        </span>
      </div>

      <Card>
        <CardContent>
          {loading ? (
            <div className="py-8 text-center text-muted-foreground">Memuat audit logs...</div>
          ) : error ? (
            <div className="py-8 text-center text-red-500">{error}</div>
          ) : logs.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              Tidak ada audit log yang ditemukan.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Waktu</TableHead>
                  <TableHead>Aksi</TableHead>
                  <TableHead>Aktor</TableHead>
                  <TableHead>Deskripsi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => {
                  const details = parseDetails(log.details);
                  const actorName = details.actor?.name ?? 'Sistem';
                                    const actorEmail = details.actor?.email ?? log.user?.email ?? '—';
                  const description = details.description ?? log.details ?? '-';
                  return (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(log.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Badge variant={actionBadgeVariant(log.action)} className="font-mono">
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        <div className="font-medium">{actorName}</div>
                        <div className="text-xs text-muted-foreground">{actorEmail}</div>
                      </TableCell>
                      <TableCell className="max-w-md">
                        <span className="text-sm text-gray-700">{description}</span>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(p - 1, 1))}
            >
              <ChevronLeft className="h-4 w-4" /> Sebelumnya
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            >
              Berikutnya <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminAuditLogsPage;