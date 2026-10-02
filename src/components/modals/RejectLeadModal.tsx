import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/Dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/label";

interface RejectLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone: (reason: string) => Promise<void>;
}

export function RejectLeadModal({
  open,
  onOpenChange,
  onDone,
}: RejectLeadModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDone = async () => {
    if (!reason.trim()) {
      alert("Silakan masukkan alasan penolakan.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onDone(reason);
      setReason("");
      onOpenChange(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset alasan & sinkron state terbuka/tutup ketika modal ditutup
  // (melalui ikon "X", tombol ESC, atau klik overlay).
  const handleDialogChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setReason("");
    }
    onOpenChange(nextOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleDialogChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>REJECT</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="reject-reason" className="mb-2 block">
            Alasan Penolakan
          </Label>
          <Textarea
            id="reject-reason"
            placeholder="Masukkan alasan penolakan..."
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
        </div>

        <DialogFooter>
          <Button onClick={handleDone} disabled={isSubmitting || !reason.trim()}>
            {isSubmitting ? "Memproses..." : "Done"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
