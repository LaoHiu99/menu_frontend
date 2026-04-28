const { setNavHeightToPage } = require('../../utils/navHeight.js');

Page({
  data: {
    activeTab: 0,
    orders: [],
    unfinishedCount: 0,
    statusBarHeight: 0,
    navBarHeight: 0,
    capsuleHeight: 0,
    capsuleTop: 0,
    capsuleBottom: 0,
    safeAreaTop: 0
  },

  onLoad(options) {
    setNavHeightToPage(this);
    
    if (options.orderData) {
      const orderData = JSON.parse(decodeURIComponent(options.orderData));
      this.addOrder(orderData);
    }
    
    const orders = wx.getStorageSync('orders') || [];
    this.setData({ orders });
    this.updateOrders();
  },

  onShow() {
    setNavHeightToPage(this);
    
    const pendingOrder = wx.getStorageSync('pendingOrder');
    if (pendingOrder) {
      this.addOrder(pendingOrder);
      wx.removeStorageSync('pendingOrder');
    }
    
    const orders = wx.getStorageSync('orders') || [];
    this.setData({ orders });
    this.updateOrders();
  },

  addOrder(orderData) {
    const orders = wx.getStorageSync('orders') || [];
    
    const newOrder = {
      id: Date.now(),
      username: '用户' + Math.floor(Math.random() * 1000),
      avatar: '/images/icons/avator.jpg',
      goods: orderData.cartList,
      remark: orderData.remark,
      time: this.formatTime(orderData.createTime),
      status: '未完成'
    };
    
    orders.unshift(newOrder);
    wx.setStorageSync('orders', orders);
    this.setData({ orders });
    this.updateOrders();
  },

  onTabChange(e) {
    const tab = parseInt(e.currentTarget.dataset.tab);
    this.setData({ activeTab: tab });
    this.updateOrders();
  },

  updateOrders() {
    const { activeTab, orders } = this.data;
    const unfinishedCount = orders.filter(o => o.status === '未完成').length;
    
    let currentOrders = [];
    if (activeTab === 0) {
      currentOrders = orders.filter(o => o.status === '未完成');
    } else {
      currentOrders = orders.filter(o => o.status === '已完成');
    }
    
    this.setData({ currentOrders, unfinishedCount });
  },

  onCancelOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要取消该订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteOrder(id);
          wx.showToast({
            title: '订单已取消',
            icon: 'success'
          });
        }
      }
    });
  },

  onCompleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    const orders = this.data.orders.map(order => {
      if (order.id === id) {
        return { ...order, status: '已完成' };
      }
      return order;
    });
    
    wx.setStorageSync('orders', orders);
    this.setData({ orders });
    this.updateOrders();
    
    wx.showToast({
      title: '订单已完成',
      icon: 'success'
    });
  },

  onDeleteOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '提示',
      content: '确定要删除该订单吗？',
      success: (res) => {
        if (res.confirm) {
          this.deleteOrder(id);
          wx.showToast({
            title: '订单已删除',
            icon: 'success'
          });
        }
      }
    });
  },

  deleteOrder(id) {
    const orders = this.data.orders.filter(order => order.id !== id);
    wx.setStorageSync('orders', orders);
    this.setData({ orders });
    this.updateOrders();
  },

  formatTime(timestamp) {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hour}:${minute}`;
  }
});