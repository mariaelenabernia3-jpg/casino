:root {
    --primary-green: #00f9a4;
    --dark-background: #0a0a0a;
    --text-color: #EAEAEA;
}
body { margin: 0; font-family: 'Roboto', sans-serif; background-color: var(--dark-background); color: var(--text-color); display: flex; flex-direction: column; justify-content: center; align-items: center; min-height: 100vh; overflow: hidden; padding: 20px; box-sizing: border-box; }
.back-to-lobby-link { position: fixed; top: 25px; left: 25px; z-index: 100; transition: transform 0.2s ease; }
.back-to-lobby-link:hover { transform: scale(1.15); }
.back-to-lobby-link svg { width: 32px; height: 32px; stroke: var(--primary-green); stroke-width: 2.5; }
.roulette-container { text-align: center; }
.title { font-family: 'Cinzel', serif; font-size: 3em; color: var(--primary-green); text-shadow: 0 0 15px rgba(0, 249, 164, 0.5); }
.wheel-wrapper { position: relative; width: 400px; height: 400px; margin: 30px auto; max-width: 100%; }
.wheel-pointer { position: absolute; top: -15px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 20px solid transparent; border-right: 20px solid transparent; border-top: 30px solid #fff; z-index: 10; }
.wheel { position: relative; width: 100%; height: 100%; border-radius: 50%; border: 8px solid #333; background: conic-gradient(#b8c, #8c8, #c88, #88c, #8c8, #c8c, #cc8, #8cc, #b8c); overflow: hidden; transition: transform 6s cubic-bezier(0.25, 1, 0.5, 1); }
.prize { position: absolute; width: 50%; height: 50%; top: 0; left: 50%; transform-origin: 0% 100%; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 1.2em; }
.prize span { display: block; transform: rotate(45deg); text-shadow: 1px 1px 2px #000; }
.spin-button { background: linear-gradient(145deg, var(--primary-green), #00c783); color: #05140d; border: none; padding: 15px 50px; font-size: 1.5em; font-weight: bold; border-radius: 8px; cursor: pointer; transition: all 0.3s ease;}
.spin-button:hover:not(:disabled) { transform: scale(1.05); box-shadow: 0 5px 20px rgba(0, 249, 164, 0.3); }
.spin-button:disabled { background: #555; color: #999; cursor: not-allowed; }
.timer-container { font-size: 1.2em; }
.timer { font-size: 2em; font-weight: bold; color: var(--primary-green); letter-spacing: 2px; }
.action-area { margin-top: 20px; min-height: 100px; display: flex; justify-content: center; align-items: center; }

@media (max-width: 768px) {
    .title { font-size: 2em; }
    .wheel-wrapper {
        width: 300px;
        height: 300px;
        margin: 15px auto;
    }
    .wheel-pointer {
        border-left-width: 15px;
        border-right-width: 15px;
        border-top-width: 22px;
        top: -12px;
    }
    .spin-button { font-size: 1.2em; padding: 12px 30px; }
    .timer { font-size: 1.5em; }
}
