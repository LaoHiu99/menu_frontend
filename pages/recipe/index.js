// pages/recipe/index.js
const api = require('../../utils/api');

let searchTimer = null;

/** 将接口返回的一级/二级类目整理为侧边栏分组 + 左侧叶子序列（与菜品列表对齐） */
function buildSidebarLayout(enabledCats) {
  const enabledIds = new Set(enabledCats.map((c) => c.id));
  const sortPair = (a, b) => (a.sortOrder ?? a.id) - (b.sortOrder ?? b.id);

  const roots = enabledCats
    .filter((c) => !c.parentId || !enabledIds.has(c.parentId))
    .sort(sortPair);

  const sidebarGroups = [];
  /** @type {{ id: number; categoryId: number; title: string; groupTitle: string }[]} */
  const formattedCategories = [];

  roots.forEach((root) => {
    const children = enabledCats
      .filter((c) => c.parentId === root.id)
      .sort(sortPair);

    if (children.length > 0) {
      const tabs = children.map((child) => {
        const flatIndex = formattedCategories.length;
        formattedCategories.push({
          id: flatIndex,
          categoryId: child.id,
          title: child.title,
          groupTitle: root.title
        });
        return { title: child.title, flatIndex };
      });
      sidebarGroups.push({
        groupTitle: root.title,
        tabs,
        groupKey: `group-${root.id}`,
        expandable: true,
        expanded: true
      });
    } else {
      const flatIndex = formattedCategories.length;
      formattedCategories.push({
        id: flatIndex,
        categoryId: root.id,
        title: root.title,
        groupTitle: ''
      });
      sidebarGroups.push({
        groupTitle: '',
        tabs: [{ title: root.title, flatIndex }],
        groupKey: `group-${root.id}`,
        expandable: false,
        expanded: true
      });
    }
  });

  return { sidebarGroups, formattedCategories };
}

Page({
  data: {
    showCartPopup: false,
    activeKey: 0,
    /** 左侧多级分组：[{ groupTitle, tabs:[{title, flatIndex}]}] */
    sidebarGroups: [],
    searchLoading: false,
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
    contentList: [],
    loading: false
  },
  onSidebarLeafTap(e) {
    const flatIndex = Number(e.currentTarget.dataset.flatIndex);
    if (Number.isNaN(flatIndex)) {
      return;
    }
    this.setData({
      activeKey: flatIndex
    });
  },

  /** 一级分组（如奶茶）收起 / 展开子品牌 */
  onSidebarGroupTap(e) {
    const groupKey = e.currentTarget.dataset.groupKey;
    if (!groupKey) {
      return;
    }
    const sidebarGroups = this.data.sidebarGroups.map((g) => {
      if (g.groupKey !== groupKey || !g.expandable) {
        return g;
      }
      return { ...g, expanded: !g.expanded };
    });
    this.setData({ sidebarGroups });
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
    this.setData({ loading: true });
    
    try {
      const categories = await api.get('/category');
      
      const enabled = categories.filter((cat) => cat.status === 1);
      const { sidebarGroups, formattedCategories } = buildSidebarLayout(enabled);

      const formattedContentList = formattedCategories.map((leaf, index) => {
        const src = enabled.find((c) => c.id === leaf.categoryId);
        const items =
          src && Array.isArray(src.dishes)
            ? src.dishes
                .filter((dish) => dish.status === 1)
                .map((dish) => ({
                  id: dish.id,
                  categoryId: dish.categoryId,
                  name: dish.name,
                  description: dish.description || '美味佳肴，不容错过',
                  price: dish.price || 0,
                  imageUrl: dish.imageUrl || '/images/icons/header.jpg'
                }))
            : [];
        return { id: index, items };
      });
      
      this.setData({
        sidebarGroups,
        categories: formattedCategories,
        contentList: formattedContentList,
        activeKey: 0,
        loading: false
      });
    } catch (error) {
      console.error('获取分类失败:', error);
      this.setData({ loading: false });
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
    this.setData({ searchLoading: true });
    
    try {
      const dishes = await api.get('/dish/search', { keyword });
      
      const leafIndexByCat = {};
      (this.data.categories || []).forEach((c, idx) => {
        leafIndexByCat[c.categoryId] = idx;
      });

      const results = dishes
        .filter((dish) => dish.status === 1)
        .map((dish) => {
          const leafIdx = leafIndexByCat[dish.categoryId];
          const items = leafIdx !== undefined ? this.data.contentList[leafIdx]?.items || [] : [];
          const itemIndex = items.findIndex((it) => it.id === dish.id);
          return {
            id: dish.id,
            categoryId: dish.categoryId,
            name: dish.name,
            description: dish.description || '美味佳肴，不容错过',
            price: dish.price || 0,
            imageUrl: dish.imageUrl || '/images/icons/header.jpg',
            leafIndex: leafIdx,
            itemIndex: itemIndex >= 0 ? itemIndex : 0,
            categoryTitle: this.getCategoryTitleById(dish.categoryId)
          };
        });

      this.setData({
        isSearching: true,
        searchResults: results,
        searchLoading: false
      });
    } catch (error) {
      console.error('搜索失败:', error);
      this.setData({
        isSearching: true,
        searchResults: [],
        searchLoading: false
      });
    }
  },

  getCategoryTitleById(categoryId) {
    const category = this.data.categories.find((cat) => cat.categoryId === categoryId);
    if (!category) {
      return '其他';
    }
    return category.groupTitle ? `${category.groupTitle} · ${category.title}` : category.title;
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
    const { index, leafIndex } = e.currentTarget.dataset;
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

          const row = this.data.searchResults[index];
          if (!row) {
            return;
          }
          const li = leafIndex !== undefined && leafIndex !== '' ? Number(leafIndex) : NaN;
          let resolvedItem = null;
          if (!Number.isNaN(li) && this.data.contentList[li]) {
            resolvedItem =
              this.data.contentList[li].items.find((it) => it.id === row.id) || null;
          }
          if (!resolvedItem) {
            resolvedItem = {
              id: row.id,
              name: row.name,
              price: row.price,
              imageUrl: row.imageUrl
            };
          }

          const existingItem = this.data.cartList.find((cartItem) => cartItem.id === resolvedItem.id);
          if (existingItem) {
            const cartList = this.data.cartList.map((cartItem) =>
              cartItem.id === resolvedItem.id ? { ...cartItem, count: cartItem.count + 1 } : cartItem
            );
            this.setData({ cartList });
          } else {
            const newItem = {
              id: resolvedItem.id,
              name: resolvedItem.name,
              price: resolvedItem.price,
              count: 1,
              image: resolvedItem.imageUrl || '/images/icons/header.jpg'
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