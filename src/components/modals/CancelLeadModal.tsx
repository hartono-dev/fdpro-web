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

interface CancelLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  onDone: (reason: string) => Promise<void>;
}

export function CancelLeadModal({
  open,
  onOpenChange,
  leadName,
  onDone,
}: CancelLeadModalProps) {
  const [reason, setReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleDone = async () => {
    if (!reason.trim()) {
      alert("Silakan masukkan alasan pembatalan.");
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

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setReason(""); onOpenChange(o); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Lead: {leadName}</DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="cancel-reason" className="mb-2 block">
            Alasan Pembatalan
          </Label>
          <Textarea
            id="cancel-reason"
            placeholder="Masukkan alasan pembatalan..."
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
