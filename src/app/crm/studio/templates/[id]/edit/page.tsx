import { EmailBuilder } from "../../../components/EmailBuilder";

/** Full-screen editor: AppLayout renders this route without the sidebar and header. */
export default async function StudioEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <EmailBuilder id={id} />;
}
