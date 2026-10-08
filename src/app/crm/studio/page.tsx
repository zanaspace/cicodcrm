import { redirect } from "next/navigation";

/** Campaign Studio has no landing page of its own; start at the Template Library. */
export default function StudioPage() {
  redirect("/crm/studio/templates");
}
