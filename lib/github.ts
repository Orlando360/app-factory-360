import { Octokit } from "octokit";

export async function createRepo(name: string, token: string): Promise<string> {
  const octokit = new Octokit({ auth: token });

  const repoName = name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);

  const { data: user } = await octokit.rest.users.getAuthenticated();

  // If repo already exists, return its URL instead of failing
  try {
    const { data: existing } = await octokit.rest.repos.get({
      owner: user.login,
      repo: repoName,
    });
    return existing.html_url;
  } catch {
    // Repo doesn't exist, create it
  }

  const response = await octokit.rest.repos.createForAuthenticatedUser({
    name: repoName,
    private: true,
    auto_init: true,
    description: `App Factory 360 — Generated app for ${name}`,
  });

  return response.data.html_url;
}

export async function pushFiles(
  repoName: string,
  files: Record<string, string>,
  token: string
): Promise<void> {
  const octokit = new Octokit({ auth: token });

  // Get authenticated user
  const { data: user } = await octokit.rest.users.getAuthenticated();
  const owner = user.login;

  const cleanRepoName = repoName
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 100);

  // Get default branch SHA
  const { data: repoData } = await octokit.rest.repos.get({
    owner,
    repo: cleanRepoName,
  });
  const defaultBranch = repoData.default_branch;

  const { data: refData } = await octokit.rest.git.getRef({
    owner,
    repo: cleanRepoName,
    ref: `heads/${defaultBranch}`,
  });
  const latestCommitSha = refData.object.sha;

  const { data: commitData } = await octokit.rest.git.getCommit({
    owner,
    repo: cleanRepoName,
    commit_sha: latestCommitSha,
  });
  const baseTreeSha = commitData.tree.sha;

  // Create tree with all files
  const treeItems = Object.entries(files).map(([path, content]) => ({
    path,
    mode: "100644" as const,
    type: "blob" as const,
    content: String(content),
  }));

  const { data: newTree } = await octokit.rest.git.createTree({
    owner,
    repo: cleanRepoName,
    base_tree: baseTreeSha,
    tree: treeItems,
  });

  // Create commit
  const { data: newCommit } = await octokit.rest.git.createCommit({
    owner,
    repo: cleanRepoName,
    message: "feat: App Factory 360 — Initial generated app",
    tree: newTree.sha,
    parents: [latestCommitSha],
  });

  // Update branch reference
  await octokit.rest.git.updateRef({
    owner,
    repo: cleanRepoName,
    ref: `heads/${defaultBranch}`,
    sha: newCommit.sha,
  });
}
