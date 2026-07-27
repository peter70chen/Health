import React, { useEffect, useRef, type RefObject } from 'react';

const FOCUSABLE_SELECTOR = [
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  'a[href]',
  '[tabindex]:not([tabindex="-1"])'
].join(',');

const dialogStack: symbol[] = [];
let bodyLockCount = 0;
let originalBodyOverflow = '';

interface DialogShellProps {
  children: React.ReactNode;
  labelledBy: string;
  onClose: () => void;
  panelClassName: string;
  overlayClassName?: string;
  describedBy?: string;
  initialFocusRef?: RefObject<HTMLElement>;
  closeOnBackdrop?: boolean;
}

export const DialogShell: React.FC<DialogShellProps> = ({
  children,
  labelledBy,
  describedBy,
  onClose,
  panelClassName,
  overlayClassName = 'bg-black/80 z-50 flex items-end sm:items-center justify-center p-4',
  initialFocusRef,
  closeOnBackdrop = true
}) => {
  const overlayRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  const dialogIdRef = useRef(Symbol('dialog'));

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialogId = dialogIdRef.current;

    dialogStack.push(dialogId);
    if (bodyLockCount === 0) originalBodyOverflow = document.body.style.overflow;
    bodyLockCount += 1;
    document.body.style.overflow = 'hidden';

    const siblingStates = new Map<Element, { inert: boolean; ariaHidden: string | null }>();
    const overlay = overlayRef.current;
    if (overlay) {
      let branch: Element = overlay;
      let parent = branch.parentElement;

      while (parent) {
        Array.from(parent.children).forEach(sibling => {
          if (sibling === branch || siblingStates.has(sibling)) return;
          siblingStates.set(sibling, {
            inert: (sibling as HTMLElement).inert,
            ariaHidden: sibling.getAttribute('aria-hidden')
          });
          (sibling as HTMLElement).inert = true;
          sibling.setAttribute('aria-hidden', 'true');
        });

        if (parent === document.body) break;
        branch = parent;
        parent = branch.parentElement;
      }
    }

    const focusFrame = window.requestAnimationFrame(() => {
      const target = initialFocusRef?.current
        ?? panelRef.current?.querySelector<HTMLElement>('[data-dialog-autofocus]')
        ?? panelRef.current?.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        ?? panelRef.current;
      target?.focus({ preventScroll: true });
    });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (dialogStack[dialogStack.length - 1] !== dialogId) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onCloseRef.current();
        return;
      }

      if (event.key !== 'Tab' || !panelRef.current) return;

      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter(element => element.getClientRects().length > 0);

      if (focusable.length === 0) {
        event.preventDefault();
        panelRef.current.focus();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !panelRef.current.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !panelRef.current.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', handleKeyDown);
      const stackIndex = dialogStack.lastIndexOf(dialogId);
      if (stackIndex >= 0) dialogStack.splice(stackIndex, 1);
      bodyLockCount = Math.max(0, bodyLockCount - 1);
      if (bodyLockCount === 0) document.body.style.overflow = originalBodyOverflow;
      siblingStates.forEach((state, sibling) => {
        (sibling as HTMLElement).inert = state.inert;
        if (state.ariaHidden === null) {
          sibling.removeAttribute('aria-hidden');
        } else {
          sibling.setAttribute('aria-hidden', state.ariaHidden);
        }
      });
      window.requestAnimationFrame(() => previousFocus?.focus({ preventScroll: true }));
    };
  }, [initialFocusRef]);

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 animate-fadeIn ${overlayClassName}`}
      onMouseDown={event => {
        if (closeOnBackdrop && event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        aria-describedby={describedBy}
        tabIndex={-1}
        className={panelClassName}
        onMouseDown={event => event.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
};

export default DialogShell;
