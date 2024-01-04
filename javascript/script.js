// 音乐控制参数
// const album_cover_local = "./favicon.jpg";
// 定义sid的最小值和最大值
const minimum = 2;
const maximum = 43687;

// 页面背景滚动变化遮罩(这玩意真的超级消耗资源，如果可以还是用纯CSS的方法会更好)
window.onscroll = function () {
    //为了保证兼容性，这里取两个值，哪个有值取哪一个
    //scrollTop就是触发滚轮事件时滚轮的高度
    var scrollTop = document.documentElement.scrollTop || document.body.scrollTop;
    var n = (scrollTop / screen.height).toFixed(4);
    if (n <= 1) {
        document.getElementById("bg-cover").style.cssText = "-webkit-backdrop-filter: blur(" + n + "px) brightness(" + (100 - n * 50) + "%); backdrop-filter: blur(" + n + "px) brightness(" + (100 - n * 50) + "%);";
    } else {
        document.getElementById("bg-cover").style.cssText = "-webkit-backdrop-filter: blur(1px) brightness(54%); backdrop-filter: blur(1px) brightness(54%);";
    }
}

// 通用自定义函数
function getRandomNumber(min, max, decimalPlaces) {
    if (min >= max) {
        throw new Error('The minimum value must be less than the maximum value.');
    }

    const randomValue = Math.random() * (max - min) + min;

    if (decimalPlaces !== undefined) {
        if (decimalPlaces === 0) {
            return Math.round(randomValue); // 返回整数
        } else {
            const factor = Math.pow(10, decimalPlaces);
            return Math.round(randomValue * factor) / factor; // 返回保留指定小数位数的数值
        }
    }

    return Math.floor(randomValue); // 返回原始随机数（使用Math.floor()进行四舍五入）
}

// 设置Cookie
function setCookie(name, value) {
    document.cookie = `${name}=${value}; path=/`;
}

// 获取Cookie
function getCookie(name) {
    const cookieArr = document.cookie.split(';');
    for (let i = 0; i < cookieArr.length; i++) {
        const cookiePair = cookieArr[i].split('=');
        if (cookiePair[0].trim() === name) {
            return decodeURIComponent(cookiePair[1]);
        }
    }
    return null;
}

// 音乐控制部分
function getMusicInfoFromBiu(sid) {
    const apiUrl = `https://web.biu.moe/Song/playSID/sid/${sid}`;
    const coverApiUrl = `https://web.biu.moe/Song/getCover/sid/${sid}`;

    // 创建加载中的提示元素
    const loadingElement = document.createElement("div");
    loadingElement.className = "music-link";
    loadingElement.textContent = "正在加载中...";

    // 将加载中的提示元素添加到songInfoDiv中
    const songInfoDiv = document.getElementById("songInfo");
    songInfoDiv.innerHTML = "";
    songInfoDiv.appendChild(loadingElement);

    const fetchMusicInfo = fetch(apiUrl).then(response => {
        if (!response.ok) {
            throw new Error("获取音乐信息失败");
        }
        return response.json();
    });

    const fetchCover = fetch(coverApiUrl).then(response => {
        if (!response.ok) {
            throw new Error("获取音乐封面失败");
        }
        return response.json();
    });

    return Promise.all([fetchMusicInfo, fetchCover])
        .then(([musicInfoData, coverData]) => {
            if (!musicInfoData.status || !coverData.status) {
                throw new Error("失败了.TwT.");
            }

            let musicUrl = musicInfoData.urlinfo.url;
            // 去掉音乐URL中的转义符
            musicUrl = musicUrl.replace(/\\/g, '');

            const songId = musicInfoData.info[0];
            const songName = musicInfoData.info[1];
            let coverUrl = coverData.url;

            // 如果封面链接是 https:\/\/biu.moe\/Public\/img\/biu.png，使用本地图片
            if (coverUrl === "https:\/\/biu.moe\/Public\/img\/biu.png") {
                coverUrl = "./favicon.png"
                // coverUrl = album_cover_local;
            }

            // 设置 CSS 的 --album-cover 变量为封面链接
            document.getElementById("nav-box").style.setProperty("--album-cover", `url(${coverUrl})`);

            const songDiv = document.createElement("div");
            //是否开启音乐详情链接
            songDiv.innerHTML = `<div class="music-link" style="animation: boxshake .3s ease-in;"><span class="iconfont icon-music"></span>${songName}</div>`;
            // songDiv.innerHTML = `<div class="music-link" style="animation: boxshake .3s ease-in;"><span class="iconfont icon-music"></span><a href="https://biu.moe/#/s${songId}">${songName}</a></div>`;

            // 获取音乐播放器元素
            const musicPlayer = document.getElementById("music");
            // 将音乐URL放入audio标签的src属性中
            musicPlayer.src = musicUrl;
            musicPlayer.volume = 0.08;
            musicPlayer.addEventListener('loadeddata', function () {
                const songInfoDiv = document.getElementById("songInfo");
                songInfoDiv.innerHTML = "";
                songInfoDiv.appendChild(songDiv);
            });
            musicPlayer.play();

            const musicInfo = {
                musicUrl: musicUrl,
                songId: songId,
                songName: songName,
                producer: producer,
                album: album,
                coverUrl: coverUrl
            };

            return musicInfo;
        })
        .catch(error => {
            document.addEventListener('DOMContentLoaded', function () {
                const failDiv = document.getElementById("fail");
                failDiv.style.display = "block";
                failDiv.textContent = error.message;
            });
        });
}



// 等待页面加载完成
document.addEventListener('DOMContentLoaded', function () {
    // 获取play-mode-box元素和next按钮元素
    const playModeBox = document.getElementById('play-mode-box');
    const nextButton = document.getElementById('next');

    // 从Cookie中获取当前播放模式的值，如果不存在则默认为'shuffle'
    let currentMode = getCookie('currentMode') || 'shuffle';

    // 从Cookie中获取sid的值，如果不存在则随机生成一个初始的sid
    let sid = getCookie('sid');
    if (!sid || sid == 1) {
        sid = getRandomNumber(minimum, maximum, 0);
        setCookie('sid', sid); // 保存初始的sid到Cookie中
    } else {
        sid = parseInt(sid);
    }

    // 创建子元素数组，按照需要循环显示的顺序排列
    const playModes = [{
            id: 'shuffle',
            className: 'play-mode iconfont icon-shuffle',
            title: '随机播放'
        },
        {
            id: 'order',
            className: 'play-mode iconfont icon-order',
            title: '顺序播放'
        },
        {
            id: 'loop',
            className: 'play-mode iconfont icon-loop',
            title: '单曲循环'
        }
    ];

    // 根据当前播放模式设置初始显示的子元素
    const initialPlayMode = playModes.find(mode => mode.id === currentMode);
    const initialElement = document.createElement('div');
    initialElement.id = initialPlayMode.id;
    initialElement.className = initialPlayMode.className;
    initialElement.title = initialPlayMode.title;
    playModeBox.appendChild(initialElement);

    // 添加点击事件监听器
    playModeBox.addEventListener('click', function () {
        // 根据当前播放模式找到下一个播放模式
        const currentIndex = playModes.findIndex(mode => mode.id === currentMode);
        const nextIndex = (currentIndex + 1) % playModes.length;
        currentMode = playModes[nextIndex].id;

        // 删除原有的子元素
        playModeBox.innerHTML = '';

        // 创建一个新的子元素，并设置为当前播放模式对应的子元素
        const newElement = document.createElement('div');
        newElement.id = currentMode;
        newElement.className = playModes[nextIndex].className;
        newElement.title = playModes[nextIndex].title;
        playModeBox.appendChild(newElement);

        // 当currentMode为loop时，给audio#music标签添加loop属性
        const musicPlayer = document.getElementById('music');
        if (currentMode === 'loop') {
            musicPlayer.setAttribute('loop', 'true');
        } else {
            musicPlayer.removeAttribute('loop');
        }
        // 保存切换后的播放模式到Cookie中
        setCookie('currentMode', currentMode);
    });

    // 监听audio#music的播放事件
    const musicPlayer = document.getElementById('music');
    musicPlayer.addEventListener('ended', function () {
        // 播放完时根据当前播放模式切换到下一首歌曲
        if (currentMode === 'shuffle') {
            do {
                sid = getRandomNumber(minimum, maximum, 0);
            } while (sid === musicPlayer.dataset.sid); // 如果新的sid和当前的sid相同，则重新生成直到不相同
        } else if (currentMode === 'order' || currentMode === 'loop') {
            sid++;
            if (sid >= maximum) {
                sid = minimum;
            }
        }

        console.log('当前播放模式：', currentMode, "当前sid值：", musicPlayer.dataset.sid, "下一个sid值", sid);
        musicPlayer.dataset.sid = sid; // 将sid保存在data属性中，以便后续判断是否需要重新生成sid
        // 更新Cookie中的sid值
        setCookie('sid', musicPlayer.dataset.sid);
        // 更新歌曲信息
        getMusicInfoFromBiu(musicPlayer.dataset.sid);
    });

    // 监听next按钮的点击事件
    nextButton.addEventListener('click', function () {
        // 点击时根据当前播放模式切换到下一首歌曲
        if (currentMode === 'shuffle') {
            do {
                sid = getRandomNumber(minimum, maximum, 0);
            } while (sid === musicPlayer.dataset.sid); // 如果新的sid和当前的sid相同，则重新生成直到不相同
        } else if (currentMode === 'order' || currentMode === 'loop') {
            sid++;
            if (sid >= maximum) {
                sid = minimum;
            }
        }

        console.log('当前播放模式：', currentMode, "当前sid值：", musicPlayer.dataset.sid, "下一个sid值", sid);
        musicPlayer.dataset.sid = sid;
        // 更新Cookie中的sid值
        setCookie('sid', musicPlayer.dataset.sid);
        // 更新歌曲信息
        getMusicInfoFromBiu(musicPlayer.dataset.sid);
    });

    const playButton = document.getElementById('play');
    const pauseButton = document.getElementById('pause');
    let isFirstPlay = true;

    // 为播放按钮添加点击事件监听器，调用play()方法播放音乐
    playButton.addEventListener('click', function () {
        if (isFirstPlay) {
            // 首次加载音乐
            getMusicInfoFromBiu(sid);
        }
        isFirstPlay = false;
        document.getElementById('music').play();
    });

    // 为暂停按钮添加点击事件监听器，调用pause()方法暂停音乐
    pauseButton.addEventListener('click', function () {
        document.getElementById('music').pause();
    });

    document.getElementById('music').addEventListener('play', function () {
        playButton.style.display = "none";
        pauseButton.style.display = "block"
    });

    document.getElementById('music').addEventListener('pause', function () {
        pauseButton.style.display = "none"
        playButton.style.display = "block";
    });
});

// 时间显示部分
function getCurrentTime() {
    const currentDate = new Date();

    // 获取时分秒
    const hours = addZeroPadding(currentDate.getHours());
    const minutes = addZeroPadding(currentDate.getMinutes());
    const seconds = addZeroPadding(currentDate.getSeconds());

    // 获取星期
    const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
    const dayOfWeek = daysOfWeek[currentDate.getDay()] + "曜日";

    // 获取日期
    const month = addZeroPadding(currentDate.getMonth() + 1); // 月份从0开始，需要加1
    const day = addZeroPadding(currentDate.getDate());
    const year = currentDate.getFullYear();

    // 拼接时间和日期字符串
    const timeString = `${hours}:${minutes}:${seconds}`;
    const dateString = `${year}.${month}.${day}`;

    // 返回结果
    return {
        time: timeString,
        dayOfWeek: dayOfWeek,
        date: dateString
    };
}

// 辅助函数：为个位数的小时、分钟、秒前面添加零，使其保持两位数
function addZeroPadding(num) {
    return num.toString().padStart(2, "0");
}

function updateClock() {
    // 获取当前时间和日期信息
    const currentTimeInfo = getCurrentTime();

    // 更新页面上的元素内容
    document.getElementById("time").textContent = currentTimeInfo.time;
    document.getElementById("dayOfWeek").textContent = currentTimeInfo.dayOfWeek;
    document.getElementById("date").textContent = currentTimeInfo.date;
}

// 每隔一秒钟更新一次时间和日期
setInterval(updateClock, 1000);



// Ping Url
function pingURL(obj,url){
    var urlBox = document.getElementById(obj.id);
    var urlDate = new Date();
    var urlTime = urlDate.getMinutes()*60 + urlDate.getSeconds() + urlDate.getMilliseconds()/1000;
    urlBox.innerHTML = "<img id='"+urlTime+"' src="+url+"/"+Math.random()+" width=0 height=0 onerror='checkTime(this,"+urlTime+")' >Testing...";
}
function checkTime(obj,tim){
    var nowDate = new Date();
    var timec = (nowDate.getMinutes()*60 + nowDate.getSeconds() + nowDate.getMilliseconds()/1000 - tim).toFixed(2);
    if(timec>20){
        document.getElementById(obj.id).parentNode.innerHTML = "<div class='url-R'></div>Timeout";
    }else{
        document.getElementById(obj.id).parentNode.innerHTML = "<div class='url-G'></div>"+timec+"s";
    }
}

document.addEventListener('DOMContentLoaded', function () {

    fetch('https://raw.gitmirror.com/Chairowell/Pictures-BED/main/poster.json')
    .then((response) => response.json())
    .then((json) => {
        const data = json;
        const allNum = data['poster'].length;
        var bgNum = getRandomNumber(0,allNum);
        const bg = document.querySelector('#background')
        bg.style.backgroundImage = 'url('+data['poster'][bgNum]+')';    
        // var i = 0;
        // setInterval(() => {
        //     if (i < allNum){
        //         bg.style.backgroundImage = 'url('+data['poster'][i++]+')';    
        //     }
        // }, '5000');
    });

    fetch('./list.json')
    .then((response) => response.json())
    .then((json) => {
        const obj = json;
        const box = document.querySelector('#linkbox');
        var group = '';
        for(i in obj){
            var linkBox = '';
            for(l in obj[i]){
                var link = obj[i][l]["url"];
                var name = obj[i][l]["name"];
                var explain = obj[i][l]["explain"];
                linkBox = `
                    ${linkBox}
                    <div class="link-box">
                        <a href="${link}">
                            <div class="link-name">${name}</div>
                            <div class="link-explain">${explain}</div>
                        </a>
                        <div class="url-test" id="${name}" onclick="pingURL(this,'${link}')">
                            <div class="url-B"></div>点我测试
                        </div>
                    </div>
                `;
            }
            group = `
                ${group}
                <div class="partition">
                    <div class="partition-name" id="${i}">- ${i} -</div>
                    <div class="partition-box">${linkBox}</div>
                </div>
            `;
        }
        box.innerHTML = group;
    })

});