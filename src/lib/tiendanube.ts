import axios from "axios";
import { supabase } from "./supabase";

export async function nuvemshopClient(storeId: number) {
  const { data: store } = await supabase
    .from("stores")
    .select("access_token")
    .eq("store_id", storeId)
    .single();

  if (!store?.access_token) throw new Error("Loja sem token");

  return axios.create({
    baseURL: process.env.TIENDANUBE_API_URL,
    headers: {
      "Content-Type": "application/json",
      "User-Agent": `${process.env.CLIENT_ID} (atacado)`,
      Authorization: `bearer ${store.access_token}`,
    },
  });
}