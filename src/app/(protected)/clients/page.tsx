import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { CLIENT_STATUS_LABELS } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate } from "@/lib/format";
import { Building2, Plus } from "lucide-react";

export const metadata = { title: "Clients — ASODITECH Control Center" };

export default async function ClientsPage() {
  const clients = await prisma.client.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { instances: true, subscriptions: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Clients"
        description={`${clients.length} client${clients.length > 1 ? "s" : ""} enregistré${clients.length > 1 ? "s" : ""}.`}
        actions={
          <Button render={<Link href="/clients/nouveau" />}>
            <Plus />
            Nouveau client
          </Button>
        }
      />

      {clients.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="Aucun client pour le moment"
          description="Créez votre premier client pour commencer."
          action={
            <Button size="sm" render={<Link href="/clients/nouveau" />}>
              Nouveau client
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Entreprise</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Instances</TableHead>
                <TableHead>Abonnements</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Créé le</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {clients.map((client) => (
                <TableRow key={client.id} className="cursor-pointer">
                  <TableCell>
                    <Link href={`/clients/${client.id}`} className="font-medium hover:underline">
                      {client.companyName}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {client.contactName || client.email || "—"}
                  </TableCell>
                  <TableCell>{client._count.instances}</TableCell>
                  <TableCell>{client._count.subscriptions}</TableCell>
                  <TableCell>
                    <StatusBadge status={client.status} labels={CLIENT_STATUS_LABELS} />
                  </TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(client.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
