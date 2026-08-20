import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ScrollText } from "lucide-react";

export const metadata = { title: "Journal d'audit — ASODITECH Control Center" };

const ENTITY_FILTERS = [
  { value: undefined, label: "Tout" },
  { value: "Client", label: "Clients" },
  { value: "Product", label: "Produits" },
  { value: "Instance", label: "Instances" },
  { value: "Subscription", label: "Abonnements" },
  { value: "Payment", label: "Paiements" },
  { value: "User", label: "Utilisateurs" },
] as const;

export default async function AuditLogPage({ searchParams }: PageProps<"/journal-audit">) {
  const { entityType: rawEntityType } = await searchParams;
  const entityType = typeof rawEntityType === "string" ? rawEntityType : undefined;

  const events = await prisma.auditEvent.findMany({
    where: entityType ? { entityType } : undefined,
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actorUser: true },
  });

  return (
    <div>
      <PageHeader title="Journal d'audit" description="Historique des actions administratives." />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {ENTITY_FILTERS.map((filter) => (
          <Link
            key={filter.label}
            href={filter.value ? `/journal-audit?entityType=${filter.value}` : "/journal-audit"}
            className={cn(
              "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
              entityType === filter.value
                ? "border-primary bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted"
            )}
          >
            {filter.label}
          </Link>
        ))}
      </div>

      {events.length === 0 ? (
        <EmptyState icon={ScrollText} title="Aucun événement pour ce filtre" />
      ) : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Acteur</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entité</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDateTime(event.createdAt)}
                    </TableCell>
                    <TableCell>
                      {event.actorUser?.name ?? (event.actorType === "INSTANCE" ? "Instance" : "Système")}
                    </TableCell>
                    <TableCell className="font-mono text-xs">{event.action}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {event.entityType} · {event.entityId.slice(0, 12)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
