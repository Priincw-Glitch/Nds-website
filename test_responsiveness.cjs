const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(os.tmpdir(), 'edge_resp_' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9226',
  '--user-data-dir=' + userDataDir,
  'about:blank'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const breakpoints = [
  { name: 'Desktop', width: 1920, height: 1080 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Tablet', width: 768, height: 1024 },
  { name: 'Mobile', width: 390, height: 844 }
];

const testUrls = [
  { path: '/', label: 'Homepage' },
  { path: '/services', label: 'Services' },
  { path: '/promo', label: 'Promo' },
  { path: '/blog', label: 'Blog' },
  { path: '/contact', label: 'Contact' },
  { path: '/login', label: 'Login' },
  { path: '/admin', label: 'Admin Dashboard', auth: true },
  { path: '/admin/services', label: 'Admin Services', auth: true },
  { path: '/admin/customers', label: 'Admin Customers', auth: true }
];

async function run() {
  await sleep(1500);

  const targetsRes = await fetch('http://127.0.0.1:9226/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
      return;
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');
  await send('Emulation.setDeviceMetricsOverride', {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  // Login as admin first
  await send('Page.navigate', { url: 'http://127.0.0.1:8000/login' });
  await sleep(1500);

  await send('Runtime.evaluate', {
    expression: `
      (() => {
        const email = document.querySelector('#email');
        const pass = document.querySelector('#password');
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(email, 'admin@ndsdigital.id');
        email.dispatchEvent(new Event('input', { bubbles: true }));
        setter.call(pass, 'ndsdigital123');
        pass.dispatchEvent(new Event('input', { bubbles: true }));
        document.querySelector('button[type="submit"]').click();
      })()
    `
  });
  await sleep(2500);

  console.log('=== TESTING RESPONSIVENESS ACROSS 4 BREAKPOINTS ===\n');

  const report = [];

  for (const page of testUrls) {
    console.log(`Checking ${page.label} (${page.path}) ...`);
    await send('Page.navigate', { url: 'http://127.0.0.1:8000' + page.path });
    await sleep(2000);

    for (const bp of breakpoints) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 1,
        mobile: bp.name === 'Mobile'
      });
      await sleep(500);

      const overflowRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasOverflow = docWidth > winWidth + 2; // allowance of 2px
            return {
              docWidth,
              winWidth,
              hasOverflow
            };
          })()
        `,
        returnByValue: true
      });

      const data = overflowRes.result.value || {};
      const status = data.hasOverflow ? 'OVERFLOW' : 'OK';
      console.log(`  [${bp.name.padEnd(8)} ${bp.width}px] Overflow: ${status} (doc: ${data.docWidth}px, win: ${data.winWidth}px)`);
      report.push({
        page: page.label,
        path: page.path,
        breakpoint: bp.name,
        width: bp.width,
        data,
        status
      });
    }
    console.log('');
  }

  require('fs').writeFileSync('responsiveness_results.json', JSON.stringify(report, null, 2));
  ws.close();
  edge.kill();
}

run().catch(err => {
  console.error(err);
  edge.kill();
});
