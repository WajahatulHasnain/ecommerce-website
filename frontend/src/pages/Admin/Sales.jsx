import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function Sales() {
  const [products, setProducts] = useState([]);

  useEffect(()=> {
    api.get("/admin/products").then(res => setProducts(res.data)).catch(()=>{});
  }, []);

  const saveSale = (id) => {
    const discount = parseFloat(prompt("Discount percent (e.g. 20)"));
    if (isNaN(discount)) return;
    const start = prompt("Sale start (ISO or empty)");
    const end = prompt("Sale end (ISO or empty)");
    api.put(`/admin/products/${id}/sale`, { onSale: true, saleStart: start||null, saleEnd: end||null, discountPercent: discount })
      .then(res => setProducts(p => p.map(x => x._id===id?res.data:x)));
  };

  const removeSale = (id) => {
    api.delete(`/admin/products/${id}/sale`).then(res => setProducts(p => p.map(x => x._id===id?res.data:x)));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Sales Management</h2>
      <div className="grid gap-4">
        {products.map(p => (
          <div key={p._id} className="p-4 bg-white rounded shadow flex justify-between items-center">
            <div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm text-gray-500">${p.price} • Stock: {p.stock}</div>
              {p.onSale && <div className="text-sm text-green-600">On Sale: {p.discountPercent}%</div>}
            </div>
            <div>
              <button onClick={()=> saveSale(p._id)} className="px-3 py-1 bg-indigo-600 text-white rounded mr-2">Set Sale</button>
              {p.onSale && <button onClick={()=> removeSale(p._id)} className="px-3 py-1 bg-gray-200 rounded">Remove</button>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
