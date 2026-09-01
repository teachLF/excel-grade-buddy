// قائمة حسابات المسؤولين المعتمدة دائمًا (بغضّ النظر عن جدول user_roles)
export const ADMIN_EMAILS = ["s3904844@mkhb.moe.gov.sa"] as const;

export function isAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.some(
    (a) => a.toLowerCase() === email.trim().toLowerCase()
  );
}
