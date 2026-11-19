# Hearth — self-hosted home utilities

A single-household utilities dashboard with sample history, provider profiles and archives, cost/usage charts, manual entry, bulk PDF import, duplicate detection and missing-cycle indicators.

## Start with Docker

Install Docker Desktop (or Docker Engine with Compose), unzip this package, open a terminal in this folder, and run:

```sh
docker compose up --build -d
```

Open **http://localhost:3000**. No OpenAI account, API key or paid service is needed. The first build downloads dependencies and requires internet access. Subsequent use stores records locally; provider portal links still open external sites.

```sh
docker compose stop     # stop without deleting records
docker compose start   # start again
```

Data persists in the `hearth-data` Docker volume: `hearth.sqlite` and the `bills/` folder. Do not run `docker compose down -v` unless you intend to erase that data. Back up the entire volume while the service is stopped; restore it into the same volume with the service stopped. Export records in the UI exports JSON only, not PDF attachments or a restorable database.

## Without Docker

Install Node.js **24 LTS**, then:

```sh
npm ci
npm run build
npm start
```

Open http://localhost:3000. Records and original PDFs live in `data/`. To back up, stop the app and copy the entire `data/` directory. Restore by replacing it while stopped. Optional environment variables: `PORT` (default 3000), `DATA_DIR` (absolute storage path).

## Using it

- Sample data is illustrative and is never stored as real bills. Choose **View my records** for your own records.
- **Bill library → Choose PDFs** accepts multiple text-based PDFs. Provider, service dates, current service charges, usage and readable filename are extracted automatically.
- Supported layouts: Base Power electricity, CenterPoint gas, old/new MeterNet water and Xfinity internet. These provider profiles are generic public defaults; edit them for your household or add your own.
- Scans, password-protected files and unfamiliar layouts are not supported automatically. They are reported as not imported. Manual entry remains available for any provider.
- Identical PDFs and matching provider/service periods are skipped. PDFs can be attached to an existing manual bill without adding its cost twice. A corrected bill with the same period is treated as a duplicate; automatic replacement is not supported.
- Internet usage absent from a statement is marked **Not reported**. Gas uses CCF; old MeterNet thousand-gallon values are converted to gallons.
- Chart cost uses current service charges, not past balances/deposits/separately listed adjustments. Statement amount due is shown separately when available.
- Daily/weekly totals are estimates allocated across service dates, not actual meter readings.
- Provider cards flag gaps between saved periods and estimate an overdue monthly statement with 7 days of tolerance. Actual due dates may vary. This is not a payment or notification service.

## Privacy and scope

This distribution contains application source and synthetic sample data only. It includes no personal bills, account IDs, household address, database, credentials, live-site configuration or ChatGPT reminders. PDFs are parsed in the browser and sent only to this local server. There is no analytics, remote font request or cloud account dependency.

This is a **local, single-user app without authentication**. The default server and Docker port bind to loopback; do not expose it to the internet or forward its port. Anyone who can use the local app can see its records. Remote/multi-user hosting requires a separate authentication and HTTPS design. No utility account sync, email, SMS or ChatGPT scheduled reminder is bundled.

## Development and validation

```sh
npm test
npm run build
```

To develop, run `npm start` in one terminal for the API and `npm run dev` in another for Vite. Open http://127.0.0.1:5173.

The release was built and tested directly with Node 24, including SQLite persistence, API import, renamed-file duplicate prevention, PDF retrieval, origin checks, bill parsing and cycle-gap tests. Docker/Compose configuration is included, but the image was not executed in the packaging environment because Docker was unavailable.
