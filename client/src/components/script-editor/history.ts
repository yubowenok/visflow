import { HistoryNodeOptionEvent, nodeOptionEvent } from '@/store/history/types';
import ScriptEditor from './script-editor';

enum ScriptEditorEventType {
  EDIT_SCRIPT = 'edit-script',
  TOGGLE_RENDERING_ENABLED = 'toggle-rendering-enabled',
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
