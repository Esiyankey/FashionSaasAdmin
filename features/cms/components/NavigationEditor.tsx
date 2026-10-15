"use client";

import { useState } from "react";
import { ArrowDown, ArrowUp, Plus, Trash2 } from "lucide-react";
import { FormSection } from "@/components/shared/FormSection";
import { SaveStatus } from "@/components/shared/SaveStatus";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useSaveNavigation } from "../hooks";
import type { NavigationLinkInput, NavigationMenus } from "../types";

type Menu = "header" | "footer";

/** Header and footer menus. Order on screen is the order on the storefront. */
export function NavigationEditor({ initial }: { initial: NavigationMenus }) {
  const save = useSaveNavigation();
  const strip = (links: NavigationMenus[Menu]) => links.map(({ label, href, isVisible }) => ({ label, href, isVisible }));
  const [menus, setMenus] = useState<Record<Menu, NavigationLinkInput[]>>({
    header: strip(initial.header),
    footer: strip(initial.footer),
  });

  function update(menu: Menu, index: number, patch: Partial<NavigationLinkInput>) {
    setMenus((current) => ({ ...current, [menu]: current[menu].map((link, i) => (i === index ? { ...link, ...patch } : link)) }));
  }
  function move(menu: Menu, index: number, delta: number) {
    setMenus((current) => {
      const links = [...current[menu]];
      const target = index + delta;
      if (target < 0 || target >= links.length) return current;
      [links[index], links[target]] = [links[target], links[index]];
      return { ...current, [menu]: links };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {(["header", "footer"] as Menu[]).map((menu) => (
        <FormSection
          key={menu}
          title={menu === "header" ? "Header menu" : "Footer links"}
          description="Use site paths like /shop, or full https:// / mailto: links."
        >
          <div className="flex flex-col gap-2">
            {menus[menu].map((link, index) => (
              <div key={index} className="grid items-center gap-2 sm:grid-cols-[1fr_1.5fr_auto]">
                <Input aria-label="Label" placeholder="Label" value={link.label} onChange={(e) => update(menu, index, { label: e.target.value })} />
                <Input aria-label="Link" placeholder="/shop" value={link.href} onChange={(e) => update(menu, index, { href: e.target.value })} />
                <div className="flex items-center gap-1">
                  <Switch aria-label="Visible" checked={link.isVisible} onCheckedChange={(isVisible) => update(menu, index, { isVisible })} />
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => move(menu, index, -1)}>
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label="Move down" onClick={() => move(menu, index, 1)}>
                    <ArrowDown className="size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Remove link"
                    onClick={() => setMenus((current) => ({ ...current, [menu]: current[menu].filter((_, i) => i !== index) }))}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="self-start"
              onClick={() => setMenus((current) => ({ ...current, [menu]: [...current[menu], { label: "", href: "/", isVisible: true }] }))}
            >
              <Plus className="size-4" />
              Add link
            </Button>
          </div>
        </FormSection>
      ))}
      <div className="flex flex-col gap-3">
        <SaveStatus isSuccess={save.isSuccess} error={save.error} />
        <Button className="self-start" disabled={save.isPending} onClick={() => save.mutate(menus)}>
          Save navigation
        </Button>
      </div>
    </div>
  );
}
