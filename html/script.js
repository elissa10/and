// script.js 파일

let character;
let floor;
let gameContainer;

let floorHeight;
let containerHeight;

let characterPositionBottom;
let characterVelocityY = 0;

const gravity = 0.5;
const jumpStrength = -12;

let isJumping = false;

function updateCharacterPosition() {
  if (character) {
    character.style.bottom = characterPositionBottom + 'px';
  }
}

function gameLoop() {
  characterVelocityY += gravity;
  characterPositionBottom += characterVelocityY;

  if (characterPositionBottom <= floorHeight) {
    characterPositionBottom = floorHeight;
    characterVelocityY = 0;
    isJumping = false;
  }

  updateCharacterPosition();
  requestAnimationFrame(gameLoop);
}

// DOMContentLoaded 이벤트: HTML 문서가 완전히 로드된 후에 스크립트 실행 (수정 부분)
// 이 부분을 통해 script.js 파일이 HTML 요소들을 확실하게 찾을 수 있도록 합니다.
document.addEventListener('DOMContentLoaded', () => {
    character = document.querySelector('.character');
    floor = document.querySelector('.floor');
    gameContainer = document.querySelector('.game-container');

    // 게임 요소가 제대로 로드되었는지 확인
    if (!character || !floor || !gameContainer) {
        console.error("게임 요소를 찾을 수 없습니다. HTML 구조를 확인해주세요.");
        return; // 요소가 없으면 더 이상 진행하지 않음
    }

    floorHeight = floor.offsetHeight;
    containerHeight = gameContainer.offsetHeight;

    characterPositionBottom = floorHeight;

    document.addEventListener('keydown', (event) => {
        if (event.code === 'Space' && !isJumping) {
            isJumping = true;
            characterVelocityY = jumpStrength;
        }
    });

    updateCharacterPosition();
    gameLoop();
});
