/**
 * ==========================================
 * 全局函数（放在最外面，确保 HTML 能调用）
 * ==========================================
 */

// 1. 卷轴展开/折叠
function toggleScroll(header) {
    const item = header.parentElement;
    document.querySelectorAll('.scroll-item').forEach(i => {
        if (i !== item) i.classList.remove('active');
    });
    item.classList.toggle('active');
    const clickSound = document.getElementById('btn-sound');
    if (clickSound) { clickSound.currentTime = 0; clickSound.play().catch(() => { }); }
}

// ==========================================
// 2. 播放微信语音 (带强力扩音器 + BGM避让)
// ==========================================

// 定义扩音器变量 (放在函数外面，防止重复创建)
let voiceAudioContext = null;
let voiceGainNode = null;

function playVoiceMessage() {
    const voice = document.getElementById('voice-msg');
    const bgm = document.getElementById('bg-music');

    if (voice) {
        // 1. 背景音乐避让：声音压得更低，给语音让路
        if (bgm) bgm.volume = 0.05;

        // 2. ★★★ 核心黑科技：音量放大器 ★★★
        if (!voiceAudioContext) {
            // 初始化音频上下文
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            voiceAudioContext = new AudioContext();

            // 创建源 (Source) 和 增益器 (Gain)
            const source = voiceAudioContext.createMediaElementSource(voice);
            voiceGainNode = voiceAudioContext.createGain();

            // ★这里设置放大倍数：3.0 就是 300% 的音量，觉得小可以改成 5.0
            voiceGainNode.gain.value = 3.0;

            // 连接：源 -> 增益器 -> 扬声器
            source.connect(voiceGainNode);
            voiceGainNode.connect(voiceAudioContext.destination);
        }

        // 确保音频引擎已启动 (浏览器策略要求)
        if (voiceAudioContext.state === 'suspended') {
            voiceAudioContext.resume();
        }

        // 3. 播放逻辑
        voice.currentTime = 0;
        voice.play().catch(e => console.log("播放失败:", e));

        voice.onended = function () {
            // 语音结束后，背景音乐慢慢恢复
            if (bgm) bgm.volume = 0.4;
        };
    }
}

/**
 * ==========================================
 * 主逻辑执行
 * ==========================================
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log("🚀 回忆列车最终完整版启动...");

    // --- 基础元素获取 ---
    const bgMusic = document.getElementById('bg-music');
    const btnSound = document.getElementById('btn-sound');
    const startSound = document.getElementById('start-sound');
    const musicBtn = document.getElementById('music-btn');
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const timelineTimers = [];

    // --- 音量均衡控制 ---
    const bubbleSound = document.getElementById('bubble-sound');
    if (bgMusic) bgMusic.volume = 0.4;     // 背景音乐 40%
    if (startSound) startSound.volume = 1.0; // 开场音效 100%
    if (btnSound) btnSound.volume = 1.0;     // 点击音效 100%
    if (bubbleSound) bubbleSound.volume = 0.8; // 气泡啵音效 80%

    // --- 1. Swiper 初始化 ---
    const swiper = new Swiper(".mySwiper", {
        direction: "vertical",
        speed: 800,
        mousewheel: true,
        touchStartPreventDefault: false, // 释放原生滚动权限
        effect: "creative",
        creativeEffect: {
            prev: { shadow: true, translate: [0, "-20%", -500], opacity: 0 },
            next: { translate: [0, "100%", 0], scale: 1.2, opacity: 0 },
        },
        on: {
            slideChangeTransitionStart: function () {
                clearTimelineAni();
                const activeSlide = this.slides[this.activeIndex];

                // 执行页面内通用动画
                activeSlide.querySelectorAll('.ani').forEach(el => {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                    const effect = el.getAttribute('swiper-animate-effect');
                    if (effect) el.classList.add('animate__animated', effect);
                });

                // 时间轴页特殊逻辑 (自动归位 + 气泡播放 + 箭头更新)
                if (activeSlide.classList.contains('timeline-slide')) {
                    activeSlide.scrollTop = 0;
                    playTimelineAnimation(this);
                    setTimeout(updateTimelineArrows, 150);
                }
                // 草莓页特殊逻辑 (自动归位 + 箭头更新)
                if (activeSlide.classList.contains('strawberry-theme')) {
                    activeSlide.scrollTop = 0;
                    setTimeout(updateStrawberryArrows, 150);
                }

                // 每次切换页面，重新计算当前页的滑动条 / 箭头
                const currentClass = activeSlide.className.split(' ').find(c => c.includes('-theme'));
                if (currentClass) {
                    setTimeout(() => {
                        window.dispatchEvent(new Event('resize'));
                        if (typeof updateTimelineArrows === 'function') updateTimelineArrows();
                        if (typeof updateStrawberryArrows === 'function') updateStrawberryArrows();
                    }, 100);
                }
            }
        }
    });

    // --- 2. 自定义滑动条逻辑 (通用封装版 - 蓝色/红色页复用) ---

    // 【核心封装函数】为指定的 slide 容器初始化滑动条功能
    function setupScrollbar(containerClass) {
        const scrollArea = document.querySelector(containerClass);
        if (!scrollArea) return;

        // 在当前页面内寻找对应的轨道和滑块
        const track = scrollArea.querySelector('.custom-scrollbar-track');
        const thumb = scrollArea.querySelector('.custom-scrollbar-thumb');

        if (thumb && track) {
            let isDragging = false;
            let startY, startTop;

            // 更新滑块位置和高度
            const updateScrollbarPosition = () => {
                const containerHeight = scrollArea.clientHeight;
                const contentHeight = scrollArea.scrollHeight;
                const trackHeight = track.clientHeight;

                // 内容少于一屏时不显示
                if (contentHeight <= containerHeight) {
                    thumb.style.height = '0px';
                    return;
                }

                // 计算并设置高度
                let thumbHeight = (containerHeight / contentHeight) * trackHeight;
                thumbHeight = Math.max(thumbHeight, 40);
                thumb.style.height = thumbHeight + 'px';

                // 计算并设置位置
                const maxScroll = contentHeight - containerHeight;
                const maxTop = trackHeight - thumbHeight;
                const scrollPercent = scrollArea.scrollTop / maxScroll;
                thumb.style.top = (scrollPercent * maxTop) + 'px';
            };

            // 初始化和监听
            setTimeout(updateScrollbarPosition, 500);
            window.addEventListener('resize', updateScrollbarPosition);

            // 触摸拖拽逻辑
            thumb.addEventListener('touchstart', function (e) {
                isDragging = true;
                startY = e.touches[0].clientY;
                startTop = thumb.offsetTop;
                thumb.style.transition = 'none';
                e.preventDefault();
                swiper.allowTouchMove = false; // 拖拽时禁止翻页
            });

            document.addEventListener('touchmove', function (e) {
                if (!isDragging) return;
                e.preventDefault();
                const deltaY = e.touches[0].clientY - startY;
                const trackHeight = track.clientHeight;
                const thumbHeight = thumb.offsetHeight;
                const maxTop = trackHeight - thumbHeight;
                let newTop = startTop + deltaY;
                newTop = Math.max(0, Math.min(newTop, maxTop));

                thumb.style.top = newTop + 'px';

                const scrollPercent = newTop / maxTop;
                const maxScroll = scrollArea.scrollHeight - scrollArea.clientHeight;
                scrollArea.scrollTop = scrollPercent * maxScroll;
            }, { passive: false });

            document.addEventListener('touchend', () => {
                if (isDragging) {
                    isDragging = false;
                    swiper.allowTouchMove = true; // 恢复翻页
                }
            });

            // 监听内容滚动，同步滑块
            scrollArea.addEventListener('scroll', function () {
                if (isDragging) return;
                updateScrollbarPosition();
            });
        }
    }

    // ★★★ 草莓页改用上下箭头（与时间轴页相同逻辑） ★★★

    // --- 时间轴页：上下滚动箭头逻辑（替代右侧滑动条） ---
    const timelineSlide = document.querySelector('.blue-diary-theme');
    const arrowDown = document.getElementById('timeline-arrow-down');
    const arrowUp = document.getElementById('timeline-arrow-up');

    let timelineArrowClickLock = false; // 点击后短暂锁定，防止 scroll 事件覆盖箭头状态
    function updateTimelineArrows() {
        if (!timelineSlide || !arrowDown || !arrowUp) return;
        if (timelineArrowClickLock) return;
        const isActive = timelineSlide.classList.contains('swiper-slide-active');
        if (!isActive) {
            arrowDown.classList.remove('visible');
            arrowUp.classList.remove('visible');
            return;
        }
        const canScroll = timelineSlide.scrollHeight > timelineSlide.clientHeight;
        if (!canScroll) {
            arrowDown.classList.remove('visible');
            arrowUp.classList.remove('visible');
            return;
        }
        const maxScroll = timelineSlide.scrollHeight - timelineSlide.clientHeight;
        const atTop = timelineSlide.scrollTop <= 10;
        const atBottom = timelineSlide.scrollTop >= maxScroll - 10;

        // 顶部：只显示向下箭头；底部：只显示向上箭头；中间：都不显示
        if (atTop) {
            arrowDown.classList.add('visible');
            arrowUp.classList.remove('visible');
        } else if (atBottom) {
            arrowDown.classList.remove('visible');
            arrowUp.classList.add('visible');
        } else {
            arrowDown.classList.remove('visible');
            arrowUp.classList.remove('visible');
        }
    }

    if (timelineSlide && arrowDown && arrowUp) {
        timelineSlide.addEventListener('scroll', updateTimelineArrows);
        window.addEventListener('resize', updateTimelineArrows);
        arrowDown.addEventListener('click', function () {
            if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => { }); }
            timelineArrowClickLock = true;
            arrowDown.classList.remove('visible');
            arrowUp.classList.add('visible');
            timelineSlide.scrollTo({ top: timelineSlide.scrollHeight, behavior: 'smooth' });
            setTimeout(() => {
                timelineArrowClickLock = false;
                updateTimelineArrows();
            }, 500);
        });
        arrowUp.addEventListener('click', function () {
            if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => { }); }
            timelineArrowClickLock = true;
            arrowUp.classList.remove('visible');
            arrowDown.classList.add('visible');
            timelineSlide.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                timelineArrowClickLock = false;
                updateTimelineArrows();
            }, 500);
        });
    }

    // --- 草莓页：上下滚动箭头逻辑（与时间轴页相同，样式与故事页底部箭头一致） ---
    const strawberrySlide = document.querySelector('.strawberry-theme');
    const strawberryArrowDown = document.getElementById('strawberry-arrow-down');
    const strawberryArrowUp = document.getElementById('strawberry-arrow-up');

    let strawberryArrowClickLock = false;
    function updateStrawberryArrows() {
        if (!strawberrySlide || !strawberryArrowDown || !strawberryArrowUp) return;
        if (strawberryArrowClickLock) return;
        const isActive = strawberrySlide.classList.contains('swiper-slide-active');
        if (!isActive) {
            strawberryArrowDown.classList.remove('visible');
            strawberryArrowUp.classList.remove('visible');
            return;
        }
        const canScroll = strawberrySlide.scrollHeight > strawberrySlide.clientHeight;
        if (!canScroll) {
            strawberryArrowDown.classList.remove('visible');
            strawberryArrowUp.classList.remove('visible');
            return;
        }
        const maxScroll = strawberrySlide.scrollHeight - strawberrySlide.clientHeight;
        const atTop = strawberrySlide.scrollTop <= 10;
        const atBottom = strawberrySlide.scrollTop >= maxScroll - 10;

        if (atTop) {
            strawberryArrowDown.classList.add('visible');
            strawberryArrowUp.classList.remove('visible');
        } else if (atBottom) {
            strawberryArrowDown.classList.remove('visible');
            strawberryArrowUp.classList.add('visible');
        } else {
            strawberryArrowDown.classList.remove('visible');
            strawberryArrowUp.classList.remove('visible');
        }
    }

    if (strawberrySlide && strawberryArrowDown && strawberryArrowUp) {
        strawberrySlide.addEventListener('scroll', updateStrawberryArrows);
        window.addEventListener('resize', updateStrawberryArrows);
        strawberryArrowDown.addEventListener('click', function () {
            if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => { }); }
            strawberryArrowClickLock = true;
            strawberryArrowDown.classList.remove('visible');
            strawberryArrowUp.classList.add('visible');
            strawberrySlide.scrollTo({ top: strawberrySlide.scrollHeight, behavior: 'smooth' });
            setTimeout(() => {
                strawberryArrowClickLock = false;
                updateStrawberryArrows();
            }, 500);
        });
        strawberryArrowUp.addEventListener('click', function () {
            if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => { }); }
            strawberryArrowClickLock = true;
            strawberryArrowUp.classList.remove('visible');
            strawberryArrowDown.classList.add('visible');
            strawberrySlide.scrollTo({ top: 0, behavior: 'smooth' });
            setTimeout(() => {
                strawberryArrowClickLock = false;
                updateStrawberryArrows();
            }, 500);
        });
    }

    // --- 3. 哥特启动页逻辑 (唱片 + 打字机 + 飞鼠) ---
    const scratchSound = document.getElementById('scratch-sound');
    const typewriterText = document.getElementById('typewriter-text');
    const card = document.querySelector('.gothic-card');
    const fadeInText = document.querySelector('.fade-in-text');
    const squirrel = document.getElementById('flying-squirrel');

    // 打字机函数
    function typeWriter(text, element, speed = 150) {
        let i = 0;
        element.innerHTML = "";
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                // 打字结束，显示正文
                setTimeout(() => {
                    if (fadeInText) fadeInText.classList.add('show');
                }, 500);
            }
        }
        type();
    }

    // 页面加载后的序列动画
    setTimeout(() => {
        // 1. 尝试播放刮擦声
        if (scratchSound) {
            scratchSound.volume = 0.6;
            let playPromise = scratchSound.play();
            if (playPromise !== undefined) {
                playPromise.catch(error => console.log("自动播放拦截，直接显示"));
            }
        }

        // 2. 显示卡片并开始打字
        setTimeout(() => {
            if (card) card.classList.add('visible');
            setTimeout(() => {
                if (typewriterText) typeWriter("好久不见，海海。", typewriterText);
            }, 800);
        }, 1000);
    }, 500);

    // 按钮点击逻辑 (飞鼠 + 进场)
    startBtn.addEventListener('click', function () {
        // 播放音效
        if (btnSound) { btnSound.currentTime = 0; btnSound.play().catch(() => { }); }
        if (startSound) { startSound.currentTime = 0; startSound.play().catch(() => { }); }

        // 播放BGM
        bgMusic.play().then(() => { musicBtn.style.display = 'flex'; }).catch(() => { });

        // 小飞鼠动画
        if (squirrel) {
            squirrel.classList.add('squirrel-pop');
        }

        // 延迟进场
        setTimeout(() => {
            startScreen.style.opacity = '0';
            startScreen.style.transform = 'scale(1.1)';
            setTimeout(() => {
                startScreen.style.display = 'none';
                swiper.emit('slideChangeTransitionStart');
            }, 800);
        }, 600); // 等飞鼠飞一下
    });


    // --- 4. 其他功能逻辑 ---

    // 音乐开关
    musicBtn.addEventListener('click', function () {
        if (bgMusic.paused) {
            bgMusic.play();
            this.style.animationPlayState = 'running';
            this.style.opacity = '1';
        } else {
            bgMusic.pause();
            this.style.animationPlayState = 'paused';
            this.style.opacity = '0.6';
        }
    });

    // 回到起点按钮
    const goHomeBtn = document.getElementById('go-home');
    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', () => {
            swiper.slideTo(0, 800);
            document.querySelectorAll('.scroll-item').forEach(i => i.classList.remove('active'));
        });
    }

    // 灯箱逻辑
    const lightbox = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    document.body.addEventListener('click', function (e) {
        const target = e.target;
        // 支持点击气泡或直接点击图片
        if (target.classList.contains('bubble') || target.classList.contains('moment-img')) {
            if (btnSound) { btnSound.currentTime = 0; btnSound.play().catch(() => { }); }
            const imgName = target.getAttribute('data-img');
            if (imgName) {
                lightboxImg.src = 'images/' + imgName;
                lightbox.classList.add('active');
            }
        }
    });
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            if (e.target !== lightboxImg) {
                lightbox.classList.remove('active');
                setTimeout(() => { lightboxImg.src = ''; }, 300);
            }
        });
    }

    // 动画辅助函数
    function clearTimelineAni() {
        timelineTimers.forEach(id => clearTimeout(id));
        document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('show'));
    }

    function playTimelineAnimation(swiperInstance) {
        const items = swiperInstance.slides[swiperInstance.activeIndex].querySelectorAll('.timeline-item');
        items.forEach((item, index) => {
            const tId = setTimeout(() => {
                item.classList.add('show');
                if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => { }); }
            }, 600 * (index + 1));
            timelineTimers.push(tId);
        });
    }

    // --- 最终气泡：点击跳出鞭炮，每次位置随机，点击越快鞭炮越多 ---
    const finalBubble = document.getElementById('final-bubble');
    const firecrackerSound = document.getElementById('firecracker-sound');
    const timelineSlideEl = document.querySelector('.blue-diary-theme');
    if (finalBubble && firecrackerSound) firecrackerSound.volume = 0.8;

    if (finalBubble && timelineSlideEl) {
        finalBubble.addEventListener('click', function (e) {
            e.stopPropagation();
            if (firecrackerSound) {
                firecrackerSound.currentTime = 0;
                firecrackerSound.play().catch(() => { });
            }
            const rect = finalBubble.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const angle = Math.random() * Math.PI * 2;
            const dist = 60 + Math.random() * 80;
            const tx = cx + Math.cos(angle) * dist;
            const ty = cy + Math.sin(angle) * dist;
            const fc = document.createElement('span');
            fc.className = 'firecracker-pop';
            fc.textContent = '🧨';
            fc.style.setProperty('--start-x', cx + 'px');
            fc.style.setProperty('--start-y', cy + 'px');
            fc.style.setProperty('--end-x', tx + 'px');
            fc.style.setProperty('--end-y', ty + 'px');
            timelineSlideEl.appendChild(fc);
            fc.addEventListener('animationend', function () {
                fc.remove();
            });
        });
    }

    // --- 眼中的海海页：点击头像跳出紫心，位置在头像外框一圈上 ---
    const devilAvatar = document.getElementById('devil-avatar');
    const popSound = document.getElementById('pop-sound'); // 获取音效元素
    const devilSlide = document.querySelector('.devil-theme');
    if (devilAvatar && devilSlide) {
        devilAvatar.addEventListener('click', function (e) {
            e.stopPropagation();

            // ★★★ 新增：播放 POP 音效 ★★★
            if (popSound) {
                popSound.currentTime = 0;
                popSound.volume = 1.0; // 啵啵声要大一点
                popSound.play().catch(() => { });
            }

            const avatarImg = devilAvatar.querySelector('img');
            const el = avatarImg || devilAvatar;
            const rect = el.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const radius = rect.width / 2 + 8;
            const angle = Math.random() * Math.PI * 2;
            const tx = cx + Math.cos(angle) * radius;
            const ty = cy + Math.sin(angle) * radius;
            const h = document.createElement('span');
            h.className = 'firecracker-pop heart-pop';
            h.textContent = '💜';
            h.style.setProperty('--start-x', cx + 'px');
            h.style.setProperty('--start-y', cy + 'px');
            h.style.setProperty('--end-x', tx + 'px');
            h.style.setProperty('--end-y', ty + 'px');
            devilSlide.appendChild(h);
            if (firecrackerSound) {
                firecrackerSound.currentTime = 0;
                firecrackerSound.play().catch(() => { });
            }
            h.addEventListener('animationend', function () {
                h.remove();
            });
        });
    }

    // --- 墓碑彩蛋：头像点击计数 ---
    const myAvatar = document.querySelector('.voice-avatar');
    // 获取墓碑音效元素
    const stoneSound = document.getElementById('stone-sound');
    let avatarClickCount = 0;

    if (myAvatar) {
        myAvatar.addEventListener('click', function (e) {
            e.stopPropagation();

            avatarClickCount++;
            console.log("头像被点击次数:", avatarClickCount);

            if (avatarClickCount >= 10) {
                // 1. ★★★ 播放沉重的墓碑音效 ★★★
                if (stoneSound) {
                    stoneSound.currentTime = 0;
                    stoneSound.volume = 1.0; // 声音拉满
                    stoneSound.play().catch(() => { });
                }

                // 2. 触发视觉彩蛋
                showTombstoneEgg(myAvatar);

                // 3. 重置计数
                avatarClickCount = 0;
            }
        });
    }

    function showTombstoneEgg(targetElement) {
        const bubble = document.createElement('div');
        bubble.className = 'egg-bubble';
        bubble.textContent = '不许打扰我，我只是个墓碑。。。。';
        targetElement.appendChild(bubble);
        bubble.addEventListener('animationend', function () {
            bubble.remove();
        });
    }
});