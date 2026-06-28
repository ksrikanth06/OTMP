import { createPortal } from 'react-dom';
import type { ReactNode } from 'react';

interface ModalProps {
  onClose: () => void;
  children: ReactNode;
  /** Tailwind z-index class, defaults to z-50 */
  zClass?: string;
}

/**
 * Renders children inside a full-screen backdrop mounted on document.body via
 * a React portal. This escapes any parent overflow/transform containing blocks
 * that would otherwise clip or misposition a fixed overlay.
 */
export function Modal({ onClose, children, zClass = 'z-50' }: ModalProps) {
  return createPortal(
    <div
      className={`fixed inset-0 ${zClass} flex items-center justify-center bg-black/40 backdrop-blur-sm p-4`}
      onClick={onClose}
    >
      {children}
    </div>,
    document.body,
  );
}
