/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Application, AppExpansionRequest, CreatorProfile, PaymentForm, Product, Reward, Submission, Task } from "./platform-data";

export type PortalAccount = {
  id: string;
  email: string;
  fullName: string;
  role: "creator" | "team";
  applicationStatus: "in_review" | "accepted" | "declined";
  canAccessCreator: boolean;
};

type CampaignRow = {
  id:string; title:string; product:Product; reference_link?:string|null;
  tutorial_link?:string|null; deadline:string; status:string;
  task_data?:Partial<Task>|null;
};

type ProfileRow = {id:string;email?:string|null;full_name?:string|null};
type SettingsRow = {creator_id:string;display_name:string;contact_email:string;niches:string;tiktok_url?:string|null;instagram_url?:string|null;threads_url?:string|null;whatsapp?:string|null;avatar_key?:string|null;avatar_name?:string|null;updated_at?:string|null};

const initials = (name:string) => name.split(/\s+/).filter(Boolean).map(part=>part[0]).slice(0,2).join("").toUpperCase() || "CR";
const statusLabel = (value:string) => value === "accepted" ? "Accepted" : value === "declined" ? "Declined" : "In review";
const rewardStatus = (value:string) => ({payment_info_required:"Please Fill In Payment Form",approved:"Approved",in_payment:"In Payment",fully_paid:"Fully Paid",pay_fail:"Pay Fail"}[value] || "Please Fill In Payment Form");
const submissionStatus = (value:string) => ({draft:"Draft",in_review:"In review",qualified:"Qualified",not_qualified:"Not Qualified"}[value] || "In review");
const dbSubmissionStatus = (value:string) => value === "Draft" ? "draft" : value === "Qualified" || value === "Approved" ? "qualified" : value === "Not Qualified" || value === "Revision requested" ? "not_qualified" : "in_review";
const dbRewardStatus = (value:string) => ({"Please Fill In Payment Form":"payment_info_required",Approved:"approved","In Payment":"in_payment","Fully Paid":"fully_paid","Pay Fail":"pay_fail"}[value] || "payment_info_required");

export function campaignFromRow(row:CampaignRow):Task {
  const details=row.task_data||{};
  return {...details,id:row.id,title:row.title,product:row.product,referenceLink:row.reference_link||details.referenceLink||"",tutorialLink:row.tutorial_link||details.tutorialLink||"",deadline:row.deadline.slice(0,10),platform:details.platform||"TikTok · Instagram · Threads",startsAt:details.startsAt||row.deadline.slice(0,10),joined:details.joined||0,budget:0,status:row.status==="closed"?"Closed":row.status==="draft"?"Draft":"Active",progress:details.progress||0,cover:details.cover||(row.product==="Meitu"?"peach":row.product==="Wink"?"violet":"blue"),niches:details.niches||"Beauty",brief:details.brief||""};
}

export function creatorName(account:PortalAccount|null, settings?:CreatorProfile) {
  return settings?.displayName?.trim() || account?.fullName?.trim() || account?.email.split("@")[0] || "Creator";
}

export function avatarPublicUrl(client:SupabaseClient|null, key?:string) {
  if (!client || !key) return "";
  if (/^https?:\/\//.test(key)) return key;
  return client.storage.from("creator-avatars").getPublicUrl(key).data.publicUrl;
}

export async function loadPortalRecords(client:SupabaseClient, account:PortalAccount) {
  const [applicationResult,campaignResult,joinResult,submissionResult,rewardResult,settingsResult,profileResult,expansionResult,paymentResult] = await Promise.all([
    client.from("creator_applications").select("id,creator_id,status,decline_reason,submitted_at,application_data").order("submitted_at",{ascending:false}),
    client.from("campaigns").select("id,title,product,reference_link,tutorial_link,deadline,status,task_data").order("created_at",{ascending:false}),
    account.role === "creator" ? client.from("creator_campaign_joins").select("campaign_id").eq("creator_id",account.id) : Promise.resolve({data:[],error:null}),
    client.from("campaign_submissions").select("*").order("created_at",{ascending:false}),
    client.from("submission_rewards").select("*").order("created_at",{ascending:false}),
    client.from("creator_profile_settings").select("creator_id,display_name,contact_email,niches,tiktok_url,instagram_url,threads_url,whatsapp,avatar_key,avatar_name,updated_at"),
    client.from("profiles").select("id,email,full_name"),
    client.from("app_expansion_requests").select("*").order("submitted_at",{ascending:false}),
    client.from("payment_forms").select("*").order("month",{ascending:false}),
  ]);
  const firstError=[applicationResult,campaignResult,submissionResult,rewardResult,settingsResult,profileResult,expansionResult,paymentResult].find(result=>result.error)?.error;
  if(firstError)throw firstError;

  const campaigns=(campaignResult.data||[]).map(row=>campaignFromRow(row as CampaignRow));
  const campaignMap=new Map(campaigns.map(row=>[row.id,row]));
  const profiles=(profileResult.data||[]) as ProfileRow[];
  const profileMap=new Map(profiles.map(row=>[row.id,row]));
  const settings=(settingsResult.data||[]) as SettingsRow[];
  const settingsMap=new Map(settings.map(row=>[row.creator_id,row]));
  const nameFor=(id:string)=>settingsMap.get(id)?.display_name||profileMap.get(id)?.full_name||profileMap.get(id)?.email?.split("@")[0]||"Creator";

  const creatorProfiles:CreatorProfile[]=settings.map(row=>({id:row.creator_id,creator:nameFor(row.creator_id),displayName:row.display_name||nameFor(row.creator_id),contactEmail:row.contact_email||profileMap.get(row.creator_id)?.email||"",niches:row.niches||"",tiktokUrl:row.tiktok_url||"",instagramUrl:row.instagram_url||"",threadsUrl:row.threads_url||"",whatsapp:row.whatsapp||"",avatarKey:row.avatar_key||"",avatarName:row.avatar_name||"",updatedAt:row.updated_at||""}));

  const applications:Application[]=(applicationResult.data||[]).map((row:any)=>{const raw=(row.application_data||{}) as Application;const name=raw.name||nameFor(row.creator_id);return {...raw,id:row.id,creatorId:row.creator_id,name,avatar:raw.avatar||initials(name),email:raw.email||profileMap.get(row.creator_id)?.email||"",status:statusLabel(row.status),declineReason:row.decline_reason||"",submitted:row.submitted_at};});

  const submissions:Submission[]=(submissionResult.data||[]).map((row:any)=>{const campaign=campaignMap.get(row.campaign_id);const name=nameFor(row.creator_id);return {id:row.id,creatorId:row.creator_id,campaignId:row.campaign_id,creator:name,task:campaign?.title||"Campaign",product:campaign?.product||"Meitu",platform:row.platform,views:Number(row.declared_views||0),aiViews:Number(row.verified_views??row.declared_views??0),totalEngagement:row.total_engagement==null?0:Number(row.total_engagement),analyticsStatus:row.analytics_status||"pending",analyticsError:row.analytics_error||"",analyticsModel:row.analytics_model||"",analyticsProcessedAt:row.analytics_processed_at||"",analyticsAttemptCount:Number(row.analytics_attempt_count||0),recommendation:row.recommendation||"Manual review",confidence:Number(row.confidence||0),status:submissionStatus(row.status),submitted:row.created_at,submittedAt:row.created_at,avatar:initials(name),postUrl:row.post_url||"",publishedAt:row.published_at||"",boostCode:row.boost_code||"",evidenceKey:row.evidence_key||"",evidenceName:row.evidence_name||"",engagementRate:row.engagement_rate==null?0:Number(row.engagement_rate),whatsapp:settingsMap.get(row.creator_id)?.whatsapp||"",qualificationReason:row.qualification_reason||""};});
  const submissionMap=new Map((submissionResult.data||[]).map((row:any)=>[row.id,row]));
  const rewards:Reward[]=(rewardResult.data||[]).map((row:any)=>{const submission:any=submissionMap.get(row.submission_id);const campaign=campaignMap.get(row.campaign_id);return {id:row.id,submissionId:row.submission_id,creatorId:row.creator_id,campaignId:row.campaign_id,creator:nameFor(row.creator_id),task:campaign?.title||"Campaign",product:campaign?.product||"Meitu",views:Number(submission?.verified_views??submission?.declared_views??0),type:row.reward_type,amount:Number(row.amount_idr||0),status:rewardStatus(row.payment_status),paymentFormChecked:row.payment_form_checked?1:0,paidAt:row.paid_at||"",failureReason:row.failure_reason||"",vipCode:row.vip_code||""};});

  const appExpansionRequests:AppExpansionRequest[]=(expansionResult.data||[]).map((row:any)=>({id:row.id,creatorId:row.creator_id,creator:nameFor(row.creator_id),currentApps:(row.current_apps||[]).join(","),requestedApps:(row.requested_apps||[]).join(","),reason:row.reason,status:statusLabel(row.status),submitted:row.submitted_at,declineReason:row.decline_reason||""}));
  const paymentForms:PaymentForm[]=(paymentResult.data||[]).map((row:any)=>({id:row.id,product:row.product,month:String(row.month).slice(0,7),url:row.url,updatedAt:row.updated_at}));

  return {applications,campaigns,submissions,rewards,creatorProfiles,appExpansionRequests,paymentForms,joinedCampaignIds:(joinResult.data||[]).map((row:any)=>row.campaign_id)};
}

export async function saveSubmissionRecord(client:SupabaseClient, accountId:string, task:Task, submission:Submission) {
  const record={campaign_id:task.id,creator_id:accountId,platform:submission.platform,post_url:submission.postUrl||"",published_at:submission.publishedAt,declared_views:submission.views,boost_code:submission.boostCode||null,evidence_key:submission.evidenceKey||null,evidence_name:submission.evidenceName||null,status:dbSubmissionStatus(submission.status),analytics_status:"pending",recommendation:null,confidence:null};
  const {data,error}=await client.from("campaign_submissions").insert(record).select("id,created_at").single();
  if(error)throw error;
  return {...submission,id:data.id,submitted:data.created_at,submittedAt:data.created_at,analyticsStatus:"Pending verification",recommendation:"Manual review",confidence:0};
}

export async function analyzeSubmissionRecord(client:SupabaseClient, submissionId:string, force=false) {
  const {data,error}=await client.functions.invoke("analyze-submission-analytics",{body:{submissionId,force}});
  if(error)throw error;
  if(data?.error)throw new Error(data.error);
  const row=data?.submission;
  if(!row)return null;
  return {
    aiViews:Number(row.verified_views||0),
    totalEngagement:Number(row.total_engagement||0),
    engagementRate:Number(row.engagement_rate||0),
    analyticsStatus:String(row.analytics_status||"ai_needs_review"),
    analyticsError:String(row.analytics_error||""),
    analyticsModel:String(row.analytics_model||""),
    analyticsProcessedAt:String(row.analytics_processed_at||""),
    analyticsAttemptCount:Number(row.analytics_attempt_count||0),
    recommendation:String(row.recommendation||"Manual review required"),
    confidence:Number(row.confidence||0),
  } satisfies Partial<Submission>;
}

export async function deleteCreatorAccount(client:SupabaseClient, creatorId:string) {
  const {data,error}=await client.functions.invoke("delete-creator",{body:{creatorId}});
  if(error)throw error;
  if(data?.error)throw new Error(String(data.error));
  if(!data?.deleted)throw new Error("The Creator account could not be deleted.");
  return true;
}

export async function updateSubmissionRecord(client:SupabaseClient, submission:Submission) {
  const {error}=await client.from("campaign_submissions").update({status:dbSubmissionStatus(submission.status),verified_views:submission.aiViews||submission.views,total_engagement:submission.totalEngagement||null,engagement_rate:submission.engagementRate||null,analytics_status:submission.analyticsStatus||"manual_review",recommendation:submission.recommendation||"Manual review",confidence:submission.confidence||0,qualification_reason:submission.qualificationReason||null,evidence_key:submission.evidenceKey||null,evidence_name:submission.evidenceName||null,updated_at:new Date().toISOString()}).eq("id",submission.id);
  if(error)throw error;
}

export async function upsertRewardRecord(client:SupabaseClient, reward:Reward, submission:Submission, task:Task) {
  const {data:source,error:sourceError}=await client.from("campaign_submissions").select("creator_id,campaign_id").eq("id",submission.id).single();
  if(sourceError)throw sourceError;
  const paymentStatus=dbRewardStatus(reward.status);
  const record={submission_id:submission.id,creator_id:source.creator_id,campaign_id:source.campaign_id||task.id,reward_type:reward.type,amount_idr:reward.amount,payment_status:paymentStatus,payment_form_checked:Boolean(reward.paymentFormChecked),paid_at:reward.paidAt||null,failure_reason:reward.failureReason||null,vip_code:reward.vipCode||null,updated_at:new Date().toISOString()};
  const {data,error}=await client.from("submission_rewards").upsert(record,{onConflict:"submission_id"}).select("id").single();
  if(error)throw error;
  return {...reward,id:data.id};
}
