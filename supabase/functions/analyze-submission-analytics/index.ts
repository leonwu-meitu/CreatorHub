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

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const bytesToBase64 = (bytes: Uint8Array) => {
  let binary = "";
  const chunkSize = 32_768;
  for (let offset = 0; offset < bytes.length; offset += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + chunkSize));
  }
  return btoa(binary);
};

const imageMimeType = (blob: Blob, key: string) => {
  if (["image/jpeg", "image/png", "image/webp"].includes(blob.type)) return blob.type;
  const extension = key.split(".").pop()?.toLowerCase();
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  if (extension === "webp") return "image/webp";
  return null;
};

const outputText = (payload: any) => {
  if (typeof payload?.output_text === "string") return payload.output_text;
  for (const item of payload?.output || []) {
    for (const content of item?.content || []) {
      if (content?.type === "output_text" && typeof content.text === "string") return content.text;
    }
  }
  return "";
};

const nonNegativeInteger = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.round(number) : 0;
};

const analyticsSchema = {
  type: "object",
  properties: {
    valid_analytics_screenshot: { type: "boolean" },
    detected_platform: { type: "string", enum: ["TikTok", "Instagram", "Threads", "Unknown"] },
    views: { type: "integer", minimum: 0 },
    displayed_total_engagement: { type: "integer", minimum: 0 },
    likes: { type: "integer", minimum: 0 },
    comments: { type: "integer", minimum: 0 },
    shares: { type: "integer", minimum: 0 },
    saves: { type: "integer", minimum: 0 },
    reposts: { type: "integer", minimum: 0 },
    quotes: { type: "integer", minimum: 0 },
    confidence: { type: "integer", minimum: 0, maximum: 100 },
    explanation: { type: "string", maxLength: 300 },
  },
  required: [
    "valid_analytics_screenshot", "detected_platform", "views", "displayed_total_engagement",
    "likes", "comments", "shares", "saves", "reposts", "quotes", "confidence", "explanation",
  ],
  additionalProperties: false,
};

const extractionPrompt = (platform: string) => `
You verify social-media analytics screenshots for CreatorHub. The creator says this post is on ${platform}.

Read only numbers visibly present in the screenshot. Never infer, estimate, or invent missing metrics.
- views: the post/video views displayed in the screenshot, not followers, reach, or profile views.
- displayed_total_engagement: use a clearly labelled total interactions/engagement number when one is shown; otherwise return 0.
- TikTok components: likes + comments + shares + saves/favorites.
- Instagram components: likes + comments + shares + saves. Include reposts only when visibly shown as a separate post metric.
- Threads components: likes + replies (comments) + reposts + quotes/shares. If Insights shows Total interactions, place it in displayed_total_engagement.
- A compact number such as 11.9K means 11900 and 2.8M means 2800000.
- Set valid_analytics_screenshot=false when the image is not post analytics, the views are unreadable, or it clearly belongs to a different platform.
- Confidence reflects OCR readability and whether the platform and required metrics are clearly visible.

Return the structured fields only. A human Team member will make the final reward decision.`;

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  let submissionId = "";
  let admin: ReturnType<typeof createClient> | null = null;

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);

    const body = await request.json();
    submissionId = typeof body?.submissionId === "string" ? body.submissionId : "";
    const force = body?.force === true;
    if (!uuidPattern.test(submissionId)) return json({ error: "A valid submission ID is required" }, 400);

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
    const [{ data: callerProfile }, { data: submission, error: submissionError }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle(),
      admin.from("campaign_submissions").select("id,creator_id,platform,status,evidence_key,analytics_status,verified_views,total_engagement,engagement_rate,confidence,analytics_attempt_count").eq("id", submissionId).single(),
    ]);
    if (submissionError || !submission) return json({ error: "Submission not found" }, 404);

    const isTeam = callerProfile?.role === "marketing_admin";
    if (!isTeam && submission.creator_id !== userResult.user.id) return json({ error: "Submission access denied" }, 403);
    if (force && !isTeam) return json({ error: "Only Team members can retry completed analysis" }, 403);
    if (submission.status !== "in_review") return json({ error: "Only submissions in review can be analyzed" }, 409);
    if (!submission.evidence_key) return json({ error: "An analytics screenshot is required" }, 409);

    if (!force && ["ai_verified", "ai_needs_review"].includes(submission.analytics_status)) {
      return json({ analyzed: true, duplicate: true, submission });
    }
    if (!force && submission.analytics_status === "processing") {
      return json({ analyzed: false, processing: true }, 202);
    }

    const attemptCount = nonNegativeInteger(submission.analytics_attempt_count) + 1;
    const { data: claimed, error: claimError } = await admin.from("campaign_submissions").update({
      analytics_status: "processing",
      analytics_error: null,
      analytics_attempt_count: attemptCount,
      updated_at: new Date().toISOString(),
    }).eq("id", submissionId).neq("analytics_status", "processing").select("id").maybeSingle();
    if (claimError) throw claimError;
    if (!claimed) return json({ analyzed: false, processing: true }, 202);

    const { data: evidence, error: evidenceError } = await admin.storage
      .from("submission-evidence")
      .download(submission.evidence_key);
    if (evidenceError || !evidence) throw new Error("The analytics screenshot could not be read from private storage");
    if (evidence.size > 8 * 1024 * 1024) throw new Error("The analytics screenshot exceeds the 8 MB limit");

    const mimeType = imageMimeType(evidence, submission.evidence_key);
    if (!mimeType) throw new Error("Only JPG, PNG, and WEBP analytics screenshots can be analyzed");
    const imageBytes = new Uint8Array(await evidence.arrayBuffer());
    const imageDataUrl = `data:${mimeType};base64,${bytesToBase64(imageBytes)}`;
    const model = Deno.env.get("OPENAI_ANALYTICS_MODEL")?.trim() || "gpt-4.1-mini-2025-04-14";
    const openAIResponse = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${requiredSecret("OPENAI_API_KEY")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        store: false,
        max_output_tokens: 700,
        input: [{
          role: "user",
          content: [
            { type: "input_text", text: extractionPrompt(submission.platform) },
            { type: "input_image", image_url: imageDataUrl, detail: "high" },
          ],
        }],
        text: {
          format: {
            type: "json_schema",
            name: "creatorhub_analytics_extraction",
            strict: true,
            schema: analyticsSchema,
          },
        },
      }),
    });
    const openAIPayload = await openAIResponse.json();
    if (!openAIResponse.ok) {
      throw new Error(`AI analysis failed (${openAIPayload?.error?.message || openAIResponse.status})`);
    }

    const rawResult = outputText(openAIPayload);
    if (!rawResult) throw new Error("AI analysis returned no structured result");
    const extracted = JSON.parse(rawResult);
    const views = nonNegativeInteger(extracted.views);
    const displayedTotal = nonNegativeInteger(extracted.displayed_total_engagement);
    const componentTotal = ["likes", "comments", "shares", "saves", "reposts", "quotes"]
      .reduce((sum, key) => sum + nonNegativeInteger(extracted[key]), 0);
    const totalEngagement = displayedTotal > 0 ? displayedTotal : componentTotal;
    const detectedPlatform = String(extracted.detected_platform || "Unknown");
    const platformMatches = detectedPlatform === submission.platform;
    const confidence = Math.min(100, nonNegativeInteger(extracted.confidence));
    const valid = extracted.valid_analytics_screenshot === true && platformMatches && views > 0;
    const analyticsStatus = valid && confidence >= 75 ? "ai_verified" : "ai_needs_review";
    const recommendation = analyticsStatus === "ai_verified" ? "Ready for Team review" : "Manual review required";
    const processedAt = new Date().toISOString();

    const { data: updated, error: updateError } = await admin.from("campaign_submissions").update({
      verified_views: views || null,
      total_engagement: totalEngagement,
      analytics_status: analyticsStatus,
      analytics_error: valid ? null : String(extracted.explanation || "The screenshot needs manual verification").slice(0, 500),
      analytics_model: model,
      analytics_processed_at: processedAt,
      recommendation,
      confidence,
      updated_at: processedAt,
    }).eq("id", submissionId).select("verified_views,total_engagement,engagement_rate,analytics_status,recommendation,confidence,analytics_error,analytics_model,analytics_processed_at,analytics_attempt_count").single();
    if (updateError) throw updateError;

    return json({ analyzed: true, duplicate: false, submission: updated });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown analytics processing error";
    if (admin && submissionId) {
      await admin.from("campaign_submissions").update({
        analytics_status: "ai_failed",
        analytics_error: message.slice(0, 500),
        analytics_processed_at: new Date().toISOString(),
        recommendation: "Manual review required",
        updated_at: new Date().toISOString(),
      }).eq("id", submissionId);
    }
    return json({ error: "AI analytics could not be completed. The Team can retry or review the screenshot manually." }, 500);
  }
});
