import axios from "axios";

export const api = axios.create({
  baseURL: "https://159.223.153.148/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
}); 