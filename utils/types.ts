export type CachedSelectionInfo = {
  element: HTMLInputElement | HTMLTextAreaElement | Range;
  selectionStart?: number;
  selectionEnd?: number;
  currentValue?: string;
};
