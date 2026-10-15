"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { FormSection } from "@/components/shared/FormSection";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { LoadingState } from "@/components/shared/LoadingState";
import { Modal } from "@/components/shared/Modal";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageField } from "@/features/media/components/ImageField";
import { getProducts } from "@/features/products/services/product.service";
import {
  useCreateOutfitOption,
  useCreateStyleLook,
  useDeleteOutfitOption,
  useDeleteStyleLook,
  useOutfitOptions,
  useStyleLooks,
  useUpdateOutfitOption,
  useUpdateStyleLook,
} from "@/features/cms/hooks";
import type { OutfitOption, OutfitOptionType, StyleLook, StyleLookInput } from "@/features/cms/types";
import { slugify } from "@/utils/slugify";

const OPTION_GROUPS: { type: OutfitOptionType; title: string; description: string }[] = [
  { type: "BODY_TYPE", title: "Body types", description: "Step 1 of the quiz." },
  { type: "SKIN_TONE", title: "Skin tones", description: "Step 2. Each tone needs a colour swatch." },
  { type: "OCCASION", title: "Occasions", description: "Step 3. Every active occasion should have at least one look." },
];

export default function OutfitFinderPage() {
  const { data: options, isLoading } = useOutfitOptions();
  const { data: looks } = useStyleLooks();

  const occasionsWithoutLook = (options ?? []).filter(
    (option) => option.type === "OCCASION" && option.isActive && !(looks ?? []).some((look) => look.isActive && look.occasionId === option.id)
  );

  return (
    <PageContainer
      title="Outfit Finder"
      description="Quiz options and the curated looks it recommends. Recommendations only include published products."
    >
      {isLoading ? (
        <LoadingState rows={8} />
      ) : (
        <div className="flex flex-col gap-6 pb-10">
          {occasionsWithoutLook.length > 0 && (
            <p className="rounded-lg border border-warning/40 bg-warning/10 p-3 text-sm">
              No active look for: {occasionsWithoutLook.map((option) => option.label).join(", ")}. Shoppers choosing these occasions get no result.
            </p>
          )}
          <LooksSection options={options ?? []} looks={looks ?? []} />
          {OPTION_GROUPS.map((group) => (
            <OptionGroup key={group.type} {...group} options={(options ?? []).filter((option) => option.type === group.type)} />
          ))}
        </div>
      )}
    </PageContainer>
  );
}

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

type OptionDraft = { id?: string; key: string; label: string; hex: string; imageUrl: string | null; position: number; isActive: boolean };

function OptionGroup({ type, title, description, options }: { type: OutfitOptionType; title: string; description: string; options: OutfitOption[] }) {
  const create = useCreateOutfitOption();
  const update = useUpdateOutfitOption();
  const remove = useDeleteOutfitOption();
  const [draft, setDraft] = useState<OptionDraft | null>(null);
  const saving = draft?.id ? update : create;

  function save() {
    if (!draft) return;
    const input = {
      key: draft.key || slugify(draft.label),
      label: draft.label,
      hex: type === "SKIN_TONE" ? draft.hex : null,
      imageUrl: type === "SKIN_TONE" ? null : draft.imageUrl,
      position: draft.position,
      isActive: draft.isActive,
    };
    const onSuccess = () => setDraft(null);
    if (draft.id) update.mutate({ id: draft.id, ...input }, { onSuccess });
    else create.mutate({ type, ...input }, { onSuccess });
  }

  return (
    <FormSection
      title={title}
      description={description}
      actions={
        <Button size="sm" variant="outline" onClick={() => setDraft({ key: "", label: "", hex: "#C69C6D", imageUrl: null, position: options.length, isActive: true })}>
          <Plus />
          Add
        </Button>
      }
    >
      <ApiErrorAlert error={remove.error} />
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <div key={option.id} className="flex items-center gap-2 rounded-full border py-1 pl-2 pr-1 text-sm">
            {option.hex && <span className="size-4 rounded-full border" style={{ backgroundColor: option.hex }} />}
            <span className={option.isActive ? "" : "text-muted-foreground line-through"}>{option.label.replace("\n", " ")}</span>
            <span className="font-mono text-xs text-muted-foreground">{option.key}</span>
            <Button size="icon-sm" variant="ghost" aria-label={`Edit ${option.label}`} onClick={() => setDraft({ ...option, hex: option.hex ?? "#000000" })}>
              <Pencil className="size-3.5" />
            </Button>
            <Button size="icon-sm" variant="ghost" aria-label={`Delete ${option.label}`} onClick={() => remove.mutate(option.id)}>
              <Trash2 className="size-3.5" />
            </Button>
          </div>
        ))}
        {options.length === 0 && <p className="text-sm text-muted-foreground">None yet.</p>}
      </div>

      <Modal open={draft !== null} onOpenChange={(open) => !open && setDraft(null)} title={draft?.id ? `Edit ${title.toLowerCase().slice(0, -1)}` : `New ${title.toLowerCase().slice(0, -1)}`}>
        {draft && (
          <div className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="option-label">Label</Label>
                <Input id="option-label" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="option-key">Key</Label>
                <Input
                  id="option-key"
                  placeholder={slugify(draft.label) || "e.g. grand-wedding"}
                  value={draft.key}
                  onChange={(e) => setDraft({ ...draft, key: e.target.value.toLowerCase() })}
                />
                <p className="text-xs text-muted-foreground">Sent by the storefront quiz. Changing it breaks saved links.</p>
              </div>
              {type === "SKIN_TONE" && (
                <div className="space-y-2">
                  <Label htmlFor="option-hex">Swatch colour</Label>
                  <Input id="option-hex" type="color" value={draft.hex} onChange={(e) => setDraft({ ...draft, hex: e.target.value.toUpperCase() })} />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="option-position">Order</Label>
                <Input id="option-position" type="number" min={0} value={draft.position} onChange={(e) => setDraft({ ...draft, position: Math.max(0, e.target.valueAsNumber || 0) })} />
              </div>
            </div>
            {type !== "SKIN_TONE" && (
              <div className="space-y-2">
                <Label>Image / icon</Label>
                <ImageField value={draft.imageUrl} alt={draft.label} onChange={(imageUrl) => setDraft({ ...draft, imageUrl })} />
              </div>
            )}
            <div className="flex items-center justify-between rounded-lg border p-3">
              <Label htmlFor="option-active">Active</Label>
              <Switch id="option-active" checked={draft.isActive} onCheckedChange={(isActive) => setDraft({ ...draft, isActive })} />
            </div>
            <ApiErrorAlert error={saving.error} />
            <Button disabled={!draft.label || saving.isPending} onClick={save}>
              Save
            </Button>
          </div>
        )}
      </Modal>
    </FormSection>
  );
}

// ---------------------------------------------------------------------------
// Looks
// ---------------------------------------------------------------------------

function usePublishedProducts() {
  return useQuery({
    queryKey: ["products", "picker", "published"],
    queryFn: () =>
      getProducts({ search: "", status: "published", categoryId: "all", sortBy: "title", sortDirection: "asc", page: 1, pageSize: 100 }),
  });
}

function LooksSection({ options, looks }: { options: OutfitOption[]; looks: StyleLook[] }) {
  const remove = useDeleteStyleLook();
  const [editing, setEditing] = useState<StyleLook | "new" | null>(null);

  return (
    <FormSection
      title="Curated looks"
      description="For an occasion, the most specific active look matching the shopper's body type and skin tone wins (no restriction = any)."
      actions={
        <Button size="sm" onClick={() => setEditing("new")}>
          <Plus />
          New look
        </Button>
      }
    >
      <ApiErrorAlert error={remove.error} />
      {looks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No looks yet.</p>
      ) : (
        <div className="flex flex-col divide-y rounded-lg border">
          {looks.map((look) => {
            const unpublished = [look.heroProduct, ...look.products].filter((product) => product && product.status !== "published");
            return (
              <div key={look.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <div className="flex-1">
                  <p className="font-medium">{look.styleName}</p>
                  <p className="text-xs text-muted-foreground">
                    {look.occasion.label} · {look.products.length + (look.heroProduct ? 1 : 0)} products
                    {look.bodyTypeIds.length > 0 && ` · ${look.bodyTypeIds.length} body type(s)`}
                    {look.skinToneIds.length > 0 && ` · ${look.skinToneIds.length} skin tone(s)`}
                  </p>
                  {unpublished.length > 0 && (
                    <p className="text-xs text-warning">{unpublished.length} product(s) are not published and will be skipped.</p>
                  )}
                </div>
                <StatusChip label={look.isActive ? "Active" : "Inactive"} tone={look.isActive ? "success" : "muted"} />
                <Button size="sm" variant="outline" onClick={() => setEditing(look)}>
                  Edit
                </Button>
                <Button size="icon-sm" variant="ghost" aria-label="Delete look" onClick={() => remove.mutate(look.id)}>
                  <Trash2 className="size-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
      {editing && <LookEditor key={editing === "new" ? "new" : editing.id} look={editing === "new" ? null : editing} options={options} onClose={() => setEditing(null)} />}
    </FormSection>
  );
}

function LookEditor({ look, options, onClose }: { look: StyleLook | null; options: OutfitOption[]; onClose: () => void }) {
  const { data: products } = usePublishedProducts();
  const create = useCreateStyleLook();
  const update = useUpdateStyleLook();
  const saving = look ? update : create;
  const occasions = options.filter((option) => option.type === "OCCASION");
  const [form, setForm] = useState<StyleLookInput & { tagsText: string }>({
    occasionId: look?.occasionId ?? occasions[0]?.id ?? "",
    styleName: look?.styleName ?? "",
    description: look?.description ?? "",
    tagsText: (look?.tags ?? []).join(", "),
    heroProductId: look?.heroProductId ?? null,
    productIds: look?.productIds ?? [],
    bodyTypeIds: look?.bodyTypeIds ?? [],
    skinToneIds: look?.skinToneIds ?? [],
    position: look?.position ?? 0,
    isActive: look?.isActive ?? true,
  });

  const toggle = (key: "bodyTypeIds" | "skinToneIds" | "productIds", id: string) =>
    setForm((current) => {
      const list = current[key] ?? [];
      return { ...current, [key]: list.includes(id) ? list.filter((entry) => entry !== id) : [...list, id] };
    });

  function save() {
    const { tagsText, ...rest } = form;
    const input: StyleLookInput = { ...rest, tags: tagsText.split(",").map((tag) => tag.trim()).filter(Boolean) };
    if (look) update.mutate({ id: look.id, ...input }, { onSuccess: onClose });
    else create.mutate(input, { onSuccess: onClose });
  }

  const productList = products?.items ?? [];

  return (
    <Modal open onOpenChange={(open) => !open && onClose()} title={look ? "Edit look" : "New look"}>
      <div className="flex max-h-[75vh] flex-col gap-4 overflow-y-auto pr-1">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Occasion</Label>
            <Select value={form.occasionId} onValueChange={(occasionId) => setForm({ ...form, occasionId })}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose an occasion" />
              </SelectTrigger>
              <SelectContent>
                {occasions.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="look-name">Style name</Label>
            <Input id="look-name" placeholder="The Amber Gala Set" value={form.styleName} onChange={(e) => setForm({ ...form, styleName: e.target.value })} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="look-description">Description</Label>
            <Textarea id="look-description" rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="look-tags">Tags (comma separated)</Label>
            <Input id="look-tags" placeholder="Limited Edition, Hand Finished" value={form.tagsText} onChange={(e) => setForm({ ...form, tagsText: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>Hero product</Label>
            <Select value={form.heroProductId ?? "none"} onValueChange={(v) => setForm({ ...form, heroProductId: v === "none" ? null : v })}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {productList.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <CheckboxGroup
          label="Suits body types (none checked = all)"
          items={options.filter((option) => option.type === "BODY_TYPE")}
          selected={form.bodyTypeIds ?? []}
          onToggle={(id) => toggle("bodyTypeIds", id)}
        />
        <CheckboxGroup
          label="Suits skin tones (none checked = all)"
          items={options.filter((option) => option.type === "SKIN_TONE")}
          selected={form.skinToneIds ?? []}
          onToggle={(id) => toggle("skinToneIds", id)}
        />
        <CheckboxGroup
          label="Complete the look (published products, in the order checked)"
          items={productList.map((product) => ({ id: product.id, label: product.title }))}
          selected={form.productIds ?? []}
          onToggle={(id) => toggle("productIds", id)}
        />

        <div className="flex items-center justify-between rounded-lg border p-3">
          <Label htmlFor="look-active">Active</Label>
          <Switch id="look-active" checked={form.isActive} onCheckedChange={(isActive) => setForm({ ...form, isActive })} />
        </div>
        <ApiErrorAlert error={saving.error} />
        <Button disabled={!form.styleName || !form.occasionId || saving.isPending} onClick={save}>
          Save look
        </Button>
      </div>
    </Modal>
  );
}

function CheckboxGroup({
  label,
  items,
  selected,
  onToggle,
}: {
  label: string;
  items: { id: string; label: string }[];
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="grid max-h-48 gap-1.5 overflow-y-auto rounded-lg border p-2 sm:grid-cols-2">
        {items.map((item) => (
          <label key={item.id} className="flex items-center gap-2 text-sm">
            <Checkbox checked={selected.includes(item.id)} onCheckedChange={() => onToggle(item.id)} />
            {item.label.replace("\n", " ")}
            {selected.includes(item.id) && <span className="text-xs text-muted-foreground">#{selected.indexOf(item.id) + 1}</span>}
          </label>
        ))}
        {items.length === 0 && <p className="text-sm text-muted-foreground">Nothing to choose yet.</p>}
      </div>
    </div>
  );
}
