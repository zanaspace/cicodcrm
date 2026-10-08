import { TemplateCompare } from "../../../components/TemplateCompare";

export default async function StudioComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TemplateCompare id={id} />;
}
