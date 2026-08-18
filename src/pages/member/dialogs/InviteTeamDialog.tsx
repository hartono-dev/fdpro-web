import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';

interface InviteTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function InviteTeamDialog({ isOpen, onClose }: InviteTeamDialogProps) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Undang Peserta</DialogTitle>
          <DialogDescription>
            Pilih tim atau anggota yang ingin Anda undang ke event ini.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          {/* Konten untuk memilih tim akan ditambahkan di sini */}
          <p className="text-sm text-center text-gray-500">
            (Fitur pemilihan hierarki tim akan diimplementasikan di sini)
          </p>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="button">Simpan Undangan</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
