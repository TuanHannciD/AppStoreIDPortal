import { redirect } from "next/navigation";

export default function ShareLinkNewPage() {
  redirect("/admin/share-pages?create=1");
}
