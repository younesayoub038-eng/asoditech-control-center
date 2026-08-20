import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { SUBSCRIPTION_STATUS_LABELS, INSTANCE_STATUS_LABELS } from "@/lib/status-labels";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { InstanceEditForm } from "@/components/instances/instance-edit-form";
import { InstanceStatusActions } from "@/components/instances/instance-status-actions";
import { RotateLicenseKeyButton } from "@/components/instances/rotate-license-key-button";

export default async function InstanceDetailPage({ params }: PageProps<"/instances/[id]">) {
  const { id } = await params;

  const instance = await prisma.instance.findUnique({
    where: { id },
    include: {
      client: true,
      product: true,
      subscriptions: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!instance) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={instance.label}
        description={
          <>
            <Link href={`/clients/${instance.clientId}`} className="hover:underline">
              {instance.client.companyName}
            </Link>{" "}
            · {instance.product.name}
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
              <StatusBadge status={instance.status} labels={INSTANCE_STATUS_LABELS} />
              <InstanceStatusActions instanceId={instance.id} status={instance.status} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Informations</CardTitle>
            </CardHeader>
            <CardContent>
              <InstanceEditForm instance={instance} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Licence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-sm">
                <p className="text-muted-foreground">Préfixe de clé</p>
                <p className="font-mono">{instance.licenseKeyPrefix}…</p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Dernière vérification</p>
                <p>
                  {instance.licenseKeyLastVerifiedAt
                    ? formatDateTime(instance.licenseKeyLastVerifiedAt)
                    : "Jamais"}
                </p>
              </div>
              <div className="text-sm">
                <p className="text-muted-foreground">Dernière régénération</p>
                <p>{formatDateTime(instance.licenseKeyRotatedAt)}</p>
              </div>
              <RotateLicenseKeyButton instanceId={instance.id} />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Abonnements ({instance.subscriptions.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {instance.subscriptions.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun abonnement pour cette instance.</p>
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
                    {instance.subscriptions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>
                          <Link href={`/abonnements/${sub.id}`} className="hover:underline">
                            {sub.planName}
                          </Link>
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
        </div>
      </div>
    </div>
  );
}
