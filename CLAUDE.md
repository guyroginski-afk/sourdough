# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Hebrew-language sourdough bread calculator SPA ([mahametzet.com](https://mahametzet.com)) — a single self-contained `index.html` file with all CSS and JS inline. No build system, no package manager, no dependencies beyond Google Fonts and GA4.

## "Deployment"

Editing `index.html` and pushing to `main` is the entire deployment process (GitHub Pages via CNAME). There is no build step.

## Architecture

Everything lives in `index.html` (~1430 lines). Structure:

1. **CSS** (lines ~9–283): All styles inline in `<style>`. CSS custom properties (`:root`) define the color palette (`--cream`, `--wheat`, `--crust`, `--dark`, `--moss`, etc.).

2. **HTML body** (lines ~293–1393): Several overlapping UI layers:
   - `#wizard-overlay` — multi-step onboarding wizard (shown first on load)
   - `#wiz-results-overlay` — wizard results screen
   - `.hero` + `.tab-nav` — main app header and tab navigation
   - `#tab-starter` / `#tab-bread` pages — the two main calculator tabs
   - `#bot-fab` + `#bot-window` — floating AI chatbot button and chat window

3. **JavaScript** (lines ~568–1393): All inline in `<script>`. Key data structures:
   - `CITIES` — Israeli cities with lat/lng and per-season temperatures
   - `SEASON_DATA` — rise time ranges and recommended feeding ratios per season
   - `BT` (array) — bread type definitions: hydration %, starter %, salt %, flour blends, process steps, full step-by-step instructions
   - `CITY_LIST` — flat list of cities for the wizard UI
   - `wizState` — wizard state object (selected bread, count, city, season, keep amount)

4. **AI Chatbot** (lines ~1234–1391): The "יועץ המחמצת" (Sourdough Advisor) sends messages to a Cloudflare Worker proxy at `https://sourdough-bot.guyroginski.workers.dev`, which holds the Anthropic API key and forwards requests to `claude-sonnet-4-20250514`. Supports image uploads (base64) for starter/bread analysis. The bot is initialized with a Hebrew system prompt (`BOT_SYSTEM`).

## Key Functions

- `calcStarter()` — computes feeding amounts (old starter, flour, water to add) and generates a timeline based on current season/city/ratio
- `calcBread()` — computes ingredient weights (flour breakdown, starter, water, salt, extras) using baker's percentages
- `initWizard()` / `wizNext(step)` / `wizShowResults()` — wizard flow control
- `getSeasonFromDate()` — auto-detects season from current month
- `getNearestCity(lat, lng)` — finds nearest city from geolocation coordinates
- `botSend()` — async; builds Anthropic API message array and POSTs to the Worker proxy

## Content Language

All UI text is in Hebrew (RTL, `dir="rtl"`). When editing or adding user-facing strings, write in Hebrew.

## Other Files

- `index2.html` / `ttt.html` — experimental/scratch versions; not served as the main page
- `CNAME` — `mahametzet.com`
