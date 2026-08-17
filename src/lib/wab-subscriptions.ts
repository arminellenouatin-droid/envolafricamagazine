import fs from "fs";
import path from "path";

const FILE = path.join(process.cwd(), "src", "data", "wab-subscriptions.json");

export type WabSubscription = {
  id: string;
  userId: string;
  planId: "wab-business";
  amountXof: 5000;
  currency: "XOF";
  status: "pending" | "active" | "expired" | "cancelled" | "failed";
  paymentId?: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
};

function reconcile(items: WabSubscription[]) {
  const now = Date.now();
  return items.map((item) => item.status === "active" && item.endDate && Date.parse(item.endDate) <= now ? { ...item, status: "expired" as const } : item);
}

export function readWabSubscriptions(): WabSubscription[] {
  try {
    if (!fs.existsSync(FILE)) {
      fs.mkdirSync(path.dirname(FILE), { recursive: true });
      fs.writeFileSync(FILE, "[]\n");
    }
    return reconcile(JSON.parse(fs.readFileSync(FILE, "utf8")) as WabSubscription[]);
  } catch {
    return [];
  }
}

export function writeWabSubscriptions(items: WabSubscription[]) {
  fs.mkdirSync(path.dirname(FILE), { recursive: true });
  fs.writeFileSync(FILE, JSON.stringify(items, null, 2));
}

export function getActiveWabBusinessSubscription(userId: string) {
  return readWabSubscriptions().find((item) => item.userId === userId && item.planId === "wab-business" && item.status === "active" && (!item.endDate || Date.parse(item.endDate) > Date.now())) ?? null;
}
