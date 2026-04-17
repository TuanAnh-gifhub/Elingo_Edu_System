const DEFAULT_JITSI_DOMAIN = "8x8.vc";
const DEFAULT_JITSI_SCRIPT_SRC =
  "https://8x8.vc/vpaas-magic-cookie-65ee15fba0084777ade13da38e810287/external_api.js";

let scriptLoadingPromise: Promise<void> | null = null;

export interface JitsiRoomOptions {
  roomName: string;
  parentNode: HTMLElement;
  displayName?: string;
  roomPassword?: string;
  jwt?: string;
  isModerator?: boolean;
  canUseRecording?: boolean;
  autoStartRecording?: boolean;
  recordingMode?: "file" | "stream";
  onRecordingEvent?: (status: "started" | "processing" | "ready" | "failed") => void;
}

export interface JitsiApi {
  dispose?: () => void;
  addListener?: (event: string, listener: (...args: unknown[]) => void) => void;
  executeCommand?: (command: string, ...args: unknown[]) => void;
}

type JitsiCtor = new (
  domain: string,
  options: {
    roomName: string;
    parentNode: HTMLElement;
    jwt?: string;
    configOverwrite?: Record<string, unknown>;
    interfaceConfigOverwrite?: Record<string, unknown>;
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
  roomName,
  parentNode,
  displayName,
  roomPassword,
  jwt,
  isModerator,
  canUseRecording = true,
  autoStartRecording = false,
  recordingMode = "file",
  onRecordingEvent,
}: JitsiRoomOptions): Promise<JitsiApi> => {
  await loadJitsiScript();

  if (!jitsiWindow.JitsiMeetExternalAPI) {
    throw new Error("Jitsi chưa sẵn sàng.");
  }

  if (!jwt) {
    throw new Error("Không có token truy cập lớp học trực tuyến.");
  }

  const fullRoomName = `vpaas-magic-cookie-65ee15fba0084777ade13da38e810287/${roomName}`;

  const toolbarButtons = [
    "microphone",
    "camera",
    "desktop",
    "fullscreen",
    "fodeviceselection",
    "hangup",
    "chat",
    "settings",
    "raisehand",
    "videoquality",
    "tileview",
  ];

  if (canUseRecording) {
    toolbarButtons.push("recording");
  }

  const api = new jitsiWindow.JitsiMeetExternalAPI(DEFAULT_JITSI_DOMAIN, {
    roomName: fullRoomName,
    parentNode,
    jwt,
    configOverwrite: {
      disableInviteFunctions: true,
      hideConferenceSubject: true,
      prejoinPageEnabled: false,
    },
    interfaceConfigOverwrite: {
      HIDE_INVITE_MORE_HEADER: true,
      MOBILE_APP_PROMO: false,
      TOOLBAR_BUTTONS: toolbarButtons,
    },
    userInfo: displayName
      ? {
          displayName,
        }
      : undefined,
  });

  // Auto-apply password so students do not need to type manually.
  const canAutoJoinWithPassword = Boolean(roomPassword && jwt);
  const canLockRoom = Boolean(roomPassword && isModerator && jwt);

  if (canAutoJoinWithPassword) {
    const applyRoomPassword = () => {
      api.executeCommand?.("password", roomPassword);
    };

    api.addListener?.("passwordRequired", applyRoomPassword);

    // Only moderator should lock/reset the room password.
    if (canLockRoom) {
      api.addListener?.("videoConferenceJoined", applyRoomPassword);
    }
  }

  const shouldAutoStartRecording = Boolean(autoStartRecording && canUseRecording && isModerator);

  if (shouldAutoStartRecording) {
    let started = false;

    const startRecording = () => {
      if (started) {
        return;
      }
      started = true;

      // Delay a bit so conference is fully joined before invoking recording command.
      window.setTimeout(() => {
        api.executeCommand?.("startRecording", {
          mode: recordingMode,
        });
        onRecordingEvent?.("started");
      }, 1200);
    };

    api.addListener?.("videoConferenceJoined", startRecording);
  }

  if (canUseRecording && onRecordingEvent) {
    api.addListener?.("recordingStatusChanged", (...args: unknown[]) => {
      const payload = args[0] as Record<string, unknown> | undefined;
      const statusRaw = typeof payload?.status === "string" ? payload.status : "";
      const status = statusRaw.toLowerCase();

      if (status.includes("fail") || status.includes("error")) {
        onRecordingEvent("failed");
        return;
      }

      if (status.includes("ready") || status.includes("complete") || status.includes("on")) {
        onRecordingEvent("ready");
        return;
      }

      onRecordingEvent("processing");
    });
  }

  return api;
};


