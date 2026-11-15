const { spawn } = require('child_process');
const os = require('os');
const path = require('path');

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const userDataDir = path.join(os.tmpdir(), 'edge_quick_' + Date.now());

const edge = spawn(edgePath, [
  '--headless=new',
  '--remote-debugging-port=9225',
  '--user-data-dir=' + userDataDir,
  'about:blank'
]);

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  await sleep(1500);

  const targetsRes = await fetch('http://127.0.0.1:9225/json/list');
  const targets = await targetsRes.json();
  const pageTarget = targets.find(t => t.type === 'page') || targets[0];

  const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  let consoleErrors = [];

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
      consoleErrors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
    }
  };

  await new Promise(resolve => ws.onopen = resolve);
  await send('Page.enable');
  await send('Runtime.enable');

  // Login as admin
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

  // Navigate to /admin/customers/create
  consoleErrors = [];
  await send('Page.navigate', { url: 'http://127.0.0.1:8000/admin/customers/create' });
  await sleep(2500);

  const heading = (await send('Runtime.evaluate', { expression: 'document.querySelector("h1, h2")?.innerText || ""', returnByValue: true })).result.value;
  const title = (await send('Runtime.evaluate', { expression: 'document.title', returnByValue: true })).result.value;
  const form = (await send('Runtime.evaluate', { expression: '!!document.querySelector("form")', returnByValue: true })).result.value;

  console.log('Heading:', heading);
  console.log('Title:', title);
  console.log('Form rendered:', form);
  console.log('Console errors:', consoleErrors);

  ws.close();
  edge.kill();
}

run().catch(err => {
  console.error(err);
  edge.kill();
});
