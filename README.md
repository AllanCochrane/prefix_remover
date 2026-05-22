# Prefix Remover

Prefix Remover is a local file management utility designed to help you safely and quickly batch rename or delete files by matching a specific prefix. It is particularly useful for cleaning up media files, downloads, or log files that have repetitive, unwanted text at the start of their names.

## Features

- **Dynamic Command Generation:** Generates safe, optimized Bash (Linux/Mac) and PowerShell (Windows) scripts to rename or delete files in place safely.
- **Manual List Parsing:** Paste in a list of file paths (e.g., from `ls` or `find`) to manually review and generate targeted scripts.
- **Local Server Execution:** Execute rename and delete operations directly through the web interface (requires running the app locally).
- **Dry Run Mode:** Preview exactly which files will be affected before making any permanent changes. 

## About the Gemini API Key

You might have noticed an `.env.example` file referencing a `GEMINI_API_KEY` or prompts for it in your environment. **This application does not actually require or use the Gemini AI API.** 

The AI Studio environment includes these references by default for templates, but since Prefix Remover is a purely deterministic local filesystem utility, no AI API key is needed to run it.

## Running Locally

Because this application interacts directly with your filesystem to rename or delete files, it is best run locally on your own machine.

1. Clone or download the project files.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser. The server will now have access to your local filesystem to safely rename and clean up your files.
