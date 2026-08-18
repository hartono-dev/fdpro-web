import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/Button";
import { AlertCircle, Edit, Save, X } from "lucide-react";

type ProfileFormCardProps = {
  user: {
    name?: string;
    phone?: string;
    email?: string;
    nik?: string;
    dob?: string;
    address?: string;
  };
  onUpdate: (data: any) => Promise<void>;
};

const InfoRow = ({ label, value }: { label: string; value: React.ReactNode }) => (
    <div className="py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
);

export function ProfileFormCard({ user, onUpdate }: ProfileFormCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user.name || '',
    phone: user.phone || '',
    nik: user.nik || '',
    dob: user.dob ? user.dob.split('T')[0] : '',
    address: user.address || '',
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError("");
    try {
      await onUpdate(formData);
      setIsEditing(false); // Switch back to view mode on success
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form to initial user data
    setFormData({
        name: user.name || '',
        phone: user.phone || '',
        nik: user.nik || '',
        dob: user.dob ? user.dob.split('T')[0] : '',
        address: user.address || '',
    });
    setIsEditing(false);
    setError("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
            <Edit className="h-5 w-5" />
            Data Pribadi
        </CardTitle>
        <CardDescription>
            {isEditing ? "Klik 'Simpan' untuk menyimpan perubahan." : "Klik 'Ubah Data' untuk mengedit informasi Anda."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          // EDIT MODE
          <form onSubmit={handleFormSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">Nama Lengkap</label>
                      <Input id="name" name="name" value={formData.name} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">Email</label>
                      <Input id="email" name="email" value={user.email || ''} readOnly disabled />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="phone" className="text-sm font-medium">No. Telepon</label>
                      <Input id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="nik" className="text-sm font-medium">No. KTP (NIK)</label>
                      <Input id="nik" name="nik" value={formData.nik} onChange={handleChange} />
                  </div>
                  <div className="space-y-2">
                      <label htmlFor="dob" className="text-sm font-medium">Tanggal Lahir</label>
                      <Input id="dob" name="dob" type="date" value={formData.dob} onChange={handleChange} />
                  </div>
              </div>
              <div className="space-y-2">
                  <label htmlFor="address" className="text-sm font-medium">Alamat Domisili</label>
                  <textarea
                      id="address"
                      name="address"
                      rows={3}
                      value={formData.address}
                      onChange={handleChange}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  />
              </div>
              {error && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                      <AlertCircle className="h-4 w-4" />
                      <span>{error}</span>
                  </div>
              )}
              <div className="flex justify-end gap-2 pt-4">
                  <Button type="button" variant="outline" onClick={handleCancel} disabled={isSubmitting}>
                      <X className="h-4 w-4 mr-2" />
                      Batal
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                      <Save className="h-4 w-4 mr-2" />
                      {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
              </div>
          </form>
        ) : (
          // VIEW MODE
          <div className="space-y-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-2 border rounded-lg p-4">
                <InfoRow label="Nama Lengkap" value={user.name} />
                <InfoRow label="Email" value={user.email} />
                <InfoRow label="No. Telepon" value={user.phone} />
                <InfoRow label="No. KTP (NIK)" value={user.nik} />
                <InfoRow label="Tanggal Lahir" value={user.dob ? new Date(user.dob).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric'}) : '—'} />
                <div className="md:col-span-2">
                    <InfoRow label="Alamat Domisili" value={user.address} />
                </div>
            </div>
            <div className="flex justify-end pt-4">
                <Button onClick={() => setIsEditing(true)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Ubah Data
                </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
