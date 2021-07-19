import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ReviewGuaranteeComponent } from './review-guarantee.component';

describe('ReviewGuaranteeComponent', () => {
  let component: ReviewGuaranteeComponent;
  let fixture: ComponentFixture<ReviewGuaranteeComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ ReviewGuaranteeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReviewGuaranteeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
