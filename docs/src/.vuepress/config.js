module.exports = {
  dest: './dist',
  title: 'VisFlow',
  description: 'Web-Based Dataflow Framework for Visual Data Exploration',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
  ],
  themeConfig: {
    logo: '/logo.png',
    nav: [
      { text: 'Get Started', link: '/get-started/' },
      {
        text: 'Dataflow',
        items: [
          { text: 'Dataflow Diagram', link: '/dataflow/diagram' },
          { text: 'Subset Flow', link: '/dataflow/subsetflow' },
          { text: 'Visualization', link: '/dataflow/visualization' },
          { text: 'Edit and Interaction', link: '/dataflow/interaction' },
          { text: 'VisMode Dashboard', link: '/dataflow/vismode' },
          { text: 'Linking', link: '/dataflow/linking' },
          { text: 'Shortcut', link: '/shortcut/' },
        ],
      },
      { text: 'Node Types', link: '/node/' },
      { text: 'FlowSense', link: '/flowsense/' },
      { text: 'Demo', link: 'https://visflow.org/demo/' },
    ],
    sidebar: {
      '/node/': [
        '/node/data-source',
        {
          title: 'Visualization',
          collapsable: false,
          children: [
            '/node/visualization/table',
            '/node/visualization/scatterplot',
            '/node/visualization/parallel-coordinates',
            '/node/visualization/histogram',
            '/node/visualization/heatmap',
            '/node/visualization/line-chart',
            '/node/visualization/network',
            '/node/visualization/map',
          ],
        },
        '/node/attribute-filter',
        '/node/visual-editor',
        '/node/set-operator',
        '/node/constants-generator',
        '/node/linker',
      ],
      '/': [
        '/',
        '/get-started/',
        {
          title: 'Dataflow',
          children: [
            '/dataflow/diagram',
            '/dataflow/subsetflow',
            '/dataflow/visualization',
            '/dataflow/interaction',
            '/dataflow/vismode',
            '/dataflow/linking',
          ],
        },
        '/node/',
        '/flowsense/',
        '/shortcut/',
      ],
    }
  }
}
