import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { PAYMENT_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS } from "@/lib/status-labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SubscriptionEditForm } from "@/components/subscriptions/subscription-edit-form";
import { SubscriptionStatusActions } from "@/components/subscriptions/subscription-status-actions";

export default async function SubscriptionDetailPage({ params }: PageProps<"/abonnements/[id]">) {
  const { id } = await params;

  const subscription = await prisma.subscription.findUnique({
    where: { id },
    include: {
      client: true,
      instance: { include: { product: true } },
      payments: { orderBy: { paymentDate: "desc" } },
    },
  });

  if (!subscription) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={subscription.planName}
        description={
          <>
            <Link href={`/clients/${subscription.clientId}`} className="hover:underline">
              {subscription.client.companyName}
            </Link>{" "}
            ·{" "}
            <Link href={`/instances/${subscription.instanceId}`} className="hover:underline">
              {subscription.instance.product.name}
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <StatusBadge status={subscription.status} labels={SUBSCRIPTION_STATUS_LABELS} />
              <SubscriptionStatusActions subscriptionId={subscription.id} status={subscription.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <SubscriptionEditForm subscription={subscription} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paiements ({subscription.payments.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {subscription.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun paiement pour cet abonnement.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subscription.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          <Link href={`/paiements/${payment.id}`} className="hover:underline">
                            {formatDate(payment.paymentDate)}
                          </Link>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(payment.amount.toNumber(), payment.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={payment.status} labels={PAYMENT_STATUS_LABELS} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
