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
  shareToken: string | null;
  shareTokenExpiresAt: Date | null;
  createdAt: Date;
};

export type PartnerForHome = {
  id: string;
  name: string;
  balance: number;
  lastTransaction: {
    amount: number;
    description: string | null;
    date: Date;
  } | null;
};

export type PartnerNote = {
  id: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  partnerId: string;
  ownerId: string;
};

export type PartnerById = {
  id: string;
  name: string;
  balance: number;
  isArchived: boolean;
  shareToken: string | null;
  shareTokenExpiresAt: Date | null;
  notes: PartnerNote[];
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

export type ShareTokenState = {
  error?: string;
  success?: boolean;
  token?: string;
};

export type SharedPartnerData = {
  partnerName: string;
  ownerName: string;
  balance: number;
  transactions: Array<{
    id: string;
    amount: number;
    description: string | null;
    date: Date;
    runningBalance: number;
  }>;
  notes: PartnerNote[];
};
