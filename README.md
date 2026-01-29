# Consensus – Gemini-Powered Decision Engine

Consensus is a Progressive Web App (PWA) that transforms complex real-world problems into clear, actionable decision packages using **Gemini 3 deep multi-step reasoning**.

Built for the **Gemini 3 Hackathon**, Consensus demonstrates how large language models can go beyond chat and summarization to deliver structured planning, scenario analysis, and execution-ready strategies.

---

## What Consensus Does

Consensus helps organizations, communities, and decision-makers:

* Analyze complex problems using structured reasoning
* Compare multiple solution options with success probabilities
* Generate step-by-step execution plans
* Simulate best / expected / worst-case scenarios
* Produce stakeholder-specific communication messages
* Export decisions as structured JSON or professional PDF reports

All outputs are generated live using the Gemini 3 API. There is no demo data and no mock responses.

---

## Powered by Gemini 3

Consensus uses Gemini 3 as its core reasoning engine:

* Text-only deep reasoning (no file uploads and no multimodal inputs)
* Iterative clarification questions for improved problem understanding
* Constraint-aware planning (budget, time, legal, and stakeholders)
* Structured JSON output validated against a strict schema
* Low-latency interaction with high-quality final reasoning

Gemini is not used as a chatbot. It is used as a decision intelligence system.

---

## Application Features

* Progressive Web App installable on desktop and mobile
* Local-first storage using IndexedDB with no external database
* Export decision packages to JSON and PDF
* Server-side Gemini API proxy with the API key never exposed to the client
* Clean, mobile-first user interface with accessibility support

---

## Tech Stack

* Frontend: Next.js (App Router), React, TypeScript, Tailwind CSS
* Backend: Serverless API routes using Node.js
* AI: Google Gemini 3 API
* Storage: IndexedDB (local browser storage)
* PWA: Web Manifest and Service Worker

---

## Getting Started

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure environment variables

Create a `.env` file based on `.env.example` and add your Gemini API key:

```env
GEMINI_API_KEY=YOUR_API_KEY_HERE
```

Never commit your real API key to version control.

### 3. Run locally

```bash
pnpm dev
```

---

## API Endpoints

* GET /api/check-gemini – Checks Gemini API availability
* POST /api/clarify – Generates clarification questions
* POST /api/produce – Produces a full decision package
* POST /api/test-gemini – Lightweight Gemini connectivity test

---

## Example Output

Consensus generates:

* Prioritized solution options with success probabilities
* Recommended execution plans
* Scenario simulations
* Stakeholder-specific messages
* Measurable success metrics

Outputs can be exported as structured JSON or print-ready PDF documents.

---

## Hackathon Context

This project was built specifically for the Gemini 3 Hackathon to demonstrate:

* Advanced reasoning capabilities
* Real-world impact
* Production-ready AI application design
* Clear separation between user interface, application logic, and AI reasoning

---

## License

MIT License © 2026
