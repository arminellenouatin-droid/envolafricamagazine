import fs from 'node:fs';
const path = process.argv[2];
const raw = JSON.parse(fs.readFileSync(path, 'utf8'));
const deployments = raw?.deployments?.deployments ?? [];
for (const deployment of deployments.slice(0, 40)) {
  const meta = deployment.meta ?? {};
  console.log(JSON.stringify({
    id: deployment.id,
    state: deployment.state,
    target: deployment.target,
    url: deployment.url,
    created: deployment.created,
    sha: meta.githubCommitSha,
    message: meta.githubCommitMessage,
    ref: meta.githubCommitRef,
    branchAlias: meta.branchAlias,
  }));
}
