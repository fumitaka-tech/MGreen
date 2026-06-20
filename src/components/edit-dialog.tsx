"use client";

import { useEffect, useRef, type ReactNode } from "react";

type EditDialogChildren = ReactNode | ((close: () => void) => ReactNode);

export function EditDialog({
  title,
  triggerLabel = "編集",
  triggerClassName,
  bodyClassName = "edit-dialog-body edit-dialog-form",
  dialogClassName = "edit-dialog",
  children,
}: {
  title: string;
  triggerLabel?: string;
  triggerClassName?: string;
  bodyClassName?: string;
  dialogClassName?: string;
  children: EditDialogChildren;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    function handleClose() {
      document.body.style.overflow = "";
    }

    dialog.addEventListener("close", handleClose);
    return () => dialog.removeEventListener("close", handleClose);
  }, []);

  function open() {
    document.body.style.overflow = "hidden";
    dialogRef.current?.showModal();
  }

  function close() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button
        type="button"
        onClick={open}
        className={
          triggerClassName ??
          "rounded-lg px-3 py-1.5 text-sm text-green-700 active:bg-green-50"
        }
      >
        {triggerLabel}
      </button>

      <dialog
        ref={dialogRef}
        className={dialogClassName}
        onClick={(e) => {
          if (e.target === dialogRef.current) close();
        }}
      >
        <div className="edit-dialog-panel">
          <div className="edit-dialog-header">
            <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
            <button
              type="button"
              onClick={close}
              className="edit-dialog-close"
              aria-label="閉じる"
            >
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                aria-hidden
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div className={bodyClassName}>
            {typeof children === "function" ? children(close) : children}
          </div>
        </div>
      </dialog>
    </>
  );
}
