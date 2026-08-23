import type { User } from "@/lib/db";
import { getActiveWabBusinessSubscription } from "@/lib/wab-subscriptions";
import { hasWabUnlimitedRole } from "@/lib/wab-access";

export async function hasWabBusinessVideoAccess(user: User | null | undefined): Promise<boolean> {
  if (!user?.id) return false;
  if (hasWabUnlimitedRole(user.role)) return true;
  return Boolean(await getActiveWabBusinessSubscription(user.id));
}
