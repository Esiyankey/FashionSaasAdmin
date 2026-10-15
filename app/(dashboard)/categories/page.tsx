"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { ApiErrorAlert } from "@/components/shared/ApiErrorAlert";
import { StatusChip } from "@/components/shared/StatusChip";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ImageField } from "@/features/media/components/ImageField";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/features/categories/hooks/useCategoryMutations";
import type { CategoryInput } from "@/features/categories/services/category.service";
import type { Category } from "@/types/category";

const EMPTY_FORM: CategoryInput = {
  name: "",
  slug: "",
  parentId: null,
  title: "",
  description: "",
  imageUrl: null,
  imageAlt: "",
  position: 0,
  isActive: true,
};

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [isFormOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<CategoryInput>(EMPTY_FORM);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const updateCategory = useUpdateCategory(editing?.id ?? "");
  const saving = editing ? updateCategory : createCategory;

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, position: categories?.length ?? 0 });
    createCategory.reset();
    setFormOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setForm({
      name: category.name,
      slug: category.slug,
      parentId: category.parentId,
      title: category.title,
      description: category.description,
      imageUrl: category.imageUrl,
      imageAlt: category.imageAlt,
      position: category.position,
      isActive: category.isActive,
    });
    updateCategory.reset();
    setFormOpen(true);
  }

  function handleSave() {
    const input = { ...form, slug: form.slug || undefined };
    saving.mutate(input, { onSuccess: () => setFormOpen(false) });
  }

  const parentName = (id: string | null) => categories?.find((c) => c.id === id)?.name ?? "—";
  const parentOptions = (categories ?? []).filter((category) => !category.parentId && category.id !== editing?.id);

  const columns: DataTableColumn<Category>[] = [
    {
      id: "image",
      header: "",
      cell: (category) =>
        category.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={category.imageUrl} alt="" className="size-10 rounded object-cover" />
        ) : (
          <div className="size-10 rounded bg-muted" />
        ),
    },
    {
      id: "name",
      header: "Name",
      cell: (category) => (
        <div>
          <p className="font-medium">{category.name}</p>
          {category.title && <p className="text-xs text-muted-foreground">{category.title}</p>}
        </div>
      ),
    },
    { id: "slug", header: "Slug", cell: (category) => <span className="font-mono text-xs">{category.slug}</span> },
    { id: "parent", header: "Parent", cell: (category) => parentName(category.parentId) },
    {
      id: "products",
      header: "Products",
      cell: (category) => `${category.publishedProductCount} live / ${category.productCount}`,
    },
    { id: "position", header: "Order", cell: (category) => category.position },
    {
      id: "status",
      header: "Status",
      cell: (category) => (
        <StatusChip label={category.isActive ? "Active" : "Hidden"} tone={category.isActive ? "success" : "muted"} />
      ),
    },
    {
      id: "actions",
      header: "",
      cell: (category) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
            Edit
          </Button>
          <Button size="icon" variant="outline" aria-label="Archive category" onClick={() => setCategoryToDelete(category)}>
            <Trash2 />
          </Button>
        </div>
      ),
      className: "text-right",
    },
  ];

  return (
    <PageContainer
      title="Categories"
      description="Organize your catalog. Active categories appear in storefront filters and navigation."
      actions={
        <Button onClick={openCreate}>
          <Plus />
          Add category
        </Button>
      }
    >
      <ApiErrorAlert error={deleteCategory.error} className="mb-4" />
      <DataTable
        columns={columns}
        data={categories ?? []}
        getRowId={(category) => category.id}
        isLoading={isLoading}
        error={isError ? true : undefined}
        onRetry={() => refetch()}
        emptyTitle="No categories yet"
        emptyDescription="Create your first category to start organizing products."
      />

      <Modal open={isFormOpen} onOpenChange={setFormOpen} title={editing ? "Edit category" : "New category"}>
        <div className="grid max-h-[70vh] gap-4 overflow-y-auto pr-1 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="cat-name">Name (filter label)</Label>
            <Input id="cat-name" value={form.name} onChange={(event) => setForm((f) => ({ ...f, name: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-slug">Slug</Label>
            <Input
              id="cat-slug"
              placeholder="Generated from the name"
              value={form.slug ?? ""}
              onChange={(event) => setForm((f) => ({ ...f, slug: event.target.value.toLowerCase() }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-title">Card heading</Label>
            <Input
              id="cat-title"
              placeholder="e.g. For Women's"
              value={form.title ?? ""}
              onChange={(event) => setForm((f) => ({ ...f, title: event.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label>Parent category</Label>
            <Select
              value={form.parentId ?? "none"}
              onValueChange={(value) => setForm((f) => ({ ...f, parentId: value === "none" ? null : value }))}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (top level)</SelectItem>
                {parentOptions.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="cat-description">Description</Label>
            <Textarea
              id="cat-description"
              rows={2}
              value={form.description ?? ""}
              onChange={(event) => setForm((f) => ({ ...f, description: event.target.value }))}
            />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Image</Label>
            <ImageField value={form.imageUrl} alt={form.imageAlt} onChange={(imageUrl) => setForm((f) => ({ ...f, imageUrl }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-alt">Image alt text</Label>
            <Input id="cat-alt" value={form.imageAlt ?? ""} onChange={(event) => setForm((f) => ({ ...f, imageAlt: event.target.value }))} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cat-position">Display order</Label>
            <Input
              id="cat-position"
              type="number"
              min={0}
              value={form.position ?? 0}
              onChange={(event) => setForm((f) => ({ ...f, position: Math.max(0, event.target.valueAsNumber || 0) }))}
            />
          </div>
          <div className="flex items-center justify-between rounded-lg border p-3 sm:col-span-2">
            <div>
              <Label>Visible on storefront</Label>
              <p className="text-xs text-muted-foreground">Hidden categories stay assigned to products but are not shown.</p>
            </div>
            <Switch checked={form.isActive ?? true} onCheckedChange={(isActive) => setForm((f) => ({ ...f, isActive }))} />
          </div>
        </div>
        <ApiErrorAlert error={saving.error} />
        <Button onClick={handleSave} disabled={!form.name || saving.isPending}>
          {editing ? "Save changes" : "Create category"}
        </Button>
      </Modal>

      <ConfirmationDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Archive category?"
        description={`"${categoryToDelete?.name}" will be archived. Categories that still contain products or subcategories can't be archived — hide them instead.`}
        confirmLabel="Archive"
        variant="destructive"
        isLoading={deleteCategory.isPending}
        onConfirm={() => {
          if (!categoryToDelete) return;
          deleteCategory.mutate(categoryToDelete.id, { onSettled: () => setCategoryToDelete(null) });
        }}
      />
    </PageContainer>
  );
}
