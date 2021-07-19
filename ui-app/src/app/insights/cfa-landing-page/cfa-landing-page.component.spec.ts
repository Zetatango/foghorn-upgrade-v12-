import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CfaLandingPageComponent } from './cfa-landing-page.component';
import { ErrorService } from 'app/services/error.service';
import { TranslateModule } from '@ngx-translate/core';

describe('CfaLandingPageComponent', () => {
  let component: CfaLandingPageComponent;
  let fixture: ComponentFixture<CfaLandingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TranslateModule.forRoot()],
      declarations: [ CfaLandingPageComponent ],
      providers: [ErrorService]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CfaLandingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
