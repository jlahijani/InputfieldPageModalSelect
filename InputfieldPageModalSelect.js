(function($) {
	'use strict';

	if(window.InputfieldPageModalSelectLoaded) return;
	window.InputfieldPageModalSelectLoaded = true;

	function getIds($input) {
		var value = ($input.val() || '').toString();
		if(!value.length) return [];
		return value.split(',').filter(function(id) {
			return /^\d+$/.test(id) && parseInt(id, 10) > 0;
		});
	}

	function getWrap($element) {
		var $wrap = $element.closest('.InputfieldPageModalSelect');
		if($wrap.length) return $wrap;
		var $dialog = $element.closest('.InputfieldPageModalSelectDialog');
		if(!$dialog.length) {
			$dialog = $element.closest('.ui-dialog');
			if(!$dialog.length) return $();
		}
		return $dialog.data('InputfieldPageModalSelectWrap') || $();
	}

	function getDialog($wrap) {
		var $dialog = $wrap.data('InputfieldPageModalSelectDialog');
		if($dialog && $dialog.length) return $dialog;
		$dialog = $wrap.find('.InputfieldPageModalSelectDialog');
		$wrap.data('InputfieldPageModalSelectDialog', $dialog);
		return $dialog;
	}

	function findField($wrap, selector) {
		var $found = $wrap.find(selector);
		var $dialog = getDialog($wrap);
		if($dialog.length) $found = $found.add($dialog.find(selector));
		return $found;
	}

	function setIds($input, ids) {
		var seen = {};
		var clean = [];
		ids.forEach(function(id) {
			id = parseInt(id, 10);
			if(id > 0 && !seen[id]) {
				seen[id] = true;
				clean.push(id.toString());
			}
		});
		$input.val(clean.join(',')).trigger('change');
	}

	function markSelectedDataDirty($wrap, start) {
		$wrap.removeData('InputfieldPageModalSelectSelectedLoadedFor');
		$wrap.data('InputfieldPageModalSelectSelectedStart', typeof start === 'undefined' ? 0 : Math.max(0, parseInt(start || 0, 10)));
	}

	function normalizeMap(map) {
		var normalized = {};
		if(!map) return normalized;
		Object.keys(map).forEach(function(key) {
			if(map[key] !== null && typeof map[key] !== 'undefined') {
				normalized[key] = map[key];
			}
		});
		return normalized;
	}

	function getLabels($wrap) {
		var labels = {};
		try {
			labels = normalizeMap(JSON.parse($wrap.attr('data-labels') || '{}'));
		} catch(e) {
			labels = {};
		}
		return labels;
	}

	function setLabels($wrap, labels) {
		$wrap.attr('data-labels', JSON.stringify(normalizeMap(labels)));
	}

	function getPaths($wrap) {
		var paths = {};
		try {
			paths = normalizeMap(JSON.parse($wrap.attr('data-paths') || '{}'));
		} catch(e) {
			paths = {};
		}
		return paths;
	}

	function setPaths($wrap, paths) {
		$wrap.attr('data-paths', JSON.stringify(normalizeMap(paths)));
	}

	function getColumnData($wrap) {
		var columns = {};
		try {
			columns = normalizeMap(JSON.parse($wrap.attr('data-columns') || '{}'));
		} catch(e) {
			columns = {};
		}
		return columns;
	}

	function setColumnData($wrap, columns) {
		$wrap.attr('data-columns', JSON.stringify(normalizeMap(columns)));
	}

	function getColumnFields($wrap) {
		var value = ($wrap.attr('data-column-fields') || '').toString();
		if(!value.length) return ['title'];
		return value.split(',').filter(function(name) {
			return name.length > 0;
		});
	}

	function matchesQuery(label, query) {
		query = $.trim(query || '').toLowerCase();
		if(!query.length) return true;
		return (label || '').toLowerCase().indexOf(query) !== -1;
	}

	function labelFor(match, labelKey) {
		var label = '';
		if(match.label) label = match.label;
		if(labelKey && match[labelKey]) label = match[labelKey];
		if(!label && match.title) label = match.title;
		if(!label && match.name) label = match.name;
		return $('<div/>').html(label).text();
	}

	function appendParam(url, name, value) {
		return url + (url.indexOf('?') === -1 ? '?' : '&') + encodeURIComponent(name) + '=' + encodeURIComponent(value);
	}

	function makeEditLink($wrap, id, label) {
		var editUrlTemplate = $wrap.attr('data-edit-url-template') || '';
		if(!editUrlTemplate.length) return $('<span/>').text(label);
		return $('<a/>', {
			href: editUrlTemplate.replace('{id}', id),
			class: 'pw-modal pw-modal-large',
			'data-autoclose': '1'
		}).text(label);
	}

	function makeTitleCell($wrap, id, label, path) {
		var $cell = $('<td/>').addClass('InputfieldPageModalSelectTitleCell');
		$cell.append(makeEditLink($wrap, id, label).addClass('InputfieldPageModalSelectResultLabel'));
		if(path) $cell.append($('<div/>').addClass('InputfieldPageModalSelectPathText').text(path));
		return $cell;
	}

	function makeColumnCell($wrap, id, fieldName, rowColumns, label, path) {
		var column = rowColumns && rowColumns[fieldName] ? rowColumns[fieldName] : null;
		var type = column && column.type ? column.type : fieldName === 'title' ? 'title' : 'text';
		var $cell = $('<td/>').addClass('InputfieldPageModalSelectColumnCell').attr('data-column', fieldName);
		var image;

		if(type === 'title') return makeTitleCell($wrap, id, column && column.text ? column.text : label, column && column.path ? column.path : path);

		if(type === 'image') {
			image = column && column.image ? column.image : null;
			if(image && image.url) {
				$cell.addClass('InputfieldPageModalSelectImageCell').append($('<img/>', {
					src: image.url,
					width: image.width || 100,
					height: image.height || 'auto',
					alt: image.alt || '',
					loading: 'lazy'
				}));
			}
			return $cell;
		}

		$cell.text(column && typeof column.text !== 'undefined' ? column.text : '');
		return $cell;
	}

	function appendConfiguredCells($wrap, $row, id, rowColumns, label, path) {
		getColumnFields($wrap).forEach(function(fieldName) {
			$row.append(makeColumnCell($wrap, id, fieldName, rowColumns, label, path));
		});
	}

	function updateSelectedTabCount($wrap) {
		findField($wrap, '.InputfieldPageModalSelectSelectedTabCount').text('(' + getIds($wrap.find('.InputfieldPageModalSelectData')).length + ')');
	}

	function hasSelectedColumnData($wrap, ids) {
		var columns = getColumnData($wrap);
		var fields = getColumnFields($wrap);
		if(!ids.length) return true;
		return ids.every(function(id) {
			var row = columns[id];
			if(!row) return false;
			return fields.every(function(fieldName) {
				return typeof row[fieldName] !== 'undefined';
			});
		});
	}

	function updateSummary($wrap) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var labels = getLabels($wrap);
		var $list = $wrap.find('.InputfieldPageModalSelectSelected').empty();
		var count = ids.length;
		var countText = count === 1 ? '1 item selected' : count + ' items selected';
		var editUrlTemplate = $wrap.attr('data-edit-url-template') || '';

		ids.forEach(function(id) {
			var label = labels[id] || ('Page ' + id);
			var $item = $('<li/>').attr('data-page-id', id);
			if(editUrlTemplate.length) {
				$('<a/>').attr('href', editUrlTemplate.replace('{id}', id)).text(label).appendTo($item);
			} else {
				$item.text(label);
			}
			$item.appendTo($list);
		});

		$wrap.find('.InputfieldPageModalSelectCount').text(countText);
		$wrap.find('.InputfieldPageModalSelectOpen').contents().filter(function() {
			return this.nodeType === 3;
		}).remove();
		$wrap.find('.InputfieldPageModalSelectOpen').append(' ' + (count ? 'Change selection' : 'Select pages'));
	}

	function updateIdsFromModalSelected($wrap) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var visibleIds = [];
		var start = Math.max(0, parseInt($wrap.data('InputfieldPageModalSelectSelectedStart') || 0, 10));
		findField($wrap, '.InputfieldPageModalSelectModalSelected tbody tr').each(function() {
			visibleIds.push($(this).attr('data-page-id'));
		});
		if(ids.length && visibleIds.length < ids.length) {
			visibleIds.forEach(function(id, index) {
				ids[start + index] = id;
			});
		} else {
			ids = visibleIds;
		}
		setIds($input, ids);
		markSelectedDataDirty($wrap, start);
		updateSummary($wrap);
		updateSelectedIndexes($wrap);
	}

	function updateSelectedIndexes($wrap) {
		var start = Math.max(0, parseInt($wrap.data('InputfieldPageModalSelectSelectedStart') || 0, 10));
		findField($wrap, '.InputfieldPageModalSelectModalSelected tbody tr').each(function(index) {
			var value = start + index;
			var $cell = $(this).find('.InputfieldPageModalSelectIndexCell');
			var $input = $cell.find('.InputfieldPageModalSelectIndexInput');
			if($input.length) {
				$input.val(value);
			} else {
				$cell.text(value);
			}
		});
	}

	function moveSelectedToIndex($wrap, id, targetIndex) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var currentIndex = ids.indexOf(id);
		var limit = Math.max(0, parseInt($wrap.data('InputfieldPageModalSelectSelectedLimit') || 0, 10));
		var targetStart;

		targetIndex = parseInt(targetIndex, 10);
		if(currentIndex === -1 || isNaN(targetIndex)) {
			renderSelectedInModal($wrap, true);
			return;
		}

		targetIndex = Math.max(0, Math.min(targetIndex, ids.length - 1));
		if(currentIndex === targetIndex) {
			updateSelectedIndexes($wrap);
			return;
		}

		ids.splice(currentIndex, 1);
		ids.splice(targetIndex, 0, id);
		setIds($input, ids);
		targetStart = limit ? Math.floor(targetIndex / limit) * limit : 0;
		markSelectedDataDirty($wrap, targetStart);
		updateSummary($wrap);
		loadSelectedData($wrap, targetStart);
	}

	function refreshSortable($wrap) {
		var $selected = findField($wrap, '.InputfieldPageModalSelectModalSelected tbody');
		var query = findField($wrap, '.InputfieldPageModalSelectSelectedQuery').val() || '';
		var enabled = !$.trim(query).length && $selected.children('tr').length > 1;

		if(!$.fn.sortable) return;
		if(!$selected.data('InputfieldPageModalSelectSortable')) {
			$selected.sortable({
				axis: 'y',
				handle: '.InputfieldPageModalSelectSortHandle',
				update: function() {
					updateIdsFromModalSelected($wrap);
				}
			});
			$selected.data('InputfieldPageModalSelectSortable', true);
		}

		if(enabled) {
			$selected.sortable('enable').removeClass('InputfieldPageModalSelectSortDisabled');
		} else {
			$selected.sortable('disable').addClass('InputfieldPageModalSelectSortDisabled');
		}
	}

	function selectedStateKey($wrap, start) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var query = $.trim(findField($wrap, '.InputfieldPageModalSelectSelectedQuery').val() || '');
		return ids.join(',') + '|' + query + '|' + Math.max(0, parseInt(start || 0, 10));
	}

	function setSelectedStatus($wrap, text) {
		findField($wrap, '.InputfieldPageModalSelectSelectedStatus').text(text);
		findField($wrap, '.InputfieldPageModalSelectSelectedBottomStatus').text(text);
	}

	function resetSelectedStatus($wrap) {
		findField($wrap, '.InputfieldPageModalSelectSelectedStatus').html("<i class='fa fa-spinner fa-spin' aria-hidden='true'></i> Loading selected pages...");
		findField($wrap, '.InputfieldPageModalSelectSelectedBottomStatus').empty();
	}

	function renderSelectedData($wrap, data) {
		var labels = getLabels($wrap);
		var paths = getPaths($wrap);
		var columns = getColumnData($wrap);
		var matches = data && data.matches ? data.matches : [];
		var total = parseInt(data && data.total ? data.total : 0, 10);
		var limit = parseInt(data && data.limit ? data.limit : 0, 10);
		var start = parseInt(data && data.start ? data.start : 0, 10);
		var query = $.trim(findField($wrap, '.InputfieldPageModalSelectSelectedQuery').val() || '');
		var $selected = findField($wrap, '.InputfieldPageModalSelectModalSelected tbody').empty();
		var $hiddenNote = findField($wrap, '.InputfieldPageModalSelectSelectedHiddenNote').empty();

		findField($wrap, '.InputfieldPageModalSelectSelectedPagination').empty();
		$wrap.data('InputfieldPageModalSelectSelectedLimit', limit);
		$wrap.data('InputfieldPageModalSelectSelectedTotal', total);

		matches.forEach(function(match, offset) {
			var id = match.id.toString();
			var label = labelFor(match, '');
			var path = match.path || '';
			var $item = $('<tr/>').attr('data-page-id', id);
			var index = start + offset;
			var $indexCell = $('<td/>').addClass('InputfieldPageModalSelectIndexCell');
			var $remove;

			if(label) labels[id] = label;
			if(path) paths[id] = path;
			if(match.columns) columns[id] = match.columns;

			$remove = $('<a/>', {
				href: '#',
				class: 'InputfieldPageModalSelectRemoveSelected',
				'aria-label': 'Remove ' + label,
				title: 'Remove'
			}).append($('<i/>').addClass('fa fa-times-circle').attr('aria-hidden', 'true'));

			$item.append($('<td/>').addClass('InputfieldPageModalSelectSortCell').append($('<span/>').addClass('InputfieldPageModalSelectSortHandle fa fa-arrows').attr('aria-hidden', 'true')));
			if(query.length) {
				$indexCell.text(index);
			} else {
				$indexCell.append($('<input/>', {
					type: 'number',
					class: 'InputfieldPageModalSelectIndexInput uk-input uk-form-small',
					min: 0,
					max: Math.max(0, total - 1),
					value: index,
					'aria-label': 'Move selected page to index'
				}));
			}
			$item.append($indexCell);
			appendConfiguredCells($wrap, $item, id, match.columns || {}, label, path);
			$item.append($('<td/>').addClass('InputfieldPageModalSelectRemoveCell').append($remove));
			$selected.append($item);
		});

		setLabels($wrap, labels);
		setPaths($wrap, paths);
		setColumnData($wrap, columns);
		findField($wrap, '.InputfieldPageModalSelectSelectedBlock').toggle(getIds($wrap.find('.InputfieldPageModalSelectData')).length > 0);
		findField($wrap, '.InputfieldPageModalSelectModalSelectedWrap').toggle(matches.length > 0);

		if(!matches.length) {
			setSelectedStatus($wrap, query.length ? 'No selected pages matched.' : 'No selected pages.');
		} else {
			setSelectedStatus($wrap, 'Showing ' + (start + 1) + '-' + Math.min(start + matches.length, total) + ' of ' + total + (query.length ? ' matching selected pages' : ' selected pages'));
		}

		renderPagination($wrap, data || {}, '.InputfieldPageModalSelectSelectedPagination');
		if($wrap.data('InputfieldPageModalSelectScrollResultsTop')) {
			$wrap.removeData('InputfieldPageModalSelectScrollResultsTop');
			window.setTimeout(function() {
				scrollResultsToTop($wrap);
			}, 0);
		}
		$wrap.data('InputfieldPageModalSelectSelectedCanSort', !query.length && (!limit || total <= limit));
		$hiddenNote.empty();
		refreshSortable($wrap);
	}

	function renderSelectedInModal($wrap, allowLoad) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var labels = getLabels($wrap);
		var $selected = findField($wrap, '.InputfieldPageModalSelectModalSelected tbody');
		var $hiddenNote = findField($wrap, '.InputfieldPageModalSelectSelectedHiddenNote');
		var start = Math.max(0, parseInt($wrap.data('InputfieldPageModalSelectSelectedStart') || 0, 10));

		updateSelectedTabCount($wrap);

		if(allowLoad && $wrap.data('InputfieldPageModalSelectSelectedLoadedFor') === selectedStateKey($wrap, start)) {
			return;
		}

		$selected.empty();
		$hiddenNote.empty();
		findField($wrap, '.InputfieldPageModalSelectSelectedPagination').empty();

		if(!ids.length) {
			findField($wrap, '.InputfieldPageModalSelectSelectedBlock').hide();
			setSelectedStatus($wrap, 'No selected pages.');
			$wrap.data('InputfieldPageModalSelectSelectedCanSort', false);
			refreshSortable($wrap);
			return;
		}

		if(!allowLoad) {
			findField($wrap, '.InputfieldPageModalSelectSelectedBlock').show();
			findField($wrap, '.InputfieldPageModalSelectModalSelectedWrap').hide();
			resetSelectedStatus($wrap);
			$wrap.data('InputfieldPageModalSelectSelectedCanSort', false);
			refreshSortable($wrap);
			return;
		}

		findField($wrap, '.InputfieldPageModalSelectSelectedBlock').show();
		findField($wrap, '.InputfieldPageModalSelectModalSelectedWrap').hide();
		resetSelectedStatus($wrap);
		$wrap.data('InputfieldPageModalSelectSelectedCanSort', false);
		refreshSortable($wrap);
		ensureSelectedData($wrap);
	}

	function loadSelectedData($wrap, start) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var idsKey = ids.join(',');
		var url = appendParam($input.attr('data-url'), 'action', 'selected');
		var query = $.trim(findField($wrap, '.InputfieldPageModalSelectSelectedQuery').val() || '');
		var previousRequest;
		start = Math.max(0, parseInt(start || 0, 10));

		if(!ids.length) {
			$wrap.data('InputfieldPageModalSelectSelectedLoadedFor', selectedStateKey($wrap, 0));
			renderSelectedData($wrap, { total: 0, limit: 0, start: 0, matches: [] });
			return;
		}

		url = appendParam(url, 'ids', idsKey);
		if(query.length) url = appendParam(url, 'q', query);
		if(start > 0) url = appendParam(url, 'start', start);

		previousRequest = $wrap.data('InputfieldPageModalSelectSelectedRequest');
		if(previousRequest && previousRequest.readyState !== 4) previousRequest.abort();

		findField($wrap, '.InputfieldPageModalSelectSelectedPagination').empty();
		findField($wrap, '.InputfieldPageModalSelectModalSelectedWrap').hide();
		findField($wrap, '.InputfieldPageModalSelectSelectedBlock').show();
		resetSelectedStatus($wrap);
		$wrap.data('InputfieldPageModalSelectSelectedCanSort', false);
		refreshSortable($wrap);

		var request = $.getJSON(url).done(function(data) {
			$wrap.data('InputfieldPageModalSelectSelectedLoadedFor', selectedStateKey($wrap, start));
			$wrap.data('InputfieldPageModalSelectSelectedStart', start);
			renderSelectedData($wrap, data || {});
		}).fail(function(xhr, status) {
			var $selected;
			if(status === 'abort') return;
			$selected = findField($wrap, '.InputfieldPageModalSelectModalSelected tbody').empty();
			$selected.append($('<tr/>').append($('<td/>', {
				colspan: getColumnFields($wrap).length + 3,
				class: 'InputfieldPageModalSelectLoadingCell'
			}).text('Unable to load selected pages.')));
		}).always(function() {
			if($wrap.data('InputfieldPageModalSelectSelectedRequest') === request) {
				$wrap.removeData('InputfieldPageModalSelectSelectedRequest');
			}
		});

		$wrap.data('InputfieldPageModalSelectSelectedRequest', request);
	}

	function ensureSelectedData($wrap) {
		var start = Math.max(0, parseInt($wrap.data('InputfieldPageModalSelectSelectedStart') || 0, 10));
		if($wrap.data('InputfieldPageModalSelectSelectedLoadedFor') === selectedStateKey($wrap, start)) return;
		if($wrap.data('InputfieldPageModalSelectSelectedRequest')) return;
		loadSelectedData($wrap, start);
	}

	function renderPagination($wrap, data, selector) {
		var total = parseInt(data && data.total ? data.total : 0, 10);
		var limit = parseInt(data && data.limit ? data.limit : 0, 10);
		var start = parseInt(data && data.start ? data.start : 0, 10);
		var $paginations = findField($wrap, selector || '.InputfieldPageModalSelectPagination').empty();
		var currentPage = limit ? Math.floor(start / limit) + 1 : 1;
		var totalPages = limit ? Math.ceil(total / limit) : 1;
		var maxLinks = 7;
		var firstPage = Math.max(1, currentPage - Math.floor(maxLinks / 2));
		var lastPage = Math.min(totalPages, firstPage + maxLinks - 1);
		var $list;

		if(!limit || total <= limit) return;

		if(lastPage - firstPage + 1 < maxLinks) firstPage = Math.max(1, lastPage - maxLinks + 1);

		$list = $('<ul/>', {
			class: 'uk-pagination MarkupPagerNav',
			role: 'navigation',
			'aria-label': 'Pagination links'
		});

		function addItem(page, label, className, isCurrent) {
			var itemClass = className || '';
			var pageStart = (page - 1) * limit;
			var $item = $('<li/>', {
				class: itemClass,
				'aria-label': isCurrent ? 'Page ' + page + ', current page' : 'Page ' + page
			});
			var $link = $('<a/>', {
				href: '#',
				'data-start': pageStart
			}).append($('<span/>').text(label));

			if(isCurrent) {
				$item.addClass('uk-active MarkupPagerNavOn').attr('aria-current', 'true');
			}

			$item.append($link).appendTo($list);
		}

		function addSeparator() {
			$('<li/>', {
				class: 'uk-disabled MarkupPagerNavSeparator',
				'aria-label': 'More pages'
			}).append($('<span/>').html('&hellip;')).appendTo($list);
		}

		if(currentPage > 1) addItem(currentPage - 1, 'Prev', 'MarkupPagerNavPrevious');
		if(firstPage > 1) {
			addItem(1, '1', 'MarkupPagerNavFirst MarkupPagerNavFirstNum', currentPage === 1);
			if(firstPage > 2) addSeparator();
		}

		for(var page = firstPage; page <= lastPage; page++) {
			addItem(page, page.toString(), page === totalPages ? 'MarkupPagerNavLastNum' : '', page === currentPage);
		}

		if(lastPage < totalPages) {
			if(lastPage < totalPages - 1) addSeparator();
			addItem(totalPages, totalPages.toString(), 'MarkupPagerNavLast MarkupPagerNavLastNum', currentPage === totalPages);
		}
		if(currentPage < totalPages) addItem(currentPage + 1, 'Next', 'MarkupPagerNavNext');

		$paginations.each(function() {
			$(this).append($list.clone(true));
		});
	}

	function setResultsStatus($wrap, text) {
		findField($wrap, '.InputfieldPageModalSelectStatus').text(text);
		findField($wrap, '.InputfieldPageModalSelectBottomStatus').text(text);
	}

	function resetResultsStatus($wrap) {
		findField($wrap, '.InputfieldPageModalSelectStatus').text('Loading pages...');
		findField($wrap, '.InputfieldPageModalSelectBottomStatus').empty();
	}

	function updateResultsSelectToggle($wrap) {
		var $checkboxes = findField($wrap, '.InputfieldPageModalSelectResults input[type=checkbox]');
		var enabled = $checkboxes.length > 0;
		var allSelected = enabled && $checkboxes.filter(':checked').length === $checkboxes.length;
		var label = allSelected ? 'Deselect all shown' : 'Select all shown';

		findField($wrap, '.InputfieldPageModalSelectToggleShown')
			.toggleClass('uk-disabled', !enabled)
			.attr('aria-disabled', enabled ? 'false' : 'true')
			.attr('aria-label', label)
			.attr('title', label)
			.attr('data-action', allSelected ? 'deselect' : 'select');
	}

	function scrollResultsToTop($wrap) {
		var $resultsWrap = findField($wrap, '.InputfieldPageModalSelectResultsWrap');
		var $selectedWrap = findField($wrap, '.InputfieldPageModalSelectModalSelectedWrap');
		var $body = findField($wrap, '.InputfieldPageModalSelectBody');

		$resultsWrap.stop(true).animate({ scrollTop: 0 }, 200);
		$selectedWrap.stop(true).animate({ scrollTop: 0 }, 200);
		$body.stop(true).animate({ scrollTop: 0 }, 200);
	}

	function renderResults($wrap, data) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var selected = getIds($input).reduce(function(acc, id) {
			acc[id] = true;
			return acc;
		}, {});
		var labels = getLabels($wrap);
		var paths = getPaths($wrap);
		var columns = getColumnData($wrap);
		var $results = findField($wrap, '.InputfieldPageModalSelectResults tbody').empty();
		var matches = data && data.matches ? data.matches : [];
		var labelKey = '';
		var total = parseInt(data && data.total ? data.total : 0, 10);
		var start = parseInt(data && data.start ? data.start : 0, 10);

		if($input.attr('data-url').indexOf('format_name=') !== -1) {
			var match = $input.attr('data-url').match(/format_name=([^&]+)/);
			if(match) labelKey = decodeURIComponent(match[1]);
		} else {
			var getMatch = $input.attr('data-url').match(/[?&]get=([^&]+)/);
			if(getMatch) labelKey = decodeURIComponent(getMatch[1]);
		}

		if(!matches.length) {
			setResultsStatus($wrap, 'No matching pages found.');
			findField($wrap, '.InputfieldPageModalSelectResultsWrap').hide();
			renderPagination($wrap, data || {});
			updateResultsSelectToggle($wrap);
			return;
		}

		matches.forEach(function(match) {
			var id = match.id.toString();
			var label = labelFor(match, labelKey);
			if(label) labels[id] = label;
			if(match.path) paths[id] = match.path;
			if(match.columns) columns[id] = match.columns;

			var $item = $('<tr/>').attr('data-page-id', id);
			var checkboxId = $input.attr('id') + '_page_' + id;
			var $label = $('<label/>').attr('for', checkboxId);
			var $checkbox = $('<input/>', {
				type: 'checkbox',
				id: checkboxId,
				class: 'uk-checkbox',
				value: id,
				checked: !!selected[id]
			});

			$label.append($checkbox);
			$item.append($('<td/>').addClass('InputfieldPageModalSelectSelectCell').append($label));
			appendConfiguredCells($wrap, $item, id, match.columns || {}, label, match.path || '');
			$results.append($item);
		});

		setResultsStatus($wrap, 'Showing ' + (start + 1) + '-' + Math.min(start + matches.length, total) + ' of ' + total + ' matching pages');
		findField($wrap, '.InputfieldPageModalSelectResultsWrap').show();
		if($wrap.data('InputfieldPageModalSelectScrollResultsTop')) {
			$wrap.removeData('InputfieldPageModalSelectScrollResultsTop');
			window.setTimeout(function() {
				scrollResultsToTop($wrap);
			}, 0);
		}
		setLabels($wrap, labels);
		setPaths($wrap, paths);
		setColumnData($wrap, columns);
		updateSelectedTabCount($wrap);
		renderPagination($wrap, data);
		updateResultsSelectToggle($wrap);
	}

	function loadResults($wrap, mode, start) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var query = $.trim(findField($wrap, '.InputfieldPageModalSelectQuery').val());
		var $status = findField($wrap, '.InputfieldPageModalSelectStatus');
		var url = $input.attr('data-url');
		start = Math.max(0, parseInt(start || 0, 10));

		if(mode === 'search' && !query.length) {
			findField($wrap, '.InputfieldPageModalSelectResults tbody').empty();
			findField($wrap, '.InputfieldPageModalSelectResultsWrap').hide();
			findField($wrap, '.InputfieldPageModalSelectPagination').empty();
			resetResultsStatus($wrap);
			updateSelectedTabCount($wrap);
			updateResultsSelectToggle($wrap);
			return;
		}

		$wrap.data('InputfieldPageModalSelectMode', mode);
		$wrap.data('InputfieldPageModalSelectStart', start);
		$wrap.data('InputfieldPageModalSelectQuery', mode === 'search' ? query : '');

		$status.html("<i class='fa fa-spinner fa-spin' aria-hidden='true'></i> " + (mode === 'search' ? 'Searching...' : 'Loading pages...'));
		findField($wrap, '.InputfieldPageModalSelectBottomStatus').empty();
		updateResultsSelectToggle($wrap);
		updateSelectedTabCount($wrap);

		if(mode === 'search') url = appendParam(url, 'q', query);
		if(start > 0) url = appendParam(url, 'start', start);

		var previousRequest = $wrap.data('InputfieldPageModalSelectRequest');
		if(previousRequest && previousRequest.readyState !== 4) previousRequest.abort();

		var request = $.getJSON(url).done(function(data) {
			renderResults($wrap, data);
		}).fail(function(xhr, status) {
			if(status === 'abort') return;
			setResultsStatus($wrap, mode === 'search' ? 'Search failed.' : 'Unable to load pages.');
			updateResultsSelectToggle($wrap);
		}).always(function(xhr, status) {
			if($wrap.data('InputfieldPageModalSelectRequest') === request) {
				$wrap.removeData('InputfieldPageModalSelectRequest');
			}
		});

		$wrap.data('InputfieldPageModalSelectRequest', request);
	}

	function search($wrap) {
		if($.trim(findField($wrap, '.InputfieldPageModalSelectQuery').val()).length) {
			loadResults($wrap, 'search', 0);
		} else {
			loadResults($wrap, 'all', 0);
		}
	}

	function loadAllResults($wrap) {
		findField($wrap, '.InputfieldPageModalSelectQuery').val('');
		loadResults($wrap, 'all', 0);
	}

	function ensureSearchResults($wrap) {
		if($wrap.data('InputfieldPageModalSelectMode')) return;
		if($wrap.data('InputfieldPageModalSelectRequest')) return;
		loadAllResults($wrap);
	}

	function removeAll($wrap) {
		setIds($wrap.find('.InputfieldPageModalSelectData'), []);
		markSelectedDataDirty($wrap);
		findField($wrap, '.InputfieldPageModalSelectResults input[type=checkbox]').prop('checked', false);
		updateSummary($wrap);
		renderSelectedInModal($wrap, true);
	}

	function selectAllShown($wrap) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var added = 0;

		findField($wrap, '.InputfieldPageModalSelectResults input[type=checkbox]').each(function() {
			var id = $(this).val();
			if(ids.indexOf(id) === -1) {
				ids.push(id);
				added++;
			}
			$(this).prop('checked', true);
		});

		setIds($input, ids);
		markSelectedDataDirty($wrap);
		updateSummary($wrap);
		updateSelectedTabCount($wrap);
		updateResultsSelectToggle($wrap);
		setResultsStatus($wrap, added + (added === 1 ? ' page selected from results.' : ' pages selected from results.'));
	}

	function deselectAllShown($wrap) {
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var remove = {};
		var removed = 0;

		findField($wrap, '.InputfieldPageModalSelectResults input[type=checkbox]').each(function() {
			var id = $(this).val();
			if(ids.indexOf(id) !== -1 && !remove[id]) {
				remove[id] = true;
				removed++;
			}
			$(this).prop('checked', false);
		});

		ids = ids.filter(function(id) {
			return !remove[id];
		});

		setIds($input, ids);
		markSelectedDataDirty($wrap);
		updateSummary($wrap);
		updateSelectedTabCount($wrap);
		updateResultsSelectToggle($wrap);
		setResultsStatus($wrap, removed + (removed === 1 ? ' page deselected from results.' : ' pages deselected from results.'));
	}

	function showTab($wrap, index) {
		var $tabs = findField($wrap, '.InputfieldPageModalSelectTabs');
		if(window.UIkit && UIkit.tab && $tabs.length) {
			UIkit.tab($tabs[0]).show(index);
		} else {
			$tabs.children('li').eq(index).children('a').trigger('click');
		}
	}

	function focusInitialSearch($wrap, tabIndex) {
		var selector = tabIndex === 0 ? '.InputfieldPageModalSelectSelectedQuery' : '.InputfieldPageModalSelectQuery';
		var $input = findField($wrap, selector);
		if(!$input.length) return;
		$input.trigger('focus');
		if(document.activeElement !== $input[0]) {
			window.setTimeout(function() {
				$input.trigger('focus');
			}, 100);
		}
	}

	function updateModalStack($dialog) {
		if($.fn.dialog && $dialog.hasClass('ui-dialog-content')) {
			$dialog.dialog('widget').each(function() {
				var $widget = $(this);
				var $close = $widget.find('.ui-dialog-titlebar-close');
				$(this).data('InputfieldPageModalSelectWrap', $dialog.data('InputfieldPageModalSelectWrap'));
				this.style.setProperty('z-index', '1000001', 'important');
				$close
					.css('padding-top', 0)
					.addClass('ui-state-default');
				if(!$close.children('i.fa-times').length) {
					$close.prepend("<i class='fa fa-times'></i>");
				}
				$close.find('.ui-icon').remove();
			});
		}
		$('.ui-widget-overlay').last().addClass('InputfieldPageModalSelectOverlay');
		$('.InputfieldPageModalSelectOverlay').each(function() {
			this.style.setProperty('z-index', '1000000', 'important');
		});
	}

	function updateProcessWireModalStack() {
		var $iframe = $('.pw-modal-window.ui-dialog-content').last();
		var $dialog = $iframe.closest('.ui-dialog');
		var $overlay = $('.ui-widget-overlay').not('.InputfieldPageModalSelectOverlay').last();

		if($overlay.length) $overlay[0].style.setProperty('z-index', '1000002', 'important');
		if($dialog.length) $dialog[0].style.setProperty('z-index', '1000003', 'important');
	}

	function openDialog($wrap) {
		var $dialog = getDialog($wrap);
		var hasSelections = getIds($wrap.find('.InputfieldPageModalSelectData')).length > 0;
		var initialTab = hasSelections ? 0 : 1;
		$dialog.data('InputfieldPageModalSelectWrap', $wrap);
		var dialogOptions = {
			modal: true,
			draggable: false,
			appendTo: 'body',
			dialogClass: 'InputfieldPageModalSelectDialogLarge pw-modal-large',
			width: Math.min($(window).width() - 40, 1100),
			height: Math.max(370, $(window).height() - 190),
			maxHeight: Math.max(370, $(window).height() - 190),
			open: function() {
				updateModalStack($dialog);
				window.setTimeout(function() {
					updateModalStack($dialog);
				}, 50);
			},
			close: function() {
				updateSummary($wrap);
				resetSearch($wrap);
				$dialog.prop('hidden', true);
			}
		};
		updateSummary($wrap);
		renderSelectedInModal($wrap, false);
		$dialog.prop('hidden', false);

		if($.fn.dialog) {
			if($dialog.hasClass('ui-dialog-content')) {
				$dialog.dialog('option', dialogOptions).dialog('open');
			} else {
				$dialog.dialog(dialogOptions);
			}
		} else {
			$dialog.addClass('InputfieldPageModalSelectDialogOpen');
		}

		updateModalStack($dialog);
		window.setTimeout(function() {
			updateModalStack($dialog);
		}, 50);

		window.setTimeout(function() {
			showTab($wrap, initialTab);
			if(initialTab === 0) renderSelectedInModal($wrap, true);
			if(initialTab === 1) ensureSearchResults($wrap);
			window.setTimeout(function() {
				focusInitialSearch($wrap, initialTab);
			}, 50);
		}, 100);
	}

	function closeDialog($wrap) {
		var $dialog = getDialog($wrap);
		if($.fn.dialog && $dialog.hasClass('ui-dialog-content')) {
			$dialog.dialog('close');
		} else {
			$dialog.prop('hidden', true).removeClass('InputfieldPageModalSelectDialogOpen');
			updateSummary($wrap);
			resetSearch($wrap);
		}
	}

	function resetSearch($wrap) {
		findField($wrap, '.InputfieldPageModalSelectQuery').val('');
		findField($wrap, '.InputfieldPageModalSelectSelectedQuery').val('');
		findField($wrap, '.InputfieldPageModalSelectResults tbody').empty();
		findField($wrap, '.InputfieldPageModalSelectResultsWrap').hide();
		findField($wrap, '.InputfieldPageModalSelectPagination').empty();
		updateResultsSelectToggle($wrap);
		$wrap.removeData('InputfieldPageModalSelectMode');
		$wrap.removeData('InputfieldPageModalSelectStart');
		$wrap.removeData('InputfieldPageModalSelectQuery');
		markSelectedDataDirty($wrap);
		resetResultsStatus($wrap);
		renderSelectedInModal($wrap, false);
	}

	function resetResultsSearch($wrap) {
		loadAllResults($wrap);
	}

	function resetSelectedSearch($wrap) {
		findField($wrap, '.InputfieldPageModalSelectSelectedQuery').val('');
		$wrap.data('InputfieldPageModalSelectSelectedStart', 0);
		loadSelectedData($wrap, 0);
	}

	function init($wrap) {
		if($wrap.data('InputfieldPageModalSelectReady')) return;
		$wrap.data('InputfieldPageModalSelectReady', true);
		updateSummary($wrap);
	}

	$(document).on('click', '.InputfieldPageModalSelectOpen', function() {
		openDialog(getWrap($(this)));
	});

	$(document).on('click', '.InputfieldPageModalSelectClose', function() {
		closeDialog(getWrap($(this)));
	});

	$(document).on('pw-modal-opened', function() {
		window.setTimeout(updateProcessWireModalStack, 0);
		window.setTimeout(updateProcessWireModalStack, 50);
	});

	$(document).on('click', '.InputfieldPageModalSelectInlineClear', function() {
		var $wrap = getWrap($(this));
		var $input = $(this).siblings('input[type=search]');
		$input.val('').trigger('focus');
		if($input.hasClass('InputfieldPageModalSelectSelectedQuery')) {
			resetSelectedSearch($wrap);
		} else {
			resetResultsSearch($wrap);
		}
	});

	$(document).on('click', '.InputfieldPageModalSelectSearchTab', function() {
		var $wrap = getWrap($(this));
		window.setTimeout(function() {
			ensureSearchResults($wrap);
		}, 0);
	});

	$(document).on('click', '.InputfieldPageModalSelectSelectedTab', function() {
		var $wrap = getWrap($(this));
		window.setTimeout(function() {
			renderSelectedInModal($wrap, true);
		}, 0);
	});

	$(document).on('click', '.InputfieldPageModalSelectRemoveAll', function(event) {
		event.preventDefault();
		if(!window.confirm('Remove all selected pages?')) return;
		removeAll(getWrap($(this)));
	});

	$(document).on('click', '.InputfieldPageModalSelectRemoveSelected', function(event) {
		event.preventDefault();
		var $wrap = getWrap($(this));
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var id = $(this).closest('tr').attr('data-page-id');
		var ids = getIds($input).filter(function(value) {
			return value !== id;
		});
		setIds($input, ids);
		markSelectedDataDirty($wrap);
		findField($wrap, '.InputfieldPageModalSelectResults input[type=checkbox][value="' + id + '"]').prop('checked', false);
		updateSummary($wrap);
		renderSelectedInModal($wrap, true);
	});

	$(document).on('change', '.InputfieldPageModalSelectIndexInput', function() {
		var $input = $(this);
		var $wrap = getWrap($input);
		var id = $input.closest('tr').attr('data-page-id');
		moveSelectedToIndex($wrap, id, $input.val());
	});

	$(document).on('click', '.InputfieldPageModalSelectToggleShown', function(event) {
		event.preventDefault();
		if($(this).attr('aria-disabled') === 'true') return;
		if($(this).attr('data-action') === 'deselect') {
			deselectAllShown(getWrap($(this)));
		} else {
			selectAllShown(getWrap($(this)));
		}
	});

	$(document).on('click', '.InputfieldPageModalSelectPagination .MarkupPagerNav a[data-start]', function(event) {
		event.preventDefault();
		var $wrap = getWrap($(this));
		var mode = $wrap.data('InputfieldPageModalSelectMode') || 'all';
		$wrap.data('InputfieldPageModalSelectScrollResultsTop', true);
		loadResults($wrap, mode, $(this).attr('data-start'));
	});

	$(document).on('click', '.InputfieldPageModalSelectSelectedPagination .MarkupPagerNav a[data-start]', function(event) {
		event.preventDefault();
		var $wrap = getWrap($(this));
		var start = $(this).attr('data-start');
		$wrap.data('InputfieldPageModalSelectSelectedStart', start);
		$wrap.data('InputfieldPageModalSelectScrollResultsTop', true);
		loadSelectedData($wrap, start);
	});

	$(document).on('input', '.InputfieldPageModalSelectQuery', function() {
		var $wrap = getWrap($(this));
		window.clearTimeout($wrap.data('InputfieldPageModalSelectTimer'));
		$wrap.data('InputfieldPageModalSelectTimer', window.setTimeout(function() {
			search($wrap);
		}, 250));
	});

	$(document).on('input', '.InputfieldPageModalSelectSelectedQuery', function() {
		var $wrap = getWrap($(this));
		window.clearTimeout($wrap.data('InputfieldPageModalSelectSelectedTimer'));
		$wrap.data('InputfieldPageModalSelectSelectedTimer', window.setTimeout(function() {
			$wrap.data('InputfieldPageModalSelectSelectedStart', 0);
			loadSelectedData($wrap, 0);
		}, 250));
	});

	$(document).on('change', '.InputfieldPageModalSelectResults input[type=checkbox]', function() {
		var $wrap = getWrap($(this));
		var $input = $wrap.find('.InputfieldPageModalSelectData');
		var ids = getIds($input);
		var id = $(this).val();

		if(this.checked) {
			ids.push(id);
		} else {
			ids = ids.filter(function(value) {
				return value !== id;
			});
		}

		setIds($input, ids);
		markSelectedDataDirty($wrap);
		updateSummary($wrap);
		updateSelectedTabCount($wrap);
		updateResultsSelectToggle($wrap);
	});

	$(function() {
		$('.InputfieldPageModalSelect').each(function() {
			init($(this));
		});
	});

	$(document).on('reloaded opened', '.InputfieldPageModalSelect', function() {
		init($(this));
	});

})(jQuery);
