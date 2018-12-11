import { Component } from 'vue-property-decorator';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import SubsetNodeCommon from './subset-node-common';

@Component
export default class SubsetNode extends SubsetNodeCommon {
  // Overwrite port typings
  protected inputPortMap: { [id: string]: SubsetInputPort } = {};
  protected outputPortMap: { [id: string]: SubsetOutputPort } = {};
}
