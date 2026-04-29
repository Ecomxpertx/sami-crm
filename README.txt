╔══════════════════════════════════════════════════════╗
║           SAMI AGENCY CRM - SETUP GUIDE             ║
╚══════════════════════════════════════════════════════╝

REQUIREMENTS:
  - Node.js (download from nodejs.org if not installed)

HOW TO START:
  Windows: Double-click start.bat
  Mac/Linux: Open Terminal, drag this folder in, type: node server.js

FIRST TIME:
  1. Start the server (see above)
  2. Open your browser and go to: http://localhost:3000
  3. Import your data using the Import button in the bottom-left
     (use the JSON backup from your old CRM)

SHARE WITH YOUR TEAM:
  When the server starts, it will show something like:
    Network: http://192.168.1.5:3000
  
  Share that URL with Safi, Shukran, Rimsha etc.
  They just open it in their browser - no install needed.

DATA LOCATION:
  All data is saved in: data/crm.json
  A backup is made automatically as: data/crm.json.bak

BACKUP:
  Click the "Backup" button in the bottom-left of the app.
  This downloads a JSON file with all your data.

PORT (optional):
  Default port is 3000.
  To use a different port:
    Windows: set PORT=8080 && node server.js
    Mac/Linux: PORT=8080 node server.js

TROUBLESHOOTING:
  - "Cannot connect to server" = server is not running. Start it first.
  - "Port already in use" = use a different port (see above)
  - Data not showing = click Import and load your backup JSON file
