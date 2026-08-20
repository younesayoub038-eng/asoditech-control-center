import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { InstanceCreateForm } from "@/components/instances/instance-create-form";

export const metadata = { title: "Nouvelle instance — ASODITECH Control Center" };

export default async function NewInstancePage() {
  const [clients, products] = await Promise.all([
    prisma.client.findMany({
      where: { status: "ACTIVE" },
      orderBy: { companyName: "asc" },
      select: { id: true, companyName: true },
    }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div>
      <PageHeader title="Nouvelle instance" description="Déployer un produit pour un client." />
      <InstanceCreateForm
        clients={clients.map((c) => ({ id: c.id, label: c.companyName }))}
        products={products.map((p) => ({ id: p.id, label: p.name }))}
      />
    </div>
  );
}
