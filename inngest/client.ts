import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "app-factory-360",
  // In local dev the signing/event keys can be empty — the dev server handles it.
  eventKey: process.env.INNGEST_EVENT_KEY || undefined,
});

export type PipelineStartEvent = {
  name: "app-factory/pipeline.start";
  data: {
    jobId: string;
    clientBrief: Record<string, unknown>;
  };
};
