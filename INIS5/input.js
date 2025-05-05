const targets = document.querySelectorAll('.target');

let currentDragged = null;
let isSticky = false;
let initialPosition = null;

let onMouseMove = null;
let onMouseClick = null;

function getTouchPos(e) {
  const touch = e.touches[0] || e.changedTouches[0];
  return { x: touch.clientX, y: touch.clientY };
}

function startDrag(event, target, isTouch = false) {
  if (isSticky) return;
  currentDragged = target;
  initialPosition = { top: target.offsetTop, left: target.offsetLeft };

  const pos = isTouch ? getTouchPos(event) : { x: event.clientX, y: event.clientY };
  const offsetX = pos.x - target.offsetLeft;
  const offsetY = pos.y - target.offsetTop;

  const moveHandler = (e) => {
    const movePos = isTouch ? getTouchPos(e) : { x: e.clientX, y: e.clientY };
    if (currentDragged) {
      currentDragged.style.left = `${movePos.x - offsetX}px`;
      currentDragged.style.top = `${movePos.y - offsetY}px`;
    }
  };

  const upHandler = () => {
    currentDragged = null;
    document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', moveHandler);
    document.removeEventListener(isTouch ? 'touchend' : 'mouseup', upHandler);
  };

  document.addEventListener(isTouch ? 'touchmove' : 'mousemove', moveHandler);
  document.addEventListener(isTouch ? 'touchend' : 'mouseup', upHandler);
}

function stickToMouse(event, target, isTouch = false) {
  if (isSticky) return;
  isSticky = true;
  currentDragged = target;
  target.style.backgroundColor = 'green';

  onMouseMove = (e) => {
    const pos = isTouch ? getTouchPos(e) : { x: e.clientX, y: e.clientY };
    if (isSticky && currentDragged) {
      currentDragged.style.left = `${pos.x}px`;
      currentDragged.style.top = `${pos.y}px`;
    }
  };

  onMouseClick = (e) => {
    const endPos = isTouch ? getTouchPos(e) : { x: e.clientX, y: e.clientY };
    isSticky = false;
    if (currentDragged) currentDragged.style.backgroundColor = 'red';
    currentDragged = null;

    document.removeEventListener(isTouch ? 'touchmove' : 'mousemove', onMouseMove);
    document.removeEventListener(isTouch ? 'touchend' : 'click', onMouseClick);
  };

  document.addEventListener(isTouch ? 'touchmove' : 'mousemove', onMouseMove);
  document.addEventListener(isTouch ? 'touchend' : 'click', onMouseClick);
}

function resetPosition(event) {
  if ((event.key === 'Escape' || (event.touches && event.touches.length > 1)) && currentDragged) {
    currentDragged.style.left = `${initialPosition.left}px`;
    currentDragged.style.top = `${initialPosition.top}px`;
    currentDragged.style.backgroundColor = 'red';
    currentDragged = null;
    isSticky = false;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('click', onMouseClick);
  }
}

// Tap detection (touchstart + touchend in same spot)
let lastTouchTime = 0;
let lastTouchCoords = null;

function handleTouchStart(event, target) {
  if (event.touches.length > 1) {
    resetPosition(event);
    return;
  }

  const now = Date.now();
  const pos = getTouchPos(event);

  if (now - lastTouchTime < 300 &&
      lastTouchCoords &&
      Math.abs(pos.x - lastTouchCoords.x) < 10 &&
      Math.abs(pos.y - lastTouchCoords.y) < 10) {
    stickToMouse(event, target, true);
  } else {
    startDrag(event, target, true);
  }

  lastTouchTime = now;
  lastTouchCoords = pos;
}

targets.forEach((target) => {
  target.addEventListener('mousedown', (event) => startDrag(event, target));
  target.addEventListener('dblclick', (event) => stickToMouse(event, target));

  target.addEventListener('touchstart', (event) => handleTouchStart(event, target));
});

document.addEventListener('keydown', resetPosition);
document.addEventListener('touchstart', resetPosition, { passive: false });
