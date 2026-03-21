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
      <div className="mx-auto max-w-4xl px-6 py-10">
        <SharePublicScreen code={code} />
      </div>
    </div>
  );
}
