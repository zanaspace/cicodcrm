import { LOST_STAGE, WON_STAGE, type AudienceRef, type PipelineStage, type StageId } from "@/lib/mock/growth";
import { audienceLabel } from "@/lib/mock/growth";

/** Stage lookups computed from the stages query (the mock module's helpers read its store directly). */
export function stageFrom(stages: PipelineStage[] | undefined, id: StageId): PipelineStage | undefined {
  if (id === WON_STAGE.id) return WON_STAGE;
  if (id === LOST_STAGE.id) return LOST_STAGE;
  return stages?.find((s) => s.id === id);
}

export const stageLabelFrom = (stages: PipelineStage[] | undefined, id: StageId) => stageFrom(stages, id)?.label ?? id;

/** `audienceLabel`, with lead-stage names taken from the stages query. */
export function audienceLabelFrom(a: AudienceRef | null, stages: PipelineStage[] | undefined): string {
  if (a?.kind === "leads") return `Leads · ${a.stage === "open" ? "all open" : stageLabelFrom(stages, a.stage)}`;
  return audienceLabel(a);
}
