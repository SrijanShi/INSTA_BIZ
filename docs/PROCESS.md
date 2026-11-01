# How this clone was built

This is the working log for the Insta Biz Web assignment: what was done, in what order, with which tools, and why. It covers the five things the assignment asks the video to explain.

## 1. Tools

| Tool | Used for |
| --- | --- |
| AI coding agent in VS Code | Planning, reverse engineering, writing the code, tests and docs, running builds, committing |
| REA ("reverse-engineer-anything") skill and MCP server | Driving a real Chrome against the reference site to capture screenshots, and statically analysing its JavaScript bundles |
| Firecrawl MCP | First pass over the home page: text, links, fonts and colours |
| `curl`, Python and Node scripts | Downloading the HTML/CSS/JS of every route and turning it into readable source |
| Playwright with the installed Chrome | Section-by-section screenshots while building, then the e2e test suite |
| Vercel CLI | Production deployment |
| Git and GitHub CLI | Version control and pushing |

## 2. The exact prompts

Everything was done from one conversation with the coding agent. The full prompt was the assignment email pasted in, followed by these instructions (verbatim):

> This is what I have to make and now I want you to use the /reverse-engineer-anything skill to analyse the website and make the complete project for this assessment I want you to make it in the best way that you can make because I want to pass this assessment and that is something I need at any cost
> Make this and also keep pushing with the correct messages to github to the given repo and at good checkpoints which makes sense
> Do as said in the given mail cover everything
> Github repo:
> echo "# INSTA_BIZ" >> README.md
> git init
> git add README.md
> git commit -m "first commit"
> git branch -M main
> git remote add origin https://github.com/SrijanShi/INSTA_BIZ.git
> git push -u origin main
> Start doing and use the skill I mentioned

<details>
<summary>The assignment email that was pasted in above those instructions (abridged)</summary>

> Assignment: Clone the Complete Website
>
> Reference Website: https://puppy.instabizweb.com/
>
> Build a complete clone of the reference website, matching its design, layout, responsiveness, and functionality as closely as possible.
>
> You are required to: Deploy the website and share the live URL. Share your GitHub repository with the complete source code. Record a Loom video with screen sharing, explaining: your development process and project structure; technologies and tools used; AI tools used and the exact prompts provided; implementation decisions and challenges faced; testing and deployment process.
>
> AI Tools Policy: You are free to use any AI tools or development tools of your choice. However, you must understand your implementation and be able to explain your complete workflow.

</details>

The agent ran in plan mode first: it analysed the site, wrote a plan (stack, file layout, commit checkpoints, testing and deployment) and asked one question before any code was written:

> **Q:** Pushing to github.com/SrijanShi/INSTA_BIZ needs your credentials: your SSH key isn't added to GitHub and no HTTPS credentials are cached. How should I authenticate the pushes?
> **A:** Install GitHub CLI

The plan was then approved and executed. There were no other prompts; everything below came out of that one request.

## 3. Reverse engineering the reference site

The goal was to rebuild from evidence rather than eyeball screenshots.

1. **First look.** Firecrawl scraped the home page: content, links, and the brand (Fraunces, Figtree and Shantell Sans; toffee `#a24a1a` on milk `#fffdf8`). The page HTML showed a Next.js app.
2. **Screenshots with REA.** REA's `capture_browser_scenario` launched Chrome and visited every section of the home page (by navigating to each section's anchor) and every inner page at 1440×900, then the home page and open menu at 390×844. One capture was larger than REA's 10 MB response limit, so it was exported with `export_evidence_bundle` and the screenshots were pulled out of the file.
3. **Raw source.** All routes, their CSS, and all 25 JavaScript chunks were downloaded. The bundles named their own versions: Next.js 16.4, React 19.3, Lenis 1.3, plus the `motion` library. The stylesheet is Tailwind v4 with about 300 hand-written `tp-*` classes and 46 keyframe animations.
4. **Static analysis.** REA's `analyze_javascript_application` timed out on the whole tree, because the framework chunks are big. Re-running it on just the 10 app-specific chunks (picked by grepping for the site's class names) worked. That map showed which client components exist (`HeroLineup`, `Meet`, `Chat`, `Dusk`, `PupJourney`, `PuppyBrowser`, `PuppyGallery`, `NoticeBoard`, `LetterForm`, `RouteCurtain`, `SmoothScroll` and others) and which chunk each page loads. The chunks were then pretty-printed and read component by component.
5. **Content.** Next.js embeds each page's React Server Component payload in the HTML, and client components get their data as plain JSON props in it. `scripts/extract-content.mjs` decodes those payloads and pulls out the real CMS records: 42 puppies (with each photo's focal point, dominant colour and blur placeholder), 8 breeds, 64 family photos, 9 FAQs, the home sections and the how-it-works journeys. Gone-home puppies only exist as rendered HTML, so their records are rebuilt from the ticket and detail pages.

## 4. Building it

Work went in the order of the git history, each step a working, building commit:

| Commit | |
| --- | --- |
| Scaffold | `create-next-app` with the same versions as the reference |
| Design | Theme tokens, fonts, and `scripts/port-styles.mjs`, which prettifies the minified CSS and splits the `tp-*` rules into one readable file per feature. The utility classes aren't copied; Tailwind regenerates them from the JSX. |
| Content | Extraction script, media download (205 files) and JPEG optimisation (saved 23 MB) |
| Mascot | Teddy. See below. |
| Shell | Header, mobile menu, footer, route curtain, smooth scroll, paw trail, scroll reveals |
| Home | The eight scenes |
| Puppies | Sketchbook grid and filters |
| Puppy | Storybook detail page, gallery, the enquiry Server Action |
| Pages | Happy families, gone home, how it works, FAQ |
| Contact | Letter form, 404 poster, error page, sitemap, robots |
| Tests | Playwright suite and CI, plus a bug fix the tests found |
| Walker | Teddy walking down the home page |

For every section the process was the same: convert the reference markup to JSX with a small converter, read the matching client component in the pretty-printed bundle, then write a clean, typed React component with real data in place of repeated markup. Server components by default; `"use client"` only where there is state or browser APIs.

### Teddy

The mascot is the hardest part of the site and the one most worth explaining. He isn't an image. He's an SVG puppy built from code:

- `rig.ts` draws fluffy shapes as wobbly ellipses (`fluff()`), defines 13 poses as numbers (body tilt, head offset, leg angles, tail, eyes, tongue…), and has a `frame()` function that turns a pose plus the current motion (walk cycle, wag, gaze, blink, ear wobble) into an SVG transform for each body part.
- `PupSvg` renders a pose on the server, so he appears instantly with no JavaScript.
- `PupDriver` takes over that same SVG in the browser and eases towards target poses every frame, with little springs for floppy ears and bounces. He breathes, blinks at random, follows the mouse with his eyes, wags when hovered, and does a trick when clicked (woof, spin, beg, bow, hop, love hearts, head tilt, sneeze, and "zoomies" after four quick clicks).
- `PupJourney` (home page only) hides the static Teddies and moves one Teddy between them as you scroll. It measures every stop, works out the range of scroll where he should rest at each one, and in between walks him along a curve, hopping out from behind the quilt or into the basket. Scenes are told when he arrives, which is what opens the welcome-home door at the end. On phones he peeks in from the screen edges above the WhatsApp bar instead.

## 5. Decisions

- **Same stack as the original.** Matching Next.js, Tailwind v4 and the same libraries made it possible to reproduce behaviour exactly (for example, filters using `history.replaceState`, which Next keeps in sync with `useSearchParams`).
- **Real data, generated not hand-typed.** The JSON in `src/content` comes from a script, so it matches the original exactly and can be regenerated.
- **Self-hosted media.** All photos and videos live in `public/media` under their original paths, so the clone doesn't depend on the reference server staying up. `next/image` serves resized copies.
- **Static by default.** Every page is prerendered at build time. Only the parts that read the URL (the puppy filters) render on the client, behind a Suspense fallback that already lists every puppy.
- **Forms that don't spam the real business.** `sendEnquiry` validates on the server, has a honeypot field for bots, and logs enquiries unless Resend credentials are set.
- **Readable source over copied output.** Nothing is pasted from the minified bundles. Each component was rewritten with clear names and comments, and verified against the original visually. One check: the sketch-card generator reproduces the reference's output exactly for a given puppy (same tilt, colour and path).

## 6. Challenges

- **Cache Components in Next.js 16.** Anything that reads the URL must sit inside `<Suspense>`, and `generateStaticParams` must return at least one entry. The bundled Next.js docs in `node_modules/next/dist/docs` were read before writing code because this version differs from older ones (for example `preload` replaces `priority` on images, and error boundaries get `retry()`).
- **Large tool outputs.** REA captures with screenshots were tens of megabytes. They were written to files and parsed with `jq`/Python instead of read whole.
- **CSS port edge cases.** The first version of the CSS formatter turned `html:has(...)` into `html: has(...)`, which broke a selector. The build warned about it, and the formatter was fixed to look ahead for `{` before treating a colon as a property separator.
- **Data quirks.** Some gone-home pages render the gender differently, so the extractor falls back to the ticket text ("Pomsky, boy"). RSC encodes missing values as `"$undefined"`, which the extractor strips.
- **A flickering button.** The mobile test run found that the primary buttons lift 2px on hover. If the cursor rests on the bottom edge, the lift moves the button off the cursor, it un-hovers, drops back, and repeats every frame. The original site has the same issue. The fix limits the effect to real hover devices and adds an invisible margin so the hover target stays under the cursor.
- **The walker.** About 1,100 lines of minified logic. It was ported last, after every page worked, so the site was complete without it.

## 7. Testing

- During the build, every section was screenshotted with Playwright and compared side by side with the REA captures of the original, desktop and mobile.
- `npm run lint`, `npm run typecheck` and `npm run build` ran at every checkpoint.
- `tests/e2e` holds the Playwright suite (28 scenarios × desktop and mobile). It runs against the production build with reduced motion so animations don't make it flaky. Current result: 53 passed, 3 skipped (desktop-only and mobile-only checks on the other device).
- GitHub Actions (`.github/workflows/ci.yml`) runs lint, build, typecheck and the e2e suite on every push.

## 8. Deployment

Vercel, from the CLI: `vercel link --project teddypups-insta-biz` and `vercel --prod`. Vercel linked the GitHub repository at the same time, so every push to `main` now deploys automatically. The canonical URL, Open Graph tags and sitemap pick up the production domain from `VERCEL_PROJECT_PRODUCTION_URL` at build time.

Live: https://teddypups-insta-biz.vercel.app
