import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CfaFeaturesComponent } from './cfa-features.component';
import { TranslateModule } from '@ngx-translate/core';

describe('CfaFeaturesComponent', () => {
  let component: CfaFeaturesComponent;
  let fixture: ComponentFixture<CfaFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ CfaFeaturesComponent ],
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfaFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
