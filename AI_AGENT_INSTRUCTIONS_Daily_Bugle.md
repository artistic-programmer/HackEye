# Daily Bugle — AI Agent Instructions

Repository: https://github.com/artistic-programmer/HackEye

## Core Principle
- AI analyzes information/signals.
- Trust Engine calculates signal strength/attention priority.
- Human reviewer makes the final verification decision.
- Never output truth probability, `truthScore`, `fakeScore`, or “87% true”.
- Never invent facts.

## Stack
Frontend: React, TypeScript, Vite, Tailwind CSS, React Router.
Backend: Node.js, Express, TypeScript, MongoDB/Mongoose, Gemini, Google OAuth, JWT, Cloudinary.

## Rules
1. Inspect existing implementation before editing.
2. Reuse existing components/services where possible.
3. Validate report input on the backend.
4. Do not erase a stored report if AI analysis fails.
5. Gemini should return structured summary/category/urgency/specificity/key claims/missing information/suspicious signals/recommended action.
6. Trust scoring remains deterministic backend logic.
7. Reporter reputation is separate from report trust.
8. Reputation changes only after human review.
9. A user's own repeated report cannot self-corroborate.
10. Corroboration does not mean verification.
11. Only authorized reviewers may Verify, Reject or Request Information.
12. Store review history.
13. Keep secrets in environment variables and never commit credentials.
14. Production CORS must use the configured frontend origin and credentials where required.
15. Preserve existing functionality and responsive UI.

## Workflow
Inspect → make the smallest coherent change → build/test/lint → check regressions → report changes and remaining issues.

## Deployment
Frontend: https://hack-g7kopbxah-artistic-programmer.vercel.app
Backend: https://hackeye-d6j9.onrender.com
Database: MongoDB Atlas
