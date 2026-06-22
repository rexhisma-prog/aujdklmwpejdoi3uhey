import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type Service = {
  id: string;
  platform: string;
  service_type: string;
  name: string;
  price_eur: number;
  quantity: number;
  active: boolean;
  sort_order: number;
};

export function ServicesManager() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newSvc, setNewSvc] = useState({ platform: "instagram", service_type: "followers", name: "", price_eur: 0, quantity: 100 });

  const load = async () => {
    const { data } = await supabase.from("services").select("*").order("sort_order");
    setServices((data as Service[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const updateField = (id: string, field: keyof Service, value: string | number | boolean) => {
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)));
  };

  const save = async (s: Service) => {
    setSavingId(s.id);
    await supabase.from("services").update({
      name: s.name, platform: s.platform, service_type: s.service_type,
      price_eur: s.price_eur, quantity: s.quantity, active: s.active,
    }).eq("id", s.id);
    setSavingId(null);
  };

  const remove = async (id: string) => {
    if (!confirm("Fshi këtë shërbim?")) return;
    await supabase.from("services").delete().eq("id", id);
    load();
  };

  const add = async () => {
    if (!newSvc.name) return;
    setAdding(true);
    await supabase.from("services").insert({ ...newSvc, sort_order: services.length + 1 });
    setNewSvc({ platform: "instagram", service_type: "followers", name: "", price_eur: 0, quantity: 100 });
    setAdding(false);
    load();
  };

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="font-semibold">Shërbimet & çmimet</h2>
        <p className="mt-1 text-xs text-muted-foreground">Ndrysho çmimet dhe sasitë që shfaqen në panelin e klientëve.</p>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-4 py-3">Emri</th>
                <th className="px-4 py-3">Platforma</th>
                <th className="px-4 py-3">Tipi</th>
                <th className="px-4 py-3">Çmimi € / 1000</th>
                <th className="px-4 py-3">Sasi min.</th>
                <th className="px-4 py-3">Aktiv</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => (
                <tr key={s.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <input value={s.name} onChange={(e) => updateField(s.id, "name", e.target.value)}
                      className="w-full rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <input value={s.platform} list="platform-options"
                      onChange={(e) => updateField(s.id, "platform", e.target.value)}
                      className="w-32 rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <select value={s.service_type} onChange={(e) => updateField(s.id, "service_type", e.target.value)}
                      className="rounded border border-border bg-background px-2 py-1">
                      <option value="followers">Followers</option>
                      <option value="likes">Likes</option>
                      <option value="views">Views</option>
                      <option value="profile_closure">Mbyllje Fake</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" step="0.01" value={s.price_eur}
                      onChange={(e) => updateField(s.id, "price_eur", Number(e.target.value))}
                      className="w-24 rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="number" value={s.quantity}
                      onChange={(e) => updateField(s.id, "quantity", Number(e.target.value))}
                      className="w-28 rounded border border-border bg-background px-2 py-1" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={s.active}
                      onChange={(e) => updateField(s.id, "active", e.target.checked)} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => save(s)} disabled={savingId === s.id}
                      className="mr-2 rounded-lg bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
                      {savingId === s.id ? "..." : "Ruaj"}
                    </button>
                    <button onClick={() => remove(s.id)}
                      className="rounded-lg border border-border px-3 py-1 text-xs text-destructive hover:border-destructive">
                      Fshi
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border-t border-border px-6 py-4">
        <h3 className="mb-3 text-sm font-semibold">Shto shërbim të ri</h3>
        <div className="flex flex-wrap items-end gap-2">
          <input placeholder="Emri" value={newSvc.name}
            onChange={(e) => setNewSvc({ ...newSvc, name: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-sm" />
          <input placeholder="Platforma" value={newSvc.platform} list="platform-options"
            onChange={(e) => setNewSvc({ ...newSvc, platform: e.target.value })}
            className="w-32 rounded border border-border bg-background px-2 py-1 text-sm" />
          <datalist id="platform-options">
            <option value="instagram">Instagram</option>
            <option value="tiktok">TikTok</option>
            <option value="facebook">Facebook</option>
            <option value="youtube">YouTube</option>
          </datalist>
          <select value={newSvc.service_type}
            onChange={(e) => setNewSvc({ ...newSvc, service_type: e.target.value })}
            className="rounded border border-border bg-background px-2 py-1 text-sm">
            <option value="followers">Followers</option>
            <option value="likes">Likes</option>
            <option value="views">Views</option>
            <option value="profile_closure">Mbyllje Fake</option>
          </select>
          <input type="number" step="0.01" placeholder="Çmimi € / 1000" value={newSvc.price_eur}
            onChange={(e) => setNewSvc({ ...newSvc, price_eur: Number(e.target.value) })}
            className="w-24 rounded border border-border bg-background px-2 py-1 text-sm" />
          <input type="number" placeholder="Sasia" value={newSvc.quantity}
            onChange={(e) => setNewSvc({ ...newSvc, quantity: Number(e.target.value) })}
            className="w-28 rounded border border-border bg-background px-2 py-1 text-sm" />
          <button onClick={add} disabled={adding || !newSvc.name}
            className="rounded-lg bg-primary px-4 py-1.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50">
            {adding ? "..." : "Shto"}
          </button>
        </div>
      </div>
    </div>
  );
}
