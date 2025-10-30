const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 600;

let enemies = [];
let player = { x: canvas.width / 2, y: canvas.height - 50, width: 50, height: 50 };
let score = 0;
let gameOver = false;
let lastTime = Date.now();
let enemyInterval = 1000; // 时间间隔，单位毫秒，控制敌人生成速度
let enemySpeed = 2; // 敌人移动速度
let bulletSpeed = 10; // 子弹速度
let bullets = []; // 子弹数组

function init() {
    player.x = canvas.width / 2; // 重置玩家位置到中间
}

function spawnEnemy() {
    enemies.push({ x: Math.random() * (canvas.width - 50), y: 0, width: 50, height: 50 });
}

function update(deltaTime) {
    if (Date.now() - lastTime > enemyInterval && !gameOver) {
        spawnEnemy();
        lastTime = Date.now(); // 重置时间戳为当前时间，以便下一次生成敌人时计算时间间隔
    }
    enemies.forEach((enemy, index) => {
        enemy.y += enemySpeed * deltaTime; // 根据时间差更新敌人位置，实现平滑移动效果
        if (enemy.y > canvas.height) { // 如果敌人超出屏幕底部，则从数组中移除该敌人（重生）
            enemies.splice(index, 1);
        } else { // 检查碰撞和射击逻辑（简化处理）
            bullets.forEach((bullet, bIndex) => {
                if (bullet.x > enemy.x && bullet.x < enemy.x + enemy.width && bullet.y > enemy.y && bullet.y < enemy.y + enemy.height) { // 检查是否击中敌人
                    bullets.splice(bIndex, 1); // 移除击中的子弹（简化处理，实际游戏中可能需要更复杂的碰撞检测）
                    enemies.splice(index, 1); // 移除敌人，并增加分数（简化处理）
                    score++; // 增加分数，实际应用中可能需要更复杂的计分系统（如根据击中位置给予不同分数）
                } else if (bullet.y < 0) { // 如果子弹超出屏幕顶部，则移除该子弹（简化处理）
                    bullets.splice(bIndex, 1); // 从数组中移除子弹以避免无限子弹问题（实际应用中可能需要更复杂的子弹管理）
                } else { // 更新子弹位置（简化处理）
                    bullet.y -= bulletSpeed * deltaTime; // 根据时间差更新子弹位置，实现平滑移动效果（实际应用中可能需要根据不同角度调整速度）但在此简化处理中将子弹视为垂直向下移动的直线段））））））
