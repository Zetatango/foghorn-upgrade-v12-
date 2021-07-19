import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { UploadBankingComponent } from 'app/documents/upload-banking/upload-banking.component';
import { TranslateModule } from '@ngx-translate/core';

describe('UploadBankingComponent', () => {
  let component: UploadBankingComponent;
  let fixture: ComponentFixture<UploadBankingComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ UploadBankingComponent ],
      imports: [ TranslateModule.forRoot() ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(UploadBankingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
