import { Component } from 'vue-property-decorator';
import { SubsetInputPort, SubsetOutputPort } from '@/components/port';
import SubsetNodeBase from './subset-node-base';

@Component
export default class SubsetNode extends SubsetNodeBase {
  // Overwrite port typings
  protected inputPortMap: { [id: string]: SubsetInputPort } = {};
  protected outputPortMap: { [id: string]: SubsetOutputPort } = {};
}
