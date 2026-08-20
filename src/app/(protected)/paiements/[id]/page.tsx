import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PaymentEditForm } from "@/components/payments/payment-edit-form";

export default async function PaymentDetailPage({ params }: PageProps<"/paiements/[id]">) {
  const { id } = await params;

  const payment = await prisma.payment.findUnique({
    where: { id },
    include: { client: true, recordedBy: true },
  });

  if (!payment) notFound();

  const subscriptions = await prisma.subscription.findMany({
    where: { clientId: payment.clientId },
    select: { id: true, planName: true },
    orderBy: { planName: "asc" },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Paiement du ${new Intl.DateTimeFormat("fr-FR").format(payment.paymentDate)}`}
        description={
          <Link href={`/clients/${payment.clientId}`} className="hover:underline">
            {payment.client.companyName}
          </Link>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Détails du paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <PaymentEditForm payment={payment} subscriptions={subscriptions} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Traçabilité</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p className="text-muted-foreground">Enregistré par</p>
            <p>{payment.recordedBy?.name ?? "—"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
