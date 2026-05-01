interface Window {
  showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
}

declare module globalThis {
  interface Window {
    showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
  }
}

export {};