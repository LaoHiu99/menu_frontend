// pages/my/index.js
const { setNavHeightToPage } = require('../../utils/navHeight.js');

Page({
  data: {
    userInfo: {
      name: '线条小狗',
      avatar: '',
      userId: 'DOG20260428'
    },
    stats: {
      orders: 12,
      coupons: 3,
      points: 580,
      favorites: 8
    },
    menuItems: [
      { id: 1, name: '个人信息', icon: '🐾' },
      { id: 7, name: '关于我们', icon: '🥰' },
      { id: 8, name: '设置', icon: '⚙️' }
    ],
    dailyQuote: '每一天都要开开心心的~',
    statusBarHeight: 0,
    navBarHeight: 0,
    capsuleHeight: 0,
    capsuleTop: 0,
    capsuleBottom: 0,
    safeAreaTop: 0
  },

  onLoad() {
    setNavHeightToPage(this);
    this.updateDailyQuote();
  },

  onShow() {
    setNavHeightToPage(this);
  },

  updateDailyQuote() {
    const quotes = [
      '每一天都要开开心心的~',
      '做最真实的自己就好~',
      '生活就像散步，慢慢走也能看到好风景~',
      '最好的时光，就是和喜欢的人在一起~',
      '就算下雨天，也要保持好心情呀~',
      '世界很大，但最温暖的地方是家~',
      '不用追求完美，简单就是幸福~'
    ];
    const today = new Date().getDate();
    this.setData({ dailyQuote: quotes[today % quotes.length] });
  },

  onTapMenu(e) {
    const id = e.currentTarget.dataset.id;
    wx.showToast({
      title: '功能开发中 🐾',
      icon: 'none'
    });
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#8b6f47',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({
            title: '已退出 🐾',
            icon: 'success'
          });
        }
      }
    });
  }
});
