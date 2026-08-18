import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getLicenseStatus, getRoleName, formatDate } from "@/lib/profileUtils";
import { User } from "lucide-react";

type ProfileInfoCardProps = {
  user: {
    fdCode?: string;
    name?: string;
    role?: string;
    sequisCode?: string;
    aajiCode?: string;
    aajiExpiry?: string;
    uplineName?: string;
    policyNumber?: string;
    premium?: number;
    premiumDueDate?: string;
  };
};

const InfoItem = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="flex flex-col rounded-lg bg-muted/50 p-3">
    <dt className="text-xs text-muted-foreground">{label}</dt>
    <dd className="text-sm font-semibold text-foreground">{value || "—"}</dd>
  </div>
);

export function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const license = getLicenseStatus(user.aajiExpiry);
  const formattedPremium = user.premium ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(user.premium) : "—";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informasi Kemitraan
        </CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-3">
          <InfoItem label="Kode FDPro" value={user.fdCode} />
          <InfoItem label="Peringkat" value={getRoleName(user.role)} />
          <InfoItem label="Perekrut" value={user.uplineName} />
          <InfoItem label="Kode Agen (Sequis)" value={user.sequisCode} />
          <InfoItem
            label="Status Lisensi"
            value={
              <Badge variant={license.variant} className="text-xs">{license.text}</Badge>
            }
          />
          <InfoItem label="Lisensi Expired" value={formatDate(user.aajiExpiry)} />
          <InfoItem label="Nomor Polis" value={user.policyNumber} />
          <InfoItem label="Premi" value={formattedPremium} />
          <InfoItem label="Jatuh Tempo Premi" value={formatDate(user.premiumDueDate)} />
        </dl>
      </CardContent>
    </Card>
  );
}
