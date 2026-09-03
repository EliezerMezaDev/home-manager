import { toast as sonnerToast } from "sonner"

export function toastError(message: string) {
  sonnerToast.error(message, {
    action: {
      label: "Copiar",
      onClick: () => {
        navigator.clipboard.writeText(message)
      },
    },
    duration: 10000,
  })
}

export function toastSuccess(message: string) {
  sonnerToast.success(message)
}

export function toastInfo(message: string) {
  sonnerToast.info(message)
}