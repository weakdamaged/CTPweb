// Получаем все цели
const targets = document.querySelectorAll('.target');

let currentDragged = null;
let isSticky = false;
let initialPosition = null;
let isResizing = false;
let minSize = 50; // минимальный размер в px

let onMoveHandler = null;
let onEndHandler = null;

function getTouchPos(e) {
  const touch = e.touches[0] || e.changedTouches[0];
  return { x: touch.clientX, y: touch.clientY };
}

function startDrag(pos, target) {
  if (isSticky || isResizing) return;
  currentDragged = target;
  initialPosition = { top: target.offsetTop, left: target.offsetLeft };

  const offsetX = pos.x - target.offsetLeft;
  const offsetY = pos.y - target.offsetTop;

  onMoveHandler = (e) => {
    const movePos = e.type.includes('touch') ? getTouchPos(e) : { x: e.clientX, y: e.clientY };
    if (currentDragged) {
      currentDragged.style.left = `${movePos.x - offsetX}px`;
      currentDragged.style.top = `${movePos.y - offsetY}px`;
    }
  };

  onEndHandler = () => {
    currentDragged = null;
    document.removeEventListener('mousemove', onMoveHandler);
    document.removeEventListener('mouseup', onEndHandler);
    document.removeEventListener('touchmove', onMoveHandler);
    document.removeEventListener('touchend', onEndHandler);
  };

  document.addEventListener('mousemove', onMoveHandler);
  document.addEventListener('mouseup', onEndHandler);
  document.addEventListener('touchmove', onMoveHandler);
  document.addEventListener('touchend', onEndHandler);
}

function enableSticky(pos, target) {
  isSticky = true;
  currentDragged = target;
  target.style.backgroundColor = 'green';

  onMoveHandler = (e) => {
    const movePos = e.type.includes('touch') ? getTouchPos(e) : { x: e.clientX, y: e.clientY };
    if (currentDragged) {
      currentDragged.style.left = `${movePos.x}px`;
      currentDragged.style.top = `${movePos.y}px`;
    }
  };

  document.addEventListener('mousemove', onMoveHandler);
  document.addEventListener('touchmove', onMoveHandler);
}

function disableSticky() {
  if (currentDragged) {
    currentDragged.style.backgroundColor = 'red';
  }
  isSticky = false;
  currentDragged = null;
  document.removeEventListener('mousemove', onMoveHandler);
  document.removeEventListener('touchmove', onMoveHandler);
}

function resetPosition() {
  if (currentDragged && initialPosition) {
    currentDragged.style.left = `${initialPosition.left}px`;
    currentDragged.style.top = `${initialPosition.top}px`;
    currentDragged.style.backgroundColor = 'red';
    currentDragged = null;
    isSticky = false;

    document.removeEventListener('mousemove', onMoveHandler);
    document.removeEventListener('touchmove', onMoveHandler);
  }
}

let lastTapTime = 0;
let lastTapPos = null;

function handleTouchStart(event) {
  if (event.touches.length > 1) {
    resetPosition();
    return;
  }

  const pos = getTouchPos(event);
  const now = Date.now();

  const tappedTarget = [...targets].find(t => t.contains(event.target));

  // Быстрый тап (отключает sticky)
  if (
    now - lastTapTime < 300 &&
    lastTapPos &&
    Math.abs(pos.x - lastTapPos.x) < 10 &&
    Math.abs(pos.y - lastTapPos.y) < 10
  ) {
    disableSticky();
  } else if (isSticky) {
    // sticky: двигаем текущий div
    if (currentDragged) {
      currentDragged.style.left = `${pos.x}px`;
      currentDragged.style.top = `${pos.y}px`;
    }
  } else if (tappedTarget) {
    // старт обычного перетаскивания
    startDrag(pos, tappedTarget);
  }

  lastTapTime = now;
  lastTapPos = pos;
}

function handleTouchEnd(event) {
  const tappedTarget = [...targets].find(t => t.contains(event.target));
  const now = Date.now();
  const pos = getTouchPos(event);

  if (
    now - lastTapTime < 300 &&
    lastTapPos &&
    Math.abs(pos.x - lastTapPos.x) < 10 &&
    Math.abs(pos.y - lastTapPos.y) < 10 &&
    tappedTarget
  ) {
    enableSticky(pos, tappedTarget);
  }
}

function handleResize(event, target) {
  event.stopPropagation();
  isResizing = true;
  const startPos = getTouchPos(event);
  const startWidth = target.offsetWidth;
  const startHeight = target.offsetHeight;

  const resizeMove = (e) => {
    const pos = getTouchPos(e);
    let newWidth = startWidth + (pos.x - startPos.x);
    let newHeight = startHeight + (pos.y - startPos.y);

    if (newWidth < minSize) newWidth = minSize;
    if (newHeight < minSize) newHeight = minSize;

    target.style.width = `${newWidth}px`;
    target.style.height = `${newHeight}px`;
  };

  const resizeEnd = () => {
    isResizing = false;
    document.removeEventListener('touchmove', resizeMove);
    document.removeEventListener('touchend', resizeEnd);
  };

  document.addEventListener('touchmove', resizeMove);
  document.addEventListener('touchend', resizeEnd);
}

// Применяем ко всем целям
targets.forEach((target) => {
  target.addEventListener('mousedown', (e) => startDrag({ x: e.clientX, y: e.clientY }, target));
  target.addEventListener('dblclick', (e) => enableSticky({ x: e.clientX, y: e.clientY }, target));

  // Добавим уголок для изменения размера
  const resizer = document.createElement('div');
  resizer.style.position = 'absolute';
  resizer.style.right = '0';
  resizer.style.bottom = '0';
  resizer.style.width = '15px';
  resizer.style.height = '15px';
  resizer.style.background = 'gray';
  resizer.style.cursor = 'nwse-resize';
  resizer.addEventListener('touchstart', (e) => handleResize(e, target));
  target.appendChild(resizer);
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') resetPosition();
});

document.addEventListener('touchstart', handleTouchStart, { passive: false });
document.addEventListener('touchend', handleTouchEnd);