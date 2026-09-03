interface StorefrontFooterProps {
  storeName: string;
  footerText?: string | null;
  contactEmail?: string | null;
}

export function StorefrontFooter({ storeName, footerText, contactEmail }: StorefrontFooterProps) {
  return (
    <footer className="border-t border-neutral-200 py-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-1 px-4 text-sm text-neutral-500">
        <p>{footerText || `© ${new Date().getFullYear()} ${storeName}. All rights reserved.`}</p>
        {contactEmail && <p>{contactEmail}</p>}
      </div>
    </footer>
  );
}
