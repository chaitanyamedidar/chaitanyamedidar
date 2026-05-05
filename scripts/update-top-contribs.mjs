import { readFile, writeFile } from "node:fs/promises";

const username = process.env.GITHUB_USERNAME || "chaitanyamedidar";
const token = process.env.GITHUB_TOKEN;
const readmePath = process.env.README_PATH || "README.md";
const limit = Number(process.env.TOP_CONTRIB_LIMIT || 8);
const includeOwnRepos = process.env.INCLUDE_OWN_REPOS === "true";

if (!token) {
  throw new Error("GITHUB_TOKEN is required.");
}

const headers = {
  Accept: "application/vnd.github+json",
  Authorization: `Bearer ${token}`,
  "X-GitHub-Api-Version": "2022-11-28",
  "User-Agent": `${username}-profile-readme-updater`,
};

async function githubJson(url) {
  const response = await fetch(url, { headers });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`GitHub API ${response.status} for ${url}: ${body}`);
  }

  return response.json();
}

function formatStars(stars) {
  if (stars >= 1000) {
    return `${(stars / 1000).toFixed(stars >= 10000 ? 0 : 1)}k`;
  }

  return String(stars);
}

function escapeCell(value) {
  return String(value ?? "-").replaceAll("|", "\\|").replaceAll("\n", " ");
}

async function fetchMergedPrs() {
  const query = encodeURIComponent(`author:${username} is:pr is:merged archived:false`);
  const url = `https://api.github.com/search/issues?q=${query}&sort=updated&order=desc&per_page=100`;
  const data = await githubJson(url);
  return data.items ?? [];
}

async function main() {
  const prs = await fetchMergedPrs();
  const repos = new Map();

  for (const pr of prs) {
    const repoApiUrl = pr.repository_url;
    if (!repoApiUrl || repos.has(repoApiUrl)) {
      if (repos.has(repoApiUrl)) {
        repos.get(repoApiUrl).prCount += 1;
      }
      continue;
    }

    const repo = await githubJson(repoApiUrl);
    const owner = repo.owner?.login?.toLowerCase();

    if (!includeOwnRepos && owner === username.toLowerCase()) {
      continue;
    }

    repos.set(repoApiUrl, {
      name: repo.full_name,
      url: repo.html_url,
      stars: repo.stargazers_count ?? 0,
      language: repo.language || "-",
      prCount: 1,
    });
  }

  const rows = [...repos.values()]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit)
    .map((repo) => {
      const contribution = repo.prCount === 1 ? "Merged PR" : `${repo.prCount} merged PRs`;
      return `| [${escapeCell(repo.name)}](${repo.url}) | ${formatStars(repo.stars)} | ${escapeCell(repo.language)} | ${contribution} |`;
    });

  const generated =
    rows.length > 0
      ? [
          "| Repository | Stars | Language | Contribution |",
          "|---|---:|---|---|",
          ...rows,
        ].join("\n")
      : [
          "| Repository | Stars | Language | Contribution |",
          "|---|---:|---|---|",
          "| No public merged PR contributions found yet | - | - | - |",
        ].join("\n");

  const start = "<!-- TOP-STARRED-CONTRIBS:START -->";
  const end = "<!-- TOP-STARRED-CONTRIBS:END -->";
  const readme = await readFile(readmePath, "utf8");
  const nextReadme = readme.replace(
    new RegExp(`${start}[\\s\\S]*?${end}`),
    `${start}\n${generated}\n${end}`,
  );

  if (nextReadme === readme) {
    console.log("README already up to date.");
    return;
  }

  await writeFile(readmePath, nextReadme);
  console.log(`Updated ${readmePath} with ${rows.length} top-starred contribution repos.`);
}

await main();
