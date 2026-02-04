import { AgentReputationView } from "./types";

export function computeScore(view: AgentReputationView, nowTs: number): number {
  const completed = Number(view.totalJobsCompleted);
  const failed = Number(view.totalJobsFailed);
  const disputesWon = Number(view.totalDisputesWon);
  const disputesLost = Number(view.totalDisputesLost);
  const total = completed + failed;
  let base = total === 0 ? 0 : Math.floor((completed / total) * 100);
  base += disputesWon * 2 - disputesLost * 5;
  if (completed >= 50) base += 15;
  else if (completed >= 20) base += 10;
  else if (completed >= 5) base += 5;
  const stakeSol = Number(view.stakeAmount) / 1_000_000_000;
  if (stakeSol >= 50) base += 10;
  else if (stakeSol >= 10) base += 5;
  else if (stakeSol >= 1) base += 2;
  const daysInactive = Math.floor((nowTs - view.lastActive) / 86_400);
  const multiplier = daysInactive <= 30 ? 1 : daysInactive <= 90 ? 0.95 : daysInactive <= 180 ? 0.9 : daysInactive <= 360 ? 0.8 : 0.7;
  const adjusted = Math.floor(base * multiplier);
  return Math.max(0, Math.min(100, adjusted));
}
