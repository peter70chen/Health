import { spawn, execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');
const RESULTS_DIR = path.join(ROOT_DIR, 'verification-results');

const LEGACY_PORT = 3002;
const VITE_PORT = 4173;

async function startServer(command, args, cwd, readyPattern, name) {
    console.log(`Starting ${name} server...`);
    const server = spawn(command, args, { cwd, shell: true });
    server.stderr.on('data', (data) => console.error(`[${name} ERR] ${data}`));
    return new Promise((resolve, reject) => {
        const onData = (data) => {
            if (data.toString().includes(readyPattern)) {
                console.log(`${name} server ready.`);
                server.stdout.removeListener('data', onData);
                resolve(server);
            }
        };
        server.stdout.on('data', onData);
        setTimeout(() => reject(new Error(`${name} server timeout`)), 10000);
    });
}

async function runTests(baseUrl, targetName) {
    console.log(`\nRunning tests for: ${targetName} (${baseUrl})`);
    try {
        execSync(`BASE_URL=${baseUrl} TARGET_NAME=${targetName} npx playwright test`, { stdio: 'inherit', cwd: ROOT_DIR });
    } catch (e) {
        console.error(`Tests failed for ${targetName}`);
    }
}

async function compareResults() {
    console.log("\nGenerating Comparison Report...");
    const legacyDir = path.join(RESULTS_DIR, 'legacy');
    const viteDir = path.join(RESULTS_DIR, 'vite');
    const reportPath = path.join(RESULTS_DIR, 'README.md');

    if (!fs.existsSync(legacyDir) || !fs.existsSync(viteDir)) {
        console.error("Missing results directories.");
        return;
    }

    let report = "# Verification Report\n\n| Step | Screenshot Diff | DOM Diff | Storage Diff |\n|---|---|---|---|\n";
    const files = fs.readdirSync(legacyDir).filter(f => !f.startsWith('.'));

    let hasDiff = false;

    // Group by step name
    const steps = new Set(files.map(f => f.split('.')[0]));

    for (const step of steps) {
        if (!step) continue;
        console.log(`Comparing step: ${step}`);
        let screenshotDiff = "✅ Match";
        let domDiff = "✅ Match";
        let storageDiff = "✅ Match";

        // 1. Screenshot Compare
        if (fs.existsSync(path.join(legacyDir, `${step}.png`)) && fs.existsSync(path.join(viteDir, `${step}.png`))) {
            const img1 = PNG.sync.read(fs.readFileSync(path.join(legacyDir, `${step}.png`)));
            const img2 = PNG.sync.read(fs.readFileSync(path.join(viteDir, `${step}.png`)));
            const { width, height } = img1;
            const diff = new PNG({ width, height });
            const numDiffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, { threshold: 0.1 });

            if (numDiffPixels > 0) {
                const diffPath = path.join(RESULTS_DIR, `${step}_diff.png`);
                fs.writeFileSync(diffPath, PNG.sync.write(diff));
                screenshotDiff = `❌ **${numDiffPixels} pixels** (See ${step}_diff.png)`;
                hasDiff = true;
            }
        }

        // 2. DOM JSON Compare
        if (fs.existsSync(path.join(legacyDir, `${step}_dom.json`)) && fs.existsSync(path.join(viteDir, `${step}_dom.json`))) {
            const d1 = JSON.parse(fs.readFileSync(path.join(legacyDir, `${step}_dom.json`)));
            const d2 = JSON.parse(fs.readFileSync(path.join(viteDir, `${step}_dom.json`)));
            if (JSON.stringify(d1) !== JSON.stringify(d2)) {
                domDiff = `❌ Mismatch`;
                hasDiff = true;
                // Basic deep diff output could be added here
            }
        }

        // 3. Storage JSON Compare
        if (fs.existsSync(path.join(legacyDir, `${step}.json`)) && fs.existsSync(path.join(viteDir, `${step}.json`))) {
            const s1 = JSON.parse(fs.readFileSync(path.join(legacyDir, `${step}.json`)));
            const s2 = JSON.parse(fs.readFileSync(path.join(viteDir, `${step}.json`)));
            // Normalize: ignore some keys?
            if (JSON.stringify(s1) !== JSON.stringify(s2)) {
                storageDiff = `❌ Mismatch`;
                hasDiff = true;
            }
        }

        report += `| ${step} | ${screenshotDiff} | ${domDiff} | ${storageDiff} |\n`;
    }

    fs.writeFileSync(reportPath, report);
    console.log(`Report generated at ${reportPath}`);
    if (hasDiff) console.log("⚠️ Differences were found.");
    else console.log("✅ No differences found! Consistency verified.");
}

async function main() {
    if (process.argv.includes('--compare-only')) {
        await compareResults();
        return;
    }

    let legacyServer, viteServer;
    try {
        legacyServer = await startServer('npx', ['http-server', '.', '-p', LEGACY_PORT], process.cwd(), 'Available on:', 'Legacy');
        console.log("Building Vite project...");
        execSync('npm run build', { stdio: 'ignore' });
        viteServer = await startServer('npm', ['run', 'preview', '--', '--port', VITE_PORT], process.cwd(), 'Local:', 'Vite');

        await runTests(`http://localhost:${LEGACY_PORT}/index%E6%8B%B7%E8%B2%9D.html`, 'legacy');
        await runTests(`http://localhost:${VITE_PORT}`, 'vite');

        await compareResults();

    } catch (err) {
        console.error("Error:", err);
    } finally {
        if (legacyServer) legacyServer.kill();
        if (viteServer) {
            viteServer.kill();
            try { process.kill(-viteServer.pid); } catch { }
        }
        process.exit(0);
    }
}

main();
