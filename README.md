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

**Road Run** separates answers from steering. Tap one of four German translations or press its number (1–4). A correct answer earns an automatically planned move: the character prefers safe forward progress, waits for gaps, and uses side/backward evasions when needed. It forecasts vehicle positions and log drift over the landing window. Answers are shuffled independently of the chosen movement.

The scrolling 20-row world includes cars, river logs/currents, railway warnings and trains, three lives, and grassy checkpoints. Traffic keeps moving while the learner answers, so faster recall gives the character more time to escape. A late answer can still leave no safe escape. New vocabulary and corrections pause the world.

Adaptive mode allows 2 seconds for familiar short targets and 6 seconds otherwise; Arcade gives every question 2 seconds. Untimed removes the answer deadline but keeps traffic moving. Correct answers transition after a 160 ms hop, or wait for a safe gap. P or Space pauses; hiding the tab also pauses. Missed words return after two other answered prompts.

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
