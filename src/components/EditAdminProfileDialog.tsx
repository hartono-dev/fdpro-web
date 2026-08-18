import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface EditAdminProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const EditAdminProfileDialog = ({ open, onOpenChange }: EditAdminProfileDialogProps) => {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  // Isi form setiap kali dialog dibuka, berdasarkan data user terbaru.
  useEffect(() => {
    if (open && user) {
      setName(user.name || "");
      setPhone(user.phone || "");
    }
  }, [open, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Nama lengkap wajib diisi.");
      return;
    }
    setLoading(true);
    try {
      const updated = await api.post("/api/users/me", {
        name: name.trim(),
        phone: phone.trim(),
      });
      updateUser(updated);
      toast.success("Profil berhasil diperbarui!");
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Gagal memperbarui profil", {
        description: err?.message || "Terjadi kesalahan pada server.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Profil</DialogTitle>
          <DialogDescription>
            Perbarui nama dan nomor telepon Anda. Email tidak dapat diubah.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nama Lengkap</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="cth. Budi Santoso"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">No. WhatsApp / Telepon</Label>
            <Input
              id="edit-phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="cth. 08123456789"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-email">Email</Label>
            <Input id="edit-email" value={user?.email || ""} disabled readOnly />
          </div>
          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Batal
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditAdminProfileDialog;
