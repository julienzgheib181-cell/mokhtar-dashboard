export type TxType = "sale" | "expense" | "pay_debt" | "receive_debt" | "adjust";
export type TxCategory =
  | "phones"
  | "transfer"
  | "repair"
  | "service"
  | "accessories"
  | "subscription"
  | "other";

export type Transaction = {
  id: string;
  created_at: string;
  tx_date: string;
  type: TxType;
  category: TxCategory;
  amount: number;
  person: string | null;
  note: string | null;
};

export type Debt = {
  id: string;
  created_at: string;
  updated_at: string;
  direction: "owed_by_me" | "owed_to_me";
  person: string;
  amount: number;
  note: string | null;
  status: "open" | "paid";
};
