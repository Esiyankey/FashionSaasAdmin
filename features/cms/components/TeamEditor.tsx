"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { FormSection } from "@/components/shared/FormSection";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ImageField } from "@/features/media/components/ImageField";
import { useCreateTeamMember, useDeleteTeamMember, useTeamMembers, useUpdateTeamMember } from "../hooks";
import type { TeamMember } from "../types";

type Draft = { id?: string; name: string; role: string; imageUrl: string | null; position: number; isVisible: boolean };

export function TeamEditor() {
  const { data: members, isLoading } = useTeamMembers();
  const create = useCreateTeamMember();
  const update = useUpdateTeamMember();
  const remove = useDeleteTeamMember();
  const [draft, setDraft] = useState<Draft | null>(null);
  const saving = draft?.id ? update : create;

  function save() {
    if (!draft) return;
    const { id, ...input } = draft;
    const onSuccess = () => setDraft(null);
    if (id) update.mutate({ id, ...input }, { onSuccess });
    else create.mutate(input, { onSuccess });
  }

  return (
    <FormSection
      title="Team members"
      description="Shown on the About page in this order."
      actions={
        <Button
          size="sm"
          onClick={() => setDraft({ name: "", role: "", imageUrl: null, position: members?.length ?? 0, isVisible: true })}
        >
          <Plus />
          Add member
        </Button>
      }
    >
      <ApiErrorAlert error={remove.error} />
      {isLoading ? (
        <LoadingState rows={3} />
      ) : !members?.length ? (
        <p className="text-sm text-muted-foreground">No team members yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {members.map((member: TeamMember) => (
            <div key={member.id} className="flex items-center gap-3 rounded-lg border p-3">
              {member.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.imageUrl} alt="" className="size-12 rounded-full object-cover" />
              ) : (
                <div className="size-12 rounded-full bg-muted" />
              )}
              <div className="flex-1">
                <p className="font-medium">{member.name}</p>
                <p className="text-xs text-muted-foreground">
                  {member.role} · #{member.position}
                  {!member.isVisible && " · hidden"}
                </p>
              </div>
              <Button size="sm" variant="outline" onClick={() => setDraft({ ...member })}>
                Edit
              </Button>
              <Button size="icon-sm" variant="ghost" aria-label="Delete" onClick={() => remove.mutate(member.id)}>
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </div>
      )}

      <Modal open={draft !== null} onOpenChange={(open) => !open && setDraft(null)} title={draft?.id ? "Edit team member" : "New team member"}>
        {draft && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="member-name">Name</Label>
                <Input id="member-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-role">Role</Label>
                <Input id="member-role" value={draft.role} onChange={(e) => setDraft({ ...draft, role: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="member-position">Order</Label>
                <Input
                  id="member-position"
                  type="number"
                  min={0}
                  value={draft.position}
                  onChange={(e) => setDraft({ ...draft, position: Math.max(0, e.target.valueAsNumber || 0) })}
                />
              </div>
              <div className="flex items-end justify-between gap-2 pb-2">
                <Label htmlFor="member-visible">Visible</Label>
                <Switch id="member-visible" checked={draft.isVisible} onCheckedChange={(isVisible) => setDraft({ ...draft, isVisible })} />
              </div>
            </div>
            <Label>Photo</Label>
            <ImageField value={draft.imageUrl} alt={draft.name} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
            <ApiErrorAlert error={saving.error} />
            <Button disabled={!draft.name || saving.isPending} onClick={save}>
              Save
            </Button>
          </div>
        )}
      </Modal>
    </FormSection>
  );
}
