'use strict';

/*
**  ОПИСАНИЕ СУЩЕСТВУЮЩИХ ЭЛЕМЕНТОВ
**  константы, функции и классы
*/

// CANVAS
// vw - ширина окна, vcx - центр по ширине окна;
// vh - высота окна, vcy - центр по высоте окна;
// ctx - контекст для отрисовки.

// ИЗОБРАЖЕНИЯ и ЗВУКОВЫЕ ЭФФЕКТЫ
// IMG['file_name.png'];
// SE['file_name.mp3'];

// УПРАВЛЕНИЕ
// KEY.space (true / false);
// CURSOR.isOnClick (true / false);
// CURSOR.x, CURSOR.y;

// КОНСТАНТЫ
// const _2PI = Math.PI * 2;
// const _RAD = Math.PI / 180;

// ФУНКЦИИ
// getExistsObjectsFromArr(objectsArray) (удаляем object, если: object.isExist = false)
// turnTo( object, target, turnSpeed )
// getDistance(object, target) -> возвращает расстояние в пикселях между object и target
// moveTo( object, target, speed )
// playSound( soundName )

// КЛАССЫ

// class Text(text = '', x = 0, y = 0, size = 12, color = '#00ff00')
// this.render(text);
// this.draw();

// class Sprite(imageName, x, y)
// this.draw()

// class SpriteSheet(imageName, x, y, fw, fh, frames, fps = 60)
// this.drawWithAnimation(dt) | this.draw()

// ИГРОВОЙ ЦИКЛ
// gameLoop( deltaTime )

/****************************/

// Движущееся фоновое изображение
class ScrollBackground {
    constructor (imageName, w, h, scrollSpeed) {
        this.img = IMG[imageName];
        this.x = Math.floor((vw -  w) / 2) ;
        this.y1 = -h;
        this.y2 = 0;
        this.h = h;
        this.scrollSpeed = scrollSpeed;
    }

    update(dt) {
        let speed = this.scrollSpeed * dt;
        this.y1 += speed;
        this.y2 += speed;
        if (this.y2 >= this.h) {
            this.y1 = -this.h;
            this.y2 = 0;
        }
        ctx.drawImage(this.img, this.x, this.y1);
        ctx.drawImage(this.img, this.x, this.y2);
    }
}

class Bg extends Sprite {
    constructor(imageName, x, y, speed) {
        super(imageName, x, y);
        this.speed = speed;
    }
    update(dt) {
        this.y += this.speed*dt;
        if (this.y - this.hh>vh)this.y = -vh;
        this.draw();
    }
}

class Player extends SpriteSheet {
    constructor(){
        super('player_74x100px_16frames.png', vcx, vcy, 74, 100, 16, 60);
        this.hp  = 100;
        this.score = 0;
        this.speed = 0.5;
        this.size = 36;
        this.bulletsArr = [];
        this.shutTimeout = 1000;
        this.shutTime = this.shutTimeout;
    }
    update(dt) {
        moveTo(this, gameCursor, this.speed*dt );
        this.drawWithAnimation(dt);
        if (CURSOR.isOnClick) playSound('se_laser_shut.mp3');

        this.shutTime-=dt;
        if (this.shutTime<=0){
            this.shutTime+=this.shutTimeout;
            let bullet = new PlayerBullet(this.x,this.y);
            this.bulletsArr.push(bullet);
            playSound('se_laser_shut.mp3');
        }

        for(let i =0; i<this.bulletsArr.length; i++) this.bulletsArr[i].update(dt);
        this.bulletsArr = getExistsObjectsFromArr(this.bulletsArr);
    }

    addDamage(damage){
        this.hp -= damage;
        if(this.hp<0)this.hp=0;
        if(this.hp===0){
            ex.push(new Explosion(this.x, this.y));
            playSound('se_explosion.mp3');
            this.y = -vh;
        }
        playerHp.render(`HP:${player.hp}%`);
    }
}



class PlayerBullet extends Sprite{ 
    constructor(x, y){
        super('player_bullet_10x40px.png', x, y);
        this.speed = 1;
        this.isExist = true;
    }
    update(dt) {
        this.y-=this.speed*dt;
        if (this.y+20<0) this.isExist=false;
        else this.draw();
    }
}

class Asteroid extends SpriteSheet{
    constructor(x, y){
        super('asteroid_white_90x108px_29frames.png', x, y, 90, 108, 29, 60);
        this.direction = Math.random()*_2PI;
        this.speed = 0.2+Math.random()*0.2;
        this.sideSpeed = -0.1+0.2*Math.random();
        this.size = 45;
        this.isExist=true
    }
    update(dt) {
        this.y += this.speed*dt;
        this.x += this.sideSpeed*dt;

        if (this.y>vh) this.isExist = false;

        for(let i =0; i<player.bulletsArr.length; i++){
            if(getDistance(this, player.bulletsArr[i])<this.size){
                this.isExist = false;
                player.bulletsArr[i].isExist = false;
                maxAsteroids += 1;
                ex.push(new Explosion(this.x, this.y));
                playSound('se_explosion.mp3');
                player.score+=5;
                playerScore.render(`SCORE:${player.score}`)
            }
        }

        if(getDistance(this, player)<this.size+player.size){
            this.isExist = false;
            player.addDamage(10) ;
            ex.push(new Explosion(this.x, this.y));
            playSound('se_explosion.mp3');
            
        }


        this.drawWithAnimation(dt);
    }
}

class Explosion extends SpriteSheet{
    constructor(x,y){
        super('explosion_200x200px_16frames.png', x, y, 200, 200, 16, 60);
        this.isExist = true;

    }
    update(dt){
        if (this.frame === 15) this.isExist = false;
        this.drawWithAnimation(dt);
        
    }
}

let ex = []

let maxAsteroids = 5;
let asteroidsArr = [];
function addAsteroid(){
    let x=Math.random()*vw;
    let y = -110;
    let a = new Asteroid(x, y);
    asteroidsArr.push(a);
}


const planet = new Bg ('planets_920x760px.png', vcx, vcy, 0.1);
const blackHoleRight = new Bg ('black_hole_right_320x320px.png', vw-160, -vh, 0.08);
const player = new Player();
const playerHp = new Text(`HP:${player.hp}%`, vw-150, vh-30,25, '#00ff00')
const playerScore = new Text(`SCORE:${player.score}`, 5, vh-30,25,  '#00ff00')

// Игровой курсор
class GameCursor extends SpriteSheet {
    constructor() {
        // class SpriteSheet(imageName, x, y, fw, fh, frames, fps = 60)
        super('player_cursor_48x48px_16frames.png', vcx, vcy, 48, 48, 16, 15);
    }

    update(dt) {
        this.x = CURSOR.x;
        this.y = CURSOR.y;
        this.drawWithAnimation(dt);
    }
}

// ФОНЫ
//               class ScrollBackground(imageName, w, h, scrollSpeed)
const background = new ScrollBackground('scrolling_bg_2000x3400px.png', 2000, 3400, 0.01);

// ИГРОВОЙ КУРСОР
//               class GameCursor()
const gameCursor = new GameCursor();

// ИГРОВОЙ ЦИКЛ
function gameLoop(dt) {
    // обновляем основной фон и дополнительные фоны
    background.update(dt);
    planet.update(dt);
    blackHoleRight.update(dt);

    // обновляем игровые объекты
    gameCursor.update(dt);
    
    for(let i = 0; i<asteroidsArr.length; i++) asteroidsArr[i].update(dt);
    asteroidsArr = getExistsObjectsFromArr(asteroidsArr);
    if(asteroidsArr.length<maxAsteroids)addAsteroid();


    if(player.hp>0)player.update(dt);

    for(let i = 0; i<ex.length; i++) ex[i].update(dt);
    ex = getExistsObjectsFromArr(ex);

    playerHp.draw();

    playerScore.draw();
}