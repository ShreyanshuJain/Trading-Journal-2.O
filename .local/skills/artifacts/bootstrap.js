'use strict';

const TEMPLATE_SUFFIX = '.template';
const TEMPLATE_MANIFEST_FILENAME = 'template.json';
const TEMPLATE_MANIFEST_KEYS = new Set(['remove']);
const HTML_FILE_EXTENSIONS = new Set(['.html', '.htm']);
const TOKEN_VALUES = {
  __REPLIT_ARTIFACT_SLUG__: (slug) => slug,
  __REPLIT_ARTIFACT_TITLE__: (_, title) => title,
  __REPLIT_ARTIFACT_TITLE_JSON__: (_, title) => JSON.stringify(title),
  __REPLIT_ARTIFACT_PACKAGE_NAME__: (slug) => `@workspace/${slug}`,
};

function writeStdout(message) {
  process.stdout.write(`${message}\n`);
}

function writeStderr(message) {
  process.stderr.write(`${message}\n`);
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function parseArgs(parseNodeArgs, argv) {
  const { values, positionals } = parseNodeArgs({
    args: argv.slice(2),
    allowPositionals: true,
    options: {
      slug: { type: 'string' },
      template: { type: 'string' },
      title: { type: 'string' },
    },
  });
  const [artifactType] = positionals;
  const slug = values.slug;
  const template = values.template;
  const title = values.title;

  if (!artifactType || !slug || !title) {
    writeStderr(
      'Usage: node bootstrap.js <artifactType> --slug=<slug> --title=<title>',
    );
    process.exit(1);
  }

  return { artifactType, slug, template, title };
}

function interpolate(content, slug, title, isHtml) {
  let rendered = content;
  for (const [token, resolver] of Object.entries(TOKEN_VALUES)) {
    const value = resolver(slug, title);
    const replacement = isHtml ? escapeHtml(value) : value;
    rendered = rendered.replaceAll(token, replacement);
  }
  return rendered;
}

// Keyed by produced path, not source filename, so a template's `app.json`
// overrides a base `app.json.template`.
function collectLayer(fs, path, layerDir) {
  const files = new Map();

  const walk = (currentDir, destDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const srcPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        walk(srcPath, destDir ? `${destDir}/${entry.name}` : entry.name);
        continue;
      }

      const isTemplate = entry.name.endsWith(TEMPLATE_SUFFIX);
      const destName = isTemplate
        ? entry.name.slice(0, -TEMPLATE_SUFFIX.length)
        : entry.name;
      const destPath = destDir ? `${destDir}/${destName}` : destName;

      const collision = files.get(destPath);
      if (collision !== undefined) {
        throw new Error(
          `${layerDir}: '${collision.srcPath}' and '${srcPath}' both produce '${destPath}'`,
        );
      }

      files.set(destPath, { isTemplate, srcPath });
    }
  };

  walk(layerDir, '');
  return files;
}

// Contract: artifacts/expo/templates/README.md.
function readTemplateRemovals(fs, path, templateDir) {
  const manifestPath = path.join(templateDir, TEMPLATE_MANIFEST_FILENAME);
  if (!fs.existsSync(manifestPath)) {
    return [];
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  } catch (error) {
    throw new Error(`${manifestPath}: invalid JSON (${error.message})`);
  }

  if (manifest === null || typeof manifest !== 'object') {
    throw new Error(`${manifestPath}: expected a JSON object`);
  }

  for (const key of Object.keys(manifest)) {
    if (!TEMPLATE_MANIFEST_KEYS.has(key)) {
      throw new Error(`${manifestPath}: unknown key '${key}'`);
    }
  }

  const removals = manifest.remove ?? [];
  if (
    !Array.isArray(removals) ||
    removals.some((entry) => typeof entry !== 'string' || entry === '')
  ) {
    throw new Error(`${manifestPath}: 'remove' must be an array of paths`);
  }

  return removals;
}

function layerScaffold(baseFiles, templateFiles, removals) {
  const files = new Map([...baseFiles, ...templateFiles]);

  for (const destPath of removals) {
    if (templateFiles.has(destPath)) {
      throw new Error(
        `template removes '${destPath}' but also provides it; drop one`,
      );
    }
    if (!files.delete(destPath)) {
      throw new Error(
        `template removes '${destPath}', which the base scaffold does not produce`,
      );
    }
  }

  return files;
}

function writeScaffold(fs, path, files, destDir, slug, title) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const destPath of [...files.keys()].sort()) {
    const { isTemplate, srcPath } = files.get(destPath);
    const target = path.join(destDir, ...destPath.split('/'));
    fs.mkdirSync(path.dirname(target), { recursive: true });

    if (isTemplate) {
      const raw = fs.readFileSync(srcPath, 'utf8');
      const isHtml = HTML_FILE_EXTENSIONS.has(
        path.extname(target).toLowerCase(),
      );
      fs.writeFileSync(target, interpolate(raw, slug, title, isHtml));
      continue;
    }

    fs.copyFileSync(srcPath, target);
  }
}

async function main() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { parseArgs: parseNodeArgs } = await import('node:util');

  const { artifactType, slug, template, title } = parseArgs(
    parseNodeArgs,
    process.argv,
  );
  const workspaceRoot = process.cwd();
  const scriptPath = process.argv[1] ?? 'bootstrap.js';
  const scriptDir = path.dirname(path.resolve(scriptPath));

  let artifactFilesDir = artifactType;
  if (artifactType === 'data-visualization') {
    artifactFilesDir = 'react-vite';
  }

  let templateDir;
  if (template !== undefined) {
    if (artifactType !== 'expo' || template !== 'expo-sdk57') {
      writeStderr(`Unsupported template '${template}' for ${artifactType}`);
      process.exit(1);
    }
    templateDir = path.join(scriptDir, 'artifacts', 'expo/templates/sdk57');
  }

  const filesDir = path.join(scriptDir, 'artifacts', artifactFilesDir, 'files');
  const destDir = path.join(workspaceRoot, 'artifacts', slug);

  if (!fs.existsSync(filesDir)) {
    writeStderr(`Error: missing template directory for ${artifactFilesDir}`);
    process.exit(1);
  }

  if (fs.existsSync(destDir)) {
    writeStderr(`Error: artifacts/${slug}/ already exists`);
    process.exit(1);
  }

  writeStdout(`Bootstrapping ${artifactType} artifact: ${slug}`);

  const baseFiles = collectLayer(fs, path, filesDir);
  let files = baseFiles;
  if (templateDir !== undefined) {
    if (!fs.existsSync(templateDir)) {
      writeStderr(`Error: missing template directory for ${template}`);
      process.exit(1);
    }

    // A template that only removes base files has no `files/` to track, since
    // git cannot carry an empty directory.
    const templateFilesDir = path.join(templateDir, 'files');
    const templateFiles = fs.existsSync(templateFilesDir)
      ? collectLayer(fs, path, templateFilesDir)
      : new Map();

    files = layerScaffold(
      baseFiles,
      templateFiles,
      readTemplateRemovals(fs, path, templateDir),
    );
  }

  writeScaffold(fs, path, files, destDir, slug, title);
  writeStdout(`  Copied files to artifacts/${slug}/`);

  writeStdout('Done.');
}

void main();
