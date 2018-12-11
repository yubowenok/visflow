import injectNodeTemplate from '@/components/node/template';

describe('inject node template', () => {
  const check = (injected: string) => {
    expect(injected.match(/<div ref="node"[\s\S]*test-nc[\s\S]*<\/div><\!--node-->/)).not.toBe(null);
    expect(injected.match(/<context-menu[\s\S]*test-cm[\s\S]*<\/context-menu>/)).not.toBe(null);
    expect(injected.match(/<option-panel[\s\S]*test-op[\s\S]*<\/option-panel>/)).not.toBe(null);
    expect(injected.match(/<base-modal[\s\S]*test-sm[\s\S]*<\/base-modal>/)).not.toBe(null);
  };

  it('standard order', () => {
    const testHtml =
`<!-- node-content -->
test-nc
<!-- context-menu -->
test-cm
<!-- option-panel -->
test-op
<!-- settings-modal -->
test-sm
`;
    const injected = injectNodeTemplate(testHtml);
    check(injected);
  });

  it('shuffled order', () => {
    const testHtml =
`<!-- context-menu -->
test-cm
<!-- option-panel -->
test-op
<!-- settings-modal -->
test-sm
<!-- node-content -->
test-nc
`;
    const injected = injectNodeTemplate(testHtml);
    check(injected);
  });

  it('random spaces and order', () => {
    const testHtml =
`   <!--node-content -->
test-nc
<!--   option-panel-->
test-op
   <!--context-menu-->` + '   ' + `
test-cm
<!-- settings-modal  -->
  test-sm
`;
    const injected = injectNodeTemplate(testHtml);
    check(injected);
  });
});
