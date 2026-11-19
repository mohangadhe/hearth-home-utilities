# Hearth utilities dashboard

Hearth organizes household utility bills, providers, costs, usage, and billing history.

## Applications

- `hearth-self-hosted/`: standalone React/Vite and Express application using Node 24, SQLite and local PDF storage. Start here for local use; see its README for Docker and Node instructions.
- `home-utilities/`: original Sites/Cloudflare application source with D1/R2 integrations. Deployment metadata and private runtime configuration are deliberately excluded. It requires the appropriate hosting/auth environment; it is not a generic public multi-user deployment.

## Scope

Includes bulk text-PDF imports, duplicate detection, provider archives, bill library, and missing-cycle indicators. Daily and weekly charts allocate bill totals and are estimates, not actual meter readings. Automatic provider connections, AI recommendations, and payments are not implemented.

The standalone version has no authentication and is intended for local single-household use only. Do not expose its port publicly.

## Publication inventory

Both application source trees, dependency lockfiles, tests, public assets, schema migrations, and build/setup scripts are included. Local records and databases, bill PDFs and extracted text, billing analyses and rename manifests, credentials and hosting metadata, screenshots, dependency directories, generated builds, and redundant deployment/package archives are excluded. Oryft operations are a separate project and are not included.

A fresh Git history is used to avoid publishing private historical configuration. Original local project files remain intact. No open-source license grant has been added; existing third-party notices are retained.
