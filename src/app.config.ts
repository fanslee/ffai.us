export default defineAppConfig({
  pages: [
    'pages/home/index',
    'pages/panda/index',
    'pages/feed/index',
    'pages/market/index',
    'pages/friends/index',
    'pages/shop/index',
    'pages/wallet/index',
    'pages/orders/index',
    'pages/account/index',
    'pages/account/reset/index',
    'pages/account/verify/index'
  ],
  tabBar: {
    list: [
      { pagePath: 'pages/home/index', text: '首页' },
      { pagePath: 'pages/panda/index', text: '熊猫' },
      { pagePath: 'pages/feed/index', text: '喂养' },
      { pagePath: 'pages/market/index', text: '市场' },
      { pagePath: 'pages/friends/index', text: '好友' },
      { pagePath: 'pages/shop/index', text: '皮肤' },
      { pagePath: 'pages/wallet/index', text: '钱包' },
      { pagePath: 'pages/account/index', text: '账户' }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: 'Cute Panda Party',
    navigationBarTextStyle: 'black'
  }
})
