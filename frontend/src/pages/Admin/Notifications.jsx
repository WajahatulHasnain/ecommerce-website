import React, { useEffect, useState } from "react";
import api from "../../utils/api";

export default function Notifications() {
  const [notes, setNotes] = useState([]);
  useEffect(()=> {
    api.get("/admin/notifications").then(res => setNotes(res.data)).catch(()=>{});
  }, []);

  const mark = (id) => {
    api.put(`/admin/notifications/${id}/read`).then(res => setNotes(n => n.map(x=> x._id===id?res.data:x)));
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Notifications</h2>
      <div className="bg-white rounded shadow p-4">
        {notes.map(n => (
          <div key={n._id} className="py-2 border-b flex justify-between items-center">
            <div>
              <div className="font-medium">{n.message}</div>
              <div className="text-xs text-gray-500">{new Date(n.createdAt).toLocaleString()}</div>
            </div>
            <div>
              {!n.read && <button onClick={()=>mark(n._id)} className="text-sm text-indigo-600">Mark read</button>}
            </div>
          </div>
        ))}
        {notes.length===0 && <div>No notifications</div>}
      </div>
    </div>
  );
}
