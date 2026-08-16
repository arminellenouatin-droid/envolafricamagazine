"use client";
import { useEffect } from "react";
export default function OfferViewTracker({ offerId }: { offerId: string }) { useEffect(() => { const visitorId = localStorage.getItem("ea_visitor_id") || crypto.randomUUID(); localStorage.setItem("ea_visitor_id", visitorId); fetch("/api/jobs/views", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ offerId, visitorId }) }).catch(() => undefined); }, [offerId]); return null; }
