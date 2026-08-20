import { requireUser } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CreateUserForm } from "@/components/users/create-user-form";
import { ToggleUserStatusButton } from "@/components/users/toggle-user-status-button";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Paramètres — ASODITECH Control Center" };

export default async function SettingsPage() {
  const user = await requireUser();
  const isOwner = user.role === "OWNER";

  const users = isOwner
    ? await prisma.user.findMany({ orderBy: { createdAt: "asc" } })
    : [];

  return (
    <div className="space-y-6">
      <PageHeader title="Paramètres" />

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-base">Mon profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>
            <span className="text-muted-foreground">Nom : </span>
            {user.name}
          </p>
          <p>
            <span className="text-muted-foreground">E-mail : </span>
            {user.email}
          </p>
          <p>
            <span className="text-muted-foreground">Rôle : </span>
            {user.role === "OWNER" ? "Propriétaire" : "Administrateur"}
          </p>
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="text-base">Créer un compte collaborateur</CardTitle>
            </CardHeader>
            <CardContent>
              <CreateUserForm />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Comptes ({users.length})</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>{u.name}</TableCell>
                      <TableCell className="text-muted-foreground">{u.email}</TableCell>
                      <TableCell>{u.role === "OWNER" ? "Propriétaire" : "Administrateur"}</TableCell>
                      <TableCell>
                        <Badge variant={u.status === "ACTIVE" ? "default" : "secondary"}>
                          {u.status === "ACTIVE" ? "Actif" : "Désactivé"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{formatDate(u.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        {u.id !== user.id && <ToggleUserStatusButton userId={u.id} status={u.status} />}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
