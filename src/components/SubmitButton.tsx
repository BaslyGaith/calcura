"use client";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children, className = "btn-primary", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending || rest.disabled} className={className} {...rest}>
      {pending ? "…" : children}
    </button>
  );
}
