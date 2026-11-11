import { useEffect, type RefObject } from 'react';

// While a dialog is open: focus its first control, keep Tab inside it, run onEscape on Escape,
// and return focus to where it was on closing. `deps` lists the state the dialogs depend on,
// so focus is re-applied when one dialog replaces another.
export function useModalFocus(
  modalRef: RefObject<HTMLElement | null>,
  open: boolean,
  onEscape: () => void,
  deps: unknown[],
) {
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement;
    const root = modalRef.current;
    const controls = () =>
      Array.from(root?.querySelectorAll<HTMLElement>('button,a[href],input,select,textarea,summary') ?? []);
    controls()[0]?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onEscape();
      if (e.key === 'Tab') {
        const c = controls(),
          first = c[0],
          last = c[c.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('keydown', key);
      previous?.focus();
    };
  }, deps);
}
