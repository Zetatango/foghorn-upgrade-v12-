import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InsightsPreferencesComponent } from './insights-preferences.component';

describe('InsightsPreferencesComponent', () => {
  let component: InsightsPreferencesComponent;
  let fixture: ComponentFixture<InsightsPreferencesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ InsightsPreferencesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(InsightsPreferencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
