import axios from "axios";
import { getSessionToken } from "@tiendanube/nexo";
import nexo from "@/components/NexoClient";

export const api = axios.create();

api.interceptors.request.use(async (config) => {
  const token = await getSessionToken(nexo);
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});