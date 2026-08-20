export type Partner = {
  id: string;
  name: string;
};

export type PartnerWithBalance = {
  id: string;
  name: string;
  balance: number;
  isArchived: boolean;
  transactionCount: number;
  createdAt: Date;
};

export type PartnerById = {
  id: string;
  name: string;
  isArchived: boolean;
};

export type CreatePartnerState = {
  error?: string;
  success?: boolean;
  partner?: { id: string; name: string };
};

export type UpdatePartnerState = {
  error?: string;
  success?: boolean;
};
