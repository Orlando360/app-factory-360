import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "app-factory-360",
  name: "App Factory 360",
});

// Event payload types
export type PipelineStartEvent = {
  name: "app-factory/pipeline.start";
  data: {
    jobId: string;
    client_brief: Record<string, unknown>;
  };
};
