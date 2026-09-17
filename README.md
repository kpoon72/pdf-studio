# PDF Studio

A modern, full-featured PDF toolkit — similar to SmallPDF / ILovePDF — that runs 100% in your browser. No uploads, no watermarks, no sign-up required.

---

## Features

| Feature | Description |
|---|---|
| **Merge PDFs** | Combine multiple PDFs with drag-and-drop reordering |
| **Split PDF** | Split by custom ranges like `1-3, 4, 5-7` with visual preview |
| **Edit PDF** | Add text, shapes, highlights, and annotations |
| **Organize Pages** | Reorder, rotate, delete, duplicate pages via drag & drop |
| **Sign PDF** | Draw or upload a signature and place it on any page |
| **Convert** | PDF → Word (.docx) · JPG/PNG/WebP images → PDF |
| **Dark Mode** | Full dark/light mode with system preference detection |
| **Privacy** | All processing is 100% client-side — files never leave your device |

---

## Quickest Setup — Docker (Recommended)

This is the easiest way to run the app on any machine. You only need Docker installed — no Node.js, no npm, nothing else.

### Step 1 — Install Docker Desktop

| OS | Link |
|---|---|
| Mac | https://docs.docker.com/desktop/install/mac-install/ |
| Windows | https://docs.docker.com/desktop/install/windows-install/ |
| Linux | https://docs.docker.com/desktop/install/linux-install/ |

After installing, **open Docker Desktop** and wait for the whale icon in the menu bar to stop animating — that means Docker is ready.

### Step 2 — Get the project

```bash
git clone https://github.com/kpoon72/pdf-studio.git
cd pdf-studio
```

### Step 3 — Run it

Open a terminal, navigate to the project folder, and run:

```bash
docker compose up --build -d
```

That's it. Docker will:
1. Download the required base images (Node, nginx) — one time only
2. Install all dependencies inside the container
3. Build the frontend and backend
4. Start both services

### Step 4 — Open the app

Go to **http://localhost** in your browser.

---

## Stopping and Starting

```bash
# Stop the app
docker compose down

# Start again (no rebuild needed)
docker compose up -d

# Rebuild after code changes
docker compose up --build -d
```

---

## Verify it's running

```bash
docker ps
```

You should see two containers:

```
pdf-studio-frontend   Up   0.0.0.0:80->80/tcp
pdf-studio-backend    Up   3001/tcp
```

---

## Troubleshooting

**"Cannot connect" or "Site can't be reached"**
- Make sure Docker Desktop is open and running (not just installed)
- Check `docker ps` — both containers must show `Up`
- Use `http://localhost` not `http://localhost:5173`

**Port 80 already in use**
- Something else (like Apache or another web server) is using port 80
- Edit `docker-compose.yml`, change `"80:80"` to `"8080:80"`, then open `http://localhost:8080`

**Docker command not found**
- Docker Desktop is not installed or not running — go back to Step 1

---

## Alternative Setup — Without Docker

If you prefer to run it without Docker, you need **Node.js 18+** installed.

**Frontend only** (all features work — backend is optional):

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

**Frontend + Backend:**

```bash
# Terminal 1
cd backend
npm install
npm run dev

# Terminal 2
cd frontend
npm install
npm run dev
```

---

## Running on a Server Alongside Other Projects

If this is deployed on a home server that also hosts other apps, port 80 will
be taken by a shared reverse proxy (e.g. [Caddy](https://caddyserver.com/)).
Use the server override to bind the frontend to a local-only port instead:

```bash
docker compose -f docker-compose.yml -f docker-compose.server.yml up -d --build
```

This binds the frontend to `127.0.0.1:8081` instead of `0.0.0.0:80`, so it's
only reachable through the reverse proxy, not directly from the network. Point
a Caddy site block at `localhost:8081` (see the proxy's own Caddyfile for the
pattern). Pick a different free port per project if running several.

---

## Project Structure

```
project-pdf/
├── docker-compose.yml
├── .gitignore
├── frontend/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── src/
│       ├── components/
│       │   ├── common/       # Button, Modal, ProgressBar
│       │   ├── editor/       # PDFEditor, EditorToolbar
│       │   ├── layout/       # Layout, Sidebar, Header
│       │   ├── merge/        # MergePanel
│       │   ├── organizer/    # PageOrganizer, PageThumbnail
│       │   ├── signature/    # SignaturePanel
│       │   ├── split/        # SplitPanel, RangeInput
│       │   └── upload/       # DropZone, FileCard
│       ├── hooks/            # useTheme, usePDF
│       ├── pages/            # Home, Merge, Split, Editor, Organizer, Sign, Convert
│       ├── store/            # Zustand pdfStore
│       ├── types/            # TypeScript interfaces
│       └── utils/            # pdfUtils, rangeParser
└── backend/
    ├── Dockerfile
    └── src/
        ├── controllers/
        ├── middleware/
        ├── routes/
        └── utils/
```

---

## Tech Stack

**Frontend:** React 18 · TypeScript · Vite · Tailwind CSS · PDF.js · pdf-lib · docx · Zustand · @dnd-kit · React Router v6

**Backend:** Node.js · Express · TypeScript · pdf-lib · Multer · node-cron

---

## Browser Support

Chrome 90+ · Firefox 88+ · Safari 14+ · Edge 90+
