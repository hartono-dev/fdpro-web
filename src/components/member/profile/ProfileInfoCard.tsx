import { Badge } from "@/components/ui/Badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { getLicenseStatus, getRoleName, formatDate, isAajiExpiryUrgent } from "@/lib/profileUtils";
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
    uplinePhone?: string;
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

/**
 * Normalisasi nomor telepon Indonesia menjadi format internasional (62xxx)
 * agar bisa dipakai untuk link wa.me. Menangani format 08xx, 628xx, +628xx.
 */
const normalizeWaNumber = (phone?: string): string | null => {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.startsWith("62")) return digits;
  if (digits.startsWith("0")) return "62" + digits.slice(1);
  return "62" + digits;
};

export function ProfileInfoCard({ user }: ProfileInfoCardProps) {
  const license = getLicenseStatus(user.aajiExpiry);
  const waNumber = normalizeWaNumber(user.uplinePhone);
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
          <InfoItem
            label="Leader"
            value={
              user.uplineName || waNumber ? (
                <span className="flex flex-wrap items-center gap-x-2">
                  {user.uplineName && <span>{user.uplineName}</span>}
                  {waNumber && (
                    <a
                      href={`https://wa.me/${waNumber}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {user.uplinePhone}
                    </a>
                  )}
                </span>
              ) : (
                "—"
              )
            }
          />
          <InfoItem label="Kode Agen" value={user.sequisCode} />
          <InfoItem
            label="Status Lisensi"
            value={
              <Badge variant={license.variant} className="text-xs">{license.text}</Badge>
            }
          />
          <InfoItem
            label="Lisensi Expired"
            value={
              <span className={isAajiExpiryUrgent(user.aajiExpiry) ? "text-red-600" : undefined}>
                {formatDate(user.aajiExpiry)}
              </span>
            }
          />
          <InfoItem label="Nomor Polis" value={user.policyNumber} />
          <InfoItem label="Premi" value={formattedPremium} />
          <InfoItem label="Jatuh Tempo Premi" value={formatDate(user.premiumDueDate)} />
        </dl>
      </CardContent>
    </Card>
  );
}
