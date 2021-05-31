import HtmlFormatter from './html';
export { showUnchanged, hideUnchanged } from './html';

export class HtmlExFormatter extends HtmlFormatter {
  rootBegin(context, type, nodeType) {
    if (type === 'node') {this.parentPath = []}
    super.rootBegin(context, type, nodeType)
  }

  nodeBegin(context, key, leftKey, type, nodeType) {
    if (nodeType) this.parentPath.push(key);
    const nodeClass = `jsondiffpatch-${type}${
      nodeType ? ` jsondiffpatch-child-node-type-${nodeType}` : ''
    }`;
    const vIsTargetKey = !nodeType && type !== 'unchanged' && type !== 'movedestination' && type !== 'unknown';
    const vKeyPath = vIsTargetKey ? [...this.parentPath, key].join('.') : '';
    const vCheckbox = vIsTargetKey ?
      `<input type="checkbox" id="jsondiffpatchCB-${vKeyPath}"> ` : '';
    context.out(
      `<li class="${nodeClass}" data-key="${leftKey}">` +
        `<div class="jsondiffpatch-property-name">${vCheckbox}${leftKey}</div>`
    );
  }

  nodeEnd(context, key, leftKey, type, nodeType) {
    if (nodeType) this.parentPath.pop();
    context.out('</li>');
  }
}

export default HtmlExFormatter;

let defaultInstance;

export function format(delta, left) {
  if (!defaultInstance) {
    defaultInstance = new HtmlExFormatter();
  }
  return defaultInstance.format(delta, left);
}
