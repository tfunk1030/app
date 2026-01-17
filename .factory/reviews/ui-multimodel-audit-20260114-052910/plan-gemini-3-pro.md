The UI/UX consolidated execution plan has been successfully created and verified.

**Summary of Deliverables:**
1.  **Markdown Plan (`docs/UI_UX_CONSOLIDATED_PLAN.md`):** Contains a prioritized list of issues, a 4-PR execution sequence (P0-P2), and validation criteria.
2.  **JSON Plan (`docs/UI_UX_CONSOLIDATED_PLAN.json`):** A machine-readable version of the PR sequence as requested.

**Key Prioritizations:**
-   **PR-1 (P0):** Fixes the critical `mode='system'` logic bug where the app defaults to dark mode even on light OS settings, and adds missing accessibility to the Home screen.
-   **PR-2 (P1):** Enforces 48dp touch targets (fixing the 44pt vs 48dp mismatch) and removes hardcoded colors.
-   **PR-3 (P1):** Improves input accessibility and fixes the aggressive location permission prompt on launch.
-   **PR-4 (P2):** Adds error recovery (retry buttons) and polishes compass accessibility announcements.

The plan is ready for execution.
