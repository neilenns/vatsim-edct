import axios, { AxiosInstance } from "axios";
import { ENV } from "../env.mts";

class CustomHttp {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: ENV.VITE_SERVER_URL,
    });

    this.instance.defaults.withCredentials = true;
  }

  authorized(token: string): AxiosInstance {
    this.instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    return this.instance;
  }
}

const http = new CustomHttp();

export default http;
