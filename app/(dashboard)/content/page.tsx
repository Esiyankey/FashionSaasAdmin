"use client";

import { useState } from "react";
import { PageContainer } from "@/components/shared/PageContainer";
import { LoadingState } from "@/components/shared/LoadingState";
import { ErrorState } from "@/components/shared/ErrorState";
import { Button } from "@/components/ui/button";
import { useStorefrontConfig } from "@/features/settings/hooks/useSettings";
import { StoreInfoForm } from "@/features/cms/components/StoreInfoForm";
import { HomeContentForm } from "@/features/cms/components/HomeContentForm";
import { NavigationEditor } from "@/features/cms/components/NavigationEditor";
import { AboutPageEditor } from "@/features/cms/components/AboutPageEditor";
import { TeamEditor } from "@/features/cms/components/TeamEditor";
import { useNavigation, usePage } from "@/features/cms/hooks";
import type { AboutPageContent } from "@/features/cms/types";

const TABS = [
  { id: "store", label: "Store & contact" },
  { id: "home", label: "Announcement & hero" },
  { id: "navigation", label: "Navigation" },
  { id: "about", label: "About page" },
] as const;

type TabId = (typeof TABS)[number]["id"];

export default function ContentPage() {
  const [tab, setTab] = useState<TabId>("store");

  return (
    <PageContainer
      title="Storefront content"
      description="Everything shoppers read on the website. Changes are saved to the database and appear on the storefront without a redeploy."
    >
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map((entry) => (
          <Button
            key={entry.id}
            role="tab"
            aria-selected={tab === entry.id}
            size="sm"
            variant={tab === entry.id ? "default" : "outline"}
            onClick={() => setTab(entry.id)}
          >
            {entry.label}
          </Button>
        ))}
      </div>
      <div className="max-w-3xl pb-10">
        {tab === "store" || tab === "home" ? <ConfigTab tab={tab} /> : null}
        {tab === "navigation" && <NavigationTab />}
        {tab === "about" && <AboutTab />}
      </div>
    </PageContainer>
  );
}

function ConfigTab({ tab }: { tab: "store" | "home" }) {
  const { data, isLoading, isError, refetch } = useStorefrontConfig();
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingState rows={6} />;
  return tab === "store" ? <StoreInfoForm initial={data} /> : <HomeContentForm initial={data} />;
}

function NavigationTab() {
  const { data, isLoading, isError, refetch } = useNavigation();
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingState rows={6} />;
  return <NavigationEditor initial={data} />;
}

function AboutTab() {
  const { data, isLoading, isError, refetch } = usePage<AboutPageContent>("about");
  if (isError) return <ErrorState onRetry={() => refetch()} />;
  if (isLoading || !data) return <LoadingState rows={6} />;
  return (
    <div className="flex flex-col gap-6">
      <AboutPageEditor initial={data.content} />
      <TeamEditor />
    </div>
  );
}
