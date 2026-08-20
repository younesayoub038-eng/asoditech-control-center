import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { SUBSCRIPTION_STATUS_LABELS, BILLING_INTERVAL_LABELS } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { CreditCard, Plus } from "lucide-react";

export const metadata = { title: "Abonnements — ASODITECH Control Center" };

export default async function SubscriptionsPage() {
  const subscriptions = await prisma.subscription.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, instance: { include: { product: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Abonnements"
        description="Relation commerciale finançant une instance."
        actions={
          <Button render={<Link href="/abonnements/nouveau" />}>
            <Plus />
            Nouvel abonnement
          </Button>
        }
      />

      {subscriptions.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="Aucun abonnement pour le moment"
          action={
            <Button size="sm" render={<Link href="/abonnements/nouveau" />}>
              Nouvel abonnement
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Instance</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Intervalle</TableHead>
                <TableHead>Prochain paiement</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subscriptions.map((sub) => (
                <TableRow key={sub.id}>
                  <TableCell>
                    <Link href={`/clients/${sub.clientId}`} className="hover:underline">
                      {sub.client.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{sub.instance.product.name}</TableCell>
                  <TableCell>
                    <Link href={`/abonnements/${sub.id}`} className="font-medium hover:underline">
                      {sub.planName}
                    </Link>
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(sub.amount.toNumber(), sub.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {BILLING_INTERVAL_LABELS[sub.billingInterval]}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {sub.nextPaymentDate ? formatDate(sub.nextPaymentDate) : "—"}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={sub.status} labels={SUBSCRIPTION_STATUS_LABELS} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
