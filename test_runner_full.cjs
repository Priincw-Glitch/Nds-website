const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(os.tmpdir(), 'edge_audit_' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9224',
  '--user-data-dir=' + userDataDir,
  'about:blank'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await sleep(1500);

  const targetsRes = await fetch('http://127.0.0.1:9224/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  let currentConsoleErrors = [];
  let currentHttpStatus = 200;

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

    if (msg.method === 'Runtime.exceptionThrown') {
      const desc = msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text;
      currentConsoleErrors.push(desc);
    } else if (msg.method === 'Network.responseReceived') {
      if (msg.params.type === 'Document' || msg.params.response.headers['x-inertia']) {
        currentHttpStatus = msg.params.response.status;
      }
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Network.enable');
  await send('Runtime.enable');

  async function testPage(url, label) {
    currentConsoleErrors = [];
    currentHttpStatus = 200;
    
    await send('Page.navigate', { url });
    await sleep(2000);

    const titleRes = await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true });
    const title = titleRes.result.value || '';

    const contentLenRes = await send('Runtime.evaluate', { expression: 'document.body ? document.body.innerText.length : 0', returnByValue: true });
    const contentLen = contentLenRes.result.value || 0;

    const headingRes = await send('Runtime.evaluate', { 
      expression: 'document.querySelector("h1, h2, [role=heading]")?.innerText || ""', 
      returnByValue: true 
    });
    const heading = headingRes.result.value || '';

    const pathnameRes = await send('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true });
    const currentPath = pathnameRes.result.value || '';

    return {
      url,
      label,
      status: currentHttpStatus,
      currentPath,
      title,
      heading,
      contentLen,
      errors: [...currentConsoleErrors]
    };
  }

  console.log('=== PART 1: PUBLIC & AUTH PAGES (GUEST) ===');
  const publicPages = [
    { url: 'http://127.0.0.1:8000/', label: 'Homepage' },
    { url: 'http://127.0.0.1:8000/about', label: 'About Us' },
    { url: 'http://127.0.0.1:8000/privacy', label: 'Privacy Policy' },
    { url: 'http://127.0.0.1:8000/services', label: 'Services Index' },
    { url: 'http://127.0.0.1:8000/services/web-development', label: 'Service Detail: Web Dev' },
    { url: 'http://127.0.0.1:8000/services/software-application', label: 'Service Detail: Software App' },
    { url: 'http://127.0.0.1:8000/services/management-network', label: 'Service Detail: Network' },
    { url: 'http://127.0.0.1:8000/services/it-consultant', label: 'Service Detail: IT Consultant' },
    { url: 'http://127.0.0.1:8000/services/server-management', label: 'Service Detail: Server Mgmt' },
    { url: 'http://127.0.0.1:8000/services/cctv', label: 'Service Detail: CCTV' },
    { url: 'http://127.0.0.1:8000/promo', label: 'Promo' },
    { url: 'http://127.0.0.1:8000/blog', label: 'Blog' },
    { url: 'http://127.0.0.1:8000/blog/5-praktik-keamanan-dasar-untuk-jaringan-kantor', label: 'Blog Detail' },
    { url: 'http://127.0.0.1:8000/contact', label: 'Contact Us' },
    { url: 'http://127.0.0.1:8000/login', label: 'Login' },
    { url: 'http://127.0.0.1:8000/forgot-password', label: 'Forgot Password' },
    { url: 'http://127.0.0.1:8000/reset-password/sample-token', label: 'Reset Password' },
  ];

  const results = [];

  for (const p of publicPages) {
    const res = await testPage(p.url, p.label);
    results.push(res);
    console.log(`[${res.status}] ${p.label.padEnd(28)} -> title: "${res.title.substring(0, 30)}" | errors: ${res.errors.length} | path: ${res.currentPath}`);
    if (res.errors.length > 0) {
      console.log('   ERRORS:', res.errors);
    }
  }

  console.log('\n=== LOGGING IN AS ADMIN ===');
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
  await sleep(3000);

  const loginCheck = (await send('Runtime.evaluate', { expression: 'window.location.pathname', returnByValue: true })).result.value;
  console.log('Login result path:', loginCheck);

  console.log('\n=== PART 2: ADMIN PAGES (AUTHENTICATED) ===');
  const adminPages = [
    { url: 'http://127.0.0.1:8000/admin', label: 'Admin Dashboard' },
    { url: 'http://127.0.0.1:8000/admin/services', label: 'Admin Services Index' },
    { url: 'http://127.0.0.1:8000/admin/services/create', label: 'Admin Services Create' },
    { url: 'http://127.0.0.1:8000/admin/services/1/edit', label: 'Admin Services Edit' },
    { url: 'http://127.0.0.1:8000/admin/service-categories', label: 'Admin Service Categories' },
    { url: 'http://127.0.0.1:8000/admin/coverages', label: 'Admin Coverages Index' },
    { url: 'http://127.0.0.1:8000/admin/promos', label: 'Admin Promos Index' },
    { url: 'http://127.0.0.1:8000/admin/promos/create', label: 'Admin Promos Create' },
    { url: 'http://127.0.0.1:8000/admin/promos/1/edit', label: 'Admin Promos Edit' },
    { url: 'http://127.0.0.1:8000/admin/articles', label: 'Admin Articles Index' },
    { url: 'http://127.0.0.1:8000/admin/articles/create', label: 'Admin Articles Create' },
    { url: 'http://127.0.0.1:8000/admin/articles/1/edit', label: 'Admin Articles Edit' },
    { url: 'http://127.0.0.1:8000/admin/article-categories', label: 'Admin Article Categories' },
    { url: 'http://127.0.0.1:8000/admin/messages', label: 'Admin Messages Index' },
    { url: 'http://127.0.0.1:8000/admin/settings', label: 'Admin Settings Edit' },
    { url: 'http://127.0.0.1:8000/admin/profile', label: 'Admin Profile Edit' },
    { url: 'http://127.0.0.1:8000/admin/customers', label: 'Admin Customers Index' },
    { url: 'http://127.0.0.1:8000/admin/customers/create', label: 'Admin Customers Create' },
    { url: 'http://127.0.0.1:8000/admin/customers/registrations', label: 'Admin Customer Registrations' },
    { url: 'http://127.0.0.1:8000/admin/customer-services', label: 'Admin Customer Services Index' },
    { url: 'http://127.0.0.1:8000/admin/customer-services/create', label: 'Admin Customer Services Create' },
    { url: 'http://127.0.0.1:8000/admin/support', label: 'Admin Support Tickets Index' },
    { url: 'http://127.0.0.1:8000/admin/support/statistics', label: 'Admin Support Statistics' },
  ];

  for (const p of adminPages) {
    const res = await testPage(p.url, p.label);
    results.push(res);
    console.log(`[${res.status}] ${p.label.padEnd(30)} -> heading: "${res.heading.substring(0, 25)}" | errors: ${res.errors.length} | len: ${res.contentLen}`);
    if (res.errors.length > 0) {
      console.log('   ERRORS:', res.errors);
    }
  }

  console.log('\n=== PART 3: CUSTOMER PORTAL PAGES AS ADMIN (EXPECTED FORBIDDEN) ===');
  const customerPages = [
    { url: 'http://127.0.0.1:8000/customer/dashboard', label: 'Customer Dashboard' },
    { url: 'http://127.0.0.1:8000/customer/promos', label: 'Customer Promos' },
    { url: 'http://127.0.0.1:8000/customer/profile', label: 'Customer Profile' },
    { url: 'http://127.0.0.1:8000/customer/support', label: 'Customer Support' },
    { url: 'http://127.0.0.1:8000/customer/notifications', label: 'Customer Notifications' },
  ];

  for (const p of customerPages) {
    const res = await testPage(p.url, p.label);
    results.push(res);
    console.log(`[${res.status}] ${p.label.padEnd(25)} -> title: "${res.title.substring(0, 25)}" | heading: "${res.heading}" | errors: ${res.errors.length}`);
  }

  // Write full raw results to JSON file for analysis
  require('fs').writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
  console.log('\nAudit completed. Saved results to audit_results.json');

  ws.close();
  edge.kill();
}

run().catch(err => {
  console.error('Audit run failed:', err);
  edge.kill();
});
