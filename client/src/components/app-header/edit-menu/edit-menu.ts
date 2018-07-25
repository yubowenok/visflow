import { Vue, Component } from 'vue-property-decorator';

import ns from '@/store/namespaces';

@Component
export default class EditMenu extends Vue {
  @ns.history.Getter('undoMessage') private undoMessage!: string;
  @ns.history.Getter('redoMessage') private redoMessage!: string;
  @ns.history.Mutation('undo') private undo!: () => void;
  @ns.history.Mutation('redo') private redo!: () => void;
}
