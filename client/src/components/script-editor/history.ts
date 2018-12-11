import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import ScriptEditor from './script-editor';

enum ScriptEditorEventType {
  EDIT_SCRIPT = 'setCode',
  TOGGLE_RENDERING_ENABLED = 'setRenderingEnabled',
  TOGGLE_STATE_ENABLED = 'setStateEnabled',
  INPUT_DISPLAY_TITLE = 'setDisplayTitle',
  CLEAR_STATE = 'setState',
}

export const editScriptEvent = (node: ScriptEditor, code: string, prevCode: string): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScriptEditorEventType.EDIT_SCRIPT,
    'edit script',
    node,
    node.setCode,
    code,
    prevCode,
  );
};

export const toggleRenderingEnabledEvent = (node: ScriptEditor, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScriptEditorEventType.TOGGLE_RENDERING_ENABLED,
    'toggle rendering',
    node,
    node.setRenderingEnabled,
    value,
    !value,
  );
};

export const toggleStateEnabledEvent = (node: ScriptEditor, value: boolean): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScriptEditorEventType.TOGGLE_STATE_ENABLED,
    'toggle stateful',
    node,
    node.setStateEnabled,
    value,
    !value,
  );
};

export const clearStateEvent = (node: ScriptEditor, prevState: object): HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScriptEditorEventType.CLEAR_STATE,
    'clear state',
    node,
    node.setState,
    {},
    prevState,
  );
};

export const inputDisplayTitleEvent = (node: ScriptEditor, title: string, prevTitle: string):
  HistoryNodeOptionEvent => {
  return nodeOptionEvent(
    ScriptEditorEventType.INPUT_DISPLAY_TITLE,
    'input display title',
    node,
    node.setDisplayTitle,
    title,
    prevTitle,
  );
};
