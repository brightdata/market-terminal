# Prompts (Signal Terminal)

This folder centralizes the prompt text used by the Signal Terminal demo so you can iterate without hunting through API routes.

Where they are used:
- `/api/run` pipeline prompts live in `src/app/api/run/route.ts` and import from this folder.
- `/api/chat` "Explain" mode prompt lives in `src/app/api/chat/route.ts` and imports from this folder.

Files:
- `signalTerminalPlan.ts`: query planning (turn a topic/question into search queries)
- `signalTerminalSummaries.ts`: evidence summarization (deep mode only)
- `signalTerminalArtifacts.ts`: tape + evidence map + narrative clusters generation
- `signalTerminalImpact.ts`: optional map expansion for spillovers (deep mode)
- `signalTerminalChat.ts`: explain-with-context chat prompt

Notes for experimentation:
- The model outputs are still validated (Zod schemas) and capped (nodes/edges/tape sizes) in code.
- If you increase limits in a prompt, you may also need to adjust the schema + slicing in `src/app/api/run/route.ts`.
