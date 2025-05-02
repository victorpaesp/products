import axios from "axios";

export const api = axios.create({
  baseURL: "https://searchm.shop/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
}); 