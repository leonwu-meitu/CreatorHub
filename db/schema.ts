import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(), name: text("name").notNull(), handle: text("handle").notNull(), city: text("city").notNull(), province: text("province").notNull().default(""), category: text("category").notNull(), product: text("product").notNull(), followers: text("followers").notNull(), status: text("status").notNull(), score: integer("score").notNull().default(0), submitted: text("submitted").notNull(), avatar: text("avatar").notNull(),
  email: text("email").notNull().default(""), whatsapp: text("whatsapp").notNull().default(""), dateOfBirth: text("date_of_birth").notNull().default(""), tiktokUrl: text("tiktok_url").notNull().default(""), instagramUrl: text("instagram_url").notNull().default(""), threadsUrl: text("threads_url").notNull().default(""), tiktokFollowers: text("tiktok_followers").notNull().default(""), instagramFollowers: text("instagram_followers").notNull().default(""), threadsFollowers: text("threads_followers").notNull().default(""), interestedApps: text("interested_apps").notNull().default(""), featuresUsed: text("features_used").notNull().default(""), motivation: text("motivation").notNull().default(""), impressions: text("impressions").notNull().default(""), declineReason: text("decline_reason").notNull().default(""), ...timestamps,
});
export const tasks = sqliteTable("tasks", {
  id: text("id").primaryKey(), title: text("title").notNull(), product: text("product").notNull(), platform: text("platform").notNull(), deadline: text("deadline").notNull(), joined: integer("joined").notNull().default(0), budget: integer("budget").notNull(), status: text("status").notNull(), progress: integer("progress").notNull().default(0), cover: text("cover").notNull(), niches: text("niches").notNull().default(""), brief: text("brief").notNull().default(""), referenceLink: text("reference_link").notNull().default(""), tutorialLink: text("tutorial_link").notNull().default(""), startsAt: text("starts_at").notNull().default(""), ...timestamps,
});
export const submissions = sqliteTable("submissions", {
  id: text("id").primaryKey(), creator: text("creator").notNull(), task: text("task").notNull(), product: text("product").notNull(), platform: text("platform").notNull(), views: integer("views").notNull(), aiViews: integer("ai_views").notNull(), totalEngagement: integer("total_engagement").notNull().default(0), analyticsStatus: text("analytics_status").notNull().default("Pending AI extraction"), recommendation: text("recommendation").notNull(), confidence: integer("confidence").notNull(), status: text("status").notNull(), submitted: text("submitted").notNull(), avatar: text("avatar").notNull(), postUrl: text("post_url").notNull().default(""), publishedAt: text("published_at").notNull().default(""), boostCode: text("boost_code").notNull().default(""), evidenceKey: text("evidence_key").notNull().default(""), evidenceName: text("evidence_name").notNull().default(""), engagementRate: real("engagement_rate").notNull().default(0), whatsapp: text("whatsapp").notNull().default(""), submittedAt: text("submitted_at").notNull().default(""), qualificationReason: text("qualification_reason").notNull().default(""), ...timestamps,
});
export const creatorTasks = sqliteTable("creator_tasks", {
  id: text("id").primaryKey(), creator: text("creator").notNull(), taskId: text("task_id").notNull(), joinedAt: text("joined_at").notNull(), status: text("status").notNull().default("Joined"), ...timestamps,
}, table=>[index("idx_creator_tasks_creator").on(table.creator)]);
export const appExpansionRequests = sqliteTable("app_expansion_requests", {
  id: text("id").primaryKey(), creator: text("creator").notNull(), currentApps: text("current_apps").notNull(), requestedApps: text("requested_apps").notNull(), reason: text("reason").notNull(), status: text("status").notNull().default("In review"), submitted: text("submitted").notNull(), ...timestamps,
}, table=>[index("idx_app_expansion_requests_creator").on(table.creator)]);
export const streakRequests = sqliteTable("streak_requests", {
  id: text("id").primaryKey(), creator: text("creator").notNull(), completedTasks: integer("completed_tasks").notNull(), selectedApp: text("selected_app").notNull(), status: text("status").notNull().default("In review"), vipCode: text("vip_code").notNull().default(""), submitted: text("submitted").notNull(), reviewedAt: text("reviewed_at").notNull().default(""), startTaskCount: integer("start_task_count").notNull().default(0), startedAt: text("started_at").notNull().default(""), ...timestamps,
}, table=>[index("idx_streak_requests_creator").on(table.creator),index("idx_streak_requests_status").on(table.status)]);
export const paymentForms = sqliteTable("payment_forms", {
  id: text("id").primaryKey(), product: text("product").notNull(), month: text("month").notNull(), url: text("url").notNull(), ...timestamps,
}, table=>[index("idx_payment_forms_month_product").on(table.month,table.product)]);
export const creatorProfiles = sqliteTable("creator_profiles", {
  id: text("id").primaryKey(), creator: text("creator").notNull(), niches: text("niches").notNull().default(""), avatarKey: text("avatar_key").notNull().default(""), avatarName: text("avatar_name").notNull().default(""), threadsUrl: text("threads_url").notNull().default(""), whatsapp: text("whatsapp").notNull().default(""), ...timestamps,
}, table=>[index("idx_creator_profiles_creator").on(table.creator)]);
export const rewards = sqliteTable("rewards", {
  id: text("id").primaryKey(), creator: text("creator").notNull(), task: text("task").notNull(), product: text("product").notNull(), views: integer("views").notNull(), type: text("type").notNull(), amount: integer("amount").notNull(), status: text("status").notNull(), submissionId: text("submission_id").notNull().default(""), paymentFormChecked: integer("payment_form_checked").notNull().default(0), paidAt: text("paid_at").notNull().default(""), failureReason: text("failure_reason").notNull().default(""), ...timestamps,
});
export const auditLogs = sqliteTable("audit_logs", { id: integer("id").primaryKey({autoIncrement:true}), actor: text("actor").notNull(), action: text("action").notNull(), entity: text("entity").notNull(), entityId: text("entity_id").notNull(), payload: text("payload").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`) });
