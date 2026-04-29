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
      orders: 0,
      pendingOrders: 0,
      completedOrders: 0,
      coupons: 3,
      points: 580,
      favorites: 8
    },
    friendStats: {
      friendCount: 0,
      requestCount: 0
    },
    friendRequests: [],
    friendList: [],
    friendIdInput: '',
    showAddFriendModal: false,
    showFriendRequestsModal: false,
    showFriendListModal: false,
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
      this.fetchFriendStats(userInfo.userId);
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
      
      const orderCount = profile.orderCount || { pending: 0, completed: 0, total: 0 };
      
      this.setData({
        'userInfo.name': profile.nickname || '微信用户',
        'userInfo.avatar': profile.avatarUrl || '/images/avator.png',
        'userInfo.userId': profile.userId,
        'userInfo.signature': profile.signature || '这个人很懒，什么都没留下~',
        'stats.orders': orderCount.total,
        'stats.pendingOrders': orderCount.pending,
        'stats.completedOrders': orderCount.completed
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

  onTapPendingOrders() {
  },

  onTapCompletedOrders() {
  },

  onTapTotalOrders() {
  },

  onCopyUserId() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    
    wx.setClipboardData({
      data: this.data.userInfo.userId,
      success: () => {
        wx.showToast({
          title: 'ID已复制',
          icon: 'success'
        });
      }
    });
  },

  async fetchFriendStats(userId) {
    if (!userId) return;
    
    try {
      const requests = await api.get(`/friend/requests/${userId}`);
      const friends = await api.get(`/friend/list/${userId}`);
      
      this.setData({
        'friendStats.requestCount': requests.length || 0,
        'friendStats.friendCount': friends.length || 0
      });
    } catch (error) {
      console.error('获取好友统计失败:', error);
    }
  },

  onTapAddFriend() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    this.setData({
      showAddFriendModal: true,
      friendIdInput: ''
    });
  },

  onCloseAddFriendModal() {
    this.setData({ showAddFriendModal: false });
  },

  onFriendIdInput(e) {
    this.setData({ friendIdInput: e.detail.value });
  },

  async onSendFriendRequest() {
    if (!this.data.friendIdInput.trim()) {
      wx.showToast({
        title: '请输入好友ID',
        icon: 'none'
      });
      return;
    }

    if (this.data.friendIdInput === this.data.userInfo.userId) {
      wx.showToast({
        title: '不能添加自己为好友',
        icon: 'none'
      });
      return;
    }

    try {
      await api.post('/friend/request', {
        userId: this.data.userInfo.userId,
        friendUserId: this.data.friendIdInput
      });

      wx.showToast({
        title: '好友请求已发送',
        icon: 'success'
      });

      this.setData({
        showAddFriendModal: false,
        friendIdInput: ''
      });

      this.fetchFriendStats(this.data.userInfo.userId);
    } catch (error) {
      console.error('发送好友请求失败:', error);
      wx.showToast({
        title: error.message || '发送失败，请重试',
        icon: 'none'
      });
    }
  },

  onTapFriendRequests() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    this.fetchFriendRequests();
    this.setData({ showFriendRequestsModal: true });
  },

  onCloseFriendRequestsModal() {
    this.setData({ showFriendRequestsModal: false });
  },

  async fetchFriendRequests() {
    try {
      const requests = await api.get(`/friend/requests/${this.data.userInfo.userId}`);
      this.setData({ friendRequests: requests || [] });
    } catch (error) {
      console.error('获取好友请求失败:', error);
      wx.showToast({
        title: '获取好友请求失败',
        icon: 'none'
      });
    }
  },

  async onAcceptFriendRequest(e) {
    const id = e.currentTarget.dataset.id;
    
    try {
      await api.put(`/friend/request/${id}/accept`, null, {
        params: { userId: this.data.userInfo.userId }
      });

      wx.showToast({
        title: '已接受好友请求',
        icon: 'success'
      });

      this.fetchFriendRequests();
      this.fetchFriendStats(this.data.userInfo.userId);
    } catch (error) {
      console.error('接受好友请求失败:', error);
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  async onRejectFriendRequest(e) {
    const id = e.currentTarget.dataset.id;
    
    try {
      await api.put(`/friend/request/${id}/reject`, null, {
        params: { userId: this.data.userInfo.userId }
      });

      wx.showToast({
        title: '已拒绝好友请求',
        icon: 'success'
      });

      this.fetchFriendRequests();
      this.fetchFriendStats(this.data.userInfo.userId);
    } catch (error) {
      console.error('拒绝好友请求失败:', error);
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  onTapFriendList() {
    if (!this.data.isLogin) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }
    this.fetchFriendList();
    this.setData({ showFriendListModal: true });
  },

  onCloseFriendListModal() {
    this.setData({ showFriendListModal: false });
  },

  async fetchFriendList() {
    try {
      const friends = await api.get(`/friend/list/${this.data.userInfo.userId}`);
      this.setData({ friendList: friends || [] });
    } catch (error) {
      console.error('获取好友列表失败:', error);
      wx.showToast({
        title: '获取好友列表失败',
        icon: 'none'
      });
    }
  },

  async onDeleteFriend(e) {
    const friendId = e.currentTarget.dataset.friendid;
    
    wx.showModal({
      title: '提示',
      content: '确定要删除该好友吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.delete(`/friend/${friendId}`, {
              params: { userId: this.data.userInfo.userId }
            });

            wx.showToast({
              title: '已删除好友',
              icon: 'success'
            });

            this.fetchFriendList();
            this.fetchFriendStats(this.data.userInfo.userId);
          } catch (error) {
            console.error('删除好友失败:', error);
            wx.showToast({
              title: error.message || '操作失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  stopPropagation() {
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
          
          this.setData({
            'stats.orders': 0,
            'stats.pendingOrders': 0,
            'stats.completedOrders': 0,
            'friendStats.friendCount': 0,
            'friendStats.requestCount': 0
          });
          
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
