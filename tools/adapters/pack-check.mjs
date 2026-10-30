import { mkdtemp, mkdir, writeFile, cp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const root = resolve('.');
const directory = await mkdtemp(join(tmpdir(), 'boe-adapter-consumer-'));
const run = (command, args, cwd = directory) => execFileSync(command, args, { cwd, stdio: 'pipe' }).toString();
const archives = [];
for (const name of ['', 'solid', 'preact']) {
  const cwd = name ? join(root, 'packages', name) : root;
  const result = JSON.parse(run('npm', ['pack', '--ignore-scripts', '--json', '--pack-destination', directory], cwd));
  archives.push(join(directory, result[0].filename));
}
await writeFile(join(directory, 'package.json'), JSON.stringify({ private: true, type: 'module' }));
run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', ...archives, 'solid-js@1.9.17', 'preact@11.0.1', 'preact-render-to-string@6.8.0', 'typescript@5.9.3', 'vite@8.2.0', 'vite-plugin-solid@2.11.14', 'playwright-core@1.61.1']);
// Imports must use packed exports and work without DOM globals.
run('node', ['--input-type=module', '-e', `for (const framework of ['solid', 'preact']) { const adapter = await import('@unofficialbox/box-open-elements-' + framework); if (!adapter.Button || !adapter.Select || !adapter.createWebComponent || !adapter.ExplorerSelectionController) throw new Error('Missing public exports'); }`]);
// New chart entrypoints and their public declarations must exist in actual tarballs.
const chartExports = {"grouped-bar-chart":"GroupedBarChart","scatter-chart":"ScatterChart","bubble-chart":"BubbleChart","area-chart":"AreaChart","mixed-chart":"MixedChart","pie-chart":"PieChart","radar-chart":"RadarChart","polar-area-chart":"PolarAreaChart"};
run('node', ['--input-type=module', '-e', `for(const [path,name] of Object.entries(${JSON.stringify(chartExports)})){const entry=await import('@unofficialbox/box-open-elements/'+path);if(entry[name]?.tagName!=='box-'+path||entry[name].register()!==entry[name])throw new Error('Invalid packed chart export '+path);}`]);
await writeFile(join(directory,'chart-consumer.ts'), `import {GroupedBarChart,ScatterChart,BubbleChart,AreaChart,MixedChart,PieChart,RadarChart,PolarAreaChart,type CartesianSeries,type ChartAnimationPreset} from '@unofficialbox/box-open-elements';\nconst series:CartesianSeries[]=[{id:'s',label:'S',points:[{id:'p',x:1,y:2,size:3}]}];\nfor(const chart of [new GroupedBarChart(),new ScatterChart(),new BubbleChart(),new AreaChart(),new MixedChart()]){chart.series=series;chart.yAxes=[{id:'primary',label:'Files'}];chart.interpolation='monotone';chart.xScale='time';const preset:ChartAnimationPreset='progressive';chart.animated=true;chart.animationPreset=preset;chart.animationDuration=1000;chart.animationLoop=false;chart.animationPaused=false;chart.replayAnimation();chart.finishAnimation();}\nnew PieChart().segments=[{id:'a',label:'A',value:1}];new PolarAreaChart().segments=[{id:'a',label:'A',value:1}];new RadarChart().axes=[{id:'a',label:'A'}];`);
run(join(directory,'node_modules/.bin/tsc'),['--noEmit','--strict','--skipLibCheck','--target','ES2022','--module','NodeNext','chart-consumer.ts']);
// Build the actual checked-in consumers against packed packages, with no paths
// back to the repository, then execute both server builds in a fresh Node process.
await cp(join(root, 'examples/frameworks/jsx-acceptance.ts'), join(directory, 'jsx-acceptance.ts'));
for (const framework of ['solid', 'preact']) {
  const dir = join(directory, framework);
  await mkdir(join(dir, 'src'), { recursive: true });
  await cp(join(root, 'examples/frameworks', framework, 'src'), join(dir, 'src'), { recursive: true });
  await cp(join(root, 'examples/frameworks', framework, 'index.html'), join(dir, 'index.html'));
  await cp(join(root, 'examples/frameworks', framework, 'tsconfig.json'), join(dir, 'tsconfig.json'));
  const plugin = framework === 'solid' ? `import solid from 'vite-plugin-solid';` : '';
  await writeFile(join(dir, 'vite.config.js'), `${plugin} export default { root: ${JSON.stringify(dir)}, resolve: { dedupe: ['solid-js', 'preact'] }, ${framework === 'solid' ? 'plugins: [solid({ ssr: true })],' : ''} ssr: { noExternal: true }, build: { outDir: ${JSON.stringify(join(directory, '.framework-validation', framework))} } };`);
  run(join(directory, 'node_modules/.bin/tsc'), ['--noEmit', '-p', join(dir, 'tsconfig.json')]);
  run(join(directory, 'node_modules/.bin/vite'), ['build', '--config', join(dir, 'vite.config.js')]);
  run(join(directory, 'node_modules/.bin/vite'), ['build', '--config', join(dir, 'vite.config.js'), '--ssr', 'src/server.tsx', '--outDir', join(directory, '.framework-validation', `${framework}-ssr`)]);
  run('node', [join(directory, '.framework-validation', `${framework}-ssr/server.js`)]);
}
await cp(join(root, 'tools/adapters/jsx-browser.mjs'), join(directory, 'browser.mjs'));
for (const engine of (process.env.BOE_PACK_BROWSERS ?? '').split(',').filter(Boolean)) {
  execFileSync('node', ['browser.mjs'], { cwd: directory, env: { ...process.env, BOE_JSX_BROWSER: engine }, stdio: 'inherit' });
}
console.log(JSON.stringify({ status: 'passed', directory, packages: archives, checks: ['clean npm install', 'DOM-free packed exports', 'public JSX typecheck', 'production consumer builds', 'native Node SSR'], browserCommand: `cd ${directory} && node browser.mjs` }, null, 2));
