type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface StatusMeta {
  label: string;
  variant: BadgeVariant;
}

export const CLIENT_STATUS_LABELS: Record<string, StatusMeta> = {
  ACTIVE: { label: "Actif", variant: "default" },
  INACTIVE: { label: "Inactif", variant: "secondary" },
};

export const PRODUCT_STATUS_LABELS: Record<string, StatusMeta> = {
  ACTIVE: { label: "Actif", variant: "default" },
  DEPRECATED: { label: "Déprécié", variant: "secondary" },
  ARCHIVED: { label: "Archivé", variant: "outline" },
};

export const INSTANCE_STATUS_LABELS: Record<string, StatusMeta> = {
  PROVISIONING: { label: "En cours de mise en service", variant: "secondary" },
  ACTIVE: { label: "Active", variant: "default" },
  SUSPENDED: { label: "Suspendue", variant: "destructive" },
  DECOMMISSIONED: { label: "Désaffectée", variant: "outline" },
};

export const SUBSCRIPTION_STATUS_LABELS: Record<string, StatusMeta> = {
  ACTIVE: { label: "Actif", variant: "default" },
  PAST_DUE: { label: "En retard", variant: "destructive" },
  SUSPENDED: { label: "Suspendu", variant: "destructive" },
  CANCELLED: { label: "Résilié", variant: "outline" },
};

export const PAYMENT_STATUS_LABELS: Record<string, StatusMeta> = {
  PENDING: { label: "En attente", variant: "secondary" },
  SUCCEEDED: { label: "Réussi", variant: "default" },
  FAILED: { label: "Échoué", variant: "destructive" },
  REFUNDED: { label: "Remboursé", variant: "outline" },
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  BANK_TRANSFER: "Virement bancaire",
  CASH: "Espèces",
  CARD: "Carte bancaire",
  MOBILE_MONEY: "Mobile money",
  OTHER: "Autre",
};

export const BILLING_INTERVAL_LABELS: Record<string, string> = {
  MONTHLY: "Mensuel",
  YEARLY: "Annuel",
  ONE_TIME: "Paiement unique",
};
