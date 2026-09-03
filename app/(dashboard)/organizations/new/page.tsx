"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { FormSection } from "@/components/shared/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCreateOrganization } from "@/features/organizations/hooks/useCreateOrganization";
import { ApiError } from "@/services/http-client";

const schema = z.object({
  name: z.string().min(1, "Organization name is required"),
  description: z.string().optional(),
  contactEmail: z.string().email("Enter a valid email").optional().or(z.literal("")),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  adminName: z.string().min(1, "Admin name is required"),
  adminEmail: z.string().email("Enter a valid email"),
  adminPassword: z.string().min(8, "Password must be at least 8 characters"),
});

type FormValues = z.infer<typeof schema>;

export default function NewOrganizationPage() {
  const router = useRouter();
  const createOrganization = useCreateOrganization();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormValues) {
    try {
      const organization = await createOrganization.mutateAsync(values);
      router.push(`/organizations/${organization.id}`);
    } catch (error) {
      setError("root", { message: error instanceof ApiError ? error.message : "Unable to create organization" });
    }
  }

  return (
    <PageContainer title="New organization" description="Create an organization and its administrator account.">
      <form onSubmit={handleSubmit(onSubmit)} className="flex max-w-2xl flex-col gap-6 pb-10">
        <FormSection title="Organization details">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="name">Organization name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Input id="description" {...register("description")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactEmail">Contact email</Label>
              <Input id="contactEmail" type="email" {...register("contactEmail")} />
              {errors.contactEmail && <p className="text-sm text-destructive">{errors.contactEmail.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="contactPhone">Contact phone</Label>
              <Input id="contactPhone" {...register("contactPhone")} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register("address")} />
            </div>
          </div>
        </FormSection>

        <FormSection title="Organization administrator" description="This account will manage the organization.">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="adminName">Admin name</Label>
              <Input id="adminName" {...register("adminName")} />
              {errors.adminName && <p className="text-sm text-destructive">{errors.adminName.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="adminEmail">Admin email</Label>
              <Input id="adminEmail" type="email" {...register("adminEmail")} />
              {errors.adminEmail && <p className="text-sm text-destructive">{errors.adminEmail.message}</p>}
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="adminPassword">Initial password</Label>
              <Input id="adminPassword" type="password" {...register("adminPassword")} />
              {errors.adminPassword && <p className="text-sm text-destructive">{errors.adminPassword.message}</p>}
              <p className="text-xs text-muted-foreground">Share this with the organization so they can sign in and change it.</p>
            </div>
          </div>
        </FormSection>

        {errors.root && <p className="text-sm text-destructive">{errors.root.message}</p>}

        <div className="flex gap-3">
          <Button type="submit" disabled={createOrganization.isPending}>
            {createOrganization.isPending && <Loader2 className="animate-spin" />}
            Create organization
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push("/organizations")}>
            Cancel
          </Button>
        </div>
      </form>
    </PageContainer>
  );
}
