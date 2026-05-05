#!/usr/bin/env bash
set -euo pipefail

GREEN="\033[38;5;113m"
CYAN="\033[38;5;45m"
PINK="\033[38;5;213m"
YELLOW="\033[38;5;220m"
DIM="\033[2m"
RESET="\033[0m"

press() {
  local label="$1"
  local action="$2"
  printf "${DIM}[${RESET} ${GREEN}%s${RESET} ${DIM}]${RESET} %s\n" "$label" "$action"
}

cat <<'ART'
┌──────────────────────────────────────────────┐
│  CHAITANYA.EXE                               │
│  HP  ████████████████████  100 / 100         │
│  MP  ███████████████░░░░░   76 / 100         │
│                                              │
│  READY? PRESS THE BUTTONS                    │
└──────────────────────────────────────────────┘
ART

echo
press "A" "ship_demo()"
press "B" "train_model()"
press "START" "open_source()"
press "SELECT" "refactor_cleanly()"

echo
printf "${CYAN}Current quest:${RESET} Adaptive Selective Training of vLLM\n"
printf "${PINK}Stack:${RESET} Flutter · FastAPI · React · PyTorch · Cloud\n"
printf "${YELLOW}Mode:${RESET} Omarchy energy, minimal desktop, maximal shipping.\n"
