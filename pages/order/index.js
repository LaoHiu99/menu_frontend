const { setNavHeightToPage } = require('../../utils/navHeight.js');
const api = require('../../utils/api');

Page({
  data: {
    activeTab: 0,
    orders: [],
    unfinishedCount: 0,
    currentOrders: [],
    statusBarHeight: 0,
    navBarHeight: 0,
    capsuleHeight: 0,
    capsuleTop: 0,
    capsuleBottom: 0,
    safeAreaTop: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0,
    total: 0,
    loading: false,
    hasMore: true,
    showBackToTop: false
  },

  onLoad(options) {
    setNavHeightToPage(this);
    this.initPage(0);
  },

  onShow() {
    setNavHeightToPage(this);

    const savedTab = wx.getStorageSync('orderTab');
    if (savedTab === 0 || savedTab === 1) {
      this.initPage(savedTab);
      wx.removeStorageSync('orderTab');
    }
  },

  onPageScroll(e) {
    const showBackToTop = e.scrollTop > 300;
    if (showBackToTop !== this.data.showBackToTop) {
      this.setData({ showBackToTop: showBackToTop });
    }
  },

  // 初始化页面数据
  initPage(tab = 0) {
    this._fetchOrdersLocked = false;
    this.setData({
      activeTab: tab,
      page: 1,
      orders: [],
      currentOrders: [],
      hasMore: true,
      loading: false
    });
    this.fetchOrders();
  },

  async fetchOrders() {
    if (this._fetchOrdersLocked) {
      return;
    }
    if (!this.data.hasMore && this.data.page > 1) {
      return;
    }

    this._fetchOrdersLocked = true;
    this.setData({ loading: true });

    try {
      const userInfo = wx.getStorageSync('userInfo');
      if (!userInfo || !userInfo.userId) {
        this.setData({ loading: false });
        return;
      }

      const requestPage = this.data.page;
      const status = this.data.activeTab === 0 ? 0 : 1;
      const result = await api.get(`/order/user/${userInfo.userId}`, {
        status: status,
        page: requestPage,
        pageSize: this.data.pageSize,
        includeFriends: true
      });

      const formattedOrders = result.list.map(order => ({
        id: order.id,
        orderNo: order.orderNo,
        username: order.username,
        avatar: api.resolveMediaUrl(order.avatar),
        totalAmount: order.totalAmount,
        remark: order.remark,
        status: order.status === 0 ? '未完成' : '已完成',
        time: this.formatTime(order.createdAt),
        goods: order.items.map(item => ({
          id: item.id,
          name: item.dishName,
          image: item.dishImage || '/images/icons/header.jpg',
          count: item.count,
          price: item.price,
          subtotal: item.subtotal
        }))
      }));

      const newOrders =
        requestPage === 1
          ? formattedOrders
          : [...this.data.orders, ...formattedOrders];

      this.setData({
        orders: newOrders,
        currentOrders: newOrders,
        total: result.total,
        totalPages: result.totalPages,
        hasMore: requestPage < result.totalPages,
        loading: false
      });

      if (this.data.activeTab === 0) {
        this.setData({
          unfinishedCount: result.total
        });
      }
      
      // 数据加载完成后，重新计算布局（确保新数据渲染后高度正确）
      setTimeout(() => {
        this.calculateLayout();
      }, 100);
      
    } catch (error) {
      console.error('获取订单失败:', error);
      this.setData({ loading: false });
    } finally {
      this._fetchOrdersLocked = false;
    }
  },

  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    if (this.data.activeTab === tab) return;
    
    // 切换标签页时重置所有状态并重新加载
    this.initPage(tab);
    
    // 切换后重新计算布局
    setTimeout(() => {
      this.calculateLayout();
    }, 100);
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.setData({
        page: this.data.page + 1
      });
      this.fetchOrders();
    }
  },

  async onCancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.put(`/order/${id}/status`, {
              status: 2
            });
            wx.showToast({
              title: '订单已取消',
              icon: 'success'
            });
            // 刷新当前标签页数据
            this.initPage(this.data.activeTab);
            // 刷新后重新计算布局
            setTimeout(() => {
              this.calculateLayout();
            }, 100);
          } catch (error) {
            console.error('取消订单失败:', error);
            wx.showToast({
              title: error.message || '取消失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  async onCompleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    try {
      await api.put(`/order/${id}/status`, {
        status: 1
      });
      wx.showToast({
        title: '订单已完成',
        icon: 'success'
      });
      // 刷新当前标签页数据
      this.initPage(this.data.activeTab);
      // 刷新后重新计算布局
      setTimeout(() => {
        this.calculateLayout();
      }, 100);
    } catch (error) {
      console.error('完成订单失败:', error);
      wx.showToast({
        title: error.message || '操作失败，请重试',
        icon: 'none'
      });
    }
  },

  async onDeleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除该订单吗？',
      success: async (res) => {
        if (res.confirm) {
          try {
            await api.delete(`/order/${id}`);
            wx.showToast({
              title: '订单已删除',
              icon: 'success'
            });
            // 刷新当前标签页数据
            this.initPage(this.data.activeTab);
            // 刷新后重新计算布局
            setTimeout(() => {
              this.calculateLayout();
            }, 100);
          } catch (error) {
            console.error('删除订单失败:', error);
            wx.showToast({
              title: error.message || '删除失败，请重试',
              icon: 'none'
            });
          }
        }
      }
    });
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  },

  onBackToTop() {
    wx.pageScrollTo({
      scrollTop: 0,
      duration: 300
    });
  }
});