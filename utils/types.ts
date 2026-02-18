export type SelectionSourceType = "input-textarea" | "dom-selection";

export type CachedSelectionInfo = {
  element: HTMLInputElement | HTMLTextAreaElement | Range;
  selectionStart?: number;
  selectionEnd?: number;
  currentValue?: string;
};

export type SelectionSnapshot = {
  selectedText: string;
  contextText: string;
  sourceType: SelectionSourceType;
};
