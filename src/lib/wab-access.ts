import type { User } from "@/lib/db";

export const WAB_BUSINESS_PLAN_ID = "mensuel";
export const WAB_BUSINESS_MONTHLY_PRICE = 5000;

export function hasWabBusinessVideoAccess(user: User | null | undefined): boolean {
  const subscription = user?.subscription;
  if (!subscription || subscription.status !== "active" || subscription.planId !== WAB_BUSINESS_PLAN_ID) return false;
  return !subscription.endDate || new Date(subscription.endDate).getTime() > Date.now();
}
