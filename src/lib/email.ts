import { Resend } from "resend";

const globalForResend = globalThis as unknown as { resend: Resend | undefined };

function createResendClient(): Resend {
  return new Resend(process.env.RESEND_API_KEY ?? "re_test_placeholder");
}

export const resend = globalForResend.resend ?? createResendClient();

if (process.env.NODE_ENV !== "production") {
  globalForResend.resend = resend;
}

const fromAddress = `${process.env.EMAIL_FROM_NAME ?? "RateMyTip"} <${process.env.EMAIL_FROM ?? "noreply@ratemytip.com"}>`;
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

export async function sendPasswordResetEmail(
  email: string,
  token: string
): Promise<void> {
  const resetUrl = `${baseUrl}/reset-password?token=${token}`;

  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: "Reset your RateMyTip password",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You requested a password reset for your RateMyTip account.</p>
        <p>Click the link below to set a new password. This link expires in 1 hour.</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #2B6CB0; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Reset Password
        </a>
        <p style="color: #718096; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}

export async function sendEmailVerificationEmail(
  email: string,
  token: string
): Promise<void> {
  const verifyUrl = `${baseUrl}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: "Verify your RateMyTip email",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Verify Your Email</h2>
        <p>Welcome to RateMyTip! Please verify your email address to get started.</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 12px 24px; background: #2B6CB0; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Verify Email
        </a>
        <p style="color: #718096; font-size: 14px;">This link expires in 24 hours.</p>
      </div>
    `,
  });
}

export async function sendClaimApprovedEmail(
  email: string,
  creatorName: string
): Promise<void> {
  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: `Your claim for "${creatorName}" has been approved!`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Claim Approved!</h2>
        <p>Your claim for the creator profile <strong>${creatorName}</strong> has been approved.</p>
        <p>You can now access the Creator Dashboard to manage your profile, post tips directly, and add explanations.</p>
        <a href="${baseUrl}/creator-dashboard" style="display: inline-block; padding: 12px 24px; background: #276749; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Go to Creator Dashboard
        </a>
      </div>
    `,
  });
}

export async function sendClaimRejectedEmail(
  email: string,
  creatorName: string,
  reason?: string
): Promise<void> {
  await resend.emails.send({
    from: fromAddress,
    to: email,
    subject: `Update on your claim for "${creatorName}"`,
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Claim Not Approved</h2>
        <p>Unfortunately, your claim for the creator profile <strong>${creatorName}</strong> was not approved.</p>
        ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
        <p>If you believe this is an error, you can submit a new claim with additional proof of ownership.</p>
        <a href="${baseUrl}/leaderboard" style="display: inline-block; padding: 12px 24px; background: #2B6CB0; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
          Browse Creators
        </a>
      </div>
    `,
  });
}
