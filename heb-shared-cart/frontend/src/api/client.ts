import axios from "axios";
import type { Bill, Product, SharedList, User } from "../types";

const api = axios.create({
  baseURL: "/api",
});

export function setAuthHeaders(userId: string, userName: string) {
  api.defaults.headers.common["X-User-Id"] = userId;
  api.defaults.headers.common["X-User-Name"] = userName;
}

export async function getMe(): Promise<User> {
  const { data } = await api.get<User>("/users/me");
  return data;
}

export async function updateMe(name: string, avatar_url?: string | null): Promise<User> {
  const { data } = await api.patch<User>("/users/me", { name, avatar_url });
  return data;
}

export async function getMyLists(): Promise<SharedList[]> {
  const { data } = await api.get<SharedList[]>("/lists");
  return data;
}

export async function createList(name: string): Promise<SharedList> {
  const { data } = await api.post<SharedList>("/lists", { name });
  return data;
}

export async function joinList(invite_code: string): Promise<SharedList> {
  const { data } = await api.post<SharedList>("/lists/join", { invite_code });
  return data;
}

export async function getList(listId: string): Promise<SharedList> {
  const { data } = await api.get<SharedList>(`/lists/${listId}`);
  return data;
}

export async function addItem(
  listId: string,
  payload: { name: string; price_estimate?: number | null; quantity?: number }
) {
  const { data } = await api.post(`/lists/${listId}/items`, payload);
  return data;
}

export async function updateItem(
  listId: string,
  itemId: string,
  payload: Partial<{ name: string; price_estimate: number | null; quantity: number; is_in_cart: boolean }>
) {
  const { data } = await api.patch(`/lists/${listId}/items/${itemId}`, payload);
  return data;
}

export async function deleteItem(listId: string, itemId: string) {
  await api.delete(`/lists/${listId}/items/${itemId}`);
}

export async function claimItem(listId: string, itemId: string, userId: string, percentage: number) {
  const { data } = await api.post(`/lists/${listId}/items/${itemId}/claims`, {
    user_id: userId,
    percentage,
  });
  return data;
}

export async function searchProducts(q: string): Promise<Product[]> {
  const { data } = await api.get<Product[]>("/mock-heb/products", { params: { q } });
  return data;
}

export async function checkoutSplit(
  listId: string,
  items: { list_item_id: string; name: string; final_price: number }[]
): Promise<Bill> {
  const { data } = await api.post<Bill>("/checkout/split", { list_id: listId, items });
  return data;
}

export function getWsUrl(listId: string): string {
  const protocol = window.location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${window.location.host}/api/lists/${listId}/ws`;
}

export default api;
