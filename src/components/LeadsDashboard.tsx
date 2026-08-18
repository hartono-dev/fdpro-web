import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/Table';
import { Button } from '@/components/ui/Button';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

import { RecruitLeadModal } from './modals/RecruitLeadModal'; // Import modal baru
const LeadRow = ({ lead, isPool, onPickup, onReject, onRecruit }: any) => (
  <TableRow>
    <TableCell className="font-medium">{lead.name}</TableCell>
    <TableCell>{lead.cityDomicile}</TableCell>
    <TableCell>{new Date(lead.submittedAt).toLocaleDateString('id-ID')}</TableCell>
    {isPool ? (
      <TableCell className="text-right">
        <Button size="sm" onClick={() => onPickup(lead.id)}>Pick Up</Button>
      </TableCell>
    ) : (
      <>
        <TableCell>{lead.status}</TableCell>
        <TableCell>{lead.pickupAt ? new Date(lead.pickupAt).toLocaleDateString('id-ID') : '-'}</TableCell>
        <TableCell className="text-right space-x-2">
            <Button size="sm" variant="outline" onClick={() => onRecruit(lead)} disabled={lead.status !== 'in_progress'}>Recruit</Button>
            <Button size="sm" variant="destructive" onClick={() => onReject(lead.id)}>Reject</Button>
        </TableCell>
      </>
    )}
  </TableRow>
);

export function LeadsDashboard() {
  const { user } = useAuth();
  const [poolLeads, setPoolLeads] = useState([]);
  const [myLeads, setMyLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // State untuk modal
  const [isRecruitModalOpen, setIsRecruitModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<any>(null);
  const [registrationUrl, setRegistrationUrl] = useState<string | null>(null);


  // Calon Agen tidak boleh akses Pool Leads
  const isCalonAgen = user?.role === 'calon_agen';

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const fetchPromises = [
        // Only fetch pool leads if not calon_agen
        !isCalonAgen ? api.get('/api/leads/pool').catch(() => null) : Promise.resolve(null),
        // Always fetch my leads
        api.get('/api/leads/my-leads').catch(() => null),
      ];
      
      const [poolData, myData] = await Promise.all(fetchPromises);
      if (poolData) setPoolLeads(poolData);
      if (myData) setMyLeads(myData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [isCalonAgen]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handlePickup = async (leadId: string) => {
    try {
      await api.post(`/api/leads/${leadId}/pickup`, {});
      fetchData(); // Refresh data
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleReject = async (leadId: string) => {
    const reason = prompt("Masukkan alasan penolakan:");
    if (reason) {
      try {
        await api.post(`/api/leads/${leadId}/reject`, { reason });
        fetchData(); // Refresh data
      } catch (err: any) {
        alert(err.message);
      }
    }
  };

  const handleRecruit = async (lead: any) => {
    if (!confirm(`Apakah Anda yakin ingin merekrut ${lead.name}?`)) return;
    try {
      const response = await api.post(`/api/leads/${lead.id}/recruit`);
      setSelectedLead(lead);
      setRegistrationUrl(response.registrationUrl);
      setIsRecruitModalOpen(true);
      fetchData(); // Refresh data untuk update status lead
    } catch (err: any) {
      alert(`Gagal merekrut: ${err.message}`);
    }
  };

  if (loading) return <p>Loading leads...</p>;
  if (error) return <p className="text-red-500">Error: {error}</p>;

  // Calon Agen hanya bisa lihat My Leads
  if (isCalonAgen) {
    return (
      <>
      <Card>
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-yellow-50 p-4 rounded-md border border-yellow-200">
              <p className="text-yellow-800 text-sm">
                <span className="font-semibold">Catatan untuk Calon Agen:</span> Anda belum memiliki akses ke Pool Leads. 
                Akses akan tersedia setelah status Anda menjadi Agen Resmi.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-medium mb-3">My Leads ({myLeads.length})</h3>
              {myLeads.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Domisili</TableHead>
                      <TableHead>Masuk</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Diambil</TableHead>
                      <TableHead className="text-right">Aksi</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {myLeads.map((lead: any) => (
                      <LeadRow 
                        key={lead.id} 
                        lead={lead} 
                        isPool={false} 
                        onReject={handleReject}
                        onRecruit={handleRecruit}
                      />
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-gray-500 text-center py-4">Belum ada leads</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      {selectedLead && (
        <RecruitLeadModal
          open={isRecruitModalOpen}
          onOpenChange={setIsRecruitModalOpen}
          registrationUrl={registrationUrl}
          leadName={selectedLead.name}
        />
      )}
      </>
    );
  }

  // Agen Resmi (FC, ABP, BP) dan Admin
  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Leads Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="pool">
          <TabsList>
            <TabsTrigger value="pool">Pool Leads ({poolLeads.length})</TabsTrigger>
            <TabsTrigger value="my-leads">My Leads ({myLeads.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="pool">
            {poolLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Domisili</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {poolLeads.map((lead: any) => (
                    <LeadRow key={lead.id} lead={lead} isPool={true} onPickup={handlePickup} />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-4">Tidak ada leads tersedia di pool</p>
            )}
          </TabsContent>
          <TabsContent value="my-leads">
            {myLeads.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama</TableHead>
                    <TableHead>Domisili</TableHead>
                    <TableHead>Masuk</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Diambil</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myLeads.map((lead: any) => (
                    <LeadRow 
                      key={lead.id} 
                      lead={lead} 
                      isPool={false} 
                      onReject={handleReject}
                      onRecruit={handleRecruit}
                    />
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-gray-500 text-center py-4">Belum ada leads</p>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      </Card>
      {selectedLead && (
        <RecruitLeadModal
          open={isRecruitModalOpen}
          onOpenChange={setIsRecruitModalOpen}
          registrationUrl={registrationUrl}
          leadName={selectedLead.name}
        />
      )}
    </>
  );
}