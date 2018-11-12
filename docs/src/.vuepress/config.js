module.exports = {
  dest: './dist',
  title: 'VisFlow',
  description: 'Dataflow Framework for Visual Data Exploration',
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['link', { rel: 'stylesheet', href: 'https://use.fontawesome.com/releases/v5.2.0/css/all.css' }]
  ],
  themeConfig: {
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Get Started', link: '/get-started/' },
      {
        text: 'Dataflow',
        items: [
          { text: 'Dataflow Model', link: '/dataflow/subsetflow' },
          { text: 'Interaction', link: '/dataflow/interaction' },
        ],
      },
      { text: 'Node Types', link: '/node/' },
      { text: 'FlowSense', link: '/flowsense/' }
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
            '/dataflow/port',
            '/dataflow/subsetflow',
            '/dataflow/interaction',
          ],
        },
        '/node/',
        '/flowsense/',
        '/shortcut/',
      ],
    }
  }
}
