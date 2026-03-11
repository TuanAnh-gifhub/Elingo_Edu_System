declare const global: unknown

// Ensure a Node-like global object exists in the browser
if (typeof global === "undefined" && typeof globalThis !== "undefined") {
  ;(globalThis as typeof globalThis & { global?: typeof globalThis }).global =
    globalThis
}

