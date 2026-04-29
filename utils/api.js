const BASE_URL = 'http://192.168.1.5:3000';

function buildUrl(url, params) {
  if (!params || Object.keys(params).length === 0) {
    return url;
  }
  const queryString = Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&');
  return `${url}?${queryString}`;
}

function request(options) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    
    const finalUrl = buildUrl(`${BASE_URL}${options.url}`, options.params);
    
    wx.request({
      url: finalUrl,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        if (res.statusCode === 200 || res.statusCode === 201) {
          resolve(res.data);
        } else if (res.statusCode === 401) {
          wx.removeStorageSync('token');
          wx.removeStorageSync('userInfo');
          wx.redirectTo({
            url: '/pages/my/index'
          });
          reject(new Error('登录已过期，请重新登录'));
        } else {
          reject(new Error(res.data.message || '请求失败'));
        }
      },
      fail: (err) => {
        reject(err);
      }
    });
  });
}

module.exports = {
  BASE_URL,
  request,
  get: (url, data, options = {}) => request({ url, method: 'GET', data, params: options.params }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, params: options.params }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, params: options.params }),
  delete: (url, options = {}) => request({ url, method: 'DELETE', params: options.params })
};
