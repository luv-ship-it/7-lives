# 7-Lives: Project Plan

## 1. Project Summary

Build a replayable single-player browser game in which the player lives through seven stages. At the start of each life, the player chooses a role from a shared roster, then completes that life’s challenge and defeats its boss. The player chooses again for the next life. Failure means retrying the current life; completing the seventh boss finishes the game.

Confirmed direction: the game is a website for a general audience, and each of the seven lives has a role-selection step and its own boss. The README and current direction do not yet settle the exact genre, controls, visual style, or role roster. This plan proposes a 2D browser game as a starting point and calls out those remaining design decisions.

## 2. Product Goals

- Make the seven-life progression easy to understand and satisfying to complete.
- Give every life a recognizable identity, distinct struggle, and boss encounter.
- Make the role selection meaningful through different abilities, tools, or approaches to each challenge.
- Make failure feel like a retry, not an unexplained loss of progress.
- Make the role choice matter to how the player completes a life.
- Deliver a complete game loop from the opening screen through seven boss victories and the ending.
- Keep the first release small enough to build, test, and balance without requiring a backend.

## 3. Core Player Experience

1. Start a new game and learn the premise and controls.
2. See the current life’s setting and choose one role from the available roster.
3. Use that role’s abilities or tools to complete the life’s challenge and defeat its boss.
4. On victory, mark the life cleared and advance to the next life, where the player chooses a role again.
5. On failure, see a clear result and retry the same life. Previously cleared lives remain cleared.
6. Defeat the boss in life seven to complete the game, see the ending, and optionally start a new run.

## 4. Scope and Features

### Minimum viable game

- **Title and start flow:** New Game, Continue when a saved game exists, and a short premise/introduction.
- **Seven-life structure:** A progression screen showing locked, current, and cleared lives.
- **Role selection:** Before each life, choose one role from a roster of seven. Proposed starting roster: doctor, lawyer, engineer, athlete, teacher, chef, and scientist. Treat these as fictional game archetypes, not simulations of real professional work. Decide whether a role can be reused in later lives during design.
- **Distinct life content:** Each life has a name, theme, struggle, objective, and boss. Use shared systems with data-driven variations rather than seven unrelated implementations.
- **Role-specific gameplay:** Each role has a recognizable ability/tool set that changes how the player approaches the life’s challenge and boss. Keep the controls consistent where possible.
- **One core challenge loop:** Choose and validate one genre-appropriate interaction early (for example, exploration and platforming, action combat, or puzzle encounters). Reuse its controls and rules across lives, while varying objectives, role abilities, and bosses.
- **Success and failure states:** Explain the outcome, award or retain progress appropriately, and offer a clear continue/retry action.
- **Boss encounters:** One boss encounter in each life. Defeating the seventh life’s boss completes the game; there is no separate post-campaign boss in the initial scope.
- **Ending and replay:** A completion screen and a way to begin a fresh run.
- **Save/resume:** Persist current life, cleared lives, relevant choices, and basic settings locally.
- **Basic accessibility and usability:** Keyboard controls, readable text, visible focus states, adjustable audio, and pause/restart controls.

### Good follow-up features

- Multiple endings based on accumulated choices or performance.
- Optional challenges, collectibles, or alternate routes within lives.
- Difficulty or assist options, remappable controls, and additional accessibility settings.
- More detailed statistics, achievements, localization, and cloud saves.
- Additional content or a second playthrough mode after the core game is stable.

Keep these out of the first playable milestone unless the core loop proves insufficient without them.

## 5. Content Design

Create a content brief for each of the seven lives and a role brief for each available role before production. Each life brief should define:

- Life number, title, visual identity, and short introduction.
- The life’s central struggle and what the player is trying to accomplish.
- The gameplay objective, success condition, and failure condition.
- Important characters, locations, and any required dialogue or narrative beats.
- Which role abilities/tools are useful or required, while allowing more than one viable approach where practical.
- The boss’s behavior, defeat condition, and how the selected role changes the encounter.
- Difficulty target, expected play time, and retry behavior.
- Required art, animation, sound, and UI assets.

The seven life themes, their order, role abilities, and bosses need to be authored. Aim for variety in story and objectives while keeping the core controls consistent. Make sure every role can complete every life unless the design intentionally communicates a restriction before role selection.

## 6. Recommended Technology Stack

This is a proposed stack, not an existing repository decision:

- **Platform:** Website/browser game. Design responsively; choose desktop keyboard, touch, or combined controls after the gameplay format is decided.
- **Language:** TypeScript for gameplay, content schemas, and UI.
- **Game engine:** Phaser 3 for 2D scenes, input, animation, audio, and encounter flow.
- **Build tooling:** Vite for local development and production builds.
- **UI:** Phaser-rendered menus and HUD initially, avoiding a second UI framework until a concrete need exists.
- **Content:** Version-controlled JSON or typed TypeScript data for life definitions, dialogue, and encounter configuration.
- **Persistence:** Browser `localStorage` behind a small save/load interface; version save data so it can be migrated if its shape changes.
- **Testing:** Vitest for progression, choices, save/load, and other engine-independent rules; browser playtesting for controls, rendering, and full-run behavior.
- **Hosting:** Static hosting of the production build. No server or account system is needed for the first release.

If the intended game is not a 2D browser game, decide the target platform and engine before implementation; retain the progression model and content plan while revisiting the technical stack.

## 7. Architecture

Organize the game around a small set of responsibilities:

- **Game bootstrap:** Creates the Phaser game, registers scenes, loads configuration, and starts the title flow.
- **Scenes:** Title/menu, life progression, role selection, life gameplay, boss encounter, results, and ending. Keep scene transitions explicit.
- **Progression state:** Owns current life, selected role for each life, cleared lives, run status, and rules for unlocking the next stage. This is the source of truth for progression.
- **Role and life content:** Declarative definitions for role abilities and each life’s narrative, objective, challenge, boss, and assets. Scenes consume content rather than branching on hard-coded life numbers.
- **Gameplay systems:** Reusable input, interaction, objective, health/failure, and success handling appropriate to the genre selected.
- **Save service:** Serializes validated progression and settings, reads/writes local storage, and handles missing or incompatible saves.
- **Presentation:** HUD, menus, dialogue, feedback, audio, and animation. Presentation reflects game state but does not decide progression rules.

Suggested flow:

`Bootstrap -> Title -> Role Selection -> Life Challenge -> Life Boss -> Results -> Next Life -> Role Selection ... -> Life 7 Boss -> Ending`

Failure returns from `Results` to the same life. Victory marks that life cleared and unlocks the next one. Only the progression system can mark a life cleared. Keep gameplay rules independent of Phaser where practical so they can be unit tested.

## 8. Data Model

Define typed structures for:

- **Role definition:** stable ID, title, description, abilities/tools, and asset references.
- **Life definition:** stable ID, title, intro, theme/assets, objective configuration, boss configuration, and success/failure rules.
- **Run progress:** schema version, current life ID, selected role per life, cleared life IDs, boss results, and ending ID when complete.
- **Settings:** audio levels, control preferences, and accessibility options as they are introduced.

Use stable IDs rather than array positions in saved data. Validate loaded values and recover safely from malformed or outdated saves. Do not store secrets or personal data.

## 9. Work Plan and Milestones

### Milestone 1: Resolve the design

- **Confirmed:** Website/browser platform; general audience; seven sequential lives; choose a role at the start of each life; complete that life’s challenge and defeat its boss before advancing.
- Select the game format, perspective, control scheme, session length, and visual direction.
- Confirm the seven-role roster and whether roles can be reused across lives.
- Define role abilities, what a life’s challenge involves, and clear/failure/retry rules.
- Write one-page briefs for seven lives, seven bosses, and seven roles. Ensure every role/life pairing is completable or clearly communicate any restrictions.
- Sketch the role-selection screen, gameplay/HUD, boss encounter, progression screen, and failure/victory flow.

**Exit check:** A player can explain how to choose a role, what they do in a life, how to defeat its boss, what happens on failure, and how the seven stages conclude.

### Milestone 2: Build a playable vertical slice

- Set up the project, Phaser scenes, input, and a basic UI flow.
- Implement one representative life with role selection, role-specific play, challenge, boss, success, failure, and retry.
- Implement progression state and a save/resume path.
- Use temporary art and sound; prioritize a complete playable loop over polish.

**Exit check:** A new player can choose a role, play and defeat the sample boss, fail and retry, reload the page, and retain the expected progress.

### Milestone 3: Complete the game loop

- Implement all seven life definitions using the shared systems.
- Add stage unlocks, all seven boss encounters, ending, and new-run flow.
- Add final art/audio direction and essential UI feedback.
- Confirm role selection and role-specific abilities are understandable, balanced, and testable.

**Exit check:** A full run can be completed from a clean save by choosing a role for each life and defeating each boss; failures never skip or erase progress incorrectly.

### Milestone 4: Polish and release

- Balance difficulty and retry frequency; playtest each life independently and as a full run.
- Improve onboarding, feedback, pause/restart behavior, accessibility, and responsive layout.
- Test save corruption/old-save behavior, browser refresh, and supported browsers.
- Optimize asset loading and production build size; document controls and known limitations.

**Exit check:** Release checklist passes and the game can be hosted as a static site without manual setup.

## 10. Testing and Quality Checks

- Unit-test stage unlock rules, retry behavior, role selection storage, boss victory handling, and ending completion.
- Unit-test save serialization, validation, and recovery from missing or invalid data.
- Playtest all success and failure paths, including refreshing or closing the browser between lives.
- Verify every life has a reachable success state and an intentional failure/retry state.
- Check keyboard navigation, focus visibility, text readability, audio controls, and common viewport sizes.
- Run a complete clean-save playthrough and a continue-from-save playthrough before release.

## 11. Risks and Decisions to Resolve

- **Gameplay format is unspecified:** This determines controls, level design, engine usage, and asset needs. Decide before the vertical slice.
- **Role differentiation can multiply scope:** Seven roles across seven lives can imply many unique combinations. Build a small reusable ability set and verify role/life combinations through the vertical slice.
- **Role reuse is undecided:** Decide whether players may choose the same role more than once; the initial plan assumes they can.
- **Scope can grow quickly:** Seven life settings, role kits, and boss encounters are substantial. Reuse mechanics and content pipelines; vary goals, rules, and presentation selectively.
- **Repeated failure can frustrate:** Preserve cleared progress, explain what happened, and make retries quick. Consider assist options after playtesting.
- **Save compatibility:** Save schema changes can strand a player’s run. Version and validate save data from the first implementation.

## 12. Definition of Done

- The player can start a new game, choose a role for each of seven lives, and defeat that life’s boss to advance.
- Failure retries the current uncleared life without losing previously cleared lives.
- Defeating the seventh life’s boss leads to a clear ending; no separate final boss is required for the initial release.
- Progress and settings that are in scope survive a browser restart and invalid save data does not crash the game.
- Each life and role has a documented identity; role abilities affect gameplay, and every life has a documented challenge and boss.
- Core progression and persistence rules have automated tests, and the full game has passed a clean-run playtest.
- The production build can be deployed to static hosting and the README is updated with setup, controls, and build instructions once implementation begins.