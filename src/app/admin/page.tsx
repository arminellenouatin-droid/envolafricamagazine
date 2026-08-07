import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifyToken, COOKIE_NAME } from "@/lib/auth";
import { readDB } from "@/lib/db";
import AdminDashboardClient from "./AdminClient";

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  const decoded = verifyToken(token);
  if (!decoded) return null;
  const db = readDB();
  return db.users.find(u=>u.id===decoded.id) || null;
}

export default async function AdminPage() {
  const user = await getUser();
  if (!user) redirect("/auth/login");
  if (!["admin","gerant","redacteur_chef","redacteur"].includes(user.role)) redirect("/");

  const db = readDB();
  const stats = {
    users: db.users.length,
    articles: db.articles.length,
    magazines: db.magazines.length,
    orders: db.orders.length,
    paidOrders: db.orders.filter(o=>o.status==="paid").length,
    totalRevenue: db.orders.filter(o=>o.status==="paid").reduce((s,o)=>s+o.total,0),
    donations: db.donations.filter(d=>d.status==="paid").reduce((s,d)=>s+d.amount,0),
    affiliateEarnings: db.affiliateEarnings.reduce((s,e)=>s+e.commission,0),
    subscribers: db.users.filter(u=>u.subscription?.status==="active").length,
  };

  return <AdminDashboardClient user={user} stats={stats} db={db} />;
}
