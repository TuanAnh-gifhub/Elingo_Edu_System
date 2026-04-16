import api from "../../config/axios";

type CloudinaryResourceType = "image" | "video" | "raw";

interface UploadOptions {
  folder?: string;
  fileName?: string;
  metadata?: Record<string, string>;
  onProgress?: (progress: number, file: File) => void;
}

export interface UploadResult {
  success: boolean;
  data: {
    resourceType: CloudinaryResourceType;
    url: string;
    width?: number;
    height?: number;
    format?: string;
    size?: number;
    duration?: number;
    thumbnail?: string;
  };
  error?: string;
}

interface MediaMetadata {
  width?: number;
  height?: number;
  format?: string;
  size?: number;
  duration?: number;
  thumbnail?: string;
}

interface BackendUploadResponse {
  url: string;
  resourceType?: CloudinaryResourceType | string | null;
  publicId?: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  bytes?: number | null;
  duration?: number | null;
}

interface ApiResponse<T> {
  code: number;
  message: string;
  result: T;
}

interface ApiErrorPayload {
  message?: string;
}

const getFileExtension = (fileName: string): string | undefined => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === fileName.length - 1) {
    return undefined;
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
};

const resolveResourceType = (fileType: string): CloudinaryResourceType => {
  if (fileType.startsWith("image/")) {
    return "image";
  }

  if (fileType.startsWith("video/")) {
    return "video";
  }

  return "raw";
};

const extractMediaMetadata = async (file: File): Promise<MediaMetadata> => {
  const resourceType = resolveResourceType(file.type);
  const formatFromFileType = file.type.split("/")[1];
  const format = formatFromFileType || getFileExtension(file.name);

  if (resourceType === "image") {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const image = new Image();

      image.onload = () => {
        resolve({
          width: image.naturalWidth,
          height: image.naturalHeight,
          format,
          size: file.size,
        });
        URL.revokeObjectURL(objectUrl);
      };

      image.onerror = () => {
        resolve({ format, size: file.size });
        URL.revokeObjectURL(objectUrl);
      };

      image.src = objectUrl;
    });
  }

  if (resourceType === "video") {
    return new Promise((resolve) => {
      const objectUrl = URL.createObjectURL(file);
      const video = document.createElement("video");

      video.preload = "metadata";
      video.onloadedmetadata = () => {
        resolve({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Number.isFinite(video.duration)
            ? video.duration
            : undefined,
          format,
          size: file.size,
        });
        URL.revokeObjectURL(objectUrl);
      };

      video.onerror = () => {
        resolve({ format, size: file.size });
        URL.revokeObjectURL(objectUrl);
      };

      video.src = objectUrl;
    });
  }

  return { format, size: file.size };
};

const uploadToBackendApi = async (
  file: File,
  options: UploadOptions,
): Promise<BackendUploadResponse> => {
  const formData = new FormData();

  formData.append("file", file);

  if (options.metadata && Object.keys(options.metadata).length > 0) {
    formData.append("metadata", JSON.stringify(options.metadata));
  }

  const response = await api.post<ApiResponse<BackendUploadResponse>>(
    "/files/cloudinary",
    formData,
    {
      onUploadProgress: (event) => {
        if (!options.onProgress) {
          return;
        }

        const total = event.total ?? 0;
        const progress = total > 0 ? (event.loaded / total) * 100 : 0;
        options.onProgress(progress, file);
      },
    },
  );

  return response.data.result;
};

const createFailedUploadResult = (
  file: File,
  errorMessage: string,
): UploadResult => {
  return {
    success: false,
    error: errorMessage,
    data: {
      resourceType: resolveResourceType(file.type),
      url: "",
      format: file.type.split("/")[1] || getFileExtension(file.name),
      size: file.size,
    },
  };
};

export const uploadToCloudinary = async (
  file: File,
  options: UploadOptions = {},
): Promise<UploadResult> => {
  try {
    const [uploadData, mediaMetadata] = await Promise.all([
      uploadToBackendApi(file, options),
      extractMediaMetadata(file),
    ]);

    return {
      success: true,
      data: {
        resourceType:
          (uploadData.resourceType as CloudinaryResourceType) ||
          resolveResourceType(file.type),
        url: uploadData.url,
        width: uploadData.width || mediaMetadata.width,
        height: uploadData.height || mediaMetadata.height,
        format: uploadData.format || mediaMetadata.format,
        size: uploadData.bytes || mediaMetadata.size,
        duration: uploadData.duration || mediaMetadata.duration,
        thumbnail: mediaMetadata.thumbnail,
      },
    };
  } catch (error) {
    const message =
      typeof error === "object" &&
      error !== null &&
      "response" in error &&
      typeof (error as { response?: { data?: ApiErrorPayload } }).response?.data
        ?.message === "string"
        ? (error as { response?: { data?: ApiErrorPayload } }).response!.data!
            .message!
        : error instanceof Error
          ? error.message
          : "Upload file thất bại.";
    return createFailedUploadResult(file, message);
  }
};

export const uploadMultipleFiles = async (
  files: File[],
  options: UploadOptions = {},
): Promise<UploadResult[]> => {
  return Promise.all(files.map((file) => uploadToCloudinary(file, options)));
};

export const createMediaMessageContent = (
  resourceType: string,
  url: string,
  text = "",
  metadata: MediaMetadata = {},
): string => {
  return JSON.stringify({
    type: resourceType,
    url,
    text,
    metadata,
  });
};

export const parseMessageContent = (content: string): unknown => {
  try {
    return JSON.parse(content);
  } catch {
    return { type: "text", text: content };
  }
};
