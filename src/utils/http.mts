import axios, { AxiosInstance, AxiosRequestConfig } from "axios";
import { ENV } from "../env.mts";

class CustomHttp {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: ENV.VITE_SERVER_URL,
    });

    this.instance.defaults.headers.common["x-api-key"] = ENV.VITE_API_KEY;
    this.instance.defaults.withCredentials = true;
  }

  authorized(token: string): AxiosInstance {
    this.instance.defaults.headers.common.Authorization = `Bearer ${token}`;
    return this.instance;
  }

  // Seems like there should be a better way to do this but whatever.
  get<T>(token: string, url: string, config?: AxiosRequestConfig) {
    return this.instance.get<T>(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  post<T>(
    token: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) {
    return this.instance.post<T>(url, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  put(token: string, url: string, data?: unknown, config?: AxiosRequestConfig) {
    return this.instance.put(url, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  delete(token: string, url: string, config?: AxiosRequestConfig) {
    return this.instance.delete(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  patch(
    token: string,
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ) {
    return this.instance.patch(url, data, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  head(token: string, url: string, config?: AxiosRequestConfig) {
    return this.instance.head(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  options(token: string, url: string, config?: AxiosRequestConfig) {
    return this.instance.options(url, {
      ...config,
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }
}

const http = new CustomHttp();

export default http;
