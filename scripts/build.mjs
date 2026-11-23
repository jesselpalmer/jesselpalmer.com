import { cp, readdir, readFile, rm, writeFile } from 'node:fs/promises';

const publicFiles = new URL('../public/', import.meta.url);
const output = new URL('../dist/', import.meta.url);

await rm(output, { recursive: true, force: true });
await cp(publicFiles, output, { recursive: true });

const { PUBLIC_POSTHOG_PROJECT_TOKEN: projectToken, PUBLIC_POSTHOG_HOST: apiHost } = process.env;
const isPreview = process.env.VERCEL_ENV === 'preview';

if (projectToken && apiHost && !isPreview) {
  const bootstrap = await readFile(new URL('./posthog.js', import.meta.url), 'utf8');
  const config = JSON.stringify({ projectToken, apiHost });
  await writeFile(new URL('posthog.js', output), `const posthogConfig = ${config};\n${bootstrap}`);

  const analyticsScript = '    <script src="/posthog.js" defer></script>\n';
  const entries = await readdir(output, { recursive: true });
  for (const entry of entries.filter((name) => name.endsWith('.html'))) {
    const page = new URL(entry, output);
    const html = await readFile(page, 'utf8');
    await writeFile(page, html.replace('  </head>', analyticsScript + '  </head>'));
  }
}
