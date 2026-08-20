import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { SubscriptionCreateForm } from "@/components/subscriptions/subscription-create-form";

export const metadata = { title: "Nouvel abonnement — ASODITECH Control Center" };

export default async function NewSubscriptionPage() {
  const [clients, instances] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    prisma.instance.findMany({
      where: { status: { in: ["PROVISIONING", "ACTIVE"] } },
      orderBy: { label: "asc" },
      select: { id: true, clientId: true, label: true, product: { select: { name: true } } },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Nouvel abonnement" />
      <SubscriptionCreateForm
        clients={clients}
        instances={instances.map((i) => ({
          id: i.id,
          clientId: i.clientId,
          label: i.label,
          productName: i.product.name,
        }))}
      />
    </div>
  );
}
