"use client";

import { createContext, useContext, useMemo } from "react";
import {
  DEFAULT_TRANSACTION_LABEL_PRESET,
  getTransactionLabelOption,
  type TransactionLabelOption,
  type TransactionLabelPreset,
} from "@/lib/transaction-labels";

const TransactionLabelPresetContext = createContext<TransactionLabelPreset>(
  DEFAULT_TRANSACTION_LABEL_PRESET,
);

export function TransactionLabelPresetProvider({
  preset,
  children,
}: {
  preset: TransactionLabelPreset;
  children: React.ReactNode;
}) {
  return (
    <TransactionLabelPresetContext.Provider value={preset}>
      {children}
    </TransactionLabelPresetContext.Provider>
  );
}

/** 取引フォームの金額ボタンに出すラベル一式 */
export function useTransactionLabels(): TransactionLabelOption {
  const preset = useContext(TransactionLabelPresetContext);
  return useMemo(() => getTransactionLabelOption(preset), [preset]);
}
