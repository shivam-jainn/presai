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
  ingestion_session_id?: string;
  slides?: Record<number, string[]>;
  total_slides?: number;
}

export interface VoiceQueryResult {
  answer: string;
  recommended_slide_number: number;
  recommended_slide_index: number;
  retrieval: Array<{
    score: number;
    text: string;
    slide_number?: number | string;
    slide_id?: string;
    filename?: string;
    source_file_path?: string;
  }>;
}

export interface VoiceTranscriptionResult {
  transcript: string;
  mode: string;
}

export interface VoiceLivekitTokenResult {
  token: string;
  ws_url: string;
  room_name: string;
  identity: string;
}

interface VoiceQueryOptions {
  filename: string;
  sessionId?: string | null;
  topK?: number;
  currentSlide?: number;
  totalSlides?: number;
  signal?: AbortSignal;
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
 * Ingest a PPT/PPTX file to the backend.
 *
 * @param file      - The PowerPoint file to upload.
 * @param sessionId - Stable frontend session ID to associate with this ingestion.
 *                    The same ID must be used for subsequent voice queries so the
 *                    vector store can filter results by session.
 * @returns Promise with ingestion result
 */
export const ingestPPT = async (file: File, sessionId?: string): Promise<IngestionResult> => {
  const formData = new FormData();
  formData.append("file", file);
  if (sessionId) {
    formData.append("session_id", sessionId);
  }

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

export const queryVoiceSlide = async (
  question: string,
  options: VoiceQueryOptions
): Promise<VoiceQueryResult> => {
  const topK = options.topK ?? 5;

  const response = await apiClient.post<VoiceQueryResult>(
    "/voice/query",
    {
      question,
      filename: options.filename,
      session_id: options.sessionId || undefined,
      top_k: topK,
      current_slide: options.currentSlide,
      total_slides: options.totalSlides,
    },
    {
      signal: options.signal,
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export const transcribeVoiceAudio = async (
  audioFile: File,
  signal?: AbortSignal
): Promise<VoiceTranscriptionResult> => {
  const formData = new FormData();
  formData.append("file", audioFile);

  const response = await apiClient.post<VoiceTranscriptionResult>(
    "/voice/transcribe",
    formData,
    {
      signal,
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
};

export const getVoiceLivekitToken = async (
  filename: string,
  sessionId?: string | null
): Promise<VoiceLivekitTokenResult> => {
  const response = await apiClient.post<VoiceLivekitTokenResult>(
    "/voice/livekit/token",
    {
      filename,
      session_id: sessionId || undefined,
    },
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};

export default apiClient;