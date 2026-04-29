// pages/profile/index.js
const { setNavHeightToPage } = require('../../utils/navHeight.js');
const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      name: '',
      avatar: '/images/avator.png',
      signature: '',
      userId: ''
    },
    hasChange: false,
    originalData: {},
    statusBarHeight: 0,
    navBarHeight: 0,
    capsuleHeight: 0,
    capsuleTop: 0,
    capsuleBottom: 0,
    safeAreaTop: 0
  },

  onLoad() {
    setNavHeightToPage(this);
    this.loadUserInfo();
  },

  onBack() {
    wx.navigateBack();
  },

  loadUserInfo() {
    const userInfo = wx.getStorageSync('userInfo');
    const token = wx.getStorageSync('token');

    if (!userInfo || !token) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
      return;
    }

    this.setData({
      'userInfo.name': userInfo.nickname || '微信用户',
      'userInfo.avatar': userInfo.avatarUrl || '/images/avator.png',
      'userInfo.signature': userInfo.signature || '',
      'userInfo.userId': userInfo.userId,
      originalData: {
        name: userInfo.nickname || '微信用户',
        avatar: userInfo.avatarUrl || '/images/avator.png',
        signature: userInfo.signature || ''
      }
    });

    this.fetchUserProfile(userInfo.userId);
  },

  async fetchUserProfile(userId) {
    try {
      const profile = await api.get(`/user/profile/${userId}`);

      this.setData({
        'userInfo.name': profile.nickname || '微信用户',
        'userInfo.avatar': profile.avatarUrl || '/images/avator.png',
        'userInfo.signature': profile.signature || '',
        originalData: {
          name: profile.nickname || '微信用户',
          avatar: profile.avatarUrl || '/images/avator.png',
          signature: profile.signature || ''
        }
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

  onNameInput(e) {
    this.setData({
      'userInfo.name': e.detail.value,
      hasChange: true
    });
  },

  onSignatureInput(e) {
    this.setData({
      'userInfo.signature': e.detail.value,
      hasChange: true
    });
  },

  async onSave() {
    const { name, signature, userId } = this.data.userInfo;

    if (!name || name.trim() === '') {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    try {
      await api.put(`/user/profile/${userId}`, {
        nickname: name.trim(),
        signature: signature.trim()
      });

      const userInfo = wx.getStorageSync('userInfo');
      wx.setStorageSync('userInfo', {
        ...userInfo,
        nickname: name.trim(),
        signature: signature.trim()
      });

      this.setData({
        originalData: {
          name: name.trim(),
          avatar: this.data.userInfo.avatar,
          signature: signature.trim()
        },
        hasChange: false
      });

      wx.hideLoading();
      wx.showToast({
        title: '保存成功',
        icon: 'success'
      });

      setTimeout(() => {
        wx.navigateBack();
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      console.error('保存失败:', error);
      wx.showToast({
        title: error.message || '保存失败，请重试',
        icon: 'none'
      });
    }
  }
});
