// tslint:disable
import $ from 'jquery';

// Must use require to make sure $ is loaded before importing jqueryui.
// Otherwise this may trigger "jQuery is node defined" in tests.
(global as any).jQuery = $;
require('jqueryui');
