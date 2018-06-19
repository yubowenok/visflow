import { Component, Vue } from 'vue-property-decorator';

import DiagramMenu from './diagram-menu/diagram-menu';
import EditMenu from './edit-menu/edit-menu';
import OptionsMenu from './options-menu/options-menu';
import HelpMenu from './help-menu/help-menu';
import UserBar from '../user-bar/user-bar';

@Component({
  components: {
    DiagramMenu,
    EditMenu,
    OptionsMenu,
    HelpMenu,
    UserBar,
  },
})
export default class AppHeader extends Vue {
}
