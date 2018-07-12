import { Component, Vue } from 'vue-property-decorator';

import DiagramMenu from '@/components/app-header/diagram-menu/diagram-menu';
import EditMenu from '@/components/app-header/edit-menu/edit-menu';
import OptionsMenu from '@/components/app-header/options-menu/options-menu';
import HelpMenu from '@/components/app-header/help-menu/help-menu';
import UserBar from '@/components/user-bar/user-bar';
import DiagramBar from '@/components/diagram-bar/diagram-bar';
import DatasetBar from '@/components/dataset-bar/dataset-bar';
import DragBar from '@/components/drag-bar/drag-bar';
import NewDiagramModal from '@/components/modals/new-diagram-modal/new-diagram-modal';
import SaveAsDiagramModal from '@/components/modals/save-as-diagram-modal/save-as-diagram-modal';
import LoadDiagramModal from '@/components/modals/load-diagram-modal/load-diagram-modal';
import LoginModal from '@/components/modals/login-modal/login-modal';
import SignupModal from '@/components/modals/signup-modal/signup-modal';
import ProfileModal from '@/components/modals/profile-modal/profile-modal';

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
    NewDiagramModal,
    SaveAsDiagramModal,
    LoadDiagramModal,
    LoginModal,
    SignupModal,
    ProfileModal,
  },
})
export default class AppHeader extends Vue {
}
