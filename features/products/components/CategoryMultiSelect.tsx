"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { cn } from "@/lib/utils";
import type { Category } from "@/types/category";

interface CategoryMultiSelectProps {
  categories: Category[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export function CategoryMultiSelect({ categories, selectedIds, onChange }: CategoryMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const selected = categories.filter((category) => selectedIds.includes(category.id));
  const topLevel = categories.filter((category) => !category.parentId);

  function toggle(id: string) {
    onChange(selectedIds.includes(id) ? selectedIds.filter((existing) => existing !== id) : [...selectedIds, id]);
  }

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
          >
            {selected.length > 0 ? `${selected.length} categor${selected.length === 1 ? "y" : "ies"} selected` : "Select categories"}
            <ChevronsUpDown className="size-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-0" align="start">
          <Command>
            <CommandInput placeholder="Search categories..." />
            <CommandList>
              <CommandEmpty>No categories found.</CommandEmpty>
              {topLevel.map((parent) => (
                <CommandGroup key={parent.id} heading={parent.name}>
                  <CommandItem value={parent.name} onSelect={() => toggle(parent.id)}>
                    <Check className={cn("size-4", selectedIds.includes(parent.id) ? "opacity-100" : "opacity-0")} />
                    {parent.name}
                  </CommandItem>
                  {categories
                    .filter((category) => category.parentId === parent.id)
                    .map((child) => (
                      <CommandItem key={child.id} value={child.name} onSelect={() => toggle(child.id)}>
                        <Check className={cn("size-4", selectedIds.includes(child.id) ? "opacity-100" : "opacity-0")} />
                        <span className="pl-3">{child.name}</span>
                      </CommandItem>
                    ))}
                </CommandGroup>
              ))}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map((category) => (
            <Badge key={category.id} variant="secondary" className="gap-1 pr-1">
              {category.name}
              <button
                type="button"
                onClick={() => toggle(category.id)}
                aria-label={`Remove ${category.name}`}
                className="rounded-full p-0.5 hover:bg-foreground/10"
              >
                <X className="size-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}
