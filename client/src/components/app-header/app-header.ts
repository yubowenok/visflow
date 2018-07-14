import { Component, Vue } from 'vue-property-decorator';

import DiagramMenu from '@/components/app-header/diagram-menu/diagram-menu';
import EditMenu from '@/components/app-header/edit-menu/edit-menu';
import OptionsMenu from '@/components/app-header/options-menu/options-menu';
import HelpMenu from '@/components/app-header/help-menu/help-menu';
import UserBar from '@/components/user-bar/user-bar';
import DiagramBar from '@/components/diagram-bar/diagram-bar';
import DatasetBar from '@/components/dataset-bar/dataset-bar';
import DragBar from '@/components/drag-bar/drag-bar';

@Component({
  components: {
    DiagramMenu,
    EditMenu,
    OptionsMenu,
    HelpMenu,
    UserBar,
    DiagramBar,
    DatasetBar,
    DragBar,
  },
})
export default class AppHeader extends Vue {
}
