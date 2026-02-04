#!/usr/bin/env node
import { Command } from "commander";
import { runHappyPath } from "./flows/happy_path";
import { runDisputePath } from "./flows/dispute_path";

const program = new Command();

program
  .name("trustnet")
  .description("TrustNet CLI")
  .version("0.1.0");

program
  .command("happy-path")
  .description("Run the happy-path flow on localnet")
  .action(async () => {
    await runHappyPath();
  });

program
  .command("dispute-path")
  .description("Run a dispute-path flow on localnet")
  .option("--winner <winner>", "provider|client", "provider")
  .action(async (opts) => {
    await runDisputePath(opts.winner as "provider" | "client");
  });

program
  .command("rep")
  .description("Fetch reputation")
  .argument("<pubkey>")
  .action(async (pubkey) => {
    console.log(`Reputation for ${pubkey} (wire up SDK in flows for full output).`);
  });

program.parseAsync();
