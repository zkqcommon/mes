/*
 * ********************************************************************
 * Code developed by amazing QCADOO developers team.
 * Copyright (c) Qcadoo Limited sp. z o.o. (2010)
 * ********************************************************************
 */

var QCD = QCD || {};
QCD.components = QCD.components || {};
QCD.components.elements = QCD.components.elements || {};

QCD.components.elements.Grid = function(_element, _mainController) {
	$.extend(this, new QCD.components.Component(_element, _mainController));
	
	var mainController = _mainController;
	var element = _element;
	
	var headerController;
	
	var elementPath = this.elementPath;
	var elementName = this.elementName;
	var elementSearchName = this.elementSearchName;
	
	var gridParameters;
	var grid;
	var belongsToFieldName;

	var translations;
	
	var componentEnabled = false;
	
	var currentGridHeight;
	
	var currentState = {
		selectedEntityId: null,
		searchEnabled: false
	}
	
	var RESIZE_COLUMNS_ON_UPDATE_SIZE = true;
	
	var columnModel = new Object();
	
	var hiddenColumnValues = new Object();
	
	var defaultOptions = {
		paging: true,
		fullScreen: false,
		shrinkToFit: false
	};
	
	function parseOptions(options) {
		gridParameters = new Object();

		var colNames = new Array();
		var colModel = new Array();
		var isSearchEnabled = false;
		
		for (var i in options.columns) {
			var column = options.columns[i];
			columnModel[column.name] = column;
			var isSortable = false;
			var isSerchable = false;
			for (var sortColIter in options.orderableColumns) {
				if (options.orderableColumns[sortColIter] == column.name) {
					isSortable = true;
					break;
				}
			}
			for (var sortColIter in options.searchableColumns) {
				if (options.searchableColumns[sortColIter] == column.name) {
					isSerchable = true;
					isSearchEnabled = true;
					break;
				}
			}
			if (!column.hidden) {
				colNames.push(column.label+"<div class='sortArrow' id='"+elementPath+"_sortArrow_"+column.name+"'></div>");
				
				var stype = 'text';
				var searchoptions = {};
				if (column.filterValues) {
					var possibleValues = new Object();
					possibleValues[""] = "";
					for (var i in column.filterValues) {
						possibleValues[i] = column.filterValues[i];
					}
					stype = 'select';
					searchoptions.value = possibleValues;
				}
				
				colModel.push({name:column.name, index:column.name, width:column.width, sortable: isSortable, resizable: true, 
					align: column.align, stype: stype, searchoptions: searchoptions
					});
			} else {
				hiddenColumnValues[column.name] = new Object();
			}
		}
		
		gridParameters.sortColumns = options.orderableColumns;
		
		gridParameters.colNames = colNames;
		gridParameters.colModel = colModel;
		gridParameters.datatype = function(postdata) {
			onPostDataChange(postdata);
		}
		gridParameters.multiselect = true;
		gridParameters.shrinkToFit = true;
		
		gridParameters.listeners = options.listeners;
		gridParameters.canNew = options.creatable;
		gridParameters.canDelete = options.deletable;
		gridParameters.paging = options.paginable;
		gridParameters.filter = isSearchEnabled;
		gridParameters.isLookup = options.lookup ? true : false;
		gridParameters.orderable = options.prioritizable;
		
		gridParameters.fullScreen = options.fullscreen;
		if (options.height) { 
			gridParameters.height = parseInt(options.height);
			if (gridParameters.height <= 0) {
				gridParameters.height = null;
			}
		}
		if (options.width) { gridParameters.width = parseInt(options.width); }
		if (! gridParameters.width && ! gridParameters.fullScreen) {
			gridParameters.width = 300;
		}
		gridParameters.correspondingViewName = options.correspondingView;
		gridParameters.correspondingComponent = options.correspondingComponent;
		
		for (var opName in defaultOptions) {
			if (gridParameters[opName] == undefined) {
				gridParameters[opName] = defaultOptions[opName];
			}
		}
	};
	function rowClicked(rowId) {
		if (currentState.selectedEntityId == rowId) {
			currentState.selectedEntityId = null;
		} else {
			if (currentState.selectedEntityId) {
				grid.setSelection(currentState.selectedEntityId, false);
			}
			currentState.selectedEntityId = rowId;
		}
		
		var rowIndex = grid.jqGrid('getInd', currentState.selectedEntityId);
		if (rowIndex == false) {
			rowIndex = null;
		}
		headerController.onRowClicked(rowIndex);
		
		if (gridParameters.listeners.length > 0) {
			onSelectChange();
		}
	}
	
	function linkClicked(entityId) {
		if (gridParameters.isLookup) {
			performLookupSelect(null, entityId);
			mainController.closeWindow();
		} else {
			var params = new Object();
			params[gridParameters.correspondingComponent+".id"] = entityId;
			redirectToCorrespondingPage(params);	
		}
	}
	
	function redirectToCorrespondingPage(params) {
		if (gridParameters.correspondingViewName && gridParameters.correspondingViewName != '') {
			var url = gridParameters.correspondingViewName + ".html";
			if (params) {
				url += "?context="+JSON.stringify(params);
			}
			mainController.goToPage(url);
		}
	}
	
	this.getComponentValue = function() {
		return currentState;
	}
	
	this.setComponentState = function(state) {
		if (state.selectedEntityId) {
			currentState.selectedEntityId = state.selectedEntityId;
		}
		if (state.belongsToEntityId) {
			currentState.belongsToEntityId = state.belongsToEntityId;
		}
		if (state.firstEntity) {
			currentState.firstEntity = state.firstEntity;
		}
		if (state.maxEntities) {
			currentState.maxEntities = state.maxEntities;
		}
		if (state.searchEnabled) {
			currentState.searchEnabled = state.searchEnabled;
			headerController.setFilterActive();
			grid[0].toggleToolbar();
			if (currentState.searchEnabled) {
				currentGridHeight -= 21;
			} else {
				currentGridHeight += 21;
			}
			grid.setGridHeight(currentGridHeight);
		}
		if (state.filters && state.filters.length > 0) {
			currentState.filters = state.filters;
			for (var filterIndex in currentState.filters) {
				var filter = currentState.filters[filterIndex];
				$("#gs_"+filter.column).val(filter.value);
			}
		}
		if (state.sort) {
			currentState.sort = state.sort;
			$("#"+gridParameters.modifiedPath+"_grid_"+currentState.sort.column).addClass("sortColumn");
			if (currentState.sort.order == "asc") {
				$("#"+gridParameters.modifiedPath+"_sortArrow_"+currentState.sort.column).addClass("upArrow");
			} else {
				$("#"+gridParameters.modifiedPath+"_sortArrow_"+currentState.sort.column).addClass("downArrow");
			}
		}
	}
	
	this.setComponentValue = function(value) {
		
		if (value.belongsToEntityId) {
			currentState.belongsToEntityId = value.belongsToEntityId;
		}
		
		if (value.entities == null) {
			return;
		}
		grid.jqGrid('clearGridData');
		var rowCounter = 1;
		for (var entityNo in value.entities) {
			var entity = value.entities[entityNo];
			var fields = new Object();
			for (var fieldName in entity.fields) {
				if (hiddenColumnValues[fieldName]) {
					hiddenColumnValues[fieldName][entity.id] = entity.fields[fieldName];
				} else {
					if (columnModel[fieldName].link && entity.fields[fieldName] && entity.fields[fieldName] != "") {
						fields[fieldName] = "<a href=# id='"+elementPath+"_"+fieldName+"_"+entity.id+"' class='"+elementPath+"_link gridLink'>" + entity.fields[fieldName] + "</a>";
						
					} else {
						fields[fieldName] = entity.fields[fieldName];
					}
				}
			}			
			grid.jqGrid('addRowData', entity.id, fields);
			if (rowCounter % 2 == 0) {
				grid.jqGrid('setRowData', entity.id, false, "darkRow");
			} else {
				grid.jqGrid('setRowData', entity.id, false, "lightRow");
			}
			rowCounter++;
		}
		$("."+elementSearchName+"_link").click(function(e) {
			var idArr = e.target.id.split("_");
			var entityId = idArr[idArr.length-1];
			linkClicked(entityId);
		});
		
		headerController.updatePagingParameters(currentState.firstEntity, currentState.maxEntities, value.totalEntities);
		
		grid.setSelection(currentState.selectedEntityId, false);
		var rowIndex = grid.jqGrid('getInd', currentState.selectedEntityId);
		if (rowIndex == false) {
			currentState.selectedEntityId = null;
			rowIndex = null;
		}
		headerController.onRowClicked(rowIndex);
		
		unblockGrid();
	}
	
	this.setComponentEnabled = function(isEnabled) {
		componentEnabled = isEnabled;
		headerController.setEnabled(isEnabled);
	}
	
	this.setComponentLoading = function(isLoadingVisible) {
		if (isLoadingVisible) {
			blockGrid();
		} else {
			unblockGrid();
		}
	}

	
	function blockGrid() {
		if (grid) {
			// TODO masz i18n
			element.block({ message: '<div class="loading_div">'+mainController.getTranslation("commons.loading")+'</div>', showOverlay: false,  fadeOut: 0, fadeIn: 0,css: {
	            border: 'none', 
	            padding: '15px', 
	            backgroundColor: '#000', 
	            '-webkit-border-radius': '10px', 
	            '-moz-border-radius': '10px', 
	            opacity: .5, 
	            color: '#fff' } });
		}
	}
	
	function unblockGrid() {
		if (grid) {
			element.unblock();
		}
	}

	function constructor(_this) {
		
		parseOptions(_this.options, _this);
		
		gridParameters.modifiedPath = elementPath.replace(/\./g,"_");
		gridParameters.element = gridParameters.modifiedPath+"_grid";
		
		$("#"+elementSearchName+"_grid").attr('id', gridParameters.element);
		
		translations = _this.options.translations;
		belongsToFieldName = _this.options.belongsToFieldName;	
		
		headerController = new QCD.components.elements.grid.GridHeaderController(_this, mainController, gridParameters, _this.options.translations);
		
		$("#"+elementSearchName+"_gridHeader").append(headerController.getHeaderElement());
		$("#"+elementSearchName+"_gridFooter").append(headerController.getFooterElement());
		
		currentState.firstEntity = headerController.getPagingParameters()[0];
		currentState.maxEntities = headerController.getPagingParameters()[1];

		gridParameters.onSelectRow = function(id){
			rowClicked(id);
        }
		gridParameters.onSortCol = onSortColumnChange;
		
		grid = $("#"+gridParameters.element).jqGrid(gridParameters);
		
		$("#cb_"+gridParameters.element).hide(); // hide 'select add' checkbox
		$("#jqgh_cb").hide();
		
		
		for (var i in gridParameters.sortColumns) {
			$("#"+gridParameters.modifiedPath+"_grid_"+gridParameters.sortColumns[i]).addClass("sortableColumn");
		}
		
		if (gridParameters.width) {
			element.width(gridParameters.width);
		}
		if (gridParameters.fullScreen) {
			if (! gridParameters.height) {
				element.height("100%");
			}
		} else {
			grid.setGridWidth(gridParameters.width, true);
			grid.setGridHeight(gridParameters.height);
			$("#"+gridParameters.element+"Header").width(gridParameters.width);
			element.addClass("gridNotFullScreen");
		}
		
		blockGrid();
		
		grid.jqGrid('filterToolbar',{
			stringResult: true
		});
		if (gridParameters.isLookup) {
			headerController.setFilterActive();
			currentState.searchEnabled = true;
		} else {
			grid[0].toggleToolbar();
			currentState.searchEnabled = false;
		}
	}
	
	this.onPagingParametersChange = function() {
		blockGrid();
		currentState.firstEntity = headerController.getPagingParameters()[0];
		currentState.maxEntities = headerController.getPagingParameters()[1];
		onCurrentStateChange();
	}
	
	function onSortColumnChange(index,iCol,sortorder) {
		blockGrid();
		if (currentState.order && currentState.order.column) {
			$("#"+gridParameters.modifiedPath+"_grid_"+currentState.order.column).removeClass("sortColumn");
		}
		$("#"+gridParameters.modifiedPath+"_grid_"+index).addClass("sortColumn");
		if (currentState.order && currentState.order.column == index) {
			if (currentState.order.direction == "asc") {
				$("#"+elementSearchName+"_sortArrow_"+index).removeClass("upArrow");
				$("#"+elementSearchName+"_sortArrow_"+index).addClass("downArrow");
				currentState.order.direction = "desc";
			} else {
				$("#"+elementSearchName+"_sortArrow_"+index).removeClass("downArrow");
				$("#"+elementSearchName+"_sortArrow_"+index).addClass("upArrow");
				currentState.order.direction = "asc";
			}
		} else {
			$("#"+elementSearchName+"_sortArrow_"+index).addClass("upArrow");
			currentState.order = {
					column: index,
					direction: "asc"
				}
		}
		onCurrentStateChange();
		return 'stop';
	}
	
	function onPostDataChange(postdata) {
		blockGrid();
		if (currentState.searchEnabled) {
			try {
				var postFilters = JSON.parse(postdata.filters);
			} catch (e) {
				QCD.info("error in filters");
				QCD.info(postdata.filters);
				var wrongSearchCharacterError = mainController.getPluginIdentifier()+"."+mainController.getViewName()+"."+elementPath.replace(/-/g,".")+".wrongSearchCharacterError";
				mainController.showMessage("error", translations.wrongSearchCharacterError);
				unblockGrid();
				return;
			}
			currentState.filters = new Object();
			for (var i in postFilters.rules) {
				var filterRule = postFilters.rules[i];
				currentState.filters[filterRule.field] = filterRule.data;
			}
		} else {
			currentState.filters = null;
		}
		onCurrentStateChange();
	}
	
	this.onFilterButtonClicked = function() {
		grid[0].toggleToolbar();
		currentState.searchEnabled = ! currentState.searchEnabled;
		if (currentState.searchEnabled) {
			currentGridHeight -= 21;
		} else {
			currentGridHeight += 21;
		}
		grid.setGridHeight(currentGridHeight);
		onCurrentStateChange();
	}
	
	this.setFilterState = function(column, filterText) {
		if (! currentState.searchEnabled) {
			grid[0].toggleToolbar();
			currentState.searchEnabled = true;
		}
		if (! currentState.filters) {
			currentState.filters = new Array();
		}
		var filter = {
			column: column,
			value: filterText
		};
		currentState.filters.push(filter);
		$("#gs_"+column).val(filterText);
	}
	
	this.onNewButtonClicked = function() {
		performNew();
	}
	
	this.onDeleteButtonClicked = function() {
		 performDelete();
	}
	
	this.onUpButtonClicked = function() {
		blockGrid();
		mainController.callEvent("moveUp", elementPath, function() {
			unblockGrid();
		});
	}
	
	this.onDownButtonClicked = function() {
		blockGrid();
		mainController.callEvent("moveDown", elementPath, function() {
			unblockGrid();
		});
	}
	
	this.updateSize = function(_width, _height) {
		if (! gridParameters.height && gridParameters.fullScreen) {
			element.height(_height - 40);
			var HEIGHT_DIFF = 140;
			currentGridHeight = _height - HEIGHT_DIFF;
			
			if (currentState.searchEnabled) {
				currentGridHeight -= 21;
			}
			grid.setGridHeight(currentGridHeight);
		}
		if (! gridParameters.width && gridParameters.fullScreen) {
			grid.setGridWidth(_width-45, RESIZE_COLUMNS_ON_UPDATE_SIZE);
			element.width(_width - 40);
		}
	}
	
	function onCurrentStateChange() {
		if (componentEnabled) {
			mainController.callEvent("refresh", elementPath, function() {
				unblockGrid();
			});
		}
	}
	
	function onSelectChange() {
		if (componentEnabled) {
			mainController.callEvent("select", elementPath, null);
		}
	}
	
	this.performNew = function(actionsPerformer) {
		var context = null;
		if (belongsToFieldName && currentState.belongsToEntityId) {
			var contextArray = new Array();
			contextArray.push({
				fieldName: belongsToFieldName,
				entityId: currentState.belongsToEntityId
			});
			context = "context="+JSON.stringify(contextArray);
		}
		redirectToCorrespondingPage(context);
		if (actionsPerformer) {
			actionsPerformer.performNext();
		}
	}
	var performNew = this.performNew;
	
	
	this.performDelete = function(actionsPerformer) {
		if (currentState.selectedEntityId) {
			if (window.confirm(translations.confirmDeleteMessage)) {
				mainController.callEvent("remove", elementPath, function() {
					unblockGrid();
				});
			}
		} else {
			mainController.showMessage("error", translations.noRowSelectedError);
		}
		
	}
	

	this.performLookupSelect = function(actionsPerformer, entityId) {
//		if (!entityId) {
//			entityId = currentState.selectedEntityId;
//		}
//		if (entityId) {
//			var lookupValue = hiddenColumnValues["lookupValue"][entityId];
//			var lookupCode = hiddenColumnValues["lookupCode"][entityId];
//			mainController.performLookupSelect(entityId, lookupValue, lookupCode, actionsPerformer);
//		} else {
//			mainController.showMessage("error", translations.noRowSelectedError);
//		}
	}
	var performLookupSelect = this.performLookupSelect;
	
	constructor(this);
}