import { differenceInDays, parseISO } from 'date-fns';

export function getRoleName(role?: string) {
  const roleMap: { [key: string]: string } = {
    fc: "Financial Consultant",
    abp: "Associate Business Partner",
    bp: "Business Partner",
    admin: "Administrator",
    super_admin: "Super Administrator",
    calon_agen: "Calon Agen",
  };
  return role ? roleMap[role] || role : "—";
}

export function formatDate(dateString?: string) {
  if (!dateString) return "N/A";
  try {
    return new Date(dateString).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  } catch {
    return "Invalid Date";
  }
}

export function getLicenseStatus(aajiExpiry?: string) {
  if (!aajiExpiry) {
    return { text: "Belum Ada", variant: "destructive" as const };
  }

  try {
    const expiryDate = parseISO(aajiExpiry);
    const today = new Date();
    const daysRemaining = differenceInDays(expiryDate, today);

    if (daysRemaining < 0) {
      return { text: "Expired", variant: "destructive" as const };
    }
    if (daysRemaining <= 30) {
      return { text: `Tenggang (${daysRemaining} hari)`, variant: "secondary" as const };
    }
    return { text: "Aktif", variant: "default" as const };
  } catch {
    return { text: "Invalid Date", variant: "destructive" as const };
  }
}
