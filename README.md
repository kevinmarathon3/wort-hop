# Wort Hop

A German-learning browser game with an isometric road-crossing world.

## Course

48 target words and phrases across eight six-entry lessons. This is an original introductory course, not a complete A1 course or CEFR certification.

1. First words — greetings and politeness
2. Meet & greet — introductions and personal pronouns
3. At the café — food, drinks, noun articles, polite requests
4. Numbers & more — numbers one through six
5. People & things — people, animals, grammatical gender
6. Everyday actions — present-tense sentences
7. Find your way — directions and questions with *wo*
8. Build a sentence — word order, requests, yes/no questions

See [the full syllabus](SYLLABUS.md) for every target and example.

## Learning

**Road Run** makes each answer a directional movement: **1 left, 2 forward, 3 right, 4 backward** (arrow keys and touch also work). Correct answers animate a hop and advance after 160 ms. The scrolling 20-row world includes alternating traffic lanes, moving logs that carry the player, rivers, train warnings and crossings, and grassy checkpoints. Runs have three lives; collisions return to the last grassy checkpoint. The first hazards are roads; rivers and rail crossings appear farther ahead.

Adaptive mode gives familiar short targets 2 seconds and other targets 6 seconds, with slower traffic for the longer adaptive prompts. Arcade gives every question 2 seconds. Untimed removes the answer deadline but keeps traffic moving. New-word introductions and corrections freeze the world until the learner continues. Missed entries return after two other answered prompts. Pause with P, Space, or the pause button; hiding the tab also pauses.

The correct answer is assigned among legal neighboring directions, favoring forward progress while including side and backward moves. It is not always forward. Numbered destination markers turn red when occupied by a hazard. A correct translation can still collide if its move is poorly timed; the word stays learned. Layout geometry is fixed, with randomized traffic/log offsets on each run.

Road Run is recognition practice. Guided lessons provide typing, listening, sentence building, and the checkpoint required to unlock the next lesson.

New vocabulary has a German example and English translation. Recognition, typing, listening (device voice support permitting), and sentence-building exercises lead into a recall checkpoint. Five of six first-try answers unlock the next lesson. Missed vocabulary returns for review sooner. Review intervals grow across successful practice days, rather than repeated answers on the same day.

Progress stays in the current browser and origin. The original hosted version and GitHub Pages have separate local progress. No account, analytics, backend, or API key is required.

## Publishing

The site consists of the static files in `dist/`. Relative asset URLs support a GitHub Pages project path. The Pages workflow publishes only `dist/`; choose **GitHub Actions** in the repository's **Settings → Pages**. Pushes to `main` publish changes automatically.

For local preview, serve `dist/` with any static HTTP server.

Run the game-state checks with `node tests/quick-run.test.cjs`.

## Learning references

- [Duolingo: contextual course design](https://blog.duolingo.com/how-are-duolingo-courses-evolving/)
- [Lingvist: spaced repetition](https://lingvist.com/help/why-do-i-see-the-same-words/)

This project uses its own content and simple review schedule, not either service's proprietary curriculum or algorithms.
