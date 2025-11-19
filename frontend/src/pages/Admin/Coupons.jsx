import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function Coupons() {
  const [coupons, setCoupons] = useState([]);
  useEffect(()=> {
    api.get("/admin/coupons").then(res => setCoupons(res.data)).catch(()=>{});
  }, []);

  const create = async () => {
    const code = prompt("Code (e.g. SAVE10)");
    const type = prompt("Type (percent|fixed)", "percent");
    const value = parseFloat(prompt("Value (e.g. 10)"));
    if (!code || isNaN(value)) return;
    const res = await api.post("/admin/coupons", { code, type, value });
    setCoupons(c => [res.data, ...c]);
  };

  const remove = async (id) => {
    if (!confirm("Delete coupon?")) return;
    await api.delete(`/admin/coupons/${id}`);
    setCoupons(c => c.filter(x => x._id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Coupons</h2>
        <button onClick={create} className="px-3 py-1 bg-indigo-600 text-white rounded">Create</button>
      </div>
      <div className="bg-white rounded shadow p-4">
        {coupons.map(c => (
          <div key={c._id} className="py-2 border-b flex justify-between items-center">
            <div>
              <div className="font-medium">{c.code} — {c.type} {c.value}</div>
              <div className="text-xs text-gray-500">Active: {c.active ? "Yes":"No"}</div>
            </div>
            <button onClick={()=> remove(c._id)} className="text-red-600">Delete</button>
          </div>
        ))}
        {coupons.length===0 && <div>No coupons</div>}
      </div>
    </div>
  );
}
