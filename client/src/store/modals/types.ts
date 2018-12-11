export interface MessageModalOptions {
  title: string;
  message: string;
  confirmText?: string;
  onConfirm?: () => void;
}
