import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";

interface RecruitLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  fdCode: string | undefined;
  leadId: string;
  /** Jika false, modal hanya menampilkan link untuk di-copy (mode read-only) */
  showDone?: boolean;
  onDone?: () => Promise<void>;
}

export function RecruitLeadModal({
  open,
  onOpenChange,
  leadName,
  fdCode,
  leadId,
  showDone = true,
  onDone,
}: RecruitLeadModalProps) {
  const [hasCopied, setHasCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // URL penuh dengan ref agen & lead_id — penting untuk tracking anti-bias email
  const fullUrl = `${window.location.origin}/register?ref=${fdCode}&lead_id=${leadId}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(fullUrl);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2000);
  };

  const handleDone = async () => {
    if (!onDone) return;
    setIsSubmitting(true);
    try {
      await onDone();
      onOpenChange(false);
    } catch {
      // Error handled in parent
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>RECRUIT</DialogTitle>
          <DialogDescription>
            Bagikan link pendaftaran kepada <strong>{leadName}</strong> untuk menyelesaikan proses registrasi.
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <Label htmlFor="registration-url" className="mb-2 block">
            Link Pendaftaran
          </Label>
          <div className="flex items-center gap-2">
            <Input id="registration-url" value={fullUrl} readOnly className="text-sm" />
            <Button size="icon" onClick={handleCopy} variant="outline" title="Salin link">
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {showDone && onDone && (
          <DialogFooter>
            <Button onClick={handleDone} disabled={isSubmitting}>
              {isSubmitting ? "Memproses..." : "Done"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
