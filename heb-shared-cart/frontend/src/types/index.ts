export type ListStatus = "open" | "locked" | "checked_out";

export interface User {
  id: string;
  name: string;
  avatar_url: string | null;
}

export interface Member {
  user_id: string;
  name: string;
  avatar_url: string | null;
  role: string;
}

export interface Item {
  id: string;
  list_id: string;
  name: string;
  price_estimate: number | null;
  quantity: number;
  is_in_cart: boolean;
  added_by_user_id: string;
}

export interface SharedList {
  id: string;
  name: string;
  owner_id: string;
  status: ListStatus;
  invite_code: string | null;
  members: Member[];
  items: Item[];
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
}

export interface BillPerUserItem {
  item_id: string;
  name: string;
  amount: number;
}

export interface BillPerUser {
  user_id: string;
  amount_owed: number;
  items: BillPerUserItem[];
}

export interface Bill {
  id: string;
  list_id: string;
  total: number;
  per_user: BillPerUser[];
}

export interface WsMessage {
  type: string;
  item?: Item;
  item_id?: string;
  by?: string;
  user_name?: string;
  user_id?: string;
  from_socket?: boolean;
  [key: string]: unknown;
}
