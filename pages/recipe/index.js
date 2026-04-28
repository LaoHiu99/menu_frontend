// pages/recipe/index.js
Page({
  data: {
    showCartPopup: false,
    activeKey: 0,
    showFlyBall: false,
    flyAnimation: null,
    flyBallStartX: 0,
    flyBallStartY: 0,
    cartTotalCount: 0,
    searchKeyword: '',
    isSearching: false,
    searchResults: [],
    cartList: [
      // { id: 1, name: '宫保鸡丁', price: 38, count: 1, image: '/images/icons/header.jpg' },
      // { id: 2, name: '鱼香肉丝', price: 32, count: 2, image: '/images/icons/header.jpg' },
      // { id: 3, name: '鱼香肉丝', price: 32, count: 2, image: '/images/icons/header.jpg' },
      // { id: 4, name: '鱼香肉丝', price: 32, count: 2, image: '/images/icons/header.jpg' }
    ],
    categories: [
      { id: 0, title: '热销推荐' },
      { id: 1, title: '经典川菜' },
      { id: 2, title: '家常热菜' },
      { id: 3, title: '海鲜水产' },
      { id: 4, title: '素食小炒' },
      { id: 5, title: '主食米饭' },
      { id: 6, title: '面食点心' },
      { id: 7, title: '包点蒸品' },
      { id: 8, title: '早餐早点' },
      { id: 9, title: '饮品酒水' },
      { id: 10, title: '甜品烘焙' },
      { id: 11, title: '冰品冷饮' },
      { id: 12, title: '健康轻食' }
    ],
    contentList: [
      { id: 0, items: ['宫保鸡丁', '鱼香肉丝', '糖醋排骨'] },
      { id: 1, items: ['麻婆豆腐', '回锅肉', '水煮鱼'] },
      { id: 2, items: ['红烧肉', '东坡肉', '梅菜扣肉'] },
      { id: 3, items: ['清蒸鲈鱼', '红烧带鱼', '糖醋鲤鱼'] },
      { id: 4, items: ['炒时蔬', '凉拌黄瓜', '蒜蓉西兰花'] },
      { id: 5, items: ['蛋炒饭', '扬州炒饭', '煲仔饭'] },
      { id: 6, items: ['牛肉面', '炸酱面', '担担面'] },
      { id: 7, items: ['小笼包', '饺子', '馄饨'] },
      { id: 8, items: ['豆浆', '油条', '包子'] },
      { id: 9, items: ['奶茶', '果汁', '可乐'] },
      { id: 10, items: ['蛋糕', '蛋挞', '布丁'] },
      { id: 11, items: ['冰淇淋', '雪糕', '冰沙'] },
      { id: 12, items: ['水果拼盘', '沙拉'] }
    ]
  },
  onChange(event) {
    this.setData({
      activeKey: event.detail
    });
  },
  onLoad() {
    console.log('菜谱页面加载');
    this.computeCartTotal();
  },
  onShow() {
    const orderSubmitted = wx.getStorageSync('orderSubmitted');
    if (orderSubmitted) {
      this.setData({
        cartList: [],
        cartTotalCount: 0
      });
      wx.removeStorageSync('orderSubmitted');
    }
    this.computeCartTotal();
  },

  onPullDownRefresh () {
    console.log(1111);
  },
  onOpenCartPopup() {
    this.setData({ showCartPopup: true });
  },

  onCloseCartPopup() {
    this.setData({ showCartPopup: false });
  },

  computeCartTotal() {
    const cartTotalCount = this.data.cartList.reduce((sum, item) => sum + item.count, 0);
    this.setData({ cartTotalCount });
  },

  onClearCart() {
    this.setData({ cartList: [], cartTotalCount: 0 });
  },

  onReduce(e) {
    const id = e.currentTarget.dataset.id;
    const cartList = this.data.cartList.map(item => {
      if (item.id === id) {
        return { ...item, count: Math.max(0, item.count - 1) };
      }
      return item;
    }).filter(item => item.count > 0);
    this.setData({ cartList });
    this.computeCartTotal();
  },

  onAdd(e) {
    const id = e.currentTarget.dataset.id;
    const cartList = this.data.cartList.map(item => {
      if (item.id === id) {
        return { ...item, count: item.count + 1 };
      }
      return item;
    });
    this.setData({ cartList });
    this.computeCartTotal();
  },

  onAddToCart(e) {
    const index = e.currentTarget.dataset.index;
    const addId = `#add-${this.data.activeKey}-${index}`;
    const query = wx.createSelectorQuery();
    
    query.select(addId).boundingClientRect();
    query.select('.cart-box').boundingClientRect();
    
    query.exec((res) => {
      if (res[0] && res[1]) {
        const startPoint = res[0];
        const endPoint = res[1];
        
        const startX = startPoint.left + startPoint.width / 2;
        const startY = startPoint.top + startPoint.height / 2;
        const endX = endPoint.left + endPoint.width / 2;
        const endY = endPoint.top + endPoint.height / 2;
        
        const translateX = endX - startX;
        const translateY = endY - startY;
        
        this.setData({ 
          showFlyBall: true,
          flyBallStartX: startX,
          flyBallStartY: startY,
          flyAnimation: null
        });
        
        setTimeout(() => {
          const animation = wx.createAnimation({
            duration: 600,
            timingFunction: 'ease-in',
          });
          
          animation.translateX(translateX).translateY(translateY).scale(0.3).step();
          
          this.setData({ flyAnimation: animation.export() });
        }, 50);
        
        setTimeout(() => {
          this.setData({ showFlyBall: false });
          
          const itemName = this.data.contentList[this.data.activeKey].items[index];
          
          const existingItem = this.data.cartList.find(item => item.name === itemName);
          if (existingItem) {
            const cartList = this.data.cartList.map(item => 
              item.name === itemName ? { ...item, count: item.count + 1 } : item
            );
            this.setData({ cartList });
          } else {
            const newItem = {
              id: Date.now(),
              name: itemName,
              price: 0,
              count: 1,
              image: '/images/icons/header.jpg'
            };
            const cartList = [...this.data.cartList, newItem];
            this.setData({ cartList });
          }
          this.computeCartTotal();
        }, 1000);
      }
    });
  },

  onSearchInput(e) {
    const keyword = e.detail.value.trim();
    this.setData({ searchKeyword: keyword });
    
    if (!keyword) {
      this.setData({
        isSearching: false,
        searchResults: [],
        activeKey: 0
      });
      return;
    }

    const results = [];
    this.data.contentList.forEach((category, categoryIndex) => {
      category.items.forEach((item, itemIndex) => {
        if (item.toLowerCase().includes(keyword.toLowerCase())) {
          results.push({
            name: item,
            categoryIndex: categoryIndex,
            itemIndex: itemIndex,
            categoryTitle: category.title
          });
        }
      });
    });

    this.setData({
      isSearching: true,
      searchResults: results
    });
  },

  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      this.setData({ isSearching: false, searchResults: [] });
      return;
    }

    const results = [];
    this.data.contentList.forEach((category, categoryIndex) => {
      category.items.forEach((item, itemIndex) => {
        if (item.toLowerCase().includes(keyword.toLowerCase())) {
          results.push({
            name: item,
            categoryIndex: categoryIndex,
            itemIndex: itemIndex,
            categoryTitle: category.title
          });
        }
      });
    });

    this.setData({
      isSearching: true,
      searchResults: results
    });
  },

  onClearSearch() {
    this.setData({
      searchKeyword: '',
      isSearching: false,
      searchResults: [],
      activeKey: 0
    });
  },

  onAddSearchResultToCart(e) {
    const { index, categoryIndex, itemIndex } = e.currentTarget.dataset;
    const addId = `#add-search-${index}`;
    const query = wx.createSelectorQuery();
    
    query.select(addId).boundingClientRect();
    query.select('.cart-box').boundingClientRect();
    
    query.exec((res) => {
      if (res[0] && res[1]) {
        const startPoint = res[0];
        const endPoint = res[1];
        
        const startX = startPoint.left + startPoint.width / 2;
        const startY = startPoint.top + startPoint.height / 2;
        const endX = endPoint.left + endPoint.width / 2;
        const endY = endPoint.top + endPoint.height / 2;
        
        const translateX = endX - startX;
        const translateY = endY - startY;
        
        this.setData({ 
          showFlyBall: true,
          flyBallStartX: startX,
          flyBallStartY: startY,
          flyAnimation: null
        });
        
        setTimeout(() => {
          const animation = wx.createAnimation({
            duration: 600,
            timingFunction: 'ease-in',
          });
          
          animation.translateX(translateX).translateY(translateY).scale(0.3).step();
          
          this.setData({ flyAnimation: animation.export() });
        }, 50);
        
        setTimeout(() => {
          this.setData({ showFlyBall: false });
          
          const itemName = this.data.contentList[categoryIndex].items[itemIndex];
          
          const existingItem = this.data.cartList.find(item => item.name === itemName);
          if (existingItem) {
            const cartList = this.data.cartList.map(item => 
              item.name === itemName ? { ...item, count: item.count + 1 } : item
            );
            this.setData({ cartList });
          } else {
            const newItem = {
              id: Date.now(),
              name: itemName,
              price: 0,
              count: 1,
              image: '/images/icons/header.jpg'
            };
            const cartList = [...this.data.cartList, newItem];
            this.setData({ cartList });
          }
          this.computeCartTotal();
        }, 1000);
      }
    });
  },

  onGoToOrderConfirm() {
    if (this.data.cartTotalCount === 0) {
      wx.showToast({
        title: '请先选择商品',
        icon: 'none'
      });
      return;
    }

    wx.setStorageSync('pendingCartList', this.data.cartList);
    
    wx.navigateTo({
      url: '/pages/order-confirm/index'
    });
  },

  refreshData() {
    // 模拟异步请求
    setTimeout(() => {
      // 刷新数据...

      // 停止下拉刷新动画（必须调用）
      wx.stopPullDownRefresh();
    }, 4000);
  }
})