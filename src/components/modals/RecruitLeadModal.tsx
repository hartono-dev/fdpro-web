import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Check, Copy } from "lucide-react";

interface RecruitLeadModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  registrationUrl: string | null;
  leadName: string;
}

export function RecruitLeadModal({ open, onOpenChange, registrationUrl, leadName }: RecruitLeadModalProps) {
  const [hasCopied, setHasCopied] = useState(false);

  const handleCopy = () => {
    if (registrationUrl) {
      navigator.clipboard.writeText(registrationUrl);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };
  
  if (!registrationUrl) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rekrutmen Berhasil!</DialogTitle>
          <DialogDescription>
            Bagikan link pendaftaran berikut kepada <strong>{leadName}</strong> untuk menyelesaikan proses registrasi.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Label htmlFor="registration-url">Link Pendaftaran Khusus</Label>
          <div className="flex items-center gap-2 mt-1">
            <Input id="registration-url" value={registrationUrl} readOnly />
            <Button size="icon" onClick={handleCopy}>
              {hasCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Tutup</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
