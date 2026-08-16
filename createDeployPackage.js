// Create build.zip from dist folder with maximum compression (cross-platform)

/* eslint-disable no-undef */

import fs from "node:fs";
import path from "node:path";
import { exec } from "node:child_process";
import JSZip from "jszip";

const MAX = 13 * 1024; // 13kb

function createBuildZip() {
    return new Promise((resolve, reject) => {
        const zip = new JSZip();
        const distDir = "./dist";

        // Read all files from dist directory recursively
        function walkDir(dir, zipFolder) {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
                const fullPath = path.join(dir, entry.name);
                if (entry.isDirectory()) {
                    walkDir(fullPath, zipFolder.folder(entry.name));
                } else {
                    const content = fs.readFileSync(fullPath);
                    zipFolder.file(entry.name, content);
                }
            }
        }

        try {
            walkDir(distDir, zip);

            // Generate zip with compression
            zip.generateAsync({
                type: "nodebuffer",
                compression: "DEFLATE",
                compressionOptions: { level: 9 },
            })
                .then((data) => {
                    fs.writeFileSync("build.zip", data);

                    // Try advzip if available (optional post-processing)
                    exec(
                        "advzip -z -4 -i 100 build.zip",
                        { timeout: 5000 },
                        (advErr) => {
                            if (!advErr) {
                                const finalBytes =
                                    fs.statSync("build.zip").size;
                                const finalPercent = (
                                    (finalBytes / MAX) *
                                    100
                                ).toFixed(2);
                                console.log(
                                    `✓ After advzip: ${finalBytes} bytes (${finalPercent}%)`,
                                );
                            }

                            // Final report
                            const reportBytes = fs.statSync("build.zip").size;
                            const reportPercent = (
                                (reportBytes / MAX) *
                                100
                            ).toFixed(2);
                            if (reportBytes > MAX) {
                                console.error(
                                    `⚠️  Size overflow: ${reportBytes} bytes (${reportPercent}%)`,
                                );
                            } else {
                                console.log(
                                    `✓ Build size: ${reportBytes} bytes (${reportPercent}%)`,
                                );
                            }
                            resolve();
                        },
                    );
                })
                .catch(reject);
        } catch (err) {
            reject(err);
        }
    });
}

createBuildZip().catch((err) => {
    console.error("ZIP creation error:", err.message);
    process.exit(1);
});
