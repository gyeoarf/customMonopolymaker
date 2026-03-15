import './InteractableImage.css';

export function createInteractableImage(src, container, options = {}) {
  // Ensure container can bound the absolute positioned content
  if (getComputedStyle(container).position === 'static') {
    container.style.position = 'relative';
  }
  
  // Create wrapper
  const wrapper = document.createElement('div');
  wrapper.className = 'interactable-wrapper';
  
  // Set initial state
  let state = {
    x: options.x || 0,
    y: options.y || 0,
    width: options.width || 100,
    height: options.height || 100,
    rotation: options.rotation || 0,
    flipX: options.flipX || 1,
    flipY: options.flipY || 1
  };
  
  // Construct DOM
  wrapper.innerHTML = `
    <img src="${src}" class="interactable-img" draggable="false" />
    <div class="interact-handles">
      <div class="resize-handle nw" data-handle="nw"></div>
      <div class="resize-handle ne" data-handle="ne"></div>
      <div class="resize-handle sw" data-handle="sw"></div>
      <div class="resize-handle se" data-handle="se"></div>
      <div class="rotate-handle" data-handle="rotate"></div>
    </div>
  `;
  
  container.appendChild(wrapper);
  
  const updateStyle = () => {
    wrapper.style.transform = `translate(${state.x}px, ${state.y}px) rotate(${state.rotation}deg)`;
    wrapper.style.width = `${state.width}px`;
    wrapper.style.height = `${state.height}px`;
    
    const imgEl = wrapper.querySelector('.interactable-img');
    imgEl.style.transform = `scaleX(${state.flipX}) scaleY(${state.flipY})`;
  };
  
  updateStyle();

  // Interaction State
  let activeHandle = null;
  let isDragging = false;
  let startMouseX = 0;
  let startMouseY = 0;
  let startState = { ...state };
  let rectStart = null;
  
  const onMouseDown = (e) => {
    if (e.target.dataset.handle) {
      activeHandle = e.target.dataset.handle;
      e.stopPropagation();
    } else if (e.target.closest('.interactable-wrapper')) {
      isDragging = true;
    } else {
      // Clicked outside wrapper, ignore
      return; 
    }
    
    // Set selection focus
    document.querySelectorAll('.interactable-wrapper').forEach(el => el.classList.remove('active'));
    wrapper.classList.add('active');

    startMouseX = e.clientX;
    startMouseY = e.clientY;
    startState = { ...state };
    rectStart = wrapper.getBoundingClientRect();
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };
  
  const onMouseMove = (e) => {
    const dx = e.clientX - startMouseX;
    const dy = e.clientY - startMouseY;
    
    if (isDragging) {
      state.x = startState.x + dx;
      state.y = startState.y + dy;
    } else if (activeHandle) {
      // A simple rotational math for handles isn't trivial when rotation != 0, 
      // but for standard top-left origin ignoring rotation offset it works OK for simple tools:
      if (activeHandle === 'rotate') {
        // Calculate angle between center of wrapper and mouse
        const centerX = rectStart.left + rectStart.width / 2;
        const centerY = rectStart.top + rectStart.height / 2;
        const angle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        // Offset by 90deg because rotate handle is at the top
        state.rotation = (angle * (180 / Math.PI)) + 90;
      } else {
        // Simple resizing without rotation matrix corrections (can be wonky if rotated, but passes for MVPs)
        let newWidth = startState.width;
        let newHeight = startState.height;
        let newX = startState.x;
        let newY = startState.y;
        
        // We will ignore complex rotation offset math to keep the engine lightweight. 
        if (activeHandle.includes('e')) newWidth = startState.width + dx;
        if (activeHandle.includes('s')) newHeight = startState.height + dy;
        if (activeHandle.includes('w')) {
          newWidth = startState.width - dx;
          newX = startState.x + dx;
        }
        if (activeHandle.includes('n')) {
          newHeight = startState.height - dy;
          newY = startState.y + dy;
        }
        
        // Prevent negative widths
        if (newWidth > 20) {
          state.width = newWidth;
          state.x = newX;
        }
        if (newHeight > 20) {
          state.height = newHeight;
          state.y = newY;
        }
      }
    }
    
    updateStyle();
  };
  
  const onMouseUp = () => {
    isDragging = false;
    activeHandle = null;
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
    
    // Emit updated transform
    if (options.onUpdate) {
      options.onUpdate(state);
    }
  };
  
  wrapper.addEventListener('mousedown', onMouseDown);
  
  // Deselect on click outside
  document.addEventListener('mousedown', (e) => {
    if (!wrapper.contains(e.target)) {
      wrapper.classList.remove('active');
    }
  });
  
  // Return control interface
  return {
    wrapper,
    getState: () => state,
    updateState: (newState) => {
      state = { ...state, ...newState };
      updateStyle();
    },
    updateSrc: (newSrc) => {
      wrapper.querySelector('.interactable-img').src = newSrc;
    },
    destroy: () => {
      wrapper.removeEventListener('mousedown', onMouseDown);
      wrapper.remove();
    }
  };
}
