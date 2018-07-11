import injectNodeTemplate from '@/components/node/template';

describe('inject node template', () => {
  const check = (injected: string) => {
    expect(injected.match(/<div ref="node"[\s\S]*test-nc[\s\S]*<\/div><\!--node-->/)).not.toBe(null);
    expect(injected.match(/<context-menu[\s\S]*test-cm[\s\S]*<\/context-menu>/)).not.toBe(null);
    expect(injected.match(/<option-panel[\s\S]*test-op[\s\S]*<\/option-panel>/)).not.toBe(null);
  };

  it('standard order', () => {
    const testHtml =
`<!-- node-content -->
test-nc
<!-- context-menu -->
test-cm
<!-- option-panel -->
test-op
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
`;
    const injected = injectNodeTemplate(testHtml);
    check(injected);
  });
});
