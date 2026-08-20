import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { LoginForm } from "@/components/auth/login-form";

export const metadata = {
  title: "Connexion — ASODITECH Control Center",
};

export default async function ConnexionPage() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/tableau-de-bord");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1 text-center">
          <h1 className="text-lg font-semibold tracking-tight">ASODITECH Control Center</h1>
          <p className="text-sm text-muted-foreground">Connectez-vous à votre espace ASODITECH.</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
