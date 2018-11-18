import { Component } from 'vue-property-decorator';

import template from './player.html';
import { injectNodeTemplate } from '../node';
import { SubsetNode } from '../subset-node';

interface PlayerSave {
  column: number | null;
  currentValue: number | string | null;
}

@Component({
  template: injectNodeTemplate(template),
})
export default class Player extends SubsetNode {
  protected NODE_TYPE = 'player';
  protected DEFAULT_HEIGHT = 35;

  private column: number | null = null;
  private isPlaying = false;
  private currentValue: number | string | null = null;

  protected created() {
    this.serializationChain.push((): PlayerSave => ({
      column: this.column,
      currentValue: this.currentValue,
    }));
  }

  protected update() {

  }

  private play() {
    this.isPlaying = true;
  }

  private pause() {
    this.isPlaying = false;
  }

  private stop() {
    this.isPlaying = false;
  }
}
