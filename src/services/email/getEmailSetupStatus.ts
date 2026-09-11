import { getAppUrl } from "@/lib/qr";

export interface EmailSetupStatus {
  apiKeyConfigured: boolean;
  apiKeyFormatValid: boolean;
  fromAddress: string;
  senderEmail: string;
  senderDomain: string;
  appUrl: string;
  domainRegistered: boolean | null;
  domainVerified: boolean | null;
  domainsError: string | null;
  cronConfigured: boolean;
  cronSchedule: string;
}

const DEFAULT_FROM = "MDI Hub Attendance <noreply@mdihub.co.za>";

function extractEmail(fmt: string): string {
  const match = fmt.match(/<([^<>]+)>/);
  return (match ? match[1] : fmt).trim();
}

function extractDomain(email: string): string {
  return email.split("@")[1] ?? "";
}

export async function getEmailSetupStatus(): Promise<EmailSetupStatus> {
  const apiKey = process.env.RESEND_API_KEY ?? "";
  const apiKeyConfigured = Boolean(apiKey);
  const apiKeyFormatValid = apiKey.startsWith("re_") && apiKey.length >= 20;

  const senderEmail = extractEmail(process.env.EMAIL_FROM ?? DEFAULT_FROM);
  const senderDomain = extractDomain(senderEmail);

  let domainRegistered: boolean | null = null;
  let domainVerified: boolean | null = null;
  let domainsError: string | null = null;

  if (apiKeyFormatValid && senderDomain) {
    try {
      const { resend } = await import("@/lib/resend");
      const result = await resend.domains.list();
      if (result.error) {
        domainsError = result.error.message;
      } else {
        const match = result.data.data.find((d) => d.name === senderDomain);
        if (match) {
          domainRegistered = true;
          domainVerified = match.status === "verified";
        } else {
          domainRegistered = false;
          domainVerified = false;
        }
      }
    } catch (error) {
      domainsError = error instanceof Error ? error.message : "Could not fetch Resend domains";
    }
  }

  return {
    apiKeyConfigured,
    apiKeyFormatValid,
    fromAddress: process.env.EMAIL_FROM ?? DEFAULT_FROM,
    senderEmail,
    senderDomain,
    appUrl: getAppUrl(),
    domainRegistered,
    domainVerified,
    domainsError,
    cronConfigured: Boolean(process.env.CRON_SECRET),
    cronSchedule: "0 7 * * *",
  };
}