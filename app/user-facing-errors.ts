export type ErrorContext =
  | "application"
  | "app-expansion"
  | "campaign"
  | "campaign-join"
  | "profile"
  | "submission"
  | "reward"
  | "generic";

type ErrorDetails = {
  code?: unknown;
  message?: unknown;
  details?: unknown;
  hint?: unknown;
  status?: unknown;
};

const duplicateMessages: Record<ErrorContext, string> = {
  application: "You have already sent a creator application. Please wait for the Team’s review.",
  "app-expansion": "You already have an application for this app under review.",
  campaign: "A campaign with this information already exists.",
  "campaign-join": "You have already joined this campaign.",
  profile: "This email has already been registered. Please try using a different email.",
  submission: "This post has already been submitted for this campaign.",
  reward: "A reward has already been created for this submission.",
  generic: "This information has already been submitted.",
};

const readableError = (error: unknown) => {
  if (typeof error === "string") return { raw: error, code: "", status: 0 };
  if (!error || typeof error !== "object") return { raw: "", code: "", status: 0 };
  const value = error as ErrorDetails;
  return {
    raw: [value.message, value.details, value.hint].filter(item => typeof item === "string").join(" "),
    code: typeof value.code === "string" ? value.code : "",
    status: typeof value.status === "number" ? value.status : 0,
  };
};

export function userFacingError(
  error: unknown,
  fallback = "Something went wrong. Please try again.",
  context: ErrorContext = "generic",
) {
  const { raw, code, status } = readableError(error);
  const normalized = raw.toLowerCase();

  if (normalized.includes("creator_application_already_accepted")) return "Your Creator Pool application has already been accepted. You do not need to apply again.";
  if (normalized.includes("campaign_submission_limit_reached")) return "Submission limit reached. You can submit a maximum of 3 posts per campaign.";
  if (code === "23505" || normalized.includes("duplicate key") || normalized.includes("already exists")) return duplicateMessages[context];
  if (status === 429 || normalized.includes("rate limit") || normalized.includes("too many requests")) return "Too many attempts were made. Please wait a moment and try again.";
  if (normalized.includes("token_key") || normalized.includes("refresh_token") || normalized.includes("jwt") || normalized.includes("token has expired") || normalized.includes("invalid token")) return "Your sign-in session has expired. Please sign in again and retry this action.";
  if (normalized.includes("access_denied") || normalized.includes("access denied")) return "Google sign-in was cancelled or this account is not allowed to access CreatorHub.";
  if (normalized.includes("provider") && normalized.includes("disabled")) return "Google sign-in is temporarily unavailable. Please contact the Creator Pool team.";
  if (normalized.includes("email not confirmed")) return "Please confirm your email address before signing in.";
  if (normalized.includes("invalid login credentials")) return "The email or password is incorrect. Please try again.";
  if (code === "42501" || normalized.includes("row-level security") || normalized.includes("permission denied")) return "You do not have permission to complete this action. Please sign in with the correct account.";
  if (code === "23503" || normalized.includes("foreign key constraint")) return "This item is still connected to another record and cannot be changed yet.";
  if (normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("load failed")) return "CreatorHub could not connect to the server. Check your internet connection and try again.";
  if (normalized.includes("not found") || status === 404) return "This item is no longer available. Refresh the page and try again.";
  if (normalized.includes("file size") || normalized.includes("maximum allowed size")) return "This file is too large. Please upload an image smaller than 8 MB.";
  if (normalized.includes("mime type") || normalized.includes("unsupported media")) return "This file format is not supported. Please upload a JPG, PNG, or WEBP image.";
  return fallback;
}
