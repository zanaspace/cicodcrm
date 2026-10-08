import { TemplateHistory } from "../../components/TemplateHistory";

export default async function StudioTemplatePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateHistory id={id} />;
}
