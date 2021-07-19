import { CarouselSwiperDirective } from './carousel-swiper.directive';
import { Component, DebugElement } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { CarouselModule } from 'ngx-bootstrap/carousel';
import {
  touchBackwardEndEvent,
  touchForwardEndEvent,
  touchNoActionEndEvent, touchNoActionEvent, touchNoTouchesEndEvent, touchNoTouchesStartEvent,
  touchStartEvent
} from 'app/test-stubs/factories/touch-events';

@Component({
  template: `<carousel
                class="carousel"
                [itemsPerSlide]="itemPerSlide"
                [showIndicators]="showIndicators"
                [isAnimated]="true"
                [startFromIndex]="startFromIndex"
                zttCarouselSwiper
                [interval]="0" #coursel>
                    <slide>1</slide>
                    <slide>2</slide>
                    <slide>3</slide>
                </carousel>`
})
class HostComponent {
  public itemPerSlide = 1;
  public showIndicators = true;
}

describe('CarouselSwiperDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let component: HostComponent;
  let des: DebugElement; // element with the directive

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [CarouselModule],
      declarations: [CarouselSwiperDirective, HostComponent],
    });

    fixture = TestBed.createComponent(HostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    des = fixture.debugElement.query(By.directive(CarouselSwiperDirective));
  });

  it('should initialize component', () => {
    expect(component).toBeTruthy();
  });

  it('should have one active slide', () => {
    const slideElements: DebugElement [] = des.queryAll(By.css('slide'));
    expect(slideElements.length).toBe(3);
    expect(slideElements[0].classes['active']).toBeTrue();
  });

  describe('onTouchStart', () => {
    it('should not initialize stillMoving', () => {
      des.triggerEventHandler('touchstart', touchNoTouchesStartEvent);
      des.triggerEventHandler('touchend', touchNoTouchesEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[0].classes['active']).toBeTrue();
    });

    it('should set stillMoving false', () => {
      // next
      des.triggerEventHandler('touchstart', touchStartEvent);
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);

      des.triggerEventHandler('touchstart', touchNoTouchesStartEvent);
      des.triggerEventHandler('touchmove', touchForwardEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[1].classes['active']).toBeTrue();
    });
  });


  describe('onTouchMove', () => {

    beforeEach(() => {
      des.triggerEventHandler('touchstart', touchStartEvent);
    });

    it('should slide forward by one', () => {
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[1].classes['active']).toBeTrue();
    });


    it('should not change carousel when touch move is less than swipeThreshold(50)', () => {
      des.triggerEventHandler('touchmove', touchNoActionEvent);
      des.triggerEventHandler('touchend', touchNoActionEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[0].classes['active']).toBeTrue();
    });

    it('should not change the slide when activeSlide is 0', () => {
      des.triggerEventHandler('touchmove', touchBackwardEndEvent);
      des.triggerEventHandler('touchend', touchBackwardEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[0].classes['active']).toBeTrue();
    });

    it('should not change the slide when activeSlide is 2 and slide to next', () => {
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);
      // next
      des.triggerEventHandler('touchstart', touchStartEvent);
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);
      // next
      des.triggerEventHandler('touchstart', touchStartEvent);
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[2].classes['active']).toBeTrue();
    });

    it('should change the slide backward by one', () => {
      // slide twice next and prev once
      // next
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);
      // next
      des.triggerEventHandler('touchstart', touchStartEvent);
      des.triggerEventHandler('touchmove', touchForwardEndEvent);
      des.triggerEventHandler('touchend', touchForwardEndEvent);
      // prev
      des.triggerEventHandler('touchstart', touchStartEvent);
      des.triggerEventHandler('touchmove', touchBackwardEndEvent);
      des.triggerEventHandler('touchend', touchBackwardEndEvent);

      fixture.detectChanges();

      const slides = des.queryAll(By.css('slide'));
      expect(slides[1].classes['active']).toBeTrue();
    });

  });

});
