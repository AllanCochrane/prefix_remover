import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route to fetch preview of what will happen
  app.post("/api/preview", async (req, res) => {
    try {
      const { directory, prefix, action } = req.body;
      if (!directory || !prefix) {
        return res.status(400).json({ error: "Directory and prefix are required" });
      }

      const files = await fs.readdir(directory);
      const matchedFiles = files.filter(f => f.startsWith(prefix));

      const preview = matchedFiles.map(file => {
        const fullPath = path.join(directory, file);
        return {
          original: file,
          fullPath,
          newBase: action === 'delete' ? null : file.slice(prefix.length)
        };
      });

      res.json({ files: preview });
    } catch (error: any) {
      // If directory doesn't exist, ignore and return empty list
      if (error.code === 'ENOENT') {
        return res.json({ files: [] });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // API Route to execute rename or delete
  app.post("/api/execute", async (req, res) => {
    try {
      const { directory, prefix, action } = req.body; // action: 'rename' | 'delete'
      if (!directory || !prefix || !action) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const files = await fs.readdir(directory);
      const matchedFiles = files.filter(f => f.startsWith(prefix));
      
      let processed = 0;
      const errors = [];

      for (const file of matchedFiles) {
        const fullPath = path.join(directory, file);
        
        try {
          if (action === 'delete') {
            await fs.unlink(fullPath);
          } else {
            const newName = file.slice(prefix.length);
            const newFullPath = path.join(directory, newName);
            await fs.rename(fullPath, newFullPath);
          }
          processed++;
        } catch (err: any) {
          errors.push(`Failed to ${action} ${file}: ${err.message}`);
        }
      }

      res.json({ success: true, processed, errors });
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return res.status(404).json({ error: "Directory not found" });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // API route for manual list execution
  app.post("/api/execute-list", async (req, res) => {
    try {
      const { items, action, prefix } = req.body;
      if (!items || !Array.isArray(items)) {
         return res.status(400).json({ error: "Missing items list" });
      }

      let processed = 0;
      const errors = [];

      for (const item of items) {
        try {
          // If action is delete, just delete original
          if (action === 'delete') {
            await fs.unlink(item.original);
            processed++;
          } else {
             // For rename, use newBase and dir
             const isWindowsPath = item.original.includes('\\') && !item.original.includes('/');
             const separator = isWindowsPath ? '\\' : '/';
             const targetPath = item.dir ? `${item.dir}${separator}${item.newBase}` : item.newBase;
             await fs.rename(item.original, targetPath);
             processed++;
          }
        } catch (err: any) {
          errors.push(`Error on ${item.original}: ${err.message}`);
        }
      }

      res.json({ success: true, processed, errors });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });


  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
