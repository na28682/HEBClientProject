import axios from "axios";
import { v4 as uuidv4 } from "uuid";

const client = axios.create({
  baseURL: "/api",
});

function getUserId(): string {
  let id = localStorage.getItem("heb_user_id");
  if (!id) {
    id = uuidv4();
    localStorage.setItem("heb_user_id", id);
  }
  return id;
}

client.interceptors.request.use((config) => {
  const userId = getUserId();
  config.headers = {
    ...config.headers,
    "X-User-Id": userId,
  };
  return config;
});

export interface Item {
  id: string;
  list_id: string;
  name: string;
  price_estimate?: number;
  added_by_user_id: string;
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

export interface BillResponse {
  id: string;
  list_id: string;
  total: number;
  per_user: BillPerUser[];
}

export async function createList(name: string) {
  const res = await client.post("/lists", { name });
  return res.data as { id: string; name: string };
}

export async function fetchItems(listId: string) {
  const res = await client.get(`/lists/${listId}/items`);
  return res.data as Item[];
}

export async function addItem(listId: string, name: string, priceEstimate?: number) {
  const res = await client.post(`/lists/${listId}/items`, {
    name,
    price_estimate: priceEstimate,
  });
  return res.data as Item;
}

export async function claimItem(
  listId: string,
  itemId: string,
  userId: string,
  percentage: number,
) {
  await client.post(`/lists/${listId}/items/${itemId}/claims`, {
    user_id: userId,
    percentage,
  });
}

export async function mockCheckout(listId: string) {
  const res = await client.post(`/mock-heb/checkout/${listId}`);
  return res.data as BillResponse;
}

export { client, getUserId };


