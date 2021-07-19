import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsErrorComponent } from './insights-error.component';
import { TranslateModule } from "@ngx-translate/core";

describe('InsightsErrorComponent', () => {
  let component: InsightsErrorComponent;
  let fixture: ComponentFixture<InsightsErrorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InsightsErrorComponent ],
      imports: [TranslateModule.forRoot()]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InsightsErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
