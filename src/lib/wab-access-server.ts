import type { User } from "@/lib/db";
import { getActiveWabBusinessSubscription } from "@/lib/wab-subscriptions";

export function hasWabBusinessVideoAccess(user: User | null | undefined): boolean {
  return Boolean(user?.id && getActiveWabBusinessSubscription(user.id));
}
