import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { INSTANCE_STATUS_LABELS } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Server, Plus } from "lucide-react";

export const metadata = { title: "Instances — ASODITECH Control Center" };

export default async function InstancesPage() {
  const instances = await prisma.instance.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, product: true },
  });

  return (
    <div>
      <PageHeader
        title="Instances"
        description="Installations déployées d'un produit pour un client."
        actions={
          <Button render={<Link href="/instances/nouveau" />}>
            <Plus />
            Nouvelle instance
          </Button>
        }
      />

      {instances.length === 0 ? (
        <EmptyState
          icon={Server}
          title="Aucune instance pour le moment"
          description="Déployez votre première instance pour un client."
          action={
            <Button size="sm" render={<Link href="/instances/nouveau" />}>
              Nouvelle instance
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Libellé</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Produit</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {instances.map((instance) => (
                <TableRow key={instance.id}>
                  <TableCell>
                    <Link href={`/instances/${instance.id}`} className="font-medium hover:underline">
                      {instance.label}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <Link href={`/clients/${instance.clientId}`} className="hover:underline">
                      {instance.client.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{instance.product.name}</TableCell>
                  <TableCell className="text-muted-foreground">{instance.version || "—"}</TableCell>
                  <TableCell>
                    <StatusBadge status={instance.status} labels={INSTANCE_STATUS_LABELS} />
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
