const BASE_URL = 'https://www.cocolh.top';

/** 展示用：把服务端返回的 /uploads 相对路径转为可访问的完整 URL */
function resolveMediaUrl(url) {
  if (!url) return '/images/avator.png';
  const u = String(url);
  if (u.startsWith('http://') || u.startsWith('https://')) return u;
  if (u.startsWith('/uploads/')) return `${BASE_URL}${u}`;
  return u;
}

function uploadFile({ url, filePath, name = 'file' }) {
  return new Promise((resolve, reject) => {
    const token = wx.getStorageSync('token');
    const base = `${BASE_URL}${url}`;
    const sep = base.includes('?') ? '&' : '?';
    const uploadUrl =
      token && !base.includes('token=')
        ? `${base}${sep}token=${encodeURIComponent(token)}`
        : base;
    wx.uploadFile({
      url: uploadUrl,
      filePath,
      name,
      header: {
        Authorization: token ? `Bearer ${token}` : ''
      },
      success: (res) => {
        const ok = res.statusCode === 200 || res.statusCode === 201;
        let body;
        try {
          body = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
        } catch {
          body = null;
        }
        if (ok && body) {
          resolve(body);
          return;
        }
        const rawMsg =
          (body && (body.message || body.error)) ||
          (typeof res.data === 'string' ? res.data : '');
        const msg = Array.isArray(rawMsg) ? rawMsg.join('; ') : rawMsg || `上传失败(${res.statusCode})`;
        reject(new Error(msg));
      },
      fail: (err) => reject(err)
    });
  });
}

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
          const body = res.data && typeof res.data === 'object' ? res.data : {};
          const raw = body.message != null ? body.message : body.error;
          const text =
            Array.isArray(raw) ? raw.join('; ') : raw != null && raw !== '' ? String(raw) : `请求失败(${res.statusCode})`;
          reject(new Error(text));
        }
      },
      fail: (err) => {
        const msg =
          (err && err.errMsg) ||
          (typeof err === 'string' ? err : '') ||
          '网络异常，请检查服务器是否可访问及开发者工具「不校验合法域名」';
        reject(new Error(msg));
      }
    });
  });
}

module.exports = {
  BASE_URL,
  resolveMediaUrl,
  uploadFile,
  request,
  get: (url, data, options = {}) => request({ url, method: 'GET', data, params: options.params }),
  post: (url, data, options = {}) => request({ url, method: 'POST', data, params: options.params }),
  put: (url, data, options = {}) => request({ url, method: 'PUT', data, params: options.params }),
  delete: (url, options = {}) => request({ url, method: 'DELETE', params: options.params })
};
