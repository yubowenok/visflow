/**
 * @fileoverview VisFlow view manager.
 */

'use strict';

/** @const */
visflow.viewManager = {};

visflow.viewManager.init = function() {
  this.topZindex = 0;
  this.menuOn = true;

  this.loadColorScales();
  this.colorScaleQueue = [];
};

/**
 * Shows the menu panel.
 */
visflow.viewManager.showMenuPanel = function() {
  var manager = this;
  var jqview = $('<div></div>')
    .appendTo('body');

  this.menuPanel = new visflow.Panel({
    id: 'menuPanel', // required by view
    class: 'menupanel',
    jqview: jqview,
    htmlFile: 'menu-panel.html',
    buttons: [
      {
        id: 'add',
        click: function(event) {
          manager.showAddPanel(event);
        }
      },
      {
        id: 'new',
        click: function() {
          visflow.flowManager.lastFilename = 'myDataflow';
          visflow.flowManager.clearFlow();
        }
      },
      {
        id: 'save',
        click: function() {
          visflow.flowManager.saveFlow();
        }
      },
      {
        id: 'load',
        click: function() {
          visflow.flowManager.loadFlow();
        }
      },
      {
        id: 'vismode',
        click: function() {
          visflow.flowManager.toggleVisMode();
        },
        mouseenter: function() {
          visflow.flowManager.previewVisMode(true);
        },
        mouseleave: function() {
          visflow.flowManager.previewVisMode(false);
        }
      },
      {
        id: 'help',
        click: function() {
          manager.helpVisFlow();
        }
      },
      {
        id: 'about',
        click: function() {
          manager.aboutVisFlow();
        }
      }
    ]
  });
  this.menuPanel.show();
};

/**
 * Hides the menu panel.
 */
visflow.viewManager.hideMenuPanel = function() {
  this.menuOn = false;
  this.menuPanel.jqview.hide();
};

/**
 * Toggles the menu panel.
 */
visflow.viewManager.toggleMenuPanel = function() {
  this.menuOn = !this.menuOn;
  if (this.menuOn) {
    this.menuPanel.jqview.animate({
      opacity: 1.0,
      top: '+=50'
    }, 1000);
  } else {
    this.menuPanel.jqview.animate({
      opacity: 0.0,
      top: '-=50'
    }, 1000);
  }
};

/**
 * Closes the popup panel.
 */
visflow.viewManager.closePopupPanel = function() {
  if (this.popupPanel) {
    this.popupPanel.jqview.remove();
    this.popupPanel = null;
  }
};

/**
 * Filters the entries in the system add-node panel.
 */
visflow.viewManager.filterAddPanel = function(key) {
  if (this.popupPanel == null)
    return console.error('filterAddPanel found no addpanel');
  // two children(), there is a container div
  this.popupPanel.jqview.find('.group').not('.' + key).remove();
  this.popupPanel.jqview.find('.addpanel-button').not('.' + key).remove();
};

/**
 * Shows the system add-node panel.
 */
visflow.viewManager.showAddPanel = function(event, compact) {
  this.closePopupPanel();
  var manager = this;
  var jqview = $('<div></div>')
    .appendTo('body');

  var buttons = [];
  [
    // data source
    'datasrc',
    // filter
    'range',
    'contain',
    // rendering property
    'property-editor', 'property-mapping',
    // set
    'intersect', 'minus', 'union',
    // value
    'value-extractor', 'value-maker',
    // visualization
    'table',
    'histogram',
    'parallelcoordinates',
    'scatterplot',
    'heatmap',
    'network'
  ].map(function(id) {
    var callback = function(event) {
      //console.log('dataflow');
      var node = visflow.flowManager.createNode(id);
      node.jqview.css({
        left: event.pageX - node.jqview.width() / 2,
        top: event.pageY - node.jqview.height() / 2,
        opacity: 0.0,
        zoom: 2,
      });
      node.jqview.animate({
        opacity: 1.0,
        zoom: 1,
      }, 200, function(){
        node.jqview.css('zoom', '');
      });
      manager.closePopupPanel();
      $('.dataflow-dropzone-temp').remove();
      $('#main').droppable('disable');
    };
    buttons.push({
      id: id,
      click: callback,
      dragstart: function(event) {
        var container = $('#popupPanel').find('.panel');

        // create a temporary droppable under #dataflow
        // so that we cannot drop the button to panel

        // container is under #popupPanel
        // container has size, #popupPanel has screen position offset
        $('<div></div>')
          .addClass('dataflow-dropzone-temp')
          .css({
            width: container.width(),
            height: container.height(),
            left: container.parent().offset().left,
            top: container.parent().offset().top
          })
          .appendTo('#main')
          .droppable({
            accept: '.addpanel-button',
            greedy: true, // this will prevent #dataflow be dropped at the same time
            tolerance: 'pointer'
          });
        $('#main').droppable({
          disabled: false,
          accept: '.addpanel-button',
          drop: callback
        });
      }
    });
  });
  this.popupPanel = new visflow.Panel({
    id: 'popupPanel', // required by view
    name: 'add',
    jqview: jqview,
    draggable: false,
    class: !compact ? 'addpanel' : 'addpanel-compact',
    css: {
      left: event.pageX + 50, // always near mouse
      top: Math.max(20,
        Math.min(event.pageY, $(window).height() - (compact ? 260 : 800)))
    },
    fadeIn: 200,
    htmlFile: !compact ? 'add-panel.html' : 'add-panel-compact.html',
    buttons: buttons,
    htmlLoadComplete: function() {
      jqview.find('.addpanel-button').tooltip({
        tooltipClass: 'addpanel-tooltip',
        show: {
          delay: 1000
        }
      });
    }
  });
  this.popupPanel.show();
};

/**
 * Creates a container view for node.
 * @param params
 */
visflow.viewManager.createNodeView = function(params) {
  if (params == null) {
    params = {};
  }
  var jqview = $('<div></div>')
    .appendTo('#main');
  jqview.css(params);
  return jqview;
};

/**
 * Creates a container view for edge.
 */
visflow.viewManager.createEdgeView = function(para) {
  if(params == null) {
    params = {};
  }
  var jqview = $('<div></div>')
    .appendTo('#edges');
  jqview.css(ms);
  return jqview;
};

/**
 * Removes the container view of a node.
 * @param {!jQuery} jqview
 */
visflow.viewManager.removeNodeView = function(jqview) {
  $(jqview).remove();
};

/**
 * Removes the container view of an edge.
 * @param {!jQuery} jqview
 */
visflow.viewManager.removeEdgeView = function(jqview) {
  $(jqview).remove();
};

/**
 * Clears all the views.
 */
visflow.viewManager.clearFlowViews = function() {
  $('.dataflow-node').remove();
  $('#edges').children().remove();
  // after this, nodes and edges cannot reuse their jqview
};

/**
 * Adds hover effect for an edge.
 * @param {!visflow.Edge} edge
 */
visflow.viewManager.addEdgeHover = function(edge) {
  var jqview = edge.jqview;
  // make a shadow
  jqview.children('.dataflow-edge-segment').clone()
    .appendTo('#dataflow-hover')
    .addClass('dataflow-edge-segment-hover dataflow-edge-clone');
  jqview.children().clone()
    .appendTo('#main')
    .addClass('dataflow-edge-clone');
  // copy port
  edge.sourcePort.jqview
    .clone()
    .appendTo('#main')
    .addClass('dataflow-edge-clone')
    .css(edge.sourcePort.jqview.offset());
  edge.targetPort.jqview
    .clone()
    .appendTo('#main')
    .addClass('dataflow-edge-clone')
    .css(edge.targetPort.jqview.offset());
};

/**
 * Clears hover effect for an edge.
 */
visflow.viewManager.clearEdgeHover = function() {
  $('#main').find('.dataflow-edge-clone').remove();
};

/**
 * Clears colorpicker.
 */
visflow.viewManager.hideColorpickers = function(exception) {
  $('.iris-picker').not(exception).hide();
};

/**
 * Brings a view container to the front.
 * @param jqview
 */
visflow.viewManager.bringFrontView = function(jqview) {
  jqview.css('z-index', ++this.topZindex);
};

/**
 * Gets the top z-index of views.
 */
visflow.viewManager.getTopZindex = function() {
  return this.topZindex;
};

/**
 * Gets the popup panel name,
 * @return {string|null}
 */
visflow.viewManager.getPopupPanelName = function() {
  if (this.popupPanel == null) {
    return null;
  }
  return this.popupPanel.name;
};

/**
 * Loads the color scale file.
 */
visflow.viewManager.loadColorScales = function() {
  var manager = this;
  $.get('src/unit/colorScales.json', function(scales) {
    var list = [];
    manager.colorScales = {};
    for (var i in scales) {
      var scale = scales[i];
      // save to node, map from value to scale object
      manager.colorScales[scale.value] = scale;

      var div = $('<div></div>')
        .addClass('dataflow-scalevis');
      var gradient = 'linear-gradient(to right,';
      if (scale.type == 'color') {
        // NOT support uneven scales
        for (var j in scale.range) {
          gradient += scale.range[j];
          gradient += j == scale.range.length - 1 ? ')' : ',';
        }
        div.css('background', gradient);
      } else if (scale.type == 'color-category10') {
        scale.domain = d3.range(10);
        scale.range = d3.scale.category10().range();
        var n = scale.range.length;
        for (var j = 0; j < n; j++) {
          gradient += scale.range[j] + ' ' + (j * 100 / n) + '%,';
          gradient += scale.range[j] + ' ' + ((j + 1) * 100 / n) + '%';
          gradient += j == scale.range.length - 1 ? ')' : ',';
        }
        div.css('background', gradient);
      }
      list.push({
        value: scale.value,
        text: scale.text,
        div: div
      });
    }
    manager.colorScaleList = list;

    for (var i in manager.colorScalesQueue) {
      var callback = manager.colorScalesQueue[i];
      callback();
    }
  });
};

/**
 * Gets the color scales.
 */
visflow.viewManager.getColorScales = function(unitCallback){
  if (this.colorScales == null) {
    this.colorScalesQueue.push(unitCallback);
    console.log('q');
    return null;
  }
  return this.colorScales;
};

/**
 * Creates a tooltip.
 */
visflow.viewManager.tip = function(text, csspara) {
  // csspara is the css object to define the tip's position, style, etc
  if (csspara == null)
    // by default show at mouse cursor
    csspara = {
      left: visflow.interactionManager.currentMouseX + 5,
      top: visflow.interactionManager.currentMouseY + 5
    };

  $('<div></div>')
    .addClass('tip-mouse ui-tooltip ui-tooltip-content')
    .text(text)
    .css(csspara)
    .appendTo('body')
    .delay(1000)
    .animate({
      opacity: 0
    }, 500, function() {
      $(this).remove();
    });
};

/**
 * Checks if two rectangular boxes intersect.
 */
visflow.viewManager.intersectBox = function(box1, box2) {
  var x1l = box1.left,
      x1r = box1.left + box1.width,
      y1l = box1.top,
      y1r = box1.top + box1.height;
  var x2l = box2.left,
      x2r = box2.left + box2.width,
      y2l = box2.top,
      y2r = box2.top + box2.height;
  return x1l <= x2r && x2l <= x1r && y1l <= y2r && y2l <= y1r;
};

/**
 * Displays the 'about visflow' dialog.
 */
visflow.viewManager.aboutVisFlow = function() {
  var dialog = $('<div></div>')
    .css('padding', '20px')
    .dialog({
      modal: true,
      title: 'About Dataflow',
      buttons: {
        OK: function() {
          $(this).dialog('close');
        }
      }
    });
  $('<p>Dataflow Visualization Builder</p>' +
      '<p>Preliminary Version, Bowen Yu, March 2015</p>')
    .appendTo(dialog);
};

/**
 * Opens a page for VisFlow help.
 */
visflow.viewManager.helpVisFlow = function() {
  window.open('help.html');
};
