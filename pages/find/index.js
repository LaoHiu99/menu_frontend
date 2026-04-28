// pages/find/index.js
const { setNavHeightToPage } = require('../../utils/navHeight.js');

Page({
  data: {
    statusBarHeight: 0,
    navBarHeight: 0,
    capsuleHeight: 0,
    capsuleTop: 0,
    capsuleBottom: 0,
    safeAreaTop: 0,
    currentMood: {
      dog: '🐶',
      text: '今天也是元气满满的一天！'
    },
    dailyQuote: '生活就像散步，不用着急，慢慢走也能看到好风景~',
    diaryList: [
      {
        id: 1,
        date: '2026-04-28',
        content: '今天主人给我买了好多好吃的，开心到转圈圈！原来幸福就是这么简单~',
        liked: false,
        likeCount: 128
      },
      {
        id: 2,
        date: '2026-04-27',
        content: '下雨天不能出去玩，只能在窗边看雨滴。不过主人陪我玩了一下午的球球，也很开心！',
        liked: false,
        likeCount: 96
      },
      {
        id: 3,
        date: '2026-04-26',
        content: '今天在公园认识了一只新朋友，我们一起追蝴蝶，跑了好远好远。友谊就是这么奇妙~',
        liked: false,
        likeCount: 152
      },
      {
        id: 4,
        date: '2026-04-25',
        content: '学会了新技能！现在我会握手、打滚、装死了。主人夸我是最聪明的小狗，尾巴摇到停不下来~',
        liked: false,
        likeCount: 203
      }
    ],
    funFacts: [
      {
        id: 1,
        icon: '🐾',
        title: '小狗的鼻子',
        preview: '每只狗的鼻纹都是独一无二的',
        detail: '就像人类的指纹一样，每只狗的鼻纹都是独一无二的！所以理论上可以用鼻纹来识别狗狗的身份哦~'
      },
      {
        id: 2,
        icon: '🦴',
        title: '摇尾巴的秘密',
        preview: '摇尾巴的方向有含义',
        detail: '狗狗向右摇尾巴表示开心，向左摇则表示紧张或不安。下次观察一下你家小狗的尾巴方向吧！'
      },
      {
        id: 3,
        icon: '👂',
        title: '超级听力',
        preview: '狗狗的听力是人类的4倍',
        detail: '狗狗能听到频率高达65000赫兹的声音，而人类只能听到20000赫兹。所以它们能听到很远很远的声音！'
      },
      {
        id: 4,
        icon: '😴',
        title: '做梦的小狗',
        preview: '狗狗也会做梦哦',
        detail: '狗狗和人类一样会做梦！如果你看到狗狗睡觉时腿在动或者发出声音，那它可能正在梦里追蝴蝶呢~'
      },
      {
        id: 5,
        icon: '🌡️',
        title: '体温小知识',
        preview: '狗狗的正常体温比人类高',
        detail: '狗狗的正常体温是38-39度，比人类高一些。所以冬天它们更喜欢温暖的地方，比如暖气旁边或者被窝里~'
      },
      {
        id: 6,
        icon: '🎨',
        title: '色彩世界',
        preview: '狗狗能看到颜色',
        detail: '虽然不如人类丰富，但狗狗能看到蓝色和黄色。它们眼中的世界主要是蓝黄灰三种色调，也很美呢！'
      }
    ],
    selectedFact: null
  },

  onLoad() {
    setNavHeightToPage(this);
    this.updateDailyMood();
    this.updateDailyQuote();
  },

  onShow() {
    setNavHeightToPage(this);
  },

  updateDailyMood() {
    const moods = [
      { dog: '🐶', text: '今天也是元气满满的一天！' },
      { dog: '🐕', text: '阳光真好，想出去散步~' },
      { dog: '🐩', text: '被主人摸摸，好幸福呀' },
      { dog: '🦮', text: '交到了新朋友，开心！' },
      { dog: '🐕‍🦺', text: '学会了新技能，超有成就感' }
    ];
    const today = new Date().getDate();
    this.setData({ currentMood: moods[today % moods.length] });
  },

  updateDailyQuote() {
    const quotes = [
      '生活就像散步，不用着急，慢慢走也能看到好风景~',
      '每一次摇尾巴，都是对生活的热爱~',
      '最好的时光，就是和喜欢的人在一起~',
      '就算下雨天，也要保持好心情呀~',
      '世界很大，但最温暖的地方是主人的怀抱~',
      '不用追求完美，做最真实的自己就好~',
      '每一天都是新的冒险，要勇敢哦~'
    ];
    const today = new Date().getDate();
    this.setData({ dailyQuote: quotes[today % quotes.length] });
  },

  onLikeDiary(e) {
    const id = e.currentTarget.dataset.id;
    const diaryList = this.data.diaryList.map(item => {
      if (item.id === id) {
        const liked = !item.liked;
        return {
          ...item,
          liked: liked,
          likeCount: liked ? item.likeCount + 1 : item.likeCount - 1
        };
      }
      return item;
    });
    this.setData({ diaryList });
  },

  onTapFact(e) {
    const index = e.currentTarget.dataset.index;
    const fact = this.data.funFacts[index];
    wx.showModal({
      title: fact.icon + ' ' + fact.title,
      content: fact.detail,
      showCancel: false,
      confirmText: '知道啦 🐾',
      confirmColor: '#8b6f47'
    });
  }
});
