import "server-only";

import { prisma } from "@/lib/prisma";

export async function getDashboardMetrics() {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const in14Days = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  const [
    totalClients,
    activeInstances,
    suspendedInstances,
    activeSubscriptions,
    pastDueSubscriptions,
    paymentsThisMonth,
    upcomingPayments,
    recentAuditEvents,
  ] = await Promise.all([
    prisma.client.count({ where: { status: "ACTIVE" } }),
    prisma.instance.count({ where: { status: "ACTIVE" } }),
    prisma.instance.count({ where: { status: "SUSPENDED" } }),
    prisma.subscription.count({ where: { status: "ACTIVE" } }),
    prisma.subscription.count({ where: { status: "PAST_DUE" } }),
    prisma.payment.aggregate({
      where: {
        status: "SUCCEEDED",
        paymentDate: { gte: startOfMonth, lt: startOfNextMonth },
      },
      _sum: { amount: true },
    }),
    prisma.subscription.findMany({
      where: {
        status: { in: ["ACTIVE", "PAST_DUE"] },
        nextPaymentDate: { lte: in14Days },
      },
      orderBy: { nextPaymentDate: "asc" },
      take: 5,
      include: { client: true, instance: { include: { product: true } } },
    }),
    prisma.auditEvent.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { actorUser: true },
    }),
  ]);

  return {
    totalClients,
    activeInstances,
    suspendedInstances,
    activeSubscriptions,
    pastDueSubscriptions,
    revenueThisMonth: paymentsThisMonth._sum.amount?.toNumber() ?? 0,
    upcomingPayments,
    recentAuditEvents,
  };
}
