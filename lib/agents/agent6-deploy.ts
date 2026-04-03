import { ClientData } from "../supabase";
import { createRepo, pushFiles } from "../github";
import { createProject, triggerDeploy, waitForDeploy } from "../vercel-deploy";

export type DeployOutput = {
  github_url: string;
  vercel_url: string;
  deploy_status: string;
  deploy_time_seconds: number;
  build_logs_summary: string;
};

export async function runAgent6(
  clientData: ClientData,
  previousOutputs: Record<string, unknown>
): Promise<DeployOutput> {
  const githubToken = process.env.GITHUB_TOKEN;
  const vercelToken = process.env.DEPLOY_VERCEL_TOKEN;
  const vercelTeamId = process.env.VERCEL_TEAM_ID;

  if (!githubToken) throw new Error("GITHUB_TOKEN is not set");
  if (!vercelToken) throw new Error("DEPLOY_VERCEL_TOKEN is not set");

  const startTime = Date.now();

  // Get files from QA agent (agent5), fallback to builder (agent4)
  const qa = previousOutputs.agent5 as Record<string, unknown> | undefined;
  const builder = previousOutputs.agent4 as Record<string, unknown> | undefined;
  const files = (qa?.files || builder?.files) as Record<string, string>;

  if (!files || Object.keys(files).length === 0) {
    throw new Error("No files to deploy — agent4/agent5 produced no output");
  }

  // 1. Create GitHub repo
  const slug = clientData.business_name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 40);
  const repoName = `app-${slug}-360`;

  let githubUrl: string;
  try {
    githubUrl = await createRepo(repoName, githubToken);
  } catch (err) {
    throw new Error(`Failed to create GitHub repo: ${err}`);
  }

  // 2. Push files to GitHub
  try {
    await pushFiles(repoName, files, githubToken);
  } catch (err) {
    throw new Error(`Failed to push files to GitHub: ${err}`);
  }

  // 3. Create Vercel project linked to GitHub
  let vercelProject: { id: string; name: string };
  try {
    vercelProject = await createProject(repoName, githubUrl, vercelToken, vercelTeamId);
  } catch (err) {
    throw new Error(`Failed to create Vercel project: ${err}`);
  }

  // 4. Trigger deploy
  let deployment: { id: string; url: string; readyState: string };
  try {
    deployment = await triggerDeploy(vercelProject.id, vercelToken, vercelTeamId);
  } catch (err) {
    throw new Error(`Failed to trigger Vercel deployment: ${err}`);
  }

  // 5. Wait for deploy (up to 5 minutes)
  let vercelUrl: string;
  try {
    vercelUrl = await waitForDeploy(deployment.id, vercelToken, vercelTeamId, 300000);
  } catch (err) {
    // Return partial success if deploy is still in progress
    const elapsed = Math.round((Date.now() - startTime) / 1000);
    return {
      github_url: githubUrl,
      vercel_url: `https://${deployment.url}`,
      deploy_status: "building",
      deploy_time_seconds: elapsed,
      build_logs_summary: `Deploy triggered but timed out waiting. Check Vercel dashboard. Error: ${err}`,
    };
  }

  const elapsed = Math.round((Date.now() - startTime) / 1000);

  return {
    github_url: githubUrl,
    vercel_url: vercelUrl,
    deploy_status: "live",
    deploy_time_seconds: elapsed,
    build_logs_summary: `Successfully deployed in ${elapsed}s. GitHub: ${githubUrl}, Vercel: ${vercelUrl}`,
  };
}
