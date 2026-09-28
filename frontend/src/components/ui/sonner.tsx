import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      closeButton
      richColors
      toastOptions={{
        classNames: {
          toast: "border border-border bg-card text-foreground shadow-lg",
        },
      }}
    />
  );
}
