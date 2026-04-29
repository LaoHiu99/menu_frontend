// pages/recipe/index.js
const api = require('../../utils/api');

let searchTimer = null;

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
    cartList: [],
    categories: [],
    contentList: []
  },
  onChange(event) {
    this.setData({
      activeKey: event.detail
    });
  },
  onLoad() {
    console.log('菜谱页面加载');
    this.computeCartTotal();
    this.fetchCategories();
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
    this.fetchCategories();
  },

  async fetchCategories() {
    try {
      const categories = await api.get('/category');
      
      const formattedCategories = categories
        .filter(cat => cat.status === 1)
        .map((cat, index) => ({
          id: index,
          categoryId: cat.id,
          title: cat.title
        }));
      
      const formattedContentList = categories
        .filter(cat => cat.status === 1)
        .map((cat, index) => ({
          id: index,
          items: (cat.dishes || [])
            .filter(dish => dish.status === 1)
            .map(dish => ({
              id: dish.id,
              categoryId: dish.categoryId,
              name: dish.name,
              description: dish.description || '美味佳肴，不容错过',
              price: dish.price || 0,
              imageUrl: dish.imageUrl || '/images/icons/header.jpg'
            }))
        }));
      
      this.setData({
        categories: formattedCategories,
        contentList: formattedContentList,
        activeKey: 0
      });
    } catch (error) {
      console.error('获取分类失败:', error);
      wx.showToast({
        title: '加载失败，请重试',
        icon: 'none'
      });
    }
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
          
          const item = this.data.contentList[this.data.activeKey].items[index];
          
          const existingItem = this.data.cartList.find(cartItem => cartItem.id === item.id);
          if (existingItem) {
            const cartList = this.data.cartList.map(cartItem => 
              cartItem.id === item.id ? { ...cartItem, count: cartItem.count + 1 } : cartItem
            );
            this.setData({ cartList });
          } else {
            const newItem = {
              id: item.id,
              name: item.name,
              price: item.price,
              count: 1,
              image: item.imageUrl || '/images/icons/header.jpg'
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

    if (searchTimer) {
      clearTimeout(searchTimer);
    }

    searchTimer = setTimeout(() => {
      this.searchFromServer(keyword);
    }, 500);
  },

  onSearch() {
    const keyword = this.data.searchKeyword.trim();
    if (!keyword) {
      this.setData({ isSearching: false, searchResults: [] });
      return;
    }

    this.searchFromServer(keyword);
  },

  async searchFromServer(keyword) {
    try {
      const dishes = await api.get('/dish/search', { keyword });
      
      const results = dishes
        .filter(dish => dish.status === 1)
        .map((dish, index) => ({
          id: dish.id,
          categoryId: dish.categoryId,
          name: dish.name,
          description: dish.description || '美味佳肴，不容错过',
          price: dish.price || 0,
          imageUrl: dish.imageUrl || '/images/icons/header.jpg',
          categoryIndex: dish.categoryId || 0,
          itemIndex: index,
          categoryTitle: this.getCategoryTitleById(dish.categoryId)
        }));

      this.setData({
        isSearching: true,
        searchResults: results
      });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({
        isSearching: true,
        searchResults: []
      });
    }
  },

  getCategoryTitleById(categoryId) {
    const category = this.data.categories.find(cat => cat.categoryId === categoryId);
    return category ? category.title : '其他';
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
          
          const item = this.data.contentList[categoryIndex].items[itemIndex];
          
          const existingItem = this.data.cartList.find(cartItem => cartItem.id === item.id);
          if (existingItem) {
            const cartList = this.data.cartList.map(cartItem => 
              cartItem.id === item.id ? { ...cartItem, count: cartItem.count + 1 } : cartItem
            );
            this.setData({ cartList });
          } else {
            const newItem = {
              id: item.id,
              name: item.name,
              price: item.price,
              count: 1,
              image: item.imageUrl || '/images/icons/header.jpg'
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