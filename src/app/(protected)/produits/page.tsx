import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { PRODUCT_STATUS_LABELS } from "@/lib/status-labels";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus } from "lucide-react";

export const metadata = { title: "Produits — ASODITECH Control Center" };

export default async function ProductsPage() {
  const products = await prisma.product.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { instances: true } } },
  });

  return (
    <div>
      <PageHeader
        title="Produits"
        description="Les systèmes ASODITECH pouvant être déployés pour un client."
        actions={
          <Button render={<Link href="/produits/nouveau" />}>
            <Plus />
            Nouveau produit
          </Button>
        }
      />

      {products.length === 0 ? (
        <EmptyState
          icon={Package}
          title="Aucun produit pour le moment"
          description="Créez votre premier produit ASODITECH."
          action={
            <Button size="sm" render={<Link href="/produits/nouveau" />}>
              Nouveau produit
            </Button>
          }
        />
      ) : (
        <div className="rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Version</TableHead>
                <TableHead>Instances</TableHead>
                <TableHead>Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <Link href={`/produits/${product.id}`} className="font-medium hover:underline">
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{product.slug}</TableCell>
                  <TableCell className="text-muted-foreground">{product.currentVersion || "—"}</TableCell>
                  <TableCell>{product._count.instances}</TableCell>
                  <TableCell>
                    <StatusBadge status={product.status} labels={PRODUCT_STATUS_LABELS} />
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
