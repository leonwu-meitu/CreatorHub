/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const requiredSecret = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`Missing server secret: ${name}`);
  return value;
};

const escapeHtml = (value: string) =>
  value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);

const toBase64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

const toBase64Url = (value: string) =>
  toBase64(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");

const emailHtml = ({
  name,
  status,
  reason,
  portalUrl,
}: {
  name: string;
  status: "accepted" | "declined";
  reason: string;
  portalUrl: string;
}) => {
  const safeName = escapeHtml(name || "Creator");
  const safePortalUrl = escapeHtml(portalUrl);
  const safeReason = escapeHtml(reason);

  if (status === "accepted") {
    return `<!doctype html><html><body style="margin:0;background:#f7f4f1;font-family:Arial,sans-serif;color:#1d1720"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #eadfe4;border-radius:20px;overflow:hidden"><tr><td style="height:8px;background:#f11d48"></td></tr><tr><td style="padding:38px"><p style="margin:0 0 12px;color:#f11d48;font-size:12px;font-weight:700;letter-spacing:2px">CREATORHUB</p><h1 style="margin:0 0 20px;font-size:30px">Selamat, ${safeName}!</h1><p style="font-size:16px;line-height:1.7">Pendaftaranmu telah diterima. Kamu sekarang resmi bergabung dengan Creator Pool untuk mengakses campaign, mengirim konten, dan mendapatkan reward.</p><p style="font-size:16px;line-height:1.7">Your application has been accepted. You can now access CreatorHub campaigns, submissions, and rewards.</p><p style="margin:30px 0"><a href="${safePortalUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#f11d48;color:#fff;text-decoration:none;font-weight:700">Open CreatorHub</a></p><p style="margin:30px 0 0;color:#766b74;font-size:13px;line-height:1.6">Email ini dikirim otomatis oleh CreatorHub. Balas email ini jika kamu membutuhkan bantuan.</p></td></tr></table></td></tr></table></body></html>`;
  }

  return `<!doctype html><html><body style="margin:0;background:#f7f4f1;font-family:Arial,sans-serif;color:#1d1720"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #eadfe4;border-radius:20px;overflow:hidden"><tr><td style="height:8px;background:#f11d48"></td></tr><tr><td style="padding:38px"><p style="margin:0 0 12px;color:#f11d48;font-size:12px;font-weight:700;letter-spacing:2px">CREATORHUB</p><h1 style="margin:0 0 20px;font-size:30px">Update on Your Meitu CreatorHub Application</h1><p style="font-size:16px;line-height:1.7">Hi ${safeName}, thank you for your interest in joining Meitu CreatorHub. After reviewing your application, our Team is unable to accept it at this time.</p><div style="margin:24px 0;padding:18px;border-radius:14px;background:#fff2f4"><strong>Reason for declining:</strong><p style="margin:8px 0 0;line-height:1.6">${safeReason || "The application does not currently meet the Creator Pool requirements."}</p></div><p style="font-size:16px;line-height:1.7">You can sign in to CreatorHub to review your latest application status.</p><p style="margin:30px 0"><a href="${safePortalUrl}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#1d1720;color:#fff;text-decoration:none;font-weight:700">Open CreatorHub</a></p><p style="margin:30px 0 0;color:#766b74;font-size:13px;line-height:1.6">This is an automated notification from Meitu CreatorHub. Reply to this email if you need assistance.</p></td></tr></table></td></tr></table></body></html>`;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let applicationId = "";
  let admin: ReturnType<typeof createClient> | null = null;

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);

    const body = await request.json();
    applicationId = typeof body?.applicationId === "string" ? body.applicationId : "";
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(applicationId)) {
      return json({ error: "A valid application ID is required" }, 400);
    }

    const supabaseUrl = requiredSecret("SUPABASE_URL");
    const anonKey = requiredSecret("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredSecret("SUPABASE_SERVICE_ROLE_KEY");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });

    const { data: userResult, error: userError } = await authClient.auth.getUser();
    if (userError || !userResult.user) return json({ error: "Invalid session" }, 401);

    admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const { data: callerProfile, error: profileError } = await admin
      .from("profiles")
      .select("role")
      .eq("id", userResult.user.id)
      .single();
    if (profileError || callerProfile?.role !== "marketing_admin") {
      return json({ error: "Team access required" }, 403);
    }

    const { data: application, error: applicationError } = await admin
      .from("creator_applications")
      .select("id,creator_id,status,decline_reason,application_data,decision_email_status,decision_email_sent_at")
      .eq("id", applicationId)
      .single();
    if (applicationError || !application) return json({ error: "Application not found" }, 404);
    if (application.status !== "accepted" && application.status !== "declined") {
      return json({ error: "A final application decision is required" }, 409);
    }
    if (application.decision_email_status === application.status && application.decision_email_sent_at) {
      return json({ sent: true, duplicate: true });
    }

    const applicationData = application.application_data || {};
    const { data: creatorProfile } = await admin
      .from("profiles")
      .select("email,full_name")
      .eq("id", application.creator_id)
      .maybeSingle();
    const recipient = String(applicationData.email || creatorProfile?.email || "").trim();
    const name = String(applicationData.name || creatorProfile?.full_name || "Creator").trim();
    if (!recipient || !recipient.includes("@")) throw new Error("Creator email address is missing or invalid");

    await admin.from("creator_applications").update({
      decision_email_attempted_at: new Date().toISOString(),
      decision_email_error: null,
    }).eq("id", applicationId);

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: requiredSecret("GMAIL_CLIENT_ID"),
        client_secret: requiredSecret("GMAIL_CLIENT_SECRET"),
        refresh_token: requiredSecret("GMAIL_REFRESH_TOKEN"),
        grant_type: "refresh_token",
      }),
    });
    const tokenPayload = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenPayload.access_token) {
      throw new Error(`Gmail authorization failed (${tokenPayload.error || tokenResponse.status})`);
    }

    const senderEmail = requiredSecret("GMAIL_SENDER_EMAIL");
    const senderName = requiredSecret("GMAIL_SENDER_NAME");
    const portalUrl = requiredSecret("CREATORHUB_URL");
    const subject = application.status === "accepted"
      ? "Selamat! Pendaftaran Creator Pool kamu diterima"
      : "Update on Your Meitu CreatorHub Application";
    const html = emailHtml({
      name,
      status: application.status,
      reason: String(application.decline_reason || ""),
      portalUrl,
    });
    const message = [
      `From: ${senderName} <${senderEmail}>`,
      `Reply-To: ${senderEmail}`,
      `To: ${recipient}`,
      `Subject: =?UTF-8?B?${toBase64(subject)}?=`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=UTF-8",
      "Content-Transfer-Encoding: base64",
      "",
      toBase64(html),
    ].join("\r\n");

    const gmailResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenPayload.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw: toBase64Url(message) }),
    });
    const gmailPayload = await gmailResponse.json();
    if (!gmailResponse.ok) {
      throw new Error(`Gmail delivery failed (${gmailPayload.error?.message || gmailResponse.status})`);
    }

    const sentAt = new Date().toISOString();
    await admin.from("creator_applications").update({
      decision_email_status: application.status,
      decision_email_sent_at: sentAt,
      decision_email_attempted_at: sentAt,
      decision_email_error: null,
    }).eq("id", applicationId);

    return json({ sent: true, duplicate: false });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown email delivery error";
    if (admin && applicationId) {
      await admin.from("creator_applications").update({
        decision_email_attempted_at: new Date().toISOString(),
        decision_email_error: message.slice(0, 500),
      }).eq("id", applicationId);
    }
    return json({ error: message }, 500);
  }
});
