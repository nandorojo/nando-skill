# Verifying asynchronous visual continuity

This is an adoption recipe, not a claim that the skill ships a visual test runner or layout linter. Reuse the adopting repository's browser tooling. Playwright below illustrates the mechanism; an existing browser CLI plus DOM measurements can enforce the same contract. Keep tooling imports in registered test infrastructure, not portable product features. Follow [the UI-state rules](ui-states.md#visual-continuity-across-asynchronous-states).

## Define the transition contract

For each affected region, name what must remain stable: message alignment and first-line anchor, decoration, action slot, trigger bounds, neighboring controls, retained content viewport, draft, focus, and scroll. Distinguish those invariants from expected product changes, such as replacing a stopped computer with its running desktop. Do not require every resolved page to have the same height or identical words.

An outer panel bounding box alone cannot catch “Loading computer…” at the top left followed by a centered empty state. Compare the corresponding inner text anchors. For centered text of different lengths, compare its center and top/baseline rather than insisting its left edge and width match. For left-aligned text, compare its start and top/baseline. A full-width text wrapper may conceal movement inside it: inspect the actual text range or tightly sized child, and compare screenshots for typography, markers, and padding.

Exercise initial pending → empty/content/error; error → retry → success; mutation idle → pending → failure/success; retained data → refresh failure/recovery; and independent resource updates after mutation settlement. Include desktop and narrow viewports, wrapped/localized labels, long errors, and keyboard interaction. Initial loading must not falsely display an enabled resolved action.

## Hold requests deliberately

Install a deferred response before navigation or the initiating click. Release it only after asserting the visible pending state. Drive failure and retry separately; use bounded condition waits, not arbitrary sleeps or an assumed slow network. Mock the real transport boundary or inject the existing capability; do not recreate feature state logic in a test. Playwright supports request interception and response fulfillment through its [network mocking API](https://playwright.dev/docs/mock).

Server-rendered requests do not pass through browser interception. For prefetched/RSC data, use a test backend or the existing server capability override too. Otherwise the browser might receive cached success and never exercise the fallback. Isolate cache/session state between cases, and explicitly seed retained data when testing refreshes.

This illustrative Playwright test assumes an adopting fixture with a real screen, a POST endpoint, and stable test selectors. Replace its path and response with the product contract; do not copy the invented payload into production:

```ts
import { expect, test } from '@playwright/test'

test('starting preserves the trigger and its message', async ({ page }) => {
  let release = () => {}
  const held = new Promise<void>((resolve) => { release = resolve })
  await page.route('**/api/resource/start', async (route) => {
    await held
    await route.fulfill({ json: { accepted: true } })
  })
  // The isolated fixture serves the normal stopped state and actual UI.
  await page.goto('/fixtures/resource')
  await page.evaluate(() => document.fonts.ready.then(() => undefined))
  const trigger = page.getByTestId('resource-start')
  const message = page.getByTestId('resource-message-text')
  await expect(trigger).toBeEnabled()
  await expect(message).toBeVisible()
  const beforeTrigger = await trigger.boundingBox()
  const beforeMessage = await message.boundingBox()
  expect(beforeTrigger).not.toBeNull()
  expect(beforeMessage).not.toBeNull()
  try {
    await trigger.click()
    await expect(trigger).toBeDisabled()
    await expect(trigger).toHaveAttribute('aria-busy', 'true')
    const afterTrigger = await trigger.boundingBox()
    const afterMessage = await message.boundingBox()
    expect(afterTrigger).not.toBeNull()
    expect(afterMessage).not.toBeNull()
    for (const key of ['x', 'y', 'width', 'height'] as const) {
      expect(Math.abs(afterTrigger![key] - beforeTrigger![key])).toBeLessThanOrEqual(1)
      expect(Math.abs(afterMessage![key] - beforeMessage![key])).toBeLessThanOrEqual(1)
    }
    await expect(page).toHaveScreenshot('resource-start-pending.png')
  } finally {
    release()
  }
  await expect(trigger).not.toHaveAttribute('aria-busy', 'true')
})
```

The one-CSS-pixel tolerance is an explicit example, not a universal allowance. Use the smallest justified tolerance for the environment. This case compares unchanged text; query cases with different words need the alignment-specific anchors above. Add separate success/failure/retry cases with meaningful settled-state assertions. Sample intermediate transitions where animation or transient rows could move content and return before the final measurement. A stable final rectangle does not prove the transition was stable.

## Combine geometry, images, and accessibility

Geometry comparisons produce direct failure messages such as “start button moved 24px.” Screenshots catch visual differences the chosen coordinates miss. Keep both: a screenshot of only the final state cannot prove continuity, and matching coordinates cannot prove readable text.

Use a pinned browser/runtime, OS image, viewport, device scale, fonts, locale, and color scheme for baseline generation and comparison. Wait for required fonts/assets and hold the intended state before capture. Keep deterministic data. Playwright's [visual comparison documentation](https://playwright.dev/docs/test-snapshots) explains environment sensitivity and reviewed reference images. Mask genuinely volatile content only; never mask the status text, errors, trigger, or borders under test. If screenshot stabilization disables animation, separately check transitions under ordinary motion settings.

Long errors must remain readable and recovery actions reachable. When a bounded status area scrolls, test that overflow is keyboard-accessible and does not trap focus; do not pass geometry tests by clipping feedback. Check busy/disabled semantics and duplicate submission, error announcements, input retention, and focus/scroll separately. Accessibility checks complement visual tests; they do not prove layout stability.

## Make CI failures actionable

Add the selected browser command as a required job alongside independent type/lint/unit checks. Build and start the actual app or a representative fixture using existing repository conventions; wait for readiness and clean up processes. Run without live VM credentials where an injected provider can exercise the same UI. Keep separate live integration checks for provider behavior.

Fail on geometry assertions and unreviewed screenshot differences. Upload before/pending/after images, expected/actual/diff images when available, measured coordinates, browser console/server logs, and a trace or video on failure. Playwright documents [CI setup and report artifacts](https://playwright.dev/docs/ci-intro) and [trace inspection](https://playwright.dev/docs/trace-viewer-intro). Keep artifacts free of credentials and real user data. Preserve first-failure evidence through retries; a retry passing does not explain a flaky transition.

Review baseline changes with the feature diff and its transition matrix. Never auto-update baselines in required CI, suppress the affected region, or broadly increase pixel thresholds to make failures disappear. Prove each new guard detects a known bad fixture: for example, a top-left pending label followed by centered content, or an appended mutation status that recenters the button group. Revert that deliberate defect before shipping.

## Metrics and lint have narrower roles

CLS is useful supporting telemetry, but not the acceptance oracle. The metric excludes shifts within 500ms of qualifying user input; that can exclude exactly the button-triggered movement being tested. See [web.dev's CLS guidance](https://web.dev/articles/optimize-cls). Replacement nodes and a change in visual focus also require direct transition inspection. A low CLS score does not establish continuity.

A custom AST rule can flag an identifiable pattern, not compute browser layout. [ESLint's rule API](https://eslint.org/docs/latest/extend/custom-rules) supplies syntax visitors and diagnostics. Potential checks, scoped to registered components and known symbol origins, include direct mutation pending state that inserts a sibling status row, bypassing the shared Button loading contract, or a null fallback at a boundary required to preserve a visible frame. These are proposed heuristics, not installed rules; start advisory with valid and invalid fixtures. A sibling status may already occupy reserved space, and a null fallback may have no visible layout responsibility.

Do not lint by words such as “Loading,” demand fixed heights everywhere, or automatically rewrite states. CSS, responsive layout, fonts, translated text, and component internals require runtime evidence. Use source checks to direct review, browser assertions for measurable invariants, and visual review for whether the transition prepares the eye for incoming content.
