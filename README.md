DungeonPub 🍺⚔️
A real-time chat and campaign companion app for tabletop RPG sessions, built on Azure Static Web Apps and Azure Web PubSub.
DungeonPub started as a simple real-time chat app. It wants to be something more — a living, breathing companion for D&D sessions that keeps track of the world so the players don't have to.
---
What It Is
A browser-based app where a party of D&D players can chat in real time during a session. The Dungeon Master has elevated privileges and can interact with an AI Chronicler that observes the session, remembers the world, and narrates key moments to the party.
---
What It Wants To Be
A real-time session companion — chat, dice rolls, and shared narrative in one place
A living world record — characters, locations, NPCs, quests, and lore stored and maintained automatically
A silent AI Chronicler — an omniscient narrator that speaks only when the DM summons it, feeding the party atmospheric updates and world lore without breaking immersion
A DM command center — the DM sees more, controls more, and can shape the narrative with simple `@` commands that players never see
Token-efficient AI — a lean context model that passes only what the AI needs, using structured world state and rolling chronicles instead of full history
---
Architecture
Layer	Technology
Frontend	HTML, Vue.js, Bootstrap
Real-time messaging	Azure Web PubSub
API	Azure Functions (Node.js)
Storage	Azure Table Storage (Akashic)
Hosting	Azure Static Web Apps
AI	Azure AI / Anthropic API
Akashic — The Data Store
All game data lives in a single Azure Table Storage table called Akashic, organized by partition:
Partition	Contents
`worldstate`	Current session facts — location, weather, date, active threat
`party`	Shared party metadata — gold, group inventory, morale
`characters`	One row per player character
`npcs`	One row per NPC
`locations`	Known locations and points of interest
`quests`	Active and background quests
`chronicle`	AI-generated session summaries, one per session
`lore`	World lore entries built up over time
`syslog`	System events, timestamped by ISO rowKey
---
The Chronicler
The Chronicler is a silent AI narrator. It observes the session and speaks only when the DM triggers it via a private `@` command in chat. Players never see the DM's input — they only see the Chronicler's response, styled distinctly from regular chat.
DM triggers:
```
@ Pippen broke his sword during the fight
@ tell us the local lore, mention that The Dark had a run-in with bandits on Swamp Road
@ the party sets up camp for the night
```
The Chronicler receives the `@` message plus current world state and the last session chronicle as context. The DM previews the response before it is published to the party.
---
TODO
Authentication
[ ] Set up Azure Static Web Apps built-in auth (GitHub login)
[ ] Assign DM role vs player role
[ ] Protect `/api/chronicle` endpoint — DM only
[ ] Hide `@` command routing from player view
Data Layer
[ ] Rename Azure table to Akashic
[ ] Update `tableStorage` API to support `afterId` for time-based log queries
[ ] Create individual character rows in Akashic
[ ] Create party metadata row in Akashic
[ ] Seed initial world state row
[ ] Add `partitionKey` query support to GET endpoint
The Chronicler
[ ] Create `/api/chronicle` Azure Function
[ ] Wire up `@` command detection in chat input
[ ] Build DM preview pane for Chronicler responses before publishing
[ ] Broadcast Chronicler messages via Web PubSub
[ ] Style Chronicler messages distinctly in chat UI (parchment / italic / fantasy font)
[ ] Store each Chronicler response as a chronicle entry in Akashic
AI Context Model
[ ] Finalize world state JSON schema
[ ] Finalize chronicle JSON schema
[ ] Write Chronicler system prompt
[ ] Build context assembly logic — what gets sent to AI per `@` trigger
[ ] Selective character fetching — only pull relevant character rows per `@` command
Frontend / UI
[ ] Display message timestamps in chat
[ ] DM view vs player view
[ ] Character sheet display
[ ] Dice roller
Housekeeping
[ ] Add `api/index.js` to repo (empty file — required for Azure Functions v4 runtime)
[ ] Confirm `local.settings.json` is in `.gitignore`
[ ] Update `host.json` with `workerIndexing: false`
[ ] Commit and deploy to Azure
---
Running Locally
```bash
# Install dependencies
cd api
npm install

# Start the API
func start

# Open src/index.html in a browser or use Live Server
```
Requires `api/local.settings.json` (not committed — see a team member for values):
```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "<connection string>",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "FUNCTIONS_V2_COMPATIBILITY_MODE": "true",
    "StorageConnString": "<connection string>"
  }
}
```