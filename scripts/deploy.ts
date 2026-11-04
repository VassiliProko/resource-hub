const hook = process.env.DEPLOY_HOOK_URL;
if (!hook) throw new Error('Set DEPLOY_HOOK_URL in .env');
const res = await fetch(hook, { method: 'POST' });
console.log(res.ok ? 'Deploy triggered' : `Failed: ${res.status}`);
