# Voice Studio AI — V2 (Correct V1 Locked)

## IMPORTANT
**V1-MASTER is the source of truth.**
The file in `V1-MASTER/` is the exact V1 supplied by the user.

V2 is additive only:
- Voice-to-Voice record
- Voice-to-Voice upload
- target character selection
- conversion
- result preview
- MP3 download

Do not overwrite V1 with the earlier draft.

## Correct V1 voice library

| Character | Gemini preset |
|---|---|
| Guru Wanita | Leda |
| Guru Pria | Kore |
| Ustadz | Charon |
| Ustadzah | Aoede |
| Pembawa Berita | Kore |
| Narator Dokumenter | Zephyr |
| Storyteller Wanita | Aoede |
| Storyteller Pria | Fenrir |
| Anak Perempuan | Puck |
| Anak Laki-laki | Puck |
| Presenter Enerjik | Callirrhoe |
| Podcast Host | Orus |
| Iklan & Promosi | Despina |

Source verification comes from the supplied V1 code.

## Deployment architecture

Recommended:
1. Keep V1 UI/generation code intact.
2. Add V2 as a new tab/component.
3. Put Gemini and Voice-to-Voice API keys on the server/Vercel environment.
4. Never commit API keys to GitHub.
5. Configure real V2 target Voice IDs; Gemini preset names are not automatically V2 provider Voice IDs.

## Files

- `V1-MASTER/Voice-Studio-AI-V1-MASTER.jsx` — locked V1 source.
- `V2-ADD-ON/` — additive V2 Voice-to-Voice module.
