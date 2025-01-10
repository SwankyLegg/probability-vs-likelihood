import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// WebSocket server for HMR
let wss;
const clients = new Set();

function setupHMR() {
  wss = new WebSocketServer({ port: 8080 });

  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });
}

function notifyClients() {
  clients.forEach(client => {
    if (client.readyState === 1) { // Check if client connection is open
      try {
        client.send(JSON.stringify({ type: 'reload' }));
      } catch (e) {
        console.error('Error sending reload message:', e);
      }
    }
  });
}

async function copyDir(src, dest) {
  await fs.mkdir(dest, { recursive: true });
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath);
    } else {
      await fs.copyFile(srcPath, destPath);
    }
  }
}

async function build() {
  try {
    console.log('Building...');
    // Create build directory if it doesn't exist
    const buildDir = path.join(__dirname, 'dist');
    const srcDir = path.join(__dirname, 'src');

    // Clean and recreate build directory
    await fs.rm(buildDir, { recursive: true, force: true });
    await fs.mkdir(buildDir, { recursive: true });

    // Copy all files from src to dist, maintaining directory structure
    await copyDir(srcDir, buildDir);

    // Copy d3.js from node_modules to dist
    const d3Path = path.join(__dirname, 'node_modules', 'd3', 'dist', 'd3.min.js');
    const d3DestDir = path.join(buildDir, 'lib');
    await fs.mkdir(d3DestDir, { recursive: true });
    await fs.copyFile(d3Path, path.join(d3DestDir, 'd3.min.js'));

    // Update HTML file to use the local d3.js
    const htmlPath = path.join(buildDir, 'index.html');
    let htmlContent = await fs.readFile(htmlPath, 'utf-8');
    htmlContent = htmlContent.replace(
      'src="/node_modules/d3/dist/d3.min.js"',
      'src="/lib/d3.min.js"'
    );
    await fs.writeFile(htmlPath, htmlContent);

    console.log('Build completed successfully!');

    // Always notify clients after successful build
    notifyClients();
  } catch (error) {
    console.error('Build failed:', error);
    process.exit(1);
  }
}

async function startDevServer() {
  // Setup HMR with error handling
  setupHMR();

  // Initial build
  await build();

  // Watch for changes with debouncing
  let buildTimeout;
  const srcDir = path.join(__dirname, 'src');
  chokidar.watch(srcDir, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true
  }).on('all', (event, path) => {
    console.log(`File ${event} detected on: ${path}`);

    // Debounce the build to prevent multiple rapid rebuilds
    clearTimeout(buildTimeout);
    buildTimeout = setTimeout(async () => {
      console.log('Rebuilding...');
      await build();
    }, 100);
  });

  // Start a simple static file server
  const { createServer } = await import('http');
  const handler = async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      const filePath = path.join(__dirname, 'dist', url.pathname === '/' ? 'index.html' : url.pathname);
      const content = await fs.readFile(filePath);

      const ext = path.extname(filePath);
      const contentType = {
        '.html': 'text/html',
        '.js': 'text/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml'
      }[ext] || 'text/plain';

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (error) {
      console.error(`Error serving ${req.url}:`, error);
      res.writeHead(404);
      res.end('Not found');
    }
  };

  const server = createServer(handler);
  server.listen(3000, () => {
    console.log('Dev server running at http://localhost:3000');
  });
}

// Run in dev mode if --watch flag is present
if (process.argv.includes('--watch')) {
  startDevServer();
} else {
  build();
} 