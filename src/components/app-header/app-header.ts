import { Component, Vue } from 'vue-property-decorator';

import DiagramMenu from './diagram-menu/diagram-menu';
import EditMenu from './edit-menu/edit-menu';
import OptionsMenu from './options-menu/options-menu';
import HelpMenu from './help-menu/help-menu';
import UserBar from '../user-bar/user-bar';
import DatasetBar from '../dataset-bar/dataset-bar';
import DragBar from '../drag-bar/drag-bar';
import NewDiagramModal from '../modals/new-diagram-modal/new-diagram-modal';
import SaveAsDiagramModal from '../modals/save-as-diagram-modal/save-as-diagram-modal';
import LoadDiagramModal from '../modals/load-diagram-modal/load-diagram-modal';

@Component({
  components: {
    DiagramMenu,
    EditMenu,
    OptionsMenu,
    HelpMenu,
    UserBar,
    DatasetBar,
    DragBar,
    NewDiagramModal,
    SaveAsDiagramModal,
    LoadDiagramModal,
  },
})
export default class AppHeader extends Vue {
}
