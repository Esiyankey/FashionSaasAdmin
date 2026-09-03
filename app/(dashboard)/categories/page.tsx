"use client";

import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { PageContainer } from "@/components/shared/PageContainer";
import { DataTable, type DataTableColumn } from "@/components/shared/DataTable";
import { Modal } from "@/components/shared/Modal";
import { ConfirmationDialog } from "@/components/shared/ConfirmationDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/features/categories/hooks/useCategories";
import { useCreateCategory, useDeleteCategory, useUpdateCategory } from "@/features/categories/hooks/useCategoryMutations";
import { ApiError } from "@/services/http-client";
import type { Category } from "@/types/category";

export default function CategoriesPage() {
  const { data: categories, isLoading, isError, refetch } = useCategories();
  const createCategory = useCreateCategory();
  const deleteCategory = useDeleteCategory();

  const [editing, setEditing] = useState<Category | null>(null);
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [parentId, setParentId] = useState<string>("none");
  const [formError, setFormError] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);

  const updateCategory = useUpdateCategory(editing?.id ?? "");

  function openCreate() {
    setName("");
    setParentId("none");
    setFormError(null);
    setCreateOpen(true);
  }

  function openEdit(category: Category) {
    setEditing(category);
    setName(category.name);
    setParentId(category.parentId ?? "none");
    setFormError(null);
  }

  async function handleCreate() {
    try {
      await createCategory.mutateAsync({ name, parentId: parentId === "none" ? null : parentId });
      setCreateOpen(false);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to create category");
    }
  }

  async function handleUpdate() {
    if (!editing) return;
    try {
      await updateCategory.mutateAsync({ name, parentId: parentId === "none" ? null : parentId });
      setEditing(null);
    } catch (error) {
      setFormError(error instanceof ApiError ? error.message : "Unable to update category");
    }
  }

  const parentName = (id: string | null) => categories?.find((c) => c.id === id)?.name ?? "—";

  const columns: DataTableColumn<Category>[] = [
    { id: "name", header: "Name", cell: (category) => <span className="font-medium">{category.name}</span> },
    { id: "slug", header: "Slug", cell: (category) => category.slug },
    { id: "parent", header: "Parent", cell: (category) => parentName(category.parentId) },
    {
      id: "actions",
      header: "",
      cell: (category) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(category)}>
            Edit
          </Button>
          <Button size="icon" variant="outline" onClick={() => setCategoryToDelete(category)}>
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
      description="Organize your catalog into categories and subcategories."
      actions={
        <Button onClick={openCreate}>
          <Plus />
          Add category
        </Button>
      }
    >
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

      <Modal open={isCreateOpen} onOpenChange={setCreateOpen} title="New category">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="new-name">Name</Label>
            <Input id="new-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Parent category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (top level)</SelectItem>
                {categories?.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button onClick={handleCreate} disabled={!name || createCategory.isPending}>
            Create category
          </Button>
        </div>
      </Modal>

      <Modal open={!!editing} onOpenChange={(open) => !open && setEditing(null)} title="Edit category">
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input id="edit-name" value={name} onChange={(event) => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Parent category</Label>
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No parent (top level)</SelectItem>
                {categories
                  ?.filter((category) => category.id !== editing?.id)
                  .map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          {formError && <p className="text-sm text-destructive">{formError}</p>}
          <Button onClick={handleUpdate} disabled={!name || updateCategory.isPending}>
            Save changes
          </Button>
        </div>
      </Modal>

      <ConfirmationDialog
        open={!!categoryToDelete}
        onOpenChange={(open) => !open && setCategoryToDelete(null)}
        title="Delete category?"
        description={`"${categoryToDelete?.name}" will be archived and removed from all products.`}
        confirmLabel="Delete"
        variant="destructive"
        isLoading={deleteCategory.isPending}
        onConfirm={() => {
          if (!categoryToDelete) return;
          deleteCategory.mutate(categoryToDelete.id, { onSuccess: () => setCategoryToDelete(null) });
        }}
      />
    </PageContainer>
  );
}
