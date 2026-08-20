import { PageHeader } from "@/components/page-header";
import { ProductForm } from "@/components/products/product-form";

export const metadata = { title: "Nouveau produit — ASODITECH Control Center" };

export default function NewProductPage() {
  return (
    <div>
      <PageHeader title="Nouveau produit" />
      <ProductForm />
    </div>
  );
}
