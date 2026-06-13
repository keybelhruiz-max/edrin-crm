import Sidebar from "@/components/Sidebar";
import AgencyBranding from "@/components/AgencyBranding";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const agencyId = (session?.user as any)?.agencyId;
  const agency = agencyId
    ? await prisma.agency.findUnique({ where: { id: agencyId } })
    : null;

  return (
    <div className="flex min-h-screen" style={{ background: "var(--bg)" }}>
      {agency && <AgencyBranding agency={agency} />}
      <Sidebar agency={agency} />
      <main className="flex-1 overflow-auto min-w-0 pb-20 md:pb-0">{children}</main>
    </div>
  );
}
