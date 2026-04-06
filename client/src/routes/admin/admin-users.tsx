import { useEffect, useState } from "react";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/admin/users")
      .then((r) => r.json())
      .then((d) => setUsers(d))
      .catch(() => setUsers([]));
  }, []);

  const updateRole = async (userId: string, action: string) => {
    await fetch(`/api/admin/users/${userId}/${action}`, { method: "POST" });
    setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: action === "promote" ? "admin" : "user" } : u));
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">User Management</h1>
      {users.length === 0 ? (
        <div className="card text-center py-12 text-surface-500">No users found.</div>
      ) : (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-surface-800 text-left text-surface-500">
                <th className="py-2 px-3">Username</th>
                <th className="py-2 px-3">Email</th>
                <th className="py-2 px-3">Role</th>
                <th className="py-2 px-3">Verified</th>
                <th className="py-2 px-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-surface-800/50">
                  <td className="py-2 px-3 font-medium">{u.username}</td>
                  <td className="py-2 px-3 text-surface-500">{u.email}</td>
                  <td className="py-2 px-3">{u.role}</td>
                  <td className="py-2 px-3">{u.email_verified ? "✓" : "✗"}</td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2">
                      {u.role !== "admin" && (
                        <button onClick={() => updateRole(u.id, "promote")} className="text-xs text-green-400 hover:underline">Promote</button>
                      )}
                      {u.role === "admin" && (
                        <button onClick={() => updateRole(u.id, "demote")} className="text-xs text-yellow-400 hover:underline">Demote</button>
                      )}
                      {!u.email_verified && (
                        <button onClick={() => updateRole(u.id, "verify-email")} className="text-xs text-blue-400 hover:underline">Verify</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
