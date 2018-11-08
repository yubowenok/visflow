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
          { text: 'Dataflow Model', link: '/dataflow/' },
          { text: 'Node Types', link: '/node/' },
        ],
      },
      { text: 'FlowSense', link: '/flowsense/' }
    ],
    sidebar: [
      '/',
      '/get-started/',
      '/dataflow/',
      '/flowsense/',
      '/node/',
      '/shortcut/',
    ]
  }
}
