var player;
var fireSprite;
var diamondSprite;
var hartSprite;
var cursors;
var walkFX;
var deadFX;

function preload() {
	//https://opengameart.org/content/sky-backdrop // achtergrond
	this.load.image('sky', 'assets/sky.png');

	//https://opengameart.org/content/rpg-character //character
	this.load.spritesheet('dude', 'assets/character.png', {
		frameWidth: 41.3333333,
		frameHeight: 36
	});

	this.load.spritesheet('fire', 'assets/fire.png', {
		frameWidth: 94.5,
		frameHeight: 192
	});

	// extra leven
	this.load.image('extralive', 'assets/hart.png');

	// punten
	this.load.image('diamonds', 'assets/diamond.png');

	//https://kenney.nl/assets/platformer-art-extended-tileset // tiles voor het level
	this.load.image('tileset', 'assets/tileset.png');

	// het level gemaakt in tiled
	this.load.tilemapTiledJSON('level', 'assets/level.json'); // het level gemaakt in tiled

	//https://opengameart.org/content/grass-foot-step-sounds-yo-frankie audio voor het lopen
	this.load.audio('walk', [ 'assets/walking1.mp3', 'assets/walking1.ogg' ]);
	//https://opengameart.org/content/fire-evil-spell audio voor doodgaan aan de vuurballen

	/////////////////////////// er is nog geen dead sound. Dus deze toevoegen om dit te fixen /////////////////////////////////////////////////////////////////////
	// this.load.audio('dead', [ 'assets/fire1.mp3', 'assets/fire1.ogg' ]);
}

function create() {
	this.score = 0;
	this.lives = 3;

	cursors = this.input.keyboard.createCursorKeys();

	//voor de achtergrond
	this.add.image(840, 490, 'sky');

	//de character zelf
	player = this.physics.add.sprite(840, 880, 'dude');

	//https://phaser.io/examples/v3/view/physics/arcade/collision-direction voor de bewegende character tijdens het lopen
	this.anims.create({
		key: 'walk-left',
		frames: this.anims.generateFrameNumbers('dude', { start: 9, end: 11 }),
		frameRate: 12,
		repeat: -1
	});
	this.anims.create({
		key: 'turn',
		frames: [ { key: 'dude', frame: 1 } ],
		frameRate: 20
	});
	this.anims.create({
		key: 'walk-right',
		frames: this.anims.generateFrameNumbers('dude', { start: 3, end: 5 }),
		frameRate: 12,
		repeat: -1
	});

	//audio voor lopen
	walkFX = this.sound.add('walk');

	//https://phaser.discourse.group/t/reset-position-on-falling-sprites/1575/6 voor de vuurballen(enemys)
	fireSprite = this.physics.add.group({
		runChildUpdate: true
	});

	fireSprite.createMultiple({
		key: 'fire',
		frame: Phaser.Utils.Array.NumberArray(0, 5),
		randomFrame: true,
		repeat: 1
	});

	fireSprite.children.iterate((child) => {
		let y = Phaser.Math.Between(-200, -1500);
		let x = Phaser.Math.Between(200, 1500);

		child.setY(y);
		child.setX(x);
		child.setMaxVelocity(200);

		child.update = function() {
			if (this.y > 980) {
				this.y = 0;
			}
		};
	});
	//de sound als een vuurbal de character raakt

	/////////////////////////// er is nog geen dead sound. Dus deze toevoegen om dit te fixen /////////////////////////////////////////////////////////////////////
	// fireFX = this.sound.add('dead');core, { fontSize: '32px', fill: '#000' });


	// http://phaser.io/examples/v3/view/scalemanager/full-screen-game voor de diamanten(punten)
	diamondSprite = this.physics.add.group({
		key: 'diamonds',
		repeat: 20,
		setXY: { x: 25, y: 400, stepX: 75 }
	});
	//om de diamanten een bounce te geven bij de landing
	diamondSprite.children.iterate(function(child) {
		child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
	});

	// http://phaser.io/examples/v3/view/scalemanager/full-screen-game voor de punten/score
	this.scoreText = this.add.text(85, 150, 'score: ' + this.score, { fontSize: '32px', fill: '#000' });

	this.player = player;

	//voor de extra levens
	hartSprite = this.physics.add.group({
		key: 'extralive',
		repeat: 2,
		setXY: { x: 400, y: 150, stepX: 400 }
	});

	//om de harten een bounce te geven bij de landing
	hartSprite.children.iterate(function(child) {
		child.setBounceY(Phaser.Math.FloatBetween(0.2, 0.4));
	});
	// voor het aantal levens.
	this.livesText = this.add.text(1440, 150, 'lives: ' + this.lives, { fontSize: '32px', fill: '#000' });

	//voor het level
	var map = this.make.tilemap({
		key: 'level'
	});

	//zorgt ervoor dat de goede tileset word gebruikt om de map te maken.
	var tileset = map.addTilesetImage('tileset');

	//zorgt voor de map zelf en dat hij zichtbaar word.
	var platforms = map.createStaticLayer('platforms', tileset, 0, 0);

	// collision tussen player en map
	platforms.setCollisionByProperty({ collidable: true });
	this.physics.add.collider(player, platforms);
	this.physics.add.collider(diamondSprite, platforms);
	this.physics.add.collider(hartSprite, platforms);
	this.physics.add.collider(player, fireSprite);

	this.physics.add.overlap(player, diamondSprite, collectDiamond, null, this);
	this.physics.add.overlap(player, hartSprite, collectLives, null, this);

	//voor damge tussen player en vuurbal
	//this.physics.add.overlap(dudeSprite, fireSprite, doDamage, process, this);
}

function update() {
	player.body.velocity.x = 0;
	//https://phaser.io/examples/v3/view/physics/arcade/collision-direction bewegende en lopende character

	if (cursors.left.isDown) {
		player.setVelocityX(-200);
		player.anims.play('walk-left', true);
		walkFX.play();
	} else if (cursors.right.isDown) {
		player.setVelocityX(180);
		player.anims.play('walk-right', true);
		walkFX.play();
	} else {
		player.setVelocityX(0);
		player.anims.play('turn');
	}
	if (cursors.up.isDown && player.body.onFloor()) {
		player.setVelocityY(-245);
	}
}

// de diamonds oppakken en de score: aanpassen
function collectDiamond (player, diamondSprite) {
	diamondSprite.disableBody(true, true);

	this.score += 10;	
	this.scoreText.setText('Score: ' + this.score);
	console.log('Diamond collected')
}

//de harten oppakken en de lives: aanpassen
function collectLives(player, hartSprite) {
	hartSprite.disableBody(true, true);

	this.lives +=1;
	this.livesText.setText('lives: ' + this.lives);
	console.log('Live collected')
}

var config = {
	type: Phaser.AUTO,
	width: 1680,
	height: 980,
	physics: {
		default: 'arcade',
		arcade: {
			gravity: {
				y: 200
			}
		}
	},
	scene: {
		preload: preload,
		create: create,
		update: update
	}
};

var game = new Phaser.Game(config);
