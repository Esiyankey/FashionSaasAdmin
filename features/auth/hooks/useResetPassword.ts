import { useMutation } from "@tanstack/react-query";
import { resetPassword } from "../services/auth.service";

export function useResetPassword() {
  return useMutation({ mutationFn: resetPassword });
}
