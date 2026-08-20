import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/clients/client-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { INSTANCE_STATUS_LABELS, SUBSCRIPTION_STATUS_LABELS, PAYMENT_STATUS_LABELS } from "@/lib/status-labels";
import { formatCurrency, formatDate } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ClientDetailPage({ params }: PageProps<"/clients/[id]">) {
  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      instances: { include: { product: true }, orderBy: { createdAt: "desc" } },
      subscriptions: { include: { instance: { include: { product: true } } }, orderBy: { createdAt: "desc" } },
      payments: { orderBy: { paymentDate: "desc" }, take: 10 },
    },
  });

  if (!client) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={client.companyName} description="Détails du client" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <ClientForm client={client} />
          </CardContent>
        </Card>

        <div className="space-y-6 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instances ({client.instances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.instances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune instance pour ce client.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.instances.map((instance) => (
                      <TableRow key={instance.id}>
                        <TableCell>{instance.product.name}</TableCell>
                        <TableCell>
                          <Link href={`/instances/${instance.id}`} className="hover:underline">
                            {instance.label}
                          </Link>
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={instance.status} labels={INSTANCE_STATUS_LABELS} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abonnements ({client.subscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {client.subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun abonnement pour ce client.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Plan</TableHead>
                      <TableHead>Montant</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Link href={`/abonnements/${sub.id}`} className="hover:underline">
                            {sub.planName}
                          </Link>
                          <p className="text-xs text-muted-foreground">{sub.instance.product.name}</p>
                        </TableCell>
                        <TableCell className="tabular-nums">
                          {formatCurrency(sub.amount.toNumber(), sub.currency)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={sub.status} labels={SUBSCRIPTION_STATUS_LABELS} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Paiements récents</CardTitle>
            </CardHeader>
            <CardContent>
              {client.payments.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun paiement enregistré.</p>
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
                    {client.payments.map((payment) => (
                      <TableRow key={payment.id}>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
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
