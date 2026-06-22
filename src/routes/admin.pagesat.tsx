import { createFileRoute } from "@tanstack/react-router";
import { TopupsManager } from "@/components/admin/TopupsManager";
import { ReferralEarningsManager } from "@/components/admin/ReferralEarningsManager";

export const Route = createFileRoute("/admin/pagesat")({
  component: PagesatPage,
});

function PagesatPage() {
  return (
    <>
      <TopupsManager />
      <ReferralEarningsManager />
    </>
  );
}
