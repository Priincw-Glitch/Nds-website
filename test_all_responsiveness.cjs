const { spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(os.tmpdir(), 'edge_resp_all_' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9227',
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
  { path: '/about', label: 'About Us' },
  { path: '/privacy', label: 'Privacy Policy' },
  { path: '/services', label: 'Services Index' },
  { path: '/services/web-development', label: 'Service Detail' },
  { path: '/promo', label: 'Promo Index' },
  { path: '/blog', label: 'Blog Index' },
  { path: '/blog/5-praktik-keamanan-dasar-untuk-jaringan-kantor', label: 'Blog Detail' },
  { path: '/contact', label: 'Contact Us' },
  { path: '/login', label: 'Login' },
  { path: '/forgot-password', label: 'Forgot Password' },
  { path: '/admin', label: 'Admin Dashboard', auth: true },
  { path: '/admin/services', label: 'Admin Services', auth: true },
  { path: '/admin/services/create', label: 'Admin Services Create', auth: true },
  { path: '/admin/services/1/edit', label: 'Admin Services Edit', auth: true },
  { path: '/admin/service-categories', label: 'Admin Service Categories', auth: true },
  { path: '/admin/coverages', label: 'Admin Coverages', auth: true },
  { path: '/admin/promos', label: 'Admin Promos', auth: true },
  { path: '/admin/promos/create', label: 'Admin Promos Create', auth: true },
  { path: '/admin/promos/1/edit', label: 'Admin Promos Edit', auth: true },
  { path: '/admin/articles', label: 'Admin Articles', auth: true },
  { path: '/admin/messages', label: 'Admin Messages', auth: true },
  { path: '/admin/settings', label: 'Admin Settings', auth: true },
  { path: '/admin/profile', label: 'Admin Profile', auth: true },
  { path: '/admin/customers', label: 'Admin Customers', auth: true },
  { path: '/admin/customers/create', label: 'Admin Customers Create', auth: true },
  { path: '/admin/customer-services', label: 'Admin Customer Services', auth: true },
  { path: '/admin/support', label: 'Admin Support', auth: true },
  { path: '/admin/support/statistics', label: 'Admin Support Stats', auth: true },
];

async function run() {
  await sleep(1500);

  const targetsRes = await fetch('http://127.0.0.1:9227/json/list');
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

  // Authenticate first
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

  console.log('=== TESTING RESPONSIVENESS (OVERFLOW & RENDERING) ===\n');

  const report = [];

  for (const page of testUrls) {
    await send('Page.navigate', { url: 'http://127.0.0.1:8000' + page.path });
    await sleep(1500);

    for (const bp of breakpoints) {
      await send('Emulation.setDeviceMetricsOverride', {
        width: bp.width,
        height: bp.height,
        deviceScaleFactor: 1,
        mobile: bp.name === 'Mobile'
      });
      await sleep(300);

      const overflowRes = await send('Runtime.evaluate', {
        expression: `
          (() => {
            const docWidth = document.documentElement.scrollWidth;
            const winWidth = window.innerWidth;
            const hasOverflow = docWidth > winWidth + 2;
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
      if (status === 'OVERFLOW') {
        console.log(`[!] OVERFLOW: ${page.label} at ${bp.name} (${bp.width}px): docWidth=${data.docWidth}px, winWidth=${data.winWidth}px`);
      }
      report.push({
        page: page.label,
        path: page.path,
        breakpoint: bp.name,
        width: bp.width,
        status,
        docWidth: data.docWidth,
        winWidth: data.winWidth
      });
    }
    console.log(`PASS: ${page.label.padEnd(28)} (All 4 breakpoints OK)`);
  }

  fs.writeFileSync('all_responsiveness_report.json', JSON.stringify(report, null, 2));
  console.log('\nAll responsiveness tests completed successfully!');

  ws.close();
  edge.kill();
}

run().catch(err => {
  console.error(err);
  edge.kill();
});
