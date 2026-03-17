---
name: project_table_component
description: A shared Table component with its own SCSS file is planned for all list/table views
type: project
---

A reusable Table component (with dedicated SCSS) is planned to replace all ad-hoc list/grid column definitions across the platform.

**Why:** DRY — currently requests, companies, suppliers, users all define their own grid-template-columns. These should be unified.

**How to apply:** Don't create page-specific SCSS for table column layouts. When the Table component task comes up, consolidate all column definitions there. Until then, avoid adding new per-page table SCSS files.
