const { setNavHeightToPage } = require('../../utils/navHeight.js');
const api = require('../../utils/api');

Page({
  data: {
    cartList: [],
    remark: '',
    totalAmount: 0,
    navBarHeight: 0,
    capsuleTop: 0,
    capsuleHeight: 0
  },

  onLoad(options) {
    setNavHeightToPage(this);
    
    const cartList = wx.getStorageSync('pendingCartList');
    if (cartList && cartList.length > 0) {
      this.setData({ cartList });
      this.calculateTotal(cartList);
      wx.removeStorageSync('pendingCartList');
    }
  },

  calculateTotal(cartList) {
    const totalAmount = cartList.reduce((sum, item) => sum + (item.price * item.count), 0);
    this.setData({ totalAmount: totalAmount.toFixed(2) });
  },

  onGoBack() {
    const pages = getCurrentPages();
    if (pages.length > 1) {
      wx.navigateBack({
        delta: 1
      });
    } else {
      wx.reLaunch({
        url: '/pages/recipe/index'
      });
    }
  },

  onRemarkInput(e) {
    this.setData({ remark: e.detail.value });
  },

  async onSubmitOrder() {
    if (!this.data.cartList || this.data.cartList.length === 0) {
      wx.showToast({
        title: '请选择商品',
        icon: 'none'
      });
      return;
    }

    const userInfo = wx.getStorageSync('userInfo');
    if (!userInfo || !userInfo.userId) {
      wx.showToast({
        title: '请先登录',
        icon: 'none'
      });
      return;
    }

    const items = this.data.cartList.map(item => ({
      dishId: item.id,
      quantity: item.count,
      price: item.price
    }));

    const totalAmount = this.data.cartList.reduce((sum, item) => sum + (item.price * item.count), 0);

    const orderData = {
      userId: userInfo.userId,
      items: items,
      totalAmount: totalAmount,
      remark: this.data.remark
    };

    wx.showLoading({
      title: '提交中...'
    });

    try {
      await api.post('/order', orderData);

      wx.hideLoading();
      wx.showToast({
        title: '下单成功',
        icon: 'success'
      });

      wx.setStorageSync('orderSubmitted', true);

      setTimeout(() => {
        wx.reLaunch({
          url: '/pages/order/index'
        });
      }, 1500);
    } catch (error) {
      wx.hideLoading();
      console.error('下单失败:', error);
      wx.showToast({
        title: error.message || '下单失败，请重试',
        icon: 'none'
      });
    }
  }
});