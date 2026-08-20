import { PageHeader } from "@/components/page-header";
import { ClientForm } from "@/components/clients/client-form";

export const metadata = { title: "Nouveau client — ASODITECH Control Center" };

export default function NewClientPage() {
  return (
    <div>
      <PageHeader title="Nouveau client" />
      <ClientForm />
    </div>
  );
}
