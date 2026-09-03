import type { Metadata } from "next";
import { LoginForm } from "@/features/auth/components/LoginForm";

export const metadata: Metadata = { title: "Sign in — Fashion SaaS Admin" };

export default function LoginPage() {
  return <LoginForm />;
}
