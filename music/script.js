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

// 2. 播放微信语音 (带强力扩音器 + BGM避让)
let voiceAudioContext = null;
let voiceGainNode = null;

function playVoiceMessage() {
    const voice = document.getElementById('voice-msg');
    const bgm = document.getElementById('bg-music');

    if (voice) {
        // 背景音乐避让
        if (bgm) bgm.volume = 0.05; 

        // 音量放大器逻辑
        if (!voiceAudioContext) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                voiceAudioContext = new AudioContext();
                const source = voiceAudioContext.createMediaElementSource(voice);
                voiceGainNode = voiceAudioContext.createGain();
                voiceGainNode.gain.value = 3.0; // 3倍音量
                source.connect(voiceGainNode);
                voiceGainNode.connect(voiceAudioContext.destination);
            }
        }

        if (voiceAudioContext && voiceAudioContext.state === 'suspended') {
            voiceAudioContext.resume();
        }

        voice.currentTime = 0;
        voice.play().catch(e => console.log("语音播放失败:", e));

        voice.onended = function () {
            if (bgm) bgm.volume = 0.4; // 恢复背景音
        };
    }
}

/**
 * ==========================================
 * 主逻辑执行
 * ==========================================
 */
document.addEventListener('DOMContentLoaded', function () {
    console.log("🚀 回忆列车·最终完美修复版 (Momoka回归) 启动...");

    // --- 1. 基础元素获取 ---
    const bgMusic = document.getElementById('bg-music');
    const btnSound = document.getElementById('btn-sound');
    const startSound = document.getElementById('start-sound'); // Momoka
    const scratchSound = document.getElementById('scratch-sound');
    const stoneSound = document.getElementById('stone-sound');
    const bubbleSound = document.getElementById('bubble-sound');
    const popSound = document.getElementById('pop-sound');
    const firecrackerSound = document.getElementById('firecracker-sound');
    
    const musicBtn = document.getElementById('music-btn');
    const startScreen = document.getElementById('start-screen');
    const startBtn = document.getElementById('start-btn');
    const timelineTimers = [];

    // --- 2. 音量均衡控制 ---
    if (bgMusic) bgMusic.volume = 0.4;       
    if (startSound) startSound.volume = 1.0; 
    if (btnSound) btnSound.volume = 1.0;
    if (bubbleSound) bubbleSound.volume = 0.8;
    if (stoneSound) stoneSound.volume = 1.0; 
    if (scratchSound) scratchSound.volume = 0.6;

    // --- 3. Swiper 初始化 ---
    const swiper = new Swiper(".mySwiper", {
        direction: "vertical",
        speed: 800,
        mousewheel: true,
        touchStartPreventDefault: false,
        effect: "creative",
        creativeEffect: {
            prev: { shadow: true, translate: [0, "-20%", -500], opacity: 0 },
            next: { translate: [0, "100%", 0], scale: 1.2, opacity: 0 },
        },
        on: {
            slideChangeTransitionStart: function () {
                clearTimelineAni();
                const activeSlide = this.slides[this.activeIndex];

                // 播放通用动画
                activeSlide.querySelectorAll('.ani').forEach(el => {
                    el.style.visibility = 'visible';
                    el.style.opacity = '1';
                    const effect = el.getAttribute('swiper-animate-effect');
                    if (effect) el.classList.add('animate__animated', effect);
                });

                // 时间轴页逻辑
                if (activeSlide.classList.contains('timeline-slide')) {
                    activeSlide.scrollTop = 0;
                    playTimelineAnimation(this);
                    setTimeout(updateTimelineArrows, 150);
                }
                // 草莓页逻辑
                if (activeSlide.classList.contains('strawberry-theme')) {
                    activeSlide.scrollTop = 0;
                    setTimeout(updateStrawberryArrows, 150);
                }
                
                // 触发重绘以修复箭头
                setTimeout(() => {
                    window.dispatchEvent(new Event('resize'));
                    if (typeof updateTimelineArrows === 'function') updateTimelineArrows();
                    if (typeof updateStrawberryArrows === 'function') updateStrawberryArrows();
                }, 100);
            }
        }
    });

    // --- 4. 哥特启动页逻辑 ---
    const typewriterText = document.getElementById('typewriter-text');
    const card = document.querySelector('.gothic-card');
    const fadeInText = document.querySelector('.fade-in-text');
    const squirrel = document.getElementById('flying-squirrel');

    // 打字机
    function typeWriter(text, element, speed = 150) {
        let i = 0;
        element.innerHTML = "";
        function type() {
            if (i < text.length) {
                element.innerHTML += text.charAt(i);
                i++;
                setTimeout(type, speed);
            } else {
                setTimeout(() => {
                    if(fadeInText) fadeInText.classList.add('show');
                }, 500);
            }
        }
        type();
    }

    // 页面加载序列
    setTimeout(() => {
        if(card) card.classList.add('visible');
        setTimeout(() => {
            if(typewriterText) typeWriter("好久不见，海海。", typewriterText);
        }, 800);
    }, 500);

    // ★★★ 按钮点击逻辑 (Momoka 回归！) ★★★
    startBtn.addEventListener('click', function () {
        // 1. 播放点击音效
        if (btnSound) { btnSound.currentTime = 0; btnSound.play().catch(() => {}); }
        
        // 2. ★★★ 关键修复：播放 Momoka 叫声 (startSound) ★★★
        if (startSound) { startSound.currentTime = 0; startSound.play().catch(() => {}); }

        // 3. 播放刮擦声
        if (scratchSound) { scratchSound.currentTime = 0; scratchSound.play().catch(() => {}); }

        // 4. 播放BGM
        if (bgMusic) bgMusic.play().then(() => { musicBtn.style.display = 'flex'; }).catch(() => {});
        
        // 5. 小飞鼠动画
        if(squirrel) {
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
        }, 600); 
    });


    // --- 5. 墓碑彩蛋逻辑 ---
    const myAvatarWrapper = document.querySelector('.voice-avatar'); 
    let avatarClickCount = 0;

    if (myAvatarWrapper) {
        myAvatarWrapper.addEventListener('click', function(e) {
            e.stopPropagation(); 
            
            avatarClickCount++;
            console.log("头像点击:", avatarClickCount);

            if (avatarClickCount >= 10) {
                // 播放咚的一声
                if (stoneSound) {
                    stoneSound.currentTime = 0;
                    stoneSound.play().catch(err => console.log("Stone播放失败", err));
                }
                // 弹出气泡
                showTombstoneEgg(myAvatarWrapper);
                // 重置计数
                avatarClickCount = 0; 
            }
        });
    }

    function showTombstoneEgg(targetElement) {
        const bubble = document.createElement('div');
        bubble.className = 'egg-bubble';
        bubble.textContent = '不许打扰我，我只是个墓碑。。。。';
        targetElement.appendChild(bubble);
        bubble.addEventListener('animationend', function() {
            bubble.remove();
        });
    }


    // --- 6. 其他页面的交互逻辑 ---

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

    // 回到起点
    const goHomeBtn = document.getElementById('go-home');
    if (goHomeBtn) {
        goHomeBtn.addEventListener('click', () => {
            swiper.slideTo(0, 800);
            document.querySelectorAll('.scroll-item').forEach(i => i.classList.remove('active'));
        });
    }

    // 灯箱
    const lightbox = document.getElementById('lightbox-overlay');
    const lightboxImg = document.getElementById('lightbox-img');
    document.body.addEventListener('click', function (e) {
        const target = e.target;
        if (target.classList.contains('bubble') || target.classList.contains('moment-img')) {
            if (btnSound) { btnSound.currentTime = 0; btnSound.play().catch(() => {}); }
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

    // 动画辅助
    function clearTimelineAni() {
        timelineTimers.forEach(id => clearTimeout(id));
        document.querySelectorAll('.timeline-item').forEach(item => item.classList.remove('show'));
    }

    function playTimelineAnimation(swiperInstance) {
        const items = swiperInstance.slides[swiperInstance.activeIndex].querySelectorAll('.timeline-item');
        items.forEach((item, index) => {
            const tId = setTimeout(() => {
                item.classList.add('show');
                if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => {}); }
            }, 600 * (index + 1));
            timelineTimers.push(tId);
        });
    }

    // 鞭炮特效
    const finalBubble = document.getElementById('final-bubble');
    const timelineSlideEl = document.querySelector('.blue-diary-theme');
    
    if (finalBubble && timelineSlideEl) {
        finalBubble.addEventListener('click', function (e) {
            e.stopPropagation();
            if (firecrackerSound) {
                firecrackerSound.currentTime = 0;
                firecrackerSound.play().catch(() => {});
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
            fc.addEventListener('animationend', function () { fc.remove(); });
        });
    }

    // 紫心 + Pop音效
    const devilAvatar = document.getElementById('devil-avatar');
    const devilSlide = document.querySelector('.devil-theme');
    
    if (devilAvatar && devilSlide) {
        devilAvatar.addEventListener('click', function (e) {
            e.stopPropagation();
            
            // 播放 Pop 音效
            if (popSound) {
                popSound.currentTime = 0;
                popSound.volume = 1.0;
                popSound.play().catch(() => {});
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
            h.addEventListener('animationend', function () { h.remove(); });
        });
    }

    // --- 7. 上下滚动箭头逻辑 (封装函数) ---
    function initArrowLogic(slideSelector, downId, upId) {
        const slide = document.querySelector(slideSelector);
        const downBtn = document.getElementById(downId);
        const upBtn = document.getElementById(upId);
        let clickLock = false;

        function updateArrows() {
            if (!slide || !downBtn || !upBtn) return;
            if (clickLock) return;
            const isActive = slide.classList.contains('swiper-slide-active');
            if (!isActive) {
                downBtn.classList.remove('visible');
                upBtn.classList.remove('visible');
                return;
            }
            const canScroll = slide.scrollHeight > slide.clientHeight;
            if (!canScroll) {
                downBtn.classList.remove('visible');
                upBtn.classList.remove('visible');
                return;
            }
            const maxScroll = slide.scrollHeight - slide.clientHeight;
            const atTop = slide.scrollTop <= 10;
            const atBottom = slide.scrollTop >= maxScroll - 10;

            if (atTop) {
                downBtn.classList.add('visible');
                upBtn.classList.remove('visible');
            } else if (atBottom) {
                downBtn.classList.remove('visible');
                upBtn.classList.add('visible');
            } else {
                downBtn.classList.remove('visible');
                upBtn.classList.remove('visible');
            }
        }

        if (slide && downBtn && upBtn) {
            slide.addEventListener('scroll', updateArrows);
            window.addEventListener('resize', updateArrows);
            
            if (slideSelector.includes('blue')) window.updateTimelineArrows = updateArrows;
            if (slideSelector.includes('strawberry')) window.updateStrawberryArrows = updateArrows;

            downBtn.addEventListener('click', function () {
                if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => {}); }
                clickLock = true;
                downBtn.classList.remove('visible');
                upBtn.classList.add('visible');
                slide.scrollTo({ top: slide.scrollHeight, behavior: 'smooth' });
                setTimeout(() => { clickLock = false; updateArrows(); }, 500);
            });

            upBtn.addEventListener('click', function () {
                if (bubbleSound) { bubbleSound.currentTime = 0; bubbleSound.play().catch(() => {}); }
                clickLock = true;
                upBtn.classList.remove('visible');
                downBtn.classList.add('visible');
                slide.scrollTo({ top: 0, behavior: 'smooth' });
                setTimeout(() => { clickLock = false; updateArrows(); }, 500);
            });
        }
    }

    initArrowLogic('.blue-diary-theme', 'timeline-arrow-down', 'timeline-arrow-up');
    initArrowLogic('.strawberry-theme', 'strawberry-arrow-down', 'strawberry-arrow-up');

});