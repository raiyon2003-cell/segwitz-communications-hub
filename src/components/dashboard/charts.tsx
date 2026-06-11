"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

interface ChartsProps {
  mostUsedTemplates: Array<{ name: string; count: number }>;
  emailsByDepartment: Array<{ name: string; count: number }>;
}

export function DashboardCharts({
  mostUsedTemplates,
  emailsByDepartment,
}: ChartsProps) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">Most Used Templates</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={mostUsedTemplates}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis dataKey="name" tick={{ fontSize: 11 }} />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h3 className="mb-4 text-sm font-medium">Emails by Department</h3>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={emailsByDepartment}
              dataKey="count"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
              label={({ name, percent }) =>
                `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
              }
            >
              {emailsByDepartment.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
