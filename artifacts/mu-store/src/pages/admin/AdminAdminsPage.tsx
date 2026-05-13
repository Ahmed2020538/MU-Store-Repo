import { useState, useEffect } from "react";
import { Plus, Trash2, UserX, RefreshCw, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const PERMISSIONS = [
  { key: "viewOrders",      label: "View Orders" },
  { key: "manageProducts",  label: "Manage Products" },
  { key: "manageCustomers", label: "Manage Customers" },
  { key: "viewAnalytics",   label: "View Analytics" },
  { key: "manageSettings",  label: "Manage Settings" },
  { key: "manageAdmins",    label: "Manage Admins" },
];

const DEFAULT_PERMS = { viewOrders: true, manageProducts: true, manageCustomers: true, viewAnalytics: true, manageSettings: false, manageAdmins: false };

function genPassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#";
  return "MU@" + Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "" });
  const [perms, setPerms] = useState({ ...DEFAULT_PERMS });

  const token = () => localStorage.getItem("mu_token");

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch("/api/admin/admins", { headers: { Authorization: `Bearer ${token()}` } });
      if (r.ok) setAdmins(await r.json());
    } catch { toast.error("Failed to load admins"); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { toast.error("Fill all required fields"); return; }
    if (form.password !== form.confirmPassword) { toast.error("Passwords don't match"); return; }
    setSaving(true);
    try {
      const r = await fetch("/api/admin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token()}` },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, permissions: perms }),
      });
      if (r.ok) {
        toast.success("Admin created & welcome email sent");
        setShowModal(false);
        setForm({ name: "", email: "", password: "", confirmPassword: "" });
        setPerms({ ...DEFAULT_PERMS });
        load();
      } else {
        const d = await r.json();
        toast.error(d.error ?? "Failed to create admin");
      }
    } catch { toast.error("Request failed"); }
    setSaving(false);
  };

  const handleDeactivate = async (id: number, email: string) => {
    if (email === "admin@mu.com") { toast.error("Cannot deactivate root admin"); return; }
    if (!confirm(`Deactivate this admin?`)) return;
    const r = await fetch(`/api/admin/admins/${id}/deactivate`, { method: "PUT", headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) { toast.success("Admin deactivated"); load(); } else toast.error("Failed");
  };

  const handleDelete = async (id: number, email: string) => {
    if (email === "admin@mu.com") { toast.error("Cannot delete root admin"); return; }
    if (!confirm(`Delete this admin permanently?`)) return;
    const r = await fetch(`/api/admin/admins/${id}`, { method: "DELETE", headers: { Authorization: `Bearer ${token()}` } });
    if (r.ok) { toast.success("Admin deleted"); load(); } else toast.error("Failed");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl font-bold">Admin Management</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw size={14} className="mr-1.5" />Refresh</Button>
          <Button size="sm" className="bg-foreground text-background hover:opacity-90" onClick={() => setShowModal(true)}>
            <Plus size={14} className="mr-1.5" />Add Admin
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>{["Name", "Email", "Created At", "Status", "Actions"].map(h =>
              <th key={h} className="text-left px-4 py-3 font-medium text-muted-foreground text-xs whitespace-nowrap">{h}</th>)}</tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading ? <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Loading...</td></tr>
            : admins.map(a => (
              <tr key={a.id} className="hover:bg-muted/30">
                <td className="px-4 py-3 font-medium">{a.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{a.email}</td>
                <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                  {a.adminCreatedAt ? new Date(a.adminCreatedAt).toLocaleDateString() : new Date(a.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${a.role === "admin" ? "bg-purple-100 text-purple-800" : "bg-gray-100 text-gray-600"}`}>
                    {a.role === "admin" ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {a.email !== "admin@mu.com" && (
                    <div className="flex gap-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => handleDeactivate(a.id, a.email)} title="Deactivate"><UserX size={14} /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(a.id, a.email)} title="Delete"><Trash2 size={14} /></Button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-background rounded-2xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="font-serif text-xl font-bold">Add New Admin</h3>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>Full Name <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ahmed Ali" />
              </div>
              <div className="space-y-1.5">
                <Label>Email <span className="text-destructive">*</span></Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ahmed@example.com" />
              </div>
              <div className="space-y-1.5">
                <Label>Password <span className="text-destructive">*</span></Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input type={showPass ? "text" : "password"} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder="Min 8 characters" />
                    <button type="button" onClick={() => setShowPass(v => !v)} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={() => setForm(f => ({ ...f, password: genPassword(), confirmPassword: genPassword() }))}>Auto</Button>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Confirm Password</Label>
                <Input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} placeholder="••••••••" />
              </div>
              <div className="space-y-2">
                <Label>Permissions</Label>
                <div className="grid grid-cols-2 gap-2">
                  {PERMISSIONS.map(p => (
                    <label key={p.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <input type="checkbox" checked={(perms as any)[p.key]} onChange={e => setPerms(prev => ({ ...prev, [p.key]: e.target.checked }))} className="rounded" />
                      {p.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowModal(false)}>Cancel</Button>
              <Button className="flex-1 bg-foreground text-background hover:opacity-90" onClick={handleCreate} disabled={saving}>
                {saving ? "Creating..." : "Create Admin"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
