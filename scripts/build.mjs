import { cp, readFile, rm, writeFile } from 'node:fs/promises';

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

  const index = new URL('index.html', output);
  const html = await readFile(index, 'utf8');
  const analyticsScript = '    <script src="/posthog.js" defer></script>\n';
  await writeFile(index, html.replace('  </head>', analyticsScript + '  </head>'));
}
