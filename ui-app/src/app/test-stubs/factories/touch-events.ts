const touchStartMock = new Touch({
  identifier: 123,
  pageX: 0,
  target: document,
});

const touchForwardMock = new Touch({
  identifier: 123,
  pageX: -100,
  target: document,
});

const touchBackwardMock = new Touch({
  identifier: 123,
  pageX: 100,
  target: document,
});

const touchNoActionMock = new Touch({
  identifier: 123,
  pageX: 20,
  target: document,
});


export const touchStartEvent = new TouchEvent('touchstart', {
  touches: [touchStartMock],
  view: window,
  cancelable: true,
  bubbles: true,
});


export const touchForwardEndEvent = new TouchEvent('touchend', {
  touches: [touchForwardMock],
  view: window,
  cancelable: true,
  bubbles: true,
});

export const touchBackwardEndEvent = new TouchEvent('touchend', {
  touches: [touchBackwardMock],
  view: window,
  cancelable: true,
  bubbles: true,
});


export const touchMoveForwardEvent = new TouchEvent('touchmove', {
  touches: [touchForwardMock],
  view: window,
  cancelable: true,
  bubbles: true,
});


export const touchMoveBackwardEvent = new TouchEvent('touchmove', {
  touches: [touchBackwardMock],
  view: window,
  cancelable: true,
  bubbles: true,
});

export const touchNoActionEvent = new TouchEvent('touchmove', {
  touches: [touchNoActionMock],
  view: window,
  cancelable: true,
  bubbles: true,
});


export const touchNoActionEndEvent = new TouchEvent('touchend', {
  touches: [touchNoActionMock],
  view: window,
  cancelable: true,
  bubbles: true,
});

export const touchNoTouchesStartEvent = new TouchEvent('touchstart', {
  touches: [],
  view: window,
  cancelable: true,
  bubbles: true,
});

export const touchNoTouchesEndEvent = new TouchEvent('touchend', {
  touches: [],
  view: window,
  cancelable: true,
  bubbles: true,
});
