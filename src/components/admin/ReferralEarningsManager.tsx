import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

type ReferralEarning = {
  id: string;
  referred_email: string | null;
  topup_amount_eur: number;
  bonus_eur: number;
  status: string;
  created_at: string;
};

export function ReferralEarningsManager() {
  const [rows, setRows] = useState<ReferralEarning[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .rpc("admin_list_referral_earnings")
      .then(({ data }) => {
        setRows((data as ReferralEarning[]) ?? []);
        setLoading(false);
      });
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.bonus_eur), 0);

  return (
    <div className="rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="font-semibold">Fitimet nga referimet</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {rows.length} bonuse · gjithsej {total.toFixed(2)} € të paguara
          </p>
        </div>
      </div>
      {loading ? (
        <div className="px-6 py-8 text-sm text-muted-foreground">Duke ngarkuar...</div>
      ) : rows.length === 0 ? (
        <div className="px-6 py-12 text-center text-sm text-muted-foreground">
          Nuk ka fitime nga referime ende.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase text-muted-foreground">
                <th className="px-6 py-3">Përdoruesi</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Shuma e mbushur</th>
                <th className="px-6 py-3">Bonusi i fituar</th>
                <th className="px-6 py-3">Statusi</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-6 py-4">{r.referred_email ?? "—"}</td>
                  <td className="px-6 py-4 text-xs text-muted-foreground">
                    {new Date(r.created_at).toLocaleString("sq-AL")}
                  </td>
                  <td className="px-6 py-4">{Number(r.topup_amount_eur).toFixed(2)} €</td>
                  <td className="px-6 py-4 font-semibold text-primary">
                    +{Number(r.bonus_eur).toFixed(2)} €
                  </td>
                  <td className="px-6 py-4">
                    <span className="rounded-full bg-green-500/15 px-2 py-1 text-xs font-medium text-green-500 ring-1 ring-green-500/30">
                      {r.status === "paid" ? "Paguar" : r.status}
                    </span>
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
