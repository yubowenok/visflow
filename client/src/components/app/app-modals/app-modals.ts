/**
 * @fileOverview Provides a wrapper to include all global modals.
 */
import { Vue, Component } from 'vue-property-decorator';

import NewDiagramModal from '@/components/modals/new-diagram-modal/new-diagram-modal';
import SaveAsDiagramModal from '@/components/modals/save-as-diagram-modal/save-as-diagram-modal';
import LoadDiagramModal from '@/components/modals/load-diagram-modal/load-diagram-modal';
import LoginModal from '@/components/modals/login-modal/login-modal';
import SignupModal from '@/components/modals/signup-modal/signup-modal';
import ProfileModal from '@/components/modals/profile-modal/profile-modal';
import PasswordModal from '@/components/modals/password-modal/password-modal';
import MessageModal from '@/components/modals/message-modal/message-modal';
import ProgressModal from '@/components/modals/progress-modal/progress-modal';
import ExperimentModal from '@/components/modals/experiment-modal/experiment-modal';

@Component({
  components: {
    NewDiagramModal,
    SaveAsDiagramModal,
    LoadDiagramModal,
    LoginModal,
    SignupModal,
    ProfileModal,
    PasswordModal,
    MessageModal,
    ProgressModal,
    ExperimentModal,
  },
})
export default class AppModals extends Vue {
}
