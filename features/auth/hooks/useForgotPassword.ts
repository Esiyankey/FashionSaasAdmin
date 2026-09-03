import { useMutation } from "@tanstack/react-query";
import { forgotPassword } from "../services/auth.service";

export function useForgotPassword() {
  return useMutation({ mutationFn: forgotPassword });
}
