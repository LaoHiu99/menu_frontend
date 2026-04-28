const { setNavHeightToPage } = require('../../utils/navHeight.js');

Page({
  data: {
    cartList: [],
    remark: '',
    navBarHeight: 0,
    capsuleTop: 0,
    capsuleHeight: 0
  },

  onLoad(options) {
    setNavHeightToPage(this);
    
    const cartList = wx.getStorageSync('pendingCartList');
    if (cartList && cartList.length > 0) {
      this.setData({ cartList });
      wx.removeStorageSync('pendingCartList');
    }
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

  onSubmitOrder() {
    const orderData = {
      cartList: this.data.cartList,
      remark: this.data.remark,
      createTime: new Date().getTime()
    };

    wx.setStorageSync('pendingOrder', orderData);

    wx.reLaunch({
      url: '/pages/order/index'
    });
  }
});