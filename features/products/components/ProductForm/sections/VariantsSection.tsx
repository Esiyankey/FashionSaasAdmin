"use client";

import { useState } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";
import { FormSection } from "@/components/shared/FormSection";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { VariantOption } from "../../../types";
import type { ProductFormValues } from "../schema";

interface OptionRow {
  name: string;
  values: string;
}

function cartesian(sets: { name: string; values: string[] }[]): VariantOption[][] {
  return sets.reduce<VariantOption[][]>((acc, set) => {
    if (acc.length === 0) return set.values.map((value) => [{ name: set.name, value }]);
    const next: VariantOption[][] = [];
    for (const combo of acc) {
      for (const value of set.values) next.push([...combo, { name: set.name, value }]);
    }
    return next;
  }, []);
}

export function VariantsSection() {
  const { control, getValues, setValue, watch } = useFormContext<ProductFormValues>();
  const { fields, remove, replace, append } = useFieldArray({ control, name: "variants" });
  const basePrice = watch("price");

  const [optionRows, setOptionRows] = useState<OptionRow[]>(() => {
    const names = getValues("variantOptionNames");
    const variants = getValues("variants");
    if (names.length === 0) return [{ name: "", values: "" }];
    return names.map((name) => ({
      name,
      values: Array.from(
        new Set(variants.flatMap((variant) => variant.options.filter((option) => option.name === name).map((option) => option.value)))
      ).join(", "),
    }));
  });

  function updateOptionRow(index: number, patch: Partial<OptionRow>) {
    setOptionRows((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  }

  function handleGenerate() {
    const validRows = optionRows.filter((row) => row.name.trim() && row.values.trim());
    if (validRows.length === 0) {
      setValue("variantOptionNames", []);
      replace([]);
      return;
    }

    const optionSets = validRows.map((row) => ({
      name: row.name.trim(),
      values: Array.from(new Set(row.values.split(",").map((value) => value.trim()).filter(Boolean))),
    }));
    const combos = cartesian(optionSets);
    const existing = getValues("variants");

    const nextVariants = combos.map((combo) => {
      const title = combo.map((option) => option.value).join(" / ");
      const match = existing.find((variant) => variant.title === title);
      return (
        match ?? {
          id: crypto.randomUUID(),
          title,
          options: combo,
          sku: "",
          inventoryQuantity: 0,
        }
      );
    });

    setValue("variantOptionNames", optionSets.map((set) => set.name));
    replace(nextVariants);
  }

  return (
    <FormSection
      title="Variants"
      description="Add options like color and size to create purchasable variants."
    >
      <div className="flex flex-col gap-3">
        {optionRows.map((row, index) => (
          <div key={index} className="grid gap-3 sm:grid-cols-[1fr_2fr_auto]">
            <div className="space-y-1.5">
              <Label>Option name</Label>
              <Input
                placeholder="e.g. Color"
                value={row.name}
                onChange={(event) => updateOptionRow(index, { name: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Values (comma separated)</Label>
              <Input
                placeholder="e.g. Black, Sand, Navy"
                value={row.values}
                onChange={(event) => updateOptionRow(index, { values: event.target.value })}
              />
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="mt-auto"
              aria-label="Remove option"
              onClick={() => setOptionRows((rows) => rows.filter((_, i) => i !== index))}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          {optionRows.length < 2 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOptionRows((rows) => [...rows, { name: "", values: "" }])}
            >
              <Plus className="size-4" />
              Add option
            </Button>
          )}
          <Button type="button" size="sm" onClick={handleGenerate}>
            Generate variants
          </Button>
        </div>
      </div>

      {fields.length > 0 && (
        <div className="overflow-hidden rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Variant</TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>Price override</TableHead>
                <TableHead>Stock</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {fields.map((field, index) => (
                <TableRow key={field.id}>
                  <TableCell className="font-medium">{field.title}</TableCell>
                  <TableCell>
                    <Input
                      className="h-8 w-32"
                      value={watch(`variants.${index}.sku`) ?? ""}
                      onChange={(event) => setValue(`variants.${index}.sku`, event.target.value)}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.01"
                      min={0}
                      className="h-8 w-28"
                      placeholder={String(basePrice)}
                      value={watch(`variants.${index}.price`) ?? ""}
                      onChange={(event) =>
                        setValue(
                          `variants.${index}.price`,
                          event.target.value === "" ? undefined : event.target.valueAsNumber
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      min={0}
                      className="h-8 w-24"
                      value={watch(`variants.${index}.inventoryQuantity`)}
                      onChange={(event) => setValue(`variants.${index}.inventoryQuantity`, event.target.valueAsNumber || 0)}
                    />
                  </TableCell>
                  <TableCell>
                    <Button type="button" variant="ghost" size="icon-sm" aria-label="Remove variant" onClick={() => remove(index)}>
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {fields.length === 0 && optionRows.every((row) => !row.name && !row.values) && (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="self-start"
          onClick={() =>
            append({ id: crypto.randomUUID(), title: "New variant", options: [], sku: "", inventoryQuantity: 0 })
          }
        >
          <Plus className="size-4" />
          Add a variant manually
        </Button>
      )}
    </FormSection>
  );
}
