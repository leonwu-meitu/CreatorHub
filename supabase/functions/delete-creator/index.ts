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

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const authorization = request.headers.get("Authorization");
    if (!authorization) return json({ error: "Authentication required" }, 401);

    const body = await request.json();
    const creatorId = typeof body?.creatorId === "string" ? body.creatorId : "";
    if (!uuidPattern.test(creatorId)) return json({ error: "A valid Creator ID is required" }, 400);

    const supabaseUrl = requiredSecret("SUPABASE_URL");
    const anonKey = requiredSecret("SUPABASE_ANON_KEY");
    const serviceRoleKey = requiredSecret("SUPABASE_SERVICE_ROLE_KEY");
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false },
    });
    const { data: userResult, error: userError } = await authClient.auth.getUser();
    if (userError || !userResult.user) return json({ error: "Invalid session" }, 401);
    if (userResult.user.id === creatorId) return json({ error: "You cannot delete your own Team account" }, 409);

    const admin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } });
    const [{ data: caller }, { data: target, error: targetError }] = await Promise.all([
      admin.from("profiles").select("role").eq("id", userResult.user.id).maybeSingle(),
      admin.from("profiles").select("id,role,email").eq("id", creatorId).maybeSingle(),
    ]);
    if (caller?.role !== "marketing_admin") return json({ error: "Team access required" }, 403);
    if (targetError || !target) return json({ error: "Creator account not found" }, 404);
    if (target.role === "marketing_admin") return json({ error: "Marketing administrator accounts cannot be deleted from the Creator directory" }, 409);

    const [{ data: submissions }, { data: settings }] = await Promise.all([
      admin.from("campaign_submissions").select("evidence_key").eq("creator_id", creatorId),
      admin.from("creator_profile_settings").select("avatar_key").eq("creator_id", creatorId).maybeSingle(),
    ]);
    const evidenceKeys = (submissions || []).map((row: any) => row.evidence_key).filter(Boolean);
    if (evidenceKeys.length) await admin.storage.from("submission-evidence").remove(evidenceKeys);
    if (settings?.avatar_key) await admin.storage.from("creator-avatars").remove([settings.avatar_key]);

    const { error: deleteError } = await admin.auth.admin.deleteUser(creatorId);
    if (deleteError) throw deleteError;

    return json({ deleted: true, creatorId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "The Creator account could not be deleted";
    return json({ error: message }, 500);
  }
});
