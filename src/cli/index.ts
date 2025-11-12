#!/usr/bin/env node

import { Command } from 'commander';
import { createProject } from './commands/create';

const program = new Command();

program.name('api-framework').description('Enterprise API Framework CLI').version('1.0.0');

program
  .command('create')
  .description('Create a new API project')
  .argument('[project-name]', 'Name of the project')
  .option('-t, --template <template>', 'Project template', 'default')
  .option('--skip-install', 'Skip npm install')
  .action(
    async (
      projectName: string | undefined,
      options: { template?: string; skipInstall?: boolean }
    ) => {
      await createProject(projectName, options);
    }
  );

program.parse();
