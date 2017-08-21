/**
 * Matching threshold for dataset names. This is looser than the regular
 * threshold.
 * @private @const {number}
 */
visflow.nlp.MATCH_THRESHOLD_DATASET_ = .4;


/**
 * Matches the dataName against the list of available datasets.
 * @param {string} dataName
 * @param {function(?visflow.data.Info)} callback Callback function with data
 *     info. This is called with null if no data matches.
 * @private
 */
visflow.nlp.matchDataset_ = function(dataName, callback) {
  visflow.data.listData(function(dataList) {
    var matched = false;
    for (var i = 0; i < dataList.length; i++) {
      var data = dataList[i];
      if (visflow.nlp.match(data.name, dataName,
          visflow.nlp.MATCH_THRESHOLD_DATASET_)) {
        callback(data);
        matched = true;
        return;
      }
      if (visflow.nlp.match(data.file, dataName,
          visflow.nlp.MATCH_THRESHOLD_DATASET_)) {
        callback(data);
        matched = true;
        return;
      }
    }
    if (!matched) {
      callback(null);
    }
  });
};


/**
 * Builds a data source that loads the data.
 * @param {!Array<visflow.nlp.CommandToken>} commands
 */
visflow.nlp.load = function(commands) {
  if (commands[0].token != visflow.nlp.Keyword.LOAD) {
    console.error('not a load command');
    return;
  }
  _.popFront(commands);
  var dataName = _.reduce(commands, function(prev, now) {
    return (prev ? prev + ' ' : '') + now.token;
  }, '');

  // Use last selected node to be the default target
  var target = visflow.flow.lastSelectedNode;

  visflow.nlp.matchDataset_(dataName, function(dataInfo) {
    if (dataInfo == null) {
      visflow.warning('no data with name "' + dataName + '" found');
      return;
    }

    /** @type {visflow.data.Info} */
    var info = /** @type {visflow.data.Info} */(
      _.extend(_.pick(dataInfo, 'id', 'name', 'file'), {isServerData: true}));

    if (target == null || !target.IS_DATASOURCE) {
      visflow.nlp.createNodes([{
        type: 'dataSource',
        x: visflow.interaction.mouseX,
        y: visflow.interaction.mouseY
      }], function(nodes) {
        var dataSource = _.first(nodes);
        dataSource.setData(info);
      });
    } else {
      /** @type {!visflow.DataSource} */(target).setData(info);
    }
  });
};
