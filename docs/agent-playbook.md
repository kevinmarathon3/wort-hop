# Validated task patterns

## 2026-09-19 — Reduce divided attention in Road Run

Brief: Combine the character, vocabulary prompt and directional answers into one compact surface. Keep automatic steering and existing keyboard mappings. Have one supporting agent independently inspect camera and responsive-layout risks; keep implementation and visual acceptance with the main agent.

Evidence: The previous layout separated a large road canvas and lesson sidebar. The unified card was visually checked in the browser. At a 390 × 844 viewport it measures 370 × 437 pixels, with all four answers above y=531, 48-pixel answer targets and no horizontal overflow. Gameplay regression tests passed, and returning to guided lessons restored the original layout.

Limits: This pattern suits answer-driven automatic movement. Reassess camera coverage and control placement before introducing manual steering or additional simultaneous tasks.
