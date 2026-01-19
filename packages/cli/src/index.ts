/**
 * BasedPricer CLI
 * Command-line tool for SaaS pricing analysis
 */

import { Command } from 'commander';
import { cogsCommand } from './commands/cogs.js';
import { configCommand } from './commands/config.js';
import { version } from './version.js';

const program = new Command();

program
  .name('basedpricer')
  .description('AI-powered SaaS pricing calculator')
  .version(version);

// Register commands
program.addCommand(cogsCommand);
program.addCommand(configCommand);

// Parse arguments
program.parse();
