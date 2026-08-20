import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { PAYMENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency, formatDate } from "@/lib/format";
import { Receipt, Plus } from "lucide-react";

export const metadata = { title: "Paiements — ASODITECH Control Center" };

export default async function PaymentsPage() {
  const payments = await prisma.payment.findMany({
    orderBy: { paymentDate: "desc" },
    include: { client: true, subscription: true },
    take: 100,
  });

  return (
    <div>
      <PageHeader
        title="Paiements"
        description="Historique des paiements enregistrés."
        actions={
          <Button render={<Link href="/paiements/nouveau" />}>
            <Plus />
            Nouveau paiement
          </Button>
        }
      />

      {payments.length === 0 ? (
        <EmptyState
          icon={Receipt}
          title="Aucun paiement pour le moment"
          action={
            <Button size="sm" render={<Link href="/paiements/nouveau" />}>
              Nouveau paiement
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Abonnement</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Méthode</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>
                    <Link href={`/paiements/${payment.id}`} className="font-medium hover:underline">
                      {formatDate(payment.paymentDate)}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${payment.clientId}`} className="hover:underline">
                      {payment.client.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {payment.subscription?.planName ?? "—"}
                  </TableCell>
                  <TableCell className="tabular-nums">
                    {formatCurrency(payment.amount.toNumber(), payment.currency)}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {PAYMENT_METHOD_LABELS[payment.method]}
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={payment.status} labels={PAYMENT_STATUS_LABELS} />
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
