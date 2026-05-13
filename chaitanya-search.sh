#!/usr/bin/env bash
set -euo pipefail

GREEN="\033[38;5;113m"
CYAN="\033[38;5;45m"
YELLOW="\033[38;5;220m"
DIM="\033[2m"
BOLD="\033[1m"
RESET="\033[0m"

command_name="${1:-help}"

header() {
  printf "${GREEN}chaitanya-search${RESET} ${DIM}::${RESET} ${BOLD}%s${RESET}\n\n" "$1"
}

prompt() {
  printf "%b\$%b %bchaitanya search --%s%b\n\n" "$DIM" "$RESET" "$CYAN" "$1" "$RESET"
}

help_screen() {
  cat <<'EOF'
chaitanya-search

Usage:
  ./chaitanya-search.sh <command>

Commands:
  about          Show a short profile summary
  top-contribs   Show top open-source contribution repos
  hackathons     Show hackathon / demo projects
  ml-projects    Show ML systems projects
  stack          Show core stack
  contact        Show links
  all            Show everything
EOF
}

about() {
  prompt "about"
  header "about"
  cat <<'EOF'
Name: Chaitanya Medidar
Focus: Adaptive Selective Training of vLLM
Mode: Omarchy Arch Linux energy

Full-stack developer focused on web development, CI/CD pipelines,
automations, Python, JavaScript, design, ML systems, and product-ready AI demos.
EOF
}

top_contribs() {
  prompt "top-contribs"
  header "top starred contributions"
  cat <<'EOF'
@microsoft/vscode
  https://github.com/microsoft/vscode
  High-star open-source contribution

@ankidroid/anki-android
  https://github.com/ankidroid/anki-android
  Android open-source contribution

@falling-fruit/falling-fruit-web
  https://github.com/falling-fruit/falling-fruit-web
  Web open-source contribution

@hiero-ledger/hiero-sdk-cpp
  https://github.com/hiero-ledger/hiero-sdk-cpp
  C++ SDK open-source contribution

@metal3-io/project-infra
  https://github.com/metal3-io/project-infra
  Infrastructure open-source contribution
EOF
}

hackathons() {
  prompt "hackathons"
  header "hackathon projects"
  cat <<'EOF'
Hackathon Winning Project
  Type: Product-ready hackathon build
  Stack: Flutter, FastAPI, React, Cloud
  Note: Update data/profile.json with the exact project name, prize, and demo link.
EOF
}

ml_projects() {
  prompt "ml-projects"
  header "ml systems projects"
  cat <<'EOF'
Adaptive Selective Training of vLLM
  Type: ML systems research
  Stack: vLLM, PyTorch, FastAPI, Python
  Summary: Efficient adaptive training workflows for large language model systems.
EOF
}

stack() {
  prompt "stack"
  header "stack"
  cat <<'EOF'
ML: PyTorch, scikit-learn, Pandas, NumPy, vLLM
Backend: FastAPI, Node.js
Frontend: Flutter, React, TypeScript
Infra: GitHub Actions, Docker, Linux, YAML, AWS
Cloud/Data: GCP, Azure, Firebase, Supabase, MongoDB, SQLite
EOF
}

contact() {
  prompt "contact"
  header "contact"
  cat <<'EOF'
GitHub:   https://github.com/chaitanyamedidar
LinkedIn: https://linkedin.com/in/chaitanya-medidar
Instagram:https://instagram.com/chaitanyamedidar
Email:    chaitanyapro19@gmail.com
EOF
}

case "$command_name" in
  help|--help|-h)
    help_screen
    ;;
  about)
    about
    ;;
  top-contribs|contribs)
    top_contribs
    ;;
  hackathons|hackathon)
    hackathons
    ;;
  ml-projects|ml)
    ml_projects
    ;;
  stack)
    stack
    ;;
  contact)
    contact
    ;;
  all)
    about
    printf "\n"
    top_contribs
    printf "\n"
    hackathons
    printf "\n"
    ml_projects
    printf "\n"
    stack
    printf "\n"
    contact
    ;;
  *)
    printf "${YELLOW}Unknown command:${RESET} %s\n\n" "$command_name"
    help_screen
    exit 1
    ;;
esac
