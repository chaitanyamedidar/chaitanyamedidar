import { readFile, writeFile } from "node:fs/promises";

const args = process.argv.slice(2);
const links = args.filter((arg) => !arg.startsWith("--"));
const starThreshold = Number(process.env.TOP_CONTRIB_STAR_THRESHOLD || 10000);
const readmePath = process.env.README_PATH || "README.md";
const stdoutOnly = args.includes("--stdout");
const replaceExisting = args.includes("--replace");

if (links.length === 0) {
  console.error("Usage: node scripts/make-repo-badges.mjs https://github.com/owner/repo [more repo links...]");
  console.error("Options: --replace replaces the managed README block, --stdout prints Markdown without editing README.");
  process.exit(1);
}

function parseRepo(input) {
  const trimmed = input.trim().replace(/\/$/, "");
  const match = trimmed.match(/github\.com[/:]([^/\s]+)\/([^/\s#?]+)(?:[/?#].*)?$/i);

  if (!match) {
    throw new Error(`Not a GitHub repo link: ${input}`);
  }

  return {
    owner: match[1],
    repo: match[2].replace(/\.git$/i, ""),
  };
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

function dynamicBadge(kind, owner, repo) {
  const path = `${owner}/${repo}`;
  const encodedPath = encodeURIComponent(path);

  return `https://img.shields.io/github/stars/${encodedPath}?style=for-the-badge&logo=github&label=stars&color=A6D96A&labelColor=020617`;
}

async function repoDetails(owner, repo) {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "profile-readme-repo-badge-generator",
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
}

function repoUrl({ owner, repo }) {
  return `https://github.com/${owner}/${repo}`;
}

function uniqueRepos(repos) {
  const seen = new Set();
  const unique = [];

  for (const repo of repos) {
    const key = `${repo.owner}/${repo.repo}`.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    unique.push(repo);
  }

  return unique;
}

function extractManagedRepoLinks(readme) {
  const block = managedBlock(readme);
  if (!block) {
    return [];
  }

  const matches = [...block.matchAll(/href="(https:\/\/github\.com\/[^"]+)"/g)];
  return matches.map((match) => match[1]);
}

function managedBlock(readme) {
  const start = "<!-- TOP-STARRED-CONTRIBS:START -->";
  const end = "<!-- TOP-STARRED-CONTRIBS:END -->";
  const match = readme.match(new RegExp(`${start}[\\s\\S]*?${end}`));
  return match?.[0] ?? null;
}

function replaceManagedBlock(readme, generated) {
  const start = "<!-- TOP-STARRED-CONTRIBS:START -->";
  const end = "<!-- TOP-STARRED-CONTRIBS:END -->";
  const pattern = new RegExp(`${start}[\\s\\S]*?${end}`);

  if (!pattern.test(readme)) {
    throw new Error("README is missing TOP-STARRED-CONTRIBS markers.");
  }

  return readme.replace(pattern, `${start}\n${generated}\n${end}`);
}

async function buildBadge(repoRef, iconOverrides) {
  const { owner, repo } = repoRef;
  const fullName = `${owner}/${repo}`;
  const url = repoUrl(repoRef);
  const details = await repoDetails(owner, repo);
  const stars = details?.stargazers_count ?? 0;
  const icon = iconOverrides[fullName] || details?.owner?.avatar_url || `https://github.com/${owner}.png?size=48`;
  const lines = [
    `<p align="center">`,
    `  <a href="${url}"><kbd><img src="${icon}" width="16" height="16" alt="${fullName} icon" /> @${fullName}</kbd></a>`,
  ];

  if (stars >= starThreshold) {
    lines.push(`  <img src="${dynamicBadge("stars", owner, repo)}" alt="${fullName} stars" />`);
  }

  lines.push(
    `  <img src="${badgeUrl("contribution", "contributed", "7DD3FC", "git")}" alt="${fullName} contribution" />`,
    `</p>`,
  );

  return {
    markdown: lines.join("\n"),
    stars,
  };
}

const iconOverrides = await readIconOverrides();
const inputRepos = links.map(parseRepo);

if (stdoutOnly) {
  const badges = await Promise.all(inputRepos.map((repo) => buildBadge(repo, iconOverrides)));
  console.log(badges.map((badge) => badge.markdown).join("\n\n"));
  process.exit(0);
}

const readme = await readFile(readmePath, "utf8");
const existingRepos = replaceExisting ? [] : extractManagedRepoLinks(readme).map(parseRepo);
const repos = uniqueRepos([...existingRepos, ...inputRepos]);
const badges = await Promise.all(repos.map((repo) => buildBadge(repo, iconOverrides)));
const generated = badges
  .sort((a, b) => b.stars - a.stars)
  .map((badge) => badge.markdown)
  .join("\n\n");

await writeFile(readmePath, replaceManagedBlock(readme, generated));
console.log(`Updated ${readmePath} with ${badges.length} contributed repo badge${badges.length === 1 ? "" : "s"}.`);
