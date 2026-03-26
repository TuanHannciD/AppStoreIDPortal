import SharePublicScreen from "@/features/share-public/components/SharePublicScreen";

/**
 * Public share page entry.
 *
 * URL dạng:
 * /share/[code]
 */
export default async function SharePage({ params }) {
  const { code } = await params;

  return (
    <div className="bg-background text-foreground">
      <div className="mx-auto w-full max-w-[1440px] px-3 py-3 sm:px-4 sm:py-4 lg:px-6 lg:py-6">
        <SharePublicScreen code={code} />
      </div>
    </div>
  );
}
