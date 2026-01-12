import fs from "node:fs";
import path from "node:path";
import webpush from "web-push";

function parseArgs(argv) {
  const args = new Set(argv.slice(2));
  return {
    write: args.has("--write"),
    subject: (() => {
      const i = argv.indexOf("--subject");
      if (i >= 0 && argv[i + 1]) return String(argv[i + 1]);
      return undefined;
    })(),
  };
}

function upsertEnvValue(envText, key, value) {
  const line = `${key}=${value}`;
  const re = new RegExp(`^${key}=.*$`, "m");
  if (re.test(envText)) return envText.replace(re, line);
  // Append near the end.
  return envText.replace(/\n?$/, "\n" + line + "\n");
}

const { write, subject } = parseArgs(process.argv);
const keys = webpush.generateVAPIDKeys();

const out = {
  VAPID_PUBLIC_KEY: keys.publicKey,
  VAPID_PRIVATE_KEY: keys.privateKey,
  VAPID_SUBJECT: subject ?? "mailto:admin@example.com",
};

if (!write) {
  // Print in dotenv-friendly format.
  process.stdout.write(
    `VAPID_PUBLIC_KEY=${out.VAPID_PUBLIC_KEY}\n` +
      `VAPID_PRIVATE_KEY=${out.VAPID_PRIVATE_KEY}\n` +
      `VAPID_SUBJECT=${out.VAPID_SUBJECT}\n`
  );
  process.exit(0);
}

const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  fs.writeFileSync(envPath, "", "utf8");
}

const current = fs.readFileSync(envPath, "utf8");
let next = current;
next = upsertEnvValue(next, "VAPID_PUBLIC_KEY", out.VAPID_PUBLIC_KEY);
next = upsertEnvValue(next, "VAPID_PRIVATE_KEY", out.VAPID_PRIVATE_KEY);
next = upsertEnvValue(next, "VAPID_SUBJECT", out.VAPID_SUBJECT);

fs.writeFileSync(envPath, next, "utf8");
process.stdout.write(`Updated ${envPath} with VAPID keys.\n`);
