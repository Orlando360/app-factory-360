export type VercelProject = {
  id: string;
  name: string;
};

export type VercelDeployment = {
  id: string;
  url: string;
  readyState: string;
};

const VERCEL_API = "https://api.vercel.com";

function buildHeaders(token: string): HeadersInit {
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };
}

function buildTeamQuery(teamId?: string): string {
  return teamId ? `?teamId=${teamId}` : "";
}

export async function createProject(
  name: string,
  githubRepo: string,
  token: string,
  teamId?: string
): Promise<VercelProject> {
  const teamQuery = buildTeamQuery(teamId);

  // Extract owner/repo from URL
  const match = githubRepo.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${githubRepo}`);
  }
  const [, owner, repo] = match;
  const cleanRepo = repo.replace(/\.git$/, "");

  const body: Record<string, unknown> = {
    name,
    framework: "nextjs",
    gitRepository: {
      type: "github",
      repo: `${owner}/${cleanRepo}`,
    },
  };

  const response = await fetch(`${VERCEL_API}/v10/projects${teamQuery}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel createProject failed: ${response.status} — ${error}`);
  }

  const data = await response.json();
  return { id: data.id, name: data.name };
}

export async function setEnvVars(
  projectId: string,
  vars: Array<{ key: string; value: string }>,
  token: string,
  teamId?: string
): Promise<void> {
  const teamQuery = buildTeamQuery(teamId);

  const envPayload = vars.map((v) => ({
    key: v.key,
    value: v.value,
    type: "encrypted",
    target: ["production", "preview", "development"],
  }));

  const response = await fetch(
    `${VERCEL_API}/v10/projects/${projectId}/env${teamQuery}`,
    {
      method: "POST",
      headers: buildHeaders(token),
      body: JSON.stringify(envPayload),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel setEnvVars failed: ${response.status} — ${error}`);
  }
}

export async function triggerDeploy(
  projectId: string,
  token: string,
  teamId?: string
): Promise<VercelDeployment> {
  const teamQuery = buildTeamQuery(teamId);

  const response = await fetch(`${VERCEL_API}/v13/deployments${teamQuery}`, {
    method: "POST",
    headers: buildHeaders(token),
    body: JSON.stringify({
      name: projectId,
      project: projectId,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Vercel triggerDeploy failed: ${response.status} — ${error}`);
  }

  const data = await response.json();
  return { id: data.id, url: data.url, readyState: data.readyState };
}

export async function waitForDeploy(
  deploymentId: string,
  token: string,
  teamId?: string,
  maxWaitMs = 300000
): Promise<string> {
  const teamQuery = buildTeamQuery(teamId);
  const startTime = Date.now();
  const pollInterval = 10000; // 10 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const response = await fetch(
      `${VERCEL_API}/v13/deployments/${deploymentId}${teamQuery}`,
      {
        headers: buildHeaders(token),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vercel waitForDeploy polling failed: ${response.status} — ${error}`);
    }

    const data = await response.json();
    const state = data.readyState as string;

    if (state === "READY") {
      return `https://${data.url}`;
    }

    if (state === "ERROR" || state === "CANCELED") {
      throw new Error(`Deployment failed with state: ${state}`);
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Deployment timed out after 5 minutes");
}
