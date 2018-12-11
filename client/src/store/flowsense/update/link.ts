import * as util from './util';
import { InjectedQuery, QuerySource, QueryTarget } from '../helper';
import { QueryValue, LinkSpecification } from '../types';
import FlowsenseUpdateTracker from './tracker';
import { Node } from '@/components/node';
import Edge from '@/components/edge/edge';
import { SubsetNode } from '@/components/subset-node';
import Linker from '@/components/linker/linker';


/**
 * Links two sources.
 */
export const linkNodes = (tracker: FlowsenseUpdateTracker, value: QueryValue, query: InjectedQuery,
                          sources: QuerySource[], targets: QueryTarget[]) => {
  if (!sources.length) {
    tracker.cancel('cannot create linker without source node');
    return;
  }
  const spec = value.link as LinkSpecification;
  if (sources.length === 1) {
    // If there is only one source, it is the source to be filtered. Insert a source to be extracted.
    const focused = util.focusNode();
    if (!focused) {
      tracker.cancel('cannot create linker without source node');
      return;
    }
    sources = ([{
      node: focused,
      port: (focused as SubsetNode).getSubsetOutputPort(),
    }] as QuerySource[]).concat(sources);
  } else { // sources.length === 2
    if (spec.filterColumn === undefined) {
      spec.filterColumn = spec.extractColumn;
    }
  }
  const sourceNode = sources[0].node;
  const sourcePort = sources[0].port;

  const nodeSave: { extractColumn?: number, filterColumn?: number } = {};

  let extractColumn: number | null = null;
  if (spec.extractColumn !== undefined) {
    extractColumn = util.getColumnMarkerIndex(query, sourceNode as SubsetNode, spec.extractColumn);
    if (extractColumn === null) {
      const columnName = util.ejectMappableMarker(spec.extractColumn, query.markerMapping).value[0];
      tracker.cancel(`extract column "${columnName}" does not exist on source node ${sourceNode.getLabel()}`);
      return;
    }
    nodeSave.extractColumn = extractColumn;
  }
  let filterColumn: number | null = null;
  if (spec.filterColumn !== undefined) {
    if (!sources[1]) {
      tracker.cancel('cannot find source node to be filtered');
      return;
    }
    const filteredSourceNode = sources[1].node;
    filterColumn = util.getColumnMarkerIndex(query, filteredSourceNode as SubsetNode, spec.filterColumn);
    if (filterColumn === null) {
      const columnName = util.ejectMappableMarker(spec.filterColumn, query.markerMapping).value[0];
      tracker.cancel(`filter column "${columnName}" does not exist on source node ${filteredSourceNode.getLabel()}`);
      return;
    }
    nodeSave.filterColumn = filterColumn;
  }

  const propagateSources: Node[] = [];
  const linker = util.createNode(util.getCreateNodeOptions('linker'), nodeSave) as Linker;
  tracker.createNode(linker);

  if (extractColumn !== null) {
    const edgeFromExtractSource = util.createEdge(sourcePort, linker.getSubsetInputPort(), false) as Edge;
    tracker.createEdge(edgeFromExtractSource);

    propagateSources.push(sourceNode);
  }
  if (filterColumn !== null) {
    const filteredSourcePort = sources[1].port;
    const edgeFromFilterSource = util.createEdge(filteredSourcePort, linker.getInputPort('filteredIn'), false) as Edge;
    tracker.createEdge(edgeFromFilterSource);

    propagateSources.push(sources[1].node);
  }

  util.propagateNodes(propagateSources);
  tracker.toAutoLayout(util.getNearbyNodes(linker));
};
