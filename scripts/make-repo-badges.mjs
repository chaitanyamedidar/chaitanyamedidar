const links = process.argv.slice(2);

if (links.length === 0) {
  console.error("Usage: node scripts/make-repo-badges.mjs https://github.com/owner/repo [more repo links...]");
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

function dynamicBadge(kind, owner, repo) {
  const path = `${owner}/${repo}`;
  const encodedPath = encodeURIComponent(path);

  if (kind === "stars") {
    return `https://img.shields.io/github/stars/${encodedPath}?style=for-the-badge&logo=github&label=stars&color=A6D96A&labelColor=020617`;
  }

  return `https://img.shields.io/github/languages/top/${encodedPath}?style=for-the-badge&label=language&color=1793D1&labelColor=020617`;
}

for (const link of links) {
  const { owner, repo } = parseRepo(link);
  const fullName = `${owner}/${repo}`;
  const url = `https://github.com/${fullName}`;

  console.log(`<p align="center">`);
  console.log(`  <a href="${url}">`);
  console.log(`    <img src="${badgeUrl(fullName, "repo")}" alt="${fullName}" />`);
  console.log(`  </a>`);
  console.log(`  <img src="${dynamicBadge("stars", owner, repo)}" alt="${fullName} stars" />`);
  console.log(`  <img src="${dynamicBadge("language", owner, repo)}" alt="${fullName} top language" />`);
  console.log(`  <img src="${badgeUrl("contribution", "contributed", "7DD3FC", "git")}" alt="${fullName} contribution" />`);
  console.log(`</p>`);
  console.log();
}
