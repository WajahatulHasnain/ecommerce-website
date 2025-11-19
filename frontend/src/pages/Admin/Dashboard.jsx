import React, { useEffect, useState } from "react";
import api from "../../utils/api";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function Dashboard() {
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics/summary").then(res => setSummary(res.data)).catch(() => {});
  }, []);

  if (!summary) return <div>Loading...</div>;

  const monthly = summary.monthly.map(m => ({ name: `${m._id.year}-${m._id.month}`, revenue: m.revenue }));

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Total Sales</h3>
          <p className="text-2xl font-bold">${summary.totalSales.toFixed(2)}</p>
          <p className="text-sm text-gray-500">{summary.ordersCount} orders</p>
        </div>

        <div className="p-4 bg-white rounded shadow">
          <h3 className="font-semibold mb-2">Monthly Revenue</h3>
          <div style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <LineChart data={monthly}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#6366F1" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="mt-6 bg-white p-4 rounded shadow">
        <h3 className="font-semibold mb-2">Top Products</h3>
        <ul>
          {summary.topProducts.map(p => (
            <li key={p._id} className="py-2 border-b">{p.name || "Product"} — {p.qty} sold</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
