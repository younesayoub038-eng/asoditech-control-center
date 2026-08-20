import { getDashboardMetrics } from "@/lib/queries/dashboard";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/format";
import { SUBSCRIPTION_STATUS_LABELS } from "@/lib/status-labels";
import { Users, Server, CreditCard, AlertTriangle, ServerOff, Wallet } from "lucide-react";
import Link from "next/link";
import { EmptyState } from "@/components/empty-state";
import { ScrollText } from "lucide-react";

export const metadata = { title: "Tableau de bord — ASODITECH Control Center" };

function MetricCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 py-5">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
          <Icon className="size-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-2xl font-semibold tabular-nums">{value}</p>
          <p className="text-sm text-muted-foreground">{label}</p>
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  const metrics = await getDashboardMetrics();

  return (
    <div>
      <PageHeader
        title="Tableau de bord"
        description="Vue d'ensemble de l'activité ASODITECH."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <MetricCard icon={Users} label="Clients actifs" value={metrics.totalClients} />
        <MetricCard icon={Server} label="Instances actives" value={metrics.activeInstances} />
        <MetricCard icon={ServerOff} label="Instances suspendues" value={metrics.suspendedInstances} />
        <MetricCard icon={CreditCard} label="Abonnements actifs" value={metrics.activeSubscriptions} />
        <MetricCard
          icon={AlertTriangle}
          label="Abonnements en retard"
          value={metrics.pastDueSubscriptions}
        />
        <MetricCard
          icon={Wallet}
          label="Revenu du mois"
          value={formatCurrency(metrics.revenueThisMonth)}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Paiements à venir</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.upcomingPayments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucun paiement prévu dans les 14 prochains jours.
              </p>
            ) : (
              <ul className="space-y-3">
                {metrics.upcomingPayments.map((sub) => (
                  <li key={sub.id} className="flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <Link
                        href={`/abonnements/${sub.id}`}
                        className="truncate font-medium hover:underline"
                      >
                        {sub.client.companyName}
                      </Link>
                      <p className="truncate text-xs text-muted-foreground">
                        {sub.instance.product.name} · {sub.nextPaymentDate && formatDate(sub.nextPaymentDate)}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span className="tabular-nums">{formatCurrency(sub.amount.toNumber(), sub.currency)}</span>
                      <StatusBadge status={sub.status} labels={SUBSCRIPTION_STATUS_LABELS} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.recentAuditEvents.length === 0 ? (
              <EmptyState icon={ScrollText} title="Aucune activité pour le moment" />
            ) : (
              <ul className="space-y-3">
                {metrics.recentAuditEvents.map((event) => (
                  <li key={event.id} className="text-sm">
                    <p>
                      <span className="font-medium">
                        {event.actorUser?.name ?? (event.actorType === "INSTANCE" ? "Instance" : "Système")}
                      </span>{" "}
                      <span className="text-muted-foreground">— {event.action}</span>
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(event.createdAt)}</p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
