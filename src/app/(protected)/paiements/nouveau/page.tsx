import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PaymentCreateForm } from "@/components/payments/payment-create-form";

export const metadata = { title: "Nouveau paiement — ASODITECH Control Center" };

export default async function NewPaymentPage() {
  const [clients, subscriptions] = await Promise.all([
    prisma.client.findMany({ orderBy: { companyName: "asc" }, select: { id: true, companyName: true } }),
    prisma.subscription.findMany({
      orderBy: { planName: "asc" },
      select: { id: true, clientId: true, planName: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Nouveau paiement" />
      <PaymentCreateForm clients={clients} subscriptions={subscriptions} />
    </div>
  );
}
