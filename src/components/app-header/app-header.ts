import { Component, Vue } from 'vue-property-decorator';

import DiagramMenu from './diagram-menu/diagram-menu';
import EditMenu from './edit-menu/edit-menu';
import OptionsMenu from './options-menu/options-menu';
import HelpMenu from './help-menu/help-menu';
import UserBar from '../user-bar/user-bar';
import DatasetBar from '../dataset-bar/dataset-bar';
import DragBar from '../drag-bar/drag-bar';

@Component({
  components: {
    DiagramMenu,
    EditMenu,
    OptionsMenu,
    HelpMenu,
    UserBar,
    DatasetBar,
    DragBar,
  },
})
export default class AppHeader extends Vue {
}
