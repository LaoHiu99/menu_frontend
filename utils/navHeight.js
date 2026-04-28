// utils/navHeight.js

/**
 * 计算完整的导航栏和胶囊按钮高度信息
 * @returns {Object} 导航栏相关高度信息
 *   - statusBarHeight: 状态栏高度
 *   - navBarHeight: 自定义导航栏总高度（从状态栏顶部到胶囊底部）
 *   - capsuleHeight: 胶囊按钮自身高度
 *   - capsuleWidth: 胶囊按钮自身宽度
 *   - capsuleTop: 胶囊按钮距离屏幕顶部距离（包含状态栏）
 *   - capsuleBottom: 胶囊按钮底部距离屏幕顶部距离
 *   - capsuleRight: 胶囊按钮距离屏幕右侧距离
 *   - navContentHeight: 导航栏内容区域高度（状态栏底部到胶囊底部）
 *   - safeAreaTop: 安全区域顶部高度（胶囊底部 + 10px，用于内容内边距）
 */
function calculateNavHeight() {
  const systemInfo = wx.getSystemInfoSync();
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();

  const statusBarHeight = systemInfo.statusBarHeight;
  const capsuleHeight = menuButtonInfo.height;
  const capsuleWidth = menuButtonInfo.width;
  const capsuleTop = menuButtonInfo.top;
  const capsuleBottom = menuButtonInfo.bottom;
  const capsuleRight = menuButtonInfo.right;
  
  // 自定义导航栏总高度（从屏幕顶部到胶囊底部）
  const navBarHeight = capsuleBottom;
  
  // 导航栏内容区域高度（状态栏底部到胶囊底部）
  const navContentHeight = capsuleBottom - statusBarHeight;
  
  // 安全区域顶部高度（用于内容内边距，避免被导航栏遮挡）
  const safeAreaTop = capsuleBottom + 10;

  return {
    statusBarHeight,
    navBarHeight,
    capsuleHeight,
    capsuleWidth,
    capsuleTop,
    capsuleBottom,
    capsuleRight,
    navContentHeight,
    safeAreaTop
  };
}

/**
 * 将导航栏高度信息设置到页面 data 中
 * @param {Object} pageInstance - 页面实例 (this)
 * @param {Function} callback - 可选的回调函数
 */
function setNavHeightToPage(pageInstance, callback) {
  const navInfo = calculateNavHeight();

  pageInstance.setData(navInfo, () => {
    if (typeof callback === 'function') {
      callback(navInfo);
    }
  });
}

/**
 * 仅计算胶囊按钮自身信息（不含状态栏和导航栏）
 * @returns {Object} 胶囊按钮基本信息
 *   - height: 胶囊按钮高度
 *   - width: 胶囊按钮宽度
 *   - top: 胶囊顶部距离屏幕顶部距离
 *   - bottom: 胶囊底部距离屏幕顶部距离
 *   - right: 胶囊右侧距离屏幕左侧距离
 */
function calculateCapsuleInfo() {
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  
  return {
    height: menuButtonInfo.height,
    width: menuButtonInfo.width,
    top: menuButtonInfo.top,
    bottom: menuButtonInfo.bottom,
    right: menuButtonInfo.right
  };
}

/**
 * 将胶囊按钮信息设置到页面 data 中
 * @param {Object} pageInstance - 页面实例 (this)
 * @param {Function} callback - 可选的回调函数
 */
function setCapsuleInfoToPage(pageInstance, callback) {
  const capsuleInfo = calculateCapsuleInfo();

  pageInstance.setData({
    capsuleInfo: capsuleInfo
  }, () => {
    if (typeof callback === 'function') {
      callback(capsuleInfo);
    }
  });
}

/**
 * 获取自定义导航栏的左右内边距（用于对齐胶囊按钮）
 * @returns {Object} 内边距信息
 *   - left: 左侧内边距（胶囊按钮右侧距离屏幕右侧的距离，保证内容对称）
 *   - right: 右侧内边距（胶囊按钮右侧距离屏幕右侧的距离）
 */
function getNavPadding() {
  const systemInfo = wx.getSystemInfoSync();
  const menuButtonInfo = wx.getMenuButtonBoundingClientRect();
  
  const screenWidth = systemInfo.windowWidth;
  const capsuleRight = menuButtonInfo.right;
  const paddingRight = screenWidth - capsuleRight;
  
  return {
    left: paddingRight,  // 左右对称，左侧使用相同的内边距
    right: paddingRight
  };
}

module.exports = {
  calculateNavHeight,
  setNavHeightToPage,
  calculateCapsuleInfo,
  setCapsuleInfoToPage,
  getNavPadding
};