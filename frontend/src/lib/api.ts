import axios from "axios";
import type { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from "axios";
import { API_CONFIG } from "./config";

/**
 * API Error class for structured error handling
 */
export class ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;

  constructor(message: string, statusCode?: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
  }
}

/**
 * Ingestion response type
 */
export interface IngestionResult {
  status: string;
  chunks_stored: number;
  filename: string;
  file_url?: string;
  slides?: Record<number, string[]>;
  total_slides?: number;
}

/**
 * Create axios instance with default configuration
 */
const createApiClient = (): AxiosInstance => {
  const client = axios.create({
    baseURL: API_CONFIG.baseURL,
    timeout: API_CONFIG.timeout,
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      if (import.meta.env.DEV) {
        console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
      }
      return config;
    },
    (error: AxiosError) => {
      console.error("[API] Request error:", error);
      return Promise.reject(error);
    }
  );

  // Response interceptor for error handling
  client.interceptors.response.use(
    (response) => {
      if (import.meta.env.DEV) {
        console.log(`[API] Response ${response.status}:`, response.data);
      }
      return response;
    },
    (error: AxiosError) => {
      const apiError = handleApiError(error);
      return Promise.reject(apiError);
    }
  );

  return client;
};

/**
 * Handle axios errors and convert to ApiError
 */
const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const statusCode = error.response.status;
    const data = error.response.data as Record<string, unknown>;
    const message = typeof data?.detail === "string" ? data.detail : "An error occurred";
    
    return new ApiError(
      message,
      statusCode,
      `HTTP_${statusCode}`,
      data
    );
  } else if (error.request) {
    // Request was made but no response received
    return new ApiError(
      "Unable to connect to the server. Please check your connection.",
      undefined,
      "NETWORK_ERROR"
    );
  } else {
    // Something else happened
    return new ApiError(
      error.message || "An unexpected error occurred",
      undefined,
      "UNKNOWN_ERROR"
    );
  }
};

// Create singleton API client
const apiClient = createApiClient();

/**
 * Ingest a PPT/PPTX file to the backend
 * @param file - The PowerPoint file to upload
 * @returns Promise with ingestion result
 */
export const ingestPPT = async (file: File): Promise<IngestionResult> => {
  const formData = new FormData();
  formData.append("file", file);

  const response = await apiClient.post<IngestionResult>("/ingest", formData);
  return response.data;
};

/**
 * Get the URL for a PPTX file to be used with pptxjs
 * @param filename - The name of the file
 * @returns The URL to fetch the PPTX file
 */
export const getPPTXUrl = (filename: string): string => {
  return `${API_CONFIG.baseURL}/file/${encodeURIComponent(filename)}`;
};

export default apiClient;