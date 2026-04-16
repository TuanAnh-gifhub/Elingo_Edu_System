const DEFAULT_JITSI_DOMAIN = "8x8.vc";
const DEFAULT_JITSI_SCRIPT_SRC =
  "https://8x8.vc/vpaas-magic-cookie-65ee15fba0084777ade13da38e810287/external_api.js";

let scriptLoadingPromise: Promise<void> | null = null;

export interface JitsiRoomOptions {
  classId: string;
  parentNode: HTMLElement;
  displayName?: string;
}

export interface JitsiApi {
  dispose?: () => void;
}

type JitsiCtor = new (
  domain: string,
  options: {
    roomName: string;
    parentNode: HTMLElement;
    userInfo?: {
      displayName?: string;
    };
  },
) => JitsiApi;

const jitsiWindow = window as Window & {
  JitsiMeetExternalAPI?: JitsiCtor;
};

export const loadJitsiScript = async (): Promise<void> => {
  if (jitsiWindow.JitsiMeetExternalAPI) {
    return;
  }

  if (!scriptLoadingPromise) {
    scriptLoadingPromise = new Promise<void>((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>(
        `script[src="${DEFAULT_JITSI_SCRIPT_SRC}"]`,
      );

      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener(
          "error",
          () => reject(new Error("Không thể tải Jitsi script.")),
          { once: true },
        );
        return;
      }

      const script = document.createElement("script");
      script.src = DEFAULT_JITSI_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Không thể tải Jitsi script."));
      document.body.appendChild(script);
    });
  }

  return scriptLoadingPromise;
};

export const createJitsiRoom = async ({
  classId,
  parentNode,
  displayName,
}: JitsiRoomOptions): Promise<JitsiApi> => {
  await loadJitsiScript();

  if (!jitsiWindow.JitsiMeetExternalAPI) {
    throw new Error("Jitsi chưa sẵn sàng.");
  }

  const roomName = `vpaas-magic-cookie-65ee15fba0084777ade13da38e810287/${classId}`;

  return new jitsiWindow.JitsiMeetExternalAPI(DEFAULT_JITSI_DOMAIN, {
    roomName,
    parentNode,
    userInfo: displayName
      ? {
          displayName,
        }
      : undefined,
  });
};


