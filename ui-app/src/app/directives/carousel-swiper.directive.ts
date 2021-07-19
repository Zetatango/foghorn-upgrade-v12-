import { Directive, ElementRef, Host, Input, OnInit, Optional, Renderer2, Self } from '@angular/core';
import { CarouselComponent } from 'ngx-bootstrap/carousel';

@Directive({
  selector: '[zttCarouselSwiper]'
})
export class CarouselSwiperDirective implements OnInit {

  @Input() swipeThreshold = 50;
  private start: number;
  private moveListener;

  constructor(
    @Host() @Self() @Optional() private carousel: CarouselComponent,
    private renderer: Renderer2,
    private element: ElementRef
  ) {
  }

  ngOnInit(): void {
    this.renderer.listen(this.element.nativeElement, 'touchstart', this.onTouchStart.bind(this));
    this.renderer.listen(this.element.nativeElement, 'touchend', this.onTouchEnd.bind(this));
  }

  onTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      this.start = e.touches[0].pageX;
      this.moveListener = this.renderer.listen(this.element.nativeElement, 'touchmove', this.onTouchMove.bind(this));
    }
  }

  onTouchMove(e: TouchEvent): void {
    const x = e.touches[0].pageX;
    const difference = this.start - x;
    if (Math.abs(difference) >= this.swipeThreshold) {
      this.cancelTouch();
      if (difference > 0 && (this.carousel.activeSlide < this.carousel.slides.length - 1)) {
        this.carousel.activeSlide = this.carousel.activeSlide + 1;
      } else if (difference < 0 && this.carousel.activeSlide > 0) {
        this.carousel.activeSlide = this.carousel.activeSlide - 1;
      }
    }
  }

  onTouchEnd(): void {
    this.cancelTouch();
  }

  cancelTouch(): void {
    if (this.moveListener) {
      this.moveListener();
      this.moveListener = undefined;
    }
    this.start = null;
  }

}
