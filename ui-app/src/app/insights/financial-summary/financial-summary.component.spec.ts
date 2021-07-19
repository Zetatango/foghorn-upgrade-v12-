import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FinancialSummaryComponent } from './financial-summary.component';

describe('FinancialSummaryComponent', () => {
  let component: FinancialSummaryComponent;
  let fixture: ComponentFixture<FinancialSummaryComponent>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      declarations: [FinancialSummaryComponent],
      imports: [],
      providers: []
    });
    fixture = TestBed.createComponent(FinancialSummaryComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set isMobile to false', () => {
      spyOnProperty(window, 'innerWidth').and.returnValue(1024);
      window.dispatchEvent(new Event('resize'));

      component.ngOnInit();

      expect(component.isMobile).toBeFalse();
    });
  });

  describe('setIsMobile', () => {
    it('should change value of isMobile', () => {
      component.isMobile = false;
      spyOnProperty(window, 'innerWidth').and.returnValue(568);
      window.dispatchEvent(new Event('resize'));

      component.setIsMobile();
      expect(component.isMobile).toBeTruthy();
    });
  });
});
