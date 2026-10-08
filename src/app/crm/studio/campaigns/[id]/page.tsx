import { StudioCampaignDetail } from "../../components/StudioCampaignDetail";

export default async function StudioCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudioCampaignDetail id={id} />;
}
