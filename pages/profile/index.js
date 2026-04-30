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
    pendingAvatarTempPath: '',
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
      'userInfo.avatar': api.resolveMediaUrl(userInfo.avatarUrl),
      'userInfo.signature': userInfo.signature || '',
      'userInfo.userId': userInfo.userId,
      originalData: {
        name: userInfo.nickname || '微信用户',
        avatar: api.resolveMediaUrl(userInfo.avatarUrl),
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
        'userInfo.avatar': api.resolveMediaUrl(profile.avatarUrl),
        'userInfo.signature': profile.signature || '',
        originalData: {
          name: profile.nickname || '微信用户',
          avatar: api.resolveMediaUrl(profile.avatarUrl),
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

  onChooseAvatar(e) {
    const url = e.detail.avatarUrl;
    this.setData({
      pendingAvatarTempPath: url,
      'userInfo.avatar': url,
      hasChange: true
    });
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
    const trimmedName = (name || '').trim();
    const trimmedSig = (signature || '').trim();

    if (!trimmedName) {
      wx.showToast({
        title: '昵称不能为空',
        icon: 'none'
      });
      return;
    }

    if (trimmedName.length > 10) {
      wx.showToast({
        title: '昵称最多10个字符',
        icon: 'none'
      });
      return;
    }

    if (trimmedSig.length > 50) {
      wx.showToast({
        title: '个性签名最多50个字符',
        icon: 'none'
      });
      return;
    }

    wx.showLoading({
      title: '保存中...'
    });

    try {
      if (this.data.pendingAvatarTempPath) {
        await api.uploadFile({
          url: '/user/avatar',
          filePath: this.data.pendingAvatarTempPath
        });
      }

      await api.put(`/user/profile/${userId}`, {
        nickname: trimmedName,
        signature: trimmedSig
      });

      const userInfo = wx.getStorageSync('userInfo');
      wx.setStorageSync('userInfo', {
        ...userInfo,
        nickname: trimmedName,
        signature: trimmedSig
      });

      await this.fetchUserProfile(userId);

      this.setData({
        pendingAvatarTempPath: '',
        originalData: {
          name: trimmedName,
          avatar: this.data.userInfo.avatar,
          signature: trimmedSig
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
