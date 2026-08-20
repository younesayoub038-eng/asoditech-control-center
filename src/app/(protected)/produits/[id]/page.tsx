import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { INSTANCE_STATUS_LABELS } from "@/lib/status-labels";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default async function ProductDetailPage({ params }: PageProps<"/produits/[id]">) {
  const { id } = await params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { instances: { include: { client: true }, orderBy: { createdAt: "desc" } } },
  });

  if (!product) notFound();

  return (
    <div className="space-y-6">
      <PageHeader title={product.name} description="Détails du produit" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Informations</CardTitle>
          </CardHeader>
          <CardContent>
            <ProductForm product={product} />
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Instances déployées ({product.instances.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {product.instances.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucune instance de ce produit.</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client</TableHead>
                      <TableHead>Libellé</TableHead>
                      <TableHead>Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {product.instances.map((instance) => (
                      <TableRow key={instance.id}>
                        <TableCell>
                          <Link href={`/clients/${instance.clientId}`} className="hover:underline">
                            {instance.client.companyName}
                          </Link>
                        </TableCell>
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
        </div>
      </div>
    </div>
  );
}
