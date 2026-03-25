type CloudinaryResourceType = "image" | "video" | "raw";

interface CloudinaryUploadResponse {
  secure_url: string;
  resource_type: CloudinaryResourceType;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  duration?: number;
}

interface CloudinaryErrorResponse {
  error?: {
    message?: string;
  };
}

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

interface CloudinaryConfig {
  cloudName: string;
  uploadPreset: string;
}

const getCloudinaryConfig = (): CloudinaryConfig => {
  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const missingKeys: string[] = [];

  if (!cloudName || cloudName.trim().length === 0) {
    missingKeys.push("VITE_CLOUDINARY_CLOUD_NAME");
  }

  if (!uploadPreset || uploadPreset.trim().length === 0) {
    missingKeys.push("VITE_CLOUDINARY_UPLOAD_PRESET");
  }

  if (missingKeys.length > 0) {
    throw new Error(
      `Cloudinary chưa được cấu hình. Thiếu biến môi trường: ${missingKeys.join(", ")}`,
    );
  }

  return {
    cloudName: cloudName.trim(),
    uploadPreset: uploadPreset.trim(),
  };
};

const getFileExtension = (fileName: string): string | undefined => {
  const dotIndex = fileName.lastIndexOf(".");
  if (dotIndex === -1 || dotIndex === fileName.length - 1) {
    return undefined;
  }

  return fileName.slice(dotIndex + 1).toLowerCase();
};

const sanitizeFileName = (fileName: string): string => {
  return fileName
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-+/g, "-");
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

const buildPublicId = (file: File, options: UploadOptions): string => {
  const folder = options.folder?.trim() || "uploads";
  const safeFolder = folder.replace(/^\/+|\/+$/g, "").replace(/\/+/g, "/");
  const timestamp = Date.now();
  const originalName = sanitizeFileName(file.name) || "file";
  const providedName = options.fileName
    ? sanitizeFileName(options.fileName)
    : "";
  const finalName = providedName || `${timestamp}-${originalName}`;
  const dotIndex = finalName.lastIndexOf(".");
  const finalNameWithoutExtension =
    dotIndex > 0 ? finalName.slice(0, dotIndex) : finalName;

  return `${safeFolder}/${finalNameWithoutExtension}`;
};

const uploadToCloudinaryApi = async (
  file: File,
  options: UploadOptions,
  config: CloudinaryConfig,
): Promise<CloudinaryUploadResponse> => {
  const endpoint = `https://api.cloudinary.com/v1_1/${config.cloudName}/auto/upload`;
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", config.uploadPreset);
  formData.append("public_id", buildPublicId(file, options));

  if (options.folder?.trim()) {
    formData.append("folder", options.folder.trim());
  }

  if (options.metadata && Object.keys(options.metadata).length > 0) {
    const context = Object.entries(options.metadata)
      .map(([key, value]) => `${key}=${value}`)
      .join("|");
    formData.append("context", context);
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", endpoint, true);

    xhr.upload.onprogress = (event) => {
      if (!options.onProgress) {
        return;
      }

      const progress = event.lengthComputable
        ? (event.loaded / event.total) * 100
        : 0;
      options.onProgress(progress, file);
    };

    xhr.onerror = () => reject(new Error("Không thể kết nối đến Cloudinary."));

    xhr.onload = () => {
      const responseText = xhr.responseText || "";
      const isSuccess = xhr.status >= 200 && xhr.status < 300;

      if (isSuccess) {
        try {
          resolve(JSON.parse(responseText) as CloudinaryUploadResponse);
          return;
        } catch {
          reject(new Error("Cloudinary trả về dữ liệu không hợp lệ."));
          return;
        }
      }

      try {
        const errorBody = JSON.parse(responseText) as CloudinaryErrorResponse;
        reject(
          new Error(
            errorBody.error?.message ||
              `Upload thất bại với mã lỗi ${xhr.status} từ Cloudinary.`,
          ),
        );
      } catch {
        reject(
          new Error(`Upload thất bại với mã lỗi ${xhr.status} từ Cloudinary.`),
        );
      }
    };

    xhr.send(formData);
  });
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
  let cloudinaryConfig: CloudinaryConfig;
  try {
    cloudinaryConfig = getCloudinaryConfig();
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Cloudinary chưa được cấu hình. Hãy kiểm tra file .env.";
    throw new Error(
      `${message} Sau khi cập nhật .env, hãy restart Vite server.`,
    );
  }

  try {
    const [uploadData, mediaMetadata] = await Promise.all([
      uploadToCloudinaryApi(file, options, cloudinaryConfig),
      extractMediaMetadata(file),
    ]);

    return {
      success: true,
      data: {
        resourceType:
          uploadData.resource_type || resolveResourceType(file.type),
        url: uploadData.secure_url,
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
      error instanceof Error ? error.message : "Upload file thất bại.";
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
