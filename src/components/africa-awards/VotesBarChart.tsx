"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export interface VotesBarChartProps {
  stats: Array<{ name: string; votes: number }>;
}

export default function VotesBarChart({ stats }: VotesBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={stats}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2a35" />
        <XAxis dataKey="name" stroke="#A8A6A0" fontSize={11} />
        <YAxis stroke="#A8A6A0" fontSize={11} />
        <Tooltip contentStyle={{ backgroundColor: "#16161D", borderColor: "#333", borderRadius: 8, fontSize: 12 }} />
        <Bar dataKey="votes" fill="#D4AF37" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
