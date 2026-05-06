import { readFile, writeFile } from "node:fs/promises";

const username = process.env.GITHUB_USERNAME || "chaitanyamedidar";
const token = process.env.GITHUB_TOKEN;
const readmePath = process.env.README_PATH || "README.md";
const limit = Number(process.env.TOP_CONTRIB_LIMIT || 8);
const starThreshold = Number(process.env.TOP_CONTRIB_STAR_THRESHOLD || 10000);
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

function badgeUrl(label, message, color = "020617", logo = "github") {
  const encodedLabel = encodeURIComponent(label).replaceAll("-", "--");
  const encodedMessage = encodeURIComponent(message).replaceAll("-", "--");
  return `https://img.shields.io/badge/${encodedLabel}-${encodedMessage}-${color}?style=for-the-badge&logo=${logo}&logoColor=A6D96A&labelColor=020617`;
}

async function readIconOverrides() {
  try {
    return JSON.parse(await readFile("scripts/repo-icons.json", "utf8"));
  } catch {
    return {};
  }
}

function repoIcon(repo, iconOverrides) {
  return iconOverrides[repo.name] || repo.ownerAvatar || `https://github.com/${repo.name.split("/")[0]}.png?size=48`;
}

function repoBadge(repo, iconOverrides) {
  const contribution = repo.prCount === 1 ? "1 merged PR" : `${repo.prCount} merged PRs`;
  const icon = repoIcon(repo, iconOverrides);
  const starBadge =
    repo.stars >= starThreshold
      ? `  <img src="${badgeUrl("stars", formatStars(repo.stars), "A6D96A")}" alt="${repo.name} stars" />`
      : null;

  const lines = [
    `<p align="center">`,
    `  <a href="${repo.url}"><kbd><img src="${icon}" width="16" height="16" alt="${repo.name} icon" /> @${repo.name}</kbd></a>`,
    `  <img src="${badgeUrl("contribution", contribution, "7DD3FC", "git")}" alt="${repo.name} contribution" />`,
    `</p>`,
  ];

  if (starBadge) {
    lines.splice(4, 0, starBadge);
  }

  return lines.join("\n");
}

async function fetchMergedPrs() {
  const query = encodeURIComponent(`author:${username} is:pr is:merged archived:false`);
  const url = `https://api.github.com/search/issues?q=${query}&sort=updated&order=desc&per_page=100`;
  const data = await githubJson(url);
  return data.items ?? [];
}

async function main() {
  const iconOverrides = await readIconOverrides();
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
      ownerAvatar: repo.owner?.avatar_url,
      prCount: 1,
    });
  }

  const badges = [...repos.values()]
    .sort((a, b) => b.stars - a.stars)
    .slice(0, limit)
    .map((repo) => repoBadge(repo, iconOverrides));

  const generated =
    badges.length > 0
      ? badges.join("\n\n")
      : `<p align="center"><img src="${badgeUrl("contributions", "waiting for public merged PRs", "020617")}" alt="No public merged PR contributions found yet" /></p>`;

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
  console.log(`Updated ${readmePath} with ${badges.length} top-starred contribution repo badges.`);
}

await main();
