// pages/my/index.js
const { setNavHeightToPage } = require('../../utils/navHeight.js');
const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      name: '未登录',
      avatar: '/images/avator.png',
      userId: '点击头像登录'
    },
    isLogin: false,
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
    this.loadUserInfo();
  },

  onShow() {
    setNavHeightToPage(this);
    this.loadUserInfo();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    console.log(userInfo,'userInfo');
    
    const token = wx.getStorageSync('token');
    
    if (userInfo && token) {
      this.setData({
        'userInfo.name': userInfo.nickname || '小白',
        'userInfo.avatar': userInfo.avatarUrl || '/images/avator.png',
        'userInfo.userId': userInfo.userId,
        'userInfo.signature': userInfo.signature || '这个人很懒，什么都没留下~',
        isLogin: true
      });
      
      this.fetchUserProfile(userInfo.userId);
    } else {
      this.setData({
        'userInfo.name': '未登录',
        'userInfo.avatar': '/images/avator.png',
        'userInfo.userId': '点击头像登录',
        'userInfo.signature': '',
        isLogin: false
      });
    }
  },

  async fetchUserProfile(userId) {
    try {
      const profile = await api.get(`/user/profile/${userId}`);
      
      this.setData({
        'userInfo.name': profile.nickname || '微信用户',
        'userInfo.avatar': profile.avatarUrl || '/images/avator.png',
        'userInfo.userId': profile.userId,
        'userInfo.signature': profile.signature || '这个人很懒，什么都没留下~'
      });
      
      wx.setStorageSync('userInfo', {
        userId: profile.userId,
        nickname: profile.nickname,
        avatarUrl: profile.avatarUrl,
        signature: profile.signature
      });
    } catch (error) {
      console.error('获取用户详情失败:', error);
    }
  },

  onChooseAvatar(e) {
    const avatarUrl = e.detail.avatarUrl;
    this.setData({ 'userInfo.avatar': avatarUrl });
    this.doLogin();
  },

  async doLogin() {
    wx.showLoading({
      title: '登录中...'
    });

    try {
      const loginRes = await this.wxLogin();
      
      const result = await api.post('/user/login', {
        code: loginRes.code,
        nickname: this.data.userInfo.name === '未登录' ? '微信用户' : this.data.userInfo.name,
        avatarUrl: this.data.userInfo.avatar
      });

      wx.setStorageSync('token', result.token);
      wx.setStorageSync('userInfo', result.user);

      const app = getApp();
      app.setLoginInfo(result.token, result.user);

      this.setData({
        'userInfo.name': result.user.nickname,
        'userInfo.avatar': result.user.avatarUrl,
        'userInfo.userId': result.user.userId,
        'userInfo.signature': result.user.signature || '这个人很懒，什么都没留下~',
        isLogin: true
      });

      this.fetchUserProfile(result.user.userId);

      wx.hideLoading();

      wx.showToast({
        title: '登录成功',
        icon: 'success'
      });

    } catch (error) {
      wx.hideLoading();
      console.error('登录失败:', error);
      wx.showToast({
        title: error.message || '登录失败，请重试',
        icon: 'none'
      });
    }
  },

  wxLogin() {
    return new Promise((resolve, reject) => {
      wx.login({
        success: (res) => {
          if (res.code) {
            resolve(res);
          } else {
            reject(new Error('获取登录凭证失败'));
          }
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
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
    
    if (id === 1) {
      const token = wx.getStorageSync('token');
      if (!token) {
        wx.showToast({
          title: '请先登录',
          icon: 'none'
        });
        return;
      }
      wx.navigateTo({
        url: '/pages/profile/index'
      });
    } else {
      wx.showToast({
        title: '功能开发中 🐾',
        icon: 'none'
      });
    }
  },

  onLogout() {
    wx.showModal({
      title: '提示',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#8b6f47',
      success: (res) => {
        if (res.confirm) {
          const app = getApp();
          app.logout();
          this.loadUserInfo();
          wx.showToast({
            title: '已退出 🐾',
            icon: 'success'
          });
        }
      }
    });
  }
});
