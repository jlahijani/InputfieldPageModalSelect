# InputfieldPageModalSelect

`InputfieldPageModalSelect` is a ProcessWire inputfield for multi-page reference fields. It provides a modal-based page picker for advanced page selection workflows where a normal select, asmSelect, or PageListSelectMultiple interface is not enough.

The inputfield is designed for multiple page references and supports sortable values, so it appears in ProcessWire under multiple page selection inputfield options that support sorting.

## Features

- Modal-based page picker for multi-page reference fields.
- Two-tab workflow:
  - **Selected pages**: view, search, unselect, and sort currently selected pages.
  - **Search**: search pages or browse all pages matching the field selector.
- Dedicated search inputs for selected pages and search results.
- Result pagination using ProcessWire-style `MarkupPagerNav` markup/classes.
- Select/Deselect all visible search results
- Remove all selected pages from the Selected pages table header.
- Selected pages are sortable by drag handle.
- Page titles link to page edit screens.
- Page edit links in the modal open in ProcessWire modals.
- The collapsed field summary shows the selected count and links selected pages to edit pages.
- Search results show selected pages as checked when they match the search.
- Configurable search fields, search operator, and results per page.

## Requirements

- ProcessWire.
- `InputfieldPage`.
- `ProcessPageSearch`.
- ProcessWire admin assets that provide jQuery UI dialog, UIkit, and sortable support.

The module declares these requirements:

```php
'requires' => array('InputfieldPage', 'ProcessPageSearch')
```

## Installation

Place the module directory here:

```text
/site/modules/InputfieldPageModalSelect/
```

Install it from ProcessWire admin:

```text
Modules > Refresh
Modules > Site > InputfieldPageModalSelect > Install
```

On install, the module registers itself with `InputfieldPage` so it becomes available as an inputfield option for Page reference fields.

## Field Setup

1. Create or edit a Page reference field.
2. Set it to allow multiple pages.
3. Choose `Page Modal Select` as the inputfield.
4. Configure the normal Page reference field selector/parent/template settings as needed.
5. Configure this inputfield's additional options if needed.

Because the inputfield implements `InputfieldHasSortableValue`, it is appropriate for sortable multiple page reference fields.

## Configuration

The module adds these inputfield configuration options:

### Fields to search

Field names used by the Search tab.

Default:

```text
title
```

Multiple fields may be entered separated by spaces. Dot notation is converted for `ProcessPageSearch` URL usage.

### Search operator

Selector operator used for search terms.

Options:

```text
%=
*=
~=
^=
=
```

Default:

```text
%=
```

### Results per page

Number of matching pages shown per AJAX request/page.

Default:

```text
50
```

Pagination is used when there are more matching pages than this number.

### Show selected pages below the field

Controls whether selected pages are listed under the selection button in the page editor.

Default:

```text
checked
```

The selected count remains visible even when this option is unchecked.

### Columns to show

Textarea list of modal table columns, one field name per line.

Default:

```text
title
```

When `title` is listed, it is rendered as the linked page title with the page path underneath. Image fields render the first uploaded image as a 100 by 100 thumbnail when an image is available. Other fields render as text.

## Modal Workflow

Clicking the field button opens a large ProcessWire-style modal.

If no pages are selected, the modal opens on the Search tab. If pages are already selected, it opens on the Selected pages tab.

### Selected pages tab

This tab shows the current selection.

Selected page table rows are loaded by AJAX when the tab is opened, so page editor load time does not scale with the number of selected pages or configured image columns.

Available actions:

- Search selected pages.
- Remove all selected pages from the Remove column header.
- Uncheck individual pages to remove them.
- Drag selected pages by the sort handle to reorder them.

The tab label includes the selected count.

### Search tab

This tab searches pages matching the field selector.

When the tab opens without a search term, it automatically loads all pages matching the field selector. Entering a search term filters the results. Clearing the search field returns to the all-results view.

Available actions:

- Search by configured fields.
- Select all shown.
- Deselect all shown.
- Check or uncheck individual result rows.
- Navigate result pages with pagination.

If a search result is already selected, it remains visible and appears checked.

Pagination appears above and below the result table. When a pagination link is clicked, the modal body scrolls back to the top with a short animation.

## Data Storage

The selected page IDs are stored in a hidden input as a comma-separated list while editing:

```html
<input type="hidden" class="InputfieldPageModalSelectData" value="123,456,789">
```

On ProcessWire input processing, the module normalizes that value back to a unique array of positive integer page IDs.

Selected page labels and paths are cached in `data-labels` and `data-paths` attributes as JSON objects for client-side rendering. They are intentionally stored as objects rather than sparse arrays to avoid large JSON payloads full of `null` entries when page IDs are high.

## AJAX Search

The module uses `ProcessPageSearch::setForSelector()` to create a search endpoint based on the field's selector configuration.

Selector inputs considered by the module include:

- `findPagesSelector`
- `findPagesSelect`
- `parent_id`
- `template_id`
- `template_ids`
- `allowUnpub`
- `maxResults`

The search request includes:

- configured search fields
- configured operator
- result `start` for pagination
- requested label field/path data

## Frontend Assets

The module loads:

```text
InputfieldPageModalSelect.js
InputfieldPageModalSelect.css
```

The cache-busting query string uses the module `version` value from `getModuleInfo()`.

## Performance Notes

The JavaScript includes safeguards for admin reload contexts:

- A global loaded guard prevents duplicate document-level event bindings if the asset is executed more than once.
- In-flight search/show-all/pagination AJAX requests are aborted before a new request starts for the same field.
- Label/path maps are normalized to plain objects to prevent sparse array JSON bloat.
- The all-results view remains paginated by the configured results-per-page value.

If browser performance is poor, first check:

- The field's Results per page setting.
- The size of `data-labels` and `data-paths` in the rendered markup.
- Whether the inputfield asset is being injected repeatedly by custom admin code.

## Files

```text
InputfieldPageModalSelect.module
InputfieldPageModalSelect.js
InputfieldPageModalSelect.css
README.md
```
