# Kolkatay Kelenkari — কলকাতায় কেলেঙ্কারি

Third-person open-world walk through north and central Kolkata. Three.js + Vite.

## Run locally
    npm install
    npm run dev

## Deploy to Vercel
    npm install
    npx vercel --prod

(or push this folder to a GitHub repo and import it at vercel.com/new — framework preset: Vite)

## Where things are
- `src/data.js` — the real map: roads, river bank, Maidan, bridge (all from lat/lon)
- `src/landmarks.js` — Victoria Memorial, Howrah Bridge, Coffee House and the other landmarks
- `src/world.js` — ground, roads, filler buildings, trees
- `src/player.js` — movement and camera · `src/traffic.js` — taxis, buses, trams · `src/hud.js` — minimap
