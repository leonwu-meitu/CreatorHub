/* eslint-disable @typescript-eslint/ban-ts-comment, @typescript-eslint/no-explicit-any */
// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders={"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type"};
const json=(body:Record<string,unknown>,status=200)=>new Response(JSON.stringify(body),{status,headers:{...corsHeaders,"Content-Type":"application/json"}});
const secret=(name:string)=>{const value=Deno.env.get(name)?.trim();if(!value)throw new Error(`Missing server secret: ${name}`);return value};
const escapeHtml=(value:string)=>value.replace(/[&<>'"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"}[c]||c));
const base64=(value:string)=>{let binary="";for(const byte of new TextEncoder().encode(value))binary+=String.fromCharCode(byte);return btoa(binary)};
const base64Url=(value:string)=>base64(value).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/g,"");

Deno.serve(async request=>{
  if(request.method==="OPTIONS")return new Response("ok",{headers:corsHeaders});
  if(request.method!=="POST")return json({error:"Method not allowed"},405);
  let admin:any=null;
  try{
    const authorization=request.headers.get("Authorization");if(!authorization)return json({error:"Authentication required"},401);
    const body=await request.json();const submissionId=typeof body?.submissionId==="string"?body.submissionId:"";const decision=body?.decision==="Qualified"?"Qualified":"Not Qualified";const reason=String(body?.reason||"");
    if(!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(submissionId))return json({error:"A valid submission ID is required"},400);
    const url=secret("SUPABASE_URL");const anon=secret("SUPABASE_ANON_KEY");admin=createClient(url,secret("SUPABASE_SERVICE_ROLE_KEY"),{auth:{persistSession:false}});
    const authClient=createClient(url,anon,{global:{headers:{Authorization:authorization}},auth:{persistSession:false}});const {data:userResult,error:userError}=await authClient.auth.getUser();if(userError||!userResult.user)return json({error:"Invalid session"},401);
    const {data:caller}=await admin.from("profiles").select("role").eq("id",userResult.user.id).maybeSingle();if(caller?.role!=="marketing_admin")return json({error:"Team access required"},403);
    const {data:submission,error:submissionError}=await admin.from("campaign_submissions").select("id,creator_id,campaign_id").eq("id",submissionId).single();if(submissionError||!submission)return json({error:"Submission not found"},404);
    const [{data:profile},{data:settings},{data:campaign}]=await Promise.all([
      admin.from("profiles").select("email,full_name").eq("id",submission.creator_id).maybeSingle(),
      admin.from("creator_profile_settings").select("contact_email,display_name").eq("creator_id",submission.creator_id).maybeSingle(),
      admin.from("campaigns").select("title").eq("id",submission.campaign_id).maybeSingle(),
    ]);
    const recipient=String(settings?.contact_email||profile?.email||"").trim();if(!recipient.includes("@"))throw new Error("Creator email address is missing or invalid");
    const name=String(settings?.display_name||profile?.full_name||"Creator").trim();const portalUrl=secret("CREATORHUB_URL");const safeName=escapeHtml(name);const safeReason=escapeHtml(reason);const safeCampaign=escapeHtml(String(campaign?.title||"your campaign"));
    const html=`<!doctype html><html><body style="margin:0;background:#f7f4f1;font-family:Arial,sans-serif;color:#1d1720"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#fff;border:1px solid #eadfe4;border-radius:20px;overflow:hidden"><tr><td style="height:8px;background:#f11d48"></td></tr><tr><td style="padding:38px"><p style="margin:0 0 12px;color:#f11d48;font-size:12px;font-weight:700;letter-spacing:2px">CREATORHUB</p><h1 style="margin:0 0 20px;font-size:30px">Your Submission has been updated</h1><p style="font-size:16px;line-height:1.7">Hi ${safeName}, the Team updated your submission for <b>${safeCampaign}</b> to <b>${decision}</b>.</p>${decision==="Not Qualified"?`<div style="margin:24px 0;padding:18px;border-radius:14px;background:#fff2f4"><strong>Team’s reason:</strong><p style="margin:8px 0 0;line-height:1.6">${safeReason||"Please review the submission requirements in CreatorHub."}</p></div>`:"<p style=\"font-size:16px;line-height:1.7\">Your qualified submission is now reflected in your CreatorHub history and Rewards.</p>"}<p style="font-size:16px;line-height:1.7">Sign in to check the complete submission details.</p><p style="margin:30px 0"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;padding:14px 24px;border-radius:999px;background:#1d1720;color:#fff;text-decoration:none;font-weight:700">Open CreatorHub</a></p><p style="margin:30px 0 0;color:#766b74;font-size:13px;line-height:1.6">This is an automated notification from Meitu CreatorHub.</p></td></tr></table></td></tr></table></body></html>`;
    const tokenResponse=await fetch("https://oauth2.googleapis.com/token",{method:"POST",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:new URLSearchParams({client_id:secret("GMAIL_CLIENT_ID"),client_secret:secret("GMAIL_CLIENT_SECRET"),refresh_token:secret("GMAIL_REFRESH_TOKEN"),grant_type:"refresh_token"})});const token=await tokenResponse.json();if(!tokenResponse.ok||!token.access_token)throw new Error(`Gmail authorization failed (${token.error||tokenResponse.status})`);
    const senderEmail=secret("GMAIL_SENDER_EMAIL");const senderName=secret("GMAIL_SENDER_NAME");const message=[`From: ${senderName} <${senderEmail}>`,`Reply-To: ${senderEmail}`,`To: ${recipient}`,`Subject: =?UTF-8?B?${base64("Your Submission has been updated")}?=`,`MIME-Version: 1.0`,`Content-Type: text/html; charset=UTF-8`,`Content-Transfer-Encoding: base64`,"",base64(html)].join("\r\n");
    const gmail=await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send",{method:"POST",headers:{Authorization:`Bearer ${token.access_token}`,"Content-Type":"application/json"},body:JSON.stringify({raw:base64Url(message)})});const gmailPayload=await gmail.json();if(!gmail.ok)throw new Error(`Gmail delivery failed (${gmailPayload.error?.message||gmail.status})`);
    return json({sent:true});
  }catch(error){return json({error:error instanceof Error?error.message:"Unknown email delivery error"},500)}
});
