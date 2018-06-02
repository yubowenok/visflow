import Vue from 'vue';

import DiagramMenu from './diagram-menu/diagram-menu';
import EditMenu from './edit-menu/edit-menu';
import OptionsMenu from './options-menu/options-menu';
import HelpMenu from './help-menu/help-menu';

export default Vue.extend({
  name: 'app-header',
  components: {
    DiagramMenu,
    EditMenu,
    OptionsMenu,
    HelpMenu,
  },
});
