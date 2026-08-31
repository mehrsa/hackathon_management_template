import { readFile, writeFile } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';

const args = Object.fromEntries(
  process.argv.slice(2).map((argument) => {
    const [key, ...value] = argument.replace(/^--/, '').split('=');
    return [key, value.join('=')];
  })
);

const packagePath = new URL('../package.json', import.meta.url);
const lockPath = new URL('../package-lock.json', import.meta.url);
const configPath = new URL('../rayfin/rayfin.yml', import.meta.url);
const siteTypesPath = new URL('../src/types/site.ts', import.meta.url);
const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
const prompt = createInterface({ input: stdin, output: stdout });

try {
  const projectName = (
    args['project-name'] ||
    (await prompt.question(`Project name (${packageJson.name}): `)) ||
    packageJson.name
  ).trim();
  const adminEmail = (
    args['admin-email'] || (await prompt.question('Initial admin email: '))
  ).trim().toLowerCase();

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(projectName)) {
    throw new Error('Project name must use lowercase letters, numbers, and single hyphens.');
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminEmail)) {
    throw new Error('Enter a valid initial admin email address.');
  }

  packageJson.name = projectName;
  await writeFile(packagePath, `${JSON.stringify(packageJson, null, 2)}\n`);

  const packageLock = JSON.parse(await readFile(lockPath, 'utf8'));
  packageLock.name = projectName;
  if (packageLock.packages?.['']) {
    packageLock.packages[''].name = projectName;
  }
  await writeFile(lockPath, `${JSON.stringify(packageLock, null, 2)}\n`);

  const rayfinConfig = await readFile(configPath, 'utf8');
  await writeFile(
    configPath,
    rayfinConfig
      .replace(/^id: .*$/m, `id: ${projectName}`)
      .replace(/^name: .*$/m, `name: ${projectName}`)
  );

  const siteTypes = await readFile(siteTypesPath, 'utf8');
  await writeFile(
    siteTypesPath,
    siteTypes.replace(
      /export const DEFAULT_ADMIN_EMAIL = '[^']*';/,
      `export const DEFAULT_ADMIN_EMAIL = '${adminEmail}';`
    )
  );

  console.log(`\nConfigured ${projectName} with ${adminEmail} as the initial admin.`);
  console.log('Next: make sure Docker Desktop is running, then run `npm run dev`.');
} finally {
  prompt.close();
}