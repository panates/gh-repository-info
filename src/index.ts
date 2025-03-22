import * as core from '@actions/core';
import * as github from '@actions/github';
import colors from 'ansi-colors';
import type { RepositoryInfo } from './interfaces/repository-info.interface.js';
import { scanEnvironment } from './scan-environment.js';

async function run() {
  const token =
    core.getInput('token', { trimWhitespace: true }) ||
    process.env.GITHUB_TOKEN;
  if (!token) throw new Error('"token" is required');
  const octokit = github.getOctokit(token);

  const rootDir =
    core.getInput('rootDir', { trimWhitespace: true }) ||
    process.env.GITHUB_WORKSPACE ||
    process.cwd();

  const output: RepositoryInfo = (await scanEnvironment({
    rootDir,
    token,
  })) || {
    environment: 'unknown',
    monorepo: false,
    packages: [],
  };

  const releasesRequest = await octokit.rest.repos.listReleases({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    per_page: 1,
  });
  const lastRelease = releasesRequest.data[0];
  if (lastRelease) {
    output.releaseId = lastRelease.id;
    output.releaseName = lastRelease.name || '';
    output.releaseTag = lastRelease.tag_name || '';
    output.releaseDate = lastRelease.published_at || '';
  }

  const tagsRequest = await octokit.rest.repos.listTags({
    owner: github.context.repo.owner,
    repo: github.context.repo.repo,
    per_page: 5,
  });
  output.lastTag = tagsRequest.data[0]?.name;
  output.lastTagSha = tagsRequest.data[0]?.commit?.sha || '';
  output.prevTag = tagsRequest.data[1]?.name;
  output.prevTagSha = tagsRequest.data[1]?.commit?.sha || '';
  const dockerPackages = output.packages.reduce(
    (acc, p) => (p.isDockerApp ? ++acc : acc),
    0,
  );
  const npmPackages = output.packages.reduce(
    (acc, p) => (p.isNpmPackage ? ++acc : acc),
    0,
  );

  core.setOutput('environment', output.environment);
  core.setOutput('monorepo', output.monorepo);
  core.setOutput('lastTag', output.lastTag || '');
  core.setOutput('lastTagSha', output.lastTagSha || '');
  core.setOutput('prevTag', output.prevTag || '');
  core.setOutput('prevTagSha', output.prevTagSha || '');
  core.setOutput('releaseId', output.releaseId || '');
  core.setOutput('releaseName', output.releaseName || '');
  core.setOutput('releaseTag', output.releaseTag || '');
  core.setOutput('releaseDate', output.releaseDate || '');
  core.setOutput('packages', JSON.stringify(output.packages));
  core.setOutput('dockerPackages', dockerPackages);
  core.setOutput('npmPackages', npmPackages);

  const printOutput = core.getInput('print-output', { trimWhitespace: true });
  if (printOutput === 'true' || printOutput === '') {
    let title: string;
    core.startGroup(colors.yellowBright('Repository info:'));
    console.log(colors.yellow('Environment:'), output.environment);
    console.log(
      colors.yellow('Monorepo:'),
      output.monorepo ? colors.green('yes') : colors.red('no'),
    );
    console.log(
      colors.yellow('Git Tag:'),
      output.lastTag || '-',
      colors.yellow('  SHA:'),
      colors.magenta(output.lastTagSha || ''),
    );
    console.log(
      colors.yellow('Git Prev Tag:'),
      output.prevTag || '-',
      colors.yellow('  SHA:'),
      colors.magenta(output.prevTagSha || ''),
    );

    console.log(colors.yellow('Docker Packages:'), String(dockerPackages));
    console.log(colors.yellow('Npm Packages:'), String(npmPackages));

    title = colors.yellow('Packages:');
    if (output.packages.length) {
      console.log(title);
      output.packages.forEach(p => {
        console.log(colors.yellow('  ◉ ') + colors.green(p.name));
        console.log(colors.yellow('    description: ') + p.description);
        console.log(
          colors.yellow('    target:') +
            (p.isDockerApp ? '  ☸ Docker' : '') +
            (p.isNpmPackage ? '  📚 npm' : ''),
        );
        console.log(colors.yellow('    version: ') + p.version);
        if (p.npmPublishedVersion)
          console.log(
            colors.yellow('    npm version: ') + p.npmPublishedVersion,
          );
        console.log(colors.yellow('    project directory: ') + p.directory);
        console.log(colors.yellow('    build directory: ') + p.buildDir);
      });
    } else console.log(title, colors.red('-'));

    title = colors.yellow('Last Release:');
    if (output.releaseId) {
      console.log(title);
      console.log(colors.yellow('  Name:'), output.releaseName);
      console.log(colors.yellow('  Tag:'), output.releaseTag);
      console.log(colors.yellow('  Date:'), output.releaseDate);
    } else console.log(title, colors.red('-'));

    core.endGroup();
  }
}

run().catch(error => {
  core.setFailed(error.message);
});
